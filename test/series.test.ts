import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  SERIES_CAPABILITIES,
  SeriesFile,
  addSeriesMember,
  changeSeries,
  createSeries,
  listSeries,
  readSeries,
  removeSeriesMember,
  seriesFilePath,
  describeCapabilities,
} from '../src/index.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const member = (code: string, extra: object = {}) => ({ id: randomUUID(), code, ...extra });

describe('series (plan §4C item 3): <brand>/series/<id>/fli.series.json', () => {
  it('lives at the brand level, beside the projects', async () => {
    const root = await tempDir();
    expect(seriesFilePath(root, '45-days')).toBe(
      path.join(root, 'series', '45-days', 'fli.series.json'),
    );
    expect(() => seriesFilePath(root, '../x')).toThrow();
    const made = await createSeries(root, {
      id: 'days-45',
      brand: 'aitldr',
      title: '45 Days to $450',
    });
    expect(made).toMatchObject({
      kind: 'written',
      path: path.join(root, 'series', 'days-45', 'fli.series.json'),
    });
    expect(await readSeries(root, 'days-45')).toMatchObject({
      kind: 'valid',
      value: { id: 'days-45', members: [] },
    });
  });

  it('never overwrites: a second create is series-exists, and the file is untouched', async () => {
    const root = await tempDir();
    await createSeries(root, { id: 's', brand: 'b', title: 'First' });
    expect(await createSeries(root, { id: 's', brand: 'b', title: 'Second' })).toMatchObject({
      kind: 'refused',
      reason: 'series-exists',
    });
    expect(await readSeries(root, 's')).toMatchObject({ value: { title: 'First' } });
  });

  it('refuses an invalid id, a missing brand root and a duplicated member', async () => {
    const root = await tempDir();
    expect(await createSeries(root, { id: 'Not Kebab', brand: 'b', title: 't' })).toMatchObject({
      reason: 'invalid-input',
    });
    expect(
      await createSeries(path.join(root, 'nope'), { id: 's', brand: 'b', title: 't' }),
    ).toMatchObject({ reason: 'io-error' });
    const m = member('b01');
    expect(
      await createSeries(root, { id: 's', brand: 'b', title: 't', members: [m, m] }),
    ).toMatchObject({
      reason: 'invalid-input',
    });
    expect(await fs.readdir(root)).toEqual([]);
  });

  it('adds in order, moves rather than duplicates, and refreshes code on a re-add', async () => {
    const a = member('a01');
    const b = member('a02');
    let s = SeriesFile.parse({
      schema: 1,
      id: 's',
      brand: 'b',
      title: 't',
      createdAt: '2026-10-05T00:00:00.000Z',
      members: [],
    });
    s = addSeriesMember(addSeriesMember(s, a), b);
    expect(s.members.map((m) => m.code)).toEqual(['a01', 'a02']);
    s = addSeriesMember(s, b, 0);
    expect(s.members.map((m) => m.code)).toEqual(['a02', 'a01']);
    s = addSeriesMember(s, { ...a, code: 'b01' }); // re-routed a01 → b01, same id
    expect(s.members).toHaveLength(2);
    expect(s.members.find((m) => m.id === a.id)?.code).toBe('b01');
    expect(addSeriesMember(s, member('c01'), 99).members.at(-1)?.code).toBe('c01');
  });

  it('removes a member, and refuses (null) one that is not in it', () => {
    const a = member('a01');
    const s = SeriesFile.parse({
      schema: 1,
      id: 's',
      brand: 'b',
      title: 't',
      createdAt: '2026-10-05T00:00:00.000Z',
      members: [a],
    });
    expect(removeSeriesMember(s, a.id)?.members).toEqual([]);
    expect(removeSeriesMember(s, randomUUID())).toBeNull();
  });

  it('changeSeries: two writers at once lose nothing', async () => {
    const root = await tempDir();
    await createSeries(root, { id: 's', brand: 'b', title: 't' });
    const ms = Array.from({ length: 12 }, (_, i) => member(`b${String(i + 1).padStart(2, '0')}`));
    const results = await Promise.all(
      ms.map((m) => changeSeries(root, 's', (s) => addSeriesMember(s, m))),
    );
    expect(results.every((r) => r.kind === 'written')).toBe(true);
    const read = await readSeries(root, 's');
    expect(read?.kind === 'valid' && read.value.members.map((m) => m.id).sort()).toEqual(
      ms.map((m) => m.id).sort(),
    );
  });

  it('changeSeries: not-found, unusable file (never overwritten), nothing matched, busy', async () => {
    const root = await tempDir();
    expect(await changeSeries(root, 'ghost', (s) => s)).toMatchObject({
      reason: 'series-not-found',
    });
    expect(await changeSeries(root, 'Bad Id', (s) => s)).toMatchObject({ reason: 'invalid-input' });
    await buildTree(root, { 'series/bad/fli.series.json': '{ not json' });
    expect(await changeSeries(root, 'bad', (s) => s)).toMatchObject({ reason: 'unusable-file' });
    expect(await fs.readFile(path.join(root, 'series/bad/fli.series.json'), 'utf8')).toBe(
      '{ not json',
    );
    await createSeries(root, { id: 's', brand: 'b', title: 't' });
    expect(await changeSeries(root, 's', () => null)).toMatchObject({ reason: 'member-not-found' });
    await fs.writeFile(`${seriesFilePath(root, 's')}.lock`, 'x');
    expect(await changeSeries(root, 's', (s) => s, { waitMs: 30, staleMs: 60_000 })).toMatchObject({
      reason: 'busy',
    });
  });

  it('listSeries: valid ones in id order; a broken folder is listed, never hidden; none → empty', async () => {
    const root = await tempDir();
    expect(await listSeries(root)).toEqual({ series: [], invalid: [] });
    await createSeries(root, { id: 'b-second', brand: 'b', title: '2' });
    await createSeries(root, { id: 'a-first', brand: 'b', title: '1' });
    await buildTree(root, {
      'series/empty/': null,
      'series/mismatch/fli.series.json': {
        schema: 1,
        id: 'other',
        brand: 'b',
        title: 't',
        createdAt: '2026-10-05T00:00:00.000Z',
        members: [],
      },
    });
    const l = await listSeries(root);
    expect(l.series.map((s) => s.id)).toEqual(['a-first', 'b-second']);
    expect(l.invalid.map((i) => i.folder)).toEqual(['empty', 'mismatch']);
    expect(l.invalid[1]?.message).toContain('folder name');
  });

  it('declares the series.* capabilities, named family.verb, with the right fences', () => {
    expect(Object.keys(SERIES_CAPABILITIES)).toEqual([
      'series.list',
      'series.get',
      'series.create',
      'series.add',
      'series.remove',
    ]);
    expect(SERIES_CAPABILITIES['series.list'].sideEffects).toBe('read-only');
    expect(SERIES_CAPABILITIES['series.add'].idempotent).toBe(true);
    expect(describeCapabilities(SERIES_CAPABILITIES)).toBeTruthy();
  });
});
