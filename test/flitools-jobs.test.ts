import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import {
  controlFilePath,
  runJob,
  submitAndWait,
  waitForJob,
  writeControlFile,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

let server: Server | null = null;
const calls: Array<{ method: string; params: Record<string, unknown> }> = [];

afterEach(async () => {
  calls.length = 0;
  await new Promise((r) => (server ? server.close(r) : r(null)));
  server = null;
});

const job = (status: string, extra: object = {}) => ({
  id: 'j1',
  status,
  phase: status,
  pct: status === 'done' ? 100 : 10,
  ...extra,
});

/** A stub FliTools whose job verbs answer from a script: `statuses` is popped on each status poll. */
async function stub(statuses: object[], submitAnswer: object = job('queued')) {
  const home = await tempDir();
  const s = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw) as {
        id: number;
        method: string;
        params: Record<string, unknown>;
      };
      calls.push({ method: body.method, params: body.params });
      let out: object;
      if (body.method.endsWith('.job')) {
        out = { result: statuses.length > 1 ? statuses.shift() : statuses[0] };
      } else if (body.method === 'audio.clean' && body.params['path'] === '/no/such.mp4') {
        out = { error: { message: 'no such file', data: { failureMode: 'file-not-found' } } };
      } else {
        out = { result: submitAnswer };
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, ...out }));
    });
  });
  server = s;
  await new Promise<void>((r) => s.listen(0, '127.0.0.1', () => r()));
  const port = (s.address() as AddressInfo).port;
  await writeControlFile(controlFilePath('flitools', { home }), {
    port,
    token: 't'.repeat(32),
    pid: process.pid,
  });
  return home;
}

const noSleep = () => Promise.resolve();

describe('the one job-waiting helper', () => {
  it('submits, polls the status verb with the job id, and returns the finished job', async () => {
    const home = await stub([
      job('running'),
      job('done', { result: { output: '/p/a.clean.mp4' } }),
    ]);
    const seenPct: number[] = [];
    const out = await runJob(
      'audio',
      { path: '/p/a.mp4' },
      {
        app: 'flicut',
        home,
        sleep: noSleep,
        onProgress: (j) => seenPct.push(j.pct ?? -1),
      },
    );
    expect(out).toEqual({
      kind: 'ok',
      value: job('done', { result: { output: '/p/a.clean.mp4' } }),
    });
    expect(calls.map((c) => c.method)).toEqual(['audio.clean', 'audio.job', 'audio.job']);
    expect(calls[0]?.params).toEqual({ app: 'flicut', path: '/p/a.mp4' });
    expect(calls[1]?.params).toEqual({ id: 'j1' });
    expect(seenPct).toEqual([10, 10, 100]);
  });

  it('uses each family’s own pair of verbs, and asks transcribe for the queued job', async () => {
    for (const [family, submit, status] of [
      ['face', 'face.track', 'face.job'],
      ['listen', 'listen.transcribe', 'listen.job'],
      ['transcribe', 'transcribe.run', 'transcribe.job'],
    ] as const) {
      calls.length = 0;
      const home = await stub([job('done')]);
      expect(
        (await runJob(family, { path: '/p/a.mp4' }, { app: 'x', home, sleep: noSleep })).kind,
      ).toBe('ok');
      expect(calls.map((c) => c.method)).toEqual([submit, status]);
      if (family === 'transcribe') expect(calls[0]?.params['wait']).toBe(false);
      await new Promise((r) => server?.close(r));
      server = null;
    }
  });

  it('a failed job is a plain refusal that carries the job', async () => {
    const home = await stub([job('failed', { error: 'ffmpeg exited 1' })]);
    const out = await runJob(
      'audio',
      { path: '/p/a.mp4' },
      { app: 'flicut', home, sleep: noSleep },
    );
    expect(out).toMatchObject({
      kind: 'refused',
      failureMode: 'job-failed',
      message: 'FliTools job j1 failed: ffmpeg exited 1',
    });
  });

  it('gives up with job-timeout when the job never finishes (injected clock)', async () => {
    const home = await stub([job('running')]);
    let t = 0;
    const out = await waitForJob('audio.job', 'j1', {
      app: 'flicut',
      home,
      timeoutMs: 5000,
      pollMs: 1000,
      now: () => t,
      sleep: async (ms) => void (t += ms),
    });
    expect(out).toMatchObject({ kind: 'refused', failureMode: 'job-timeout' });
    expect(calls.length).toBe(5);
  });

  it('passes FliTools’ own refusal of the submit through untouched, and never polls', async () => {
    const home = await stub([job('done')]);
    const out = await runJob(
      'audio',
      { path: '/no/such.mp4' },
      { app: 'flicut', home, sleep: noSleep },
    );
    expect(out).toEqual({
      kind: 'refused',
      failureMode: 'file-not-found',
      message: 'no such file',
    });
    expect(calls.map((c) => c.method)).toEqual(['audio.clean']);
  });

  it('says unavailable when FliTools is not running', async () => {
    const home = await tempDir();
    const out = await submitAndWait('audio.clean', {}, 'audio.job', { app: 'flicut', home });
    expect(out.kind).toBe('unavailable');
  });

  it('refuses a submit answer that is not a job', async () => {
    const home = await stub([job('done')], { nope: true });
    const out = await runJob('face', { path: '/p/a.mp4' }, { app: 'x', home, sleep: noSleep });
    expect(out).toMatchObject({ kind: 'refused', failureMode: 'internal' });
  });
});
