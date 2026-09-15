import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  BrandSettings,
  ReadBrandSettingsResult,
  readBrandSettings,
} from '../src/brand-settings.js';
import { ReadBrandsResult, readBrands } from '../src/brands.js';
import {
  NextCodeResult,
  ProjectListing,
  ResolveProjectResult,
  listProjects,
  nextCode,
  resolveProject,
} from '../src/estate.js';
import {
  ReadIdentityResult,
  WriteIdentityResult,
  readIdentity,
  writeIdentity,
} from '../src/identity.js';
import { MachineSettingsResult, readMachineSettings } from '../src/machine.js';
import { ParsedOpenArgs, parseOpenArgs } from '../src/open-args.js';
import { ParsedVideoFile, parseVideoFile } from '../src/video-file.js';
import { buildBrandRoot, buildTree, identity, tempDir } from './helpers/fixtures.js';

/** The schema accepts the value and returns it unchanged: no missing and no extra fields. */
function matches<S extends z.ZodType>(schema: S, value: unknown): void {
  expect(schema.parse(value)).toEqual(value);
}

describe('result schemas match what the functions return (F4)', () => {
  it('ProjectListing: scanned members, other folders (absent and invalid identity), archive', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    await buildTree(root, {
      'a05-broken/fli.studio.json': '{',
      'Odd Name/fli.studio.json': identity({ code: 'b02' }),
      'archived/notes/': null,
    });
    const listing = await listProjects(root);
    expect(listing.members.state === 'scanned' && listing.members.items).toHaveLength(2);
    matches(ProjectListing, listing);
  });

  it('ProjectListing: unscanned root, and unscanned archive under a readable root', async () => {
    matches(ProjectListing, await listProjects(path.join(await tempDir(), 'gone')));
    const root = await tempDir();
    await buildTree(root, { archived: 'file' });
    matches(ProjectListing, await listProjects(root));
  });

  it('ResolveProjectResult: every kind', async () => {
    const root = await tempDir();
    const shared = identity({ code: 'c01' });
    await buildTree(root, {
      'a01-xmen/fli.studio.json': identity(),
      'b01-one/fli.studio.json': identity({ code: 'b01' }),
      'b01-two/fli.studio.json': identity({ code: 'b01' }),
      'c01-a/fli.studio.json': shared,
      'c02-b/fli.studio.json': { ...shared, code: 'c02' },
      'd02-plain/': null,
    });
    const listing = await listProjects(root);
    const results = await Promise.all([
      resolveProject(listing, 'a01-xmen'),
      resolveProject(listing, 'a01'),
      resolveProject(listing, 'b01'),
      resolveProject(listing, shared.id),
      resolveProject(listing, 'd02-plain'),
      resolveProject(listing, 'zzz'),
      resolveProject(path.join(root, 'gone'), 'a01'),
    ]);
    expect(results.map((r) => r.kind)).toEqual([
      'found',
      'found',
      'ambiguous',
      'ambiguous',
      'not-a-project',
      'not-found',
      'unscanned',
    ]);
    for (const result of results) matches(ResolveProjectResult, result);
  });

  it('NextCodeResult: allocated and each refusal', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    const listing = await listProjects(root);
    const gone = await listProjects(path.join(root, 'gone'));
    await buildTree(root, { 'archived/z01-z99/': null });
    const full = await listProjects(root);
    for (const result of [
      nextCode(listing, 'a'),
      nextCode(listing, 'A'),
      nextCode(gone, 'a'),
      nextCode(full, 'z'),
    ]) {
      matches(NextCodeResult, result);
    }
  });

  it('WriteIdentityResult and ReadIdentityResult: every kind', async () => {
    const dir = await tempDir();
    const first = identity();
    const results = [
      await writeIdentity(dir, first),
      await writeIdentity(dir, first),
      await writeIdentity(dir, identity()),
      await writeIdentity(dir, { ...first, id: 'nope' }),
      await writeIdentity(path.join(dir, 'gone'), first),
    ];
    const invalidDir = await tempDir();
    await buildTree(invalidDir, { 'fli.studio.json': '{' });
    results.push(await writeIdentity(invalidDir, first));
    expect(results.map((r) => (r.kind === 'written' ? 'written' : r.reason))).toEqual([
      'written',
      'written',
      'different-id',
      'invalid-input',
      'io-error',
      'existing-invalid',
    ]);
    for (const result of results) matches(WriteIdentityResult, result);

    for (const read of [
      await readIdentity(dir),
      await readIdentity(invalidDir),
      await readIdentity(await tempDir()),
    ]) {
      matches(ReadIdentityResult, read);
    }
  });

  it('ReadBrandsResult, ReadBrandSettingsResult, MachineSettingsResult', async () => {
    const home = await tempDir();
    await buildTree(home, {
      '.config/appydave/brands.json': { brands: { appydave: { name: 'AppyDave' }, bad: {} } },
      'v-appydave/fli.brand.json': { schema: 1, brand: 'appydave', colour: '#ffde59' },
      'v-bad/fli.brand.json': { schema: 1 },
    });
    matches(ReadBrandsResult, await readBrands({ home }));
    matches(ReadBrandsResult, await readBrands({ path: path.join(home, 'missing.json') }));
    matches(ReadBrandSettingsResult, await readBrandSettings(path.join(home, 'v-appydave')));
    matches(ReadBrandSettingsResult, await readBrandSettings(path.join(home, 'v-bad')));
    expect(BrandSettings.parse({ schema: 1, brand: 'x', colour: '#fff' }).colour).toBe('#fff');

    matches(MachineSettingsResult, await readMachineSettings({ home }));
    await fs.mkdir(path.join(home, '.fli'));
    await fs.writeFile(path.join(home, '.fli', 'machine.json'), '{"schema":1,"labRoot":"/lab"}');
    matches(MachineSettingsResult, await readMachineSettings({ home }));
    await fs.writeFile(path.join(home, '.fli', 'machine.json'), '{"schema":2}');
    matches(MachineSettingsResult, await readMachineSettings({ home }));
  });

  it('ParsedOpenArgs and ParsedVideoFile', () => {
    matches(ParsedOpenArgs, parseOpenArgs(['--brand', 'appydave', '--video', 'not-a-folder'], {}));
    matches(ParsedOpenArgs, parseOpenArgs([], {}));
    for (const name of ['01-cut.mp4', '01-audio-dfn100.m4a', 'notes.txt']) {
      matches(ParsedVideoFile, parseVideoFile(name));
    }
  });
});
