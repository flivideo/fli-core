import path from 'node:path';
import { z } from 'zod';
import { readJsonFile } from './fs-utils.js';
import { readFileResult } from './results.js';

export const BRAND_SETTINGS_FILE = 'fli.brand.json';

/** `v-<brand>/fli.brand.json` (D13, spec O6): per-brand display settings, travelling in the brand's repo. */
export const BrandSettings = z.object({
  schema: z.literal(1),
  brand: z.string().min(1),
  colour: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'colour must be a hex colour (#rgb or #rrggbb)'),
});
export type BrandSettings = z.infer<typeof BrandSettings>;

export const ReadBrandSettingsResult = readFileResult(BrandSettings);
export type ReadBrandSettingsResult = z.infer<typeof ReadBrandSettingsResult>;

/** Read `<brandRoot>/fli.brand.json`. Missing → `null` (no strip, never an error); malformed → `invalid`. */
export function readBrandSettings(brandRoot: string): Promise<ReadBrandSettingsResult> {
  return readJsonFile(path.join(brandRoot, BRAND_SETTINGS_FILE), BrandSettings);
}
