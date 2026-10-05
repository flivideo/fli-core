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
  /** Source recordings from FliCast; a tier-1 input, not "other" (workstream B ruling, 2026-10-05). */
  'voice',
  'avatar',
  'script',
  /** Motion-scene source (R1): `motion/<tool>/`. Machinery inside it is regenerable (`motionMachinery`). */
  'motion',
  /** Overlay recipes (plan §3, B ruling): `overlay/<chapter>/beats.json` + `overlay/<chapter>/<variant>/spec.json`. */
  'overlay',
  /** Per-video geometry, confirmed by a person (B ruling): tier 1, authored. */
  'framing',
  /** FliCut's in-project folder (`first-edit/` on disk today, `edit/` reserved); its `work/` is regenerable. */
  'assembly',
  /** A project's top-level `-renders/` (R2): the cache, ignored by git, cleared on request like `-trash/`. */
  'renders',
  'videos',
  'legacy',
  /** A project's top-level `-trash/` (FliHub's delete target): always shown with its size, emptied on request (David 2026-09-23). */
  'trash',
  'other',
]);
/** FliHub moves deleted takes here (`getProjectPaths().trash`); a zone of its own, not legacy. */
export const TRASH_FOLDER = '-trash';
/** Renders live in the project, like trash (R2, David 2026-10-05): `<project>/-renders/<tool>/`. A cache. */
export const RENDERS_FOLDER = '-renders';
export type ProjectZone = z.infer<typeof ProjectZone>;

const ZONE_FOLDERS: Record<string, ProjectZone> = {
  recordings: 'recordings',
  transcripts: 'transcripts',
  'recording-transcripts': 'transcripts', // legacy name, still read (D7)
  cast: 'cast',
  voice: 'voice',
  avatar: 'avatar',
  script: 'script',
  motion: 'motion',
  overlay: 'overlay',
  framing: 'framing',
  videos: 'videos',
};

/**
 * FliCut's in-project folder (B ruling 2026-10-05). `first-edit/` is what is on disk (FliCut's `projectsRoot`, e.g.
 * `v-kybernesis/a01-…/first-edit/NN-slug/{project.json,viewState.json,work/,exports/}`); `edit/` is reserved for its
 * rename. FliCut's files are not moved and FliCut is not changed: this only names the folder. `first-edit` stays in
 * `LEGACY_FOLDERS` so it is still never a video name.
 */
export const ASSEMBLY_FOLDERS: readonly string[] = ['first-edit', 'edit'];

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

  if (top === TRASH_FOLDER) return topIsFile ? 'other' : 'trash';
  if (top === RENDERS_FOLDER) return topIsFile ? 'other' : 'renders';
  if (ASSEMBLY_FOLDERS.includes(top)) return topIsFile ? 'other' : 'assembly';
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

/** Folders inside `motion/**` that are machinery, not source: regenerable, never in git (gitignore `TIER-CACHE`). */
export const MOTION_MACHINERY: readonly string[] = [
  'out',
  '.cache',
  '.transcode-cache',
  'dist',
  'build',
  'node_modules',
];

/**
 * How much a path matters (the plan §1.1 tier test: "if you deleted it, could you get it back by re-running a tool?"):
 * `authored` and `input` are tier 1 (the edit, the script, paid inputs: no), `generated` can be rebuilt from tier 1 but
 * belongs to a recipe, `regenerable` is cache (`-renders/`, `-trash/`, `work/`, motion machinery), `output` is a video.
 */
export const ProjectTier = z.enum([
  'authored',
  'input',
  'generated',
  'regenerable',
  'output',
  'other',
]);
export type ProjectTier = z.infer<typeof ProjectTier>;

/** What a file under `overlay/` is (B ruling): `beats.json` and `framing.json` are authored, `spec.json` is generated. */
export const OverlayRole = z.enum(['beats', 'framing', 'spec', 'variant-file']);
export type OverlayRole = z.infer<typeof OverlayRole>;

export const ProjectEntry = z.object({
  zone: ProjectZone,
  tier: ProjectTier,
  /** `overlay/<chapter>/…` only; null for a flat overlay (`ships` = one video) and for every other zone. */
  chapter: z.string().nullable(),
  /** `overlay/[<chapter>/]<variant>/…` only. */
  variant: z.string().nullable(),
  role: OverlayRole.nullable(),
});
export type ProjectEntry = z.infer<typeof ProjectEntry>;

const OVERLAY_AUTHORED_FILES: Record<string, OverlayRole> = {
  'beats.json': 'beats',
  'framing.json': 'framing',
};

function overlayEntry(rest: string[], directory: boolean | undefined): Omit<ProjectEntry, 'zone'> {
  const file = directory !== true ? rest[rest.length - 1] : undefined;
  // `overlay/beats.json` (flat, `ships` = one video) or `overlay/<chapter>/beats.json`.
  const authored = file === undefined ? undefined : OVERLAY_AUTHORED_FILES[file];
  if (authored !== undefined && rest.length <= 2) {
    const chapter = rest.length === 2 ? (rest[0] as string) : null;
    return { tier: 'authored', chapter, variant: null, role: authored };
  }
  // `overlay/<variant>/spec.json` (flat) or `overlay/<chapter>/<variant>/spec.json`. Only these two shapes name their
  // chapter and variant outright; anything deeper is the variant's own files, whose owner a path alone cannot tell.
  if (file === 'spec.json' && (rest.length === 2 || rest.length === 3)) {
    const chapter = rest.length === 3 ? (rest[0] as string) : null;
    return { tier: 'generated', chapter, variant: rest[rest.length - 2] as string, role: 'spec' };
  }
  return { tier: 'generated', chapter: null, variant: null, role: 'variant-file' };
}

function tierOf(
  zone: ProjectZone,
  segments: string[],
  directory: boolean | undefined,
): Omit<ProjectEntry, 'zone'> {
  const none = { chapter: null, variant: null, role: null };
  switch (zone) {
    case 'identity':
    case 'app-decisions':
    case 'script':
    case 'framing':
      return { tier: 'authored', ...none };
    case 'recordings':
    case 'transcripts':
    case 'cast':
    case 'voice':
    case 'avatar':
      return { tier: 'input', ...none };
    case 'videos':
      return { tier: 'output', ...none };
    case 'trash':
    case 'renders':
      return { tier: 'regenerable', ...none };
    case 'motion':
      return {
        tier: segments.slice(1).some((s) => MOTION_MACHINERY.includes(s))
          ? 'regenerable'
          : 'authored',
        ...none,
      };
    case 'overlay':
      return overlayEntry(segments.slice(1), directory);
    case 'assembly': {
      const inner = segments.slice(1);
      if (inner.includes('work')) return { tier: 'regenerable', ...none };
      if (inner.includes('exports')) return { tier: 'output', ...none };
      return { tier: 'authored', ...none };
    }
    default:
      return { tier: 'other', ...none };
  }
}

/**
 * `classifyProjectEntry` plus how much the path matters and, under `overlay/`, which chapter, variant and role it is.
 * Pure. `overlay/kybernesis-ch01/beats.json` is `authored`; `overlay/ch01/v5-frame/spec.json` is `generated`.
 */
export function describeProjectEntry(relPath: string, isDirectory?: boolean): ProjectEntry {
  const zone = classifyProjectEntry(relPath, isDirectory);
  const segments = relPath.split(/[/\\]+/).filter((segment) => segment !== '' && segment !== '.');
  const directory = isDirectory ?? (/[/\\]$/.test(relPath) ? true : undefined);
  return { zone, ...tierOf(zone, segments, directory) };
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
