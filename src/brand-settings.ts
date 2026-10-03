import path from 'node:path';
import { z } from 'zod';
import { atomicWrite, errorMessage, readJsonFile } from './fs-utils.js';
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

export const BrandSettings = z.object({
  schema: z.literal(1),
  brand: z.string().min(1),
  colour: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)'),
  /** The brand's transcription providers, over the suite default; absent → the suite default. */
  transcription: TranscriptionChoice.optional(),
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
