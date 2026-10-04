import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_WORDS,
  WORDS_FILE,
  addWord,
  addWordAt,
  changeWordsFile,
  fillersOf,
  mergeWords,
  readWords,
  rememberWord,
  removeWord,
  removeWordAt,
  vocabularyOf,
  writeWordsFile,
  type WordsFile,
} from '../src/words.js';
import { stampOf } from '../src/stamp.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const NOW = new Date('2026-09-24T09:00:00.000Z');
const add = (file: WordsFile, input: Parameters<typeof addWord>[1], by = 'human:ui') =>
  addWord(file, input, by, NOW);

describe('the stamp', () => {
  it('records who and when; refuses a name that is not a principal', () => {
    expect(stampOf('agent:flicut', NOW)).toEqual({
      at: '2026-09-24T09:00:00.000Z',
      by: 'agent:flicut',
    });
    expect(() => stampOf('root', NOW)).toThrow();
  });
});

describe('addWord / removeWord', () => {
  it('stamps every entry and replaces on the same key, case-insensitively', () => {
    let f = add(EMPTY_WORDS, {
      kind: 'name',
      term: 'AppyDave',
      heardAs: ['happy dave', 'Happy Dave'],
    });
    f = add(f, { kind: 'name', term: 'appydave', heardAs: ['apy dave'] }, 'agent:claude');
    expect(f.names).toEqual([
      {
        term: 'appydave',
        heardAs: ['apy dave'],
        changed: { at: NOW.toISOString(), by: 'agent:claude' },
      },
    ]);
    expect(
      add(EMPTY_WORDS, { kind: 'name', term: 'X', heardAs: ['a', 'A'] }).names[0]?.heardAs,
    ).toEqual(['a']);
    expect(EMPTY_WORDS.names).toEqual([]);
  });

  it('adds rules, fillers (per language) and offs', () => {
    let f = add(EMPTY_WORDS, { kind: 'rule', find: 'fli cut', write: 'FliCut' });
    f = add(f, { kind: 'filler', word: 'um' });
    f = add(f, { kind: 'filler', word: 'like', never: true });
    f = add(f, { kind: 'filler', word: 'eh', lang: 'es' });
    f = add(f, { kind: 'off', of: 'name', text: 'Suno' });
    f = add(f, { kind: 'off', of: 'name', text: 'suno' });
    expect(f.rules.map((r) => r.write)).toEqual(['FliCut']);
    expect(f.fillers.map((x) => [x.lang, x.word, x.never ?? false])).toEqual([
      ['en', 'um', false],
      ['en', 'like', true],
      ['es', 'eh', false],
    ]);
    expect(f.off).toHaveLength(1);
  });

  it('removes by kind and text, and says what went', () => {
    let f = add(EMPTY_WORDS, { kind: 'name', term: 'Suno' });
    f = add(f, { kind: 'filler', word: 'eh', lang: 'es' });
    f = add(f, { kind: 'rule', find: 'ok', write: 'OK' });
    f = add(f, { kind: 'off', of: 'rule', text: 'x' });
    const a = removeWord(f, { kind: 'name', text: 'SUNO' });
    expect(a.removed).toMatchObject({ term: 'Suno' });
    expect(a.file.names).toEqual([]);
    expect(removeWord(f, { kind: 'filler', text: 'es:eh' }).file.fillers).toEqual([]);
    expect(removeWord(f, { kind: 'filler', text: 'eh' }).removed).toBeNull();
    expect(removeWord(f, { kind: 'rule', text: 'OK' }).file.rules).toEqual([]);
    expect(removeWord(f, { kind: 'off', text: 'x' }).file.off).toEqual([]);
    expect(removeWord(f, { kind: 'name', text: 'nope' })).toMatchObject({ removed: null });
  });

  it('refuses empty text', () => {
    expect(() => add(EMPTY_WORDS, { kind: 'name', term: '  ' })).toThrow();
  });
});

describe('mergeWords', () => {
  const global = add(add(EMPTY_WORDS, { kind: 'name', term: 'FliCut', heardAs: ['flick cut'] }), {
    kind: 'filler',
    word: 'um',
  });
  let brand = add(EMPTY_WORDS, { kind: 'name', term: 'Suno' });
  brand = add(brand, { kind: 'name', term: 'flicut', heardAs: ['fly cut'] });
  brand = add(brand, { kind: 'rule', find: 'okay', write: 'OK' });
  brand = add(brand, { kind: 'filler', word: 'right' });
  let project = add(EMPTY_WORDS, { kind: 'off', of: 'name', text: 'suno' });
  project = add(project, { kind: 'rule', find: 'OKAY', write: 'okay' });
  project = add(project, { kind: 'filler', word: 'right', never: true });
  project = add(project, { kind: 'off', of: 'filler', text: 'en:um' });

  it('lets the lower level win, keeps heardAs from every level, and says where each came from', () => {
    const m = mergeWords({ global, brand, project });
    expect(m.names).toEqual([
      expect.objectContaining({ term: 'flicut', heardAs: ['flick cut', 'fly cut'], from: 'brand' }),
    ]);
    expect(m.rules).toEqual([expect.objectContaining({ write: 'okay', from: 'project' })]);
    expect(fillersOf(m)).toEqual({ fillers: [], never: ['right'] });
    expect(m.off.map((o) => [o.kind, o.from])).toEqual([
      ['name', 'project'],
      ['filler', 'project'],
    ]);
    expect(vocabularyOf(m)).toEqual(['flicut']);
  });

  it('an off never hides the same level’s own entry', () => {
    const own = add(add(EMPTY_WORDS, { kind: 'off', of: 'name', text: 'X' }), {
      kind: 'name',
      term: 'X',
    });
    expect(vocabularyOf(mergeWords({ project: own }))).toEqual(['X']);
  });

  it('an absent level is empty', () => {
    expect(mergeWords({})).toEqual({ names: [], rules: [], fillers: [], off: [] });
    expect(fillersOf(mergeWords({ global }), 'es')).toEqual({ fillers: [], never: [] });
  });
});

describe('readWords / writeWordsFile', () => {
  it('reads the three levels, counting absent and unusable files as empty', async () => {
    const dir = await tempDir();
    const g = add(EMPTY_WORDS, { kind: 'name', term: 'FliVideo' });
    const p = add(EMPTY_WORDS, { kind: 'name', term: 'Pocket 4' });
    await buildTree(dir, {
      'config/fli.words.json': g,
      'v-appydave/fli.words.json': '{ nope',
      'v-appydave/d04-tour/fli.words.json': p,
    });
    const read = await readWords({
      globalFile: path.join(dir, 'config', WORDS_FILE),
      brandRoot: path.join(dir, 'v-appydave'),
      projectDir: path.join(dir, 'v-appydave', 'd04-tour'),
    });
    expect(vocabularyOf(read.words)).toEqual(['FliVideo', 'Pocket 4']);
    expect(read.levels.brand).toBeNull();
    expect(read.invalid).toEqual([expect.objectContaining({ reason: 'not-json' })]);
    expect((await readWords({})).words.names).toEqual([]);
  });

  it('fills defaults for a minimal file', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'fli.words.json': { schema: 1 } });
    const read = await readWords({ projectDir: dir });
    expect(read.levels.project).toEqual(EMPTY_WORDS);
  });

  it('writes atomically, refuses a bad file or a missing folder', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    const words = add(EMPTY_WORDS, { kind: 'name', term: 'Kybernesis' });
    expect(await writeWordsFile(file, words)).toEqual({ kind: 'written', path: file });
    expect(JSON.parse(await fs.readFile(file, 'utf8'))).toEqual(words);
    const bad = await writeWordsFile(file, { ...words, schema: 2 } as unknown as WordsFile);
    expect(bad).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    const gone = await writeWordsFile(path.join(dir, 'nope', WORDS_FILE), words);
    expect(gone).toMatchObject({ kind: 'refused', reason: 'io-error' });
    await fs.writeFile(path.join(dir, 'plain'), '');
    const notDir = await writeWordsFile(path.join(dir, 'plain', WORDS_FILE), words);
    expect(notDir).toMatchObject({ kind: 'refused', reason: 'io-error' });
  });
});

describe('changeWordsFile / addWordAt / removeWordAt — the one write path', () => {
  it('re-reads what is on disk and merges into it, stamped', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    await buildTree(dir, { [WORDS_FILE]: add(EMPTY_WORDS, { kind: 'name', term: 'AppyDave' }) });
    const out = await addWordAt(file, { kind: 'name', term: 'FliCut' }, 'agent:flicut', {
      now: NOW,
    });
    expect(out).toMatchObject({ kind: 'written', path: file });
    const onDisk = JSON.parse(await fs.readFile(file, 'utf8')) as WordsFile;
    expect(onDisk.names.map((n) => n.term)).toEqual(['AppyDave', 'FliCut']);
    expect(onDisk.names[1]?.changed).toEqual({ at: NOW.toISOString(), by: 'agent:flicut' });
    await expect(fs.stat(`${file}.lock`)).rejects.toThrow();
  });

  it('starts an absent file from empty; removes, and refuses not-found', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    await addWordAt(file, { kind: 'rule', find: 'fly studio', write: 'FliStudio' }, 'human:ui');
    expect(await removeWordAt(file, { kind: 'rule', text: 'Fly Studio' })).toMatchObject({
      kind: 'written',
      words: { rules: [] },
    });
    expect(await removeWordAt(file, { kind: 'rule', text: 'fly studio' })).toMatchObject({
      kind: 'refused',
      reason: 'not-found',
    });
  });

  it('never loses a concurrent writer: twenty parallel adds all land', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    const terms = Array.from({ length: 20 }, (_, i) => `Term ${i}`);
    const outs = await Promise.all(
      terms.map((term) => addWordAt(file, { kind: 'name', term }, 'human:ui')),
    );
    expect(outs.every((o) => o.kind === 'written')).toBe(true);
    const read = await readWords({ projectDir: dir });
    expect(new Set(vocabularyOf(read.words))).toEqual(new Set(terms));
  });

  it('refuses an unusable file instead of overwriting it, and bad input', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    await buildTree(dir, { [WORDS_FILE]: '{ hand-edited' });
    expect(await addWordAt(file, { kind: 'name', term: 'X' }, 'human:ui')).toMatchObject({
      kind: 'refused',
      reason: 'unusable-file',
    });
    expect(await fs.readFile(file, 'utf8')).toBe('{ hand-edited');
    const other = path.join(dir, 'sub', WORDS_FILE);
    await fs.mkdir(path.dirname(other));
    expect(await addWordAt(other, { kind: 'name', term: '' }, 'human:ui')).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
    expect(await addWordAt(other, { kind: 'name', term: 'X' }, 'root')).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
  });

  it('waits for a held lock, reports busy, and breaks a stale one', async () => {
    const dir = await tempDir();
    const file = path.join(dir, WORDS_FILE);
    await fs.writeFile(`${file}.lock`, 'someone');
    const busy = await addWordAt(file, { kind: 'name', term: 'X' }, 'human:ui', { waitMs: 50 });
    expect(busy).toMatchObject({ kind: 'refused', reason: 'busy' });
    const old = new Date(Date.now() - 60_000);
    await fs.utimes(`${file}.lock`, old, old);
    expect(await addWordAt(file, { kind: 'name', term: 'X' }, 'human:ui')).toMatchObject({
      kind: 'written',
    });
  });

  it('creates the folder only when asked (the global level), never a brand or project', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'config', 'appydave', WORDS_FILE);
    expect(await changeWordsFile(file, (w) => w)).toMatchObject({
      kind: 'refused',
      reason: 'io-error',
    });
    expect(await changeWordsFile(file, (w) => w, { createDir: true })).toMatchObject({
      kind: 'written',
    });
    await fs.writeFile(path.join(dir, 'plain'), '');
    expect(await changeWordsFile(path.join(dir, 'plain', WORDS_FILE), (w) => w)).toMatchObject({
      kind: 'refused',
      reason: 'io-error',
    });
  });
});

describe('rememberWord — by level', () => {
  it('"remember for this video" writes the project file; the brand file stays untouched', async () => {
    const dir = await tempDir();
    const brandRoot = path.join(dir, 'v-appydave');
    const projectDir = path.join(brandRoot, 'd01-flivideo-tour');
    await buildTree(dir, { 'v-appydave/d01-flivideo-tour/': null });
    const where = { brandRoot, projectDir, globalFile: path.join(dir, 'cfg', WORDS_FILE) };
    const out = await rememberWord('project', where, { kind: 'name', term: 'D06' }, 'human:ui');
    expect(out).toMatchObject({ kind: 'written', path: path.join(projectDir, WORDS_FILE) });
    await expect(fs.stat(path.join(brandRoot, WORDS_FILE))).rejects.toThrow();
    await rememberWord('brand', where, { kind: 'name', term: 'AppyDave' }, 'human:ui');
    await rememberWord('global', where, { kind: 'name', term: 'FliVideo' }, 'human:ui');
    const read = await readWords(where);
    expect(read.words.names.map((n) => [n.term, n.from])).toEqual([
      ['FliVideo', 'global'],
      ['AppyDave', 'brand'],
      ['D06', 'project'],
    ]);
  });

  it('refuses a level whose folder was not given', async () => {
    expect(
      await rememberWord('project', {}, { kind: 'name', term: 'X' }, 'human:ui'),
    ).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
      message: 'level project needs projectDir',
    });
  });
});
