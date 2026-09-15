import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { atomicWrite } from '../src/fs-utils.js';
import { ProjectIdentity, readIdentity, writeIdentity } from '../src/identity.js';
import { buildTree, identity, tempDir } from './helpers/fixtures.js';

describe('readIdentity', () => {
  it('returns null when fli.studio.json is absent', async () => {
    expect(await readIdentity(await tempDir())).toBeNull();
  });

  it('returns null when the folder itself is absent', async () => {
    expect(await readIdentity(path.join(await tempDir(), 'nope'))).toBeNull();
  });

  it('reads a valid identity', async () => {
    const dir = await tempDir();
    const id = identity();
    await buildTree(dir, { 'fli.studio.json': id });
    expect(await readIdentity(dir)).toEqual({
      kind: 'valid',
      path: path.join(dir, 'fli.studio.json'),
      value: id,
    });
  });

  it('returns a typed invalid result for text that is not JSON', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'fli.studio.json': '{ not json' });
    expect(await readIdentity(dir)).toMatchObject({ kind: 'invalid', reason: 'not-json' });
  });

  it('returns a typed invalid result for JSON that is not an identity', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'fli.studio.json': { ...identity(), id: 'not-a-uuid', schema: 2 } });
    const result = await readIdentity(dir);
    expect(result).toMatchObject({ kind: 'invalid', reason: 'schema' });
    expect(result?.kind === 'invalid' && result.message).toMatch(/id/);
  });

  it('returns a typed invalid result when fli.studio.json is a directory', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'fli.studio.json/': null });
    expect(await readIdentity(dir)).toMatchObject({ kind: 'invalid', reason: 'unreadable' });
  });
});

describe('ProjectIdentity schema', () => {
  it('accepts an offset timestamp and rejects a bad code or empty name', () => {
    expect(
      ProjectIdentity.safeParse(identity({ createdAt: '2026-09-15T20:00:00+10:00' })).success,
    ).toBe(true);
    expect(ProjectIdentity.safeParse(identity({ code: 'a1' })).success).toBe(false);
    expect(ProjectIdentity.safeParse(identity({ name: '' })).success).toBe(false);
    expect(ProjectIdentity.safeParse(identity({ createdAt: 'yesterday' })).success).toBe(false);
  });
});

describe('writeIdentity', () => {
  it('writes a new identity that reads back', async () => {
    const dir = await tempDir();
    const id = identity();
    const result = await writeIdentity(dir, id);
    expect(result).toEqual({
      kind: 'written',
      path: path.join(dir, 'fli.studio.json'),
      replaced: false,
    });
    expect(await readIdentity(dir)).toMatchObject({ kind: 'valid', value: id });
    expect(await fs.readdir(dir)).toEqual(['fli.studio.json']);
  });

  it('rewrites the same id', async () => {
    const dir = await tempDir();
    const id = identity();
    await writeIdentity(dir, id);
    const renamed = { ...id, name: 'X-Men Renamed' };
    expect(await writeIdentity(dir, renamed)).toMatchObject({ kind: 'written', replaced: true });
    expect(await readIdentity(dir)).toMatchObject({ kind: 'valid', value: renamed });
  });

  it('refuses to overwrite a different id — and the file is untouched', async () => {
    const dir = await tempDir();
    const original = identity();
    await writeIdentity(dir, original);
    const before = await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8');

    const result = await writeIdentity(dir, identity());
    expect(result).toMatchObject({
      kind: 'refused',
      reason: 'different-id',
      existingId: original.id,
    });
    expect(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')).toBe(before);
  });

  it('refuses to overwrite a malformed identity file — and the file is untouched', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'fli.studio.json': 'garbage' });
    expect(await writeIdentity(dir, identity())).toMatchObject({
      kind: 'refused',
      reason: 'existing-invalid',
    });
    expect(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')).toBe('garbage');
  });

  it('refuses invalid input without touching the disk', async () => {
    const dir = await tempDir();
    const result = await writeIdentity(dir, { ...identity(), id: 'nope' });
    expect(result).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    expect(await fs.readdir(dir)).toEqual([]);
  });

  it('refuses with io-error when the folder does not exist or is a file', async () => {
    const root = await tempDir();
    expect(await writeIdentity(path.join(root, 'missing'), identity())).toMatchObject({
      kind: 'refused',
      reason: 'io-error',
    });
    await buildTree(root, { afile: 'x' });
    expect(await writeIdentity(path.join(root, 'afile'), identity())).toMatchObject({
      kind: 'refused',
      reason: 'io-error',
    });
  });

  it.runIf(process.getuid?.() !== 0)(
    'refuses with io-error when the folder is read-only',
    async () => {
      const dir = await tempDir();
      await fs.chmod(dir, 0o500);
      try {
        expect(await writeIdentity(dir, identity())).toMatchObject({
          kind: 'refused',
          reason: 'io-error',
        });
      } finally {
        await fs.chmod(dir, 0o700);
      }
      expect(await fs.readdir(dir)).toEqual([]);
    },
  );

  it('strips unknown keys rather than writing them', async () => {
    const dir = await tempDir();
    await writeIdentity(dir, { ...identity(), extra: 'x' } as never);
    const json = JSON.parse(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(Object.keys(json).sort()).toEqual([
      'brand',
      'code',
      'createdAt',
      'id',
      'name',
      'schema',
    ]);
  });
});

describe('atomicWrite', () => {
  it('leaves no temp file behind when the rename fails', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'target/': null });
    await expect(atomicWrite(path.join(dir, 'target'), 'x')).rejects.toThrow();
    expect(await fs.readdir(dir)).toEqual(['target']);
  });

  it('replaces the file in one step', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'a.json');
    await atomicWrite(file, 'one');
    const spy = vi.spyOn(fs, 'writeFile');
    await atomicWrite(file, 'two');
    expect(spy.mock.calls[0]?.[0]).not.toBe(file);
    spy.mockRestore();
    expect(await fs.readFile(file, 'utf8')).toBe('two');
    expect(await fs.readdir(dir)).toEqual(['a.json']);
  });
});
