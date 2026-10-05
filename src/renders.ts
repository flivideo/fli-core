import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { RENDERS_FOLDER } from './classify.js';
import { errorMessage } from './fs-utils.js';
import { parseOrThrow } from './results.js';

/**
 * `<project>/-renders/<tool>/` (R2, David 2026-10-05: "they only need to live around long enough for the video to get
 * published"). Renders are a cache: inside the project, ignored by git like `-trash/`, cleared whenever a person likes.
 * This replaces `~/fli/lab` (`labPath`, now deprecated): nothing is outside the project, so nothing is keyed by a
 * machine path and a clone of the project on another Mac finds the same place.
 */

const PathSegment = z
  .string()
  .min(1)
  .refine(
    (value) => !/[/\\]/.test(value) && value !== '.' && value !== '..',
    'must be a single path segment',
  );

export const RendersPathInput = z.object({
  /** The absolute project folder (`<brand root>/<code>-<name>`). */
  projectDir: z.string().refine((value) => path.isAbsolute(value), 'must be an absolute path'),
  /** The tool that renders: `remotion`, `hyperframes`, `ffmpeg`, `flicut`… */
  tool: PathSegment,
  subject: PathSegment.optional(),
});
export type RendersPathInput = z.infer<typeof RendersPathInput>;

/**
 * `<projectDir>/-renders/<tool>/[<subject>/]`, with a trailing separator. Never touches the disk. Throws
 * `FliCoreError` when a part is not a single path segment.
 */
export function rendersPath(input: RendersPathInput): string {
  const { projectDir, tool, subject } = parseOrThrow(RendersPathInput, input, 'renders path input');
  const parts = [projectDir, RENDERS_FOLDER, tool];
  if (subject !== undefined) parts.push(subject);
  return path.join(...parts) + path.sep;
}

/**
 * The same size rule as FliStudio's `TRASH_HEAVY` (David 2026-10-05: "why is 216 MB a different colour to 160 MB?"):
 * hidden under 1 MB, grey up to 500 MB, amber above. By size alone. FliStudio's trash and renders read one rule.
 */
export const FOLDER_HEAVY = {
  showBytes: 1024 ** 2,
  heavyBytes: 500 * 1024 ** 2,
} as const;

export const RendersTool = z.object({
  tool: z.string(),
  files: z.number().int(),
  bytes: z.number().int(),
});
export type RendersTool = z.infer<typeof RendersTool>;

export const RendersTally = z.object({
  /** Is `-renders/` a real folder here (never a link elsewhere)? */
  present: z.boolean(),
  files: z.number().int(),
  bytes: z.number().int(),
  /** Over `FOLDER_HEAVY.heavyBytes`: amber. */
  heavy: z.boolean(),
  /** One row per tool folder, biggest first. Loose files directly in `-renders/` count under the tool `""`. */
  tools: z.array(RendersTool),
});
export type RendersTally = z.infer<typeof RendersTally>;

const EMPTY: RendersTally = { present: false, files: 0, bytes: 0, heavy: false, tools: [] };

async function isRealFolder(dir: string): Promise<boolean> {
  return fs.lstat(dir).then(
    (s) => s.isDirectory(),
    () => false,
  );
}

/** Files and bytes under `dir`; a link counts as itself and is never followed. Unreadable folders count as empty. */
async function tally(dir: string): Promise<{ files: number; bytes: number }> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const parts = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return tally(full);
      const stat = await fs.lstat(full).catch(() => null);
      return { files: 1, bytes: stat?.size ?? 0 };
    }),
  );
  return parts.reduce((a, b) => ({ files: a.files + b.files, bytes: a.bytes + b.bytes }), {
    files: 0,
    bytes: 0,
  });
}

/** What `<projectDir>/-renders/` holds, by tool. Absent, not a real folder (a link is not followed) or unreadable → empty. */
export async function rendersOf(projectDir: string): Promise<RendersTally> {
  const root = path.join(projectDir, RENDERS_FOLDER);
  if (!(await isRealFolder(root))) return EMPTY;
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const rows = await Promise.all(
    entries.map(async (entry): Promise<RendersTool> => {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) return { tool: entry.name, ...(await tally(full)) };
      const stat = await fs.lstat(full).catch(() => null);
      return { tool: entry.name, files: 1, bytes: stat?.size ?? 0 };
    }),
  );
  const tools = rows.sort((a, b) => b.bytes - a.bytes || a.tool.localeCompare(b.tool));
  const bytes = tools.reduce((n, t) => n + t.bytes, 0);
  return {
    present: true,
    files: tools.reduce((n, t) => n + t.files, 0),
    bytes,
    heavy: bytes > FOLDER_HEAVY.heavyBytes,
    tools,
  };
}

export const ClearRendersResult = z.union([
  z.object({
    kind: z.literal('cleared'),
    /** Top-level entries of `-renders/` removed (a tool folder, or a loose file). */
    removed: z.array(z.string()),
    files: z.number().int(),
    bytes: z.number().int(),
  }),
  z.object({
    kind: z.literal('refused'),
    reason: z.enum(['invalid-input', 'not-a-folder', 'io-error']),
    message: z.string(),
  }),
]);
export type ClearRendersResult = z.infer<typeof ClearRendersResult>;

/**
 * Clear `-renders/` (all tools) or one tool's folder, like emptying trash. `-renders/` itself stays. A link inside is
 * unlinked, never followed; a `-renders` that is itself a link is refused, not followed. Nothing outside `-renders/` is
 * touched. Nothing there → `cleared` with nothing removed.
 */
export async function clearRenders(
  projectDir: string,
  options: { tool?: string } = {},
): Promise<ClearRendersResult> {
  if (!path.isAbsolute(projectDir)) {
    return { kind: 'refused', reason: 'invalid-input', message: 'projectDir must be absolute.' };
  }
  const tool = options.tool;
  if (tool !== undefined && !PathSegment.safeParse(tool).success) {
    return {
      kind: 'refused',
      reason: 'invalid-input',
      message: `"${tool}" is not a single tool folder name.`,
    };
  }
  const root = path.join(projectDir, RENDERS_FOLDER);
  const stat = await fs.lstat(root).catch(() => null);
  if (stat === null) return { kind: 'cleared', removed: [], files: 0, bytes: 0 };
  if (!stat.isDirectory()) {
    return {
      kind: 'refused',
      reason: 'not-a-folder',
      message: `${RENDERS_FOLDER} is not a real folder here; it is not touched.`,
    };
  }
  const entries = (await fs.readdir(root)).filter((name) => tool === undefined || name === tool);
  const removed: string[] = [];
  let files = 0;
  let bytes = 0;
  try {
    for (const name of entries.sort()) {
      const full = path.join(root, name);
      const info = await fs.lstat(full);
      const sizes = info.isDirectory() ? await tally(full) : { files: 1, bytes: info.size };
      await fs.rm(full, { recursive: true, force: true });
      removed.push(name);
      files += sizes.files;
      bytes += sizes.bytes;
    }
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', message: errorMessage(error) };
  }
  return { kind: 'cleared', removed, files, bytes };
}
