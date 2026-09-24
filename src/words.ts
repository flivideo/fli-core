import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { type PrincipalName } from './capability.js';
import { atomicWrite, errorMessage, readJsonFile } from './fs-utils.js';
import { InvalidFile, issuesOf, readFileResult } from './results.js';
import { Stamp, stampOf } from './stamp.js';

/**
 * The suite's one word store (David 2026-09-24: "the information and the rules live [in FliStudio], not in FliCut.
 * FliCut just uses the information. That way, the other tools can also use it"). The same file at three levels:
 *
 *   global      ~/.config/appydave/fli.words.json   (may be absent or empty)
 *   brand       v-<brand>/fli.words.json
 *   project     <project>/fli.words.json
 *
 * A lower level wins on the same key, and can turn off an entry inherited from above. FliStudio is the only writer;
 * every app reads through `readWords`, a plain file read, so it works while FliStudio is down. Corrections made in an
 * edit stay in the edit — nothing here ever rewrites a transcript.
 */

export const WORDS_FILE = 'fli.words.json';

export const WordLevel = z.enum(['global', 'brand', 'project']);
export type WordLevel = z.infer<typeof WordLevel>;
const LEVELS = WordLevel.options;

const Text = z.string().trim().min(1).max(200);

/** A name spelled exactly like this. `heardAs` are the ways the transcriber gets it wrong (proposed fixes). */
export const WordName = z.object({
  term: Text,
  heardAs: z.array(Text).optional(),
  changed: Stamp,
});
export type WordName = z.infer<typeof WordName>;

/** A literal, whole-word, case-insensitive spelling rule: `find` in a transcript is proposed as `write`. */
export const WordRule = z.object({ find: Text, write: Text, changed: Stamp });
export type WordRule = z.infer<typeof WordRule>;

/** A filler word for a language, or with `never: true` a word that is never proposed as a filler. */
export const WordFiller = z.object({
  word: Text,
  lang: z.string().min(2).max(10).default('en'),
  never: z.boolean().optional(),
  changed: Stamp,
});
export type WordFiller = z.infer<typeof WordFiller>;

export const WordKind = z.enum(['name', 'rule', 'filler']);
export type WordKind = z.infer<typeof WordKind>;

/** Turns off an entry inherited from a higher level (`text` is its term, `find`, or `lang:word`). */
export const WordOff = z.object({ kind: WordKind, text: Text, changed: Stamp });
export type WordOff = z.infer<typeof WordOff>;

export const WordsFile = z.object({
  schema: z.literal(1),
  names: z.array(WordName).default([]),
  rules: z.array(WordRule).default([]),
  fillers: z.array(WordFiller).default([]),
  off: z.array(WordOff).default([]),
});
export type WordsFile = z.infer<typeof WordsFile>;

export const ReadWordsFileResult = readFileResult(WordsFile);
export type ReadWordsFileResult = z.infer<typeof ReadWordsFileResult>;

/** What a caller asks to add. The stamp is added by `addWord`. */
export const WordInput = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('name'), term: Text, heardAs: z.array(Text).optional() }),
  z.object({ kind: z.literal('rule'), find: Text, write: Text }),
  z.object({
    kind: z.literal('filler'),
    word: Text,
    lang: z.string().min(2).max(10).optional(),
    never: z.boolean().optional(),
  }),
  z.object({ kind: z.literal('off'), of: WordKind, text: Text }),
]);
export type WordInput = z.infer<typeof WordInput>;

/** Which entry to remove: its kind (or `off`) and its text, as `wordKey` reads it. */
export const WordRef = z.object({ kind: z.enum(['name', 'rule', 'filler', 'off']), text: Text });
export type WordRef = z.infer<typeof WordRef>;

const From = { from: WordLevel };
export const MergedWords = z.object({
  names: z.array(WordName.extend(From)),
  rules: z.array(WordRule.extend(From)),
  fillers: z.array(WordFiller.extend(From)),
  /** The entries a level turned off, and which level did it. */
  off: z.array(WordOff.extend(From)),
});
export type MergedWords = z.infer<typeof MergedWords>;

export const WordsRead = z.object({
  words: MergedWords,
  /** Each level as found: its file, and `null` when that level has no file (or was not asked for). */
  levels: z.object({
    global: WordsFile.nullable(),
    brand: WordsFile.nullable(),
    project: WordsFile.nullable(),
  }),
  /** Files that exist but could not be used. Their level counts as empty; never an error. */
  invalid: z.array(InvalidFile),
});
export type WordsRead = z.infer<typeof WordsRead>;

export interface ReadWordsOptions {
  /** The global file (FliStudio: `~/.config/appydave/fli.words.json`). */
  globalFile?: string;
  /** The brand folder, `v-<brand>/`. */
  brandRoot?: string;
  /** The project folder. */
  projectDir?: string;
}

/** The comparison key: trimmed, lower case, inner whitespace collapsed. */
export function wordKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

const fillerKey = (f: { word: string; lang?: string }) =>
  `${wordKey(f.lang ?? 'en')}:${wordKey(f.word)}`;

/** The path of `fli.words.json` for each level asked for. */
export function wordsFilePaths(options: ReadWordsOptions): Record<WordLevel, string | null> {
  return {
    global: options.globalFile ?? null,
    brand: options.brandRoot ? path.join(options.brandRoot, WORDS_FILE) : null,
    project: options.projectDir ? path.join(options.projectDir, WORDS_FILE) : null,
  };
}

export function readWordsFile(file: string): Promise<ReadWordsFileResult> {
  return readJsonFile(file, WordsFile);
}

export const EMPTY_WORDS: WordsFile = { schema: 1, names: [], rules: [], fillers: [], off: [] };

/** Merge the levels, highest first. Never throws. */
export function mergeWords(levels: Partial<Record<WordLevel, WordsFile | null>>): MergedWords {
  const names = new Map<string, MergedWords['names'][number]>();
  const rules = new Map<string, MergedWords['rules'][number]>();
  const fillers = new Map<string, MergedWords['fillers'][number]>();
  const off: MergedWords['off'] = [];

  for (const from of LEVELS) {
    const file = levels[from];
    if (!file) continue;
    // A level's `off` hides what the levels above it gave, never its own entries.
    for (const o of file.off) {
      const key = o.kind === 'filler' ? fillerKey(splitFiller(o.text)) : wordKey(o.text);
      ({ name: names, rule: rules, filler: fillers })[o.kind].delete(key);
      off.push({ ...o, from });
    }
    for (const n of file.names) {
      const key = wordKey(n.term);
      const above = names.get(key);
      const heard = dedupe([...(above?.heardAs ?? []), ...(n.heardAs ?? [])]);
      names.set(key, { ...n, ...(heard.length ? { heardAs: heard } : {}), from });
    }
    for (const r of file.rules) rules.set(wordKey(r.find), { ...r, from });
    for (const f of file.fillers) fillers.set(fillerKey(f), { ...f, from });
  }
  return {
    names: [...names.values()],
    rules: [...rules.values()],
    fillers: [...fillers.values()],
    off,
  };
}

/** Read and merge every level asked for. Absent and unusable files count as empty; never throws. */
export async function readWords(options: ReadWordsOptions): Promise<WordsRead> {
  const paths = wordsFilePaths(options);
  const levels: WordsRead['levels'] = { global: null, brand: null, project: null };
  const invalid: InvalidFile[] = [];
  for (const level of LEVELS) {
    const file = paths[level];
    if (!file) continue;
    const read = await readWordsFile(file);
    if (read?.kind === 'valid') levels[level] = read.value;
    else if (read?.kind === 'invalid') invalid.push(read);
  }
  return { words: mergeWords(levels), levels, invalid };
}

/** The names to hint to a transcriber, in merge order. */
export function vocabularyOf(words: MergedWords): string[] {
  return words.names.map((n) => n.term);
}

/** The filler words for a language, and the words never to propose as fillers. */
export function fillersOf(words: MergedWords, lang = 'en'): { fillers: string[]; never: string[] } {
  const mine = words.fillers.filter((f) => wordKey(f.lang) === wordKey(lang));
  return {
    fillers: mine.filter((f) => !f.never).map((f) => f.word),
    never: mine.filter((f) => f.never).map((f) => f.word),
  };
}

/** Add (or replace, on the same key) one entry, stamped with who and when. Pure: returns a new file. */
export function addWord(
  file: WordsFile,
  input: WordInput,
  by: PrincipalName,
  now: Date = new Date(),
): WordsFile {
  const entry = WordInput.parse(input);
  const changed = stampOf(by, now);
  const next = structuredClone(file);
  switch (entry.kind) {
    case 'name': {
      const key = wordKey(entry.term);
      next.names = next.names.filter((n) => wordKey(n.term) !== key);
      const heard = dedupe(entry.heardAs ?? []);
      next.names.push({ term: entry.term, ...(heard.length ? { heardAs: heard } : {}), changed });
      break;
    }
    case 'rule': {
      const key = wordKey(entry.find);
      next.rules = next.rules.filter((r) => wordKey(r.find) !== key);
      next.rules.push({ find: entry.find, write: entry.write, changed });
      break;
    }
    case 'filler': {
      const f = { word: entry.word, lang: entry.lang ?? 'en' };
      next.fillers = next.fillers.filter((x) => fillerKey(x) !== fillerKey(f));
      next.fillers.push({ ...f, ...(entry.never ? { never: true } : {}), changed });
      break;
    }
    case 'off': {
      const key = offKey(entry.of, entry.text);
      next.off = next.off.filter((o) => offKey(o.kind, o.text) !== key);
      next.off.push({ kind: entry.of, text: entry.text, changed });
      break;
    }
  }
  return next;
}

/** Remove one entry by kind and text. Pure; `removed: false` when nothing matched. */
export function removeWord(
  file: WordsFile,
  ref: WordRef,
): { file: WordsFile; removed: WordName | WordRule | WordFiller | WordOff | null } {
  const { kind, text } = WordRef.parse(ref);
  const next = structuredClone(file);
  let removed: WordName | WordRule | WordFiller | WordOff | null = null;
  const take = <T>(list: T[], match: (item: T) => boolean): T[] =>
    list.filter((item) => {
      if (removed === null && match(item)) {
        removed = item as never;
        return false;
      }
      return true;
    });
  if (kind === 'name') next.names = take(next.names, (n) => wordKey(n.term) === wordKey(text));
  if (kind === 'rule') next.rules = take(next.rules, (r) => wordKey(r.find) === wordKey(text));
  if (kind === 'filler') {
    const key = fillerKey(splitFiller(text));
    next.fillers = take(next.fillers, (f) => fillerKey(f) === key);
  }
  if (kind === 'off') {
    next.off = take(next.off, (o) => wordKey(o.text) === wordKey(text));
  }
  return { file: next, removed };
}

export const WriteWordsResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('written'), path: z.string() }),
  z.object({
    kind: z.literal('refused'),
    reason: z.enum(['invalid-input', 'io-error']),
    path: z.string(),
    message: z.string(),
  }),
]);
export type WriteWordsResult = z.infer<typeof WriteWordsResult>;

/** Write `fli.words.json` atomically. The folder must exist (a brand or project is never created here). */
export async function writeWordsFile(file: string, words: WordsFile): Promise<WriteWordsResult> {
  const parsed = WordsFile.safeParse(words);
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

/** `"en:um"` or `"um"` (English). */
function splitFiller(text: string): { word: string; lang: string } {
  const m = /^([a-z]{2,3}(?:-[a-z0-9]+)?):(.+)$/i.exec(text.trim());
  return m ? { lang: m[1] as string, word: m[2] as string } : { lang: 'en', word: text };
}

function offKey(kind: WordKind, text: string): string {
  return `${kind}|${kind === 'filler' ? fillerKey(splitFiller(text)) : wordKey(text)}`;
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((t) => !seen.has(wordKey(t)) && seen.add(wordKey(t)));
}
