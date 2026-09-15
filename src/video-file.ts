import { z } from 'zod';
import { KebabSlug } from './project-folder.js';
import { parseOrThrow } from './results.js';

/**
 * Video files and folders (spec §3 L1): `videos/<NN>-<video-name>/<NN>-<kind>[-<variant>].<ext>`.
 * Kinds in v1: `cut`, `final` (no variant), `audio-<treatment>`, `overlay-<variant>` (variant required).
 * Anything else is `unknown-kind`: shown, never hidden, and `parseVideoFile` never throws.
 */

const VideoNumber = z.number().int().min(1).max(99);
const Ext = z.string().regex(/^[A-Za-z0-9]+$/, 'ext must be letters/digits, without the dot');

export const VideoFileKind = z.enum(['cut', 'audio', 'overlay', 'final']);
export type VideoFileKind = z.infer<typeof VideoFileKind>;

export const VideoFile = z.discriminatedUnion('kind', [
  z.object({
    video: VideoNumber,
    kind: z.literal('cut'),
    variant: z.null().default(null),
    ext: Ext,
  }),
  z.object({
    video: VideoNumber,
    kind: z.literal('final'),
    variant: z.null().default(null),
    ext: Ext,
  }),
  z.object({ video: VideoNumber, kind: z.literal('audio'), variant: KebabSlug, ext: Ext }),
  z.object({ video: VideoNumber, kind: z.literal('overlay'), variant: KebabSlug, ext: Ext }),
]);
export type VideoFile = z.infer<typeof VideoFile>;

export const UnknownVideoFile = z.object({
  kind: z.literal('unknown-kind'),
  name: z.string(),
  /** The `NN` prefix when the name has one, else `null`. */
  video: VideoNumber.nullable(),
  ext: z.string().nullable(),
});
export type UnknownVideoFile = z.infer<typeof UnknownVideoFile>;

export const ParsedVideoFile = z.union([VideoFile, UnknownVideoFile]);
export type ParsedVideoFile = z.infer<typeof ParsedVideoFile>;

const VIDEO_FILE = /^(\d{2})-([a-z]+)(?:-([a-z0-9]+(?:-[a-z0-9]+)*))?\.([A-Za-z0-9]+)$/;

/** `01-audio-dfn100.m4a` → `{ video: 1, kind: 'audio', variant: 'dfn100', ext: 'm4a' }`. Never throws. */
export function parseVideoFile(name: string): ParsedVideoFile {
  const match = VIDEO_FILE.exec(name);
  if (match) {
    const video = Number(match[1]);
    const kind = match[2] as string;
    const variant = match[3] ?? null;
    const ext = match[4] as string;
    const candidate = { video, kind, variant, ext };
    const parsed = VideoFile.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return unknownKind(name);
}

function unknownKind(name: string): UnknownVideoFile {
  const prefix = /^(\d{2})-/.exec(name);
  const video = prefix ? Number(prefix[1]) : null;
  const extMatch = /\.([A-Za-z0-9]+)$/.exec(name);
  return {
    kind: 'unknown-kind',
    name,
    video: video !== null && video >= 1 ? video : null,
    ext: extMatch ? (extMatch[1] as string) : null,
  };
}

/** The inverse of `parseVideoFile`, so an agent never invents a name (CR-16). Throws `FliCoreError` on invalid input. */
export function videoFileName(file: z.input<typeof VideoFile>): string {
  const { video, kind, variant, ext } = parseOrThrow(VideoFile, file, 'video file');
  const nn = String(video).padStart(2, '0');
  return variant === null ? `${nn}-${kind}.${ext}` : `${nn}-${kind}-${variant}.${ext}`;
}

export const VideoFolder = z.object({ video: VideoNumber, name: KebabSlug });
export type VideoFolder = z.infer<typeof VideoFolder>;

/** A video folder name, `<NN>-<name>` with `NN` 01–99 and a kebab-case name (`01-xmen`). */
export const VIDEO_FOLDER_PATTERN = /^(0[1-9]|[1-9]\d)-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** The same rule as a string schema, for contexts that carry the folder name (`OpenContext.video`). */
export const VideoFolderName = z
  .string()
  .regex(VIDEO_FOLDER_PATTERN, 'video must be a video folder name, <NN>-<kebab-name>');

/** `01-xmen` → `{ video: 1, name: 'xmen' }`. Not a video folder → `null`. */
export function parseVideoFolder(name: string): VideoFolder | null {
  const match = VIDEO_FOLDER_PATTERN.exec(name);
  if (!match) return null;
  return { video: Number(match[1]), name: match[2] as string };
}

/** The inverse of `parseVideoFolder`. Throws `FliCoreError` on invalid input. */
export function videoFolderName(folder: VideoFolder): string {
  const { video, name } = parseOrThrow(VideoFolder, folder, 'video folder');
  return `${String(video).padStart(2, '0')}-${name}`;
}
