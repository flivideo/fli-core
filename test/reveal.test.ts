import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { revealPath } from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

/** Folder access (David 2026-09-24): no test ever raises Finder — `run` is always a stub here. */
describe('revealPath', () => {
  async function setup() {
    const home = await fs.realpath(await tempDir());
    const project = path.join(home, 'v-appydave', 'd04-x');
    await fs.mkdir(path.join(project, 'footage'), { recursive: true });
    await fs.writeFile(path.join(project, 'footage', 'a.mp4'), 'x');
    const calls: string[][] = [];
    const run = async (args: string[]) => {
      calls.push(args);
    };
    return { home, project, calls, run };
  }

  it('opens a folder as itself, and a file with it selected', async () => {
    const { project, calls, run } = await setup();
    expect(await revealPath(path.join(project, 'footage'), { roots: [project], run })).toEqual({
      kind: 'revealed',
      path: path.join(project, 'footage'),
      selected: false,
    });
    const file = path.join(project, 'footage', 'a.mp4');
    expect(await revealPath(file, { roots: [project], run })).toMatchObject({ selected: true });
    expect(calls).toEqual([[path.join(project, 'footage')], ['-R', file]]);
    expect((await revealPath(project, { roots: [project], run })).kind).toBe('revealed');
  });

  it('refuses outside the roots, through a link, relative, or missing — and opens nothing', async () => {
    const { home, project, calls, run } = await setup();
    const outside = path.join(home, 'secrets');
    await fs.mkdir(outside);
    await fs.symlink(outside, path.join(project, 'link'));
    const cases: Array<[string, string]> = [
      [outside, 'outside-roots'],
      [path.join(project, 'link'), 'outside-roots'],
      [path.join(project, '..', 'd04-x-evil'), 'not-found'],
      ['footage', 'not-absolute'],
      [path.join(project, 'nope'), 'not-found'],
    ];
    for (const [target, reason] of cases) {
      expect([target, await revealPath(target, { roots: [project], run })]).toMatchObject([
        target,
        { kind: 'refused', reason },
      ]);
    }
    await fs.mkdir(path.join(home, 'v-appydave', 'd04-x-evil'));
    expect(
      (await revealPath(path.join(home, 'v-appydave', 'd04-x-evil'), { roots: [project], run }))
        .kind,
    ).toBe('refused');
    expect(calls).toEqual([]);
  });

  it('says so when Finder fails', async () => {
    const { project } = await setup();
    const out = await revealPath(project, {
      roots: [project],
      run: async () => {
        throw new Error('no Finder');
      },
    });
    expect(out).toMatchObject({
      kind: 'refused',
      reason: 'failed',
      message: expect.stringContaining('no Finder'),
    });
  });
});

describe('revealPath without a stub runner', () => {
  it('runs `open` from PATH — here a fake that records its args, so no window opens', async () => {
    const home = await fs.realpath(await tempDir());
    const bin = path.join(home, 'bin');
    await fs.mkdir(bin);
    const log = path.join(home, 'open.log');
    await fs.writeFile(
      path.join(bin, 'open'),
      `#!/bin/sh\necho "$@" >> "${log}"\n[ "$1" = "-R" ] && exit 0\nexit 3\n`,
      { mode: 0o755 },
    );
    const project = path.join(home, 'p');
    await fs.mkdir(project);
    await fs.writeFile(path.join(project, 'a.mp4'), 'x');
    const was = process.env.PATH;
    process.env.PATH = `${bin}:${was ?? ''}`;
    try {
      expect(await revealPath(path.join(project, 'a.mp4'), { roots: [project] })).toMatchObject({
        kind: 'revealed',
      });
      expect(await revealPath(project, { roots: [project] })).toMatchObject({
        kind: 'refused',
        reason: 'failed',
        message: expect.stringContaining('open exited 3'),
      });
      process.env.PATH = path.join(home, 'nowhere');
      expect(await revealPath(project, { roots: [project] })).toMatchObject({ reason: 'failed' });
    } finally {
      process.env.PATH = was;
    }
    expect((await fs.readFile(log, 'utf8')).trim().split('\n')).toEqual([
      `-R ${path.join(project, 'a.mp4')}`,
      project,
    ]);
  });
});
