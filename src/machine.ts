import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { readJsonFile } from './fs-utils.js';
import type { InvalidFile } from './results.js';

const AbsolutePath = z
  .string()
  .refine((value) => path.isAbsolute(value), 'must be an absolute path');

/** `~/.fli/machine.json` (D5, roadmap §1.2b): this machine's settings. */
export const MachineSettings = z.object({
  schema: z.literal(1),
  /** Per-brand override of the brand root, keyed by `brands.json` key (A5). */
  brandRoots: z.record(z.string().min(1), AbsolutePath).optional(),
  /** Root of working files outside projects. Default `<home>/fli/lab`. */
  labRoot: AbsolutePath.optional(),
  /** Per-app checkout path, keyed by app name. */
  apps: z.record(z.string().min(1), AbsolutePath).optional(),
});
export type MachineSettings = z.infer<typeof MachineSettings>;

/** Machine settings with the defaults filled in. */
export type ResolvedMachineSettings = MachineSettings & { labRoot: string };

export interface MachineSettingsOptions {
  /** Home directory; default `os.homedir()`. The file is `<home>/.fli/machine.json`. */
  home?: string;
}

export type MachineSettingsResult =
  | { kind: 'valid'; path: string; source: 'file' | 'default'; value: ResolvedMachineSettings }
  | InvalidFile;

export function machineSettingsPath(options: MachineSettingsOptions = {}): string {
  return path.join(options.home ?? os.homedir(), '.fli', 'machine.json');
}

export function defaultLabRoot(home: string = os.homedir()): string {
  return path.join(home, 'fli', 'lab');
}

/** Read this machine's settings. Missing → defaults; malformed → an `invalid` result. Never throws. */
export async function readMachineSettings(
  options: MachineSettingsOptions = {},
): Promise<MachineSettingsResult> {
  const home = options.home ?? os.homedir();
  const file = machineSettingsPath({ home });
  const result = await readJsonFile(file, MachineSettings);
  if (result === null) {
    return {
      kind: 'valid',
      path: file,
      source: 'default',
      value: { schema: 1, labRoot: defaultLabRoot(home) },
    };
  }
  if (result.kind === 'invalid') return result;
  return {
    kind: 'valid',
    path: file,
    source: 'file',
    value: { ...result.value, labRoot: result.value.labRoot ?? defaultLabRoot(home) },
  };
}
