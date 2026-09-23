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

/** Call one FliTools verb over its JSON-RPC door. */
export async function flitoolsCall(
  method: string,
  params: Record<string, unknown>,
  options: FliToolsOptions,
): Promise<FliToolsAnswer<unknown>> {
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
  let body: {
    result?: unknown;
    error?: { message?: string; data?: { failureMode?: string; details?: unknown } };
  };
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/rpc`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        [PRINCIPAL_HEADER]: `agent:${options.app}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
    body = (await res.json()) as typeof body;
  } catch (error) {
    return {
      kind: 'unavailable',
      reason: `FliTools did not answer on port ${port}: ${error instanceof Error ? error.message : String(error)}`,
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
