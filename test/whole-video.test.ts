import { describe, expect, it } from 'vitest';
import { wholeVideoOwner } from '../src/whole-video.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const V = 'flivideo-tour';

/** A project folder with `videos/<V>/<file>` and the given extras at the project top. */
async function project(file: string, extras: Record<string, object | null> = {}): Promise<string> {
  const dir = await tempDir('fli-core-owner-');
  await buildTree(dir, { [`videos/${V}/${file}`]: 'video', ...extras });
  return dir;
}

const decision = (app: string) => ({ [`fli.${app}.${V}.json`]: {} });

describe('wholeVideoOwner — rule 1: by kind, confirmed by the decision file', () => {
  it.each([
    [`${V}-cut.mp4`, 'cut', { app: 'flicut', source: 'FliCut export' }],
    [`${V}-audio-a100.mp4`, 'cut', { app: 'flicut', source: 'FliCut export' }],
    [`${V}-edit.mp4`, 'edit', { app: 'fliedit', source: 'FliEdit export' }],
    [`${V}-cast.mp4`, 'cast', { app: 'flicast', source: 'FliCast export' }],
  ])('%s + fli.%s.<video>.json → %o', async (file, app, owner) => {
    const dir = await project(file, decision(app));
    expect(await wholeVideoOwner(dir, V, file)).toEqual(owner);
  });

  it.each([`${V}-cut.mp4`, `${V}-audio-a100.mp4`, `${V}-edit.mp4`, `${V}-cast.mp4`])(
    '%s without its decision file → placed file',
    async (file) => {
      // Another app's decision file does not count: the kind names the maker.
      const dir = await project(file, { ...decision('studio'), ...decision('other') });
      expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
    },
  );

  it('an overlay is an Overlay Pilot render, made by FliStudio', async () => {
    const file = `${V}-overlay-v5-frame.mp4`;
    const dir = await project(file);
    expect(await wholeVideoOwner(dir, V, file)).toEqual({
      app: 'flistudio',
      source: 'Overlay Pilot render',
    });
  });

  it('a decision FOLDER is not a decision file', async () => {
    const file = `${V}-cast.mp4`;
    const dir = await project(file, { [`fli.cast.${V}.json/`]: null });
    expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
  });

  it('reads a path by its last segment', async () => {
    const dir = await project(`${V}-edit.mp4`, decision('edit'));
    expect(await wholeVideoOwner(dir, V, `videos/${V}/${V}-edit.mp4`)).toMatchObject({
      app: 'fliedit',
    });
  });
});

describe('wholeVideoOwner — rule 2: a legacy -final', () => {
  const file = `${V}-final.mp4`;

  it('only fli.edit → fliedit', async () => {
    const dir = await project(file, decision('edit'));
    expect(await wholeVideoOwner(dir, V, file)).toEqual({
      app: 'fliedit',
      source: 'FliEdit export',
    });
  });

  it('only fli.cast → flicast', async () => {
    const dir = await project(file, decision('cast'));
    expect(await wholeVideoOwner(dir, V, file)).toEqual({
      app: 'flicast',
      source: 'FliCast export',
    });
  });

  it('both → no owner, two candidates', async () => {
    const dir = await project(file, { ...decision('edit'), ...decision('cast') });
    expect(await wholeVideoOwner(dir, V, file)).toEqual({
      app: null,
      source: 'two candidates: fliedit, flicast',
    });
  });

  it('fli.cut does not claim a -final (FliCut writes -cut)', async () => {
    const dir = await project(file, decision('cut'));
    expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
  });
});

describe('wholeVideoOwner — rule 3: a legacy -final with neither decision file', () => {
  const file = `${V}-final.mp4`;

  it.each(['-renders/', 'motion/'])('%s in the project → generated render', async (folder) => {
    const dir = await project(file, { [folder]: null });
    expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'generated render' });
  });

  it('a FILE named motion is not a render folder → placed file', async () => {
    const dir = await project(file, { motion: {} });
    expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
  });

  it('nothing → placed file', async () => {
    const dir = await project(file);
    expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
  });
});

describe('wholeVideoOwner — rule 4: part and unknown kinds are placed', () => {
  it.each([`${V}-part-intro.mov`, `${V}-draft.mp4`, `${V}-final-v2.mp4`, 'notes.mp4'])(
    '%s → placed file, whatever is in the project',
    async (file) => {
      const dir = await project(file, {
        ...decision('cut'),
        ...decision('edit'),
        ...decision('cast'),
        '-renders/': null,
        'motion/': null,
      });
      expect(await wholeVideoOwner(dir, V, file)).toEqual({ app: null, source: 'placed file' });
    },
  );

  it('never throws on a project that does not exist', async () => {
    expect(await wholeVideoOwner('/nonexistent/project', V, `${V}-cast.mp4`)).toEqual({
      app: null,
      source: 'placed file',
    });
  });
});
