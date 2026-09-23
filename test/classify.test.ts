import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  LAYOUT_DIRS,
  classifyProjectEntry,
  projectLayout,
  projectLayoutPaths,
  projectLayoutPathsSync,
  projectLayoutSync,
  type ProjectZone,
} from '../src/classify.js';
import { buildLayoutProject, buildTree, tempDir, walk } from './helpers/fixtures.js';

describe('classifyProjectEntry', () => {
  it.each<[string, ProjectZone, boolean?]>([
    ['fli.studio.json', 'identity'],
    ['fli.hub.json', 'app-decisions'],
    ['fli.tubby.json', 'app-decisions'],
    ['fli.cut.01-xmen.json', 'app-decisions'],
    ['fli.cast.tool-xyz.json', 'app-decisions'],
    ['project.json', 'other'],
    ['meta.json', 'other'],
    ['fli.json', 'other'],
    ['fli.brand.json', 'other'],
    ['fli.studio.extra.json', 'other'],
    ['recordings', 'recordings'],
    ['recordings/', 'recordings'],
    ['recordings/01-1-intro.mov', 'recordings'],
    ['recordings/-safe/01-1-intro.mov', 'recordings'],
    ['recordings/-trash/01-1-intro.mov', 'recordings'],
    ['recordings/-chapters', 'legacy'],
    ['recordings/-chapters/01-intro.mov', 'legacy'],
    ['transcripts/01-1-intro.srt', 'transcripts'],
    ['recording-transcripts/01-1-intro.srt', 'transcripts'],
    ['cast/tool-xyz', 'cast'],
    ['cast/tool-xyz/screen-0.mov', 'cast'],
    ['videos', 'videos'],
    ['videos/01-xmen/01-cut.mp4', 'videos'],
    ['videos/01-xmen/fli.studio.json', 'videos'],
    ['first-edit', 'legacy'],
    ['first-edit/edit.json', 'legacy'],
    ['edits/x', 'legacy'],
    ['edit-1st', 'legacy'],
    ['final/01.mp4', 'legacy'],
    ['pipeline', 'legacy'],
    ['animation', 'legacy'],
    ['-old', 'legacy'],
    ['-trash', 'trash'],
    ['-trash/01-1-intro.mov', 'trash'],
    ['-trash/deep/x.txt', 'trash'],
    ['-old/x.mov', 'legacy'],
    ['launch.json', 'other'],
    ['assets/thumb.png', 'other'],
    ['.git/HEAD', 'other'],
    ['', 'other'],
    ['.', 'other'],
    ['../elsewhere/fli.studio.json', 'other'],
    ['/abs/recordings/x.mov', 'other'],
    ['./videos/01-xmen/01-cut.mp4', 'videos'],
    ['videos\\01-xmen\\01-cut.mp4', 'videos'],
  ])('%s → %s', (relPath, zone) => {
    expect(classifyProjectEntry(relPath)).toBe(zone);
  });

  it('uses the isDirectory hint', () => {
    expect(classifyProjectEntry('fli.studio.json', true)).toBe('other');
    expect(classifyProjectEntry('fli.hub.json/', undefined)).toBe('other');
    expect(classifyProjectEntry('fli.studio.json', false)).toBe('identity');
    expect(classifyProjectEntry('recordings', false)).toBe('other');
    expect(classifyProjectEntry('recordings', true)).toBe('recordings');
    expect(classifyProjectEntry('first-edit', false)).toBe('other');
    expect(classifyProjectEntry('videos/01-xmen/01-cut.mp4', false)).toBe('videos');
  });

  it('reads a fixture project in the ruled layout (spec §11 #5)', async () => {
    const dir = await tempDir();
    await buildLayoutProject(dir);
    const zones = Object.fromEntries(
      (await walk(dir)).map((rel) => [rel, classifyProjectEntry(rel, false)]),
    );
    expect(zones).toEqual({
      'cast/tool-xyz/screen-0.mov': 'cast',
      'first-edit/edit.json': 'legacy',
      'fli.cut.01-xmen.json': 'app-decisions',
      'fli.hub.json': 'app-decisions',
      'fli.studio.json': 'identity',
      'project.json': 'other',
      'recordings/-chapters/01-intro.mov': 'legacy',
      'recordings/01-1-intro.mov': 'recordings',
      'transcripts/01-1-intro.srt': 'transcripts',
      'videos/01-xmen/01-audio-dfn100.m4a': 'videos',
      'videos/01-xmen/01-cut.mp4': 'videos',
      'videos/01-xmen/01-final.mp4': 'videos',
      'videos/01-xmen/01-overlay-v5-frame.mp4': 'videos',
    });
  });

  it('reads transcripts under both names (spec §11 #13)', async () => {
    const current = await tempDir();
    const legacy = await tempDir();
    await buildTree(current, { 'transcripts/01-1-intro.srt': '1\n' });
    await buildTree(legacy, { 'recording-transcripts/01-1-intro.srt': '1\n' });
    expect((await walk(current)).map((rel) => classifyProjectEntry(rel, false))).toEqual([
      'transcripts',
    ]);
    expect((await walk(legacy)).map((rel) => classifyProjectEntry(rel, false))).toEqual([
      'transcripts',
    ]);
  });
});

describe('the hub layout (D14: FliHub folders under hub/ for new projects)', () => {
  it.each<[string, ProjectZone, boolean?]>([
    ['hub/recordings', 'recordings', true],
    ['hub/recordings/01-1-intro.mov', 'recordings'],
    ['hub/recordings/-safe/01-1-intro.mov', 'recordings'],
    ['hub/recordings/-chapters', 'legacy', true],
    ['hub/recordings/-chapters/01-intro.mov', 'legacy'],
    ['hub/transcripts/01-1-intro.srt', 'transcripts'],
    ['hub', 'other', true],
    ['hub/', 'other'],
    ['hub', 'other', false],
    ['hub/recordings', 'other', false],
    ['hub/recording-transcripts/01-1-intro.srt', 'other'],
    ['hub/notes.md', 'other'],
    ['hub/b-roll/x.mov', 'other'],
  ])('%s → %s', (relPath, zone, isDirectory) => {
    expect(classifyProjectEntry(relPath, isDirectory)).toBe(zone);
  });

  // Self-healing (David 2026-09-23, option A): no recordings anywhere → hub. FliHub's detectProjectLayout must agree.
  it.each<[string, Record<string, string>, 'hub' | 'legacy']>([
    ['legacy: top-level recordings/, no hub/', { 'recordings/': '' }, 'legacy'],
    ['hub: an empty folder — a new project needs no marker (self-healing)', {}, 'hub'],
    [
      'legacy: only recording-transcripts/ (media not on this machine)',
      { 'recording-transcripts/': '' },
      'legacy',
    ],
    ['legacy: only a top-level transcripts/', { 'transcripts/': '' }, 'legacy'],
    ['hub: only other folders (footage/, videos/)', { 'footage/': '', 'videos/': '' }, 'hub'],
    ['hub: hub/recordings/ exists', { 'hub/recordings/': '' }, 'hub'],
    [
      'hub: hub/recordings/ wins even when top-level recordings/ also exists',
      { 'hub/recordings/': '', 'recordings/': '' },
      'hub',
    ],
    [
      'legacy: a STRAY hub/ (no hub/recordings) never hides top-level recordings/',
      { 'recordings/': '', 'hub/': '' },
      'legacy',
    ],
    [
      'hub: hub/ with only transcripts (a held hub project) stays hub',
      { 'hub/transcripts/': '' },
      'hub',
    ],
    ['hub: an empty hub/ and no top-level recordings/', { 'hub/': '' }, 'hub'],
    ['legacy: a FILE named hub is not a layout marker', { hub: 'x', 'recordings/': '' }, 'legacy'],
  ])('projectLayout / projectLayoutSync — %s', async (_name, tree, layout) => {
    const dir = await tempDir();
    await buildTree(dir, tree);
    expect(await projectLayout(dir)).toBe(layout);
    expect(projectLayoutSync(dir)).toBe(layout);
    expect(projectLayoutPathsSync(dir)).toEqual(await projectLayoutPaths(dir));
  });

  it('projectLayout: a missing folder is hub (no recordings anywhere), never a throw', async () => {
    const missing = path.join(await tempDir(), 'nope');
    expect(await projectLayout(missing)).toBe('hub');
    expect(projectLayoutSync(missing)).toBe('hub');
  });

  it('projectLayoutPaths: hub → hub/recordings + hub/transcripts; legacy → recordings + recording-transcripts', async () => {
    const hub = await tempDir();
    await buildTree(hub, { 'hub/recordings/': '' });
    expect(await projectLayoutPaths(hub)).toEqual({
      layout: 'hub',
      recordings: path.join(hub, 'hub', 'recordings'),
      transcripts: path.join(hub, 'hub', 'transcripts'),
    });
    const legacy = await tempDir();
    await buildTree(legacy, { 'recordings/': '' });
    expect(await projectLayoutPaths(legacy)).toEqual({
      layout: 'legacy',
      recordings: path.join(legacy, 'recordings'),
      transcripts: path.join(legacy, 'recording-transcripts'),
    });
    expect(LAYOUT_DIRS.legacy.transcripts).toBe('recording-transcripts');
  });
});
