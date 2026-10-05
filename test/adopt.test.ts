import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ProjectIdentity, adoptIdentity, readIdentity, writeIdentity } from '../src/identity.js';
import { buildTree, identity, tempDir } from './helpers/fixtures.js';

describe('adoptIdentity (plan §4C item 4: a re-run keeps the same uuid)', () => {
  it('creates an identity from the folder name, with a fresh uuid', async () => {
    const root = await tempDir();
    const dir = path.join(root, 'b05-title-lab');
    await fs.mkdir(dir);
    const r = await adoptIdentity(dir, { brand: 'aitldr' });
    expect(r).toMatchObject({
      kind: 'created',
      identity: { brand: 'aitldr', code: 'b05', name: 'title-lab' },
    });
    expect(
      ProjectIdentity.safeParse(
        (await readIdentity(dir))?.kind === 'valid'
          ? ((await readIdentity(dir)) as { value: unknown }).value
          : null,
      ).success,
    ).toBe(true);
  });

  it('accepts an existing id on create (a stable id carried from elsewhere)', async () => {
    const root = await tempDir();
    const dir = path.join(root, 'b05-title-lab');
    await fs.mkdir(dir);
    const id = randomUUID();
    expect(await adoptIdentity(dir, { brand: 'aitldr', id })).toMatchObject({
      kind: 'created',
      identity: { id },
    });
  });

  it('a re-run keeps the id and writes nothing (kept)', async () => {
    const root = await tempDir();
    const dir = path.join(root, 'b05-title-lab');
    await fs.mkdir(dir);
    const first = await adoptIdentity(dir, { brand: 'aitldr' });
    const before = await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8');
    const second = await adoptIdentity(dir, { brand: 'aitldr' });
    expect(second.kind).toBe('kept');
    expect(
      'identity' in first && 'identity' in second && second.identity.id === first.identity.id,
    ).toBe(true);
    expect(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')).toBe(before);
  });

  it('a project re-routed a05 → b05 keeps its id and takes the new code', async () => {
    const root = await tempDir();
    const dir = path.join(root, 'b05-title-lab');
    const old = identity({ brand: 'aitldr', code: 'a05', name: 'title-lab' });
    await buildTree(dir, { 'fli.studio.json': old });
    const r = await adoptIdentity(dir, { code: 'b05' });
    expect(r).toMatchObject({
      kind: 'updated',
      identity: { id: old.id, code: 'b05', createdAt: old.createdAt },
    });
    expect(await readIdentity(dir)).toMatchObject({ value: { id: old.id, code: 'b05' } });
  });

  it('refuses a different id and never overwrites', async () => {
    const dir = await tempDir();
    const old = identity();
    await buildTree(dir, { 'fli.studio.json': old });
    const r = await adoptIdentity(dir, { id: randomUUID() });
    expect(r).toMatchObject({ kind: 'refused', reason: 'different-id', existingId: old.id });
    expect(await readIdentity(dir)).toMatchObject({ value: { id: old.id } });
  });

  it('refuses an unreadable existing file, and a folder it cannot name', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, 'fli.studio.json'), '{ nope');
    expect(await adoptIdentity(dir, { brand: 'x' })).toMatchObject({
      kind: 'refused',
      reason: 'existing-invalid',
    });
    expect(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')).toBe('{ nope');
    const odd = path.join(await tempDir(), 'Not A Project');
    await fs.mkdir(odd);
    expect(await adoptIdentity(odd, { brand: 'x' })).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
    expect(await adoptIdentity(odd, {})).toMatchObject({
      kind: 'refused',
      reason: 'invalid-input',
    });
  });

  it('keeps intents already there and sets the ones given', async () => {
    const root = await tempDir();
    const dir = path.join(root, 'b05-title-lab');
    await buildTree(dir, {
      'fli.studio.json': identity({
        code: 'b05',
        name: 'title-lab',
        aspect: '9:16',
        shape: 'shorts',
      }),
    });
    const r = await adoptIdentity(dir, { languages: ['en', 'th'] });
    expect(r).toMatchObject({
      kind: 'updated',
      identity: { aspect: '9:16', shape: 'shorts', languages: ['en', 'th'] },
    });
  });

  it('the decision: ProjectIdentity stays non-strict and strips unknown keys (series lives in fli.series.json)', async () => {
    const dir = await tempDir();
    const id = identity();
    await buildTree(dir, { 'fli.studio.json': { ...id, series: 'days-45' } });
    const read = await readIdentity(dir);
    expect(read?.kind === 'valid' && 'series' in read.value).toBe(false);
    // …and a rewrite through writeIdentity therefore drops it: nothing may keep data in an unknown key.
    await writeIdentity(dir, id);
    expect(
      JSON.parse(await fs.readFile(path.join(dir, 'fli.studio.json'), 'utf8')),
    ).not.toHaveProperty('series');
  });
});
