import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { IDENTITY_FILE } from './app-file.js';
import { atomicCreate, atomicWrite, errorCode, errorMessage, readJsonFile } from './fs-utils.js';
import { ProjectCode } from './project-folder.js';
import { issuesOf, readFileResult, type ReadFileResult } from './results.js';

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

export const ReadIdentityResult = readFileResult(ProjectIdentity);
export type ReadIdentityResult = z.infer<typeof ReadIdentityResult>;

/** Read `<dir>/fli.studio.json`. Absent → `null`; malformed → an `invalid` result. Never throws. */
export function readIdentity(dir: string): Promise<ReadIdentityResult> {
  return readJsonFile(path.join(dir, IDENTITY_FILE), ProjectIdentity);
}

const Refused = <R extends string>(reason: R) =>
  z.object({
    kind: z.literal('refused'),
    reason: z.literal(reason),
    path: z.string(),
    message: z.string(),
  });

export const WriteIdentityResult = z.union([
  z.object({ kind: z.literal('written'), path: z.string(), replaced: z.boolean() }),
  Refused('invalid-input'),
  Refused('different-id').extend({ existingId: z.string() }),
  Refused('existing-invalid'),
  Refused('io-error'),
]);
export type WriteIdentityResult = z.infer<typeof WriteIdentityResult>;

/**
 * Write `<dir>/fli.studio.json` atomically: an exclusive create (temp file + link) when none exists, a temp file +
 * rename when rewriting the same `id`.
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

  const content = `${JSON.stringify(parsed.data, null, 2)}\n`;
  const existing = await readIdentity(dir);
  const refusal = refusalFor(existing, parsed.data.id, file);
  if (refusal) return refusal;

  if (existing === null) {
    try {
      // Exclusive create: of two concurrent adopts with different ids, exactly one wins (F2).
      await atomicCreate(file, content);
      return { kind: 'written', path: file, replaced: false };
    } catch (error) {
      if (errorCode(error) !== 'EEXIST') {
        return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
      }
      const winner = await readIdentity(dir);
      const lost = refusalFor(winner, parsed.data.id, file);
      if (lost) return lost;
      if (winner === null) {
        return {
          kind: 'refused',
          reason: 'io-error',
          path: file,
          message: `${IDENTITY_FILE} appeared and vanished while being created; not written.`,
        };
      }
      // Another writer created the same id first: rewrite it like any same-id write.
    }
  }

  try {
    await atomicWrite(file, content);
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }
  return { kind: 'written', path: file, replaced: true };
}

function refusalFor(
  existing: ReadFileResult<ProjectIdentity>,
  id: string,
  file: string,
): WriteIdentityResult | null {
  if (existing?.kind === 'invalid') {
    return {
      kind: 'refused',
      reason: 'existing-invalid',
      path: file,
      message: `An unreadable ${IDENTITY_FILE} is already there (${existing.reason}: ${existing.message}); it is not overwritten.`,
    };
  }
  if (existing?.kind === 'valid' && existing.value.id !== id) {
    return {
      kind: 'refused',
      reason: 'different-id',
      path: file,
      existingId: existing.value.id,
      message: `${IDENTITY_FILE} already holds a different project id (${existing.value.id}).`,
    };
  }
  return null;
}
