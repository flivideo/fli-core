import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BrandSettings,
  GITIGNORE_BASE_VERSION,
  GITIGNORE_BEGIN,
  GITIGNORE_END,
  GitignoreOverlayRule,
  checkGitignore,
  gitignoreRender,
  locateBlock,
  renderGitignore,
  renderGitignoreBlock,
  trackedIgnored,
  writeBrandSettings,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

const BROLL: GitignoreOverlayRule[] = [
  { pattern: '!**/broll/', reason: 'OVERLAY-BROLL', note: 'Keep them SHORT.' },
  { pattern: '!**/broll/**', reason: 'OVERLAY-BROLL', note: 'Keep them SHORT.' },
];
const CUT_DRAFT: GitignoreOverlayRule[] = [
  { pattern: '**/fli.studio.cut-draft.json', reason: 'OVERLAY-RECIPE' },
];

/** A scratch repo whose .gitignore is `text`. */
async function repoWith(text: string): Promise<string> {
  const dir = await tempDir('fli-gi-');
  execFileSync('git', ['init', '-q', dir]);
  await fs.writeFile(path.join(dir, '.gitignore'), text);
  return dir;
}

/**
 * Is `rel` ignored? `git check-ignore -v --no-index` with `core.quotepath=false` (design §3). With -v, git exits 0 for a
 * path matched by a NEGATIVE pattern too, so a match whose pattern starts with `!` is "not ignored". Returns the matching
 * line as well, so a vector that fails says which rule decided it.
 */
function verdict(repo: string, rel: string): { ignored: boolean; by: string } {
  const r = spawnSync(
    'git',
    ['-C', repo, '-c', 'core.quotepath=false', 'check-ignore', '-v', '--no-index', rel],
    { encoding: 'utf8' },
  );
  if (r.status === 1) return { ignored: false, by: '' };
  if (r.status !== 0) throw new Error(`git check-ignore failed (${r.status}): ${r.stderr}`);
  const by = r.stdout.split('\t')[0] as string;
  const pattern = by.split(':').slice(2).join(':');
  // the path is echoed back unescaped under core.quotepath=false, so non-ASCII vectors are comparable
  expect(r.stdout.split('\t')[1]?.trim()).toBe(rel);
  return { ignored: !pattern.startsWith('!'), by };
}

describe('gitignore.render: the §3 test vectors, proven with git check-ignore', () => {
  const ignoredBase = [
    'a01-x/videos/intro/intro-final.mp4',
    'a01-x/videos/intro/intro-cut.mov',
    'a01-x/voice/take1.wav',
    'a01-x/voice/take1.mp3',
    'a01-x/voice/take1.m4a',
    'a01-x/voice/take1.aac',
    'a01-x/voice/take1.flac',
    'a01-x/-renders/remotion/out/v.mp4',
    'a01-x/-trash/old/notes.md', // trash wins over the !*.md allow: the order test
    'a01-x/-trash/old/script.json',
    'a01-x/final/a01.mp4',
    'a01-x/motion/remotion/node_modules/x/index.js',
    'a01-x/motion/remotion/out/f.mp4',
    'a01-x/motion/remotion/.cache/x',
    'a01-x/motion/hyperframes/.transcode-cache/a.mp4',
    'a01-x/assets/raw.psd',
    'a01-x/skool/pack.zip',
    'a01-x/broll/clip.mp4', // no broll exception in this brand
    'a01-x/render.log',
    'a01-x/.DS_Store',
    'a01-x/.claude/settings.local.json',
    'a01-x/fli.cut.a01-x/history/0001.json', // FliCut undo stack: machine-local (flicut ADR-0011)
    'a01-x/fli.cut.a01-x/viewState.json', // JSON, so this proves the deny beats the metadata re-include
  ];
  const trackedBase = [
    'a01-x/final/README.md',
    'a01-x/final/a01.audio-clean.json',
    'a01-x/motion/remotion/src/Scene.tsx',
    'a01-x/motion/remotion/src/index.ts',
    'a01-x/motion/remotion/src/style.css',
    'a01-x/motion/remotion/package.json',
    'a01-x/fli.studio.json',
    'a01-x/fli.resources.json',
    'a01-x/script/script.md',
    'a01-x/script/titles.txt',
    'a01-x/videos/intro/intro-cut.srt',
    'a01-x/assets/thumb.png',
    'a01-x/fli.studio.cut-draft.json', // only a brand overlay ignores it
    'a01-x/fli.cut.a01-x.json', // the FliCut EDL itself is a decision: tracked
    'a01-x/fli.cut.a01-x/last-export.json',
  ];

  it('ignores and tracks what the design says, in a brand with no overlay', async () => {
    const repo = await repoWith(renderGitignoreBlock({ brand: 'plain' }));
    const wrong: string[] = [];
    for (const p of ignoredBase)
      if (!verdict(repo, p).ignored) wrong.push(`should be ignored: ${p} (${verdict(repo, p).by})`);
    for (const p of trackedBase)
      if (verdict(repo, p).ignored) wrong.push(`should be tracked: ${p} (${verdict(repo, p).by})`);
    expect(wrong).toEqual([]);
  });

  it('positive control: the harness reports an ignored path as ignored, and a tracked one as tracked', async () => {
    const repo = await repoWith(renderGitignoreBlock({ brand: 'plain' }));
    expect(verdict(repo, 'a01-x/videos/v/v-final.mp4').ignored).toBe(true);
    expect(verdict(repo, 'a01-x/script/script.md').ignored).toBe(false);
    // and with NO rules, the same ignored path is not ignored: the instrument can say "no"
    expect(verdict(await repoWith(''), 'a01-x/videos/v/v-final.mp4').ignored).toBe(false);
  });

  it('broll: tracked in a brand whose overlay has the exception, ignored without', async () => {
    const withBroll = await repoWith(renderGitignoreBlock({ brand: 'aitldr', overlay: BROLL }));
    const without = await repoWith(renderGitignoreBlock({ brand: 'other' }));
    expect(verdict(withBroll, 'a01-x/broll/clip.mp4').ignored).toBe(false);
    expect(verdict(without, 'a01-x/broll/clip.mp4').ignored).toBe(true);
    // the exception does not leak: a video elsewhere stays ignored
    expect(verdict(withBroll, 'a01-x/videos/v/v-final.mp4').ignored).toBe(true);
  });

  it("cut-draft: ignored where the overlay says so, not elsewhere; a brand's overlay never leaks into another", async () => {
    const appydave = renderGitignoreBlock({ brand: 'appydave', overlay: CUT_DRAFT });
    const other = renderGitignoreBlock({ brand: 'aitldr', overlay: BROLL });
    expect(verdict(await repoWith(appydave), 'a01-x/fli.studio.cut-draft.json').ignored).toBe(true);
    expect(verdict(await repoWith(other), 'a01-x/fli.studio.cut-draft.json').ignored).toBe(false);
    expect(other).not.toContain('cut-draft');
    expect(appydave).not.toContain('broll');
  });

  it('non-ASCII, spaces and emoji paths (core.quotepath=false): ignored media, tracked text', async () => {
    const repo = await repoWith(renderGitignoreBlock({ brand: 'plain' }));
    for (const p of [
      'a01-x/videos/café-intro/café-intro-final.mp4',
      'a01-x/videos/my video/my video-final.mp4',
      'a01-x/videos/🎬-intro/🎬-intro-final.mp4',
      'a01-x/videos/日本語/日本語-final.mov',
    ])
      expect(verdict(repo, p).ignored, p).toBe(true);
    for (const p of [
      'a01-x/script/café.md',
      'a01-x/script/my notes.md',
      'a01-x/script/🎬.md',
      'a01-x/script/日本語.json',
    ])
      expect(verdict(repo, p).ignored, p).toBe(false);
  });

  it('the generated block contains no machine-specific text (R8)', () => {
    const block = renderGitignoreBlock({ brand: 'aitldr', overlay: BROLL });
    expect(block).not.toMatch(/\/Users\/|\/home\/|C:\\|localhost|\d{4}-\d{2}-\d{2}T/);
    expect(block).not.toContain('\r');
    expect(block.endsWith('\n')).toBe(true);
  });
});

describe('gitignore.render: generator behaviour', () => {
  const opts = { brand: 'aitldr', overlay: BROLL };

  it('idempotent: rendering its own output is unchanged', () => {
    const first = renderGitignore(null, opts);
    expect(first.status).toBe('created');
    const second = renderGitignore(first.content, opts);
    expect(second).toMatchObject({ status: 'unchanged', added: [], removed: [] });
    expect(second.content).toBe(first.content);
    // …also after hand rules were added around it
    const hand = renderGitignore(`# mine\nsecret/\n\n${first.content}\nafter-hand.txt\n`, opts);
    expect(hand.status).toBe('unchanged');
  });

  it('hand rules above and below the block survive byte-for-byte, odd whitespace included', () => {
    const above = '# history\r\nsecret/\n  \n!keep-me.txt\t\n\n';
    const below = '\n# tail\nafter/\nno-newline-at-end';
    const generated = renderGitignoreBlock({ brand: 'aitldr' });
    const old = renderGitignoreBlock({ brand: 'aitldr' }).replace('*.mp4', '*.mp4x'); // a stale block
    const r = renderGitignore(above + old + below, { brand: 'aitldr' });
    expect(r.status).toBe('updated');
    expect(r.content).toBe(above + generated + below);
    expect(r.added).toContain('*.mp4');
    expect(r.removed).toContain('*.mp4x');
  });

  it('a first run on an existing file appends the block last and reports legacy duplicates, never deleting them', () => {
    const existing = '# old\n*.mp4\nsecret/\n!**/*.md';
    const r = renderGitignore(existing, opts);
    expect(r.status).toBe('updated');
    expect(r.content.startsWith('# old\n*.mp4\nsecret/\n!**/*.md\n\n' + GITIGNORE_BEGIN)).toBe(
      true,
    );
    expect(r.legacyDuplicates).toEqual(['*.mp4', '!**/*.md']);
    expect(r.content.endsWith(`${GITIGNORE_END}\n`)).toBe(true);
    expect(renderGitignore(r.content, opts).status).toBe('unchanged');
  });

  it('reports a block that is not last (a hand rule after it could undo a re-include), and does not move it', () => {
    const base = renderGitignore(null, opts).content;
    const r = renderGitignore(`${base}*.broll-undo\n`, opts);
    expect(r).toMatchObject({ status: 'unchanged', blockNotLast: true });
    expect(renderGitignore(`${base}\n# only a comment\n`, opts).blockNotLast).toBe(false);
  });

  it('check: ok, then drift when one line inside the block is edited, then ok again after a render', () => {
    const base = renderGitignore(null, opts).content;
    expect(checkGitignore(base, opts)).toMatchObject({ status: 'ok', ok: true });
    const edited = base.replace('*.mp4\n', '*.mp4\n!**/keep.mp4\n');
    const drift = checkGitignore(edited, opts);
    expect(drift).toMatchObject({
      status: 'drift',
      ok: false,
      extra: ['!**/keep.mp4'],
      missing: [],
    });
    expect(drift.reason).toContain('edited between the markers');
    const fixed = renderGitignore(edited, opts);
    expect(fixed.status).toBe('updated');
    expect(checkGitignore(fixed.content, opts).ok).toBe(true);
  });

  it('check: no-block, a different base version (named, not rewritten), and a changed overlay', () => {
    expect(checkGitignore(null, opts)).toMatchObject({ status: 'no-block', ok: false });
    expect(checkGitignore('*.mp4\n', opts)).toMatchObject({
      status: 'no-block',
      legacyDuplicates: ['*.mp4'],
    });
    const base = renderGitignore(null, opts).content;
    const older = base.replace(
      `base v${GITIGNORE_BASE_VERSION},`,
      `base v${GITIGNORE_BASE_VERSION - 1},`,
    );
    const v = checkGitignore(older, opts);
    expect(v).toMatchObject({ status: 'drift', fileBaseVersion: GITIGNORE_BASE_VERSION - 1 });
    expect(v.reason).toContain('base version differs');
    expect(checkGitignore(base, { brand: 'aitldr' })).toMatchObject({ status: 'drift' }); // overlay changed
    expect(checkGitignore(base, { brand: 'other', overlay: BROLL })).toMatchObject({
      status: 'drift',
    }); // brand named in the marker
  });

  it.each([
    ['two BEGINs', (b: string) => b + b],
    ['a BEGIN with no END', (b: string) => b.replace(GITIGNORE_END, '# nothing')],
    ['an END with no BEGIN', (b: string) => b.replace(/^# >>> BEGIN.*\n/m, '')],
    ['END before BEGIN', (b: string) => `${GITIGNORE_END}\n${b.replace(GITIGNORE_END, '')}`],
    ['two ENDs', (b: string) => b + GITIGNORE_END + '\n'],
  ])('broken markers (%s): refused, nothing changes', (_name, damage) => {
    const damaged = damage(renderGitignore(null, opts).content);
    expect(locateBlock(damaged).kind).toBe('broken');
    const r = renderGitignore(damaged, opts);
    expect(r).toMatchObject({ status: 'refused', content: damaged });
    expect(r.message).toContain('damaged');
    expect(checkGitignore(damaged, opts)).toMatchObject({ status: 'broken-markers', ok: false });
  });

  it('rejects an overlay rule that is a comment, has stray space, spans lines, or has a lower-case reason', () => {
    for (const bad of [
      { pattern: '# x', reason: 'A' },
      { pattern: ' x', reason: 'A' },
      { pattern: 'x ', reason: 'A' },
      { pattern: 'a\nb', reason: 'A' },
      { pattern: '', reason: 'A' },
      { pattern: 'x', reason: 'lower' },
      { pattern: 'x', reason: 'A', note: 'a\nb' },
    ])
      expect(GitignoreOverlayRule.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    expect(() =>
      renderGitignoreBlock({ brand: 'a', overlay: [{ pattern: '# x', reason: 'A' }] }),
    ).toThrow();
    expect(GitignoreOverlayRule.safeParse({ pattern: '\\#hash', reason: 'A' }).success).toBe(true);
  });

  it('groups consecutive overlay rules of one reason and note under one header', () => {
    const block = renderGitignoreBlock({ brand: 'aitldr', overlay: BROLL });
    expect(block.match(/# \[OVERLAY-BROLL\] Keep them SHORT\./g)).toHaveLength(1);
    expect(block.indexOf('!**/broll/\n')).toBeGreaterThan(block.indexOf('*.mp4\n'));
  });
});

describe('gitignore.render: replayable on another Mac (design §2.6, R8)', () => {
  it('two independent renders are byte-identical (sha256), and a clone that got only the committed files checks ok', async () => {
    const sha = (s: string) => createHash('sha256').update(s).digest('hex');
    const brandA = await tempDir('v-aitldr-');
    const brandB = await tempDir('v-aitldr-');
    for (const root of [brandA, brandB]) {
      await writeBrandSettings(root, {
        schema: 1,
        brand: 'aitldr',
        colour: '#123456',
        gitignore: BROLL,
      });
    }
    const a = await gitignoreRender(brandA, { tracked: false });
    const b = await gitignoreRender(brandB, { tracked: false });
    expect(a).toMatchObject({ kind: 'rendered', wrote: true });
    const ta = await fs.readFile(path.join(brandA, '.gitignore'), 'utf8');
    const tb = await fs.readFile(path.join(brandB, '.gitignore'), 'utf8');
    expect(sha(ta)).toBe(sha(tb));

    // "git pull" on the other Mac brings exactly these two files; nothing else crosses.
    const clone = await tempDir('v-aitldr-clone-');
    for (const f of ['.gitignore', 'fli.brand.json'])
      await fs.copyFile(path.join(brandA, f), path.join(clone, f));
    expect(await gitignoreRender(clone, { check: true })).toMatchObject({
      kind: 'checked',
      check: { status: 'ok', ok: true },
    });
    expect(b).toMatchObject({ kind: 'rendered' });
  });
});

describe('gitignoreRender (files)', () => {
  it('writes once, then reports unchanged and leaves the file alone', async () => {
    const root = await tempDir('v-x-');
    const first = await gitignoreRender(root, { tracked: false });
    expect(first).toMatchObject({ kind: 'rendered', wrote: true, render: { status: 'created' } });
    const mtime = (await fs.stat(path.join(root, '.gitignore'))).mtimeMs;
    const second = await gitignoreRender(root, { tracked: false });
    expect(second).toMatchObject({
      kind: 'rendered',
      wrote: false,
      render: { status: 'unchanged' },
    });
    expect((await fs.stat(path.join(root, '.gitignore'))).mtimeMs).toBe(mtime);
  });

  it('takes the brand key from fli.brand.json, the overlay from its gitignore field, else the folder name', async () => {
    const root = await tempDir('v-zed-');
    await gitignoreRender(root, { tracked: false });
    expect(await fs.readFile(path.join(root, '.gitignore'), 'utf8')).toContain(
      `brand ${path.basename(root).replace(/^v-/, '')})`,
    );
    const root2 = await tempDir('v-y-');
    await writeBrandSettings(root2, {
      schema: 1,
      brand: 'aitldr',
      colour: '#fff',
      gitignore: BROLL,
    });
    await gitignoreRender(root2, { tracked: false });
    const text = await fs.readFile(path.join(root2, '.gitignore'), 'utf8');
    expect(text).toContain('brand aitldr)');
    expect(text).toContain('!**/broll/**');
  });

  it('check writes nothing, even to a missing file', async () => {
    const root = await tempDir('v-x-');
    const r = await gitignoreRender(root, { check: true });
    expect(r).toMatchObject({ kind: 'checked', check: { status: 'no-block', ok: false } });
    await expect(fs.stat(path.join(root, '.gitignore'))).rejects.toThrow();
  });

  it('refuses damaged markers without writing, an unusable fli.brand.json, and a missing root', async () => {
    const root = await tempDir('v-x-');
    const damaged = `${GITIGNORE_BEGIN} (base v1, brand x)\n*.mp4\n`;
    await fs.writeFile(path.join(root, '.gitignore'), damaged);
    expect(await gitignoreRender(root)).toMatchObject({
      kind: 'refused',
      reason: 'damaged-markers',
    });
    expect(await fs.readFile(path.join(root, '.gitignore'), 'utf8')).toBe(damaged);
    const bad = await tempDir('v-x-');
    await fs.writeFile(path.join(bad, 'fli.brand.json'), '{ nope');
    expect(await gitignoreRender(bad)).toMatchObject({
      kind: 'refused',
      reason: 'brand-settings-invalid',
    });
    expect(await gitignoreRender(path.join(root, 'nope'))).toMatchObject({
      kind: 'refused',
      reason: 'no-brand-root',
    });
  });

  it('BrandSettings carries the overlay, optional, and an older file without it still reads', () => {
    expect(BrandSettings.safeParse({ schema: 1, brand: 'x', colour: '#fff' }).success).toBe(true);
    expect(
      BrandSettings.safeParse({
        schema: 1,
        brand: 'x',
        colour: '#fff',
        gitignore: [{ pattern: '# no', reason: 'A' }],
      }).success,
    ).toBe(false);
  });
});

describe('tracked-media (what the rules now ignore but git already holds)', () => {
  it('lists tracked files the rendered rules ignore, names non-ASCII paths as themselves, and says null when it cannot know', async () => {
    const root = await tempDir('v-tm-');
    execFileSync('git', ['init', '-q', root]);
    for (const rel of [
      'a01-x/videos/v/v-final.mp4',
      'a01-x/videos/café/café-final.mp4',
      'a01-x/script/keep.md',
    ]) {
      await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true });
      await fs.writeFile(path.join(root, rel), 'x');
    }
    execFileSync('git', ['-C', root, 'add', '-A', '-f']);
    const rules = renderGitignoreBlock({ brand: 'tm' });
    const t = await trackedIgnored(root, rules);
    expect(t).toEqual({
      count: 2,
      files: ['a01-x/videos/café/café-final.mp4', 'a01-x/videos/v/v-final.mp4'],
    });
    const checked = await gitignoreRender(root, { check: true });
    expect(checked).toMatchObject({ kind: 'checked', trackedIgnored: { count: 2 } });
    expect(await trackedIgnored(await tempDir('not-a-repo-'), rules)).toBeNull();
  });
});
