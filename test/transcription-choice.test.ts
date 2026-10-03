import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBrandSettings, writeBrandSettings } from '../src/brand-settings.js';
import { readIdentity, writeIdentity } from '../src/identity.js';
import { identity, tempDir } from './helpers/fixtures.js';

/** Transcription providers per level (FliStudio Settings → Transcription, 2026-10-03): kept through every write. */
describe('transcription choice in fli.brand.json and fli.studio.json', () => {
  it('a brand keeps its transcription block, and a write keeps its colour', async () => {
    const root = await tempDir();
    const settings = {
      schema: 1 as const,
      brand: 'appydave',
      colour: '#ffde59',
      transcription: { editGrade: 'elevenlabs' },
    };
    expect(await writeBrandSettings(root, settings)).toEqual({
      kind: 'written',
      path: path.join(root, 'fli.brand.json'),
    });
    const read = await readBrandSettings(root);
    expect(read).toMatchObject({ kind: 'valid', value: settings });
  });

  it('refuses an invalid brand file rather than writing it', async () => {
    const root = await tempDir();
    const out = await writeBrandSettings(root, {
      schema: 1,
      brand: 'appydave',
      colour: 'yellow',
    });
    expect(out).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    await expect(fs.stat(path.join(root, 'fli.brand.json'))).rejects.toThrow();
  });

  it('a project identity carries its transcription block through a rewrite', async () => {
    const dir = await tempDir();
    const id = { ...identity(), transcription: { fast: 'mlx-whisper' } };
    expect((await writeIdentity(dir, id)).kind).toBe('written');
    expect((await writeIdentity(dir, { ...id, aspect: '9:16' })).kind).toBe('written');
    expect(await readIdentity(dir)).toMatchObject({
      kind: 'valid',
      value: { aspect: '9:16', transcription: { fast: 'mlx-whisper' } },
    });
  });
});
