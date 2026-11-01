import { promises as fs } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as contracts from '../src/contracts.js';
import {
  NOTE_REFUSALS,
  NoteRecord,
  addNote,
  isSettleLine,
  logChange,
  matchesNote,
  noteStates,
  notesFilePath,
  readNotes,
  resolveAsk,
  scanNotes,
  settleNote,
  type AddNoteResult,
  type NoteRecord as NoteRecordT,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

const variant = { app: 'flistudio', entityType: 'lab-variant', entityId: 'storypilot-lab:B' };

function written(r: AddNoteResult): NoteRecordT {
  if (r.kind !== 'written') throw new Error(`${r.reason}: ${r.message}`);
  return r.record;
}

async function noteIn(dir: string, text = 'white focus reads well'): Promise<NoteRecordT> {
  return written(await addNote(dir, { by: 'human:ui', kind: 'note', target: variant, text }));
}

describe('life states: settle lines', () => {
  it('every record starts live; a settle line moves it, carrying its reason and pointer', async () => {
    const dir = await tempDir();
    const note = await noteIn(dir);
    expect((await readNotes(dir)).states[note.id]).toEqual({ life: 'live', answeredBy: [] });

    const used = written(
      await settleNote(dir, note.id, {
        by: 'agent:lab',
        state: 'used',
        to: 'storypilot page v2',
        reason: 'promoted variant B',
        session: 's-9',
      }),
    );
    expect(used).toMatchObject({
      schema: 2,
      kind: 'change',
      target: { app: 'flistudio', entityType: 'note', entityId: note.id, field: 'state' },
      before: 'live',
      after: 'used',
      text: 'promoted variant B',
      links: { to: 'storypilot page v2', session: 's-9' },
    });
    expect(isSettleLine(used)).toBe(true);
    expect((await readNotes(dir)).states[note.id]).toEqual({
      life: 'used',
      settledBy: used.id,
      reason: 'promoted variant B',
      to: 'storypilot page v2',
      answeredBy: [],
    });
  });

  it('asks for what each state needs: stale a reason, used and replaced a pointer', async () => {
    const dir = await tempDir();
    const note = await noteIn(dir);
    for (const [state, extra] of [
      ['stale', { to: 'x' }],
      ['used', { reason: 'why' }],
      ['replaced', { reason: 'newer' }],
    ] as const) {
      const r = await settleNote(dir, note.id, { by: 'cli', state, ...extra });
      expect(r, state).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    }
    expect(
      await settleNote(dir, note.id, { by: 'cli', state: 'stale', reason: '  ' }),
    ).toMatchObject({
      reason: 'invalid-input',
    });
    expect(
      await settleNote(dir, note.id, { by: 'cli', state: 'stale', reason: 'interface moved on' }),
    ).toMatchObject({ kind: 'written', record: { after: 'stale', text: 'interface moved on' } });
    const newer = await noteIn(dir, 'the newer thought');
    expect(
      await settleNote(dir, note.id, { by: 'cli', state: 'replaced', to: newer.id }),
    ).toMatchObject({
      kind: 'written',
      record: { before: 'stale', after: 'replaced', links: { to: newer.id } },
    });
    // `done` needs nothing; the read pointer and reason of a later line replace the earlier ones.
    const done = written(await settleNote(dir, note.id, { by: 'cli', state: 'done' }));
    expect((await readNotes(dir)).states[note.id]).toEqual({
      life: 'done',
      settledBy: done.id,
      answeredBy: [],
    });
  });

  it('re-opens to live, refuses a no-op and unknown ids, and settles a change too', async () => {
    const dir = await tempDir();
    const note = await noteIn(dir);
    expect(await settleNote(dir, note.id, { by: 'cli', state: 'live' })).toMatchObject({
      reason: 'already-settled',
    });
    const done = written(await settleNote(dir, note.id, { by: 'cli', state: 'done' }));
    expect(await settleNote(dir, note.id, { by: 'cli', state: 'done' })).toMatchObject({
      reason: 'already-settled',
    });
    written(
      await settleNote(dir, note.id, {
        by: 'human:ui',
        state: 'live',
        reason: 'not done after all',
      }),
    );
    expect((await readNotes(dir)).states[note.id]?.life).toBe('live');
    expect(await settleNote(dir, done.id, { by: 'cli', state: 'done' })).toMatchObject({
      reason: 'note-not-found',
    });
    expect(await settleNote(dir, 'n_nope', { by: 'cli', state: 'done' })).toMatchObject({
      reason: 'note-not-found',
    });

    const change = written(
      await logChange(dir, { by: 'human:ui', target: variant, before: 'a', after: 'b' }),
    );
    expect(
      await settleNote(dir, change.id, { by: 'cli', state: 'stale', reason: 'reverted' }),
    ).toMatchObject({ kind: 'written' });
    expect((await readNotes(dir)).states[change.id]?.life).toBe('stale');
  });

  it('resolveAsk is settle-to-done for asks only', async () => {
    const dir = await tempDir();
    const note = await noteIn(dir);
    expect(await resolveAsk(dir, note.id, { by: 'cli' })).toMatchObject({ reason: 'not-an-ask' });
    const ask = written(
      await addNote(dir, { by: 'human:chat', kind: 'ask', target: variant, text: 'try terminal' }),
    );
    expect(await resolveAsk(dir, ask.id, { by: 'cli', because: 'built C' })).toMatchObject({
      kind: 'written',
      record: { before: 'live', after: 'done', text: 'built C' },
    });
  });
});

describe('readers default to live, with history on request', () => {
  async function mixed() {
    const dir = await tempDir();
    const live = await noteIn(dir, 'live one');
    const stale = await noteIn(dir, 'stale one');
    const done = await noteIn(dir, 'done one');
    written(
      await settleNote(dir, stale.id, { by: 'cli', state: 'stale', reason: 'thinking changed' }),
    );
    written(await settleNote(dir, done.id, { by: 'cli', state: 'done' }));
    return { dir, live, stale, done };
  }

  it('readNotes: live by default; history is the whole file; state picks states', async () => {
    const { dir, live, stale, done } = await mixed();
    expect((await readNotes(dir)).records.map((r) => r.id)).toEqual([live.id]);
    const history = await readNotes(dir, { history: true });
    expect(history.records).toHaveLength(5);
    expect(history.records.filter(isSettleLine)).toHaveLength(2);
    expect((await readNotes(dir, { state: 'stale' })).records.map((r) => r.id)).toEqual([stale.id]);
    expect((await readNotes(dir, { state: ['done', 'live'] })).records.map((r) => r.id)).toEqual([
      live.id,
      done.id,
    ]);
    expect(Object.keys((await readNotes(dir)).states)).toHaveLength(3);
  });

  it('scanNotes: the same defaults across folders', async () => {
    const { dir, live } = await mixed();
    expect((await scanNotes(dir)).notes.map((n) => n.record.id)).toEqual([live.id]);
    const all = await scanNotes(dir, { history: true });
    expect(all.notes).toHaveLength(5);
    expect(all.notes.filter((n) => n.state === undefined)).toHaveLength(2);
    expect((await scanNotes(dir, { state: 'stale', text: 'STALE' })).notes).toHaveLength(1);
  });

  it('matchesNote: settle lines only with history, never with a state or open filter', () => {
    const line = NoteRecord.parse({
      schema: 2,
      id: 'n_s',
      at: '2026-11-01T00:00:00Z',
      by: 'cli',
      kind: 'change',
      channel: 'agent',
      target: { app: 'x', entityType: 'note', entityId: 'n_1', field: 'state' },
      before: 'live',
      after: 'done',
    });
    expect(matchesNote(line, {})).toBe(false);
    expect(matchesNote(line, { history: true })).toBe(true);
    expect(matchesNote(line, { history: true, state: 'done' })).toBe(false);
    expect(matchesNote(line, { history: true, open: true })).toBe(false);
  });
});

describe('v1 files still read', () => {
  const v1 = (fields: object) =>
    JSON.stringify({ schema: 1, by: 'human:ui', channel: 'ui', ...fields });
  const target = { app: 'flistudio', entityType: 'storypilot.script', entityId: 'project' };

  it('maps kept → live, open → live, a v1 status change to done (pointer from follows)', async () => {
    const dir = await tempDir();
    await fs.writeFile(
      notesFilePath(dir),
      [
        v1({
          id: 'n_note',
          at: '2026-10-31T10:00:00Z',
          kind: 'note',
          status: 'kept',
          target,
          text: 'a note',
        }),
        v1({
          id: 'n_open',
          at: '2026-10-31T10:01:00Z',
          kind: 'ask',
          status: 'open',
          target,
          text: 'open ask',
        }),
        v1({
          id: 'n_ask',
          at: '2026-10-31T10:02:00Z',
          kind: 'ask',
          status: 'open',
          target,
          text: 'done ask',
        }),
        v1({
          id: 'n_chg',
          at: '2026-10-31T10:03:00Z',
          by: 'agent:roamy',
          channel: 'agent',
          kind: 'change',
          target,
          before: 'a',
          after: 'b',
          form: 'full',
          links: { answers: 'n_ask' },
        }),
        v1({
          id: 'n_res',
          at: '2026-10-31T10:04:00Z',
          kind: 'change',
          target: { app: 'flistudio', entityType: 'note', entityId: 'n_ask', field: 'status' },
          before: 'open',
          after: 'done',
          form: 'full',
          links: { follows: 'n_chg' },
        }),
      ].join('\n') + '\n',
    );
    const read = await readNotes(dir);
    expect(read.invalid).toEqual([]);
    expect(read.records.map((r) => r.id)).toEqual(['n_note', 'n_open', 'n_chg']);
    expect(read.states.n_ask).toEqual({
      life: 'done',
      settledBy: 'n_res',
      to: 'n_chg',
      answeredBy: ['n_chg'],
    });
    expect((await scanNotes(dir, { open: true })).notes.map((n) => n.record.id)).toEqual([
      'n_open',
    ]);
    expect(await resolveAsk(dir, 'n_ask', { by: 'cli' })).toMatchObject({
      reason: 'already-settled',
    });

    // A v1 file takes v2 lines: the open ask settles, a new note is schema 2.
    expect(await resolveAsk(dir, 'n_open', { by: 'cli' })).toMatchObject({
      record: { schema: 2, before: 'live', after: 'done' },
    });
    expect((await noteIn(dir)).schema).toBe(2);
    expect(noteStates((await readNotes(dir, { history: true })).records).get('n_open')?.life).toBe(
      'done',
    );
  });

  it('holds v1 rules for schema 1 lines and drops status from schema 2', () => {
    const base = {
      id: 'n_1',
      at: '2026-11-01T00:00:00Z',
      by: 'cli',
      channel: 'agent',
      target,
      text: 'x',
    };
    expect(NoteRecord.safeParse({ ...base, schema: 1, kind: 'note' }).success).toBe(false);
    expect(NoteRecord.safeParse({ ...base, schema: 2, kind: 'note' }).success).toBe(true);
    expect(NoteRecord.safeParse({ ...base, schema: 2, kind: 'note', status: 'kept' }).success).toBe(
      false,
    );
    expect(NoteRecord.safeParse({ ...base, schema: 3, kind: 'note' }).success).toBe(false);
  });
});

describe('app-neutral shape', () => {
  it('where takes any string key beside brand/project/video', async () => {
    const dir = await tempDir();
    const r = written(
      await addNote(dir, {
        by: 'human:ui',
        kind: 'note',
        target: { app: 'invoices', entityType: 'row', entityId: 'inv-42' },
        where: { workspace: 'acme', sheet: 'q4' },
        text: 'this total looks off',
      }),
    );
    expect(r.where).toEqual({ workspace: 'acme', sheet: 'q4' });
    expect(
      await addNote(dir, {
        by: 'cli',
        kind: 'note',
        target: variant,
        where: { workspace: 3 } as never,
        text: 'x',
      }),
    ).toMatchObject({ reason: 'invalid-input' });
  });

  it('exports the refusal names (no numbers) and the life-state shapes on /contracts', () => {
    expect(NOTE_REFUSALS).toEqual([
      'invalid-input',
      'io-error',
      'notes-busy',
      'note-not-found',
      'not-an-ask',
      'already-settled',
    ]);
    for (const name of [
      'NOTE_REFUSALS',
      'NoteRefusal',
      'LifeState',
      'SettleInput',
      'isSettleLine',
      'SETTLE_FIELD',
    ]) {
      expect((contracts as Record<string, unknown>)[name], name).toBeDefined();
    }
  });
});
