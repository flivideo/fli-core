import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

/**
 * Brand settings folders (contract: docs/brand-settings-folders.md).
 *
 * A top-level folder in a brand repo whose name starts with `-` is brand SETTINGS: committed with the brand, read by
 * the apps and skills that own it, and never a project. The estate scan skips them (`listProjects`).
 *
 * Inside a project, a `-` folder means something else (`-renders/`, `-trash/`, `-chapters/`: see `classify.ts`).
 */

/** Is this top-level folder name in a brand repo a brand settings folder (never a project)? */
export function isBrandSettingsFolder(name: string): boolean {
  return name.startsWith('-');
}

export const BrandSettingsFolder = z.object({
  /** The folder name, with its leading `-`. */
  folder: z.string().startsWith('-'),
  /** Who writes and reads it. */
  owner: z.string().min(1),
  /** What it holds. */
  contents: z.string().min(1),
});
export type BrandSettingsFolder = z.infer<typeof BrandSettingsFolder>;

/** The brand settings folders known today. A folder not listed here is still settings (the rule is the dash). */
export const BRAND_SETTINGS_FOLDERS: readonly BrandSettingsFolder[] = [
  {
    folder: '-theme',
    owner: 'FliStudio (white labelling)',
    contents:
      "the brand's look: fli.theme.json beside it names fonts, logo and studio mark files kept here",
  },
  {
    folder: '-storypilot',
    owner: 'Story Pilot (FliStudio module)',
    contents: 'settings, templates, guides, narrators and kinds for the brand',
  },
  {
    folder: '-reference',
    owner: 'the brand (any app or skill)',
    contents: 'reference material for the brand that is not a project',
  },
  {
    folder: '-thumbnails',
    owner: 'thumbnail skills and teams; FliStudio reads it, optionally',
    contents: "the brand's canonical thumbnail and title rules: brand-pack.md or brand.yaml",
  },
];

/** The folder that holds a brand's thumbnail rules. */
export const THUMBNAILS_SETTINGS_FOLDER = '-thumbnails';
/** File names a brand's thumbnail rules may use, in the order they are tried. */
export const BRAND_PACK_FILES = ['brand-pack.md', 'brand.yaml'] as const;
/** The user config path a creator without a FliVideo brand repo points at their own rules (relative to home). */
export const BRAND_PACK_USER_CONFIG = path.join('.config', 'creator-skills', 'brand.yaml');

export const BrandPackCandidate = z.object({
  path: z.string(),
  from: z.enum(['brand-repo', 'user-config']),
});
export type BrandPackCandidate = z.infer<typeof BrandPackCandidate>;

/**
 * Where to look for a brand's thumbnail rules, in order. Pure (no file access): the reader takes the first that exists
 * and falls back to its own defaults when none does. No FliStudio is needed: a skill with only a home folder gets the
 * user config path; one that knows the brand repo gets the repo's file first.
 */
export function brandPackCandidates(
  opts: { brandRoot?: string | null; home?: string } = {},
): BrandPackCandidate[] {
  const out: BrandPackCandidate[] = [];
  if (opts.brandRoot) {
    for (const f of BRAND_PACK_FILES)
      out.push({
        path: path.join(opts.brandRoot, THUMBNAILS_SETTINGS_FOLDER, f),
        from: 'brand-repo',
      });
  }
  out.push({
    path: path.join(opts.home ?? os.homedir(), BRAND_PACK_USER_CONFIG),
    from: 'user-config',
  });
  return out;
}
