import { promises as fs, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  HUB_FOLDER,
  LAYOUT_DIRS,
  SETS_FILE,
  SETS_FOLDER,
  SET_DIRS,
  SET_ID,
  ProjectLayout as ProjectLayoutSchema,
  projectLayoutSync,
  type ProjectLayout,
} from './classify.js';

/**
 * Recording sets (v0.38.0): one project holds several sets of takes instead of faking videos as chapters.
 *
 * ```
 * <project>/hub/sets.json                    order, display title, role per set
 * <project>/hub/sets/<set>/recordings/       NN-S-name.mov|.mp4 (chapter NN restarts at 01 per set)
 * <project>/hub/sets/<set>/transcripts/
 * ```
 * A project has sets when `hub/sets/` is a folder. A project without it is a single-set project read exactly as before
 * (`projectLayoutPaths`), and `listSets` reports it as one implicit set flagged `legacy`. Nothing here moves a file.
 */

export const SetRole = z.enum(['video', 'part']);
export type SetRole = z.infer<typeof SetRole>;

export const SetId = z
  .string()
  .regex(SET_ID, 'set id must be kebab-case (a-z, 0-9, single hyphens)');

/** One entry of `hub/sets.json`. `id` is the folder name; the array order is the set order. */
export const SetEntry = z.object({
  id: SetId,
  title: z.string().min(1),
  /** `video`: the set is its own video. `part`: it is one part of a video made from several sets. */
  role: SetRole,
});
export type SetEntry = z.infer<typeof SetEntry>;

export const SetsFile = z.object({ sets: z.array(SetEntry) });
export type SetsFile = z.infer<typeof SetsFile>;

export const ProjectSet = z.object({
  /** The folder name; `null` for the one implicit set of a project without sets. */
  id: SetId.nullable(),
  title: z.string(),
  role: SetRole,
  /** True for the implicit set of a project without `hub/sets/`: its folders are the project's own. */
  legacy: z.boolean(),
  /** False when the folder exists but `sets.json` does not name it (shown after the listed sets, titled by id). */
  listed: z.boolean(),
  /** Absolute recordings folder (it may not exist yet). */
  recordings: z.string(),
  /** Absolute transcripts folder (it may not exist yet). */
  transcripts: z.string(),
});
export type ProjectSet = z.infer<typeof ProjectSet>;

/** `<project>/hub/sets` */
export function setsDir(projectDir: string): string {
  return path.join(projectDir, HUB_FOLDER, SETS_FOLDER);
}

/** `<project>/hub/sets.json` */
export function setsFilePath(projectDir: string): string {
  return path.join(projectDir, HUB_FOLDER, SETS_FILE);
}

/** The folders of one set. Pure; they may not exist. Throws on an id that is not kebab-case, so no path escapes. */
export function setPaths(
  projectDir: string,
  setId: string,
): { dir: string; recordings: string; transcripts: string } {
  if (!SET_ID.test(setId)) throw new Error(`set id must be kebab-case: ${setId}`);
  const dir = path.join(setsDir(projectDir), setId);
  return {
    dir,
    recordings: path.join(dir, SET_DIRS.recordings),
    transcripts: path.join(dir, SET_DIRS.transcripts),
  };
}

function isDirSync(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** True when the project keeps its takes in sets (`hub/sets/` is a folder). Never throws. */
export function hasSetsSync(projectDir: string): boolean {
  return isDirSync(setsDir(projectDir));
}

export async function hasSets(projectDir: string): Promise<boolean> {
  return fs.stat(setsDir(projectDir)).then(
    (s) => s.isDirectory(),
    () => false,
  );
}

/**
 * Read `hub/sets.json`. Missing → `{ sets: [] }`. An entry that does not parse, or repeats an id, is dropped rather
 * than failing the whole file, so one bad line never hides every set. Never throws.
 */
export function readSetsFileSync(projectDir: string): SetsFile {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(setsFilePath(projectDir), 'utf-8'));
  } catch {
    return { sets: [] };
  }
  const list = (raw as { sets?: unknown } | null)?.sets;
  if (!Array.isArray(list)) return { sets: [] };
  const seen = new Set<string>();
  const sets: SetEntry[] = [];
  for (const item of list) {
    const parsed = SetEntry.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    sets.push(parsed.data);
  }
  return { sets };
}

function legacySet(projectDir: string, layout: ProjectLayout): ProjectSet {
  const dirs = LAYOUT_DIRS[layout];
  return {
    id: null,
    title: '',
    role: 'video',
    legacy: true,
    listed: false,
    recordings: path.join(projectDir, dirs.recordings),
    transcripts: path.join(projectDir, dirs.transcripts),
  };
}

/**
 * The sets of one project, in order. A project without `hub/sets/` → one implicit set (`id: null, legacy: true`) whose
 * folders are `projectLayoutPathsSync`'s. A project with sets → the `sets.json` entries in order (a listed set whose
 * folder is missing is still listed: it was just created, or its media is held elsewhere), then any set folder the file
 * does not name, by name. Never throws.
 */
export function listSetsSync(projectDir: string): ProjectSet[] {
  if (!hasSetsSync(projectDir)) return [legacySet(projectDir, projectLayoutSync(projectDir))];
  const { sets: entries } = readSetsFileSync(projectDir);
  const listedIds = new Set(entries.map((e) => e.id));
  let folders: string[];
  try {
    folders = readdirSync(setsDir(projectDir), { withFileTypes: true })
      .filter((d) => d.isDirectory() && SET_ID.test(d.name) && !listedIds.has(d.name))
      .map((d) => d.name)
      .sort();
  } catch {
    folders = [];
  }
  const toSet = (id: string, title: string, role: SetRole, listed: boolean): ProjectSet => {
    const p = setPaths(projectDir, id);
    return {
      id,
      title,
      role,
      legacy: false,
      listed,
      recordings: p.recordings,
      transcripts: p.transcripts,
    };
  };
  return [
    ...entries.map((e) => toSet(e.id, e.title, e.role, true)),
    ...folders.map((id) => toSet(id, id, 'video', false)),
  ];
}

/** `listSetsSync`, for callers that can await. Same rule, same result. */
export async function listSets(projectDir: string): Promise<ProjectSet[]> {
  return listSetsSync(projectDir);
}

/**
 * Add a set to a project that already has sets: creates `hub/sets/<id>/{recordings,transcripts}/` and appends the
 * entry to `sets.json`. Refuses (throws) when the project has no `hub/sets/` (moving a project into sets is a migration,
 * not this), when the id is not kebab-case, or when the id is already a set. The returned list is the new order.
 */
export async function addSet(
  projectDir: string,
  entry: { id: string; title?: string; role?: SetRole },
): Promise<ProjectSet[]> {
  if (!(await hasSets(projectDir)))
    throw new Error('this project has no recording sets; moving it into sets is a migration');
  const parsed = SetEntry.parse({
    id: entry.id,
    title: entry.title?.trim() || entry.id,
    role: entry.role ?? 'video',
  });
  if (listSetsSync(projectDir).some((s) => s.id === parsed.id))
    throw new Error(`set already exists: ${parsed.id}`);
  const p = setPaths(projectDir, parsed.id);
  await fs.mkdir(p.recordings, { recursive: true });
  await fs.mkdir(p.transcripts, { recursive: true });
  const file = readSetsFileSync(projectDir);
  // Keep a folder that was on disk but unlisted in its place: list every existing set before the new one.
  const known = new Set(file.sets.map((s) => s.id));
  const unlisted = listSetsSync(projectDir).filter(
    (s) => !s.legacy && s.id !== null && !known.has(s.id) && s.id !== parsed.id,
  );
  const next: SetsFile = {
    sets: [
      ...file.sets,
      ...unlisted.map((s) => ({ id: s.id as string, title: s.title, role: s.role })),
      parsed,
    ],
  };
  const target = setsFilePath(projectDir);
  const tmp = `${target}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
  await fs.rename(tmp, target);
  return listSetsSync(projectDir);
}

export const MediaLocation = z.object({
  /** The project folder (never `<project>/hub`, never a set folder). */
  projectDir: z.string(),
  /** The set the file is in; `null` in a project without sets. */
  set: SetId.nullable(),
  layout: ProjectLayoutSchema,
});
export type MediaLocation = z.infer<typeof MediaLocation>;

const RECORDING_FOLDERS = new Set(['recordings']);
const TRANSCRIPT_FOLDERS = new Set(['transcripts', 'recording-transcripts']);

function locate(filePath: string, folders: Set<string>): MediaLocation | null {
  let dir = path.dirname(filePath);
  // `-safe/`, `-chapters/` (recordings); `engines/` (FliTools' per-engine transcript copies).
  const sub = path.basename(dir);
  if (sub.startsWith('-') || sub === 'engines') dir = path.dirname(dir);
  if (!folders.has(path.basename(dir))) return null;
  const parent = path.dirname(dir);
  const grand = path.dirname(parent);
  // <project>/hub/sets/<set>/<folder>
  if (
    SET_ID.test(path.basename(parent)) &&
    path.basename(grand) === SETS_FOLDER &&
    path.basename(path.dirname(grand)) === HUB_FOLDER
  ) {
    return {
      projectDir: path.dirname(path.dirname(grand)),
      set: path.basename(parent),
      layout: 'hub',
    };
  }
  // <project>/hub/<folder>
  if (path.basename(parent) === HUB_FOLDER) return { projectDir: grand, set: null, layout: 'hub' };
  // <project>/<folder>
  return { projectDir: parent, set: null, layout: 'legacy' };
}

/**
 * Where a recording lives, from its path: the real project folder and the set, for every layout and the `-safe/` /
 * `-chapters/` subfolders. Pure. `null` when the path is not inside a recordings folder, so a caller never guesses.
 */
export function recordingLocation(recordingPath: string): MediaLocation | null {
  return locate(recordingPath, RECORDING_FOLDERS);
}

/** The same for a transcript (`transcripts/`, `recording-transcripts/`, and FliTools' `engines/` inside them). */
export function transcriptLocation(transcriptPath: string): MediaLocation | null {
  return locate(transcriptPath, TRANSCRIPT_FOLDERS);
}

/** `recordingLocation(p)?.projectDir ?? null`. */
export function projectDirFromRecordingPath(recordingPath: string): string | null {
  return recordingLocation(recordingPath)?.projectDir ?? null;
}
