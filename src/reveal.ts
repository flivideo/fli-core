import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * Open a location in Finder (David 2026-09-24, folder access — "Open in Finder" and "Copy full path" on every location
 * an app shows). A folder opens as itself; a file opens its folder with the file selected (`open -R`). Only paths inside
 * the given roots (a brand root, a project) are revealed — an app never becomes a way to open an arbitrary path.
 * macOS only, like FliHub's `/api/system/open-folder`, whose behaviour this is.
 */

export const RevealResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('revealed'), path: z.string(), selected: z.boolean() }),
  z.object({
    kind: z.literal('refused'),
    path: z.string(),
    reason: z.enum(['outside-roots', 'not-found', 'not-absolute', 'failed']),
    message: z.string(),
  }),
]);
export type RevealResult = z.infer<typeof RevealResult>;

export interface RevealOptions {
  /** Absolute folders the path must be inside (after resolving links). */
  roots: readonly string[];
  /** Runs `open`; tests pass a stub so no window is ever raised. */
  run?: (args: string[]) => Promise<void>;
}

const openCommand = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('open', args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`open exited ${code}`))));
  });

const inside = (child: string, root: string) =>
  child === root || child.startsWith(root.endsWith(path.sep) ? root : root + path.sep);

export async function revealPath(target: string, options: RevealOptions): Promise<RevealResult> {
  const refuse = (
    reason: 'outside-roots' | 'not-found' | 'not-absolute' | 'failed',
    message: string,
  ) => ({
    kind: 'refused' as const,
    path: target,
    reason,
    message,
  });
  if (!path.isAbsolute(target)) return refuse('not-absolute', `${target} is not an absolute path.`);
  let real: string;
  let isFile: boolean;
  try {
    real = await fs.realpath(target);
    isFile = (await fs.stat(real)).isFile();
  } catch {
    return refuse('not-found', `${target} does not exist.`);
  }
  const roots = await Promise.all(
    options.roots.map((r) => fs.realpath(r).catch(() => path.resolve(r))),
  );
  if (!roots.some((root) => inside(real, root))) {
    return refuse('outside-roots', `${target} is outside the folders this app may show.`);
  }
  try {
    await (options.run ?? openCommand)(isFile ? ['-R', real] : [real]);
  } catch (error) {
    return refuse(
      'failed',
      `Finder could not open ${target}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return { kind: 'revealed', path: real, selected: isFile };
}
