import { z } from 'zod';
import { KebabSlug } from './project-folder.js';

/**
 * A story guide is one typed object: a Markdown file whose header (frontmatter) follows `storypilot.guide/1`, with the
 * prose the writer reads as its body (brief `flivideo/.appynet/briefs/typed-guides-dev.md`, research
 * `flivideo/docs/research/storypilot-guide-object-model-2026-11-04.md`).
 *
 * - Required: `schema`, `id`, `label`, `type`, `level`, `gist`. Optional: `appliesTo`, `brands`, and the who-for keys
 *   in `GUIDE_META_KEYS` (`layer` must be canonical | synthesis; `promotedTo` a list; the rest text).
 * - Other header keys are KEPT and ignored: the forge skills write provenance there (`version`, `distilled_from`,
 *   `corpus_window` …) on purpose. Never strip them.
 * - A new kind of guide is a new file with this header, no code.
 *
 * Browser-safe (zod only). The header reader is a small YAML subset (what guide headers use): `key: value` scalars,
 * quoted strings, flow lists `[a, b]`, flow maps `{a: b}`, and block lists / maps one level deep. A value it cannot
 * read is kept as its raw text, so an unknown key never makes a file invalid.
 */

export const GUIDE_SCHEMA = 'storypilot.guide/1';

/**
 * The parts a script is told with (`voice` = who speaks, `verbal` = how, `build` = the spine, `video` = the package's
 * slots), plus `lens` (a review check) and `other`. v0.34.0: `structure` split into `build` and `video`.
 */
export const GUIDE_DOC_TYPES = ['voice', 'verbal', 'build', 'video', 'lens', 'other'] as const;
export const GuideDocType = z.enum(GUIDE_DOC_TYPES);
export type GuideDocType = z.infer<typeof GuideDocType>;
/** Old type names still read: a file saying `type: structure` reads as `build` (its spine is what most such files held). */
export const GUIDE_TYPE_ALIASES: Readonly<Record<string, GuideDocType>> = { structure: 'build' };
/** A header's `type` value with old names mapped (`structure` → `build`); anything else is returned as given. */
export const normaliseGuideType = (t: unknown): unknown =>
  typeof t === 'string' && Object.hasOwn(GUIDE_TYPE_ALIASES, t) ? GUIDE_TYPE_ALIASES[t] : t;
export const GuideDocLevel = z.enum(['global', 'brand', 'series', 'video']);
export type GuideDocLevel = z.infer<typeof GuideDocLevel>;
export const GuideDocAppliesTo = z
  .object({
    form: z.enum(['story', 'tutorial', 'sales']).optional(),
    length: z.enum(['short', 'long']).optional(),
  })
  .strict();
export type GuideDocAppliesTo = z.infer<typeof GuideDocAppliesTo>;

/** `canonical` = the owner's own words or rulings; `synthesis` = distilled from a corpus. */
export const GuideDocLayer = z.enum(['canonical', 'synthesis']);
export type GuideDocLayer = z.infer<typeof GuideDocLayer>;

/**
 * Optional "who is it for" keys (v0.34.0). Typed when present; a file without them stays valid. Any other key is kept.
 * `owner` = who may edit it; `promotedTo` = the brands that use it as their default.
 */
export const GUIDE_META_KEYS = [
  'part',
  'style',
  'narrator',
  'author',
  'layer',
  'canonical_source',
  'distilled_from',
  'corpus_window',
  'confidence',
  'evidence',
  'owner',
  'promotedTo',
] as const;

const OptText = z.string().trim().min(1).nullable().optional();

/** The keys every guide header must carry, in the order the reasons name them. */
export const GUIDE_REQUIRED = ['schema', 'id', 'label', 'type', 'level', 'gist'] as const;

export const GuideDoc = z.looseObject({
  schema: z.literal(GUIDE_SCHEMA),
  id: KebabSlug,
  label: z.string().trim().min(1),
  type: z.preprocess(normaliseGuideType, GuideDocType),
  level: GuideDocLevel,
  /** ONE line: what this guide tells the writer. Shown as the card's one-liner. */
  gist: z
    .string()
    .trim()
    .min(1)
    .refine((s) => !/[\r\n]/.test(s), 'must be one line'),
  appliesTo: GuideDocAppliesTo.optional(),
  brands: z.array(z.string().min(1)).optional(),
  part: OptText,
  style: OptText,
  narrator: OptText,
  author: OptText,
  layer: GuideDocLayer.optional(),
  canonical_source: OptText,
  owner: OptText,
  promotedTo: z.array(z.string().min(1)).optional(),
});
export type GuideDoc = z.infer<typeof GuideDoc>;

export type ParsedGuide =
  | { header: GuideDoc; body: string }
  | {
      /** One short reason, for the card: `no guide header`, `invalid: missing gist`, `invalid: type must be …`. */
      error: string;
      /** Every problem found (each `key: message`); empty for a file with no header. */
      issues: string[];
      /** The file's text after any frontmatter, so a reader can still show or summarise it. */
      body: string;
      /** The header as read, when there was one. */
      raw: Record<string, unknown> | null;
    };

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Split a Markdown file into its frontmatter (read as the YAML subset above) and its body; `null` when it has none. */
export function splitFrontmatter(
  text: string,
): { data: Record<string, unknown>; body: string } | null {
  const src = text.replace(/^\uFEFF/, '');
  const m = FRONTMATTER.exec(src);
  if (!m) return null;
  return { data: readHeader(m[1] as string), body: src.slice(m[0].length) };
}

/** Parse a guide file: `{header, body}` when its header is a valid `storypilot.guide/1`, else `{error, …}`. */
export function parseGuide(text: string): ParsedGuide {
  const split = splitFrontmatter(text);
  if (!split) {
    return {
      error: 'no guide header',
      issues: [],
      body: text.replace(/^\uFEFF/, ''),
      raw: null,
    };
  }
  const { data, body } = split;
  if (data.schema === undefined && !GUIDE_REQUIRED.some((k) => k in data)) {
    return { error: 'no guide header', issues: [], body, raw: data };
  }
  const parsed = GuideDoc.safeParse(data);
  if (parsed.success) return { header: parsed.data, body };
  const missing = GUIDE_REQUIRED.filter((k) => data[k] === undefined || data[k] === '');
  const issues = parsed.error.issues.map((i) => {
    const key = i.path.length ? i.path.join('.') : '(root)';
    return missing.includes(key as (typeof GUIDE_REQUIRED)[number])
      ? `${key}: missing`
      : `${key}: ${i.message}`;
  });
  const first = missing[0]
    ? `invalid: missing ${missing.join(', ')}`
    : `invalid: ${issues[0] ?? 'bad header'}`;
  return { error: first, issues, body, raw: data };
}

export const isGuide = (p: ParsedGuide): p is { header: GuideDoc; body: string } => 'header' in p;

// ── The header reader (a YAML subset) ───────────────────────────────────────────────────────────────────────────────

function readHeader(block: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const lines = block.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!line.trim() || /^\s*#/.test(line) || /^\s/.test(line)) continue;
    const m = /^([^:\s][^:]*?)\s*:(?:\s+(.*))?$/.exec(line);
    if (!m) continue;
    const key = (m[1] as string).trim();
    const rest = (m[2] ?? '').trim();
    // Indented lines that follow belong to this key (a block list or map, or a folded scalar).
    const child: string[] = [];
    while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1] as string))
      child.push(lines[++i] as string);
    out[key] = rest ? scalarOrFlow(rest, child) : block1(child);
  }
  return out;
}

function scalarOrFlow(rest: string, child: string[]): unknown {
  if (rest === '|' || rest === '>' || /^[|>][-+]?$/.test(rest)) {
    const lines = child.map((l) => l.trim());
    return rest.startsWith('|') ? lines.join('\n') : lines.join(' ');
  }
  const v = value(rest);
  if (child.length && typeof v === 'string') return [v, ...child.map((l) => l.trim())].join(' ');
  return v;
}

/** An indented block: `- a` lines are a list, `k: v` lines a map, anything else its raw text. */
function block1(child: string[]): unknown {
  if (!child.length) return null;
  const items = child.map((l) => l.trim());
  if (items.every((l) => l.startsWith('- ') || l === '-'))
    return items.map((l) => value(l.slice(1).trim()));
  const map: Record<string, unknown> = {};
  for (const l of items) {
    const m = /^([^:\s][^:]*?)\s*:(?:\s+(.*))?$/.exec(l);
    if (!m) return child.join('\n');
    map[(m[1] as string).trim()] = value((m[2] ?? '').trim());
  }
  return map;
}

function value(raw: string): unknown {
  const s = stripComment(raw).trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      return s.slice(1, -1);
    }
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
    return s.slice(1, -1).replace(/''/g, "'");
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    return inner ? splitTop(inner).map(value) : [];
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    const map: Record<string, unknown> = {};
    if (!inner) return map;
    for (const part of splitTop(inner)) {
      const at = part.indexOf(':');
      if (at < 0) return s;
      map[part.slice(0, at).trim()] = value(part.slice(at + 1));
    }
    return map;
  }
  return s;
}

/** A ` #` starts a comment outside quotes (YAML); a `#` inside a word does not. */
function stripComment(s: string): string {
  if (/^["']/.test(s.trim())) return s;
  const at = s.search(/\s#/);
  return at < 0 ? s : s.slice(0, at);
}

/** Split a flow collection's inside on top-level commas (not inside quotes, [] or {}). */
function splitTop(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = '';
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
