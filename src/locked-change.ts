import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';
import { atomicWrite, errorMessage, takeLock } from './fs-utils.js';
import { issuesOf, type ReadFileResult } from './results.js';

/**
 * The one locked read-modify-write behind a brand-level list file (a series, a group): under a lock beside the file,
 * re-read it, apply `change` to what is on disk now, validate, write atomically — so two writers never lose each
 * other's member. Never throws; every failure is a `refused` result. An unusable file is refused, never overwritten.
 */

export type LockedRefusalReason =
  'invalid-input' | 'not-found' | 'member-not-found' | 'unusable-file' | 'busy' | 'io-error';

export type LockedChangeResult<T> =
  { kind: 'written'; value: T } | { kind: 'refused'; reason: LockedRefusalReason; message: string };

export interface LockedChangeOptions<T> {
  file: string;
  /** What the thing is called in messages ("series", "group"). */
  noun: string;
  id: string;
  brandRoot: string;
  fileName: string;
  read: () => Promise<ReadFileResult<T>>;
  schema: z.ZodType<T>;
  /** Extra checks on the parsed result (duplicate members…): a message refuses as `invalid-input`. */
  check?: (value: T) => string | null;
  change: (value: T) => T | null;
  waitMs?: number;
  staleMs?: number;
}

export async function lockedChange<T>(
  spec: LockedChangeOptions<T>,
): Promise<LockedChangeResult<T>> {
  const { file, noun, id } = spec;
  const lock = `${file}.lock`;
  const refuse = (reason: LockedRefusalReason, message: string): LockedChangeResult<T> => ({
    kind: 'refused',
    reason,
    message,
  });
  try {
    if (
      !(await fs.stat(path.dirname(file)).then(
        (s) => s.isDirectory(),
        () => false,
      ))
    ) {
      return refuse('not-found', `There is no ${noun} "${id}" in ${spec.brandRoot}.`);
    }
    if (!(await takeLock(lock, spec.waitMs ?? 3000, spec.staleMs ?? 10_000))) {
      return refuse('busy', `${file} is being changed by another writer (${lock}); try again.`);
    }
  } catch (error) {
    return refuse('io-error', errorMessage(error));
  }
  try {
    const read = await spec.read();
    if (read === null)
      return refuse('not-found', `There is no ${spec.fileName} for ${noun} "${id}".`);
    if (read.kind === 'invalid') {
      return refuse(
        'unusable-file',
        `${file} is not a usable ${noun} (${read.reason}: ${read.message}); fix it by hand first.`,
      );
    }
    let next: T | null;
    try {
      next = spec.change(read.value);
    } catch (error) {
      return refuse('invalid-input', errorMessage(error));
    }
    if (next === null) return refuse('member-not-found', `Nothing to change in ${file}.`);
    const parsed = spec.schema.safeParse(next);
    if (!parsed.success) return refuse('invalid-input', issuesOf(parsed.error).join('; '));
    const problem = spec.check?.(parsed.data);
    if (problem) return refuse('invalid-input', problem);
    await atomicWrite(file, `${JSON.stringify(parsed.data, null, 2)}\n`);
    return { kind: 'written', value: parsed.data };
  } catch (error) {
    return refuse('io-error', errorMessage(error));
  } finally {
    await fs.rm(lock, { force: true });
  }
}
