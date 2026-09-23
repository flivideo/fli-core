import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defaultLabRoot, type MachineSettings } from './machine.js';
import { parseProjectFolder } from './project-folder.js';
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

/** Where a project's lab is after `resolveLabPath`: the path, and what (if anything) was moved into place. */
export const ResolvedLabPath = z.object({
  /** Same as `labPath(input)`. */
  path: z.string(),
  /** The old project lab folder (`<code>-<old name>`) renamed into place, or null. */
  migratedFrom: z.string().nullable(),
  /** Two or more `<code>-*` labs and none under the current name: nothing was moved; they are listed. */
  ambiguous: z.array(z.string()),
});
export type ResolvedLabPath = z.infer<typeof ResolvedLabPath>;

/**
 * `labPath`, keyed on the project CODE (FC-40, d04 UAT 2026-09-23). The folder name is display: a rename (R32 — the code
 * never changes) must not strand an app's lab and undo history. When `<code>-<project>/` does not exist but exactly one
 * other `<code>-*` folder does in the brand's lab, that folder is renamed to the current name — the whole project lab,
 * every app's part of it — and reported in `migratedFrom`. Two or more candidates are never guessed between. Creates
 * nothing else. Safe to race: a lost rename finds the winner's folder in place.
 */
export async function resolveLabPath(
  input: LabPathInput,
  machine?: Pick<MachineSettings, 'labRoot'> | null,
): Promise<ResolvedLabPath> {
  const target = labPath(input, machine);
  const parsed = parseOrThrow(LabPathInput, input, 'lab path input');
  const brandLab = path.join(
    machine?.labRoot ?? defaultLabRoot(),
    brandFolder(parsed.brandRoot, parsed.brand),
  );
  const current = path.join(brandLab, parsed.project);
  const found: ResolvedLabPath = { path: target, migratedFrom: null, ambiguous: [] };
  const exists = (dir: string) =>
    fs.stat(dir).then(
      (s) => s.isDirectory(),
      () => false,
    );
  if (await exists(current)) return found;
  const project = parseProjectFolder(parsed.project);
  if (project === null) return found;
  const { code } = project;
  const entries = await fs.readdir(brandLab, { withFileTypes: true }).catch(() => []);
  const olds = entries
    .filter((e) => e.isDirectory() && e.name !== parsed.project)
    .filter((e) => {
      return parseProjectFolder(e.name)?.code === code;
    })
    .map((e) => e.name)
    .sort();
  if (olds.length === 0) return found;
  if (olds.length > 1) return { ...found, ambiguous: olds.map((o) => path.join(brandLab, o)) };
  const old = path.join(brandLab, olds[0] as string);
  try {
    await fs.rename(old, current);
  } catch (error) {
    if (await exists(current)) return found;
    throw error;
  }
  return { ...found, migratedFrom: old };
}
