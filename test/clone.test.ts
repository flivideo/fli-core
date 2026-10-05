import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cloneFile } from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

describe('cloneFile (export.place for part: copy-on-write where the volume has it, a copy where it does not)', () => {
  it('places the bytes and leaves the source alone', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'src.mp4'), 'video bytes');
    await cloneFile(path.join(dir, 'src.mp4'), path.join(dir, 'x-part-intro.mp4'));
    expect(await fs.readFile(path.join(dir, 'x-part-intro.mp4'), 'utf8')).toBe('video bytes');
    expect(await fs.readFile(path.join(dir, 'src.mp4'), 'utf8')).toBe('video bytes');
  });

  it('is independent after the fact: writing the clone does not change the source', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'src'), 'original');
    await cloneFile(path.join(dir, 'src'), path.join(dir, 'copy'));
    await fs.writeFile(path.join(dir, 'copy'), 'changed');
    expect(await fs.readFile(path.join(dir, 'src'), 'utf8')).toBe('original');
  });

  it('never overwrites: an existing destination throws EEXIST and is untouched', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'src'), 'new');
    await fs.writeFile(path.join(dir, 'dest'), 'old');
    await expect(cloneFile(path.join(dir, 'src'), path.join(dir, 'dest'))).rejects.toMatchObject({
      code: 'EEXIST',
    });
    expect(await fs.readFile(path.join(dir, 'dest'), 'utf8')).toBe('old');
  });

  it('a missing source throws and leaves no destination behind', async () => {
    const dir = await tempDir();
    await expect(cloneFile(path.join(dir, 'nope'), path.join(dir, 'dest'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(fs.stat(path.join(dir, 'dest'))).rejects.toThrow();
  });
});
