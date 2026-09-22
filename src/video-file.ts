import { z } from 'zod';
import { KebabSlug } from './project-folder.js';
import { LEGACY_FOLDERS } from './classify.js';
import { parseOrThrow } from './results.js';

/**
 * Video files and folders (ruling "B only", 👤 David 2026-09-22 — supersedes the 09-09 numbered shape):
 * `videos/<name>/<name>-<kind>[-<variant>].<ext>`, e.g. `videos/flivideo-tour/flivideo-tour-audio-a100.m4a`.
 * No numbers. The video's name is on every file, so a file explains itself outside its folder.
 * Kinds: `cut`, `final` (no variant), `audio-<treatment>`, `overlay-<variant>` (variant required).
 * Anything else is `unknown-kind`: shown, never hidden, and `parseVideoFile` never throws.
 */

const Ext = z.string().regex(/^[A-Za-z0-9]+$/, 'ext must be letters/digits, without the dot');

export const VideoFileKind = z.enum(['cut', 'audio', 'overlay', 'final']);
export type VideoFileKind = z.infer<typeof VideoFileKind>;

export const VideoFile = z.discriminatedUnion('kind', [
  z.object({ name: KebabSlug, kind: z.literal('cut'), variant: z.null().default(null), ext: Ext }),
  z.object({
    name: KebabSlug,
    kind: z.literal('final'),
    variant: z.null().default(null),
    ext: Ext,
  }),
  z.object({ name: KebabSlug, kind: z.literal('audio'), variant: KebabSlug, ext: Ext }),
  z.object({ name: KebabSlug, kind: z.literal('overlay'), variant: KebabSlug, ext: Ext }),
]);
export type VideoFile = z.infer<typeof VideoFile>;

export const UnknownVideoFile = z.object({
  kind: z.literal('unknown-kind'),
  name: z.string(),
  ext: z.string().nullable(),
});
export type UnknownVideoFile = z.infer<typeof UnknownVideoFile>;

export const ParsedVideoFile = z.union([VideoFile, UnknownVideoFile]);
export type ParsedVideoFile = z.infer<typeof ParsedVideoFile>;

/** What follows `<name>-`: `<kind>[-<variant>].<ext>`. */
const KIND_PART = /^([a-z]+)(?:-([a-z0-9]+(?:-[a-z0-9]+)*))?\.([A-Za-z0-9]+)$/;

/**
 * `flivideo-tour-audio-a100.m4a` in video `flivideo-tour` → `{ name: 'flivideo-tour', kind: 'audio', variant: 'a100',
 * ext: 'm4a' }`. The video name is required: names are kebab and may contain kind words (`the-final-cut`), so a file
 * name only splits once the name is known. Never throws.
 */
export function parseVideoFile(fileName: string, videoName: string): ParsedVideoFile {
  const prefix = `${videoName}-`;
  if (fileName.startsWith(prefix)) {
    const match = KIND_PART.exec(fileName.slice(prefix.length));
    if (match) {
      const parsed = VideoFile.safeParse({
        name: videoName,
        kind: match[1],
        variant: match[2] ?? null,
        ext: match[3],
      });
      if (parsed.success) return parsed.data;
    }
  }
  const extMatch = /\.([A-Za-z0-9]+)$/.exec(fileName);
  return { kind: 'unknown-kind', name: fileName, ext: extMatch ? (extMatch[1] as string) : null };
}

/** The inverse of `parseVideoFile`, so an agent never invents a name (CR-16). Throws `FliCoreError` on invalid input. */
export function videoFileName(file: z.input<typeof VideoFile>): string {
  const { name, kind, variant, ext } = parseOrThrow(VideoFile, file, 'video file');
  return variant === null ? `${name}-${kind}.${ext}` : `${name}-${kind}-${variant}.${ext}`;
}

export const VideoFolder = z.object({
  name: KebabSlug.refine(
    (name) => !LEGACY_FOLDERS.includes(name),
    'a legacy layout name (first-edit, edits, …) is never a video',
  ),
});
export type VideoFolder = z.infer<typeof VideoFolder>;

/** A video folder name: a kebab-case name (`flivideo-tour`). Read only inside `videos/`. */
export const VIDEO_FOLDER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The same rule as a string schema, for contexts that carry the folder name (`OpenContext.video`). */
export const VideoFolderName = z
  .string()
  .regex(
    VIDEO_FOLDER_PATTERN,
    'video must be a video folder name: a kebab-case name, e.g. flivideo-tour',
  );

/**
 * `flivideo-tour` → `{ name: 'flivideo-tour' }`. Not a kebab name, or a legacy layout name (`first-edit`, `edits`, …,
 * or `-`-prefixed), → `null`: those never parse as videos.
 */
export function parseVideoFolder(name: string): VideoFolder | null {
  const parsed = VideoFolder.safeParse({ name });
  return parsed.success ? parsed.data : null;
}

/** The inverse of `parseVideoFolder`: the folder is the name. Throws `FliCoreError` on a name that is not kebab. */
export function videoFolderName(folder: VideoFolder): string {
  return parseOrThrow(VideoFolder, folder, 'video folder').name;
}
