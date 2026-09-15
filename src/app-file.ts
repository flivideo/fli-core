import { z } from 'zod';
import { parseOrThrow } from './results.js';

/**
 * App decision files (D1, naming scheme D): `fli.<app>[.<subject>].json` at the project top.
 * `fli.<app>` is the first two dot segments; everything between that and `.json` is the subject.
 * Generic names (`project.json`, `meta.json`, `fli.json`) are not app files, and neither are the two reserved names:
 * `fli.brand.json` (a brand-root file, D13) and `fli.studio.<subject>.json` (`fli.studio.json` is the one identity
 * file, A3).
 */

/** The identity file's name (A3, D1). */
export const IDENTITY_FILE = 'fli.studio.json';

export const AppName = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'app must be kebab-case')
  .refine((app) => app !== 'brand', 'app "brand" is reserved for fli.brand.json');
export const AppSubject = z
  .string()
  .regex(
    /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/,
    'subject must be letters, digits, _ or -, with single dots between words',
  );

export const AppFile = z
  .object({ app: AppName, subject: AppSubject.optional() })
  .refine((file) => !(file.app === 'studio' && file.subject !== undefined), {
    message: 'fli.studio.json takes no subject: it is the identity file',
    path: ['subject'],
  });
export type AppFile = z.infer<typeof AppFile>;

const APP_FILE =
  /^fli\.([a-z0-9]+(?:-[a-z0-9]+)*)(?:\.([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*))?\.json$/;

/** `fli.cut.01-xmen.json` → `{ app: 'cut', subject: '01-xmen' }`. Not an app file → `null`. */
export function parseAppFile(name: string): AppFile | null {
  const match = APP_FILE.exec(name);
  if (!match) return null;
  const candidate =
    match[2] === undefined ? { app: match[1] } : { app: match[1], subject: match[2] };
  const parsed = AppFile.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** The inverse of `parseAppFile`. Throws `FliCoreError` on invalid input. */
export function appFileName(file: AppFile): string {
  const { app, subject } = parseOrThrow(AppFile, file, 'app file');
  return subject === undefined ? `fli.${app}.json` : `fli.${app}.${subject}.json`;
}
