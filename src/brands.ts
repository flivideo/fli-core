import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { readJsonFile } from './fs-utils.js';
import type { MachineSettings } from './machine.js';
import { InvalidFile, issuesOf } from './results.js';

/** A brand from the registry (R6, R29). Only the fields the Fli apps need; the rest of the entry is ignored. */
export const Brand = z.object({
  /** The `brands.json` key: the join key across registries. */
  key: z.string().min(1),
  name: z.string().min(1),
  shortcut: z.string().optional(),
  type: z.string().optional(),
  /** `locations.video_projects` exactly as the registry holds it (before the A5 rewrite). */
  videoProjects: z.string().optional(),
});
export type Brand = z.infer<typeof Brand>;

const RegistryEntry = z.looseObject({
  name: z.string().min(1),
  shortcut: z.string().optional(),
  type: z.string().optional(),
  locations: z.looseObject({ video_projects: z.string().min(1).optional() }).optional(),
});

/** The top level of `~/.config/appydave/brands.json`. Entries are checked one by one (see `readBrands`). */
export const BrandsFile = z.looseObject({ brands: z.record(z.string(), z.unknown()) });
export type BrandsFile = z.infer<typeof BrandsFile>;

/** A registry entry `readBrands` could not use, and why. */
export const SkippedBrand = z.object({ key: z.string(), issues: z.array(z.string()) });
export type SkippedBrand = z.infer<typeof SkippedBrand>;

export const BrandsRead = z.object({
  kind: z.literal('valid'),
  path: z.string(),
  /** Usable brands, in registry order. */
  value: z.array(Brand),
  /** Entries left out because they do not match the registry shape. */
  skipped: z.array(SkippedBrand),
});
export type BrandsRead = z.infer<typeof BrandsRead>;

export const ReadBrandsResult = z.union([BrandsRead, InvalidFile, z.null()]);
export type ReadBrandsResult = z.infer<typeof ReadBrandsResult>;

export interface ReadBrandsOptions {
  /** Path to `brands.json`; default `<home>/.config/appydave/brands.json`. */
  path?: string;
  /** Home directory; default `os.homedir()`. */
  home?: string;
}

export function brandsFilePath(options: ReadBrandsOptions = {}): string {
  return (
    options.path ?? path.join(options.home ?? os.homedir(), '.config', 'appydave', 'brands.json')
  );
}

/**
 * Read the brand registry. Registry only: unregistered `v-*` folders are not merged in (open contract §2).
 * Missing → `null`; not JSON or no `brands` object → `invalid`. One bad entry does not sink the rest: it is left out
 * and listed in `skipped` (F8). Never throws.
 */
export async function readBrands(options: ReadBrandsOptions = {}): Promise<ReadBrandsResult> {
  const file = await readJsonFile(brandsFilePath(options), BrandsFile);
  if (file === null || file.kind === 'invalid') return file;

  const value: Brand[] = [];
  const skipped: SkippedBrand[] = [];
  for (const [key, raw] of Object.entries(file.value.brands)) {
    const entry = RegistryEntry.safeParse(raw);
    if (key === '' || !entry.success) {
      skipped.push({
        key,
        issues: entry.success ? ['key: must not be empty'] : issuesOf(entry.error),
      });
      continue;
    }
    const brand: Brand = { key, name: entry.data.name };
    if (entry.data.shortcut !== undefined) brand.shortcut = entry.data.shortcut;
    if (entry.data.type !== undefined) brand.type = entry.data.type;
    if (entry.data.locations?.video_projects !== undefined) {
      brand.videoProjects = entry.data.locations.video_projects;
    }
    value.push(brand);
  }
  return { kind: 'valid', path: file.path, value, skipped };
}

export interface ResolveBrandRootOptions {
  /** Home directory used for the A5 rewrite; default `os.homedir()`. */
  home?: string;
}

/**
 * This machine's root for a brand (A5): the machine override when `machine.brandRoots[brand.key]` is set; otherwise
 * `locations.video_projects` with any `/Users/<anyone>` prefix (not `/Users/Shared`) rewritten to the current home. `null` when the brand
 * has neither.
 */
export function resolveBrandRoot(
  brand: Brand,
  machine?: Pick<MachineSettings, 'brandRoots'> | null,
  options: ResolveBrandRootOptions = {},
): string | null {
  const override = machine?.brandRoots?.[brand.key];
  if (override !== undefined) return path.normalize(override);
  if (brand.videoProjects === undefined) return null;

  const home = options.home ?? os.homedir();
  const match = /^\/Users\/(?!Shared(?:\/|$))[^/]+(?=\/|$)(.*)$/.exec(brand.videoProjects);
  if (match) return path.normalize(path.join(home, match[1] as string));
  return path.normalize(brand.videoProjects);
}

/**
 * The brand's folder name on this machine: the basename of `resolveBrandRoot` (`guy-monroe` → `v-guy`), or `null` when
 * the brand has no root. Use it wherever a path is "addressed like the project" (roadmap §1.2b).
 */
export function brandFolderName(
  brand: Brand,
  machine?: Pick<MachineSettings, 'brandRoots'> | null,
  options: ResolveBrandRootOptions = {},
): string | null {
  const root = resolveBrandRoot(brand, machine, options);
  if (root === null) return null;
  return path.basename(root) || null;
}
