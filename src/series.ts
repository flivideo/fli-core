import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineCapabilities, defineCapability } from './capability.js';
import { errorCode, errorMessage, readJsonFile } from './fs-utils.js';
import { lockedChange } from './locked-change.js';
import { KebabSlug, ProjectCode } from './project-folder.js';
import { issuesOf, readFileResult } from './results.js';

/**
 * A series: several projects of one brand that ship as one run ("45 Days to $450": b01…b14). It lives at
 * `<brand root>/series/<id>/fli.series.json` — brand level, beside the projects, never inside one (video-structure plan
 * §4C item 3). `fli.studio.json` is unchanged: a project does not know it is in a series, the series lists its projects.
 *
 * A member is named by project **id** (the uuid in `fli.studio.json`, kept stable by `adoptIdentity`), not by folder:
 * the folder can be renamed or re-routed (`a01-…` → `b01-…`) and the series still finds the project. `code` and `name`
 * are there for a person reading the file and are refreshed by whoever writes it. Order is the order of `members`.
 */

export const SERIES_FOLDER = 'series';
export const SERIES_FILE = 'fli.series.json';

export const SeriesMember = z.object({
  /** The project's identity `id`. */
  id: z.uuid(),
  /** The project's code when it was added; display only. */
  code: ProjectCode,
  /** A label for the member in this series ("Day 5"); absent → the project's name. */
  label: z.string().min(1).optional(),
});
export type SeriesMember = z.infer<typeof SeriesMember>;

export const SeriesFile = z.object({
  schema: z.literal(1),
  /** The folder name under `series/`. */
  id: KebabSlug,
  brand: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  members: z.array(SeriesMember),
});
export type SeriesFile = z.infer<typeof SeriesFile>;

export const ReadSeriesResult = readFileResult(SeriesFile);
export type ReadSeriesResult = z.infer<typeof ReadSeriesResult>;

/** `<brandRoot>/series/<id>/fli.series.json`. Never touches the disk; throws on an `id` that is not kebab-case. */
export function seriesFilePath(brandRoot: string, id: string): string {
  return path.join(brandRoot, SERIES_FOLDER, KebabSlug.parse(id), SERIES_FILE);
}

/** Read one series. Absent → `null`; malformed → an `invalid` result. Never throws (a bad `id` is `invalid`). */
export async function readSeries(brandRoot: string, id: string): Promise<ReadSeriesResult> {
  const parsed = KebabSlug.safeParse(id);
  if (!parsed.success) {
    return {
      kind: 'invalid',
      path: path.join(brandRoot, SERIES_FOLDER, id, SERIES_FILE),
      reason: 'schema',
      message: issuesOf(parsed.error).join('; '),
    };
  }
  const read = await readJsonFile(seriesFilePath(brandRoot, id), SeriesFile);
  if (read?.kind === 'valid' && read.value.id !== id) {
    return {
      kind: 'invalid',
      path: read.path,
      reason: 'schema',
      message: `id "${read.value.id}" is not the folder name "${id}"`,
    };
  }
  return read;
}

export const SeriesListing = z.object({
  series: z.array(SeriesFile),
  /** Folders under `series/` whose file is missing or unusable: listed, never hidden. */
  invalid: z.array(z.object({ folder: z.string(), message: z.string() })),
});
export type SeriesListing = z.infer<typeof SeriesListing>;

/** Every series of a brand, by id. No `series/` folder → empty. Never throws. */
export async function listSeries(brandRoot: string): Promise<SeriesListing> {
  const entries = await fs
    .readdir(path.join(brandRoot, SERIES_FOLDER), { withFileTypes: true })
    .catch(() => []);
  const listing: SeriesListing = { series: [], invalid: [] };
  for (const entry of entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const read = await readSeries(brandRoot, entry.name);
    if (read?.kind === 'valid') listing.series.push(read.value);
    else {
      listing.invalid.push({
        folder: entry.name,
        message: read === null ? `no ${SERIES_FILE}` : `${read.reason}: ${read.message}`,
      });
    }
  }
  return listing;
}

const Refusal = z.object({
  kind: z.literal('refused'),
  reason: z.enum([
    'invalid-input',
    'series-exists',
    'series-not-found',
    'member-not-found',
    'unusable-file',
    'busy',
    'io-error',
  ]),
  path: z.string(),
  message: z.string(),
});

export const ChangeSeriesResult = z.union([
  z.object({ kind: z.literal('written'), path: z.string(), series: SeriesFile }),
  Refusal,
]);
export type ChangeSeriesResult = z.infer<typeof ChangeSeriesResult>;

export interface ChangeSeriesOptions {
  /** How long to wait for another writer's lock (default 3 s). */
  waitMs?: number;
  /** A lock older than this is a crashed writer's and is broken (default 10 s). */
  staleMs?: number;
}

const refuse = (
  file: string,
  reason: z.infer<typeof Refusal>['reason'],
  message: string,
): z.infer<typeof Refusal> => ({ kind: 'refused', reason, path: file, message });

/**
 * Create `series/<id>/fli.series.json` (and the folder). Refuses `series-exists` rather than overwrite: an exclusive
 * create, so two creators of one id cannot both win. The brand root itself must exist.
 */
export async function createSeries(
  brandRoot: string,
  input: { id: string; brand: string; title: string; members?: SeriesMember[] },
  now: Date = new Date(),
): Promise<ChangeSeriesResult> {
  const idOk = KebabSlug.safeParse(input.id);
  const file = idOk.success
    ? seriesFilePath(brandRoot, input.id)
    : path.join(brandRoot, SERIES_FOLDER, input.id, SERIES_FILE);
  const parsed = SeriesFile.safeParse({
    schema: 1,
    id: input.id,
    brand: input.brand,
    title: input.title,
    createdAt: now.toISOString(),
    members: input.members ?? [],
  });
  if (!parsed.success) return refuse(file, 'invalid-input', issuesOf(parsed.error).join('; '));
  const dupes = duplicateIds(parsed.data.members);
  if (dupes.length > 0)
    return refuse(file, 'invalid-input', `a project is listed twice: ${dupes.join(', ')}`);
  try {
    if (!(await fs.stat(brandRoot)).isDirectory())
      throw new Error(`${brandRoot} is not a directory`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    // `wx`: an existing file is never replaced.
    await fs.writeFile(file, `${JSON.stringify(parsed.data, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    if (errorCode(error) === 'EEXIST')
      return refuse(file, 'series-exists', `${file} already exists; it is not overwritten.`);
    return refuse(file, 'io-error', errorMessage(error));
  }
  return { kind: 'written', path: file, series: parsed.data };
}

export function duplicateIds(members: readonly SeriesMember[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const m of members) (seen.has(m.id) ? dupes : seen).add(m.id);
  return [...dupes];
}

/**
 * The one write path for an existing series: under a lock beside the file, re-read it, apply `change` to what is on disk
 * now, validate, write atomically — so two writers never lose each other's member. `change` returns the new file, or
 * `null` for "nothing matched" (`member-not-found`). Never throws. An unusable file is refused, never overwritten.
 */
export async function changeSeries(
  brandRoot: string,
  id: string,
  change: (series: SeriesFile) => SeriesFile | null,
  options: ChangeSeriesOptions = {},
): Promise<ChangeSeriesResult> {
  if (!KebabSlug.safeParse(id).success) {
    return refuse(
      path.join(brandRoot, SERIES_FOLDER, id, SERIES_FILE),
      'invalid-input',
      `"${id}" is not a series id (kebab-case).`,
    );
  }
  const file = seriesFilePath(brandRoot, id);
  const result = await lockedChange<SeriesFile>({
    file,
    noun: 'series',
    id,
    brandRoot,
    fileName: SERIES_FILE,
    read: () => readSeries(brandRoot, id),
    schema: SeriesFile,
    check: (s) => {
      const dupes = duplicateIds(s.members);
      return dupes.length > 0 ? `a project is listed twice: ${dupes.join(', ')}` : null;
    },
    change,
    ...options,
  });
  if (result.kind === 'written') return { kind: 'written', path: file, series: result.value };
  return refuse(
    file,
    result.reason === 'not-found' ? 'series-not-found' : result.reason,
    result.message,
  );
}

/**
 * Add a project to a series, at the end or at `at` (0-based). Adding a project already in the series moves it and
 * refreshes its code/label rather than listing it twice, so a re-run is safe.
 */
export function addSeriesMember(series: SeriesFile, member: SeriesMember, at?: number): SeriesFile {
  const rest = series.members.filter((m) => m.id !== member.id);
  const index = at === undefined ? rest.length : Math.max(0, Math.min(at, rest.length));
  return { ...series, members: [...rest.slice(0, index), member, ...rest.slice(index)] };
}

/** Remove a project from a series. Not a member → `null` (`member-not-found`). */
export function removeSeriesMember(series: SeriesFile, id: string): SeriesFile | null {
  if (!series.members.some((m) => m.id === id)) return null;
  return { ...series, members: series.members.filter((m) => m.id !== id) };
}

// ── The `series.*` capabilities: contracts for FliStudio (or any door) to bind. ──

const SeriesRef = z.object({ brand: z.string().min(1), series: KebabSlug });
const Changed = z.object({ path: z.string(), series: SeriesFile });
const modes = [
  'unknown-brand',
  'no-brand-root',
  'series-not-found',
  'unusable-file',
  'busy',
] as const;

/**
 * `series.*`: the older names of `group.*` (an ordered group is what a series was). Kept as thin aliases while their
 * callers move; FliStudio binds them over the group handlers. The shapes are today's, unchanged.
 */
export const SERIES_CAPABILITIES = defineCapabilities({
  'series.list': defineCapability({
    kind: 'query',
    description:
      'Older name for group.list, kept while callers move: the brand’s ordered groups in the series shape, each with its member projects in order; series/ folders with an unusable file are listed apart.',
    input: z.object({ brand: z.string().min(1) }),
    output: SeriesListing,
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: ['unknown-brand', 'no-brand-root'],
  }),
  'series.get': defineCapability({
    kind: 'query',
    description:
      'Older name for group.get, kept while callers move: one ordered group, in the series shape.',
    input: SeriesRef,
    output: SeriesFile,
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [...modes],
  }),
  'series.create': defineCapability({
    kind: 'command',
    description:
      'Older name for group.create with ordered: true, kept while callers move. Refused when the id is taken; never overwrites.',
    input: z.object({ brand: z.string().min(1), series: KebabSlug, title: z.string().min(1) }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: false,
    confirmationRequired: false,
    failureModes: ['unknown-brand', 'no-brand-root', 'series-exists'],
  }),
  'series.add': defineCapability({
    kind: 'command',
    description:
      'Older name for group.add on an ordered group, kept while callers move. Adding it again moves it; it is never listed twice.',
    input: SeriesRef.extend({
      project: z.string().min(1),
      label: z.string().min(1).optional(),
      at: z.number().int().min(0).optional(),
    }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [...modes, 'project-not-found', 'project-ambiguous', 'not-a-project'],
  }),
  'series.remove': defineCapability({
    kind: 'command',
    description:
      'Older name for group.remove on an ordered group, kept while callers move. The project itself is untouched.',
    input: SeriesRef.extend({ project: z.string().min(1) }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: false,
    confirmationRequired: false,
    failureModes: [...modes, 'member-not-found'],
  }),
});
