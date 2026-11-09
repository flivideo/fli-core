import { describe, expect, it } from 'vitest';
import {
  NoteRecord,
  TellMessage,
  addNote,
  isSettleLine,
  logChange,
  noteRecordOf,
  noteStates,
  readNotes,
  tellDeliveryChange,
  tellLine,
  tellNoteInput,
} from '../src/index.js';
import * as contracts from '../src/contracts.js';
import { tempDir } from './helpers/fixtures.js';

const message = (over: Partial<TellMessage> = {}): TellMessage => ({
  v: 1,
  app: 'quillpad',
  open: { kind: 'document', id: 'chapter-2.md' },
  moment: {
    capturedAt: '2026-01-02T03:04:05.000Z',
    origin: 'key',
    position: { unit: 'line', value: 42, label: 'line 42' },
  },
  said: { text: 'This sentence repeats itself', channel: 'ui' },
  from: 'human:ui',
  to: { kind: 'conversation', id: 'session-1', label: 'writing-desk' },
  detail: { quillpad: { paragraph: 7, wordCount: 120 } },
  ...over,
});

describe('TellMessage', () => {
  it('takes any app: the common part names no video field', () => {
    expect(TellMessage.safeParse(message()).success).toBe(true);
    const common = Object.keys(TellMessage.parse(message())).join(' ');
    expect(common).not.toMatch(/video|cut|media|timeline|edit/i);
  });

  it('holds the app block under exactly one key, the app', () => {
    expect(TellMessage.safeParse(message({ detail: { other: {} } })).success).toBe(false);
    expect(TellMessage.safeParse(message({ detail: {} })).success).toBe(false);
    expect(TellMessage.safeParse(message({ detail: { quillpad: {}, other: {} } })).success).toBe(
      false,
    );
  });

  it('lets a later voice moment through: no words, and a field this version has never seen', () => {
    const later = message({
      said: { channel: 'voice', audio: 'clip-1.m4a' } as TellMessage['said'],
      moment: { ...message().moment, origin: 'voice-marker' },
    });
    const parsed = TellMessage.parse(later);
    expect((parsed.said as Record<string, unknown>).audio).toBe('clip-1.m4a');
    expect(parsed.said.text).toBeUndefined();
  });

  it('is exported from the browser-safe entry too', () => {
    expect(contracts.TellMessage).toBe(TellMessage);
  });
});

describe('tellNoteInput', () => {
  it('is an ordinary note whose meta carries the message, and old readers keep it', () => {
    const record = noteRecordOf(tellNoteInput(message()), 'n_1', '2026-01-02T03:04:06.000Z');
    expect(record.kind).toBe('note');
    expect(record.text).toBe('This sentence repeats itself');
    expect(record.target).toMatchObject({
      app: 'quillpad',
      entityType: 'moment',
      entityId: 'chapter-2.md@42',
    });
    expect(TellMessage.parse(NoteRecord.parse(record).meta?.tell)).toMatchObject({
      app: 'quillpad',
    });
  });

  it('targets what was pointed at, when something was', () => {
    const pointed = message({
      moment: {
        ...message().moment,
        origin: 'pointer',
        pointedAt: { entityType: 'paragraph', entityId: 'p7' },
      },
    });
    expect(tellNoteInput(pointed).target).toMatchObject({
      entityType: 'paragraph',
      entityId: 'p7',
    });
  });

  it('can be an ask, and uses the stand-in when there are no words', () => {
    expect(tellNoteInput(message(), { kind: 'ask' }).kind).toBe('ask');
    const voice = message({ said: { channel: 'voice' } });
    expect(tellNoteInput(voice, { standIn: '(voice note)' }).text).toBe('(voice note)');
  });

  it('refuses a bad message', () => {
    expect(() => tellNoteInput(message({ detail: {} }))).toThrow();
  });
});

describe('the delivery line', () => {
  const delivery = {
    outcome: 'refused' as const,
    conversation: 'session-1',
    at: '2026-01-02T03:04:07.000Z',
    error: 'writing-desk is busy.',
  };

  it('is a change on the note that leaves its life state alone, and a retry adds a line, not a note', async () => {
    const dir = await tempDir();
    const saved = await addNote(dir, tellNoteInput(message()));
    if (saved.kind !== 'written') throw new Error(saved.message);
    const id = saved.record.id;
    await logChange(dir, tellDeliveryChange(message(), id, delivery));
    await logChange(
      dir,
      tellDeliveryChange(message(), id, { ...delivery, outcome: 'confirmed', error: undefined }),
    );
    const all = await readNotes(dir, { history: true });
    expect(all.records.filter((r) => r.kind === 'note')).toHaveLength(1);
    const lines = all.records.filter((r) => r.kind === 'change');
    expect(lines.map((r) => r.after)).toMatchObject([
      { outcome: 'refused' },
      { outcome: 'confirmed' },
    ]);
    expect(lines.some(isSettleLine)).toBe(false);
    expect(noteStates(all.records).get(id)?.life).toBe('live');
  });
});

describe('tellLine', () => {
  const ref = { noteId: 'n_abc', notesFile: '/tmp/x/fli.notes.jsonl' };

  it('starts with the fixed prefix, carries the words, the place and the note', () => {
    const line = tellLine(message(), ref);
    expect(line.startsWith('[quillpad moment] This sentence repeats itself')).toBe(true);
    expect(line).toContain('at line 42');
    expect(line).toContain('note n_abc in /tmp/x/fli.notes.jsonl');
    expect(line).toContain('"paragraph":7');
  });

  it('can never start as a command, whatever the words are', () => {
    const line = tellLine(message({ said: { text: '/compact !rm', channel: 'ui' } }), ref);
    expect(line.startsWith('[')).toBe(true);
  });

  it('is one line', () => {
    const line = tellLine(message({ said: { text: 'two\nlines', channel: 'ui' } }), ref);
    expect(line).not.toContain('\n');
    expect(line).toContain('two lines');
  });

  it('over the limit drops detail fields in order, and says which', () => {
    const big = message({ detail: { quillpad: { keep: 1, huge: 'x'.repeat(500) } } });
    const line = tellLine(big, { ...ref, maxChars: 400, dropOrder: ['huge'] });
    expect(line.length).toBeLessThanOrEqual(400);
    expect(line).not.toContain('xxx');
    expect(line).toContain('"keep":1');
    expect(line).toContain('"dropped":["huge"]');
    expect(line).toContain('n_abc');
  });

  it('drops the whole block, then shortens the words, and always keeps the note', () => {
    const noOrder = message({ detail: { quillpad: { huge: 'x'.repeat(500) } } });
    expect(tellLine(noOrder, { ...ref, maxChars: 400 })).toContain('"dropped":["detail"]');
    const long = message({
      said: { text: 'y'.repeat(900), channel: 'ui' },
      detail: { quillpad: { huge: 'x'.repeat(500) } },
    });
    const line = tellLine(long, { ...ref, maxChars: 400 });
    expect(line.length).toBeLessThanOrEqual(400);
    expect(line).toContain('words shortened');
    expect(line).toContain('n_abc');
  });

  it('says so when a moment has no words', () => {
    expect(tellLine(message({ said: { channel: 'voice' } }), ref)).toContain('(no words)');
  });

  it('skips a named field that is not there', () => {
    const big = message({ detail: { quillpad: { huge: 'x'.repeat(500) } } });
    expect(tellLine(big, { ...ref, maxChars: 400, dropOrder: ['absent', 'huge'] })).toContain(
      '"dropped":["huge"]',
    );
  });

  it('uses the plain value when a position has no label', () => {
    const plain = message({
      moment: { ...message().moment, position: { unit: 'line', value: 9 } },
    });
    expect(tellLine(plain, ref)).toContain('at 9');
  });
});
