import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { RENDERS_FOLDER } from './classify.js';
import { WholeVideoApp, parseVideoFile } from './video-file.js';

/**
 * Who made a whole-video file in `videos/<video>/` (v0.26.0, ruling by flivideo-arch-rsch on David's delegation,
 * 2026-10-29). ONE owner rule, used by every app, so FliStudio, FliEdit and FliCast never disagree about a file:
 *
 *   1. By kind, confirmed by the app's decision file at the project top:
 *      `cut` / `audio` + `fli.cut.<video>.json` → flicut · `edit` + `fli.edit.<video>.json` → fliedit ·
 *      `cast` + `fli.cast.<video>.json` → flicast · `overlay` → flistudio (an Overlay Pilot render).
 *      The kind without its decision file → a placed file.
 *   2. A `legacy` `-final` (R11): exactly one of `fli.edit` / `fli.cast` for the video → that app; both → no owner,
 *      "two candidates".
 *   3. Otherwise (a legacy with neither): `-renders/` or `motion/` in the project → a generated render; else placed.
 *   4. `part` and unknown kinds → a placed file (`export.place` copies them in; no app writes them).
 *
 * `audio` is in rule 1 on evidence: FliCut writes `<video>-audio-<arm>` beside its cut (flicut `pipeline.ts`
 * `contractStem`). Nothing else writes the kind.
 */

export const WholeVideoOwner = z.object({
  app: WholeVideoApp.nullable(),
  /** Said to a person: `FliCut export`, `Overlay Pilot render`, `placed file`, `two candidates: fliedit, flicast`… */
  source: z.string(),
});
export type WholeVideoOwner = z.infer<typeof WholeVideoOwner>;

/** The apps that write a whole video, their decision file's app segment and how a person names their export. */
const MAKERS = {
  flicut: { file: 'cut', source: 'FliCut export' },
  fliedit: { file: 'edit', source: 'FliEdit export' },
  flicast: { file: 'cast', source: 'FliCast export' },
} as const;
type Maker = keyof typeof MAKERS;

const BY_KIND: Partial<Record<string, Maker>> = {
  cut: 'flicut',
  audio: 'flicut',
  edit: 'fliedit',
  cast: 'flicast',
};

const PLACED: WholeVideoOwner = { app: null, source: 'placed file' };

async function isFile(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

async function isDirectory(dir: string): Promise<boolean> {
  return (await fs.stat(dir).catch(() => null))?.isDirectory() ?? false;
}

const hasDecision = (projectDir: string, video: string, maker: Maker): Promise<boolean> =>
  isFile(path.join(projectDir, `fli.${MAKERS[maker].file}.${video}.json`));

/**
 * The owner of `file` (its name in `videos/<video>/`; a path is read by its last segment) in the project at
 * `projectDir`. Reads only the project top: decision files, `-renders/` and `motion/`. Never throws.
 */
export async function wholeVideoOwner(
  projectDir: string,
  video: string,
  file: string,
): Promise<WholeVideoOwner> {
  const parsed = parseVideoFile(path.basename(file), video);
  if (parsed.kind === 'overlay') return { app: 'flistudio', source: 'Overlay Pilot render' };
  const maker = BY_KIND[parsed.kind];
  if (maker) {
    return (await hasDecision(projectDir, video, maker))
      ? { app: maker, source: MAKERS[maker].source }
      : PLACED;
  }
  if (parsed.kind !== 'legacy') return PLACED;

  const candidates: Maker[] = [];
  for (const candidate of ['fliedit', 'flicast'] as const) {
    if (await hasDecision(projectDir, video, candidate)) candidates.push(candidate);
  }
  const [only] = candidates;
  if (candidates.length === 1 && only) return { app: only, source: MAKERS[only].source };
  if (candidates.length > 1)
    return { app: null, source: `two candidates: ${candidates.join(', ')}` };
  for (const dir of [RENDERS_FOLDER, 'motion']) {
    if (await isDirectory(path.join(projectDir, dir))) {
      return { app: null, source: 'generated render' };
    }
  }
  return PLACED;
}
