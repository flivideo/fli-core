import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NOTES_FILE,
  NoteRecord,
  addNote,
  logChange,
  matchesNote,
  noteChannelOf,
  noteStates,
  notesFilePath,
  readNotes,
  resolveAsk,
  scanNotes,
  snapshotChange,
  type NoteExcerpt,
} from '../src/index.js';
import * as contracts from '../src/contracts.js';
import { buildTree, identity, tempDir } from './helpers/fixtures.js';

const script = {
  app: 'flistudio',
  entityType: 'storypilot.script',
  entityId: 'project',
  field: 'script',
};
const d13 = { brand: 'appydave', project: 'd13' };
const now = new Date('2026-10-31T16:00:00.000Z');

async function lines(dir: string): Promise<unknown[]> {
  const text = await fs.readFile(notesFilePath(dir), 'utf8');
  return text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as unknown);
}

describe('the record (browser-safe)', () => {
  it('ships on @flivideo/core/contracts', () => {
    expect(contracts.NoteRecord).toBe(NoteRecord);
    expect(contracts.snapshotChange).toBe(snapshotChange);
    expect(contracts.Stamp).toBeDefined();
  });

  it('names the channel from the principal', () => {
    expect(noteChannelOf('human:ui')).toBe('ui');
    expect(noteChannelOf('human')).toBe('ui');
    expect(noteChannelOf('human:chat')).toBe('chat');
    expect(noteChannelOf('human:voice')).toBe('voice');
    expect(noteChannelOf('agent:storypilot')).toBe('agent');
    expect(noteChannelOf('cli')).toBe('agent');
  });

  it('keeps kinds apart: notes and asks need words and carry no before/after; a change has no status', () => {
    const base = {
      schema: 1,
      id: 'n_1',
      at: now.toISOString(),
      by: 'human:ui',
      channel: 'ui',
      target: script,
    };
    expect(
      NoteRecord.safeParse({ ...base, kind: 'note', status: 'kept', text: 'hi' }).success,
    ).toBe(true);
    expect(NoteRecord.safeParse({ ...base, kind: 'note', status: 'kept' }).success).toBe(false);
    expect(NoteRecord.safeParse({ ...base, kind: 'ask', status: 'kept', text: 'x' }).success).toBe(
      false,
    );
    expect(
      NoteRecord.safeParse({ ...base, kind: 'note', status: 'kept', text: 'x', before: 'a' })
        .success,
    ).toBe(false);
    expect(NoteRecord.safeParse({ ...base, kind: 'change', status: 'open' }).success).toBe(false);
    expect(NoteRecord.safeParse({ ...base, kind: 'change' }).success).toBe(true);
    expect(NoteRecord.safeParse({ ...base, kind: 'rating', text: '👍' }).success).toBe(false);
  });

  it('a target names what it is about for its scope', () => {
    const base = {
      schema: 1,
      id: 'n_1',
      at: now.toISOString(),
      by: 'cli',
      channel: 'agent',
      kind: 'change',
    };
    const ok = (target: object) => NoteRecord.safeParse({ ...base, target }).success;
    expect(ok({ app: 'flicut', entityType: 'cut' })).toBe(false);
    expect(ok({ app: 'flicut', entityType: 'cut', scope: 'many', entityIds: ['a', 'b'] })).toBe(
      true,
    );
    expect(ok({ app: 'flicut', entityType: 'cut', scope: 'many', entityId: 'a' })).toBe(false);
    expect(
      ok({ app: 'flistudio', entityType: 'script', scope: 'aggregate', query: 'every script' }),
    ).toBe(true);
  });
});

describe('addNote', () => {
  it('appends a note, an ask and a change, one line each, filling id/at/status/channel', async () => {
    const dir = await tempDir();
    const note = await addNote(
      dir,
      { by: 'human:ui', kind: 'note', target: script, where: d13, text: 'cool' },
      { now },
    );
    const ask = await addNote(dir, {
      by: 'human:chat',
      kind: 'ask',
      target: script,
      text: 'change the opening',
    });
    const change = await addNote(dir, {
      by: 'agent:x',
      kind: 'change',
      target: script,
      before: 'a',
      after: 'b',
    });
    expect(note).toMatchObject({
      kind: 'written',
      path: path.join(dir, NOTES_FILE),
      record: {
        schema: 2,
        kind: 'note',
        channel: 'ui',
        at: now.toISOString(),
        where: d13,
      },
    });
    expect(ask).toMatchObject({ record: { kind: 'ask', channel: 'chat' } });
    for (const r of [note, ask, change]) {
      expect(r.kind === 'written' && r.record).not.toHaveProperty('status');
    }
    const written = await lines(dir);
    expect(written).toHaveLength(3);
    expect(written.map((l) => (l as { id: string }).id)).toEqual(
      [note, ask, change].map((r) => (r.kind === 'written' ? r.record.id : '')),
    );
    expect((written[0] as { id: string }).id).toMatch(/^n_[0-9a-f]{12}$/);
  });

  it('refuses invalid input without writing', async () => {
    const dir = await tempDir();
    const r = await addNote(dir, { by: 'human:ui', kind: 'note', target: script });
    expect(r).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    const bad = await addNote(dir, {
      by: 'nobody' as never,
      kind: 'note',
      target: script,
      text: 'x',
    });
    expect(bad).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    expect((await readNotes(dir)).exists).toBe(false);
  });

  it('never creates a project folder; creates an app data folder when asked', async () => {
    const root = await tempDir();
    const missing = path.join(root, 'nope');
    const input = {
      by: 'cli',
      kind: 'note',
      target: { app: 'flicut', entityType: 'app', entityId: 'flicut' },
      text: 'x',
    } as const;
    expect(await addNote(missing, input)).toMatchObject({ kind: 'refused', reason: 'io-error' });
    expect(await addNote(missing, input, { createDir: true })).toMatchObject({ kind: 'written' });
    await fs.writeFile(path.join(root, 'file'), '');
    expect(await addNote(path.join(root, 'file'), input)).toMatchObject({ reason: 'io-error' });
  });

  it('loses no line when many writers append at once', async () => {
    const dir = await tempDir();
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        addNote(dir, { by: 'agent:w', kind: 'note', target: script, text: `note ${i}` }),
      ),
    );
    expect(results.every((r) => r.kind === 'written')).toBe(true);
    const read = await readNotes(dir);
    expect(read.records).toHaveLength(25);
    expect(read.invalid).toEqual([]);
    expect(new Set(read.records.map((r) => r.text)).size).toBe(25);
  });

  it('answers busy when another writer holds the lock past the wait', async () => {
    const dir = await tempDir();
    await fs.writeFile(`${notesFilePath(dir)}.lock`, 'held');
    const r = await addNote(
      dir,
      { by: 'cli', kind: 'note', target: script, text: 'x' },
      { waitMs: 30 },
    );
    expect(r).toMatchObject({ kind: 'refused', reason: 'notes-busy' });
  });

  it('starts a fresh line after a torn last line', async () => {
    const dir = await tempDir();
    await fs.writeFile(notesFilePath(dir), '{"schema":1,"id":"torn"');
    await addNote(dir, { by: 'cli', kind: 'note', target: script, text: 'after the tear' });
    const read = await readNotes(dir);
    expect(read.records.map((r) => r.text)).toEqual(['after the tear']);
    expect(read.invalid).toEqual([{ line: 1, message: expect.stringContaining('not JSON') }]);
  });
});

describe('readNotes', () => {
  it('tells no file from an empty file, and lists bad lines instead of hiding them', async () => {
    const dir = await tempDir();
    expect(await readNotes(dir)).toEqual({
      path: notesFilePath(dir),
      exists: false,
      records: [],
      states: {},
      invalid: [],
    });
    await fs.writeFile(notesFilePath(dir), '');
    expect(await readNotes(dir)).toMatchObject({ exists: true, records: [], invalid: [] });
    await addNote(dir, { by: 'cli', kind: 'note', target: script, text: 'good' });
    await fs.appendFile(notesFilePath(dir), '{"kind":"note"}\n\n');
    const read = await readNotes(dir);
    expect(read.records).toHaveLength(1);
    expect(read.invalid).toEqual([{ line: 2, message: expect.any(String) }]);
  });

  it('reports an unreadable file as an error, not as empty', async () => {
    const dir = await tempDir();
    await fs.mkdir(notesFilePath(dir));
    const read = await readNotes(dir);
    expect(read.exists).toBe(true);
    expect(read.error).toBeTruthy();
  });
});

describe('logChange (the door log)', () => {
  it('writes exactly one change with before/after/by/at, and the because verbatim', async () => {
    const dir = await tempDir();
    const because = "I didn't like the starting line. Feel more like me.";
    const r = await logChange(
      dir,
      {
        by: 'agent:roamy',
        target: script,
        where: d13,
        before: 'Old line.',
        after: 'New line.',
        because,
        session: 's-1',
      },
      { now },
    );
    expect(r).toMatchObject({
      kind: 'written',
      record: {
        kind: 'change',
        by: 'agent:roamy',
        channel: 'agent',
        at: now.toISOString(),
        text: because,
        before: 'Old line.',
        after: 'New line.',
        form: 'full',
        links: { session: 's-1' },
      },
    });
    expect(await lines(dir)).toHaveLength(1);
  });

  it('logs a change with no because — still logged, just no why', async () => {
    const dir = await tempDir();
    const r = await logChange(dir, {
      by: 'human:ui',
      target: script,
      before: 1,
      after: 2,
      because: '  ',
    });
    expect(r.kind === 'written' && r.record).not.toHaveProperty('text');
    expect(r.kind === 'written' && r.record.links).toBeUndefined();
  });

  it('keeps an excerpt of a long script around the changed words, not the whole script', async () => {
    const dir = await tempDir();
    const body = Array.from({ length: 300 }, (_, i) => `Paragraph ${i} says something.`).join('\n');
    const before = `What do you do when the thing stopping someone isn't the camera?\n${body}`;
    const after = `My girlfriend is not a content creator.\n${body}`;
    const r = await logChange(dir, { by: 'agent:roamy', target: script, before, after });
    if (r.kind !== 'written') throw new Error(r.message);
    expect(r.record.form).toBe('excerpt');
    const b = r.record.before as NoteExcerpt;
    const a = r.record.after as NoteExcerpt;
    expect(b.text.slice(b.from, b.to)).toContain(
      "What do you do when the thing stopping someone isn't the camera?",
    );
    expect(a.text.slice(a.from, a.to)).toContain('My girlfriend is not a content creator.');
    expect(a.line).toBe(1);
    expect(a.length).toBe(after.length);
    expect(JSON.stringify(r.record).length).toBeLessThan(before.length / 3);
  });

  it('places an excerpt deep in a text by start and line', () => {
    const head = 'word '.repeat(1000);
    const snap = snapshotChange(`${head}\nold tail`, `${head}\nnew tail`, { context: 10 });
    const b = snap.before as NoteExcerpt;
    expect(snap.form).toBe('excerpt');
    expect(b.line).toBe(2);
    expect(b.text.slice(b.from, b.to)).toBe('old');
    expect(b.start).toBeGreaterThan(4900);
  });

  it('keeps only the changed keys of a large object, and large other values whole', () => {
    const big = { notes: 'x'.repeat(3000), feel: 'warm', do: 'teach' };
    const snap = snapshotChange(big, { ...big, feel: 'bold', extra: true });
    expect(snap).toEqual({
      before: { feel: 'warm' },
      after: { feel: 'bold', extra: true },
      form: 'keys',
    });
    const arr = ['y'.repeat(3000)];
    expect(snapshotChange(arr, [])).toEqual({ before: arr, after: [], form: 'full' });
    expect(snapshotChange(undefined, 'created')).toEqual({ after: 'created', form: 'full' });
  });
});

describe('asks: open until done', () => {
  it('a change answers an ask; resolveAsk closes it with a new line, never rewriting the ask', async () => {
    const dir = await tempDir();
    const ask = await addNote(dir, {
      by: 'human:chat',
      kind: 'ask',
      target: script,
      where: d13,
      text: 'new opening',
    });
    if (ask.kind !== 'written') throw new Error(ask.message);
    const change = await logChange(dir, {
      by: 'agent:roamy',
      target: script,
      before: 'a',
      after: 'b',
      answers: ask.record.id,
    });
    if (change.kind !== 'written') throw new Error(change.message);
    expect(change.record.links).toEqual({ answers: ask.record.id });

    let states = noteStates((await readNotes(dir)).records);
    expect(states.get(ask.record.id)).toEqual({ life: 'live', answeredBy: [change.record.id] });

    const done = await resolveAsk(dir, ask.record.id, {
      by: 'agent:roamy',
      change: change.record.id,
    });
    expect(done).toMatchObject({
      kind: 'written',
      record: {
        kind: 'change',
        where: d13,
        target: { app: 'flistudio', entityType: 'note', entityId: ask.record.id, field: 'state' },
        before: 'live',
        after: 'done',
        links: { to: change.record.id },
      },
    });
    const read = await readNotes(dir, { history: true });
    expect(read.records[0]).toEqual(ask.record);
    states = noteStates(read.records);
    expect(states.get(ask.record.id)).toMatchObject({
      life: 'done',
      to: change.record.id,
      answeredBy: [change.record.id],
    });
    expect(read.states[ask.record.id]).toEqual(states.get(ask.record.id));
    // The default read answers live records only: the done ask and its settle line are history.
    expect((await readNotes(dir)).records.map((r) => r.id)).toEqual([change.record.id]);

    expect(await resolveAsk(dir, ask.record.id, { by: 'cli' })).toMatchObject({
      reason: 'already-settled',
    });
  });

  it('refuses to resolve what is not an open ask', async () => {
    const dir = await tempDir();
    const note = await addNote(dir, { by: 'cli', kind: 'note', target: script, text: 'x' });
    if (note.kind !== 'written') throw new Error(note.message);
    expect(await resolveAsk(dir, 'n_nope', { by: 'cli' })).toMatchObject({
      reason: 'note-not-found',
    });
    expect(await resolveAsk(dir, note.record.id, { by: 'cli' })).toMatchObject({
      reason: 'not-an-ask',
    });
  });
});

describe('scanNotes', () => {
  async function estate() {
    const root = await tempDir();
    const brand = path.join(root, 'v-appydave');
    await buildTree(brand, {
      'd13-overlay-pilot/fli.studio.json': identity({ code: 'd13' }),
      'd13-overlay-pilot/sub/': null,
      'd14-other/fli.studio.json': identity({ code: 'd14' }),
      'archived/d00-d09/d05-old/fli.studio.json': identity({ code: 'd05' }),
      'node_modules/': null,
      '.hidden/': null,
    });
    const d13dir = path.join(brand, 'd13-overlay-pilot');
    const ask = await addNote(d13dir, {
      by: 'human:chat',
      kind: 'ask',
      target: script,
      where: d13,
      text: 'opening',
    });
    await logChange(d13dir, {
      by: 'agent:roamy',
      target: script,
      where: d13,
      before: 'a',
      after: 'b',
    });
    await addNote(path.join(brand, 'd14-other'), {
      by: 'human:ui',
      kind: 'note',
      target: { app: 'flicut', entityType: 'cut', entityId: 'v1' },
      where: { brand: 'appydave', project: 'd14' },
      text: 'tighten the gap',
    });
    await logChange(path.join(brand, 'archived/d00-d09/d05-old'), {
      by: 'human:ui',
      target: script,
      where: { brand: 'appydave', project: 'd05' },
      before: 'x',
      after: 'y',
    });
    // A notes file inside a project's subfolder is not the project's record and is not walked into.
    await addNote(path.join(d13dir, 'sub'), {
      by: 'cli',
      kind: 'note',
      target: script,
      text: 'stray',
    });
    return { root, brand, d13dir, askId: ask.kind === 'written' ? ask.record.id : '' };
  }

  it('answers "everything on D13" from the project folder', async () => {
    const { d13dir } = await estate();
    const scan = await scanNotes(d13dir);
    expect(scan.files).toEqual([notesFilePath(d13dir)]);
    expect(scan.notes.map((n) => n.record.kind)).toEqual(['ask', 'change']);
  });

  it('answers "every change to a StoryPilot script" across a brand, archive included', async () => {
    const { brand } = await estate();
    const scan = await scanNotes([brand], {
      kind: 'change',
      app: 'flistudio',
      entityType: 'storypilot.script',
    });
    expect(scan.notes.map((n) => n.record.where.project).sort()).toEqual(['d05', 'd13']);
    expect(scan.files).toHaveLength(3);
    expect(scan.errors).toEqual([]);
  });

  it('filters open asks, by project, by text; and an estate root reaches the brand', async () => {
    const { root, brand, d13dir, askId } = await estate();
    const open = await scanNotes(root, { open: true });
    expect(open.notes.map((n) => n.record.id)).toEqual([askId]);
    expect(open.notes[0]?.state).toEqual({ life: 'live', answeredBy: [] });
    await resolveAsk(d13dir, askId, { by: 'cli' });
    expect((await scanNotes(brand, { open: true })).notes).toEqual([]);
    expect((await scanNotes(brand, { project: 'd14', text: 'GAP' })).notes).toHaveLength(1);
    // The ask is done now: live-only by default, every state with history.
    expect((await scanNotes(brand, { kind: ['note', 'ask'] })).notes).toHaveLength(1);
    expect((await scanNotes(brand, { kind: ['note', 'ask'], history: true })).notes).toHaveLength(
      2,
    );
  });

  it('lists a root it cannot read instead of answering empty', async () => {
    const root = await tempDir();
    const scan = await scanNotes(path.join(root, 'missing'));
    expect(scan.notes).toEqual([]);
    expect(scan.errors).toHaveLength(1);
  });

  it('honours maxDepth', async () => {
    const { brand } = await estate();
    const shallow = await scanNotes(brand, {}, { maxDepth: 1 });
    expect(shallow.files).toHaveLength(2);
  });
});

describe('matchesNote', () => {
  const record = NoteRecord.parse({
    schema: 1,
    id: 'n_1',
    at: '2026-10-31T10:00:00.000Z',
    by: 'human:ui',
    kind: 'note',
    channel: 'ui',
    status: 'kept',
    where: { brand: 'appydave', project: 'd13', video: 'v1' },
    target: {
      app: 'flicut',
      entityType: 'clip',
      scope: 'many',
      entityIds: ['c1', 'c2'],
      field: 'in',
    },
    text: 'Highlight that word',
  });

  it('matches every field it names', () => {
    expect(matchesNote(record, {})).toBe(true);
    expect(matchesNote(record, { entityId: 'c2', field: 'in', video: 'v1', by: 'human:ui' })).toBe(
      true,
    );
    expect(matchesNote(record, { entityId: 'c3' })).toBe(false);
    expect(matchesNote(record, { since: '2026-10-31T17:00:00+07:00' })).toBe(true);
    expect(matchesNote(record, { since: '2026-10-31T11:00:00Z' })).toBe(false);
    expect(matchesNote(record, { until: '2026-10-31T09:00:00Z' })).toBe(false);
    expect(matchesNote(record, { open: true })).toBe(false);
    expect(matchesNote(record, { app: 'flistudio' })).toBe(false);
    expect(matchesNote(record, { entityType: 'cut' })).toBe(false);
    expect(matchesNote(record, { brand: 'aitldr' })).toBe(false);
    expect(matchesNote(record, { project: 'd14' })).toBe(false);
    expect(matchesNote(record, { video: 'v2' })).toBe(false);
    expect(matchesNote(record, { by: 'cli' })).toBe(false);
    expect(matchesNote(record, { field: 'out' })).toBe(false);
    expect(matchesNote(record, { text: 'nope' })).toBe(false);
    expect(matchesNote(record, { kind: 'ask' })).toBe(false);
  });
});
