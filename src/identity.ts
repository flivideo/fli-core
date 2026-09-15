import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { IDENTITY_FILE } from './app-file.js';
import { atomicWrite, errorMessage, readJsonFile } from './fs-utils.js';
import { ProjectCode } from './project-folder.js';
import { issuesOf, type ReadFileResult } from './results.js';

/** `fli.studio.json` (A3): the project's identity. Membership of a brand = this file exists and is valid (R8). */
export const ProjectIdentity = z.object({
  schema: z.literal(1),
  id: z.uuid(),
  brand: z.string().min(1),
  code: ProjectCode,
  name: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
});
export type ProjectIdentity = z.infer<typeof ProjectIdentity>;

/** Read `<dir>/fli.studio.json`. Absent → `null`; malformed → an `invalid` result. Never throws. */
export function readIdentity(dir: string): Promise<ReadFileResult<ProjectIdentity>> {
  return readJsonFile(path.join(dir, IDENTITY_FILE), ProjectIdentity);
}

export type WriteIdentityResult =
  | { kind: 'written'; path: string; replaced: boolean }
  | { kind: 'refused'; reason: 'invalid-input'; path: string; message: string }
  | { kind: 'refused'; reason: 'different-id'; path: string; existingId: string; message: string }
  | { kind: 'refused'; reason: 'existing-invalid'; path: string; message: string }
  | { kind: 'refused'; reason: 'io-error'; path: string; message: string };

/**
 * Write `<dir>/fli.studio.json` atomically (temp file + rename).
 * Refuses — as a typed result, never a throw — when the input is not a valid identity, when a file with a different
 * `id` is already there, when the existing file cannot be read as an identity, or when the write itself fails.
 * Rewriting the same `id` is allowed.
 */
export async function writeIdentity(
  dir: string,
  identity: ProjectIdentity,
): Promise<WriteIdentityResult> {
  const file = path.join(dir, IDENTITY_FILE);

  const parsed = ProjectIdentity.safeParse(identity);
  if (!parsed.success) {
    return {
      kind: 'refused',
      reason: 'invalid-input',
      path: file,
      message: issuesOf(parsed.error).join('; '),
    };
  }

  try {
    if (!(await fs.stat(dir)).isDirectory()) throw new Error(`${dir} is not a directory`);
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }

  const existing = await readIdentity(dir);
  if (existing?.kind === 'invalid') {
    return {
      kind: 'refused',
      reason: 'existing-invalid',
      path: file,
      message: `An unreadable ${IDENTITY_FILE} is already there (${existing.reason}: ${existing.message}); it is not overwritten.`,
    };
  }
  if (existing?.kind === 'valid' && existing.value.id !== parsed.data.id) {
    return {
      kind: 'refused',
      reason: 'different-id',
      path: file,
      existingId: existing.value.id,
      message: `${IDENTITY_FILE} already holds a different project id (${existing.value.id}).`,
    };
  }

  try {
    await atomicWrite(file, `${JSON.stringify(parsed.data, null, 2)}\n`);
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }
  return { kind: 'written', path: file, replaced: existing !== null };
}
