import { z } from 'zod';
import { PrincipalName } from './capability.js';
import { issuesOf } from './results.js';

/**
 * fli-notes (brief `flivideo/docs/briefs/fli-notes-suite-record-2026-10-31.md`): a lasting record of what a person or
 * agent **noticed** (`note`), **asked for** (`ask`) or **changed** (`change`), attached to anything in the Fli apps and
 * kept forever. One JSON record per line in `fli.notes.jsonl`: in the project folder for notes on a project, in the
 * app's own data folder for notes on the app itself. Append-only — history is never rewritten; a status change is a new
 * `change` line that targets the old record's id.
 *
 * Rulings (David 2026-10-31, not to be re-opened): no thumbs or ratings, three kinds only, the app writes `change`
 * itself at the door, kept apart from decisions (never in `fli.status.json`).
 *
 * This module is browser-safe (zod only): the schema, the filter and the pure readers. The file helpers are in
 * `notes.ts`.
 */

export const NOTES_FILE = 'fli.notes.jsonl';

/** `note`: kept, never nags. `ask`: a to-do until done. `change`: written by the app when a record changes. */
export const NoteKind = z.enum(['note', 'ask', 'change']);
export type NoteKind = z.infer<typeof NoteKind>;

/** How the words arrived. */
export const NoteChannel = z.enum(['ui', 'chat', 'voice', 'agent']);
export type NoteChannel = z.infer<typeof NoteChannel>;

/** `kept` (a note) · `open` → `done` (an ask). A `change` has no status. */
export const NoteStatus = z.enum(['kept', 'open', 'done']);
export type NoteStatus = z.infer<typeof NoteStatus>;

/** `one` entity (`entityId`), `many` (`entityIds`), or an `aggregate` described by a query in words (`query`). */
export const NoteScope = z.enum(['one', 'many', 'aggregate']);
export type NoteScope = z.infer<typeof NoteScope>;

const Name = z.string().trim().min(1);

/**
 * What the record is about. Plain strings, synthetic keys allowed (`entityType: 'beat'`, `entityId: 'd13/beat-4'`).
 * `field` narrows to one field (`script`), `region` to a part of it (`line 1`, `00:12-00:19`, a CSS-ish path).
 */
export const NoteTarget = z
  .object({
    /** The app the target lives in (`flistudio`, `flicut`). */
    app: Name,
    entityType: Name,
    scope: NoteScope.default('one'),
    entityId: Name.optional(),
    entityIds: z.array(Name).min(1).optional(),
    /** For `aggregate`: the query, described ("every StoryPilot script in v-appydave"). */
    query: Name.optional(),
    field: Name.optional(),
    region: Name.optional(),
  })
  .superRefine((target, ctx) => {
    const need = { one: 'entityId', many: 'entityIds', aggregate: 'query' } as const;
    const key = need[target.scope];
    if (target[key] === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `scope "${target.scope}" needs ${key}`,
      });
    }
  });
export type NoteTarget = z.infer<typeof NoteTarget>;

/** Where in the estate. All optional: a note on an app itself has none. */
export const NoteWhere = z.object({
  brand: Name.optional(),
  project: Name.optional(),
  video: Name.optional(),
});
export type NoteWhere = z.infer<typeof NoteWhere>;

/** What produced the "before" (the prompt, skill, model and version), where known. */
export const NoteProducer = z.looseObject({
  prompt: Name.optional(),
  skill: Name.optional(),
  model: Name.optional(),
  version: Name.optional(),
});
export type NoteProducer = z.infer<typeof NoteProducer>;

export const NoteLinks = z.looseObject({
  /** The Claude Code session id the words or the change came from. */
  session: Name.optional(),
  /** A Captain's Log capture code (`B535`). */
  capture: Name.optional(),
  commit: Name.optional(),
  /** On a `change`: the ask it fulfilled. */
  answers: Name.optional(),
  /** The record this one follows on from (on a status change: the change that did the work). */
  follows: Name.optional(),
});
export type NoteLinks = z.infer<typeof NoteLinks>;

/**
 * How `before` / `after` are held on a `change`. `full`: the values themselves. `excerpt`: two text excerpts
 * (`NoteExcerpt`) around the part that changed — a 1,000-word script is never copied whole on every write. `keys`:
 * only the top-level keys whose value changed (an object too large to keep whole).
 */
export const NoteForm = z.enum(['full', 'excerpt', 'keys']);
export type NoteForm = z.infer<typeof NoteForm>;

/** The words around a change, kept because paragraph numbers move. Offsets are in UTF-16 units of the full text. */
export const NoteExcerpt = z.object({
  text: z.string(),
  /** Where `text` starts in the full value. */
  start: z.int().min(0),
  /** The 1-based line the changed part starts on, in the full value. */
  line: z.int().min(1),
  /** The full value's length. */
  length: z.int().min(0),
  /** The changed part, within `text`: `[from, to)`. */
  from: z.int().min(0),
  to: z.int().min(0),
});
export type NoteExcerpt = z.infer<typeof NoteExcerpt>;

export const NoteRecord = z
  .object({
    schema: z.literal(1),
    id: Name,
    at: z.iso.datetime({ offset: true }),
    by: PrincipalName,
    kind: NoteKind,
    channel: NoteChannel,
    /** Present on `note` (`kept`) and `ask` (`open` when written); absent on `change`. */
    status: NoteStatus.optional(),
    where: NoteWhere.default({}),
    target: NoteTarget,
    /** The human's words, verbatim — the most valuable field. On a `change`: the `because`, when one was given. */
    text: z.string().min(1).optional(),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
    form: NoteForm.optional(),
    producer: NoteProducer.optional(),
    links: NoteLinks.optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((record, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (record.kind === 'change') {
      if (record.status !== undefined) issue('status', 'a change has no status');
    } else {
      if (record.text === undefined) issue('text', `a ${record.kind} needs its words`);
      const want = record.kind === 'note' ? 'kept' : 'open';
      if (record.status !== want) issue('status', `a ${record.kind} is written "${want}"`);
      for (const key of ['before', 'after', 'form'] as const) {
        if (record[key] !== undefined) issue(key, `only a change carries ${key}`);
      }
    }
  });
export type NoteRecord = z.infer<typeof NoteRecord>;

/**
 * What a caller hands `addNote`: the record without `schema`, `id`, `at` and `status` (the helper fills them).
 * `channel` defaults from `by` (`noteChannelOf`).
 */
export const NoteInput = z.object({
  by: PrincipalName,
  kind: NoteKind,
  channel: NoteChannel.optional(),
  where: NoteWhere.optional(),
  target: NoteTarget,
  text: z.string().min(1).optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  form: NoteForm.optional(),
  producer: NoteProducer.optional(),
  links: NoteLinks.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type NoteInput = z.input<typeof NoteInput>;

/** What a write command knows at the door, for `logChange`. */
export const ChangeInput = z.object({
  by: PrincipalName,
  target: NoteTarget,
  where: NoteWhere.optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  /** The human's words for why, verbatim. Missing → still logged, just no why. */
  because: z.string().optional(),
  /** The Claude Code session id. */
  session: z.string().optional(),
  /** The ask this change fulfils (`links.answers`). */
  answers: z.string().optional(),
  producer: NoteProducer.optional(),
  links: NoteLinks.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type ChangeInput = z.input<typeof ChangeInput>;

/** What closing an ask takes, for `resolveAsk` (and an app's `notes.resolve`). */
export const ResolveAskInput = z.object({
  by: PrincipalName,
  /** The change that did the work (linked as `follows`). */
  change: z.string().optional(),
  because: z.string().optional(),
  session: z.string().optional(),
});
export type ResolveAskInput = z.input<typeof ResolveAskInput>;

/** The channel a principal's words arrive on: `human:chat` → chat, `human:voice` → voice, other humans → ui, else agent. */
export function noteChannelOf(by: PrincipalName): NoteChannel {
  if (by === 'human:chat') return 'chat';
  if (by === 'human:voice') return 'voice';
  if (by === 'human' || by.startsWith('human:')) return 'ui';
  return 'agent';
}

/** Build a valid record from an input, or throw with the issues. Pure: the id and time are passed in. */
export function noteRecordOf(input: NoteInput, id: string, at: string): NoteRecord {
  const i = NoteInput.parse(input);
  const status = i.kind === 'note' ? 'kept' : i.kind === 'ask' ? 'open' : undefined;
  const parsed = NoteRecord.safeParse({
    schema: 1,
    id,
    at,
    by: i.by,
    kind: i.kind,
    channel: i.channel ?? noteChannelOf(i.by),
    ...(status ? { status } : {}),
    where: i.where ?? {},
    target: i.target,
    ...(i.text !== undefined ? { text: i.text } : {}),
    ...(i.before !== undefined ? { before: i.before } : {}),
    ...(i.after !== undefined ? { after: i.after } : {}),
    ...(i.form !== undefined ? { form: i.form } : {}),
    ...(i.producer ? { producer: i.producer } : {}),
    ...(i.links ? { links: i.links } : {}),
    ...(i.meta ? { meta: i.meta } : {}),
  });
  if (!parsed.success) throw new Error(issuesOf(parsed.error).join('; '));
  return parsed.data;
}

// ── before / after ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Above this many characters (the JSON of a value), a change keeps an excerpt or the changed keys, not the whole. */
export const NOTE_FULL_LIMIT = 2000;
/** Characters of unchanged text kept either side of the changed part in an excerpt. */
export const NOTE_EXCERPT_CONTEXT = 240;

export interface SnapshotOptions {
  /** Keep values whole up to this size (default `NOTE_FULL_LIMIT`). */
  limit?: number;
  /** Unchanged characters kept either side of a text change (default `NOTE_EXCERPT_CONTEXT`). */
  context?: number;
}

export const ChangeSnapshot = z.object({
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  form: NoteForm,
});
export type ChangeSnapshot = z.infer<typeof ChangeSnapshot>;

const sizeOf = (value: unknown): number => (value === undefined ? 0 : JSON.stringify(value).length);
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function excerptOf(text: string, from: number, to: number, context: number): NoteExcerpt {
  let start = Math.max(0, from - context);
  let end = Math.min(text.length, to + context);
  // Widen to whole words so the excerpt reads as words, not fragments.
  while (start > 0 && !/\s/.test(text[start - 1] as string) && from - start < context * 2) start--;
  while (end < text.length && !/\s/.test(text[end] as string) && end - to < context * 2) end++;
  return {
    text: text.slice(start, end),
    start,
    line: text.slice(0, from).split('\n').length,
    length: text.length,
    from: from - start,
    to: to - start,
  };
}

/**
 * The `before` / `after` / `form` of a change, sized for the notes file. Small values are kept whole (`full`). Two long
 * strings keep an excerpt each around the changed part (`excerpt`) — the actual words near the target. Two large plain
 * objects keep only the top-level keys that changed (`keys`; a key missing on one side is absent there). Anything else
 * large is kept whole: correct before small.
 */
export function snapshotChange(
  before: unknown,
  after: unknown,
  options: SnapshotOptions = {},
): ChangeSnapshot {
  const limit = options.limit ?? NOTE_FULL_LIMIT;
  const context = options.context ?? NOTE_EXCERPT_CONTEXT;
  const whole = (): ChangeSnapshot => ({
    ...(before !== undefined ? { before } : {}),
    ...(after !== undefined ? { after } : {}),
    form: 'full',
  });
  if (sizeOf(before) + sizeOf(after) <= limit) return whole();

  if (typeof before === 'string' && typeof after === 'string') {
    let prefix = 0;
    const max = Math.min(before.length, after.length);
    while (prefix < max && before[prefix] === after[prefix]) prefix++;
    let suffix = 0;
    while (
      suffix < max - prefix &&
      before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
    ) {
      suffix++;
    }
    return {
      before: excerptOf(before, prefix, before.length - suffix, context),
      after: excerptOf(after, prefix, after.length - suffix, context),
      form: 'excerpt',
    };
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const b: Record<string, unknown> = {};
    const a: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
      if (key in before) b[key] = before[key];
      if (key in after) a[key] = after[key];
    }
    return { before: b, after: a, form: 'keys' };
  }
  return whole();
}

// ── reading ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A status change targets the note it changes with this entity type and `field: 'status'`. */
export const NOTE_ENTITY = 'note';

/** Where a note or ask stands after every line of its file is read. */
export const NoteState = z.object({
  status: NoteStatus,
  /** The status change that set `status`, when one did. */
  statusBy: z.string().optional(),
  /** Ids of the changes whose `links.answers` names this ask. */
  answeredBy: z.array(z.string()),
});
export type NoteState = z.infer<typeof NoteState>;

const isStatusChange = (r: NoteRecord): boolean =>
  r.kind === 'change' && r.target.entityType === NOTE_ENTITY && r.target.field === 'status';

/** Fold a file's lines into the state of each note and ask (by id). Later lines win; unknown targets are ignored. */
export function noteStates(records: readonly NoteRecord[]): Map<string, NoteState> {
  const states = new Map<string, NoteState>();
  for (const r of records) {
    if (r.kind !== 'change' && r.status) states.set(r.id, { status: r.status, answeredBy: [] });
  }
  for (const r of [...records].sort((x, y) => x.at.localeCompare(y.at))) {
    if (r.kind !== 'change') continue;
    const answered = r.links?.answers;
    if (answered) states.get(answered)?.answeredBy.push(r.id);
    if (isStatusChange(r) && r.target.entityId) {
      const state = states.get(r.target.entityId);
      const next = NoteStatus.safeParse(r.after);
      if (state && next.success) {
        state.status = next.data;
        state.statusBy = r.id;
      }
    }
  }
  return states;
}

/** Which records to answer with. Every field is optional and they all have to match. */
export const NoteFilter = z.object({
  kind: z.union([NoteKind, z.array(NoteKind)]).optional(),
  /** Only asks still open (implies `kind: 'ask'`). */
  open: z.boolean().optional(),
  app: z.string().optional(),
  entityType: z.string().optional(),
  /** Matches `entityId`, or any of `entityIds`. */
  entityId: z.string().optional(),
  field: z.string().optional(),
  brand: z.string().optional(),
  project: z.string().optional(),
  video: z.string().optional(),
  by: z.string().optional(),
  /** ISO times, inclusive. */
  since: z.string().optional(),
  until: z.string().optional(),
  /** A case-insensitive substring of `text`. */
  text: z.string().optional(),
});
export type NoteFilter = z.infer<typeof NoteFilter>;

/** True when `record` passes `filter`. `state` is the record's folded state (needed for `open`). Pure. */
export function matchesNote(record: NoteRecord, filter: NoteFilter, state?: NoteState): boolean {
  const f = filter;
  const t = record.target;
  if (f.kind !== undefined && ![f.kind].flat().includes(record.kind)) return false;
  if (f.open && (record.kind !== 'ask' || (state?.status ?? record.status) !== 'open')) {
    return false;
  }
  if (f.app !== undefined && t.app !== f.app) return false;
  if (f.entityType !== undefined && t.entityType !== f.entityType) return false;
  if (f.entityId !== undefined && t.entityId !== f.entityId && !t.entityIds?.includes(f.entityId)) {
    return false;
  }
  if (f.field !== undefined && t.field !== f.field) return false;
  if (f.brand !== undefined && record.where.brand !== f.brand) return false;
  if (f.project !== undefined && record.where.project !== f.project) return false;
  if (f.video !== undefined && record.where.video !== f.video) return false;
  if (f.by !== undefined && record.by !== f.by) return false;
  const at = Date.parse(record.at);
  if (f.since !== undefined && at < Date.parse(f.since)) return false;
  if (f.until !== undefined && at > Date.parse(f.until)) return false;
  if (f.text !== undefined && !record.text?.toLowerCase().includes(f.text.toLowerCase())) {
    return false;
  }
  return true;
}
