import fs, { promises as fsp } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBrands } from '../src/brands.js';
import { listProjects } from '../src/estate.js';
import { readIdentity } from '../src/identity.js';
import { readMachineSettings } from '../src/machine.js';
import { tempDir } from './helpers/fixtures.js';
import { GUARD_MESSAGE, isGuardedPath } from './helpers/guard.js';

// These calls point at the REAL home on purpose. The guard throws before any of them reaches the disk. Should the guard
// ever fail, the write and rename below can only hit ENOENT (missing parent / missing source), never create a file.
const realHome = process.env.FLI_CORE_REAL_HOME as string;
const estate = path.join(realHome, 'dev', 'video-projects');

describe('isolate-home guard: tests cannot touch the live estate (F11)', () => {
  it('knows the real home', () => {
    expect(realHome).toBeTruthy();
  });

  it('listProjects on the real estate is refused by the guard (every collection unscanned)', async () => {
    const listing = await listProjects(path.join(estate, 'v-appydave'));
    for (const collection of [listing.members, listing.otherFolders, listing.archived]) {
      expect(collection).toMatchObject({ state: 'unscanned' });
      expect(collection.state === 'unscanned' && collection.message).toContain(GUARD_MESSAGE);
    }
  });

  it('fs.promises calls into guarded paths reject with the guard error', async () => {
    await expect(fsp.readdir(estate)).rejects.toThrow(GUARD_MESSAGE);
    await expect(
      fsp.readFile(path.join(realHome, '.config', 'appydave', 'brands.json')),
    ).rejects.toThrow(GUARD_MESSAGE);
    await expect(fsp.stat(path.join(realHome, '.fli'))).rejects.toThrow(GUARD_MESSAGE);
    await expect(
      fsp.writeFile(path.join(estate, 'no-such-dir-fli-core-guard', 'x.json'), '{}'),
    ).rejects.toThrow(GUARD_MESSAGE);
    await expect(
      fsp.rename('/tmp/nope', path.join(realHome, '.fli', 'machine.json')),
    ).rejects.toThrow(GUARD_MESSAGE);
    await expect(fsp.readdir(new URL(`file://${estate}`))).rejects.toThrow(GUARD_MESSAGE);
  });

  it('sync fs calls into guarded paths throw', () => {
    expect(() => fs.readdirSync(estate)).toThrow(GUARD_MESSAGE);
    expect(() => fs.existsSync(path.join(realHome, '.fli'))).toThrow(GUARD_MESSAGE);
  });

  it('library readers pointed at the real home come back refused, not read', async () => {
    const brands = await readBrands({ home: realHome });
    expect(brands).toMatchObject({ kind: 'invalid', reason: 'unreadable' });
    expect(brands?.kind === 'invalid' && brands.message).toContain(GUARD_MESSAGE);

    const machine = await readMachineSettings({ home: realHome });
    expect(machine.kind === 'invalid' && machine.message).toContain(GUARD_MESSAGE);

    const identity = await readIdentity(path.join(estate, 'v-appydave', 'a01-xmen'));
    expect(identity?.kind === 'invalid' && identity.message).toContain(GUARD_MESSAGE);
  });

  it('leaves temp dirs alone and checks paths, not prefixes (pure check, no disk access)', async () => {
    const dir = await tempDir();
    await fsp.writeFile(path.join(dir, 'ok.txt'), 'ok');
    expect(await fsp.readdir(dir)).toEqual(['ok.txt']);
    expect(isGuardedPath(dir)).toBe(false);
    expect(isGuardedPath(path.join(realHome, 'dev', 'video-projects-not-it'))).toBe(false);
    expect(isGuardedPath(path.join(realHome, 'dev', 'video-projects'))).toBe(true);
    expect(isGuardedPath(path.join(realHome, 'dev', 'video-projects', 'v-appydave', 'a01'))).toBe(
      true,
    );
    expect(isGuardedPath(path.join(realHome, '.fli', '..', '.fli', 'machine.json'))).toBe(true);
    if (process.platform === 'darwin') {
      expect(isGuardedPath(path.join(realHome, 'dev', 'VIDEO-PROJECTS'))).toBe(true);
    }
  });
});
