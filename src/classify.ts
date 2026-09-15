import { z } from 'zod';
import { IDENTITY_FILE, parseAppFile } from './app-file.js';

/**
 * Which zone of the project layout (spec §3, roadmap §1) a path inside a project belongs to.
 * Pure: works on the path string alone, plus an optional hint that the entry is a directory.
 */
export const ProjectZone = z.enum([
  'identity',
  'app-decisions',
  'recordings',
  'transcripts',
  'cast',
  'videos',
  'legacy',
  'other',
]);
export type ProjectZone = z.infer<typeof ProjectZone>;

const ZONE_FOLDERS: Record<string, ProjectZone> = {
  recordings: 'recordings',
  transcripts: 'transcripts',
  'recording-transcripts': 'transcripts', // legacy name, still read (D7)
  cast: 'cast',
  videos: 'videos',
};

/** Top-level folders from layouts older than the 09-09 ruling (A8). Read-only, never migrated. */
export const LEGACY_FOLDERS: readonly string[] = [
  'first-edit',
  'edits',
  'edit-1st',
  'final',
  'pipeline',
  'animation',
];

/**
 * @param relPath path relative to the project folder, `/`-separated (`videos/01-xmen/01-cut.mp4`). A trailing `/`
 *   also marks a directory.
 * @param isDirectory whether the entry is a directory, when the caller knows.
 */
export function classifyProjectEntry(relPath: string, isDirectory?: boolean): ProjectZone {
  const trailingSlash = /[/\\]$/.test(relPath);
  const segments = relPath.split(/[/\\]+/).filter((segment) => segment !== '' && segment !== '.');
  if (segments.length === 0 || segments.includes('..') || /^[/\\]/.test(relPath)) return 'other';

  const top = segments[0] as string;
  const nested = segments.length > 1;
  const directory = isDirectory ?? (trailingSlash ? true : undefined);

  if (!nested && directory !== true) {
    if (top === IDENTITY_FILE) return 'identity';
    if (parseAppFile(top) !== null) return 'app-decisions';
  }

  // A top-level *file* named like a zone folder is not that zone.
  const topIsFile = !nested && directory === false;

  if (top.startsWith('-') || LEGACY_FOLDERS.includes(top)) return topIsFile ? 'other' : 'legacy';

  const zone = ZONE_FOLDERS[top];
  if (zone === undefined || topIsFile) return 'other';

  // Chapter previews are deprecated (D8); FliHub's live `-safe/` and `-trash/` stay recordings.
  if (zone === 'recordings' && segments[1] === '-chapters') return 'legacy';
  return zone;
}
