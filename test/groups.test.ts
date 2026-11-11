import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  GROUP_CAPABILITIES,
  addGroupMember,
  changeGroup,
  createGroup,
  createSeries,
  describeCapabilities,
  groupAsSeries,
  groupFilePath,
  groupIdOf,
  listGroups,
  readGroup,
  removeGroupMember,
  seriesFilePath,
} from '../src/index.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const member = (code: string, extra: object = {}) => ({ id: randomUUID(), code, ...extra });
const add =
  (m: ReturnType<typeof member>, at?: number) => (g: Parameters<typeof addGroupMember>[0]) =>
    addGroupMember(g, m, at);

/** An older series file, as another tool writes it (fixed text, so a rewrite shows in a byte compare). */
const SERIES_TEXT = (members: object[]) =>
  `${JSON.stringify(
    {
      schema: 1,
      id: 'days',
      brand: 'demo',
      title: 'Thirty Days',
      createdAt: '2026-10-05T00:00:00.000Z',
      members,
    },
    null,
    2,
  )}\n`;

describe('groups: <brand>/groups/<id>/fli.group.json, ordered or not', () => {
  it('lives beside the projects; ordered and unordered are one kind of file', async () => {
    const root = await tempDir();
    expect(groupFilePath(root, 'launch')).toBe(
      path.join(root, 'groups', 'launch', 'fli.group.json'),
    );
    expect(() => groupFilePath(root, '../x')).toThrow();
    const made = await createGroup(root, {
      id: 'launch',
      brand: 'demo',
      title: 'Launch',
      ordered: false,
      note: 'For the about page',
    });
    expect(made).toMatchObject({
      kind: 'written',
      group: { id: 'launch', ordered: false, note: 'For the about page', home: 'groups' },
    });
    const onDisk = JSON.parse(await fs.readFile(groupFilePath(root, 'launch'), 'utf8'));
    expect(onDisk).toMatchObject({ schema: 1, id: 'launch', ordered: false });
    expect(onDisk).not.toHaveProperty('home');
    expect(await readGroup(root, 'launch')).toMatchObject({
      kind: 'valid',
      value: { id: 'launch', members: [] },
    });
  });

  it('groupIdOf makes a kebab id from a name', () => {
    expect(groupIdOf('Thirty Days to $300')).toBe('thirty-days-to-300');
    expect(groupIdOf('  Café — week 2 ')).toBe('cafe-week-2');
    expect(groupIdOf('!!!')).toBe('');
  });

  it('reads an older series file in place as an ordered group, and never rewrites it on read', async () => {
    const root = await tempDir();
    const a = member('a01', { label: 'Day 1' });
    const text = SERIES_TEXT([a]);
    await buildTree(root, { 'series/days/fli.series.json': text, 'series/days/PLAN.md': 'plan' });
    const listing = await listGroups(root);
    expect(listing.groups).toEqual([
      {
        id: 'days',
        brand: 'demo',
        title: 'Thirty Days',
        ordered: true,
        createdAt: '2026-10-05T00:00:00.000Z',
        members: [a],
        home: 'series',
      },
    ]);
    expect(await readGroup(root, 'days')).toMatchObject({
      value: { home: 'series', ordered: true },
    });
    expect(await fs.readFile(path.join(root, 'series/days/fli.series.json'), 'utf8')).toBe(text);
    const [days] = listing.groups;
    expect(days && groupAsSeries(days)).toEqual(JSON.parse(text));
  });

  it('an id is unique across both folders: create refuses a series id; a hand-made clash is listed apart', async () => {
    const root = await tempDir();
    await buildTree(root, { 'series/days/fli.series.json': SERIES_TEXT([]) });
    const clash = await createGroup(root, {
      id: 'days',
      brand: 'demo',
      title: 'x',
      ordered: false,
    });
    expect(clash).toMatchObject({ kind: 'refused', reason: 'group-exists' });
    expect(clash.kind === 'refused' && clash.message).toContain('Pick another name');
    await fs.access(path.join(root, 'groups')).then(
      () => expect.fail('groups/ was made'),
      () => undefined,
    );
    await buildTree(root, {
      'groups/days/fli.group.json': {
        schema: 1,
        id: 'days',
        brand: 'demo',
        title: 'Copy',
        ordered: false,
        createdAt: '2026-10-05T00:00:00.000Z',
        members: [],
      },
    });
    const l = await listGroups(root);
    expect(l.groups.map((g) => `${g.home}:${g.id}`)).toEqual(['series:days']);
    expect(l.invalid).toEqual([
      { folder: 'groups/days', message: expect.stringContaining('already used by series/days') },
    ]);
    expect(await readGroup(root, 'days')).toMatchObject({ value: { home: 'series' } });
  });

  it('never overwrites: a second create is group-exists and the first file is untouched', async () => {
    const root = await tempDir();
    await createGroup(root, { id: 'g', brand: 'b', title: 'First', ordered: true });
    expect(
      await createGroup(root, { id: 'g', brand: 'b', title: 'Second', ordered: false }),
    ).toMatchObject({
      reason: 'group-exists',
    });
    expect(await readGroup(root, 'g')).toMatchObject({ value: { title: 'First', ordered: true } });
  });

  it('refuses an invalid id, a missing brand root, a duplicate and a label in an unordered group', async () => {
    const root = await tempDir();
    expect(
      await createGroup(root, { id: 'Not Kebab', brand: 'b', title: 't', ordered: false }),
    ).toMatchObject({ reason: 'invalid-input' });
    expect(
      await createGroup(path.join(root, 'nope'), {
        id: 'g',
        brand: 'b',
        title: 't',
        ordered: false,
      }),
    ).toMatchObject({ reason: 'io-error' });
    const m = member('b01');
    expect(
      await createGroup(root, { id: 'g', brand: 'b', title: 't', ordered: false, members: [m, m] }),
    ).toMatchObject({ reason: 'invalid-input' });
    expect(
      await createGroup(root, {
        id: 'g',
        brand: 'b',
        title: 't',
        ordered: false,
        members: [member('b01', { label: 'Day 1' })],
      }),
    ).toMatchObject({ reason: 'invalid-input', message: expect.stringContaining('labels') });
    expect(await fs.readdir(root)).toEqual([]);
  });

  it('a project can be in any number of unordered groups and one ordered one (the rule kept from series)', async () => {
    const root = await tempDir();
    const p = member('b47');
    await createGroup(root, { id: 'shop', brand: 'b', title: 'Shop', ordered: false });
    await createGroup(root, { id: 'promo', brand: 'b', title: 'Promo', ordered: false });
    await createGroup(root, { id: 'run', brand: 'b', title: 'The run', ordered: true });
    await createGroup(root, { id: 'run-two', brand: 'b', title: 'Run two', ordered: true });
    expect(await changeGroup(root, 'shop', add(p))).toMatchObject({ kind: 'written' });
    expect(await changeGroup(root, 'promo', add(p))).toMatchObject({ kind: 'written' });
    expect(await changeGroup(root, 'run', add(p))).toMatchObject({ kind: 'written' });
    const second = await changeGroup(root, 'run-two', add(p));
    expect(second).toMatchObject({
      kind: 'refused',
      reason: 'in-another-ordered-group',
      holder: { id: 'run', title: 'The run' },
      path: groupFilePath(root, 'run-two'),
    });
    // A re-add to the group it is already in is not "another" group.
    expect(await changeGroup(root, 'run', add({ ...p, label: 'Day 1' } as never))).toMatchObject({
      kind: 'written',
    });
    const l = await listGroups(root);
    expect(l.groups.filter((g) => g.members.some((m) => m.id === p.id)).map((g) => g.id)).toEqual([
      'promo',
      'run',
      'shop',
    ]);
    // Turning an unordered group that holds it into an ordered one is refused too.
    expect(await changeGroup(root, 'shop', (g) => ({ ...g, ordered: true }))).toMatchObject({
      reason: 'in-another-ordered-group',
    });
  });

  it('the rule reaches the older series files as well, both ways', async () => {
    const root = await tempDir();
    const a = member('a01');
    await buildTree(root, { 'series/days/fli.series.json': SERIES_TEXT([a]) });
    await createGroup(root, { id: 'other', brand: 'demo', title: 'Other', ordered: true });
    expect(await changeGroup(root, 'other', add(a))).toMatchObject({
      reason: 'in-another-ordered-group',
      holder: { id: 'days' },
    });
    const b = member('a02');
    await changeGroup(root, 'other', add(b));
    expect(await changeGroup(root, 'days', add(b))).toMatchObject({
      reason: 'in-another-ordered-group',
      holder: { id: 'other' },
      path: seriesFilePath(root, 'days'),
    });
    expect(
      await createGroup(root, {
        id: 'third',
        brand: 'demo',
        title: 'T',
        ordered: true,
        members: [a],
      }),
    ).toMatchObject({ reason: 'in-another-ordered-group' });
  });

  it('writes an older series file back in its own shape: name and projects only', async () => {
    const root = await tempDir();
    const a = member('a01', { label: 'Day 1' });
    await buildTree(root, { 'series/days/fli.series.json': SERIES_TEXT([a]) });
    const b = member('a02', { label: 'Day 2' });
    const added = await changeGroup(root, 'days', add(b));
    expect(added).toMatchObject({ kind: 'written', path: seriesFilePath(root, 'days') });
    const onDisk = JSON.parse(await fs.readFile(seriesFilePath(root, 'days'), 'utf8'));
    expect(Object.keys(onDisk)).toEqual(['schema', 'id', 'brand', 'title', 'createdAt', 'members']);
    expect(onDisk.members).toEqual([a, b]);
    expect(
      await changeGroup(root, 'days', (g) => ({ ...g, title: 'Thirty-one Days' })),
    ).toMatchObject({
      group: { title: 'Thirty-one Days', home: 'series' },
    });
    expect(await changeGroup(root, 'days', (g) => ({ ...g, ordered: false }))).toMatchObject({
      reason: 'invalid-input',
      message: expect.stringContaining('older series file'),
    });
    expect(await changeGroup(root, 'days', (g) => ({ ...g, note: 'hi' }))).toMatchObject({
      reason: 'invalid-input',
    });
    await fs.access(path.join(root, 'groups')).then(
      () => expect.fail('groups/ was made'),
      () => undefined,
    );
  });

  it('adds in order, moves rather than duplicates, removes; a stale label survives turning unordered', async () => {
    const root = await tempDir();
    await createGroup(root, { id: 'g', brand: 'b', title: 'G', ordered: true });
    const a = member('a01');
    const b = member('a02');
    await changeGroup(root, 'g', add(a));
    await changeGroup(root, 'g', add({ ...b, label: 'Second' } as never));
    const moved = await changeGroup(root, 'g', add(b as never, 0));
    expect(moved.kind === 'written' && moved.group.members.map((m) => m.code)).toEqual([
      'a02',
      'a01',
    ]);
    expect(await changeGroup(root, 'g', (g) => ({ ...g, ordered: false }))).toMatchObject({
      group: { ordered: false },
    });
    // Unordered: a label is refused on add, but a member still carrying one can be added to.
    expect(
      await changeGroup(root, 'g', add({ ...member('a03'), label: 'x' } as never)),
    ).toMatchObject({
      reason: 'invalid-input',
    });
    expect(await changeGroup(root, 'g', add(member('a03')))).toMatchObject({ kind: 'written' });
    expect(await changeGroup(root, 'g', (g) => removeGroupMember(g, a.id))).toMatchObject({
      group: { members: [{ code: 'a02' }, { code: 'a03' }] },
    });
    expect(await changeGroup(root, 'g', (g) => removeGroupMember(g, a.id))).toMatchObject({
      reason: 'member-not-found',
    });
  });

  it('a note is set and cleared; a field a newer copy wrote survives a write', async () => {
    const root = await tempDir();
    await buildTree(root, {
      'groups/g/fli.group.json': {
        schema: 1,
        id: 'g',
        brand: 'b',
        title: 'G',
        ordered: false,
        note: 'old',
        createdAt: '2026-10-05T00:00:00.000Z',
        members: [],
        future: { colour: 'amber' },
      },
    });
    await changeGroup(root, 'g', (g) => ({ ...g, note: undefined }));
    const onDisk = JSON.parse(await fs.readFile(groupFilePath(root, 'g'), 'utf8'));
    expect(onDisk).not.toHaveProperty('note');
    expect(onDisk.future).toEqual({ colour: 'amber' });
    await changeGroup(root, 'g', (g) => ({ ...g, note: 'new' }));
    expect(await readGroup(root, 'g')).toMatchObject({ value: { note: 'new' } });
  });

  it('refuses a missing, a bad id, an unusable file (left as it is) and a held lock', async () => {
    const root = await tempDir();
    expect(await changeGroup(root, 'ghost', (g) => g)).toMatchObject({ reason: 'group-not-found' });
    expect(await changeGroup(root, 'Bad Id', (g) => g)).toMatchObject({ reason: 'invalid-input' });
    await buildTree(root, { 'groups/bad/fli.group.json': '{ not json' });
    expect(await changeGroup(root, 'bad', (g) => g)).toMatchObject({ reason: 'unusable-file' });
    expect(await fs.readFile(path.join(root, 'groups/bad/fli.group.json'), 'utf8')).toBe(
      '{ not json',
    );
    await createGroup(root, { id: 'g', brand: 'b', title: 't', ordered: false });
    await fs.writeFile(`${groupFilePath(root, 'g')}.lock`, 'x');
    expect(await changeGroup(root, 'g', (g) => g, { waitMs: 30, staleMs: 60_000 })).toMatchObject({
      reason: 'busy',
    });
    await createSeries(root, { id: 's', brand: 'b', title: 't' });
    await fs.writeFile(`${seriesFilePath(root, 's')}.lock`, 'x');
    expect(await changeGroup(root, 's', (g) => g, { waitMs: 30, staleMs: 60_000 })).toMatchObject({
      reason: 'busy',
      message: expect.stringContaining('being changed by another writer'),
    });
  });

  it('lists both folders by id; unusable folders of either are listed apart, never hidden', async () => {
    const root = await tempDir();
    expect(await listGroups(root)).toEqual({ groups: [], invalid: [] });
    await createGroup(root, { id: 'b-group', brand: 'b', title: 'B', ordered: false });
    await createSeries(root, { id: 'a-series', brand: 'b', title: 'A' });
    await createGroup(root, { id: 'c-group', brand: 'b', title: 'C', ordered: true });
    await buildTree(root, {
      'groups/empty/': null,
      'groups/Bad Name/': null,
      'series/broken/fli.series.json': '{',
      'groups/mismatch/fli.group.json': {
        schema: 1,
        id: 'other',
        brand: 'b',
        title: 't',
        ordered: false,
        createdAt: '2026-10-05T00:00:00.000Z',
        members: [],
      },
    });
    const l = await listGroups(root);
    expect(l.groups.map((g) => [g.id, g.home, g.ordered])).toEqual([
      ['a-series', 'series', true],
      ['b-group', 'groups', false],
      ['c-group', 'groups', true],
    ]);
    expect(l.invalid.map((i) => i.folder)).toEqual([
      'series/broken',
      'groups/Bad Name',
      'groups/empty',
      'groups/mismatch',
    ]);
  });

  it('declares the group.* capabilities, named family.verb, with the right fences', () => {
    expect(Object.keys(GROUP_CAPABILITIES)).toEqual([
      'group.list',
      'group.get',
      'group.create',
      'group.add',
      'group.remove',
      'group.update',
    ]);
    expect(GROUP_CAPABILITIES['group.list'].sideEffects).toBe('read-only');
    expect(GROUP_CAPABILITIES['group.add'].idempotent).toBe(true);
    expect(GROUP_CAPABILITIES['group.add'].failureModes).toContain('in-another-ordered-group');
    expect(describeCapabilities(GROUP_CAPABILITIES)).toBeTruthy();
  });
});
