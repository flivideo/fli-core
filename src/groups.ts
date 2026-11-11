import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineCapabilities, defineCapability } from './capability.js';
import { errorCode, errorMessage, readJsonFile } from './fs-utils.js';
import { lockedChange } from './locked-change.js';
import { KebabSlug, ProjectCode } from './project-folder.js';
import { issuesOf } from './results.js';
import {
  SERIES_FILE,
  SERIES_FOLDER,
  type SeriesFile,
  changeSeries,
  duplicateIds,
  listSeries,
  readSeries,
} from './series.js';

/**
 * A group: a named list of projects in one brand. A group is **ordered** (numbered in its own order, with an optional
 * label per project such as "Day 28"; a screen may call an ordered group a Series) or **unordered** (no numbers, shown
 * by code). A project can be in many groups; a project never records its groups, each group lists its projects by
 * identity id, so renaming or re-routing a folder never loses its place, and joining or leaving never renames anything.
 *
 * New groups live at `<brand root>/groups/<id>/fli.group.json`. The older `<brand root>/series/<id>/fli.series.json`
 * files are read **in place** as ordered groups (`home: 'series'`) and written only in their own shape: other tools
 * read and write that path, and its reader strips unknown fields, so a field added there would not survive. An id is
 * unique across both folders; if a hand-made clash exists, the series file wins and the groups/ copy is listed apart.
 *
 * One rule is carried over from the series design (kept so a reader that wants "the series a project is in", such as
 * Story Pilot, never has to guess): a project is in at most one ORDERED group. Unordered groups have no limit.
 */

export const GROUPS_FOLDER = 'groups';
export const GROUP_FILE = 'fli.group.json';

export const GroupMember = z.object({
  /** The project's identity `id`. */
  id: z.uuid(),
  /** The project's code when it was added; display only. */
  code: ProjectCode,
  /** A label for the member in an ordered group ("Day 5"); absent → the project's name. */
  label: z.string().min(1).optional(),
});
export type GroupMember = z.infer<typeof GroupMember>;

/**
 * `groups/<id>/fli.group.json`. Loose on purpose: a field written by a newer copy survives a write by this one (the
 * series file's strict reader is why that file cannot grow).
 */
export const GroupFile = z.looseObject({
  schema: z.literal(1),
  /** The folder name under `groups/`. */
  id: KebabSlug,
  brand: z.string().min(1),
  title: z.string().min(1),
  /** true: numbered in `members` order. false: no order (shown by code). */
  ordered: z.boolean(),
  note: z.string().min(1).optional(),
  createdAt: z.iso.datetime({ offset: true }),
  members: z.array(GroupMember),
});
export type GroupFile = z.infer<typeof GroupFile>;

export const GroupHome = z.enum(['groups', 'series']);
export type GroupHome = z.infer<typeof GroupHome>;

/** A group as readers see it, from either folder. `home: 'series'` is an older series file (always ordered, no note). */
export const Group = z.object({
  id: KebabSlug,
  brand: z.string().min(1),
  title: z.string().min(1),
  ordered: z.boolean(),
  note: z.string().min(1).optional(),
  createdAt: z.iso.datetime({ offset: true }),
  members: z.array(GroupMember),
  home: GroupHome,
});
export type Group = z.infer<typeof Group>;

export const ReadGroupResult = z.union([
  z.object({ kind: z.literal('valid'), path: z.string(), value: Group }),
  z.object({
    kind: z.literal('invalid'),
    path: z.string(),
    reason: z.enum(['unreadable', 'not-json', 'schema']),
    message: z.string(),
  }),
  z.null(),
]);
export type ReadGroupResult = z.infer<typeof ReadGroupResult>;

export const GroupListing = z.object({
  groups: z.array(Group),
  /** Folders (`groups/<id>` or `series/<id>`) whose file is missing or unusable: listed, never hidden. */
  invalid: z.array(z.object({ folder: z.string(), message: z.string() })),
});
export type GroupListing = z.infer<typeof GroupListing>;

/** `<brandRoot>/groups/<id>/fli.group.json`. Never touches the disk; throws on an `id` that is not kebab-case. */
export function groupFilePath(brandRoot: string, id: string): string {
  return path.join(brandRoot, GROUPS_FOLDER, KebabSlug.parse(id), GROUP_FILE);
}

/** A group id from a name: "Launch week 2" → "launch-week-2". Empty when the name has no letters or digits. */
export function groupIdOf(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fromSeries(s: SeriesFile): Group {
  return {
    id: s.id,
    brand: s.brand,
    title: s.title,
    ordered: true,
    createdAt: s.createdAt,
    members: s.members,
    home: 'series',
  };
}

function fromFile(g: GroupFile): Group {
  return {
    id: g.id,
    brand: g.brand,
    title: g.title,
    ordered: g.ordered,
    ...(g.note === undefined ? {} : { note: g.note }),
    createdAt: g.createdAt,
    members: g.members,
    home: 'groups',
  };
}

async function readGroupFile(brandRoot: string, id: string) {
  const read = await readJsonFile(groupFilePath(brandRoot, id), GroupFile);
  if (read?.kind === 'valid' && read.value.id !== id) {
    return {
      kind: 'invalid' as const,
      path: read.path,
      reason: 'schema' as const,
      message: `id "${read.value.id}" is not the folder name "${id}"`,
    };
  }
  return read;
}

const isDir = (p: string) =>
  fs.stat(p).then(
    (s) => s.isDirectory(),
    () => false,
  );

/**
 * Read one group, from `series/<id>/` (an older series file) or `groups/<id>/`. The series folder is asked first: on a
 * clash it wins. Absent → `null`; malformed → `invalid`. Never throws.
 */
export async function readGroup(brandRoot: string, id: string): Promise<ReadGroupResult> {
  const parsed = KebabSlug.safeParse(id);
  if (!parsed.success) {
    return {
      kind: 'invalid',
      path: path.join(brandRoot, GROUPS_FOLDER, id, GROUP_FILE),
      reason: 'schema',
      message: issuesOf(parsed.error).join('; '),
    };
  }
  if (await isDir(path.join(brandRoot, SERIES_FOLDER, id))) {
    const read = await readSeries(brandRoot, id);
    if (read?.kind === 'valid')
      return { kind: 'valid', path: read.path, value: fromSeries(read.value) };
    if (read !== null) return read;
  }
  const read = await readGroupFile(brandRoot, id);
  if (read?.kind === 'valid')
    return { kind: 'valid', path: read.path, value: fromFile(read.value) };
  return read;
}

/** Every group of a brand, from both folders, by id. No folders → empty. Never throws. */
export async function listGroups(brandRoot: string): Promise<GroupListing> {
  const series = await listSeries(brandRoot);
  const listing: GroupListing = {
    groups: series.series.map(fromSeries),
    invalid: series.invalid.map((f) => ({
      folder: `${SERIES_FOLDER}/${f.folder}`,
      message: f.message,
    })),
  };
  const seriesIds = new Set([
    ...series.series.map((s) => s.id),
    ...series.invalid.map((f) => f.folder),
  ]);
  const entries = await fs
    .readdir(path.join(brandRoot, GROUPS_FOLDER), { withFileTypes: true })
    .catch(() => []);
  for (const entry of entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const folder = `${GROUPS_FOLDER}/${entry.name}`;
    if (!KebabSlug.safeParse(entry.name).success) {
      listing.invalid.push({ folder, message: 'the folder name is not a group id (kebab-case)' });
      continue;
    }
    if (seriesIds.has(entry.name)) {
      listing.invalid.push({
        folder,
        message: `the id "${entry.name}" is already used by ${SERIES_FOLDER}/${entry.name}/${SERIES_FILE}; rename this folder`,
      });
      continue;
    }
    const read = await readGroupFile(brandRoot, entry.name);
    if (read?.kind === 'valid') listing.groups.push(fromFile(read.value));
    else {
      listing.invalid.push({
        folder,
        message: read === null ? `no ${GROUP_FILE}` : `${read.reason}: ${read.message}`,
      });
    }
  }
  listing.groups.sort((a, b) => a.id.localeCompare(b.id));
  return listing;
}

export const GroupRefusalReason = z.enum([
  'invalid-input',
  'group-exists',
  'group-not-found',
  'member-not-found',
  'in-another-ordered-group',
  'unusable-file',
  'busy',
  'io-error',
]);
export type GroupRefusalReason = z.infer<typeof GroupRefusalReason>;

const GroupRefusal = z.object({
  kind: z.literal('refused'),
  reason: GroupRefusalReason,
  path: z.string(),
  message: z.string(),
  /** For `in-another-ordered-group`: the ordered group the project is already in. */
  holder: z.object({ id: z.string(), title: z.string() }).optional(),
});

export const ChangeGroupResult = z.union([
  z.object({ kind: z.literal('written'), path: z.string(), group: Group }),
  GroupRefusal,
]);
export type ChangeGroupResult = z.infer<typeof ChangeGroupResult>;

export interface ChangeGroupOptions {
  /** How long to wait for another writer's lock (default 3 s). */
  waitMs?: number;
  /** A lock older than this is a crashed writer's and is broken (default 10 s). */
  staleMs?: number;
}

const refuse = (
  file: string,
  reason: GroupRefusalReason,
  message: string,
  holder?: { id: string; title: string },
): z.infer<typeof GroupRefusal> => ({
  kind: 'refused',
  reason,
  path: file,
  message,
  ...(holder ? { holder } : {}),
});

/** The ordered group (other than `except`) that already holds `projectId`, if any. */
export function orderedGroupOf(
  listing: GroupListing,
  projectId: string,
  except?: string,
): Group | null {
  return (
    listing.groups.find(
      (g) => g.ordered && g.id !== except && g.members.some((m) => m.id === projectId),
    ) ?? null
  );
}

function oneOrderedRule(
  listing: GroupListing,
  group: { id: string; title: string; ordered: boolean; members: readonly GroupMember[] },
  file: string,
): z.infer<typeof GroupRefusal> | null {
  if (!group.ordered) return null;
  for (const m of group.members) {
    const holder = orderedGroupOf(listing, m.id, group.id);
    if (holder) {
      return refuse(
        file,
        'in-another-ordered-group',
        `${m.code} is already in the ordered group "${holder.title}" (${holder.id}). A project can be in one ordered group and any number of unordered ones.`,
        { id: holder.id, title: holder.title },
      );
    }
  }
  return null;
}

/**
 * Create `groups/<id>/fli.group.json` (and the folder). Refuses `group-exists` when the id is used in either folder:
 * an exclusive create, so two creators of one id cannot both win. The brand root itself must exist.
 */
export async function createGroup(
  brandRoot: string,
  input: {
    id: string;
    brand: string;
    title: string;
    ordered: boolean;
    note?: string;
    members?: GroupMember[];
  },
  now: Date = new Date(),
): Promise<ChangeGroupResult> {
  const idOk = KebabSlug.safeParse(input.id);
  const file = idOk.success
    ? groupFilePath(brandRoot, input.id)
    : path.join(brandRoot, GROUPS_FOLDER, input.id, GROUP_FILE);
  const parsed = GroupFile.safeParse({
    schema: 1,
    id: input.id,
    brand: input.brand,
    title: input.title,
    ordered: input.ordered,
    ...(input.note ? { note: input.note } : {}),
    createdAt: now.toISOString(),
    members: input.members ?? [],
  });
  if (!parsed.success) return refuse(file, 'invalid-input', issuesOf(parsed.error).join('; '));
  const dupes = duplicateIds(parsed.data.members);
  if (dupes.length > 0)
    return refuse(file, 'invalid-input', `a project is listed twice: ${dupes.join(', ')}`);
  if (!parsed.data.ordered && parsed.data.members.some((m) => m.label !== undefined))
    return refuse(file, 'invalid-input', 'labels are for ordered groups only');
  try {
    if (!(await fs.stat(brandRoot)).isDirectory())
      throw new Error(`${brandRoot} is not a directory`);
    if (await isDir(path.join(brandRoot, SERIES_FOLDER, input.id))) {
      return refuse(
        file,
        'group-exists',
        `There is already a group called "${input.id}" (${SERIES_FOLDER}/${input.id}/). Pick another name.`,
      );
    }
    const clash = oneOrderedRule(await listGroups(brandRoot), parsed.data, file);
    if (clash) return clash;
    await fs.mkdir(path.dirname(file), { recursive: true });
    // `wx`: an existing file is never replaced.
    await fs.writeFile(file, `${JSON.stringify(parsed.data, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    if (errorCode(error) === 'EEXIST')
      return refuse(
        file,
        'group-exists',
        `There is already a group called "${input.id}" (${file}). Pick another name.`,
      );
    return refuse(file, 'io-error', errorMessage(error));
  }
  return { kind: 'written', path: file, group: fromFile(parsed.data) };
}

/**
 * The one write path for an existing group, either folder. `change` gets the group as readers see it and returns the
 * new one, or `null` for "nothing matched" (`member-not-found`). An older series file is written back in its own shape
 * through `changeSeries`: it stays ordered and takes no note (`invalid-input` otherwise). Never throws.
 *
 * The one-ordered-group rule is checked against the other groups before the write.
 */
export async function changeGroup(
  brandRoot: string,
  id: string,
  change: (group: Group) => Group | null,
  options: ChangeGroupOptions = {},
): Promise<ChangeGroupResult> {
  if (!KebabSlug.safeParse(id).success) {
    return refuse(
      path.join(brandRoot, GROUPS_FOLDER, id, GROUP_FILE),
      'invalid-input',
      `"${id}" is not a group id (kebab-case).`,
    );
  }
  const listing = await listGroups(brandRoot);
  // The change runs on what is on disk under the lock; the rule needs the others, read just before.
  const guarded = (group: Group): Group | null => {
    const next = change(group);
    if (next === null) return null;
    const clash = oneOrderedRule(listing, next, '');
    if (clash) throw new RuleError(clash);
    return next;
  };

  if (await isDir(path.join(brandRoot, SERIES_FOLDER, id))) {
    const caught: { rule?: RuleError } = {};
    const result = await changeSeries(
      brandRoot,
      id,
      (s) => {
        let next: Group | null;
        try {
          next = guarded(fromSeries(s));
        } catch (error) {
          if (error instanceof RuleError) caught.rule = error;
          throw error;
        }
        if (next === null) return null;
        if (!next.ordered || next.note !== undefined) {
          throw new Error(
            `${SERIES_FOLDER}/${id}/${SERIES_FILE} is an older series file: it stays ordered and takes no note. Only its name and projects change.`,
          );
        }
        return { ...s, title: next.title, members: next.members };
      },
      options,
    );
    if (caught.rule) return { ...caught.rule.refusal, path: seriesFilePathOf(brandRoot, id) };
    if (result.kind === 'written')
      return { kind: 'written', path: result.path, group: fromSeries(result.series) };
    return refuse(
      result.path,
      result.reason === 'series-not-found'
        ? 'group-not-found'
        : result.reason === 'series-exists'
          ? 'group-exists'
          : result.reason,
      result.message,
    );
  }

  const file = groupFilePath(brandRoot, id);
  const caught: { rule?: RuleError } = {};
  const result = await lockedChange<GroupFile>({
    file,
    noun: 'group',
    id,
    brandRoot,
    fileName: GROUP_FILE,
    read: () => readGroupFile(brandRoot, id),
    schema: GroupFile,
    check: (g) => {
      const dupes = duplicateIds(g.members);
      return dupes.length > 0 ? `a project is listed twice: ${dupes.join(', ')}` : null;
    },
    change: (g) => {
      let next: Group | null;
      try {
        next = guarded(fromFile(g));
      } catch (error) {
        if (error instanceof RuleError) caught.rule = error;
        throw error;
      }
      if (next === null) return null;
      // Keep any field a newer copy wrote (loose file); take ours over it.
      const kept: Record<string, unknown> = { ...g };
      delete kept.note;
      const ours: Record<string, unknown> = { ...next };
      delete ours.home;
      if (ours.note === undefined) delete ours.note;
      return { ...kept, ...ours } as GroupFile;
    },
    ...options,
  });
  if (caught.rule) return { ...caught.rule.refusal, path: file };
  if (result.kind === 'written')
    return { kind: 'written', path: file, group: fromFile(result.value) };
  return refuse(
    file,
    result.reason === 'not-found' ? 'group-not-found' : result.reason,
    result.message,
  );
}

class RuleError extends Error {
  constructor(readonly refusal: z.infer<typeof GroupRefusal>) {
    super(refusal.message);
  }
}

function seriesFilePathOf(brandRoot: string, id: string): string {
  return path.join(brandRoot, SERIES_FOLDER, id, SERIES_FILE);
}

/**
 * Add a project to a group, at the end or at `at` (0-based). Adding a project already in the group moves it and
 * refreshes its code/label rather than listing it twice, so a re-run is safe. A label on an unordered group throws.
 */
export function addGroupMember(group: Group, member: GroupMember, at?: number): Group {
  if (!group.ordered && member.label !== undefined)
    throw new Error('labels are for ordered groups only');
  const rest = group.members.filter((m) => m.id !== member.id);
  const index = at === undefined ? rest.length : Math.max(0, Math.min(at, rest.length));
  return { ...group, members: [...rest.slice(0, index), member, ...rest.slice(index)] };
}

/** Remove a project from a group. Not a member → `null` (`member-not-found`). */
export function removeGroupMember(group: Group, id: string): Group | null {
  if (!group.members.some((m) => m.id === id)) return null;
  return { ...group, members: group.members.filter((m) => m.id !== id) };
}

/** A group as an older `SeriesFile` (the `series.*` aliases answer in that exact shape). */
export function groupAsSeries(group: Group): SeriesFile {
  return {
    schema: 1,
    id: group.id,
    brand: group.brand,
    title: group.title,
    createdAt: group.createdAt,
    members: group.members,
  };
}

// ── The `group.*` capabilities: contracts for FliStudio (or any door) to bind. ──

const GroupRef = z.object({ brand: z.string().min(1), group: KebabSlug });
const Changed = z.object({ path: z.string(), group: Group });
const modes = [
  'unknown-brand',
  'no-brand-root',
  'group-not-found',
  'unusable-file',
  'busy',
] as const;

/** `group.*`: brand-level groups over `groups/<id>/fli.group.json` and the older `series/<id>/fli.series.json`. */
export const GROUP_CAPABILITIES = defineCapabilities({
  'group.list': defineCapability({
    kind: 'query',
    description:
      'The brand’s groups (both folders), each ordered or not, with its member projects; folders with an unusable file are listed apart.',
    input: z.object({ brand: z.string().min(1) }),
    output: GroupListing,
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: ['unknown-brand', 'no-brand-root'],
  }),
  'group.get': defineCapability({
    kind: 'query',
    description: 'One group and its members.',
    input: GroupRef,
    output: Group,
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [...modes],
  }),
  'group.create': defineCapability({
    kind: 'command',
    description:
      'Start a group under the brand: a name, ordered (numbered, may be shown as a Series) or not, an optional note. The id comes from the name unless given. Refused when the id is taken in either folder; never overwrites.',
    input: z.object({
      brand: z.string().min(1),
      title: z.string().min(1),
      ordered: z.boolean(),
      group: KebabSlug.optional(),
      note: z.string().min(1).optional(),
    }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: false,
    confirmationRequired: false,
    failureModes: ['unknown-brand', 'no-brand-root', 'group-exists'],
  }),
  'group.add': defineCapability({
    kind: 'command',
    description:
      'Add a project to a group (at the end, or at `at`; a label only in an ordered group). Adding it again moves it; it is never listed twice. A project can be in one ordered group and any number of unordered ones.',
    input: GroupRef.extend({
      project: z.string().min(1),
      label: z.string().min(1).optional(),
      at: z.number().int().min(0).optional(),
    }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [
      ...modes,
      'in-another-ordered-group',
      'project-not-found',
      'project-ambiguous',
      'not-a-project',
    ],
  }),
  'group.remove': defineCapability({
    kind: 'command',
    description: 'Take a project out of a group. The project itself is untouched.',
    input: GroupRef.extend({ project: z.string().min(1) }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: false,
    confirmationRequired: false,
    failureModes: [...modes, 'member-not-found'],
  }),
  'group.update': defineCapability({
    kind: 'command',
    description:
      'Change a group’s name, ordered or not, or note (null clears it). An older series file takes only a new name.',
    input: GroupRef.extend({
      title: z.string().min(1).optional(),
      ordered: z.boolean().optional(),
      note: z.string().min(1).nullable().optional(),
    }),
    output: Changed,
    sideEffects: 'reversible-write',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [...modes, 'in-another-ordered-group', 'invalid-input'],
  }),
});
