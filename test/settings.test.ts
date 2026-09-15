import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBrandSettings } from '../src/brand-settings.js';
import {
  brandFolderName,
  brandsFilePath,
  readBrands,
  resolveBrandRoot,
  type Brand,
} from '../src/brands.js';
import { labPath } from '../src/lab-path.js';
import { defaultLabRoot, machineSettingsPath, readMachineSettings } from '../src/machine.js';
import { FliCoreError } from '../src/results.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

/** The shape of the real registry (`~/.config/appydave/brands.json`), with fixture values. */
const REGISTRY = {
  meta: { version: '1.0' },
  brands: {
    appydave: {
      name: 'AppyDave',
      shortcut: 'ad',
      type: 'owned',
      youtube_channels: ['appydave'],
      locations: {
        video_projects: '/Users/someone-else/dev/video-projects/v-appydave',
        ssd_backup: '/Volumes/T7/x',
      },
      aws: { profile: 'fixture' },
      settings: { s3_cleanup_days: 90 },
    },
    'guy-monroe': {
      name: 'Guy Monroe',
      shortcut: 'guy',
      type: 'client',
      locations: { video_projects: '/Users/davidcruwys/dev/video-projects/v-guy' },
    },
    elsewhere: { name: 'Elsewhere', locations: { video_projects: '/Volumes/Media/v-elsewhere' } },
    nowhere: { name: 'Nowhere' },
  },
  users: {},
};

describe('readBrands', () => {
  it('reads the registry shape into Brand[] in registry order, ignoring other fields', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'brands.json': REGISTRY });
    const result = await readBrands({ path: path.join(dir, 'brands.json') });
    expect(result?.kind).toBe('valid');
    expect(result?.kind === 'valid' && result.skipped).toEqual([]);
    expect(result?.kind === 'valid' && result.value).toEqual([
      {
        key: 'appydave',
        name: 'AppyDave',
        shortcut: 'ad',
        type: 'owned',
        videoProjects: '/Users/someone-else/dev/video-projects/v-appydave',
      },
      {
        key: 'guy-monroe',
        name: 'Guy Monroe',
        shortcut: 'guy',
        type: 'client',
        videoProjects: '/Users/davidcruwys/dev/video-projects/v-guy',
      },
      { key: 'elsewhere', name: 'Elsewhere', videoProjects: '/Volumes/Media/v-elsewhere' },
      { key: 'nowhere', name: 'Nowhere' },
    ]);
  });

  it('defaults to <home>/.config/appydave/brands.json with an injectable home', async () => {
    const home = await tempDir();
    await buildTree(home, { '.config/appydave/brands.json': REGISTRY });
    expect(brandsFilePath({ home })).toBe(path.join(home, '.config', 'appydave', 'brands.json'));
    expect((await readBrands({ home }))?.kind).toBe('valid');
  });

  it('with no options, reads under os.homedir() — the isolated test home, never the real one', async () => {
    expect(brandsFilePath()).toBe(path.join(os.homedir(), '.config', 'appydave', 'brands.json'));
    expect(os.homedir()).not.toBe(process.env.FLI_CORE_REAL_HOME);
    expect(await readBrands()).toBeNull();
  });

  it('returns null when missing and invalid when there is no brands object', async () => {
    const dir = await tempDir();
    expect(await readBrands({ path: path.join(dir, 'brands.json') })).toBeNull();
    await buildTree(dir, {
      'bad.json': { brands: ['appydave'] },
      'none.json': { meta: {} },
      'text.json': '{',
    });
    for (const [name, reason] of [
      ['bad.json', 'schema'],
      ['none.json', 'schema'],
      ['text.json', 'not-json'],
    ]) {
      expect(await readBrands({ path: path.join(dir, name as string) })).toMatchObject({
        kind: 'invalid',
        reason,
      });
    }
  });

  it('skips one bad entry and keeps the rest (F8)', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      'brands.json': {
        brands: {
          appydave: { name: 'AppyDave' },
          broken: { shortcut: 'b' },
          '': { name: 'No key' },
          alsoBroken: 'not an object',
        },
      },
    });
    const result = await readBrands({ path: path.join(dir, 'brands.json') });
    expect(result).toMatchObject({
      kind: 'valid',
      value: [{ key: 'appydave', name: 'AppyDave' }],
      skipped: [
        { key: 'broken', issues: [expect.stringMatching(/^name:/)] },
        { key: '', issues: ['key: must not be empty'] },
        { key: 'alsoBroken', issues: [expect.any(String)] },
      ],
    });
  });
});

describe('resolveBrandRoot (A5)', () => {
  const appydave: Brand = {
    key: 'appydave',
    name: 'AppyDave',
    videoProjects: '/Users/davidcruwys/dev/video-projects/v-appydave',
  };

  it('rewrites any /Users/<anyone>/ prefix to the current home', () => {
    expect(resolveBrandRoot(appydave, undefined, { home: '/Users/janreyes' })).toBe(
      '/Users/janreyes/dev/video-projects/v-appydave',
    );
    expect(
      resolveBrandRoot({ ...appydave, videoProjects: '/Users/someone-else/v-x' }, null, {
        home: '/home/mary',
      }),
    ).toBe('/home/mary/v-x');
    expect(
      resolveBrandRoot({ ...appydave, videoProjects: '/Users/bob' }, null, { home: '/Users/jan' }),
    ).toBe('/Users/jan');
  });

  it('defaults the home to os.homedir()', () => {
    expect(resolveBrandRoot(appydave)).toBe(
      path.join(os.homedir(), 'dev/video-projects/v-appydave'),
    );
  });

  it('leaves /Users/Shared alone: it is not a user home', () => {
    expect(
      resolveBrandRoot({ ...appydave, videoProjects: '/Users/Shared/v-x' }, null, {
        home: '/Users/jan',
      }),
    ).toBe('/Users/Shared/v-x');
  });

  it('leaves a path outside /Users alone', () => {
    expect(
      resolveBrandRoot({ ...appydave, videoProjects: '/Volumes/Media/v-x/' }, null, {
        home: '/Users/jan',
      }),
    ).toBe('/Volumes/Media/v-x/');
    expect(
      resolveBrandRoot({ ...appydave, videoProjects: '/Usersx/v-x' }, null, { home: '/Users/jan' }),
    ).toBe('/Usersx/v-x');
  });

  it('applies the machine brandRoots override first', () => {
    expect(
      resolveBrandRoot(
        appydave,
        { brandRoots: { appydave: '/Volumes/Big/v-appydave' } },
        { home: '/Users/jan' },
      ),
    ).toBe('/Volumes/Big/v-appydave');
    expect(
      resolveBrandRoot(appydave, { brandRoots: { other: '/x' } }, { home: '/Users/jan' }),
    ).toBe('/Users/jan/dev/video-projects/v-appydave');
  });

  it('returns null for a brand with no video_projects location and no override', () => {
    expect(resolveBrandRoot({ key: 'nowhere', name: 'Nowhere' }, {})).toBeNull();
    expect(
      resolveBrandRoot({ key: 'nowhere', name: 'Nowhere' }, { brandRoots: { nowhere: '/v' } }),
    ).toBe('/v');
  });
});

describe('brandFolderName (F3)', () => {
  const guy: Brand = {
    key: 'guy-monroe',
    name: 'Guy Monroe',
    videoProjects: '/Users/davidcruwys/dev/video-projects/v-guy',
  };

  it('is the basename of the resolved root, not v-<key>', () => {
    expect(brandFolderName(guy, null, { home: '/Users/jan' })).toBe('v-guy');
    expect(
      brandFolderName({ key: 'appydave', name: 'AppyDave', videoProjects: '/Users/x/v-appydave' }),
    ).toBe('v-appydave');
  });

  it('follows a machine override, trailing separator stripped', () => {
    expect(brandFolderName(guy, { brandRoots: { 'guy-monroe': '/Volumes/T7/v-guy/' } })).toBe(
      'v-guy',
    );
  });

  it('is null without a root, or for a root with no folder name', () => {
    expect(brandFolderName({ key: 'nowhere', name: 'Nowhere' })).toBeNull();
    expect(brandFolderName(guy, { brandRoots: { 'guy-monroe': '/' } })).toBeNull();
  });
});

describe('readBrandSettings (O6)', () => {
  it('reads fli.brand.json', async () => {
    const root = await tempDir();
    await buildTree(root, {
      'fli.brand.json': { schema: 1, brand: 'appydave', colour: '#ffde59' },
    });
    expect(await readBrandSettings(root)).toEqual({
      kind: 'valid',
      path: path.join(root, 'fli.brand.json'),
      value: { schema: 1, brand: 'appydave', colour: '#ffde59' },
    });
  });

  it('returns null when missing, never an error', async () => {
    expect(await readBrandSettings(await tempDir())).toBeNull();
  });

  it.each([
    [{ schema: 1, brand: 'appydave', colour: 'yellow' }, 'schema'],
    [{ schema: 1, brand: 'appydave', colour: '#ffde5' }, 'schema'],
    [{ schema: 2, brand: 'appydave', colour: '#fff' }, 'schema'],
    ['{', 'not-json'],
  ])('returns a typed invalid result for %j', async (content, reason) => {
    const root = await tempDir();
    await buildTree(root, { 'fli.brand.json': content });
    expect(await readBrandSettings(root)).toMatchObject({ kind: 'invalid', reason });
  });
});

describe('readMachineSettings (D5)', () => {
  it('returns defaults when ~/.fli/machine.json is missing', async () => {
    const home = await tempDir();
    expect(await readMachineSettings({ home })).toEqual({
      kind: 'valid',
      path: path.join(home, '.fli', 'machine.json'),
      source: 'default',
      value: { schema: 1, labRoot: path.join(home, 'fli', 'lab') },
    });
  });

  it('reads the file and fills the lab root default', async () => {
    const home = await tempDir();
    await buildTree(home, {
      '.fli/machine.json': {
        schema: 1,
        brandRoots: { appydave: '/Volumes/Big/v-appydave' },
        apps: { flicut: '/opt/flicut' },
      },
    });
    expect(await readMachineSettings({ home })).toMatchObject({
      kind: 'valid',
      source: 'file',
      value: {
        schema: 1,
        brandRoots: { appydave: '/Volumes/Big/v-appydave' },
        apps: { flicut: '/opt/flicut' },
        labRoot: path.join(home, 'fli', 'lab'),
      },
    });
  });

  it('refuses relative paths and bad JSON with a typed invalid result', async () => {
    const home = await tempDir();
    await buildTree(home, { '.fli/machine.json': { schema: 1, labRoot: 'fli/lab' } });
    expect(await readMachineSettings({ home })).toMatchObject({
      kind: 'invalid',
      reason: 'schema',
    });
    await buildTree(home, { '.fli/machine.json': 'nope' });
    expect(await readMachineSettings({ home })).toMatchObject({
      kind: 'invalid',
      reason: 'not-json',
    });
  });

  it('defaults the home to os.homedir() (the isolated test home)', async () => {
    expect(machineSettingsPath()).toBe(path.join(os.homedir(), '.fli', 'machine.json'));
    expect(await readMachineSettings()).toMatchObject({
      source: 'default',
      value: { labRoot: defaultLabRoot() },
    });
  });
});

describe('labPath (spec §11 #14)', () => {
  const input = { brand: 'appydave', project: 'a01-xmen', app: 'flicut', subject: '01-xmen' };

  it('with no machine.json, resolves under ~/fli/lab', async () => {
    const home = await tempDir();
    const machine = await readMachineSettings({ home });
    expect(machine.kind).toBe('valid');
    const settings = machine.kind === 'valid' ? machine.value : undefined;
    expect(labPath(input, settings)).toBe(`${home}/fli/lab/v-appydave/a01-xmen/flicut/01-xmen/`);
    expect(labPath(input)).toBe(`${os.homedir()}/fli/lab/v-appydave/a01-xmen/flicut/01-xmen/`);
  });

  it('with a lab-root override in machine.json, resolves under that root', async () => {
    const home = await tempDir();
    await buildTree(home, { '.fli/machine.json': { schema: 1, labRoot: '/Volumes/Scratch/lab' } });
    const machine = await readMachineSettings({ home });
    const settings = machine.kind === 'valid' ? machine.value : undefined;
    expect(labPath(input, settings)).toBe(
      '/Volumes/Scratch/lab/v-appydave/a01-xmen/flicut/01-xmen/',
    );
  });

  it('takes the brand folder from brandRoot: Guy Monroe lands in v-guy (F3)', () => {
    const guy = { brand: 'guy-monroe', project: 'a01-x', app: 'flicut' };
    expect(
      labPath({ ...guy, brandRoot: '/Users/jan/dev/video-projects/v-guy' }, { labRoot: '/lab' }),
    ).toBe('/lab/v-guy/a01-x/flicut/');
    expect(
      labPath(
        { project: 'a01-x', app: 'flicut', brandRoot: '/Volumes/T7/v-guy/' },
        { labRoot: '/lab' },
      ),
    ).toBe('/lab/v-guy/a01-x/flicut/');
  });

  it('refuses when neither brand nor brandRoot is given, or brandRoot is relative or has no folder', () => {
    expect(() => labPath({ project: 'a01-x', app: 'flicut' })).toThrow(FliCoreError);
    expect(() => labPath({ project: 'a01-x', app: 'flicut', brandRoot: 'v-guy' })).toThrow(
      FliCoreError,
    );
    expect(() => labPath({ project: 'a01-x', app: 'flicut', brandRoot: '/' })).toThrow(
      FliCoreError,
    );
  });

  it('omits the subject when absent and accepts a v- brand folder name', () => {
    expect(
      labPath({ brand: 'v-appydave', project: 'a01-xmen', app: 'overlays' }, { labRoot: '/lab' }),
    ).toBe('/lab/v-appydave/a01-xmen/overlays/');
  });

  it('writes nothing', async () => {
    const home = await tempDir();
    labPath(input, { labRoot: path.join(home, 'fli', 'lab') });
    const { readdir } = await import('node:fs/promises');
    expect(await readdir(home)).toEqual([]);
  });

  it.each([
    { ...input, project: '../escape' },
    { ...input, app: 'a/b' },
    { ...input, subject: '..' },
    { ...input, brand: '' },
  ])('refuses a part that is not one path segment: %j', (bad) => {
    expect(() => labPath(bad)).toThrow(FliCoreError);
  });
});
