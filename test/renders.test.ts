import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FOLDER_HEAVY, FliCoreError, clearRenders, rendersOf, rendersPath } from '../src/index.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

describe('rendersPath (R2: <project>/-renders/<tool>/)', () => {
  it('is inside the project, with a trailing separator', () => {
    expect(rendersPath({ projectDir: '/v/v-aitldr/b05-title-lab', tool: 'remotion' })).toBe(
      `/v/v-aitldr/b05-title-lab/-renders/remotion${path.sep}`,
    );
    expect(rendersPath({ projectDir: '/p/a01-x', tool: 'hyperframes', subject: 'short' })).toBe(
      `/p/a01-x/-renders/hyperframes/short${path.sep}`,
    );
  });

  it('holds no machine path but the project the caller names', () => {
    expect(rendersPath({ projectDir: '/Users/jan/v/b05-x', tool: 'ffmpeg' })).not.toContain(
      '/fli/lab',
    );
  });

  it('refuses a tool or subject that is not one path segment, and a relative project', () => {
    for (const tool of ['', '.', '..', 'a/b', 'a\\b']) {
      expect(() => rendersPath({ projectDir: '/p', tool })).toThrow(FliCoreError);
    }
    expect(() => rendersPath({ projectDir: '/p', tool: 't', subject: '../x' })).toThrow(
      FliCoreError,
    );
    expect(() => rendersPath({ projectDir: 'p/a01', tool: 't' })).toThrow(FliCoreError);
  });
});

describe('rendersOf', () => {
  it('is empty and not present when there is no -renders/', async () => {
    expect(await rendersOf(await tempDir())).toEqual({
      present: false,
      files: 0,
      bytes: 0,
      heavy: false,
      tools: [],
    });
  });

  it('counts files and bytes per tool, biggest first', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      '-renders/remotion/out/a.mp4': 'x'.repeat(300),
      '-renders/remotion/frames/1.png': 'x'.repeat(100),
      '-renders/hyperframes/b.mp4': 'x'.repeat(50),
      '-renders/loose.log': 'x'.repeat(7),
      'videos/v/v-final.mp4': 'x'.repeat(9999),
    });
    const r = await rendersOf(dir);
    expect(r).toMatchObject({ present: true, files: 4, bytes: 457, heavy: false });
    expect(r.tools).toEqual([
      { tool: 'remotion', files: 2, bytes: 400 },
      { tool: 'hyperframes', files: 1, bytes: 50 },
      { tool: 'loose.log', files: 1, bytes: 7 },
    ]);
  });

  it('is heavy by size alone, on the trash rule (500 MB), without writing 500 MB', async () => {
    expect(FOLDER_HEAVY).toEqual({ showBytes: 1024 ** 2, heavyBytes: 500 * 1024 ** 2 });
    const dir = await tempDir();
    await fs.mkdir(path.join(dir, '-renders', 't'), { recursive: true });
    const big = path.join(dir, '-renders', 't', 'big.bin');
    await fs.writeFile(big, '');
    await fs.truncate(big, FOLDER_HEAVY.heavyBytes + 1); // sparse
    expect((await rendersOf(dir)).heavy).toBe(true);
    await fs.truncate(big, FOLDER_HEAVY.heavyBytes);
    expect((await rendersOf(dir)).heavy).toBe(false);
  });

  it('never follows a link: a link is counted as itself, and a linked -renders is "absent"', async () => {
    const dir = await tempDir();
    const elsewhere = await tempDir();
    await buildTree(elsewhere, { 'big/x.bin': 'x'.repeat(5000) });
    await buildTree(dir, { '-renders/t/a.txt': 'abc' });
    await fs.symlink(path.join(elsewhere, 'big'), path.join(dir, '-renders', 't', 'link'));
    expect((await rendersOf(dir)).bytes).toBeLessThan(5000);
    const linked = await tempDir();
    await fs.symlink(elsewhere, path.join(linked, '-renders'));
    expect((await rendersOf(linked)).present).toBe(false);
  });
});

describe('clearRenders', () => {
  it('clears one tool and leaves the rest, -renders/ itself and the project alone', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      '-renders/remotion/a.mp4': 'xx',
      '-renders/hyperframes/b.mp4': 'xxx',
      'videos/v/v-final.mp4': 'keep',
      'motion/remotion/src/Scene.tsx': 'keep',
    });
    expect(await clearRenders(dir, { tool: 'remotion' })).toEqual({
      kind: 'cleared',
      removed: ['remotion'],
      files: 1,
      bytes: 2,
    });
    expect((await rendersOf(dir)).tools.map((t) => t.tool)).toEqual(['hyperframes']);
    expect(await fs.readFile(path.join(dir, 'videos/v/v-final.mp4'), 'utf8')).toBe('keep');
    expect(await fs.readFile(path.join(dir, 'motion/remotion/src/Scene.tsx'), 'utf8')).toBe('keep');
  });

  it('clears everything but keeps the folder; clearing again is a quiet no-op', async () => {
    const dir = await tempDir();
    await buildTree(dir, { '-renders/a/x': 'x', '-renders/b/y': 'yy', '-renders/z.log': 'z' });
    expect(await clearRenders(dir)).toEqual({
      kind: 'cleared',
      removed: ['a', 'b', 'z.log'],
      files: 3,
      bytes: 4,
    });
    expect((await fs.stat(path.join(dir, '-renders'))).isDirectory()).toBe(true);
    expect(await clearRenders(dir)).toEqual({ kind: 'cleared', removed: [], files: 0, bytes: 0 });
  });

  it('nothing to clear is not an error', async () => {
    expect(await clearRenders(await tempDir())).toMatchObject({ kind: 'cleared', removed: [] });
  });

  it('unlinks a link, never deleting what it points at', async () => {
    const dir = await tempDir();
    const elsewhere = await tempDir();
    await buildTree(elsewhere, { 'precious.txt': 'keep' });
    await fs.mkdir(path.join(dir, '-renders'));
    await fs.symlink(elsewhere, path.join(dir, '-renders', 'tool'));
    expect(await clearRenders(dir)).toMatchObject({ kind: 'cleared', removed: ['tool'] });
    expect(await fs.readFile(path.join(elsewhere, 'precious.txt'), 'utf8')).toBe('keep');
  });

  it('refuses a -renders that is a link, a tool that is not one segment, and a relative project', async () => {
    const dir = await tempDir();
    const elsewhere = await tempDir();
    await buildTree(elsewhere, { 'precious.txt': 'keep' });
    await fs.symlink(elsewhere, path.join(dir, '-renders'));
    expect(await clearRenders(dir)).toMatchObject({ kind: 'refused', reason: 'not-a-folder' });
    expect(await fs.readFile(path.join(elsewhere, 'precious.txt'), 'utf8')).toBe('keep');
    expect(await clearRenders(dir, { tool: '../x' })).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
    expect(await clearRenders('rel/path')).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
  });
});
