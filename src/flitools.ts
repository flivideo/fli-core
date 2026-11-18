import { z } from 'zod';
import { controlFilePath, readControlFile } from './control-file.js';
import { PRINCIPAL_HEADER } from './capability.js';

/**
 * The thin FliTools client (David 2026-09-23, 13:19: "FliHub, FliCut and FliStudio ask it for a transcript. The shared
 * library only gains a small helper for that."). FliTools is a local service; its door is found through its control
 * file, like every Fli app's. Every call answers `ok`, `refused` (FliTools said no, with its named refusal) or
 * `unavailable` (not running, stale, or no answer) — a caller never has to catch.
 */

/** Where a transcript's three files live: json (words + timings), srt, txt. */
export const TranscriptFiles = z.object({ json: z.string(), srt: z.string(), txt: z.string() });
export type TranscriptFiles = z.infer<typeof TranscriptFiles>;

export const TranscriptJobStatus = z.enum(['queued', 'running', 'done', 'failed']);
export type TranscriptJobStatus = z.infer<typeof TranscriptJobStatus>;

/** One FliTools job (`transcribe.jobs`, or `transcribe.run { wait: false }`). */
export const TranscriptJob = z.looseObject({
  id: z.string(),
  status: TranscriptJobStatus,
  phase: z.string(),
  pct: z.number(),
  /** The recording's absolute path. */
  source: z.string(),
  app: z.string(),
  project: z.string(),
  queuedAt: z.string(),
  error: z.string().optional(),
});
export type TranscriptJob = z.infer<typeof TranscriptJob>;

/** `transcribe.find`: is there a transcript for this recording, and is it for its current content. */
export const TranscriptFound = z.looseObject({
  path: z.string(),
  files: TranscriptFiles,
  exists: z.boolean(),
  current: z.boolean(),
  wordTimings: z.boolean(),
});
export type TranscriptFound = z.infer<typeof TranscriptFound>;

export type FliToolsAnswer<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'refused'; failureMode: string; message: string; details?: unknown }
  | { kind: 'unavailable'; reason: string };

export interface FliToolsOptions {
  /** The calling app; FliTools records it and scopes its queue by it. Sent as `agent:<app>`. */
  app: string;
  /**
   * A shared FliTools on another machine, reached through Tailscale Serve (e.g. `https://<host>.<tailnet>.ts.net:8443`).
   * Set: the control file is not read and no token is sent; that FliTools names the caller by its Tailscale login and
   * ignores `x-fli-principal`. Unset: this machine's FliTools, through its control file.
   */
  url?: string;
  /** FliTools' control file. Default `<home>/Library/Application Support/flitools/control.json`. */
  controlFile?: string;
  home?: string;
  timeoutMs?: number;
}

export interface TranscribeOptions extends FliToolsOptions {
  project?: string;
  /** Default true: answer with the transcript. false: answer with the queued job. */
  wait?: boolean;
  language?: string;
  vocabulary?: string[];
}

/** Where a FliTools door is, and the token it wants (none for a shared FliTools behind Serve). */
export type FliToolsEndpoint = { base: string; token: string | null; remote: boolean };

/** `https://host:8443/` → `https://host:8443`. */
const trimmed = (url: string) => url.trim().replace(/\/+$/, '');

/** Find FliTools: the shared URL when one is set, else the local control file. Never throws. */
export async function flitoolsEndpoint(
  options: Pick<FliToolsOptions, 'url' | 'controlFile' | 'home'>,
): Promise<{ kind: 'ok'; endpoint: FliToolsEndpoint } | { kind: 'unavailable'; reason: string }> {
  if (options.url !== undefined && options.url.trim() !== '') {
    return { kind: 'ok', endpoint: { base: trimmed(options.url), token: null, remote: true } };
  }
  const file =
    options.controlFile ??
    controlFilePath('flitools', options.home === undefined ? {} : { home: options.home });
  const read = await readControlFile(file);
  if (read.kind !== 'live') {
    const why = {
      absent: 'FliTools is not running (no control file)',
      stale: 'FliTools is not running (its control file names a process that is gone)',
      invalid: 'FliTools’ control file is unreadable',
    }[read.kind];
    return { kind: 'unavailable', reason: `${why}: ${file}` };
  }
  const { port, token } = read.control;
  return {
    kind: 'ok',
    endpoint: { base: `http://127.0.0.1:${port}`, token: token ?? null, remote: false },
  };
}

/** Call one FliTools verb over its JSON-RPC door (this machine's, or the shared one at `options.url`). */
export async function flitoolsCall(
  method: string,
  params: Record<string, unknown>,
  options: FliToolsOptions,
): Promise<FliToolsAnswer<unknown>> {
  const found = await flitoolsEndpoint(options);
  if (found.kind !== 'ok') return found;
  const { base, token, remote } = found.endpoint;
  let body: {
    result?: unknown;
    error?: { message?: string; data?: { failureMode?: string; details?: unknown } };
  };
  try {
    const res = await fetch(`${base}/api/rpc`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        [PRINCIPAL_HEADER]: `agent:${options.app}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
    body = (await res.json()) as typeof body;
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    return {
      kind: 'unavailable',
      reason: remote
        ? `The shared FliTools at ${base} did not answer: ${why}`
        : `FliTools did not answer on ${base.replace('http://127.0.0.1:', 'port ')}: ${why}`,
    };
  }
  if (body.error) {
    const { data } = body.error;
    return {
      kind: 'refused',
      failureMode: data?.failureMode ?? 'internal',
      message: body.error.message ?? 'FliTools refused.',
      ...(data?.details === undefined ? {} : { details: data.details }),
    };
  }
  return { kind: 'ok', value: body.result };
}

function parsed<T>(answer: FliToolsAnswer<unknown>, schema: z.ZodType<T>): FliToolsAnswer<T> {
  if (answer.kind !== 'ok') return answer;
  const checked = schema.safeParse(answer.value);
  return checked.success
    ? { kind: 'ok', value: checked.data }
    : {
        kind: 'refused',
        failureMode: 'internal',
        message: `FliTools answered outside its contract: ${checked.error.message}`,
      };
}

/** Transcribe a recording. With `wait: false` the answer is the queued job. */
export async function transcribe(
  recording: string,
  options: TranscribeOptions,
): Promise<FliToolsAnswer<unknown>> {
  const { app, project, wait, language, vocabulary } = options;
  return flitoolsCall(
    'transcribe.run',
    {
      path: recording,
      app,
      ...(project === undefined ? {} : { project }),
      ...(wait === undefined ? {} : { wait }),
      ...(language === undefined ? {} : { language }),
      ...(vocabulary === undefined ? {} : { vocabulary }),
    },
    options,
  );
}

/** Queue a recording without waiting: the job, or why not. */
export async function transcribeQueued(
  recording: string,
  options: Omit<TranscribeOptions, 'wait'>,
): Promise<FliToolsAnswer<TranscriptJob>> {
  return parsed(await transcribe(recording, { ...options, wait: false }), TranscriptJob);
}

/** The transcript FliTools has for a recording (whether or not it exists yet). */
export async function transcriptFor(
  recording: string,
  options: FliToolsOptions,
): Promise<FliToolsAnswer<TranscriptFound>> {
  return parsed(
    await flitoolsCall('transcribe.find', { path: recording }, options),
    TranscriptFound,
  );
}

/** FliTools' queue, scoped to this app (and a project when given). */
export async function transcriptJobs(
  scope: { project?: string; all?: boolean },
  options: FliToolsOptions,
): Promise<FliToolsAnswer<TranscriptJob[]>> {
  return parsed(
    await flitoolsCall('transcribe.jobs', { app: options.app, ...scope }, options),
    z.array(TranscriptJob),
  );
}

/* ---- One job-waiting helper, and a typed call for each family's job verb -------------------------------------- */

/** The shape every FliTools job view shares (transcribe, audio, face, listen). Looser views pass through as `T`. */
export const FliToolsJobBase = z.looseObject({
  id: z.string(),
  status: z.enum(['queued', 'running', 'done', 'failed']),
  phase: z.string().optional(),
  pct: z.number().optional(),
  error: z.string().optional(),
});
export type FliToolsJobBase = z.infer<typeof FliToolsJobBase>;

/** FliTools' job-starting verbs and the verb that reports on each, one per family. */
export const FLITOOLS_JOB_FAMILIES = {
  transcribe: { submit: 'transcribe.run', status: 'transcribe.job' },
  audio: { submit: 'audio.clean', status: 'audio.job' },
  face: { submit: 'face.track', status: 'face.job' },
  listen: { submit: 'listen.transcribe', status: 'listen.job' },
} as const;
export type FliToolsJobFamily = keyof typeof FLITOOLS_JOB_FAMILIES;

export interface WaitForJobOptions extends FliToolsOptions {
  /** Poll gap. Default 1000. */
  pollMs?: number;
  /** Give up after this long and say so plainly. Default 45 minutes (one job at a time; a long file takes minutes). */
  timeoutMs?: number;
  /** Called on every poll with the job as FliTools reports it. */
  onProgress?: (job: FliToolsJobBase) => void;
  /** Injected so a test needs no real wait. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

/**
 * Submit a job and wait for it: call `submit`, poll `status` with the job's id until it is done. Never throws.
 * `ok` → the finished job. `refused` → FliTools said no (its own failureMode), or the job `failed`
 * (failureMode `job-failed`, `details` = the job) or ran past `timeoutMs` (`job-timeout`, `details` = the last view).
 * `unavailable` → FliTools is not running or stopped answering.
 */
export async function submitAndWait<T extends FliToolsJobBase = FliToolsJobBase>(
  submit: string,
  params: Record<string, unknown>,
  status: string,
  options: WaitForJobOptions,
): Promise<FliToolsAnswer<T>> {
  const started = await flitoolsCall(submit, params, options);
  if (started.kind !== 'ok') return started;
  const first = FliToolsJobBase.safeParse(started.value);
  if (!first.success) {
    return {
      kind: 'refused',
      failureMode: 'internal',
      message: `FliTools answered ${submit} outside its contract: ${first.error.message}`,
    };
  }
  return waitForJob<T>(status, first.data.id, options, started.value as T);
}

/** Poll an existing job (its id from an earlier submit) until it is done, failed or out of time. Never throws. */
export async function waitForJob<T extends FliToolsJobBase = FliToolsJobBase>(
  status: string,
  id: string,
  options: WaitForJobOptions,
  firstView?: T,
): Promise<FliToolsAnswer<T>> {
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 45 * 60_000;
  const deadline = now() + timeoutMs;
  let view: T | undefined = firstView;
  for (;;) {
    if (view !== undefined) {
      const job = FliToolsJobBase.safeParse(view);
      if (job.success) {
        options.onProgress?.(job.data);
        if (job.data.status === 'done') return { kind: 'ok', value: view };
        if (job.data.status === 'failed') {
          return {
            kind: 'refused',
            failureMode: 'job-failed',
            message: `FliTools job ${id} failed: ${job.data.error ?? 'no reason given'}`,
            details: view,
          };
        }
      }
    }
    if (now() >= deadline) {
      return {
        kind: 'refused',
        failureMode: 'job-timeout',
        message: `FliTools job ${id} was still not done after ${Math.round(timeoutMs / 1000)}s.`,
        ...(view === undefined ? {} : { details: view }),
      };
    }
    await sleep(options.pollMs ?? 1000);
    const polled = await flitoolsCall(status, { id }, options);
    if (polled.kind !== 'ok') return polled;
    view = polled.value as T;
    if (!FliToolsJobBase.safeParse(view).success) {
      return {
        kind: 'refused',
        failureMode: 'internal',
        message: `FliTools answered ${status} outside its contract.`,
      };
    }
  }
}

/** Submit one family's job (`transcribe`, `audio`, `face`, `listen`) and wait for it. */
export function runJob<T extends FliToolsJobBase = FliToolsJobBase>(
  family: FliToolsJobFamily,
  params: Record<string, unknown>,
  options: WaitForJobOptions,
): Promise<FliToolsAnswer<T>> {
  const verbs = FLITOOLS_JOB_FAMILIES[family];
  // transcribe.run answers the transcript when it waits; the job path always asks for the queued job.
  const sent = family === 'transcribe' ? { ...params, wait: false } : params;
  return submitAndWait<T>(verbs.submit, { app: options.app, ...sent }, verbs.status, options);
}
