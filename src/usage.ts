import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { controlFilePath, type ControlFileOptions } from './control-file.js';
import { atomicWrite } from './fs-utils.js';
import { UsageRecord } from './describe.js';
import type { CallAnswer } from './openrpc.js';

/**
 * Call telemetry for an app's door (RPC Map milestone 1, `usage/1`): per verb, how many times it was called, the first
 * and last time, who called last and the last refusal. It answers one question — which commands does anyone use? —
 * so it keeps nothing else: no inputs, no outputs, no project or file names. The only personal datum is the principal
 * string (`human:ui`, `agent:tuber`, `cli`), which the door already knows.
 *
 * Kept beside `control.json` (`~/Library/Application Support/<app>/usage.json`). `record` is synchronous and cheap, and
 * never throws; the file is written at most every `flushMs` (and once more on `close`) by a write that nobody waits
 * for and whose failure is swallowed — a full disk costs the counts, never a call.
 */

export const USAGE_SCHEMA = 'usage/1';

export const UsageFile = z.object({
  schema: z.literal(USAGE_SCHEMA),
  /** When this file's counting began (the first run that wrote it). */
  since: z.string(),
  verbs: z.record(z.string(), UsageRecord),
});
export type UsageFile = z.infer<typeof UsageFile>;

/** `<home>/Library/Application Support/<app>/usage.json`, beside the control file. */
export function usageFilePath(app: string, options: ControlFileOptions = {}): string {
  return path.join(path.dirname(controlFilePath(app, options)), 'usage.json');
}

export interface UsageTelemetryOptions {
  /** The file; none → counts live in memory only (tests, the CLI). */
  file?: string;
  /** Least time between two writes. Default 5 s. */
  flushMs?: number;
  now?: () => Date;
  /** Told when a write fails (the app logs it); never throws. */
  onError?: (error: unknown) => void;
}

export class UsageTelemetry {
  private readonly verbs = new Map<string, UsageRecord>();
  private since: string;
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;
  private writing: Promise<void> = Promise.resolve();
  private readonly now: () => Date;
  private readonly flushMs: number;

  constructor(private readonly options: UsageTelemetryOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.flushMs = options.flushMs ?? 5000;
    this.since = this.now().toISOString();
  }

  /** Read the file left by earlier runs, if any. A missing or unreadable file starts the count afresh. */
  async load(): Promise<void> {
    if (!this.options.file) return;
    try {
      const parsed = UsageFile.safeParse(JSON.parse(await fs.readFile(this.options.file, 'utf8')));
      if (!parsed.success) return;
      this.since = parsed.data.since;
      for (const [verb, record] of Object.entries(parsed.data.verbs)) {
        const mine = this.verbs.get(verb);
        // Calls counted before load finished are added to, not replaced by, what the file held.
        this.verbs.set(
          verb,
          mine
            ? {
                calls: record.calls + mine.calls,
                firstUsed: record.firstUsed ?? mine.firstUsed,
                lastUsed: mine.lastUsed ?? record.lastUsed,
                lastPrincipal: mine.lastPrincipal ?? record.lastPrincipal,
                lastFailureMode: mine.lastFailureMode ?? record.lastFailureMode,
              }
            : record,
        );
      }
    } catch {
      /* no file yet, or unreadable: count from now */
    }
  }

  /** Count one call. `failureMode` is the named refusal, absent on success. Never throws, never waits. */
  record(verb: string, principal: string, failureMode?: string | null): void {
    try {
      const at = this.now().toISOString();
      const before = this.verbs.get(verb);
      this.verbs.set(verb, {
        calls: (before?.calls ?? 0) + 1,
        firstUsed: before?.firstUsed ?? at,
        lastUsed: at,
        lastPrincipal: principal,
        // The last outcome, not the last failure ever: a success clears it.
        lastFailureMode: failureMode ?? null,
      });
      this.dirty = true;
      this.schedule();
    } catch {
      /* telemetry never costs a call */
    }
  }

  /** The counts as they stand. */
  snapshot(): { since: string; verbs: Record<string, UsageRecord> } {
    return { since: this.since, verbs: Object.fromEntries(this.verbs) };
  }

  /** Write now (used by `close` and by tests). Resolves when the write has finished; never rejects. */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.options.file || !this.dirty) {
      await this.writing;
      return;
    }
    this.dirty = false;
    const file = this.options.file;
    const body = `${JSON.stringify({ schema: USAGE_SCHEMA, since: this.since, verbs: Object.fromEntries(this.verbs) } satisfies UsageFile, null, 2)}\n`;
    this.writing = this.writing.then(async () => {
      try {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await atomicWrite(file, body);
      } catch (error) {
        this.dirty = true;
        this.options.onError?.(error);
      }
    });
    await this.writing;
  }

  /** Stop the timer and write what is pending (at shutdown). */
  async close(): Promise<void> {
    await this.flush();
  }

  private schedule(): void {
    if (this.timer || !this.options.file) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.flushMs);
    // A pending write must never keep the process alive.
    this.timer.unref();
  }
}

/** The named refusal of an answer, or null when it succeeded. */
export function failureModeOf(answer: CallAnswer): string | null {
  return answer.ok ? null : answer.error.failureMode;
}

/**
 * Count every call that goes through a door's `call` function (the one `answerJsonRpc` takes), as `principal`.
 * The answer is returned untouched; a call that throws is counted as `internal` and rethrown.
 */
export function countingCall(
  call: (method: string, params: Record<string, unknown>) => Promise<CallAnswer>,
  telemetry: UsageTelemetry,
  principal: string,
  known: (method: string) => boolean = () => true,
): (method: string, params: Record<string, unknown>) => Promise<CallAnswer> {
  return async (method, params) => {
    try {
      const answer = await call(method, params);
      if (known(method)) telemetry.record(method, principal, failureModeOf(answer));
      return answer;
    } catch (error) {
      if (known(method)) telemetry.record(method, principal, 'internal');
      throw error;
    }
  };
}
