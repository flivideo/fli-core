import { describe, expect, it } from 'vitest';
import { classifyProjectEntry, type ProjectZone } from '../src/classify.js';
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
