import path from 'node:path';
import { z } from 'zod';
import { VideoFolderName } from './video-file.js';

/**
 * The open contract (open-contract §3, §5; D11): every app accepts the same context — brand, project, optional video —
 * whichever door set it.
 */

/** The resolved context an app is pointed at. */
export const OpenContext = z.object({
  /** `brands.json` key. */
  brand: z.string().min(1),
  /** Absolute path of the project folder on this machine (D4). */
  projectDir: z
    .string()
    .min(1)
    .refine((value) => path.isAbsolute(value), 'projectDir must be an absolute path'),
  /** `fli.studio.json` `id`. */
  projectId: z.uuid(),
  /** Video folder name, `<NN>-<name>`. */
  video: VideoFolderName.optional(),
});
export type OpenContext = z.infer<typeof OpenContext>;

/** What door 2 carries before resolution: names, not paths or ids. */
export const OpenArgs = z.object({
  brand: z.string().min(1),
  /** Project folder name (or anything `resolveProject` accepts). */
  project: z.string().min(1),
  /** Video folder name, `<NN>-<name>`. */
  video: VideoFolderName.optional(),
});
export type OpenArgs = z.infer<typeof OpenArgs>;

export const OpenArgName = z.enum(['brand', 'project', 'video']);
export type OpenArgName = z.infer<typeof OpenArgName>;

/** Door-2 values exactly as given (argv or env): present and non-empty, not yet validated or resolved. */
export const RawOpenArgs = z.object({
  brand: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  video: z.string().min(1).optional(),
});
export type RawOpenArgs = z.infer<typeof RawOpenArgs>;

export const OPEN_ENV = {
  brand: 'FLIVIDEO_BRAND',
  project: 'FLIVIDEO_PROJECT',
  video: 'FLIVIDEO_VIDEO',
} as const satisfies Record<OpenArgName, string>;

export interface ParseOpenArgsOptions {
  /** Report `video` as missing when absent. Default `false`. */
  requireVideo?: boolean;
}

export const ParsedOpenArgs = z.object({
  context: RawOpenArgs,
  /** Each missing argument, in `brand`, `project`, `video` order — each becomes a picker (R25). */
  missing: z.array(OpenArgName),
});
export type ParsedOpenArgs = z.infer<typeof ParsedOpenArgs>;

const NAMES = OpenArgName.options;

/**
 * Parse `--brand <k>`, `--project <folder>`, `--video <NN-name>` (and `--name=value`) from `argv`, falling back to
 * `FLIVIDEO_BRAND`, `FLIVIDEO_PROJECT`, `FLIVIDEO_VIDEO` in `env`. Argv wins over env; a repeated flag keeps its last
 * value; an empty value counts as missing; parsing stops at `--`. Unknown arguments are ignored. Pure: no I/O.
 */
export function parseOpenArgs(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = {},
  options: ParseOpenArgsOptions = {},
): ParsedOpenArgs {
  const fromArgv: Partial<Record<OpenArgName, string>> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === '--') break;
    const match = /^--(brand|project|video)(?:=(.*))?$/.exec(arg);
    if (!match) continue;
    const name = match[1] as OpenArgName;
    if (match[2] !== undefined) {
      fromArgv[name] = match[2];
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      fromArgv[name] = next;
      i++;
    } else {
      fromArgv[name] = '';
    }
  }

  const context: RawOpenArgs = {};
  const missing: OpenArgName[] = [];
  for (const name of NAMES) {
    const argValue = fromArgv[name];
    const value = argValue !== undefined && argValue !== '' ? argValue : env[OPEN_ENV[name]];
    if (value !== undefined && value !== '') {
      context[name] = value;
    } else if (name !== 'video' || options.requireVideo === true) {
      missing.push(name);
    }
  }
  return { context, missing };
}
