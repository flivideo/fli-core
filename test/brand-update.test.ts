import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BRAND_SETTINGS_FILE,
  brandSettingsVersion,
  readBrandSettings,
  updateBrandSettings,
  writeBrandSettings,
  type BrandSettings,
} from '../src/brand-settings.js';
import { takeLock } from '../src/fs-utils.js';
import { tempDir } from './helpers/fixtures.js';

const BASE: BrandSettings = {
  schema: 1,
  brand: 'appydave',
  colour: '#ffde59',
  publish: { ctas: { primaryCta: { label: 'Join', url: 'https://example.com' } } },
};

async function brand(settings: BrandSettings | null = BASE): Promise<string> {
  const root = await tempDir('fli-core-brand-');
  if (settings) await writeBrandSettings(root, settings);
  return root;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('updateBrandSettings (W8, 2026-10-29: no lost updates on fli.brand.json)', () => {
  it('two concurrent updates both survive: each mutate sees what is on disk inside the lock', async () => {
    const root = await brand();
    const [a, b] = await Promise.all([
      updateBrandSettings(root, async (current) => {
        await pause(30); // hold the lock while the other writer waits
        return {
          ...(current as BrandSettings),
          youtube: { activePlaylists: ['PL-STUDIO'], defaultPlaylists: [] },
        };
      }),
      updateBrandSettings(root, (current) => ({
        ...(current as BrandSettings),
        publish: {
          ...current?.publish,
          ctas: { primaryCta: { label: 'HUB-CTA', url: 'https://x' } },
        },
      })),
    ]);
    expect([a.kind, b.kind]).toEqual(['written', 'written']);
    const read = await readBrandSettings(root);
    expect(read?.kind).toBe('valid');
    const value = (read as { value: BrandSettings }).value;
    expect(value.youtube?.activePlaylists).toEqual(['PL-STUDIO']);
    expect(value.publish?.ctas?.primaryCta?.label).toBe('HUB-CTA');
    await expect(fs.readdir(root)).resolves.toEqual([BRAND_SETTINGS_FILE]); // lock and temp files gone
  });

  it('many concurrent writers: none lost', async () => {
    const root = await brand();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        updateBrandSettings(root, (current) => ({
          ...(current as BrandSettings),
          youtube: {
            activePlaylists: [...(current?.youtube?.activePlaylists ?? []), `PL-${i}`],
            defaultPlaylists: [],
          },
        })),
      ),
    );
    expect(results.every((r) => r.kind === 'written')).toBe(true);
    const value = ((await readBrandSettings(root)) as { value: BrandSettings }).value;
    expect(value.youtube?.activePlaylists).toHaveLength(12);
  });

  it('hands null for an absent file, and creates it', async () => {
    const root = await brand(null);
    let seen: BrandSettings | null | undefined;
    const result = await updateBrandSettings(root, (current) => {
      seen = current;
      return BASE;
    });
    expect(seen).toBeNull();
    expect(result).toMatchObject({ kind: 'written', settings: { brand: 'appydave' } });
  });

  it('answers the version of what it wrote, equal to brandSettingsVersion of the file', async () => {
    const root = await brand();
    const file = path.join(root, BRAND_SETTINGS_FILE);
    const before = await brandSettingsVersion(file);
    const result = await updateBrandSettings(root, (current) => ({
      ...(current as BrandSettings),
      colour: '#000',
    }));
    expect(result.kind).toBe('written');
    const after = await brandSettingsVersion(file);
    expect(after).toMatch(/^[0-9a-f]{64}$/);
    expect(after).not.toBe(before);
    expect(result.kind === 'written' && result.version).toBe(after);
  });

  it('refuses an unusable file and never overwrites it', async () => {
    const root = await brand(null);
    const file = path.join(root, BRAND_SETTINGS_FILE);
    await fs.writeFile(file, '{ not json');
    const result = await updateBrandSettings(root, () => BASE);
    expect(result).toMatchObject({ kind: 'refused', reason: 'unusable-file' });
    expect(await fs.readFile(file, 'utf8')).toBe('{ not json');
    await expect(fs.stat(`${file}.lock`)).rejects.toThrow();
  });

  it('refuses invalid output from mutate, writing nothing', async () => {
    const root = await brand();
    const file = path.join(root, BRAND_SETTINGS_FILE);
    const version = await brandSettingsVersion(file);
    const result = await updateBrandSettings(root, () => ({ ...BASE, colour: 'yellow' }));
    expect(result).toMatchObject({ kind: 'refused', reason: 'invalid-input' });
    expect(await brandSettingsVersion(file)).toBe(version);
  });

  it('a throwing mutate releases the lock, writes nothing and rethrows', async () => {
    const root = await brand();
    const file = path.join(root, BRAND_SETTINGS_FILE);
    const version = await brandSettingsVersion(file);
    await expect(
      updateBrandSettings(root, () => {
        throw new Error('changed-elsewhere');
      }),
    ).rejects.toThrow('changed-elsewhere');
    expect(await brandSettingsVersion(file)).toBe(version);
    await expect(fs.stat(`${file}.lock`)).rejects.toThrow();
  });

  it('answers busy when another writer holds the lock past the wait', async () => {
    const root = await brand();
    const lock = path.join(root, `${BRAND_SETTINGS_FILE}.lock`);
    expect(await takeLock(lock, 0, 60_000)).toBe(true);
    const result = await updateBrandSettings(root, () => BASE, { waitMs: 50 });
    expect(result).toMatchObject({ kind: 'refused', reason: 'busy' });
    await fs.rm(lock);
  });

  it('answers io-error when the brand root does not exist', async () => {
    const result = await updateBrandSettings('/nonexistent/brand-root', () => BASE);
    expect(result).toMatchObject({ kind: 'refused', reason: 'io-error' });
  });
});

describe('brandSettingsVersion', () => {
  it('is the sha256 of the bytes; absent → null', async () => {
    const root = await brand();
    const file = path.join(root, BRAND_SETTINGS_FILE);
    const v1 = await brandSettingsVersion(file);
    expect(await brandSettingsVersion(file)).toBe(v1);
    await fs.appendFile(file, ' ');
    expect(await brandSettingsVersion(file)).not.toBe(v1);
    expect(await brandSettingsVersion(path.join(root, 'missing.json'))).toBeNull();
  });

  it('throws on a file it cannot read for another reason', async () => {
    const root = await brand();
    await expect(brandSettingsVersion(root)).rejects.toThrow();
  });
});
