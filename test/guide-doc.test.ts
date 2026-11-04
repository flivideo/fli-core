import { describe, expect, it } from 'vitest';
import * as contracts from '../src/contracts.js';
import { GUIDE_REQUIRED, isGuide, parseGuide, splitFrontmatter } from '../src/index.js';

const HEADER: Record<(typeof GUIDE_REQUIRED)[number], string> = {
  schema: 'storypilot.guide/1',
  id: 'build-story',
  label: 'Build story (long form)',
  type: 'structure',
  level: 'global',
  gist: 'Five beats: problem → why → tension → turn → resolution. No invented drama.',
};

const file = (keys: Record<string, string>, extra = '', body = 'Tell how something was built.\n') =>
  `---\n${Object.entries(keys)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}${extra ? `\n${extra}` : ''}\n---\n${body}`;

describe('parseGuide (storypilot.guide/1)', () => {
  it('reads a valid file: header and the body word for word', () => {
    const p = parseGuide(
      file(HEADER, 'appliesTo: {form: story, length: long}\nbrands: [appydave, voz]'),
    );
    expect(isGuide(p)).toBe(true);
    if (!isGuide(p)) return;
    expect(p.header).toMatchObject({
      ...HEADER,
      appliesTo: { form: 'story', length: 'long' },
      brands: ['appydave', 'voz'],
    });
    expect(p.body).toBe('Tell how something was built.\n');
  });

  it.each(GUIDE_REQUIRED)('a header missing %s is invalid and names it', (key) => {
    const rest = Object.fromEntries(Object.entries(HEADER).filter(([k]) => k !== key));
    const p = parseGuide(file(rest));
    expect(isGuide(p)).toBe(false);
    if (isGuide(p)) return;
    expect(p.error).toBe(`invalid: missing ${key}`);
    expect(p.issues).toContain(`${key}: missing`);
    expect(p.body).toBe('Tell how something was built.\n');
  });

  it('names every missing key at once', () => {
    const p = parseGuide(file({ schema: HEADER.schema, id: HEADER.id, label: HEADER.label }));
    expect(isGuide(p) ? null : p.error).toBe('invalid: missing type, level, gist');
  });

  it.each([
    ['type', 'essay'],
    ['level', 'planet'],
    ['schema', 'storypilot.guide/2'],
  ])('a bad %s (%s) is invalid', (key, bad) => {
    const p = parseGuide(file({ ...HEADER, [key]: bad }));
    expect(isGuide(p)).toBe(false);
    if (isGuide(p)) return;
    expect(p.error).toMatch(new RegExp(`^invalid: ${key}: `));
  });

  it('a bad appliesTo value or key is invalid', () => {
    const bad = parseGuide(file(HEADER, 'appliesTo: {form: essay}'));
    expect(isGuide(bad) ? null : bad.error).toMatch(/^invalid: appliesTo\.form: /);
    const typo = parseGuide(file(HEADER, 'appliesTo: {lenght: short}'));
    expect(isGuide(typo)).toBe(false);
  });

  it('a non-kebab id and a two-line gist are invalid', () => {
    expect(isGuide(parseGuide(file({ ...HEADER, id: 'Build Story' })))).toBe(false);
    const twoLines = parseGuide(file({ ...HEADER, gist: '|' }, '  line one\n  line two'));
    expect(isGuide(twoLines) ? null : twoLines.error).toBe('invalid: gist: must be one line');
  });

  it('keeps unknown keys (forge provenance) untouched, valid or not', () => {
    const extra = [
      'version: 1.0.0',
      'distilled_from: 14 curated exemplars (of 182-transcript corpus)',
      'corpus_window: 2023-06 … 2026-04',
      'retrieval_pool_host: mac-mini-m4 (100.82.235.39) — NOT synced: check the M4',
      'tags:',
      '  - voice',
      '  - verbal',
    ].join('\n');
    const p = parseGuide(file(HEADER, extra));
    expect(isGuide(p)).toBe(true);
    if (!isGuide(p)) return;
    expect(p.header).toMatchObject({
      version: '1.0.0',
      distilled_from: '14 curated exemplars (of 182-transcript corpus)',
      corpus_window: '2023-06 … 2026-04',
      retrieval_pool_host: 'mac-mini-m4 (100.82.235.39) — NOT synced: check the M4',
      tags: ['voice', 'verbal'],
    });
  });

  it('a file with no frontmatter: "no guide header", the whole text as body', () => {
    const p = parseGuide('# AppyDave — Tone of Voice Profile\n\nAn earnest …\n');
    expect(p).toEqual({
      error: 'no guide header',
      issues: [],
      body: '# AppyDave — Tone of Voice Profile\n\nAn earnest …\n',
      raw: null,
    });
  });

  it('frontmatter with none of the guide keys is "no guide header" too, its keys kept in raw', () => {
    const p = parseGuide(
      '---\ncreated: 2026-11-03\ntimestamp: 2026-11-03T21:30+07:00\n---\n# Hook study\n',
    );
    expect(isGuide(p)).toBe(false);
    if (isGuide(p)) return;
    expect(p.error).toBe('no guide header');
    expect(p.raw).toEqual({ created: '2026-11-03', timestamp: '2026-11-03T21:30+07:00' });
    expect(p.body).toBe('# Hook study\n');
  });

  it('reads quoted values, a BOM and CRLF line ends', () => {
    const crlf =
      `\uFEFF${file({ ...HEADER, label: '"Build: story"', gist: "'It''s one line'" })}`.replace(
        /\n/g,
        '\r\n',
      );
    const p = parseGuide(crlf);
    expect(isGuide(p)).toBe(true);
    if (!isGuide(p)) return;
    expect(p.header.label).toBe('Build: story');
    expect(p.header.gist).toBe("It's one line");
    expect(p.body).toBe('Tell how something was built.\r\n');
  });

  it('splitFrontmatter: null without a header; block maps one level deep', () => {
    expect(splitFrontmatter('no header')).toBeNull();
    expect(splitFrontmatter('---\nappliesTo:\n  form: story\n  length: short\n---\nx')).toEqual({
      data: { appliesTo: { form: 'story', length: 'short' } },
      body: 'x',
    });
  });

  it('is on the browser-safe contracts entry', () => {
    expect(contracts.parseGuide).toBe(parseGuide);
    expect(contracts.GUIDE_SCHEMA).toBe('storypilot.guide/1');
  });
});
