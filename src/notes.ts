import { randomBytes } from 'node:crypto';
import { type Dirent, promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { IDENTITY_FILE } from './app-file.js';
import { errorCode, errorMessage, takeLock } from './fs-utils.js';
import {
  NOTE_ENTITY,
  NOTES_FILE,
  NoteFilter,
  NoteRecord,
  NoteRefusal,
  NoteState,
  SETTLE_FIELD,
  SettleInput,
  isSettleLine,
  matchesNote,
  noteRecordOf,
  noteStates,
  snapshotChange,
  type ChangeInput,
  type NoteInput,
  type ResolveAskInput,
  type SnapshotOptions,
} from './note-record.js';
import { issuesOf } from './results.js';

/**
 * The file half of fli-notes (`note-record.ts` holds the shape). `<dir>/fli.notes.jsonl`, one record per line,
 * append-only under a lock file beside it (`fli.notes.jsonl.lock`, the same `takeLock` as words and series), so two
 * writers never interleave or lose a line. `dir` is a project folder, or an app's own data folder for notes on the app.
 */

/** `<dir>/fli.notes.jsonl`. Never touches the disk. */
export function notesFilePath(dir: string): string {
  return path.join(dir, NOTES_FILE);
}

/** A fresh note id: `n_` + 12 hex digits. */
export function newNoteId(): string {
  return `n_${randomBytes(6).toString('hex')}`;
}

export const AddNoteResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('written'), path: z.string(), record: NoteRecord }),
  z.object({
    kind: z.literal('refused'),
    /** `NOTE_REFUSALS`: the suite's names; each app maps them to its own failure codes. */
    reason: NoteRefusal,
    path: z.string(),
    message: z.string(),
  }),
]);
export type AddNoteResult = z.infer<typeof AddNoteResult>;
type Refused = Extract<AddNoteResult, { kind: 'refused' }>;

export interface AddNoteOptions {
  /** Create `dir` first (an app's data folder). A project folder is never created: leave this off for one. */
  createDir?: boolean;
  /** How long to wait for another writer's lock (default 3 s). */
  waitMs?: number;
  /** A lock older than this is a crashed writer's and is broken (default 10 s). */
  staleMs?: number;
  /** The record's time (default now). */
  now?: Date;
  /** The record's id (default `newNoteId()`). */
  id?: string;
}

/**
 * Append under the lock. `build` sees the file's records when `needsRead` (to check a resolve against what is on disk
 * now) and returns the record to append, or a refusal. Never throws.
 */
async function appendNote(
  dir: string,
  options: AddNoteOptions,
  needsRead: boolean,
  build: (records: NoteRecord[]) => NoteRecord | Refused,
): Promise<AddNoteResult> {
  const file = notesFilePath(dir);
  const refuse = (reason: Refused['reason'], message: string): Refused => ({
    kind: 'refused',
    reason,
    path: file,
    message,
  });
  try {
    if (options.createDir) await fs.mkdir(dir, { recursive: true });
    else if (!(await fs.stat(dir)).isDirectory())
      return refuse('io-error', `${dir} is not a directory`);
  } catch (error) {
    return refuse('io-error', errorMessage(error));
  }
  const lock = `${file}.lock`;
  if (!(await takeLock(lock, options.waitMs ?? 3000, options.staleMs ?? 10_000))) {
    return refuse('notes-busy', `${file} is being written by another writer (${lock}); try again.`);
  }
  try {
    let records: NoteRecord[] = [];
    if (needsRead) {
      const read = await readNotes(dir, { history: true });
      if (read.error) return refuse('io-error', read.error);
      records = read.records;
    }
    let record: NoteRecord | Refused;
    try {
      record = build(records);
    } catch (error) {
      return refuse('invalid-input', errorMessage(error));
    }
    if (record.kind === 'refused') return record;
    const line = `${JSON.stringify(record)}\n`;
    // A torn last line (a writer that died mid-line, a hand edit) must not swallow this record: start a fresh line.
    const lead = (await endsMidLine(file)) ? '\n' : '';
    await fs.appendFile(file, lead + line, 'utf8');
    return { kind: 'written', path: file, record };
  } catch (error) {
    return refuse('io-error', errorMessage(error));
  } finally {
    await fs.rm(lock, { force: true });
  }
}

async function endsMidLine(file: string): Promise<boolean> {
  let handle: fs.FileHandle;
  try {
    handle = await fs.open(file, 'r');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false;
    throw error;
  }
  try {
    const { size } = await handle.stat();
    if (size === 0) return false;
    const last = Buffer.alloc(1);
    await handle.read(last, 0, 1, size - 1);
    return last[0] !== 0x0a;
  } finally {
    await handle.close();
  }
}

/**
 * Append one note, ask or change to `<dir>/fli.notes.jsonl`. Fills `schema`, `id`, `at` and `status` (`note` → kept,
 * `ask` → open), and `channel` from `by` when not given. Refuses invalid input; never throws.
 */
export function addNote(
  dir: string,
  input: NoteInput,
  options: AddNoteOptions = {},
): Promise<AddNoteResult> {
  return appendNote(dir, options, false, () =>
    noteRecordOf(input, options.id ?? newNoteId(), (options.now ?? new Date()).toISOString()),
  );
}

/** What a write command knows at the door, for `logChange`. */
/**
 * The door log: append one `change` with `before` / `after` sized by `snapshotChange` (whole when small, an excerpt or
 * the changed keys when large). An empty `because` is treated as none.
 */
export function logChange(
  dir: string,
  change: ChangeInput,
  options: AddNoteOptions & SnapshotOptions = {},
): Promise<AddNoteResult> {
  const snapshot = snapshotChange(change.before, change.after, options);
  const links = {
    ...change.links,
    ...(change.session ? { session: change.session } : {}),
    ...(change.answers ? { answers: change.answers } : {}),
  };
  const because = change.because?.trim() ? change.because : undefined;
  return addNote(
    dir,
    {
      by: change.by,
      kind: 'change',
      target: change.target,
      ...(change.where ? { where: change.where } : {}),
      ...(because ? { text: because } : {}),
      ...snapshot,
      ...(change.producer ? { producer: change.producer } : {}),
      ...(Object.keys(links).length > 0 ? { links } : {}),
      ...(change.meta ? { meta: change.meta } : {}),
    },
    options,
  );
}

/**
 * Settle a record: append a `change` that targets it (`entityType: 'note'`, `field: 'state'`, before → after life
 * state, `text` = the reason, `links.to` = the pointer). The record's own line is never rewritten. Any record can be
 * settled (note, ask or change), to any state — `live` re-opens. Checked under the lock: refuses `invalid-input`
 * (`stale` without a reason, `used` / `replaced` without `to`), `note-not-found`, and `already-settled` (already in
 * that state).
 */
export function settleNote(
  dir: string,
  id: string,
  input: SettleInput,
  options: AddNoteOptions = {},
): Promise<AddNoteResult> {
  return settleWith(dir, id, input, options, () => null);
}

function settleWith(
  dir: string,
  id: string,
  input: SettleInput,
  options: AddNoteOptions,
  check: (
    target: NoteRecord,
    refused: (reason: NoteRefusal, message: string) => Refused,
  ) => Refused | null,
): Promise<AddNoteResult> {
  const file = notesFilePath(dir);
  return appendNote(dir, options, true, (records) => {
    const refused = (reason: NoteRefusal, message: string): Refused => ({
      kind: 'refused',
      reason,
      path: file,
      message,
    });
    const parsed = SettleInput.safeParse(input);
    if (!parsed.success) return refused('invalid-input', issuesOf(parsed.error).join('; '));
    const i = parsed.data;
    const target = records.find((r) => r.id === id && !isSettleLine(r));
    if (!target) return refused('note-not-found', `No record "${id}" in ${file}.`);
    const blocked = check(target, refused);
    if (blocked) return blocked;
    const before = noteStates(records).get(id)?.life ?? 'live';
    if (before === i.state) {
      return refused('already-settled', `"${id}" is already ${i.state}.`);
    }
    const reason = i.reason?.trim() ? i.reason : undefined;
    const links = {
      ...(i.to?.trim() ? { to: i.to } : {}),
      ...(i.session ? { session: i.session } : {}),
    };
    return noteRecordOf(
      {
        by: i.by,
        kind: 'change',
        where: target.where,
        target: {
          app: target.target.app,
          entityType: NOTE_ENTITY,
          entityId: id,
          field: SETTLE_FIELD,
        },
        ...(reason ? { text: reason } : {}),
        before,
        after: i.state,
        form: 'full',
        ...(Object.keys(links).length > 0 ? { links } : {}),
      },
      options.id ?? newNoteId(),
      (options.now ?? new Date()).toISOString(),
    );
  });
}

/**
 * v1's close-an-ask, kept as an alias: `settleNote` to `done`, asks only (`not-an-ask` otherwise), with `change` as the
 * pointer (`links.to`) and `because` as the reason. Refuses `already-settled` when the ask is already done.
 */
export function resolveAsk(
  dir: string,
  askId: string,
  input: ResolveAskInput,
  options: AddNoteOptions = {},
): Promise<AddNoteResult> {
  return settleWith(
    dir,
    askId,
    {
      by: input.by,
      state: 'done',
      ...(input.because !== undefined ? { reason: input.because } : {}),
      ...(input.change !== undefined ? { to: input.change } : {}),
      ...(input.session !== undefined ? { session: input.session } : {}),
    },
    options,
    (target, refused) =>
      target.kind === 'ask'
        ? null
        : refused('not-an-ask', `"${askId}" is a ${target.kind}, not an ask.`),
  );
}

export const NoteLineProblem = z.object({ line: z.int().min(1), message: z.string() });
export type NoteLineProblem = z.infer<typeof NoteLineProblem>;

export const NotesRead = z.object({
  path: z.string(),
  /** False when there is no notes file. An empty file and no file both have no records: this tells them apart. */
  exists: z.boolean(),
  /**
   * The records the filter answers with, in file order. Default: the `live` ones (settle lines left out). With
   * `history: true`: every valid line, settle lines included.
   */
  records: z.array(NoteRecord),
  /** Where every record in the file stands (by id), whatever the filter. */
  states: z.record(z.string(), NoteState),
  /** Lines that are not a record: listed, never hidden, never fatal. */
  invalid: z.array(NoteLineProblem),
  /** The file exists but could not be read. */
  error: z.string().optional(),
});
export type NotesRead = z.infer<typeof NotesRead>;

/**
 * Read `<dir>/fli.notes.jsonl`, line by line, folding settle lines into `states`. Answers the `live` records by default;
 * pass `{ history: true }` for the whole file, or any `NoteFilter`. Never throws: no file → `exists: false`; a bad line
 * → `invalid`. v1 files read: their asks' `open` / `done` map to `live` / `done`.
 */
export async function readNotes(dir: string, filter: NoteFilter = {}): Promise<NotesRead> {
  const f = NoteFilter.parse(filter);
  const file = notesFilePath(dir);
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT')
      return { path: file, exists: false, records: [], states: {}, invalid: [] };
    return {
      path: file,
      exists: true,
      records: [],
      states: {},
      invalid: [],
      error: errorMessage(error),
    };
  }
  const read: NotesRead = { path: file, exists: true, records: [], states: {}, invalid: [] };
  text.split('\n').forEach((raw, i) => {
    if (raw.trim() === '') return;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      read.invalid.push({ line: i + 1, message: `not JSON: ${errorMessage(error)}` });
      return;
    }
    const parsed = NoteRecord.safeParse(json);
    if (parsed.success) read.records.push(parsed.data);
    else read.invalid.push({ line: i + 1, message: issuesOf(parsed.error).join('; ') });
  });
  const states = noteStates(read.records);
  read.states = Object.fromEntries(states);
  read.records = read.records.filter((r) => matchesNote(r, f, states.get(r.id)));
  return read;
}

export const ScannedNote = z.object({
  /** The notes file the record is in. */
  path: z.string(),
  record: NoteRecord,
  /** Where the record stands now (`noteStates`); absent on a settle line. */
  state: NoteState.optional(),
});
export type ScannedNote = z.infer<typeof ScannedNote>;

export const NotesScan = z.object({
  /** Matching records across every file, oldest first. */
  notes: z.array(ScannedNote),
  /** Every notes file read. */
  files: z.array(z.string()),
  invalid: z.array(NoteLineProblem.extend({ path: z.string() })),
  /** Files or folders that could not be read: a scan that missed them says so. */
  errors: z.array(z.object({ path: z.string(), message: z.string() })),
});
export type NotesScan = z.infer<typeof NotesScan>;

export interface ScanNotesOptions {
  /** How many folder levels below each root to look (default 4: estate → brand → archived → bucket → project). */
  maxDepth?: number;
}

const SKIP_DIRS = new Set(['node_modules']);

/**
 * Every record matching `filter` under `roots` — "everything on D13" (root = the project folder) or "every change to a
 * StoryPilot script across all projects" (root = a brand root or the estate). A root may itself hold a notes file.
 * Below it, folders are walked to `maxDepth`; a project folder (one with `fli.studio.json`) is not walked into, and
 * neither are dot-folders or `node_modules`. Never throws: unreadable folders are listed in `errors`.
 */
export async function scanNotes(
  roots: string | readonly string[],
  filter: NoteFilter = {},
  options: ScanNotesOptions = {},
): Promise<NotesScan> {
  const f = NoteFilter.parse(filter);
  const maxDepth = options.maxDepth ?? 4;
  const scan: NotesScan = { notes: [], files: [], invalid: [], errors: [] };
  const seen = new Set<string>();

  const visit = async (dir: string, depth: number): Promise<void> => {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    let entries: Dirent[];
    try {
      entries = await fs.readdir(resolved, { withFileTypes: true });
    } catch (error) {
      scan.errors.push({ path: resolved, message: errorMessage(error) });
      return;
    }
    const names = new Set(entries.map((e) => e.name));
    if (names.has(NOTES_FILE)) {
      const read = await readNotes(resolved, { history: true });
      scan.files.push(read.path);
      if (read.error) scan.errors.push({ path: read.path, message: read.error });
      scan.invalid.push(...read.invalid.map((p) => ({ ...p, path: read.path })));
      const states = noteStates(read.records);
      for (const record of read.records) {
        const state = states.get(record.id);
        if (!matchesNote(record, f, state)) continue;
        scan.notes.push({ path: read.path, record, ...(state ? { state } : {}) });
      }
    }
    if (depth >= maxDepth || names.has(IDENTITY_FILE)) return;
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      await visit(path.join(resolved, entry.name), depth + 1);
    }
  };

  for (const root of [roots].flat()) await visit(root, 0);
  scan.notes.sort((a, b) => Date.parse(a.record.at) - Date.parse(b.record.at));
  return scan;
}
