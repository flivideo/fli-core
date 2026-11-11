import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyProjectEntry, describeProjectEntry, projectLayoutSync } from '../src/classify.js';
import {
  addSet,
  listSets,
  listSetsSync,
  projectDirFromRecordingPath,
  readSetsFileSync,
  recordingLocation,
  setPaths,
  transcriptLocation,
} from '../src/recording-sets.js';
import * as core from '../src/index.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const TWO_SETS = JSON.stringify({
  sets: [
    { id: 'demo', title: 'Demo', role: 'part' },
    { id: 'story', title: 'Story', role: 'part' },
  ],
});

async function twoSetProject(): Promise<string> {
  const dir = await tempDir();
  await buildTree(dir, {
    'hub/sets.json': TWO_SETS,
    'hub/sets/demo/recordings/01-1-intro.mov': 'a',
    'hub/sets/story/recordings/01-1-intro.mp4': 'b',
    'hub/sets/story/transcripts/01-1-intro.srt': '1\n',
  });
  return dir;
}

describe('listSets', () => {
  it('a legacy project is one implicit set, flagged legacy, with the folders it has today', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'recordings/01-1-intro.mov': 'a' });
    expect(await listSets(dir)).toEqual([
      {
        id: null,
        title: '',
        role: 'video',
        legacy: true,
        listed: false,
        recordings: path.join(dir, 'recordings'),
        transcripts: path.join(dir, 'recording-transcripts'),
      },
    ]);
  });

  it('a hub project without sets is one implicit set over hub/recordings', async () => {
    const dir = await tempDir();
    await buildTree(dir, { 'hub/recordings/01-1-intro.mov': 'a' });
    const [only] = listSetsSync(dir);
    expect(only?.legacy).toBe(true);
    expect(only?.recordings).toBe(path.join(dir, 'hub/recordings'));
    expect(only?.transcripts).toBe(path.join(dir, 'hub/transcripts'));
  });

  it('a project with sets lists sets.json in order, then unlisted folders by name', async () => {
    const dir = await twoSetProject();
    await fs.mkdir(path.join(dir, 'hub/sets/extra/recordings'), { recursive: true });
    const sets = listSetsSync(dir);
    expect(sets.map((s) => [s.id, s.title, s.role, s.listed, s.legacy])).toEqual([
      ['demo', 'Demo', 'part', true, false],
      ['story', 'Story', 'part', true, false],
      ['extra', 'extra', 'video', false, false],
    ]);
    expect(sets[1]?.recordings).toBe(path.join(dir, 'hub/sets/story/recordings'));
    expect(sets[1]?.transcripts).toBe(path.join(dir, 'hub/sets/story/transcripts'));
  });

  it('drops a bad or repeated sets.json entry instead of failing the file', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      'hub/sets.json': JSON.stringify({
        sets: [
          { id: 'demo', title: 'Demo', role: 'video' },
          { id: 'Bad Name', title: 'x', role: 'video' },
          { id: 'demo', title: 'again', role: 'part' },
        ],
      }),
      'hub/sets/demo/recordings/01-1-a.mov': 'a',
    });
    expect(readSetsFileSync(dir).sets).toEqual([{ id: 'demo', title: 'Demo', role: 'video' }]);
  });

  it('a corrupt sets.json still lists the set folders', async () => {
    const dir = await tempDir();
    await buildTree(dir, {
      'hub/sets.json': '{not json',
      'hub/sets/demo/recordings/01-1-a.mov': 'a',
    });
    expect(listSetsSync(dir).map((s) => s.id)).toEqual(['demo']);
  });
});

describe('projectLayout with sets', () => {
  it('hub/sets/ alone makes a project hub', async () => {
    const dir = await twoSetProject();
    expect(projectLayoutSync(dir)).toBe('hub');
  });
});

describe('setPaths', () => {
  it('refuses an id that could escape the project', () => {
    expect(() => setPaths('/p', '../x')).toThrow(/kebab/);
    expect(setPaths('/p', 'demo').recordings).toBe(path.join('/p', 'hub/sets/demo/recordings'));
  });
});

describe('addSet', () => {
  it('creates the folders and appends to sets.json', async () => {
    const dir = await twoSetProject();
    const sets = await addSet(dir, { id: 'outro', title: 'Outro' });
    expect(sets.map((s) => s.id)).toEqual(['demo', 'story', 'outro']);
    expect((await fs.stat(path.join(dir, 'hub/sets/outro/recordings'))).isDirectory()).toBe(true);
    expect((await fs.stat(path.join(dir, 'hub/sets/outro/transcripts'))).isDirectory()).toBe(true);
    expect(readSetsFileSync(dir).sets.at(-1)).toEqual({
      id: 'outro',
      title: 'Outro',
      role: 'video',
    });
  });

  it('refuses a legacy project, a bad id and a repeat', async () => {
    const legacy = await tempDir();
    await buildTree(legacy, { 'recordings/01-1-a.mov': 'a' });
    await expect(addSet(legacy, { id: 'demo' })).rejects.toThrow(/no recording sets/);
    await expect(fs.stat(path.join(legacy, 'hub'))).rejects.toThrow();

    const dir = await twoSetProject();
    await expect(addSet(dir, { id: 'Not Kebab' })).rejects.toThrow();
    await expect(addSet(dir, { id: 'demo' })).rejects.toThrow(/already exists/);
  });
});

describe('recordingLocation / transcriptLocation', () => {
  it.each<[string, string | null, string | null, string | null]>([
    ['/v/a01-x/recordings/01-1-a.mov', '/v/a01-x', null, 'legacy'],
    ['/v/a01-x/recordings/-safe/01-1-a.mov', '/v/a01-x', null, 'legacy'],
    ['/v/a01-x/hub/recordings/01-1-a.mov', '/v/a01-x', null, 'hub'],
    ['/v/a01-x/hub/sets/demo/recordings/01-1-a.mov', '/v/a01-x', 'demo', 'hub'],
    ['/v/a01-x/hub/sets/demo/recordings/-safe/01-1-a.mp4', '/v/a01-x', 'demo', 'hub'],
    ['/v/a01-x/assets/01-1-a.mov', null, null, null],
  ])('%s', (p, projectDir, set, layout) => {
    const loc = recordingLocation(p);
    expect(loc?.projectDir ?? null).toBe(projectDir);
    expect(loc?.set ?? null).toBe(set);
    expect(loc?.layout ?? null).toBe(layout);
    expect(projectDirFromRecordingPath(p)).toBe(projectDir);
  });

  it('finds the set of a transcript, including FliTools engine copies', () => {
    expect(transcriptLocation('/v/a01-x/hub/sets/story/transcripts/01-1-a.srt')).toEqual({
      projectDir: '/v/a01-x',
      set: 'story',
      layout: 'hub',
    });
    expect(
      transcriptLocation('/v/a01-x/hub/sets/story/transcripts/engines/01-1-a.x.srt')?.set,
    ).toBe('story');
    expect(transcriptLocation('/v/a01-x/recording-transcripts/01-1-a.txt')).toEqual({
      projectDir: '/v/a01-x',
      set: null,
      layout: 'legacy',
    });
  });
});

describe('classify: hub/sets is its own zone', () => {
  it.each<[string, string, boolean?]>([
    ['hub/sets.json', 'sets'],
    ['hub/sets', 'sets', true],
    ['hub/sets/demo', 'sets', true],
    ['hub/sets/demo/.flihub-state.json', 'sets'],
    ['hub/sets/demo/recordings/01-1-intro.mov', 'recordings'],
    ['hub/sets/demo/recordings/-safe/01-1-intro.mov', 'recordings'],
    ['hub/sets/demo/recordings/-chapters/01-intro.mov', 'legacy'],
    ['hub/sets/demo/transcripts/01-1-intro.srt', 'transcripts'],
    ['hub/sets/Bad Name/recordings/x.mov', 'other'],
    ['hub/recordings/01-1-intro.mov', 'recordings'],
  ])('%s → %s', (rel, zone, dir) => {
    expect(classifyProjectEntry(rel, dir)).toBe(zone);
  });

  it('set metadata is authored; set takes are inputs', () => {
    expect(describeProjectEntry('hub/sets.json').tier).toBe('authored');
    expect(describeProjectEntry('hub/sets/demo/recordings/01-1-a.mov').tier).toBe('input');
  });
});

describe('index exports', () => {
  it('exports the set API', () => {
    for (const name of [
      'listSets',
      'listSetsSync',
      'addSet',
      'recordingLocation',
      'transcriptLocation',
      'setPaths',
      'SetsFile',
      'SETS_FOLDER',
    ])
      expect(core).toHaveProperty(name);
  });
});
