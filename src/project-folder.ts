import { z } from 'zod';
import { parseOrThrow } from './results.js';

/** A project code: one lowercase letter and two digits (`a01`, `d02`). */
export const ProjectCode = z
  .string()
  .regex(/^[a-z]\d{2}$/, 'code must be one lowercase letter + two digits');
export type ProjectCode = z.infer<typeof ProjectCode>;

/** Kebab-case: lowercase letters and digits, single hyphens between words. */
export const KebabSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (a-z, 0-9, single hyphens)');

export const ProjectFolder = z.object({ code: ProjectCode, slug: KebabSlug });
export type ProjectFolder = z.infer<typeof ProjectFolder>;

const PROJECT_FOLDER = /^([a-z]\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** `a01-xmen` → `{ code: 'a01', slug: 'xmen' }`. Anything else → `null`. */
export function parseProjectFolder(name: string): ProjectFolder | null {
  const match = PROJECT_FOLDER.exec(name);
  if (!match) return null;
  return { code: match[1] as string, slug: match[2] as string };
}

/** The inverse of `parseProjectFolder`. Throws `FliCoreError` on a code or slug that is not valid. */
export function projectFolderName(folder: ProjectFolder): string {
  const { code, slug } = parseOrThrow(ProjectFolder, folder, 'project folder');
  return `${code}-${slug}`;
}
