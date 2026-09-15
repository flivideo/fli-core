import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { listProjects, nextCode, resolveProject, type ProjectListing } from '../src/estate.js';
import { buildBrandRoot, buildTree, identity, tempDir, walk } from './helpers/fixtures.js';

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const canChmod = process.getuid?.() !== 0;

function items<T>(collection: { state: string; items?: T[] }): T[] {
  expect(collection.state).toBe('scanned');
  return collection.items ?? [];
}

describe('listProjects', () => {
  it('splits members from other folders by a valid fli.studio.json (spec §11 #3, R8–R9)', async () => {
    const root = await tempDir();
    const { xmen } = await buildBrandRoot(root);
    const listing = await listProjects(root);

    expect(listing.brandRoot).toBe(root);
    expect(listing.scannedAt).toMatch(ISO);
    expect(items(listing.members)).toEqual([
      {
        folder: 'a01-xmen',
        path: path.join(root, 'a01-xmen'),
        parsed: { code: 'a01', slug: 'xmen' },
        identity: xmen,
      },
    ]);
    expect(
      items(listing.otherFolders).map((f) => [f.folder, f.looksLikeProject, f.identity]),
    ).toEqual([
      ['catalog', false, 'absent'],
      ['d02-cutty-audio-cleanup', true, 'absent'],
      ['d03-cutty-presenter-tracking', true, 'absent'],
      ['docs', false, 'absent'],
      ['poem', false, 'absent'],
      ['tools', false, 'absent'],
    ]);
  });

  it('lists the archive one level deep: range buckets and flat folders (R13)', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    await buildTree(root, {
      'archived/notes/': null,
      'archived/.DS_Store/': null,
      'archived/b10-b05/': null,
    });
    const listing = await listProjects(root);
    expect(items(listing.archived)).toEqual([
      { kind: 'range', name: 'a01-a49', letter: 'a', from: 1, to: 49 },
      { kind: 'project', name: 'a01-old', code: 'a01', slug: 'old' },
      { kind: 'project', name: 'b10-b05', code: 'b10', slug: 'b05' },
      { kind: 'other', name: 'notes' },
    ]);
    // Nothing inside archived/a01-a49/ is listed.
    expect(JSON.stringify(listing)).not.toContain('a02-something');
  });

  it('puts a folder with an invalid fli.studio.json under other folders, carrying the invalid result', async () => {
    const root = await tempDir();
    await buildTree(root, {
      'a05-broken/fli.studio.json': '{',
      'a06-wrong/fli.studio.json': { schema: 1 },
    });
    const listing = await listProjects(root);
    expect(items(listing.members)).toEqual([]);
    const other = items(listing.otherFolders);
    expect(other.map((f) => f.folder)).toEqual(['a05-broken', 'a06-wrong']);
    expect(other[0]?.identity).toMatchObject({ kind: 'invalid', reason: 'not-json' });
    expect(other[1]?.identity).toMatchObject({ kind: 'invalid', reason: 'schema' });
  });

  it('counts a member whose folder is not named like a project', async () => {
    const root = await tempDir();
    await buildTree(root, { 'Old Project/fli.studio.json': identity({ code: 'b07' }) });
    expect(items((await listProjects(root)).members)[0]).toMatchObject({
      folder: 'Old Project',
      parsed: null,
    });
  });

  it('follows a symlinked project folder and ignores files and broken links', async () => {
    const root = await tempDir();
    const elsewhere = await tempDir();
    await buildTree(elsewhere, { 'fli.studio.json': identity({ code: 'c01' }) });
    await buildTree(root, { 'loose-file.txt': 'x' });
    await fs.symlink(elsewhere, path.join(root, 'c01-linked'));
    await fs.symlink(path.join(root, 'missing'), path.join(root, 'broken-link'));
    const listing = await listProjects(root);
    expect(items(listing.members).map((m) => m.folder)).toEqual(['c01-linked']);
    expect(items(listing.otherFolders)).toEqual([]);
  });

  it('treats an empty brand root as scanned and empty; a missing archive as empty', async () => {
    const listing = await listProjects(await tempDir());
    expect(listing.members).toEqual({ state: 'scanned', scannedAt: listing.scannedAt, items: [] });
    expect(listing.otherFolders).toEqual({
      state: 'scanned',
      scannedAt: listing.scannedAt,
      items: [],
    });
    expect(listing.archived).toEqual({ state: 'scanned', scannedAt: listing.scannedAt, items: [] });
  });

  it('marks an unreadable brand root as unscanned, distinct from empty (R12, spec §11 #4)', async () => {
    const missing = path.join(await tempDir(), 'not-there');
    const listing = await listProjects(missing);
    expect(listing.members).toMatchObject({
      state: 'unscanned',
      path: missing,
      scannedAt: listing.scannedAt,
    });
    expect(listing.otherFolders).toMatchObject({ state: 'unscanned', path: missing });
    expect(listing.members.state === 'unscanned' && listing.members.message).toMatch(/ENOENT/);
  });

  it.runIf(canChmod)('marks an unreadable archive as unscanned while the rest scans', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    const archived = path.join(root, 'archived');
    await fs.chmod(archived, 0o000);
    try {
      const listing = await listProjects(root);
      expect(listing.archived).toMatchObject({ state: 'unscanned', path: archived });
      expect(listing.members.state).toBe('scanned');
    } finally {
      await fs.chmod(archived, 0o700);
    }
  });

  it('marks an archive that is a file as unscanned', async () => {
    const root = await tempDir();
    await buildTree(root, { archived: 'not a folder' });
    expect((await listProjects(root)).archived).toMatchObject({ state: 'unscanned' });
  });

  it('never writes into the brand root', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    const before = await walk(root);
    await listProjects(root);
    await resolveProject(root, 'a01');
    expect(await walk(root)).toEqual(before);
  });
});

describe('resolveProject (R31)', () => {
  async function estate(): Promise<{
    root: string;
    listing: ProjectListing;
    ids: Record<string, string>;
  }> {
    const root = await tempDir();
    const a01 = identity({ code: 'a01' });
    const b01 = identity({ code: 'b01', name: 'One' });
    const b01Copy = identity({ code: 'b01', name: 'Other one' });
    const copied = identity({ code: 'c01' });
    await buildTree(root, {
      'a01-xmen/fli.studio.json': a01,
      'b01-one/fli.studio.json': b01,
      'b01-other/fli.studio.json': b01Copy,
      'c01-copy-a/fli.studio.json': copied,
      'c02-copy-b/fli.studio.json': { ...copied, code: 'c02' },
      'd02-cutty-audio-cleanup/': null,
    });
    return {
      root,
      listing: await listProjects(root),
      ids: { a01: a01.id, b01: b01.id, copied: copied.id },
    };
  }

  it('finds by exact folder name', async () => {
    const { root } = await estate();
    expect(await resolveProject(root, 'a01-xmen')).toMatchObject({
      kind: 'found',
      matchedBy: 'folder',
      project: { folder: 'a01-xmen' },
    });
  });

  it('finds by identity id', async () => {
    const { listing, ids } = await estate();
    expect(await resolveProject(listing, ids.b01 as string)).toMatchObject({
      kind: 'found',
      matchedBy: 'id',
      project: { folder: 'b01-one' },
    });
  });

  it('finds by a whole code with one match', async () => {
    const { listing } = await estate();
    expect(await resolveProject(listing, 'a01')).toMatchObject({
      kind: 'found',
      matchedBy: 'code',
      project: { folder: 'a01-xmen' },
    });
  });

  it('refuses two or more code matches, naming the candidates', async () => {
    const { listing } = await estate();
    const result = await resolveProject(listing, 'b01');
    expect(result).toMatchObject({ kind: 'ambiguous', matchedBy: 'code' });
    expect(result.kind === 'ambiguous' && result.candidates.map((c) => c.folder)).toEqual([
      'b01-one',
      'b01-other',
    ]);
  });

  it('refuses a duplicated identity id (a copied folder)', async () => {
    const { listing, ids } = await estate();
    const result = await resolveProject(listing, ids.copied as string);
    expect(result).toMatchObject({ kind: 'ambiguous', matchedBy: 'id' });
    expect(result.kind === 'ambiguous' && result.candidates).toHaveLength(2);
  });

  it.each(['a0', 'a', 'a01-x', 'A01', 'xmen', 'a011'])(
    'a prefix or partial name "%s" is not a match',
    async (ref) => {
      const { listing } = await estate();
      expect(await resolveProject(listing, ref)).toEqual({ kind: 'not-found', ref });
    },
  );

  it('says when the folder exists but is not a project', async () => {
    const { listing } = await estate();
    expect(await resolveProject(listing, 'd02-cutty-audio-cleanup')).toMatchObject({
      kind: 'not-a-project',
      folder: { folder: 'd02-cutty-audio-cleanup', looksLikeProject: true },
    });
    expect(await resolveProject(listing, 'd02')).toEqual({ kind: 'not-found', ref: 'd02' });
  });

  it('reports unscanned instead of not-found when the brand root cannot be read', async () => {
    const missing = path.join(await tempDir(), 'gone');
    expect(await resolveProject(missing, 'a01')).toMatchObject({
      kind: 'unscanned',
      ref: 'a01',
      path: missing,
    });
  });

  it('survives a rename: the same id resolves at the new folder (spec §11 #1)', async () => {
    const { root, ids } = await estate();
    await fs.rename(path.join(root, 'a01-xmen'), path.join(root, 'a07-xmen-renamed'));
    expect(await resolveProject(root, ids.a01 as string)).toMatchObject({
      kind: 'found',
      project: {
        folder: 'a07-xmen-renamed',
        path: path.join(root, 'a07-xmen-renamed'),
        identity: { id: ids.a01 },
      },
    });
  });
});

describe('nextCode (A6, R15)', () => {
  it('never reuses a live or archived code — the duplicate-a01 fixture (spec §11 #2)', async () => {
    const root = await tempDir();
    await buildBrandRoot(root);
    const listing = await listProjects(root);
    expect(nextCode(listing, 'a')).toEqual({ kind: 'allocated', code: 'a50' });
    expect(nextCode(listing, 'd')).toEqual({ kind: 'allocated', code: 'd04' });
    expect(nextCode(listing, 'z')).toEqual({ kind: 'allocated', code: 'z01' });
  });

  it('counts flat archived folders and identity codes', async () => {
    const root = await tempDir();
    await buildTree(root, {
      'Odd Name/fli.studio.json': identity({ code: 'b12' }),
      'b03-live/': null,
      'archived/b20-gone/': null,
      'archived/c01-c99/': null,
    });
    const listing = await listProjects(root);
    expect(nextCode(listing, 'b')).toEqual({ kind: 'allocated', code: 'b21' });
    expect(nextCode(listing, 'c')).toMatchObject({ kind: 'refused', reason: 'exhausted' });
  });

  it('refuses when any part of the listing is unscanned', async () => {
    const listing = await listProjects(path.join(await tempDir(), 'gone'));
    expect(nextCode(listing, 'a')).toMatchObject({ kind: 'refused', reason: 'unscanned' });

    const root = await tempDir();
    await buildTree(root, { archived: 'file' });
    expect(nextCode(await listProjects(root), 'a')).toMatchObject({
      kind: 'refused',
      reason: 'unscanned',
    });
  });

  it.each(['', 'ab', 'A', '1'])('refuses the letter "%s"', async (letter) => {
    const listing = await listProjects(await tempDir());
    expect(nextCode(listing, letter)).toMatchObject({ kind: 'refused', reason: 'invalid-letter' });
  });
});
