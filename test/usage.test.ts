/* eslint-disable @typescript-eslint/no-non-null-assertion -- tests index into arrays they just built */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UsageTelemetry, countingCall, usageFilePath, type CallAnswer } from '../src/index.js';

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'usage-'));
});
afterEach(async () => {
  vi.useRealTimers();
  await fs.rm(dir, { recursive: true, force: true });
});

describe('UsageTelemetry', () => {
  it('counts per verb with first / last, last principal and last outcome', () => {
    let t = 0;
    const u = new UsageTelemetry({ now: () => new Date(Date.UTC(2026, 10, 18, 0, 0, t++)) });
    u.record('a.b', 'human:ui');
    u.record('a.b', 'agent:x', 'busy');
    u.record('a.c', 'cli');
    const { verbs } = u.snapshot();
    expect(verbs['a.b']).toEqual({
      calls: 2,
      firstUsed: '2026-11-18T00:00:01.000Z',
      lastUsed: '2026-11-18T00:00:02.000Z',
      lastPrincipal: 'agent:x',
      lastFailureMode: 'busy',
    });
    u.record('a.b', 'agent:x');
    expect(u.snapshot().verbs['a.b']!.lastFailureMode).toBeNull();
    expect(verbs['a.c']!.calls).toBe(1);
  });

  it('keeps nothing but the counts: no inputs, no outputs', () => {
    const u = new UsageTelemetry();
    u.record('project.get', 'human:ui');
    expect(Object.keys(u.snapshot().verbs['project.get']!).sort()).toEqual([
      'calls',
      'firstUsed',
      'lastFailureMode',
      'lastPrincipal',
      'lastUsed',
    ]);
  });

  it('writes at most once per interval, never blocks, and the file reloads', async () => {
    vi.useFakeTimers();
    const file = path.join(dir, 'App', 'usage.json');
    const u = new UsageTelemetry({ file, flushMs: 5000 });
    for (let i = 0; i < 50; i++) u.record('a.b', 'human:ui');
    await expect(fs.stat(file)).rejects.toThrow(); // nothing written yet: the write waits
    await vi.advanceTimersByTimeAsync(5000);
    await u.flush();
    const onDisk = JSON.parse(await fs.readFile(file, 'utf8'));
    expect(onDisk.schema).toBe('usage/1');
    expect(onDisk.verbs['a.b'].calls).toBe(50);
    vi.useRealTimers();
    const later = new UsageTelemetry({ file });
    later.record('a.b', 'cli'); // counted before the load lands
    await later.load();
    expect(later.snapshot().verbs['a.b']!.calls).toBe(51);
    expect(later.snapshot().since).toBe(onDisk.since);
  });

  it('close writes what is pending; a failing write goes to onError and costs no call', async () => {
    const file = path.join(dir, 'usage.json');
    const u = new UsageTelemetry({ file });
    u.record('a.b', 'cli');
    await u.close();
    expect(JSON.parse(await fs.readFile(file, 'utf8')).verbs['a.b'].calls).toBe(1);

    const errors: unknown[] = [];
    // a file under a regular file can never be created
    const bad = new UsageTelemetry({
      file: path.join(file, 'nope', 'usage.json'),
      onError: (e) => errors.push(e),
    });
    bad.record('a.b', 'cli');
    await bad.flush();
    expect(errors).toHaveLength(1);
    expect(bad.snapshot().verbs['a.b']!.calls).toBe(1);
  });

  it('starts afresh on a missing, corrupt or foreign file', async () => {
    const file = path.join(dir, 'usage.json');
    const u = new UsageTelemetry({ file });
    await u.load();
    expect(u.snapshot().verbs).toEqual({});
    await fs.writeFile(file, '{ not json');
    await u.load();
    await fs.writeFile(file, JSON.stringify({ schema: 'other/9' }));
    await u.load();
    expect(u.snapshot().verbs).toEqual({});
    await new UsageTelemetry().load(); // no file configured
  });

  it('usageFilePath sits beside control.json', () => {
    expect(usageFilePath('flistudio', { home: '/h' })).toBe(
      '/h/Library/Application Support/flistudio/usage.json',
    );
  });
});

describe('countingCall', () => {
  it('counts answers, refusals and throws, and returns the answer untouched', async () => {
    const u = new UsageTelemetry();
    const answers: Record<string, CallAnswer> = {
      ok: { ok: true, value: 1 },
      no: { ok: false, error: { failureMode: 'busy', message: 'm' } },
    };
    const call = countingCall(
      async (method) => {
        if (method === 'boom') throw new Error('x');
        return answers[method] ?? { ok: true, value: null };
      },
      u,
      'agent:t',
      (m) => m !== 'unknown',
    );
    expect(await call('ok', {})).toEqual({ ok: true, value: 1 });
    await call('no', {});
    await call('unknown', {});
    await expect(call('boom', {})).rejects.toThrow('x');
    const v = u.snapshot().verbs;
    expect(v['ok']!.lastFailureMode).toBeNull();
    expect(v['no']!.lastFailureMode).toBe('busy');
    expect(v['boom']!.lastFailureMode).toBe('internal');
    expect(v['unknown']).toBeUndefined();
    expect(v['ok']!.lastPrincipal).toBe('agent:t');
  });
});
