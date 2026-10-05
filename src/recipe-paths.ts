import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * The ingest rule (workstream B ruling, 2026-10-05): **a recipe may only reference paths inside its own project.**
 * Kybernesis lost its source to `~/Downloads/…-export.mp4` and every chapter spec points at `/Users/…/appydave-plugins`
 * or `/Users/…/kybernesis-company/public/…`, which cannot replay on another machine (R8). This finds the string values in
 * a recipe's JSON that are such paths. Pure over a parsed value; `recipePathWarningsIn` reads a project's recipes.
 *
 * A warning, not a refusal: the doctor says so, the caller decides. Only a string that IS a path (one token, no
 * spaces, shaped like a path) is reported, so prose such as `// TITLE CARD` or `//KYBERNESIS.AI` is not.
 */

export const RecipePathProblem = z.enum(['absolute', 'home', 'file-url', 'escapes-project']);
export type RecipePathProblem = z.infer<typeof RecipePathProblem>;

export const RecipePathWarning = z.object({
  /** Project-relative file, `/`-separated; empty for a bare value. */
  file: z.string(),
  /** RFC 6901 JSON pointer to the string (`/audio/arms/0/path`). */
  pointer: z.string(),
  value: z.string(),
  problem: RecipePathProblem,
  /** An absolute path that is inside this project is still absolute (it breaks on another machine); null when unknown. */
  insideProject: z.boolean().nullable(),
});
export type RecipePathWarning = z.infer<typeof RecipePathWarning>;

const WINDOWS_ABSOLUTE = /^(?:[A-Za-z]:[\\/]|\\\\)/;

function problemOf(value: string): RecipePathProblem | null {
  if (/\s/.test(value) || value.length < 2) return null;
  if (/^file:\/\//i.test(value)) return 'file-url';
  if (/^~[\\/]/.test(value)) return 'home';
  if (WINDOWS_ABSOLUTE.test(value)) return 'absolute';
  if (/^\/[^/]/.test(value)) return 'absolute';
  if (/^\.\.(?:[\\/]|$)/.test(value) || /^\.[\\/]\.\.(?:[\\/]|$)/.test(value)) {
    return path.posix.normalize(value.replaceAll('\\', '/')).startsWith('..')
      ? 'escapes-project'
      : null;
  }
  return null;
}

/** Every string in `value` that names an absolute or out-of-project path. `projectDir` only fills `insideProject`. */
export function recipePathWarnings(
  value: unknown,
  options: { projectDir?: string; file?: string } = {},
): RecipePathWarning[] {
  const found: RecipePathWarning[] = [];
  const root = options.projectDir === undefined ? null : path.resolve(options.projectDir);
  const visit = (v: unknown, pointer: string): void => {
    if (typeof v === 'string') {
      const problem = problemOf(v);
      if (problem === null) return;
      let insideProject: boolean | null = null;
      if (problem === 'escapes-project') insideProject = false;
      else if (problem === 'absolute' && root !== null) {
        const resolved = path.resolve(v);
        insideProject = resolved === root || resolved.startsWith(root + path.sep);
      }
      found.push({ file: options.file ?? '', pointer, value: v, problem, insideProject });
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => visit(item, `${pointer}/${i}`));
    } else if (typeof v === 'object' && v !== null) {
      for (const [k, item] of Object.entries(v)) {
        visit(item, `${pointer}/${k.replaceAll('~', '~0').replaceAll('/', '~1')}`);
      }
    }
  };
  visit(value, '');
  return found;
}

const SCANNED_ZONES = ['overlay', 'framing'] as const;
const SKIP = new Set(['node_modules', '.cache', 'out', '-renders', '-trash']);
const MAX_JSON_BYTES = 8 * 1024 ** 2;

async function jsonFiles(dir: string, rel: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map(async (e): Promise<string[]> => {
      if (e.isDirectory())
        return SKIP.has(e.name) ? [] : jsonFiles(path.join(dir, e.name), `${rel}/${e.name}`);
      return e.isFile() && e.name.endsWith('.json') ? [`${rel}/${e.name}`] : [];
    }),
  );
  return nested.flat().sort();
}

/**
 * The warnings in a project's recipes: every `.json` under `overlay/` and `framing/` (beats, framing, specs). A file that
 * is not JSON is skipped, and so is one over 8 MB; neither says "clean" or "dirty", only that it was not read.
 */
export async function recipePathWarningsIn(projectDir: string): Promise<RecipePathWarning[]> {
  const files = (
    await Promise.all(SCANNED_ZONES.map((zone) => jsonFiles(path.join(projectDir, zone), zone)))
  ).flat();
  const all: RecipePathWarning[] = [];
  for (const rel of files) {
    const full = path.join(projectDir, rel);
    const stat = await fs.stat(full).catch(() => null);
    if (stat === null || stat.size > MAX_JSON_BYTES) continue;
    let json: unknown;
    try {
      json = JSON.parse(await fs.readFile(full, 'utf8'));
    } catch {
      continue;
    }
    all.push(...recipePathWarnings(json, { projectDir, file: rel }));
  }
  return all;
}
