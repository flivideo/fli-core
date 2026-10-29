import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { atomicWrite, errorCode, errorMessage, readJsonFile, takeLock } from './fs-utils.js';
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

/**
 * The YouTube Studio defaults a new video starts with (category, audience, language, the AI-use and paid-promotion
 * disclosures). Category, audience and language absent → the app's own; a disclosure absent → undecided.
 */
export const BrandStudioDefaults = z.object({
  category: z.string().min(1).optional(),
  audience: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
  /** Studio 'AI use' default (altered or synthetic content); absent → undecided, the app never guesses. */
  aiUse: z.boolean().optional(),
  /** Studio 'Paid promotion' default; absent → undecided, the app never guesses. */
  paidPromotion: z.boolean().optional(),
});
export type BrandStudioDefaults = z.infer<typeof BrandStudioDefaults>;

/**
 * The brand's research switches (FliStudio `research.*`, docs/briefs/research-keywords-build-brief.md). Sources that
 * are not an official API can vanish or be blocked, and YouTube's Developer Policies bar undocumented APIs for an API
 * client, so each is a switch a person sets per brand. Absent → the default named on each field.
 */
export const BrandResearchSettings = z.object({
  /** YouTube autocomplete (undocumented endpoint). Absent → on. */
  autocomplete: z.boolean().optional(),
  /** Unofficial sources that are off by default (Google Trends, YouTube filter). Absent → off. */
  allowUnofficial: z.boolean().optional(),
});
export type BrandResearchSettings = z.infer<typeof BrandResearchSettings>;

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
  /** Which research sources the brand allows. */
  research: BrandResearchSettings.optional(),
});
export type BrandSettings = z.infer<typeof BrandSettings>;

export const ReadBrandSettingsResult = readFileResult(BrandSettings);
export type ReadBrandSettingsResult = z.infer<typeof ReadBrandSettingsResult>;

/** Read `<brandRoot>/fli.brand.json`. Missing → `null` (no strip, never an error); malformed → `invalid`. */
export function readBrandSettings(brandRoot: string): Promise<ReadBrandSettingsResult> {
  return readJsonFile(path.join(brandRoot, BRAND_SETTINGS_FILE), BrandSettings);
}

/** The bytes `writeBrandSettings` puts on disk, so a written version is known without reading the file back. */
const serialise = (settings: BrandSettings): string => `${JSON.stringify(settings, null, 2)}\n`;

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
    await atomicWrite(file, serialise(parsed.data));
    return { kind: 'written', path: file };
  } catch (error) {
    return { kind: 'refused', reason: 'io-error', path: file, message: errorMessage(error) };
  }
}

export const UpdateBrandSettingsResult = z.union([
  z.object({
    kind: z.literal('written'),
    path: z.string(),
    settings: BrandSettings,
    /** `brandSettingsVersion` of what was written: the version a caller hands back on its next write. */
    version: z.string(),
  }),
  z.object({
    kind: z.literal('refused'),
    /**
     * `unusable-file`: `fli.brand.json` exists but does not read as BrandSettings — never overwritten, fix it by hand.
     * `busy`: another writer held the lock past the wait.
     */
    reason: z.enum(['invalid-input', 'io-error', 'unusable-file', 'busy']),
    path: z.string(),
    message: z.string(),
  }),
]);
export type UpdateBrandSettingsResult = z.infer<typeof UpdateBrandSettingsResult>;

export interface UpdateBrandSettingsOptions {
  /** How long to wait for another writer's lock (default 3 s). */
  waitMs?: number;
  /** A lock older than this is a crashed writer's and is broken (default 10 s). */
  staleMs?: number;
}

/**
 * The one write path for `fli.brand.json` (W8, 2026-10-29: FliHub's Save and FliStudio's publish.set lost each other's
 * changes). Under `fli.brand.json.lock` beside it, it re-reads the file, hands what is on disk NOW to `mutate`, and
 * writes the result atomically — so two writers never lose each other's change. `mutate` gets `null` when the file is
 * absent; it may be async, and it may throw to give up (the lock is released and the error rethrown, nothing written).
 * An unusable file is refused, never overwritten. Never throws for its own reasons.
 */
export async function updateBrandSettings(
  brandRoot: string,
  mutate: (current: BrandSettings | null) => BrandSettings | Promise<BrandSettings>,
  options: UpdateBrandSettingsOptions = {},
): Promise<UpdateBrandSettingsResult> {
  const file = path.join(brandRoot, BRAND_SETTINGS_FILE);
  const refuse = (
    reason: Extract<UpdateBrandSettingsResult, { kind: 'refused' }>['reason'],
    message: string,
  ) => ({ kind: 'refused', reason, path: file, message }) as const;
  const lock = `${file}.lock`;
  try {
    if (!(await takeLock(lock, options.waitMs ?? 3000, options.staleMs ?? 10_000))) {
      return refuse('busy', `${file} is being changed by another writer (${lock}); try again.`);
    }
  } catch (error) {
    return refuse('io-error', errorMessage(error));
  }
  try {
    const read = await readBrandSettings(brandRoot);
    if (read?.kind === 'invalid') {
      return refuse(
        'unusable-file',
        `${file} is not usable brand settings (${read.reason}: ${read.message}); fix it by hand first.`,
      );
    }
    const next = await mutate(read?.value ?? null);
    const written = await writeBrandSettings(brandRoot, next);
    if (written.kind === 'refused') return refuse(written.reason, written.message);
    const settings = BrandSettings.parse(next);
    return { kind: 'written', path: file, settings, version: versionOf(serialise(settings)) };
  } finally {
    await fs.rm(lock, { force: true });
  }
}

/**
 * A version of `fli.brand.json` for optimistic concurrency: the sha256 (hex) of its bytes. A reader keeps the version it
 * loaded and hands it back with its write; a different version now means the file changed elsewhere. Absent → `null`.
 */
export async function brandSettingsVersion(file: string): Promise<string | null> {
  try {
    return versionOf(await fs.readFile(file));
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw error;
  }
}

const versionOf = (bytes: string | Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');
