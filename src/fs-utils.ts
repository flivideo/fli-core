import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';
import { issuesOf, type ReadFileResult } from './results.js';

export function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Write `content` to `target` atomically: a temp file in the same directory, then rename over the target.
 * A reader sees the old file or the new one, never half of either.
 */
export async function atomicWrite(target: string, content: string): Promise<void> {
  const tmp = tempPathFor(target);
  try {
    await fs.writeFile(tmp, content, { flag: 'wx' });
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.rm(tmp, { force: true });
    throw error;
  }
}

const NO_HARD_LINKS = new Set(['EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS', 'EXDEV']);

/**
 * Create `target` with `content` only if it does not exist yet, atomically: a temp file in the same directory, then
 * `link` it into place, which fails with `EEXIST` when another writer got there first (rename would replace). On a
 * volume without hard links it falls back to an exclusive `wx` create of the target itself: still no overwrite, but a
 * reader may briefly see a partly written file. Throws the underlying error, `EEXIST` included.
 */
export async function atomicCreate(target: string, content: string): Promise<void> {
  const tmp = tempPathFor(target);
  try {
    await fs.writeFile(tmp, content, { flag: 'wx' });
    try {
      await fs.link(tmp, target);
    } catch (error) {
      const code = errorCode(error);
      if (code === undefined || !NO_HARD_LINKS.has(code)) throw error;
      await fs.writeFile(target, content, { flag: 'wx' });
    }
  } finally {
    await fs.rm(tmp, { force: true });
  }
}

function tempPathFor(target: string): string {
  return path.join(
    path.dirname(target),
    `.${path.basename(target)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
}

/** Read and validate a JSON file. Never throws: absent → `null`, anything unusable → an `invalid` result. */
export async function readJsonFile<S extends z.ZodType>(
  file: string,
  schema: S,
): Promise<ReadFileResult<z.infer<S>>> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    return { kind: 'invalid', path: file, reason: 'unreadable', message: errorMessage(error) };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return { kind: 'invalid', path: file, reason: 'not-json', message: errorMessage(error) };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      kind: 'invalid',
      path: file,
      reason: 'schema',
      message: issuesOf(parsed.error).join('; '),
    };
  }
  return { kind: 'valid', path: file, value: parsed.data };
}
