import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_RESOURCES,
  RESOURCES_FILE,
  ResourceNotFound,
  addRegistryRow,
  addResource,
  kindOf,
  mergeRegistry,
  readResources,
  removeRegistryRow,
  removeResource,
  setResourceStatus,
  tagResource,
  updateResource,
  writeResourcesFile,
  type ResourcesFile,
} from '../src/resources.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const NOW = new Date('2026-09-27T04:00:00.000Z');
const TITLE = {
  kind: 'title',
  group: 'launch',
  label: 'Titles',
  value: 'text',
  many: true,
  choose: 'one+test',
} as const;
const withTitle = (by = 'agent:x') =>
  addRegistryRow(
    EMPTY_RESOURCES,
    { kind: TITLE, group: { group: 'launch', label: 'Launch', order: 1 } },
    by,
    NOW,
  );

describe('the registry is data, levelled global → brand → project', () => {
  it('merges with the lower level winning, turns rows off, and sorts groups', () => {
    const global = addRegistryRow(
      withTitle(),
      { group: { group: 'artefact', label: 'Artefacts', order: 3 } },
      'cli',
      NOW,
    );
    let brand = addRegistryRow(
      EMPTY_RESOURCES,
      { kind: { ...TITLE, label: 'Video titles' } },
      'cli',
      NOW,
    );
    brand = removeRegistryRow(brand, { group: 'artefact' }, 'cli', NOW).file;
    let project = addRegistryRow(
      EMPTY_RESOURCES,
      {
        kind: { kind: 'shorts-hook', group: 'sponsor', label: 'Shorts hooks', value: 'text' },
        group: { group: 'sponsor', label: 'Sponsor', order: 2 },
      },
      'agent:y',
      NOW,
    );
    project = removeRegistryRow(project, { kind: 'title' }, 'cli', NOW).file;
    const all = mergeRegistry({ global, brand });
    const own = (r: typeof all) => r.kinds.filter((k) => k.from !== 'core');
    expect(own(all).map((k) => [k.kind, k.label, k.from])).toEqual([
      ['title', 'Video titles', 'brand'],
    ]);
    expect(all.groups.map((g) => g.group)).toEqual(['launch']);
    const low = mergeRegistry({ global, brand, project });
    expect(own(low).map((k) => k.kind)).toEqual(['shorts-hook']);
    expect(low.groups.map((g) => [g.group, g.from])).toEqual([
      ['launch', 'global'],
      ['sponsor', 'project'],
    ]);
    expect(kindOf(low, 'nope')).toBeNull();
  });

  it('removes a row the level has, and re-adding clears its off', () => {
    const r = removeRegistryRow(withTitle(), { kind: 'title' }, 'cli', NOW);
    expect([r.action, r.file.kinds]).toEqual(['removed', []]);
    const g = removeRegistryRow(withTitle(), { group: 'launch' }, 'cli', NOW);
    expect(g.action).toBe('removed');
    const off = removeRegistryRow(EMPTY_RESOURCES, { kind: 'title' }, 'cli', NOW);
    expect(off.action).toBe('turned-off');
    expect(addRegistryRow(off.file, { kind: TITLE }, 'cli', NOW).off).toEqual([]);
    expect(() =>
      addRegistryRow(EMPTY_RESOURCES, { kind: { ...TITLE, kind: 'Bad Kind' } }, 'cli', NOW),
    ).toThrow();
  });
});

describe('resources', () => {
  const reg = mergeRegistry({ global: withTitle() });
  const add = (file: ResourcesFile, text: string, status?: 'chosen' | 'in-test', id?: string) =>
    addResource(
      file,
      { kind: 'title', video: 'guest-interview', text, ...(status ? { status } : {}) },
      reg,
      'agent:tuber',
      NOW,
      id,
    );

  it('adds with a stamp, tidy tags and defaults; an undescribed kind is still stored', () => {
    const a = addResource(
      EMPTY_RESOURCES,
      { kind: 'guest-bio', text: 'Sam', tags: [' Guest ', 'guest'] },
      reg,
      'human:ui',
      NOW,
      'r_aaaaaa',
    );
    expect(a.resource).toEqual({
      id: 'r_aaaaaa',
      kind: 'guest-bio',
      video: null,
      text: 'Sam',
      tags: ['guest'],
      audience: [],
      status: 'candidate',
      added: { at: NOW.toISOString(), by: 'human:ui' },
      changed: { at: NOW.toISOString(), by: 'human:ui' },
    });
    expect(() =>
      addResource(EMPTY_RESOURCES, { kind: 'title', video: 'Not A Video' }, reg, 'cli', NOW),
    ).toThrow();
    expect(addResource(EMPTY_RESOURCES, { kind: 'title' }, reg, 'cli', NOW).resource.id).toMatch(
      /^r_[a-f0-9]{10}$/,
    );
  });

  it('keeps one chosen per video and kind, and warns past 3 in the test', () => {
    let f = add(EMPTY_RESOURCES, 'A', 'chosen', 'r_a00001').file;
    f = add(f, 'B', 'chosen', 'r_b00002').file;
    expect(f.resources.map((r) => [r.text, r.status])).toEqual([
      ['A', 'candidate'],
      ['B', 'chosen'],
    ]);
    for (const [t, id] of [
      ['C', 'r_c00003'],
      ['D', 'r_d00004'],
      ['E', 'r_e00005'],
    ] as const)
      f = add(f, t, 'in-test', id).file;
    const fourth = add(f, 'F', 'in-test', 'r_f00006');
    expect(fourth.warnings).toEqual([
      '4 title resources are in the YouTube test; its test takes 3 today.',
    ]);
    const back = setResourceStatus(fourth.file, 'r_a00001', 'chosen', reg, 'human:ui', NOW);
    expect(back.file.resources.filter((r) => r.status === 'chosen').map((r) => r.id)).toEqual([
      'r_a00001',
    ]);
    expect(() => setResourceStatus(f, 'r_nope00', 'chosen', reg, 'cli', NOW)).toThrow(
      ResourceNotFound,
    );
  });

  it('updates, tags and removes by id', () => {
    let f = add(EMPTY_RESOURCES, 'A', undefined, 'r_a00001').file;
    f = updateResource(f, 'r_a00001', { text: 'A2', meta: { note: 'x' } }, 'cli', NOW).file;
    f = tagResource(f, 'r_a00001', { add: ['Pair-A', 'x'] }, 'cli', NOW).file;
    f = tagResource(f, 'r_a00001', { remove: ['x'] }, 'cli', NOW).file;
    expect(f.resources[0]).toMatchObject({
      text: 'A2',
      meta: { note: 'x' },
      tags: ['pair-a'],
      changed: { by: 'cli' },
    });
    expect(removeResource(f, 'r_a00001').file.resources).toEqual([]);
    expect(() => removeResource(f, 'r_zzzzzz')).toThrow('No resource r_zzzzzz.');
  });
});

describe('readResources / writeResourcesFile', () => {
  it('reads the registry at every level and the project resources; unusable files count as empty', async () => {
    const dir = await tempDir();
    const project = add1();
    await buildTree(dir, {
      'config/fli.resources.json': withTitle(),
      'v-a/fli.resources.json': '{ nope',
      'v-a/p1/fli.resources.json': project,
    });
    const read = await readResources({
      globalFile: path.join(dir, 'config', RESOURCES_FILE),
      brandRoot: path.join(dir, 'v-a'),
      projectDir: path.join(dir, 'v-a', 'p1'),
    });
    expect(read.registry.kinds.map((k) => k.kind)).toEqual(['video', 'audio', 'captions', 'title']);
    expect(read.resources).toHaveLength(1);
    expect(read.invalid).toEqual([expect.objectContaining({ reason: 'not-json' })]);
    expect((await readResources({})).resources).toEqual([]);
  });

  it('writes atomically and refuses a bad file or a missing folder', async () => {
    const dir = await tempDir();
    const file = path.join(dir, RESOURCES_FILE);
    expect(await writeResourcesFile(file, add1())).toEqual({ kind: 'written', path: file });
    expect(JSON.parse(await fs.readFile(file, 'utf8')).resources).toHaveLength(1);
    expect(await writeResourcesFile(file, { schema: 2 } as unknown as ResourcesFile)).toMatchObject(
      { reason: 'invalid-input' },
    );
    expect(await writeResourcesFile(path.join(dir, 'no', RESOURCES_FILE), add1())).toMatchObject({
      reason: 'io-error',
    });
    await fs.writeFile(path.join(dir, 'plain'), '');
    expect(await writeResourcesFile(path.join(dir, 'plain', RESOURCES_FILE), add1())).toMatchObject(
      { reason: 'io-error' },
    );
  });
});

function add1(): ResourcesFile {
  return addResource(
    EMPTY_RESOURCES,
    { kind: 'artifact', url: 'https://claude.ai/artifact/x' },
    mergeRegistry({}),
    'cli',
    NOW,
    'r_x00001',
  ).file;
}
