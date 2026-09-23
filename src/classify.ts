import { promises as fs, statSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { IDENTITY_FILE, parseAppFile } from './app-file.js';

/**
 * Which zone of the project layout (spec §3, roadmap §1) a path inside a project belongs to.
 * `classifyProjectEntry` is pure: the path string alone, plus an optional directory hint. `projectLayoutPaths` is the
 * one function here that looks at the disk, to tell the hub layout from the legacy one.
 */
export const ProjectZone = z.enum([
  'identity',
  'app-decisions',
  'recordings',
  'transcripts',
  'cast',
  'videos',
  'legacy',
  'other',
]);
export type ProjectZone = z.infer<typeof ProjectZone>;

const ZONE_FOLDERS: Record<string, ProjectZone> = {
  recordings: 'recordings',
  transcripts: 'transcripts',
  'recording-transcripts': 'transcripts', // legacy name, still read (D7)
  cast: 'cast',
  videos: 'videos',
};

/** Top-level folders from layouts older than the 09-09 ruling (A8). Read-only, never migrated. */
export const LEGACY_FOLDERS: readonly string[] = [
  'first-edit',
  'edits',
  'edit-1st',
  'final',
  'pipeline',
  'animation',
];

/**
 * @param relPath path relative to the project folder, `/`-separated (`videos/01-xmen/01-cut.mp4`). A trailing `/`
 *   also marks a directory.
 * @param isDirectory whether the entry is a directory, when the caller knows.
 */
export function classifyProjectEntry(relPath: string, isDirectory?: boolean): ProjectZone {
  const trailingSlash = /[/\\]$/.test(relPath);
  const segments = relPath.split(/[/\\]+/).filter((segment) => segment !== '' && segment !== '.');
  if (segments.length === 0 || segments.includes('..') || /^[/\\]/.test(relPath)) return 'other';

  const top = segments[0] as string;
  const nested = segments.length > 1;
  const directory = isDirectory ?? (trailingSlash ? true : undefined);

  if (!nested && directory !== true) {
    if (top === IDENTITY_FILE) return 'identity';
    if (parseAppFile(top) !== null) return 'app-decisions';
  }

  // A top-level *file* named like a zone folder is not that zone.
  const topIsFile = !nested && directory === false;

  if (top.startsWith('-') || LEGACY_FOLDERS.includes(top)) return topIsFile ? 'other' : 'legacy';

  // The hub layout (new projects): FliHub's two folders live under `hub/`, mirroring FliCast's `cast/`. The `hub/`
  // container itself, and anything else under it, is not a zone.
  if (top === HUB_FOLDER) {
    if (topIsFile || !nested) return 'other';
    const inner = HUB_ZONES[segments[1] as string];
    if (inner === undefined) return 'other';
    if (segments.length === 2 && directory === false) return 'other';
    if (inner === 'recordings' && segments[2] === '-chapters') return 'legacy';
    return inner;
  }

  const zone = ZONE_FOLDERS[top];
  if (zone === undefined || topIsFile) return 'other';

  // Chapter previews are deprecated (D8); FliHub's live `-safe/` and `-trash/` stay recordings.
  if (zone === 'recordings' && segments[1] === '-chapters') return 'legacy';
  return zone;
}

/** The folder that holds FliHub's zones in the hub layout. */
export const HUB_FOLDER = 'hub';

const HUB_ZONES: Record<string, ProjectZone> = {
  recordings: 'recordings',
  transcripts: 'transcripts',
};

export const ProjectLayout = z.enum(['hub', 'legacy']);
export type ProjectLayout = z.infer<typeof ProjectLayout>;

export const ProjectLayoutPaths = z.object({
  /** Detected by `projectLayout` (D14). */
  layout: ProjectLayout,
  /** Absolute path of the recordings folder for this layout (it may not exist yet). */
  recordings: z.string(),
  /** Absolute path of the transcripts folder for this layout (it may not exist yet). */
  transcripts: z.string(),
});
export type ProjectLayoutPaths = z.infer<typeof ProjectLayoutPaths>;

/** Where FliHub's two folders are in each layout, relative to the project (FliHub `shared/paths.ts` LAYOUT_DIRS). */
export const LAYOUT_DIRS: Readonly<
  Record<ProjectLayout, { recordings: string; transcripts: string }>
> = {
  hub: { recordings: 'hub/recordings', transcripts: 'hub/transcripts' },
  legacy: { recordings: 'recordings', transcripts: 'recording-transcripts' },
};

async function isDirectory(p: string): Promise<boolean> {
  return fs.stat(p).then(
    (stat) => stat.isDirectory(),
    () => false,
  );
}

/**
 * Top-level folders that show a project already holds legacy-layout recordings: the recordings themselves, or their
 * transcripts — media is not in git, so on another machine a legacy project may have only its transcripts.
 */
const LEGACY_EVIDENCE = [
  LAYOUT_DIRS.legacy.recordings,
  LAYOUT_DIRS.legacy.transcripts,
  'transcripts',
];

/**
 * Which layout one project uses (D14). Self-healing (David 2026-09-23, option A): a project with no recordings anywhere
 * is `hub`, so a new or empty project needs no marker folder and FliHub writes `hub/recordings/` on the first take.
 *   1. `hub/recordings/` exists                                          → `hub`
 *   2. a top-level `recordings/`, `recording-transcripts/` or `transcripts/` → `legacy` (a stray `hub/` never hides them)
 *   3. anything else (new, empty, a missing folder, a hub project whose media is held elsewhere) → `hub`
 * The two layouts are never merged. Never throws.
 */
export async function projectLayout(projectDir: string): Promise<ProjectLayout> {
  if (await isDirectory(path.join(projectDir, LAYOUT_DIRS.hub.recordings))) return 'hub';
  for (const dir of LEGACY_EVIDENCE)
    if (await isDirectory(path.join(projectDir, dir))) return 'legacy';
  return 'hub';
}

/**
 * Absolute recordings and transcripts folders for one project: `hub/recordings/` + `hub/transcripts/`, or the legacy
 * top-level `recordings/` + `recording-transcripts/` (the name FliHub writes; a reader may also look for the D7 name
 * `transcripts/` in a legacy project). The folders may not exist yet.
 */
export async function projectLayoutPaths(projectDir: string): Promise<ProjectLayoutPaths> {
  const layout = await projectLayout(projectDir);
  const dirs = LAYOUT_DIRS[layout];
  return {
    layout,
    recordings: path.join(projectDir, dirs.recordings),
    transcripts: path.join(projectDir, dirs.transcripts),
  };
}

function isDirectorySync(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** `projectLayout`, synchronously — for callers that cannot await (FliHub's `getProjectPaths`). Same rule. */
export function projectLayoutSync(projectDir: string): ProjectLayout {
  if (isDirectorySync(path.join(projectDir, LAYOUT_DIRS.hub.recordings))) return 'hub';
  for (const dir of LEGACY_EVIDENCE)
    if (isDirectorySync(path.join(projectDir, dir))) return 'legacy';
  return 'hub';
}

/** `projectLayoutPaths`, synchronously. Same rule, same paths. */
export function projectLayoutPathsSync(projectDir: string): ProjectLayoutPaths {
  const layout = projectLayoutSync(projectDir);
  const dirs = LAYOUT_DIRS[layout];
  return {
    layout,
    recordings: path.join(projectDir, dirs.recordings),
    transcripts: path.join(projectDir, dirs.transcripts),
  };
}
