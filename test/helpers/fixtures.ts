import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach } from 'vitest';
import type { ProjectIdentity } from '../../src/identity.js';

const created: string[] = [];

/** A fresh temp directory under os.tmpdir(), removed after the test. */
export async function tempDir(prefix = 'fli-core-'): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  created.push(dir);
  return dir;
}

afterEach(async () => {
  while (created.length > 0) {
    const dir = created.pop() as string;
    await fs.chmod(dir, 0o700).catch(() => undefined);
    await fs.rm(dir, { recursive: true, force: true });
  }
});

/** Build a tree from `{ 'a/b.txt': 'content', 'c/': null }` — a trailing `/` makes an empty directory. */
export async function buildTree(
  root: string,
  tree: Record<string, string | object | null>,
): Promise<void> {
  for (const [rel, content] of Object.entries(tree)) {
    const target = path.join(root, rel);
    if (rel.endsWith('/')) {
      await fs.mkdir(target, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    const text =
      typeof content === 'string' ? content : `${JSON.stringify(content ?? {}, null, 2)}\n`;
    await fs.writeFile(target, text);
  }
}

export function identity(overrides: Partial<ProjectIdentity> = {}): ProjectIdentity {
  return {
    schema: 1,
    id: randomUUID(),
    brand: 'appydave',
    code: 'a01',
    name: 'X-Men',
    createdAt: '2026-09-15T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * A brand root mirroring AppyDave on the M4 (spec §11 #2, #3): one member, other folders, and an archive holding a
 * range bucket and a flat folder that duplicates the member's `a01`.
 */
export async function buildBrandRoot(root: string): Promise<{ xmen: ProjectIdentity }> {
  const xmen = identity({ code: 'a01', name: 'X-Men' });
  await buildTree(root, {
    'a01-xmen/fli.studio.json': xmen,
    'd02-cutty-audio-cleanup/recordings/': null,
    'd03-cutty-presenter-tracking/': null,
    'catalog/': null,
    'docs/readme.md': '# docs\n',
    'poem/': null,
    'tools/': null,
    '.git/': null,
    '-trash/': null,
    'fli.brand.json': { schema: 1, brand: 'appydave', colour: '#ffde59' },
    'archived/a01-a49/a02-something/': null,
    'archived/a01-old/': null,
  });
  return { xmen };
}

/** A project in the ruled layout plus legacy folders (spec §11 #5). */
export async function buildLayoutProject(dir: string): Promise<void> {
  await buildTree(dir, {
    'fli.studio.json': identity(),
    'fli.hub.json': {},
    'fli.cut.01-xmen.json': {},
    'project.json': {},
    'recordings/01-1-intro.mov': '',
    'recordings/-chapters/01-intro.mov': '',
    'transcripts/01-1-intro.srt': '',
    'cast/tool-xyz/screen-0.mov': '',
    'videos/01-xmen/01-cut.mp4': '',
    'videos/01-xmen/01-audio-dfn100.m4a': '',
    'videos/01-xmen/01-overlay-v5-frame.mp4': '',
    'videos/01-xmen/01-final.mp4': '',
    'first-edit/edit.json': {},
  });
}

/** Every file path under `dir`, relative and `/`-separated. */
export async function walk(dir: string, base = ''): Promise<string[]> {
  const entries = await fs.readdir(path.join(dir, base), { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const rel = base === '' ? entry.name : `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(dir, rel)));
    else out.push(rel);
  }
  return out.sort();
}
