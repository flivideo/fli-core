import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BRAND_SETTINGS_FOLDERS,
  brandPackCandidates,
  isBrandSettingsFolder,
  listProjects,
} from '../src/index.js';

describe('brand settings folders', () => {
  it('a top-level folder starting with "-" is brand settings; anything else is not', () => {
    for (const f of ['-theme', '-storypilot', '-reference', '-thumbnails', '-anything-new'])
      expect(isBrandSettingsFolder(f)).toBe(true);
    for (const f of ['d13-intro', 'a01', 'theme', '.git', 'archived'])
      expect(isBrandSettingsFolder(f)).toBe(false);
  });

  it('registers the known folders, each with an owner and contents, all dash-named', () => {
    expect(BRAND_SETTINGS_FOLDERS.map((f) => f.folder)).toEqual([
      '-theme',
      '-storypilot',
      '-reference',
      '-thumbnails',
    ]);
    for (const f of BRAND_SETTINGS_FOLDERS) {
      expect(isBrandSettingsFolder(f.folder)).toBe(true);
      expect(f.owner.length).toBeGreaterThan(0);
      expect(f.contents.length).toBeGreaterThan(0);
    }
  });

  it('the estate scan never lists a settings folder as a project or other folder', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brand-folders-'));
    try {
      for (const f of ['-thumbnails', '-theme', 'x01-paper-planes'])
        await fs.mkdir(path.join(root, f));
      await fs.writeFile(path.join(root, '-thumbnails', 'brand-pack.md'), '# rules\n');
      const listing = await listProjects(root);
      if (listing.members.state !== 'scanned' || listing.otherFolders.state !== 'scanned')
        throw new Error('brand root not scanned');
      const names = [
        ...listing.members.items.map((m) => m.folder),
        ...listing.otherFolders.items.map((o) => o.folder),
      ];
      expect(names).not.toContain('-thumbnails');
      expect(names).not.toContain('-theme');
      expect(names).toContain('x01-paper-planes');
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});

describe('brandPackCandidates: brand repo first, then the user config, no FliStudio needed', () => {
  it('with a brand repo: its -thumbnails files, then the user config path', () => {
    expect(brandPackCandidates({ brandRoot: '/v/brand-x', home: '/home/u' })).toEqual([
      { path: '/v/brand-x/-thumbnails/brand-pack.md', from: 'brand-repo' },
      { path: '/v/brand-x/-thumbnails/brand.yaml', from: 'brand-repo' },
      { path: '/home/u/.config/creator-skills/brand.yaml', from: 'user-config' },
    ]);
  });

  it('without one (a skill outside any FliVideo layout): the user config path only', () => {
    expect(brandPackCandidates({ home: '/home/u' })).toEqual([
      { path: '/home/u/.config/creator-skills/brand.yaml', from: 'user-config' },
    ]);
  });
});
