import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { type PrincipalName } from './capability.js';
import { atomicWrite, errorMessage, readJsonFile } from './fs-utils.js';
import { InvalidFile, issuesOf, readFileResult } from './results.js';
import { Stamp, stampOf } from './stamp.js';
import { VIDEO_FOLDER_PATTERN } from './video-file.js';
import { WordLevel } from './words.js';

/**
 * Video resources (David 2026-09-27; design: flivideo docs/briefs/video-resources-model.md): everything that belongs to
 * a video — launch titles and thumbnails (many candidates, some chosen), description, chapters, tags, community links,
 * affiliate slots, artefacts, private provenance. One file shape, `fli.resources.json`, at three levels like the word
 * store: global (`~/.config/appydave/`), brand (`v-<brand>/`) and project. The REGISTRY of kinds and groups is data at
 * every level (a lower level wins); the resources themselves live at the project level. FliStudio is the only writer.
 *
 * Code knows only the value types (how a value is drawn) and the choosing rules. A new kind is a row — or nothing at
 * all: an undescribed kind is still stored and falls into the `other` group.
 */

export const RESOURCES_FILE = 'fli.resources.json';

const Text = z.string().trim().min(1).max(200);
const Key = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'a kind or group is kebab-case, e.g. shorts-hook');

/** How a value is drawn. A new one is code (a renderer); everything else is data. */
export const ResourceValue = z.enum([
  'text',
  'url',
  'path',
  'image',
  'list',
  'chapters',
  'ref',
  'meta',
]);
export type ResourceValue = z.infer<typeof ResourceValue>;

/**
 * How candidates of a kind are chosen: `one` — at most one `chosen` per video; `one+test` — that, plus any number
 * `in-test` (a warning past 3, YouTube's test today); `published` — a thing that goes out; `none` — no choosing.
 */
export const ResourceChoose = z.enum(['none', 'one', 'one+test', 'published']);
export type ResourceChoose = z.infer<typeof ResourceChoose>;

export const ResourceStatus = z.enum(['candidate', 'in-test', 'chosen', 'published', 'retired']);
export type ResourceStatus = z.infer<typeof ResourceStatus>;

export const ResourceAudience = z.enum(['youtube', 'skool', 'internal']);
export type ResourceAudience = z.infer<typeof ResourceAudience>;

export const ResourceGroup = z.object({
  group: Key,
  label: Text,
  order: z.number().int().default(50),
  changed: Stamp,
});
export type ResourceGroup = z.infer<typeof ResourceGroup>;

export const ResourceKind = z.object({
  kind: Key,
  group: Key,
  label: Text,
  value: ResourceValue,
  many: z.boolean().default(false),
  choose: ResourceChoose.default('none'),
  /** Who sees it by default when a resource gives none. */
  audience: z.array(ResourceAudience).optional(),
  hint: z.string().max(300).optional(),
  changed: Stamp,
});
export type ResourceKind = z.infer<typeof ResourceKind>;

/** A lower level switching off an inherited kind or group. */
export const ResourceOff = z
  .object({ kind: Key.optional(), group: Key.optional(), changed: Stamp })
  .refine((o) => (o.kind === undefined) !== (o.group === undefined), 'off names a kind or a group');
export type ResourceOff = z.infer<typeof ResourceOff>;

/** A video name in the `videos/` naming; the folder need not exist yet (ideas come first). `null` = the project's. */
export const ResourceVideo = z
  .string()
  .regex(VIDEO_FOLDER_PATTERN, 'video must be a kebab-case video name')
  .nullable();

export const ResourceRef = z.object({
  schema: z.string().min(1).max(80),
  id: z.string().max(200).optional(),
  file: z.string().max(1000).optional(),
});
export type ResourceRef = z.infer<typeof ResourceRef>;

export const Resource = z.object({
  id: z.string().regex(/^r_[a-z0-9]{6,}$/),
  kind: Key,
  video: ResourceVideo.default(null),
  title: z.string().max(300).optional(),
  text: z.string().max(20_000).optional(),
  /** Where it came from on the web. A file's own copy is `path`; the url is then only provenance. */
  url: z.string().max(2000).optional(),
  /** Project-relative (`resources/…`) when inside the project, else absolute. */
  path: z.string().max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).default([]),
  audience: z.array(ResourceAudience).default([]),
  status: ResourceStatus.default('candidate'),
  ref: ResourceRef.optional(),
  /** The producer's payload, stored as given (a thumbnail's generation_record, chapters, provenance fields…). */
  meta: z.record(z.string(), z.unknown()).optional(),
  added: Stamp,
  changed: Stamp,
});
export type Resource = z.infer<typeof Resource>;

export const ResourcesFile = z.object({
  schema: z.literal(1),
  groups: z.array(ResourceGroup).default([]),
  kinds: z.array(ResourceKind).default([]),
  off: z.array(ResourceOff).default([]),
  resources: z.array(Resource).default([]),
});
export type ResourcesFile = z.infer<typeof ResourcesFile>;

export const EMPTY_RESOURCES: ResourcesFile = {
  schema: 1,
  groups: [],
  kinds: [],
  off: [],
  resources: [],
};

export const ReadResourcesFileResult = readFileResult(ResourcesFile);
export type ReadResourcesFileResult = z.infer<typeof ReadResourcesFileResult>;

const From = { from: WordLevel };
/** The merged registry: each row with the level it came from. */
export const ResourceRegistry = z.object({
  groups: z.array(ResourceGroup.extend(From)),
  kinds: z.array(ResourceKind.extend(From)),
});
export type ResourceRegistry = z.infer<typeof ResourceRegistry>;

/** The group every undescribed kind falls into. */
export const OTHER_GROUP = 'other';

export interface ReadResourcesOptions {
  globalFile?: string;
  brandRoot?: string;
  projectDir?: string;
}

export const ResourcesRead = z.object({
  registry: ResourceRegistry,
  /** The project's resources (empty without a project). */
  resources: z.array(Resource),
  levels: z.object({
    global: ResourcesFile.nullable(),
    brand: ResourcesFile.nullable(),
    project: ResourcesFile.nullable(),
  }),
  invalid: z.array(InvalidFile),
});
export type ResourcesRead = z.infer<typeof ResourcesRead>;

export function resourcesFilePaths(o: ReadResourcesOptions): Record<WordLevel, string | null> {
  return {
    global: o.globalFile ?? null,
    brand: o.brandRoot ? path.join(o.brandRoot, RESOURCES_FILE) : null,
    project: o.projectDir ? path.join(o.projectDir, RESOURCES_FILE) : null,
  };
}

export function readResourcesFile(file: string): Promise<ReadResourcesFileResult> {
  return readJsonFile(file, ResourcesFile);
}

/** Merge the registry, highest level first; a lower level's row or `off` wins. */
export function mergeRegistry(
  levels: Partial<Record<WordLevel, ResourcesFile | null>>,
): ResourceRegistry {
  const groups = new Map<string, ResourceRegistry['groups'][number]>();
  const kinds = new Map<string, ResourceRegistry['kinds'][number]>();
  for (const from of WordLevel.options) {
    const file = levels[from];
    if (!file) continue;
    for (const o of file.off) {
      if (o.kind) kinds.delete(o.kind);
      if (o.group) groups.delete(o.group);
    }
    for (const g of file.groups) groups.set(g.group, { ...g, from });
    for (const k of file.kinds) kinds.set(k.kind, { ...k, from });
  }
  return {
    groups: [...groups.values()].sort(
      (a, b) => a.order - b.order || a.group.localeCompare(b.group),
    ),
    kinds: [...kinds.values()],
  };
}

/** Read the registry at every level asked for, and the project's resources. Never throws. */
export async function readResources(options: ReadResourcesOptions): Promise<ResourcesRead> {
  const paths = resourcesFilePaths(options);
  const levels: ResourcesRead['levels'] = { global: null, brand: null, project: null };
  const invalid: InvalidFile[] = [];
  for (const level of WordLevel.options) {
    const file = paths[level];
    if (!file) continue;
    const read = await readResourcesFile(file);
    if (read?.kind === 'valid') levels[level] = read.value;
    else if (read?.kind === 'invalid') invalid.push(read);
  }
  return {
    registry: mergeRegistry(levels),
    resources: levels.project?.resources ?? [],
    levels,
    invalid,
  };
}

/** A kind's merged row, or `null` for an undescribed kind (it then goes in `other`, drawn as text, no choosing). */
export function kindOf(
  registry: ResourceRegistry,
  kind: string,
): ResourceRegistry['kinds'][number] | null {
  return registry.kinds.find((k) => k.kind === kind) ?? null;
}

export const ResourceInput = Resource.pick({
  kind: true,
  title: true,
  text: true,
  url: true,
  path: true,
  ref: true,
  meta: true,
}).extend({
  video: ResourceVideo.optional(),
  tags: z.array(z.string().trim().min(1).max(60)).optional(),
  audience: z.array(ResourceAudience).optional(),
  status: ResourceStatus.optional(),
});
export type ResourceInput = z.input<typeof ResourceInput>;

export function newResourceId(): string {
  return `r_${randomBytes(5).toString('hex')}`;
}

const tidyTags = (tags: string[]) => [
  ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
];

export type ResourceChange = { file: ResourcesFile; resource: Resource; warnings: string[] };

/**
 * The choosing rule, applied when `target` takes `status`: under `one` / `one+test`, a new `chosen` demotes the other
 * chosen resource of the same video and kind to `candidate`; under `one+test`, more than 3 `in-test` is a warning.
 */
function applyChoosing(
  resources: Resource[],
  target: Resource,
  choose: ResourceChoose,
  stamp: Stamp,
): { resources: Resource[]; warnings: string[] } {
  const warnings: string[] = [];
  const same = (r: Resource) =>
    r.id !== target.id && r.kind === target.kind && r.video === target.video;
  let out = resources;
  if (target.status === 'chosen' && (choose === 'one' || choose === 'one+test')) {
    out = out.map((r) =>
      same(r) && r.status === 'chosen' ? { ...r, status: 'candidate', changed: stamp } : r,
    );
  }
  if (choose === 'one+test') {
    const inTest = out.filter(
      (r) => r.kind === target.kind && r.video === target.video && r.status === 'in-test',
    );
    if (inTest.length > 3) {
      warnings.push(
        `${inTest.length} ${target.kind} resources are in the YouTube test; its test takes 3 today.`,
      );
    }
  }
  return { resources: out, warnings };
}

/** Add one resource. Pure: returns the new file, the stored record and any choosing warnings. */
export function addResource(
  file: ResourcesFile,
  input: ResourceInput,
  registry: ResourceRegistry,
  by: PrincipalName,
  now: Date = new Date(),
  id: string = newResourceId(),
): ResourceChange {
  const i = ResourceInput.parse(input);
  const stamp = stampOf(by, now);
  const row = kindOf(registry, i.kind);
  const resource = Resource.parse({
    ...i,
    id,
    video: i.video ?? null,
    tags: tidyTags(i.tags ?? []),
    audience: i.audience ?? row?.audience ?? [],
    status: i.status ?? 'candidate',
    added: stamp,
    changed: stamp,
  });
  const chosen = applyChoosing(
    [...file.resources, resource],
    resource,
    row?.choose ?? 'none',
    stamp,
  );
  return { file: { ...file, resources: chosen.resources }, resource, warnings: chosen.warnings };
}

function find(file: ResourcesFile, id: string): Resource {
  const r = file.resources.find((x) => x.id === id);
  if (!r) throw new ResourceNotFound(id);
  return r;
}

/** Thrown by the pure edits when an id is not in the file; FliStudio turns it into `resource-not-found`. */
export class ResourceNotFound extends Error {
  constructor(readonly id: string) {
    super(`No resource ${id}.`);
  }
}

export const ResourcePatch = Resource.pick({
  title: true,
  text: true,
  url: true,
  path: true,
  ref: true,
  meta: true,
}).extend({ video: ResourceVideo.optional(), audience: z.array(ResourceAudience).optional() });
export type ResourcePatch = z.input<typeof ResourcePatch>;

function replace(file: ResourcesFile, next: Resource): ResourcesFile {
  return { ...file, resources: file.resources.map((r) => (r.id === next.id ? next : r)) };
}

export function updateResource(
  file: ResourcesFile,
  id: string,
  patch: ResourcePatch,
  by: PrincipalName,
  now: Date = new Date(),
): ResourceChange {
  const p = ResourcePatch.parse(patch);
  const next = Resource.parse({ ...find(file, id), ...p, changed: stampOf(by, now) });
  return { file: replace(file, next), resource: next, warnings: [] };
}

export function tagResource(
  file: ResourcesFile,
  id: string,
  change: { add?: string[]; remove?: string[] },
  by: PrincipalName,
  now: Date = new Date(),
): ResourceChange {
  const r = find(file, id);
  const drop = new Set(tidyTags(change.remove ?? []));
  const tags = tidyTags([...r.tags, ...(change.add ?? [])]).filter((t) => !drop.has(t));
  const next = { ...r, tags, changed: stampOf(by, now) };
  return { file: replace(file, next), resource: next, warnings: [] };
}

export function setResourceStatus(
  file: ResourcesFile,
  id: string,
  status: ResourceStatus,
  registry: ResourceRegistry,
  by: PrincipalName,
  now: Date = new Date(),
): ResourceChange {
  const stamp = stampOf(by, now);
  const next = { ...find(file, id), status: ResourceStatus.parse(status), changed: stamp };
  const chosen = applyChoosing(
    replace(file, next).resources,
    next,
    kindOf(registry, next.kind)?.choose ?? 'none',
    stamp,
  );
  return {
    file: { ...file, resources: chosen.resources },
    resource: next,
    warnings: chosen.warnings,
  };
}

export function removeResource(
  file: ResourcesFile,
  id: string,
): { file: ResourcesFile; removed: Resource } {
  const removed = find(file, id);
  return { file: { ...file, resources: file.resources.filter((r) => r.id !== id) }, removed };
}

export const KindInput = ResourceKind.omit({ changed: true });
export type KindInput = z.input<typeof KindInput>;
export const GroupInput = ResourceGroup.omit({ changed: true });
export type GroupInput = z.input<typeof GroupInput>;

/** Add or replace a kind and/or group row at one level (and drop any `off` for it there). */
export function addRegistryRow(
  file: ResourcesFile,
  row: { kind?: KindInput; group?: GroupInput },
  by: PrincipalName,
  now: Date = new Date(),
): ResourcesFile {
  const changed = stampOf(by, now);
  let next = { ...file };
  if (row.kind) {
    const k = ResourceKind.parse({ ...row.kind, changed });
    next = {
      ...next,
      kinds: [...next.kinds.filter((x) => x.kind !== k.kind), k],
      off: next.off.filter((o) => o.kind !== k.kind),
    };
  }
  if (row.group) {
    const g = ResourceGroup.parse({ ...row.group, changed });
    next = {
      ...next,
      groups: [...next.groups.filter((x) => x.group !== g.group), g],
      off: next.off.filter((o) => o.group !== g.group),
    };
  }
  return next;
}

/**
 * Remove a kind or group row at one level; when this level has no such row (it is inherited), add an `off` instead.
 * Answers what it did.
 */
export function removeRegistryRow(
  file: ResourcesFile,
  target: { kind?: string; group?: string },
  by: PrincipalName,
  now: Date = new Date(),
): { file: ResourcesFile; action: 'removed' | 'turned-off' } {
  if (target.kind) {
    if (file.kinds.some((k) => k.kind === target.kind)) {
      return {
        file: { ...file, kinds: file.kinds.filter((k) => k.kind !== target.kind) },
        action: 'removed',
      };
    }
    return {
      file: {
        ...file,
        off: [...file.off, ResourceOff.parse({ kind: target.kind, changed: stampOf(by, now) })],
      },
      action: 'turned-off',
    };
  }
  if (target.group && file.groups.some((g) => g.group === target.group)) {
    return {
      file: { ...file, groups: file.groups.filter((g) => g.group !== target.group) },
      action: 'removed',
    };
  }
  return {
    file: {
      ...file,
      off: [...file.off, ResourceOff.parse({ group: target.group, changed: stampOf(by, now) })],
    },
    action: 'turned-off',
  };
}

export const WriteResourcesResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('written'), path: z.string() }),
  z.object({
    kind: z.literal('refused'),
    reason: z.enum(['invalid-input', 'io-error']),
    path: z.string(),
    message: z.string(),
  }),
]);
export type WriteResourcesResult = z.infer<typeof WriteResourcesResult>;

/** Write `fli.resources.json` atomically; the folder must exist. */
export async function writeResourcesFile(
  file: string,
  value: ResourcesFile,
): Promise<WriteResourcesResult> {
  const parsed = ResourcesFile.safeParse(value);
  if (!parsed.success) {
    return {
      kind: 'refused',
      reason: 'invalid-input',
      path: file,
      message: issuesOf(parsed.error).join('; '),
    };
  }
  try {
    if (!(await fs.stat(path.dirname(file))).isDirectory()) {
      throw new Error(`${path.dirname(file)} is not a directory`);
    }
    await atomicWrite(file, `${JSON.stringify(parsed.data, null, 2)}\n`);
    return { kind: 'written', path: file };
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }
}
