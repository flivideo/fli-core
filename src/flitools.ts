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
