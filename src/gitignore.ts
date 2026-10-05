import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { readBrandSettings } from './brand-settings.js';
import { atomicWrite, errorCode, errorMessage } from './fs-utils.js';
import type { GitignoreOverlayRule } from './gitignore-rules.js';
import {
  GitignoreCheckResult,
  GitignoreRenderResult,
  checkGitignore,
  renderGitignore,
} from './gitignore-rules.js';

const run = promisify(execFile);

/** `gitignore.render`'s file half: reads `<brandRoot>/.gitignore` and `fli.brand.json`, writes the one, never commits. */

export const GITIGNORE_FILE = '.gitignore';

export const TrackedIgnored = z.object({
  /** How many committed files the rendered rules now ignore. Ignoring a path does not untrack it. */
  count: z.number().int(),
  /** The first 100, `/`-separated, exactly as git names them (`core.quotepath=false`: no octal escapes). */
  files: z.array(z.string()),
});
export type TrackedIgnored = z.infer<typeof TrackedIgnored>;

export interface GitignoreOptions {
  /** Check only: write nothing. */
  check?: boolean;
  /** The brand key; default `fli.brand.json`'s `brand`, else the folder name without `v-`. */
  brand?: string;
  /** Override the overlay (a scratch run); default `fli.brand.json`'s `gitignore`. */
  overlay?: readonly GitignoreOverlayRule[];
  /** List tracked files the rules ignore (needs `git`; default `true` for a check). `null` in the result when git cannot say. */
  tracked?: boolean;
}

export const GitignoreRefusal = z.object({
  kind: z.literal('refused'),
  reason: z.enum(['no-brand-root', 'brand-settings-invalid', 'damaged-markers', 'io-error']),
  path: z.string(),
  message: z.string(),
});

export const GitignoreRenderedFile = z.object({
  kind: z.literal('rendered'),
  path: z.string(),
  /** `true` when the file on disk was changed (never in a check). */
  wrote: z.boolean(),
  render: GitignoreRenderResult,
  trackedIgnored: TrackedIgnored.nullable(),
});
export const GitignoreCheckedFile = z.object({
  kind: z.literal('checked'),
  path: z.string(),
  check: GitignoreCheckResult,
  trackedIgnored: TrackedIgnored.nullable(),
});
export const GitignoreResult = z.union([
  GitignoreRenderedFile,
  GitignoreCheckedFile,
  GitignoreRefusal,
]);
export type GitignoreResult = z.infer<typeof GitignoreResult>;

/**
 * Tracked files that `rulesText` (as a `.gitignore`) would ignore: `git ls-files -ci -X <rules>`, NUL-separated and with
 * `core.quotepath=false`, so a non-ASCII path comes back as itself. `null` when `brandRoot` is not a git work tree or
 * `git` is not there — "unknown", never "none".
 */
export async function trackedIgnored(
  brandRoot: string,
  rulesText: string,
): Promise<TrackedIgnored | null> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fli-gitignore-'));
  const rules = path.join(dir, 'rules');
  try {
    await fs.writeFile(rules, rulesText);
    const { stdout } = await run(
      'git',
      ['-C', brandRoot, '-c', 'core.quotepath=false', 'ls-files', '-z', '-c', '-i', '-X', rules],
      { maxBuffer: 256 * 1024 ** 2 },
    );
    const files = stdout.split('\0').filter((f) => f !== '');
    return { count: files.length, files: files.slice(0, 100) };
  } catch {
    return null;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/**
 * `gitignore.render` for one brand root: the generated block in `<brandRoot>/.gitignore`. Rules are the base in fli-core
 * plus the overlay in the brand's `fli.brand.json` (`gitignore`), so they travel by git and replay on another Mac (R8).
 *   - `check: true` writes nothing and says `ok` / `drift` / `no-block` / `broken-markers`, plus the committed files the
 *     rules now ignore (information, not a failure).
 *   - otherwise writes atomically, only when the text changes. Damaged markers are refused with nothing written.
 * Never commits and never throws.
 */
export async function gitignoreRender(
  brandRoot: string,
  options: GitignoreOptions = {},
): Promise<GitignoreResult> {
  const file = path.join(brandRoot, GITIGNORE_FILE);
  const refuse = (
    reason: z.infer<typeof GitignoreRefusal>['reason'],
    message: string,
  ): GitignoreResult => ({
    kind: 'refused',
    reason,
    path: file,
    message,
  });
  try {
    if (!(await fs.stat(brandRoot)).isDirectory()) throw new Error('not a directory');
  } catch {
    return refuse('no-brand-root', `${brandRoot} is not a folder.`);
  }
  const settings = await readBrandSettings(brandRoot);
  if (settings?.kind === 'invalid') {
    return refuse(
      'brand-settings-invalid',
      `${settings.path} is not usable (${settings.reason}: ${settings.message}).`,
    );
  }
  const brand =
    options.brand ?? settings?.value.brand ?? path.basename(brandRoot).replace(/^v-/, '');
  const overlay = options.overlay ?? settings?.value.gitignore ?? [];

  let existing: string | null;
  try {
    existing = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (errorCode(error) !== 'ENOENT') return refuse('io-error', errorMessage(error));
    existing = null;
  }

  const wantTracked = options.tracked ?? options.check === true;
  if (options.check) {
    const check = checkGitignore(existing, { brand, overlay });
    const rules = renderGitignore(existing, { brand, overlay });
    const tracked =
      wantTracked && rules.status !== 'refused'
        ? await trackedIgnored(brandRoot, rules.content)
        : null;
    return { kind: 'checked', path: file, check, trackedIgnored: tracked };
  }

  const render = renderGitignore(existing, { brand, overlay });
  if (render.status === 'refused')
    return refuse('damaged-markers', render.message ?? 'damaged markers');
  let wrote = false;
  if (render.status !== 'unchanged') {
    try {
      await atomicWrite(file, render.content);
      wrote = true;
    } catch (error) {
      return refuse('io-error', errorMessage(error));
    }
  }
  const tracked = wantTracked ? await trackedIgnored(brandRoot, render.content) : null;
  return { kind: 'rendered', path: file, wrote, render, trackedIgnored: tracked };
}
