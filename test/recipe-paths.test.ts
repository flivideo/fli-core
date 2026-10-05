import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { recipePathWarnings, recipePathWarningsIn } from '../src/recipe-paths.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

describe('the ingest rule: a recipe may only reference paths inside its own project (workstream B)', () => {
  it('finds the Kybernesis shapes: ~/Downloads, /Users/…, the kit by absolute path', () => {
    const w = recipePathWarnings({
      source: { path: '/Users/davidcruwys/Downloads/kybernesis/01-export.mp4' },
      audio: {
        arms: [
          { path: '/Users/davidcruwys/dev/video-projects/v-kybernesis/a01/pipeline/arms/raw.m4a' },
        ],
      },
      home: '~/Downloads/x.mp4',
      url: 'file:///Users/x/y.png',
      win: 'C:\\Users\\jan\\x.mp4',
      up: '../../other-project/x.mp4',
    });
    expect(w.map((x) => [x.pointer, x.problem])).toEqual([
      ['/source/path', 'absolute'],
      ['/audio/arms/0/path', 'absolute'],
      ['/home', 'home'],
      ['/url', 'file-url'],
      ['/win', 'absolute'],
      ['/up', 'escapes-project'],
    ]);
  });

  it('does not flag prose, urls, relative in-project paths, or a lone slash', () => {
    expect(
      recipePathWarnings({
        copy: '//KYBERNESIS.AI',
        title: '// TITLE CARD',
        desc: 'loudness + COMPRESSION, see /etc/hosts for nothing',
        url: 'https://example.com/a.png',
        rel: 'overlay/ch01/beats.json',
        dot: './public/a.png',
        inside: 'a/../b.png',
        slash: '/',
        n: 5,
        nul: null,
      }),
    ).toEqual([]);
  });

  it('says whether an absolute path is at least inside this project (it still breaks on another Mac)', () => {
    const [inside, outside] = recipePathWarnings(
      { a: '/proj/a01-x/pipeline/sources/ch01.mp4', b: '/Users/x/Downloads/y.mp4' },
      { projectDir: '/proj/a01-x' },
    );
    expect(inside).toMatchObject({ problem: 'absolute', insideProject: true });
    expect(outside).toMatchObject({ problem: 'absolute', insideProject: false });
    expect(recipePathWarnings({ a: '/x/y' })[0]?.insideProject).toBeNull();
    // a sibling that merely shares the prefix is not inside
    expect(
      recipePathWarnings({ a: '/proj/a01-x-copy/y.mp4' }, { projectDir: '/proj/a01-x' })[0]
        ?.insideProject,
    ).toBe(false);
  });

  it('escapes JSON pointers', () => {
    expect(recipePathWarnings({ 'a/b': { 'c~d': '/x/y' } })[0]?.pointer).toBe('/a~1b/c~0d');
  });

  it('scans overlay/ and framing/ of a project, skipping machinery and non-JSON', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      'overlay/ch01/beats.json': { anchoring: 'phrase lookup' },
      'overlay/ch01/v5-frame/spec.json': {
        elements: [{ file: '/Users/x/kybernesis-company/public/rose.png' }],
      },
      'overlay/ch01/v5-frame/public/node_modules/x.json': { p: '/Users/x/y.png' },
      'overlay/ch01/notes.json': '{ not json',
      'framing/ch01.json': { cut: '~/Downloads/ch01.mp4' },
      'script/script.json': { p: '/Users/x/not-scanned.mp4' },
    });
    const w = await recipePathWarningsIn(dir);
    expect(w.map((x) => [x.file, x.pointer, x.problem])).toEqual([
      ['overlay/ch01/v5-frame/spec.json', '/elements/0/file', 'absolute'],
      ['framing/ch01.json', '/cut', 'home'],
    ]);
    expect(w[0]?.insideProject).toBe(false);
    expect(await recipePathWarningsIn(path.join(dir, 'nope'))).toEqual([]);
  });
});
