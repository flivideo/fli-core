import path from 'node:path';
import { z } from 'zod';
import { atomicWrite, errorMessage, readJsonFile } from './fs-utils.js';
import { GitignoreOverlayRule } from './gitignore-rules.js';
import { issuesOf, readFileResult } from './results.js';

export const BRAND_SETTINGS_FILE = 'fli.brand.json';

/** `v-<brand>/fli.brand.json` (D13, spec O6): per-brand display settings, travelling in the brand's repo. */
/**
 * A level's transcription providers (FliTools reads them: global `flitools.json` → brand `fli.brand.json` → project
 * `fli.studio.json`). Plain names, not an enum: FliTools owns the provider list, and a level states only what it overrides.
 */
export const TranscriptionChoice = z.object({
  /** Pass 1 (fast): `auto`, `groq-whisper`, `mlx-whisper`, … */
  fast: z.string().min(1).optional(),
  /** Pass 2 (edit-grade): `crisperwhisper`, `elevenlabs`, `off`, … */
  editGrade: z.string().min(1).optional(),
});
export type TranscriptionChoice = z.infer<typeof TranscriptionChoice>;

/**
 * The brand's publishing settings, authored by the brand (CTAs, affiliates, legal…). Moved verbatim from FliHub's
 * `server/brand-config.json` (2026-10-06), so the shape is that file's and FliHub's mapper reads it unchanged. Loose:
 * fields this schema does not name survive a read-modify-write. `playlists` is the legacy `camelKey → playlistId` map,
 * kept for provenance; the brand's playlist choices live in `youtube`.
 */
export const BrandPublishSettings = z.looseObject({
  brand: z.looseObject({}).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  ctas: z.record(z.string(), z.looseObject({ label: z.string(), url: z.string() })).optional(),
  affiliates: z
    .array(z.looseObject({ name: z.string(), url: z.string(), active: z.boolean().optional() }))
    .optional(),
  playlists: z.record(z.string(), z.string()).optional(),
  descriptionTemplate: z.looseObject({}).optional(),
  _meta: z.looseObject({}).optional(),
});
export type BrandPublishSettings = z.infer<typeof BrandPublishSettings>;

/**
 * The brand's YouTube choices, made by a person. Playlist **ids**; titles come from the YouTube mirror. Everything YouTube
 * itself knows (which playlists exist, their members) is mirrored, never written here.
 */
export const BrandYouTubeSettings = z.object({
  /** The playlists this brand uses: offered in Launch, shown first on the brand's YouTube page. */
  activePlaylists: z.array(z.string().min(1)).default([]),
  /** The brand's usual picks, pre-ticked for a new video. */
  defaultPlaylists: z.array(z.string().min(1)).default([]),
});
export type BrandYouTubeSettings = z.infer<typeof BrandYouTubeSettings>;

/** The YouTube Studio defaults a new video starts with (category, audience, language). Each absent → the app's own. */
export const BrandStudioDefaults = z.object({
  category: z.string().min(1).optional(),
  audience: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
});
export type BrandStudioDefaults = z.infer<typeof BrandStudioDefaults>;

export const BrandSettings = z.object({
  schema: z.literal(1),
  brand: z.string().min(1),
  colour: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)'),
  /** The brand's transcription providers, over the suite default; absent → the suite default. */
  transcription: TranscriptionChoice.optional(),
  /**
   * The brand's own `.gitignore` rules, on top of the base `gitignore.render` generates (`broll/` clips, a recipe's
   * staging folders…). Optional, so an older reader (FliTools reads this file too) is unaffected. Travels in the repo.
   */
  gitignore: z.array(GitignoreOverlayRule).optional(),
  /** Publishing settings (CTAs, affiliates, legal…); optional, so older readers are unaffected. */
  publish: BrandPublishSettings.optional(),
  /** The brand's YouTube playlist choices. */
  youtube: BrandYouTubeSettings.optional(),
  /** YouTube Studio defaults for a new video. */
  studioDefaults: BrandStudioDefaults.optional(),
});
export type BrandSettings = z.infer<typeof BrandSettings>;

export const ReadBrandSettingsResult = readFileResult(BrandSettings);
export type ReadBrandSettingsResult = z.infer<typeof ReadBrandSettingsResult>;

/** Read `<brandRoot>/fli.brand.json`. Missing → `null` (no strip, never an error); malformed → `invalid`. */
export function readBrandSettings(brandRoot: string): Promise<ReadBrandSettingsResult> {
  return readJsonFile(path.join(brandRoot, BRAND_SETTINGS_FILE), BrandSettings);
}

export const WriteBrandSettingsResult = z.union([
  z.object({ kind: z.literal('written'), path: z.string() }),
  z.object({
    kind: z.literal('refused'),
    reason: z.enum(['invalid-input', 'io-error']),
    path: z.string(),
    message: z.string(),
  }),
]);
export type WriteBrandSettingsResult = z.infer<typeof WriteBrandSettingsResult>;

/** Write `<brandRoot>/fli.brand.json` whole and atomically (the caller read it first and changed what it meant to). */
export async function writeBrandSettings(
  brandRoot: string,
  settings: BrandSettings,
): Promise<WriteBrandSettingsResult> {
  const file = path.join(brandRoot, BRAND_SETTINGS_FILE);
  const parsed = BrandSettings.safeParse(settings);
  if (!parsed.success) {
    return {
      kind: 'refused',
      reason: 'invalid-input',
      path: file,
      message: issuesOf(parsed.error).join('; '),
    };
  }
  try {
    await atomicWrite(file, `${JSON.stringify(parsed.data, null, 2)}\n`);
    return { kind: 'written', path: file };
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }
}
