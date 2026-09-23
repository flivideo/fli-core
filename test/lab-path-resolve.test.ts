import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { labPath, resolveLabPath } from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

/** FC-40 (d04 UAT): the lab is keyed on the code — a renamed project finds its lab and undo history. */
describe('resolveLabPath — the code is the key, the folder name is display', () => {
  const input = (project: string) => ({ brand: 'appydave', project, app: 'flicut' });

  it('is labPath when the lab is already under the current name, and creates nothing', async () => {
    const labRoot = await tempDir();
    const got = await resolveLabPath(input('d04-autopilot'), { labRoot });
    expect(got).toEqual({
      path: labPath(input('d04-autopilot'), { labRoot }),
      migratedFrom: null,
      ambiguous: [],
    });
    expect(await fs.readdir(labRoot)).toEqual([]);
    const here = path.join(labRoot, 'v-appydave', 'd04-autopilot', 'flicut');
    await fs.mkdir(here, { recursive: true });
    await fs.mkdir(path.join(labRoot, 'v-appydave', 'd04-old-name'));
    expect((await resolveLabPath(input('d04-autopilot'), { labRoot })).migratedFrom).toBeNull();
  });

  it('moves the one lab under an old name into place — every app’s part of it', async () => {
    const labRoot = await tempDir();
    const brand = path.join(labRoot, 'v-appydave');
    const old = path.join(brand, 'd04-d04-autopilot-test');
    await fs.mkdir(path.join(old, 'flicut', 'undo'), { recursive: true });
    await fs.writeFile(path.join(old, 'flicut', 'undo', 'h.json'), '{}');
    await fs.mkdir(path.join(old, 'flicast'), { recursive: true });
    await fs.mkdir(path.join(brand, 'd05-other', 'flicut'), { recursive: true });
    const got = await resolveLabPath(input('d04-autopilot-test'), { labRoot });
    expect(got.migratedFrom).toBe(old);
    expect(got.path).toBe(path.join(brand, 'd04-autopilot-test', 'flicut') + path.sep);
    expect(await fs.readFile(path.join(got.path, 'undo', 'h.json'), 'utf8')).toBe('{}');
    expect((await fs.readdir(brand)).sort()).toEqual(['d04-autopilot-test', 'd05-other']);
  });

  it('never guesses between two old labs, and ignores names that are not <code>-<slug>', async () => {
    const labRoot = await tempDir();
    const brand = path.join(labRoot, 'v-appydave');
    for (const d of ['d04-first', 'd04-second', 'd04', 'notes'])
      await fs.mkdir(path.join(brand, d), { recursive: true });
    await fs.writeFile(path.join(brand, 'd04-file'), '');
    const got = await resolveLabPath(input('d04-third'), { labRoot });
    expect(got).toMatchObject({
      migratedFrom: null,
      ambiguous: [path.join(brand, 'd04-first'), path.join(brand, 'd04-second')],
    });
    expect((await fs.readdir(brand)).sort()).toEqual([
      'd04',
      'd04-file',
      'd04-first',
      'd04-second',
      'notes',
    ]);
  });

  it('a project folder that is not <code>-<slug>, or no brand lab yet: nothing to migrate', async () => {
    const labRoot = await tempDir();
    expect((await resolveLabPath(input('scratch'), { labRoot })).migratedFrom).toBeNull();
    expect((await resolveLabPath(input('d09-new'), { labRoot })).migratedFrom).toBeNull();
  });

  it('a lost race finds the winner’s folder in place; a real failure throws', async () => {
    const labRoot = await tempDir();
    const brand = path.join(labRoot, 'v-appydave');
    await fs.mkdir(path.join(brand, 'd04-old', 'flicut'), { recursive: true });
    const [a, b] = await Promise.all([
      resolveLabPath(input('d04-new'), { labRoot }),
      resolveLabPath(input('d04-new'), { labRoot }),
    ]);
    expect([a.migratedFrom, b.migratedFrom].filter(Boolean)).toHaveLength(1);
    expect(await fs.readdir(brand)).toEqual(['d04-new']);

    await fs.mkdir(path.join(brand, 'd06-old'));
    await fs.chmod(brand, 0o500);
    try {
      await expect(resolveLabPath(input('d06-new'), { labRoot })).rejects.toThrow();
    } finally {
      await fs.chmod(brand, 0o755);
    }
  });
});
