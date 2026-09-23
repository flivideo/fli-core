import { randomBytes, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { atomicWrite, errorCode, errorMessage } from './fs-utils.js';

/**
 * Control-file discovery (agent-drivable step 2, David 2026-09-23): a running app publishes where its door is and the
 * bearer token for it, so an agent finds both without asking a person. One place per app —
 * `~/Library/Application Support/<app>/control.json`, where FliCut, FliCast and Teletubby already put theirs — and one
 * shape, `{ port, token, pid }`, written 0600 at boot with a fresh token and removed at exit.
 *
 * A control file outlives a crash, so its presence proves nothing. `readControlFile` checks the pid: a file whose
 * process is gone reads as `stale`, never as a door to call.
 */

export const ControlFile = z.looseObject({
  port: z.number().int().positive(),
  /** Bearer token for this run; a new one every launch. */
  token: z.string().min(16),
  /** The process serving the door. Optional only so older files still read; every writer sets it. */
  pid: z.number().int().positive().optional(),
  startedAt: z.iso.datetime().optional(),
  /** The app's version, for a caller that must know what it is talking to. */
  version: z.string().optional(),
});
export type ControlFile = z.infer<typeof ControlFile>;

export const ControlFileRead = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('live'), path: z.string(), control: ControlFile }),
  /** The file is there but its pid is not running: the app crashed or was killed. */
  z.object({ kind: z.literal('stale'), path: z.string(), control: ControlFile }),
  z.object({ kind: z.literal('absent'), path: z.string() }),
  z.object({ kind: z.literal('invalid'), path: z.string(), message: z.string() }),
]);
export type ControlFileRead = z.infer<typeof ControlFileRead>;

export interface ControlFileOptions {
  /** Defaults to `os.homedir()`; tests pass a temp home. */
  home?: string;
}

/** `<home>/Library/Application Support/<app>/control.json`. */
export function controlFilePath(app: string, options: ControlFileOptions = {}): string {
  if (!/^[a-z][a-z0-9-]*$/.test(app)) throw new Error(`Invalid app name "${app}"`);
  const home = options.home ?? os.homedir();
  return path.join(home, 'Library', 'Application Support', app, 'control.json');
}

/** A fresh bearer token: 32 random bytes, hex. */
export function newControlToken(): string {
  return randomBytes(32).toString('hex');
}

/** Whether a process with this pid exists (EPERM means it exists but is not ours — still alive). */
export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) === 'EPERM';
  }
}

/** Publish the door: written atomically, readable by this user only. */
export async function writeControlFile(file: string, control: ControlFile): Promise<void> {
  const parsed = ControlFile.parse(control);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await atomicWrite(file, `${JSON.stringify(parsed, null, 2)}\n`);
  await fs.chmod(file, 0o600);
}

/** Read an app's control file; `live` only when its pid is running (a file without a pid is trusted as live). */
export async function readControlFile(file: string): Promise<ControlFileRead> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return { kind: 'absent', path: file };
    return { kind: 'invalid', path: file, message: errorMessage(error) };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return { kind: 'invalid', path: file, message: errorMessage(error) };
  }
  const parsed = ControlFile.safeParse(json);
  if (!parsed.success) return { kind: 'invalid', path: file, message: parsed.error.message };
  const control = parsed.data;
  const alive = control.pid === undefined || pidAlive(control.pid);
  return { kind: alive ? 'live' : 'stale', path: file, control };
}

/** Remove the control file at exit — only when it is still this process's, so a newer run's file survives. */
export async function removeControlFile(file: string, pid: number = process.pid): Promise<boolean> {
  const read = await readControlFile(file);
  if (read.kind !== 'live' && read.kind !== 'stale') return false;
  if (read.control.pid !== undefined && read.control.pid !== pid) return false;
  await fs.rm(file, { force: true });
  return true;
}

/** Check an `Authorization` header against the token, in constant time. */
export function bearerMatches(header: string | undefined, token: string): boolean {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? '');
  const presented = match?.[1];
  if (presented === undefined) return false;
  const given = Buffer.from(presented);
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
