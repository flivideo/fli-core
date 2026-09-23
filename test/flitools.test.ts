import { promises as fs } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  controlFilePath,
  flitoolsCall,
  transcribe,
  transcribeQueued,
  transcriptFor,
  transcriptJobs,
  writeControlFile,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

const TOKEN = 't'.repeat(32);
let server: Server | null = null;
const seen: Array<{
  auth?: string;
  principal?: string;
  body: { method: string; params: Record<string, unknown> };
}> = [];

afterEach(async () => {
  seen.length = 0;
  await new Promise((r) => (server ? server.close(r) : r(null)));
  server = null;
});

const JOB = {
  id: 'j1',
  status: 'queued',
  phase: 'queued',
  pct: 0,
  source: '/p/footage/a.mp4',
  app: 'flistudio',
  project: 'd99',
  queuedAt: '2026-09-23T10:00:00.000Z',
};

/** A stand-in FliTools: answers transcribe.* the way the real door does; publishes its control file in `home`. */
async function fakeFlitools(
  home: string,
  answer: (method: string, params: Record<string, unknown>) => unknown,
) {
  const stub = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw) as {
        id: number;
        method: string;
        params: Record<string, unknown>;
      };
      seen.push({
        auth: req.headers.authorization,
        principal: req.headers['x-fli-principal'] as string,
        body,
      });
      const out = answer(body.method, body.params);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, ...(out as object) }));
    });
  });
  server = stub;
  await new Promise<void>((r) => stub.listen(0, '127.0.0.1', () => r()));
  const port = (stub.address() as AddressInfo).port;
  await writeControlFile(controlFilePath('flitools', { home }), {
    port,
    token: TOKEN,
    pid: process.pid,
  });
}

describe('the FliTools client', () => {
  it('finds FliTools through its control file and names the app as an agent', async () => {
    const home = await tempDir();
    await fakeFlitools(home, () => ({ result: JOB }));
    const job = await transcribeQueued('/p/footage/a.mp4', {
      app: 'flistudio',
      project: 'd99',
      home,
    });
    expect(job).toEqual({ kind: 'ok', value: JOB });
    expect(seen[0]).toEqual({
      auth: `Bearer ${TOKEN}`,
      principal: 'agent:flistudio',
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'transcribe.run',
        params: { path: '/p/footage/a.mp4', app: 'flistudio', project: 'd99', wait: false },
      },
    });
  });

  it('passes language and vocabulary, and finds a transcript', async () => {
    const home = await tempDir();
    const found = {
      path: '/p/a.mp4',
      files: { json: '/p/a.json', srt: '/p/a.srt', txt: '/p/a.txt' },
      exists: true,
      current: true,
      wordTimings: true,
      engine: 'groq',
    };
    await fakeFlitools(home, (method) => ({
      result: method === 'transcribe.find' ? found : { transcript: {} },
    }));
    await transcribe('/p/a.mp4', { app: 'flicut', home, language: 'th', vocabulary: ['FliCut'] });
    expect(seen[0]?.body.params).toEqual({
      path: '/p/a.mp4',
      app: 'flicut',
      language: 'th',
      vocabulary: ['FliCut'],
    });
    expect(await transcriptFor('/p/a.mp4', { app: 'flicut', home })).toEqual({
      kind: 'ok',
      value: found,
    });
  });

  it('reads the app’s queue for a project', async () => {
    const home = await tempDir();
    await fakeFlitools(home, () => ({
      result: [JOB, { ...JOB, id: 'j2', status: 'done', pct: 100 }],
    }));
    const jobs = await transcriptJobs({ project: 'd99' }, { app: 'flistudio', home });
    expect(jobs.kind === 'ok' && jobs.value.map((j) => j.status)).toEqual(['queued', 'done']);
    expect(seen[0]?.body.params).toEqual({ app: 'flistudio', project: 'd99' });
  });

  it('passes FliTools’ named refusal through', async () => {
    const home = await tempDir();
    await fakeFlitools(home, () => ({
      error: {
        code: -32007,
        message: 'No file.',
        data: { failureMode: 'file-not-found', details: { path: '/x' } },
      },
    }));
    expect(await transcriptFor('/x', { app: 'flistudio', home })).toEqual({
      kind: 'refused',
      failureMode: 'file-not-found',
      message: 'No file.',
      details: { path: '/x' },
    });
  });

  it('refuses an answer outside the contract', async () => {
    const home = await tempDir();
    await fakeFlitools(home, () => ({ result: { nope: true } }));
    const bad = await transcriptJobs({}, { app: 'flistudio', home });
    expect(bad.kind).toBe('refused');
  });

  it('is unavailable when FliTools is absent, stale or silent — never a throw', async () => {
    const home = await tempDir();
    const absent = await flitoolsCall('transcribe.jobs', {}, { app: 'flistudio', home });
    expect(absent).toMatchObject({
      kind: 'unavailable',
      reason: expect.stringContaining('no control file'),
    });

    const file = controlFilePath('flitools', { home });
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify({ port: 1, token: TOKEN, pid: 2 ** 22 + 1 }));
    expect(await transcriptFor('/a', { app: 'flistudio', home })).toMatchObject({
      kind: 'unavailable',
      reason: expect.stringContaining('gone'),
    });
    await fs.writeFile(file, '{');
    expect((await transcriptFor('/a', { app: 'flistudio', controlFile: file })).kind).toBe(
      'unavailable',
    );

    await fs.writeFile(file, JSON.stringify({ port: 1, token: TOKEN, pid: process.pid }));
    const silent = await transcriptFor('/a', {
      app: 'flistudio',
      controlFile: file,
      timeoutMs: 500,
    });
    expect(silent).toMatchObject({
      kind: 'unavailable',
      reason: expect.stringContaining('did not answer on port 1'),
    });
  });
});
