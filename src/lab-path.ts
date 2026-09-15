import path from 'node:path';
import { z } from 'zod';
import { defaultLabRoot, type MachineSettings } from './machine.js';
import { FliCoreError, parseOrThrow } from './results.js';

const PathSegment = z
  .string()
  .min(1)
  .refine(
    (value) => !/[/\\]/.test(value) && value !== '.' && value !== '..',
    'must be a single path segment',
  );

export const LabPathInput = z
  .object({
    /**
     * The resolved brand root (`resolveBrandRoot`). Preferred: the lab folder is its basename, so a brand whose root is
     * not `v-<key>` (Guy Monroe: key `guy-monroe`, root `v-guy`) lands in the right place (roadmap §1.2b).
     */
    brandRoot: z
      .string()
      .refine((value) => path.isAbsolute(value), 'must be an absolute path')
      .optional(),
    /**
     * Brand key (`appydave` → `v-appydave`) or brand folder name (`v-appydave`). Correct only when the brand root is
     * named `v-<key>`; ignored when `brandRoot` is given.
     */
    brand: PathSegment.optional(),
    /** The project folder name, `<code>-<project>` (`a01-xmen`). */
    project: PathSegment,
    app: PathSegment,
    subject: PathSegment.optional(),
  })
  .refine((input) => input.brandRoot !== undefined || input.brand !== undefined, {
    message: 'give brandRoot (preferred) or brand',
    path: ['brandRoot'],
  });
export type LabPathInput = z.infer<typeof LabPathInput>;

/**
 * Where an app keeps working files for a project outside the project (D5, roadmap §1.2b):
 * `<labRoot>/<brand folder>/<code>-<project>/<app>/[<subject>/]`, with a trailing separator. The brand folder is the
 * basename of `brandRoot` when given, else `v-<brand>`. `labRoot` comes from `machine` (see `readMachineSettings`),
 * default `~/fli/lab`. Never touches the disk. Throws `FliCoreError` when a part is not a single path segment.
 */
export function labPath(
  input: LabPathInput,
  machine?: Pick<MachineSettings, 'labRoot'> | null,
): string {
  const { brandRoot, brand, project, app, subject } = parseOrThrow(
    LabPathInput,
    input,
    'lab path input',
  );
  const root = machine?.labRoot ?? defaultLabRoot();
  const parts = [root, brandFolder(brandRoot, brand), project, app];
  if (subject !== undefined) parts.push(subject);
  return path.join(...parts) + path.sep;
}

function brandFolder(brandRoot: string | undefined, brand: string | undefined): string {
  if (brandRoot !== undefined) {
    const folder = path.basename(path.normalize(brandRoot));
    if (folder === '') {
      throw new FliCoreError(
        `Invalid lab path input: brandRoot "${brandRoot}" has no folder name`,
        ['brandRoot: must name a folder'],
      );
    }
    return folder;
  }
  const key = brand as string;
  return key.startsWith('v-') ? key : `v-${key}`;
}
