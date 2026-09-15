import path from 'node:path';
import { z } from 'zod';
import { defaultLabRoot, type MachineSettings } from './machine.js';
import { parseOrThrow } from './results.js';

const PathSegment = z
  .string()
  .min(1)
  .refine(
    (value) => !/[/\\]/.test(value) && value !== '.' && value !== '..',
    'must be a single path segment',
  );

export const LabPathInput = z.object({
  /** Brand key (`appydave`) or brand folder name (`v-appydave`). */
  brand: PathSegment,
  /** The project folder name, `<code>-<project>` (`a01-xmen`). */
  project: PathSegment,
  app: PathSegment,
  subject: PathSegment.optional(),
});
export type LabPathInput = z.infer<typeof LabPathInput>;

/**
 * Where an app keeps working files for a project outside the project (D5, roadmap §1.2b):
 * `<labRoot>/v-<brand>/<code>-<project>/<app>/[<subject>/]`, with a trailing separator.
 * `labRoot` comes from `machine` (see `readMachineSettings`), default `~/fli/lab`. Never touches the disk.
 * Throws `FliCoreError` when a part is not a single path segment.
 */
export function labPath(
  input: LabPathInput,
  machine?: Pick<MachineSettings, 'labRoot'> | null,
): string {
  const { brand, project, app, subject } = parseOrThrow(LabPathInput, input, 'lab path input');
  const root = machine?.labRoot ?? defaultLabRoot();
  const brandFolder = brand.startsWith('v-') ? brand : `v-${brand}`;
  const parts = [root, brandFolder, project, app];
  if (subject !== undefined) parts.push(subject);
  return path.join(...parts) + path.sep;
}
