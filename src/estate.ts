import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';
import { errorCode, errorMessage } from './fs-utils.js';
import { z } from 'zod';
import { ProjectIdentity, readIdentity } from './identity.js';
import { ProjectCode, ProjectFolder, parseProjectFolder } from './project-folder.js';
import { InvalidFile } from './results.js';

/**
 * The estate of one brand root (spec R8–R15, R31): which folders are projects, which are not, what is archived, how a
 * project is addressed, and which code comes next.
 */

export const ARCHIVED_FOLDER = 'archived';

/** A collection that was read, or one that could not be (R12): empty and unscanned are never the same thing. */
export function scanned<S extends z.ZodType>(item: S) {
  return z.discriminatedUnion('state', [
    z.object({ state: z.literal('scanned'), scannedAt: z.iso.datetime(), items: z.array(item) }),
    z.object({
      state: z.literal('unscanned'),
      scannedAt: z.iso.datetime(),
      path: z.string(),
      message: z.string(),
    }),
  ]);
}
export type Scanned<T> = z.infer<ReturnType<typeof scanned<z.ZodType<T>>>>;

/** A folder holding a valid `fli.studio.json` (R8). */
export const MemberProject = z.object({
  folder: z.string(),
  path: z.string(),
  /** The folder name parsed as `<code>-<slug>`, or `null` when it does not follow that shape. */
  parsed: ProjectFolder.nullable(),
  identity: ProjectIdentity,
});
export type MemberProject = z.infer<typeof MemberProject>;

/** Any other top-level folder (R9): shown as *other folder*, never as an error. */
export const OtherFolder = z.object({
  folder: z.string(),
  path: z.string(),
  /** Named like a project (`d02-cutty-audio-cleanup`) rather than a plain folder (`docs`). */
  looksLikeProject: z.boolean(),
  parsed: ProjectFolder.nullable(),
  /** `absent`, or the `invalid` result when a `fli.studio.json` is there but not valid. */
  identity: z.union([z.literal('absent'), InvalidFile]),
});
export type OtherFolder = z.infer<typeof OtherFolder>;

/** One folder directly under `<brandRoot>/archived/` (R13: listed, never descended into). */
export const ArchivedEntry = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('range'),
    name: z.string(),
    letter: z.string().regex(/^[a-z]$/),
    from: z.number().int().min(0).max(99),
    to: z.number().int().min(0).max(99),
  }),
  z.object({ kind: z.literal('project'), name: z.string(), code: ProjectCode, slug: z.string() }),
  z.object({ kind: z.literal('other'), name: z.string() }),
]);
export type ArchivedEntry = z.infer<typeof ArchivedEntry>;

export const ProjectListing = z.object({
  brandRoot: z.string(),
  scannedAt: z.iso.datetime(),
  members: scanned(MemberProject),
  otherFolders: scanned(OtherFolder),
  archived: scanned(ArchivedEntry),
});
export type ProjectListing = z.infer<typeof ProjectListing>;

const RANGE = /^([a-z])(\d{2})-([a-z])(\d{2})$/;

function parseRange(name: string): { letter: string; from: number; to: number } | null {
  const match = RANGE.exec(name);
  if (!match || match[1] !== match[3]) return null;
  const from = Number(match[2]);
  const to = Number(match[4]);
  if (from > to) return null;
  return { letter: match[1] as string, from, to };
}

async function isDirectory(parent: string, entry: Dirent): Promise<boolean> {
  if (entry.isDirectory()) return true;
  if (!entry.isSymbolicLink()) return false;
  try {
    return (await fs.stat(path.join(parent, entry.name))).isDirectory();
  } catch {
    return false;
  }
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (await isDirectory(dir, entry)) names.push(entry.name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}

function classifyArchived(name: string): ArchivedEntry {
  const range = parseRange(name);
  if (range) return { kind: 'range', name, ...range };
  const parsed = parseProjectFolder(name);
  if (parsed) return { kind: 'project', name, code: parsed.code, slug: parsed.slug };
  return { kind: 'other', name };
}

async function scanArchived(brandRoot: string, scannedAt: string): Promise<Scanned<ArchivedEntry>> {
  const dir = path.join(brandRoot, ARCHIVED_FOLDER);
  try {
    const names = await listDirectories(dir);
    return {
      state: 'scanned',
      scannedAt,
      items: names.filter((n) => !n.startsWith('.')).map(classifyArchived),
    };
  } catch (error) {
    // No `archived/` folder means nothing is archived: a real, empty answer (R11).
    if (errorCode(error) === 'ENOENT') return { state: 'scanned', scannedAt, items: [] };
    return { state: 'unscanned', scannedAt, path: dir, message: errorMessage(error) };
  }
}

/**
 * List a brand root: members (valid `fli.studio.json`, R8), other top-level folders (R9, excluding `archived/` and
 * names starting `.` or `-`), and the archive one level deep (R13). Every collection carries a scan stamp; a folder
 * that cannot be read is `unscanned`, never empty (R12). Never throws.
 */
export async function listProjects(brandRoot: string): Promise<ProjectListing> {
  const scannedAt = new Date().toISOString();

  let folders: string[];
  try {
    folders = await listDirectories(brandRoot);
  } catch (error) {
    // An unreadable root leaves every collection unscanned, the archive included (R12): an unmounted drive must never
    // read as "0 archived".
    const unscanned = {
      state: 'unscanned',
      scannedAt,
      path: brandRoot,
      message: errorMessage(error),
    } as const;
    return {
      brandRoot,
      scannedAt,
      members: unscanned,
      otherFolders: unscanned,
      archived: unscanned,
    };
  }

  const archived = await scanArchived(brandRoot, scannedAt);

  const members: MemberProject[] = [];
  const otherFolders: OtherFolder[] = [];
  for (const folder of folders) {
    if (folder === ARCHIVED_FOLDER || folder.startsWith('.') || folder.startsWith('-')) continue;
    const dir = path.join(brandRoot, folder);
    const parsed = parseProjectFolder(folder);
    const identity = await readIdentity(dir);
    if (identity?.kind === 'valid') {
      members.push({ folder, path: dir, parsed, identity: identity.value });
    } else {
      otherFolders.push({
        folder,
        path: dir,
        looksLikeProject: parsed !== null,
        parsed,
        identity: identity ?? 'absent',
      });
    }
  }

  return {
    brandRoot,
    scannedAt,
    members: { state: 'scanned', scannedAt, items: members },
    otherFolders: { state: 'scanned', scannedAt, items: otherFolders },
    archived,
  };
}

const ProjectFound = z.object({
  kind: z.literal('found'),
  ref: z.string(),
  matchedBy: z.enum(['folder', 'id', 'code']),
  project: MemberProject,
});
const ProjectAmbiguous = z.object({
  kind: z.literal('ambiguous'),
  ref: z.string(),
  matchedBy: z.enum(['id', 'code']),
  candidates: z.array(MemberProject),
});
const ProjectNotAProject = z.object({
  kind: z.literal('not-a-project'),
  ref: z.string(),
  folder: OtherFolder,
});
const ProjectNotFound = z.object({ kind: z.literal('not-found'), ref: z.string() });
const ProjectUnscanned = z.object({
  kind: z.literal('unscanned'),
  ref: z.string(),
  path: z.string(),
  message: z.string(),
});

/** Every `resolveProject` outcome except `found`: why a reference did not resolve (R31, C3). */
export const ProjectRefusal = z.discriminatedUnion('kind', [
  ProjectAmbiguous,
  ProjectNotAProject,
  ProjectNotFound,
  ProjectUnscanned,
]);
export type ProjectRefusal = z.infer<typeof ProjectRefusal>;

export const ResolveProjectResult = z.discriminatedUnion('kind', [
  ProjectFound,
  ProjectAmbiguous,
  ProjectNotAProject,
  ProjectNotFound,
  ProjectUnscanned,
]);
export type ResolveProjectResult = z.infer<typeof ResolveProjectResult>;

/**
 * Resolve a project reference within a brand (R31): an exact folder name, an identity `id`, or a whole code (`a01`)
 * matched on the folder's code segment. Two or more matches → `ambiguous` with the candidates; a prefix that is not a
 * whole code is not a match. Never throws for "not found".
 */
export async function resolveProject(
  brandRootOrListing: string | ProjectListing,
  ref: string,
): Promise<ResolveProjectResult> {
  const listing =
    typeof brandRootOrListing === 'string'
      ? await listProjects(brandRootOrListing)
      : brandRootOrListing;
  const { members, otherFolders } = listing;
  if (members.state === 'unscanned') {
    return { kind: 'unscanned', ref, path: members.path, message: members.message };
  }

  const byFolder = members.items.find((member) => member.folder === ref);
  if (byFolder) return { kind: 'found', ref, matchedBy: 'folder', project: byFolder };

  const byId = members.items.filter((member) => member.identity.id === ref);
  if (byId.length === 1)
    return { kind: 'found', ref, matchedBy: 'id', project: byId[0] as MemberProject };
  if (byId.length > 1) return { kind: 'ambiguous', ref, matchedBy: 'id', candidates: byId };

  if (/^[a-z]\d{2}$/.test(ref)) {
    const byCode = members.items.filter((member) => member.parsed?.code === ref);
    if (byCode.length === 1)
      return { kind: 'found', ref, matchedBy: 'code', project: byCode[0] as MemberProject };
    if (byCode.length > 1) return { kind: 'ambiguous', ref, matchedBy: 'code', candidates: byCode };
  }

  if (otherFolders.state === 'scanned') {
    const other = otherFolders.items.find((folder) => folder.folder === ref);
    if (other) return { kind: 'not-a-project', ref, folder: other };
  }
  return { kind: 'not-found', ref };
}

function unscannedRefusal(collection: { path: string; message: string }): NextCodeResult {
  return {
    kind: 'refused',
    reason: 'unscanned',
    message: `Cannot allocate a code: ${collection.path} could not be read (${collection.message}).`,
  };
}

export const NextCodeResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('allocated'), code: ProjectCode }),
  z.object({
    kind: z.literal('refused'),
    reason: z.enum(['invalid-letter', 'unscanned', 'exhausted']),
    message: z.string(),
  }),
]);
export type NextCodeResult = z.infer<typeof NextCodeResult>;

/**
 * The next `<letter><NN>` after the highest code in use (A6, R15): member folders and identities, other folders, and
 * archived entries all count; an archived range (`a01-a49`) takes every code in it. Refuses rather than guesses when
 * any part of the listing is unscanned.
 */
export function nextCode(listing: ProjectListing, letter: string): NextCodeResult {
  if (!/^[a-z]$/.test(letter)) {
    return {
      kind: 'refused',
      reason: 'invalid-letter',
      message: `"${letter}" is not a single lowercase letter.`,
    };
  }
  const { members, otherFolders, archived } = listing;
  if (members.state === 'unscanned') return unscannedRefusal(members);
  if (otherFolders.state === 'unscanned') return unscannedRefusal(otherFolders);
  if (archived.state === 'unscanned') return unscannedRefusal(archived);

  const taken: number[] = [];
  const take = (code: string | undefined): void => {
    if (code?.[0] === letter) taken.push(Number(code.slice(1)));
  };
  for (const member of members.items) {
    take(member.parsed?.code);
    take(member.identity.code);
  }
  for (const folder of otherFolders.items) take(folder.parsed?.code);
  for (const entry of archived.items) {
    if (entry.kind === 'project') take(entry.code);
    if (entry.kind === 'range' && entry.letter === letter) taken.push(entry.to);
  }

  const next = Math.max(0, ...taken) + 1;
  if (next > 99) {
    return {
      kind: 'refused',
      reason: 'exhausted',
      message: `Every "${letter}" code up to ${letter}99 is taken.`,
    };
  }
  return { kind: 'allocated', code: `${letter}${String(next).padStart(2, '0')}` };
}
