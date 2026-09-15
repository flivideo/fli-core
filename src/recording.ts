import { z } from 'zod';
import { parseOrThrow } from './results.js';

/**
 * Recording names: `NN-S-slug[-TAGS].ext` (spec §3, §4). The rules follow FliHub's `shared/naming.ts`, the working
 * definition: chapter is 1–2 digits when read (legacy) and always 2 when built; the segment (FliHub: "sequence") is
 * one or more digits and may be absent (`NN-slug.ext`); tags are the trailing words that are all uppercase
 * letters/digits with at least one letter (`CTA`, `1ST`, `V2`).
 */

const TAG = /^(?=.*[A-Z])[A-Z0-9]+$/;
const SLUG_WORD = /^[a-z0-9.]+$/;

export const RecordingTag = z
  .string()
  .regex(TAG, 'tag must be uppercase letters/digits with a letter');

export const Recording = z
  .object({
    chapter: z.number().int().min(1).max(99),
    segment: z.number().int().min(1).nullable(),
    slug: z
      .string()
      .regex(
        /^[a-z0-9.]+(?:-[a-z0-9.]+)*$/,
        'slug must be kebab-case (a-z, 0-9, periods, hyphens)',
      ),
    tags: z.array(RecordingTag),
    ext: z
      .string()
      .regex(
        /^[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*$/,
        'ext must be letters/digits with a letter, without the dot',
      ),
  })
  .superRefine((recording, ctx) => {
    // With no segment, a leading all-digit slug word would be read back as the segment: no round-trip (F6).
    if (recording.segment === null && /^\d+$/.test(recording.slug.split('-')[0] ?? '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'a slug starting with a number needs a segment',
      });
    }
  });
export type Recording = z.infer<typeof Recording>;

/** `01-1-intro-CTA.mov` → `{ chapter: 1, segment: 1, slug: 'intro', tags: ['CTA'], ext: 'mov' }`. Not a recording → `null`. */
export function parseRecording(name: string): Recording | null {
  const extMatch = /^(.+)\.([A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*)$/.exec(name);
  if (!extMatch) return null;
  const base = extMatch[1] as string;
  const ext = extMatch[2] as string;

  const parts = base.split('-');
  const chapterPart = parts[0] as string;
  if (!/^\d{1,2}$/.test(chapterPart)) return null;
  const chapter = Number(chapterPart);
  if (chapter < 1) return null;

  let rest = parts.slice(1);
  let segment: number | null = null;
  if (rest.length > 0 && /^\d+$/.test(rest[0] as string)) {
    segment = Number(rest[0]);
    if (segment < 1) return null;
    rest = rest.slice(1);
  }

  const tags: string[] = [];
  while (rest.length > 0 && TAG.test(rest[rest.length - 1] as string)) {
    tags.unshift(rest.pop() as string);
  }

  if (rest.length === 0 || !rest.every((word) => SLUG_WORD.test(word))) return null;
  return { chapter, segment, slug: rest.join('-'), tags, ext };
}

/** The inverse of `parseRecording`, always with a two-digit chapter. Throws `FliCoreError` on invalid input. */
export function recordingFileName(recording: Recording): string {
  const { chapter, segment, slug, tags, ext } = parseOrThrow(Recording, recording, 'recording');
  const parts = [String(chapter).padStart(2, '0')];
  if (segment !== null) parts.push(String(segment));
  parts.push(slug, ...tags);
  return `${parts.join('-')}.${ext}`;
}
