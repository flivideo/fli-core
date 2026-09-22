import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Brand } from '../src/brands.js';
import { OpenContextResult, resolveOpenContext } from '../src/open-context.js';
import { parseOpenArgs } from '../src/open-args.js';
import { buildTree, identity, tempDir, walk } from './helpers/fixtures.js';

interface Estate {
  home: string;
  brands: Brand[];
  ids: Record<string, string>;
}

/** A fake home with two brand roots in the registry shape: appydave (v-<key>) and guy-monroe (root v-guy). */
async function estate(): Promise<Estate> {
  const home = await tempDir();
  const xmen = identity({ code: 'a01' });
  const guy = identity({ code: 'a01', brand: 'guy-monroe' });
  await buildTree(home, {
    'dev/video-projects/v-appydave/a01-xmen/fli.studio.json': xmen,
    'dev/video-projects/v-appydave/a01-xmen/videos/01-xmen/01-cut.mp4': '',
    'dev/video-projects/v-appydave/a01-xmen/videos/02-afile': 'not a folder',
    'dev/video-projects/v-appydave/b01-one/fli.studio.json': identity({ code: 'b01' }),
    'dev/video-projects/v-appydave/b01-two/fli.studio.json': identity({ code: 'b01' }),
    'dev/video-projects/v-appydave/d02-cutty-audio-cleanup/': null,
    'dev/video-projects/v-guy/a01-guy-intro/fli.studio.json': guy,
  });
  const brands: Brand[] = [
    {
      key: 'appydave',
      name: 'AppyDave',
      videoProjects: '/Users/davidcruwys/dev/video-projects/v-appydave',
    },
    {
      key: 'guy-monroe',
      name: 'Guy Monroe',
      videoProjects: '/Users/davidcruwys/dev/video-projects/v-guy',
    },
    {
      key: 'unmounted',
      name: 'Unmounted',
      videoProjects: '/Volumes/NoSuchDrive-fli-core/v-unmounted',
    },
    { key: 'relative', name: 'Relative', videoProjects: 'video-projects/v-relative' },
    { key: 'nowhere', name: 'Nowhere' },
  ];
  return { home, brands, ids: { xmen: xmen.id, guy: guy.id } };
}

async function resolve(
  args: Parameters<typeof resolveOpenContext>[0],
  extra: Partial<Parameters<typeof resolveOpenContext>[1]> = {},
): Promise<{ result: OpenContextResult; env: Estate }> {
  const env = await estate();
  const result = await resolveOpenContext(args, { brands: env.brands, home: env.home, ...extra });
  expect(OpenContextResult.parse(result)).toEqual(result);
  return { result, env };
}

describe('resolveOpenContext (open contract §5, F5)', () => {
  it('resolved: brand + project folder → OpenContext', async () => {
    const { result, env } = await resolve({ brand: 'appydave', project: 'a01-xmen' });
    expect(result).toEqual({
      kind: 'resolved',
      context: {
        brand: 'appydave',
        projectDir: path.join(env.home, 'dev/video-projects/v-appydave/a01-xmen'),
        projectId: env.ids.xmen,
      },
    });
  });

  it('resolved: by whole code, with a video that exists', async () => {
    const { result, env } = await resolve({ brand: 'appydave', project: 'a01', video: '01-xmen' });
    expect(result).toMatchObject({
      kind: 'resolved',
      context: { projectId: env.ids.xmen, video: '01-xmen' },
    });
  });

  it('resolved: a brand whose key is not its root name (guy-monroe → v-guy)', async () => {
    const { result, env } = await resolve({ brand: 'guy-monroe', project: 'a01' });
    expect(result).toEqual({
      kind: 'resolved',
      context: {
        brand: 'guy-monroe',
        projectDir: path.join(env.home, 'dev/video-projects/v-guy/a01-guy-intro'),
        projectId: env.ids.guy,
      },
    });
  });

  it('resolved: a machine brandRoots override wins', async () => {
    const env = await estate();
    const result = await resolveOpenContext(
      { brand: 'unmounted', project: 'a01-guy-intro' },
      {
        brands: env.brands,
        home: env.home,
        machine: { brandRoots: { unmounted: path.join(env.home, 'dev/video-projects/v-guy') } },
      },
    );
    expect(result).toMatchObject({
      kind: 'resolved',
      context: { brand: 'unmounted', projectId: env.ids.guy },
    });
  });

  it('missing: lists what is absent; video only when required', async () => {
    expect((await resolve({})).result).toEqual({ kind: 'missing', missing: ['brand', 'project'] });
    expect(
      (await resolve({ brand: 'appydave', project: 'a01' }, { requireVideo: true })).result,
    ).toEqual({
      kind: 'missing',
      missing: ['video'],
    });
  });

  it('unknown-brand: a key not in the registry (shortcuts are not keys)', async () => {
    expect((await resolve({ brand: 'ad', project: 'a01' })).result).toEqual({
      kind: 'unknown-brand',
      brand: 'ad',
    });
  });

  it('no-brand-root: no location, or a relative one', async () => {
    expect((await resolve({ brand: 'nowhere', project: 'a01' })).result).toMatchObject({
      kind: 'no-brand-root',
      brand: 'nowhere',
    });
    expect((await resolve({ brand: 'relative', project: 'a01' })).result).toMatchObject({
      kind: 'no-brand-root',
      message: expect.stringMatching(/relative root/),
    });
  });

  it.each([
    ['b01', 'ambiguous'],
    ['d02-cutty-audio-cleanup', 'not-a-project'],
    ['z99-nope', 'not-found'],
  ])('project-refused: %s → %s, never another project', async (project, kind) => {
    const { result } = await resolve({ brand: 'appydave', project });
    expect(result).toMatchObject({ kind: 'project-refused', result: { kind, ref: project } });
  });

  it('project-refused: an unreadable brand root is unscanned, not not-found', async () => {
    const { result } = await resolve({ brand: 'unmounted', project: 'a01' });
    expect(result).toMatchObject({ kind: 'project-refused', result: { kind: 'unscanned' } });
  });

  it.each(['../../etc', 'Xmen', 'flivideo_tour', '-trash'])(
    'video-invalid: "%s"',
    async (video) => {
      const { result } = await resolve({ brand: 'appydave', project: 'a01', video });
      expect(result).toEqual({ kind: 'video-invalid', video });
    },
  );

  it('video-not-found: no such folder, or a file where the folder should be', async () => {
    const missing = await resolve({ brand: 'appydave', project: 'a01', video: '03-nope' });
    expect(missing.result).toMatchObject({
      kind: 'video-not-found',
      video: '03-nope',
      path: path.join(missing.env.home, 'dev/video-projects/v-appydave/a01-xmen/videos/03-nope'),
    });
    const file = await resolve({ brand: 'appydave', project: 'a01', video: '02-afile' });
    expect(file.result).toMatchObject({
      kind: 'video-not-found',
      message: expect.stringMatching(/not a directory/),
    });
  });

  it('works end to end from launch arguments and env, and writes nothing', async () => {
    const env = await estate();
    const before = await walk(env.home);
    const { context } = parseOpenArgs(['--project', 'a01-xmen', '--video=01-xmen'], {
      FLIVIDEO_BRAND: 'appydave',
    });
    const result = await resolveOpenContext(context, { brands: env.brands, home: env.home });
    expect(result).toMatchObject({
      kind: 'resolved',
      context: { brand: 'appydave', projectId: env.ids.xmen, video: '01-xmen' },
    });
    expect(await walk(env.home)).toEqual(before);
  });
});
