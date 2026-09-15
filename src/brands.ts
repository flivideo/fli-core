import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { readJsonFile } from './fs-utils.js';
import type { MachineSettings } from './machine.js';
import type { ReadFileResult } from './results.js';

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

/** `~/.config/appydave/brands.json`, reduced to `Brand[]` in registry order. */
export const BrandsFile = z
  .looseObject({ brands: z.record(z.string().min(1), RegistryEntry) })
  .transform(({ brands }): Brand[] =>
    Object.entries(brands).map(([key, entry]) => {
      const brand: Brand = { key, name: entry.name };
      if (entry.shortcut !== undefined) brand.shortcut = entry.shortcut;
      if (entry.type !== undefined) brand.type = entry.type;
      if (entry.locations?.video_projects !== undefined)
        brand.videoProjects = entry.locations.video_projects;
      return brand;
    }),
  );

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
 * Missing → `null`; malformed → `invalid`. Never throws.
 */
export function readBrands(options: ReadBrandsOptions = {}): Promise<ReadFileResult<Brand[]>> {
  return readJsonFile(brandsFilePath(options), BrandsFile);
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
