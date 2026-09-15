import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { resolveBrandRoot, type Brand } from './brands.js';
import { ProjectRefusal, resolveProject } from './estate.js';
import { errorMessage } from './fs-utils.js';
import type { MachineSettings } from './machine.js';
import { OpenArgName, OpenContext, type RawOpenArgs } from './open-args.js';
import { VIDEO_FOLDER_PATTERN } from './video-file.js';

/**
 * Door 2 end to end (open contract §3, §5; C1, C3): turn the names an app was launched with into the `OpenContext` it
 * opens, or a typed refusal saying why not. Every app resolves the same way and refuses in the same words.
 */

export const OpenContextResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('resolved'), context: OpenContext }),
  /** Each missing argument becomes a picker (R25). */
  z.object({ kind: z.literal('missing'), missing: z.array(OpenArgName) }),
  z.object({ kind: z.literal('unknown-brand'), brand: z.string() }),
  z.object({ kind: z.literal('no-brand-root'), brand: z.string(), message: z.string() }),
  z.object({ kind: z.literal('project-refused'), result: ProjectRefusal }),
  z.object({ kind: z.literal('video-invalid'), video: z.string() }),
  z.object({
    kind: z.literal('video-not-found'),
    video: z.string(),
    path: z.string(),
    message: z.string(),
  }),
]);
export type OpenContextResult = z.infer<typeof OpenContextResult>;

export interface ResolveOpenContextOptions {
  /** The registry, from `readBrands`. */
  brands: readonly Brand[];
  /** This machine's settings, from `readMachineSettings` (for `brandRoots`). */
  machine?: Pick<MachineSettings, 'brandRoots'> | null;
  /** Home directory for the A5 rewrite; default `os.homedir()`. */
  home?: string;
  /** Refuse with `missing: ['video']` when no video is given. Default `false`. */
  requireVideo?: boolean;
}

/**
 * Resolve `{ brand, project, video? }` (e.g. `parseOpenArgs(...).context`) to an `OpenContext`.
 * Order: missing arguments → video name shape → brand in the registry → brand root on this machine → project
 * (`resolveProject`: folder, id or whole code; ambiguity refuses) → `videos/<video>/` exists.
 * Read-only: one listing of the brand root and at most one `stat`. Never falls back to another project (C3). Never
 * throws.
 */
export async function resolveOpenContext(
  args: RawOpenArgs,
  options: ResolveOpenContextOptions,
): Promise<OpenContextResult> {
  const missing = OpenArgName.options.filter(
    (name) => !args[name] && (name !== 'video' || options.requireVideo === true),
  );
  if (missing.length > 0) return { kind: 'missing', missing };
  const brandKey = args.brand as string;
  const projectRef = args.project as string;
  const video = args.video;

  if (video !== undefined && !VIDEO_FOLDER_PATTERN.test(video)) {
    return { kind: 'video-invalid', video };
  }

  const brand = options.brands.find((candidate) => candidate.key === brandKey);
  if (brand === undefined) return { kind: 'unknown-brand', brand: brandKey };

  const root = resolveBrandRoot(
    brand,
    options.machine,
    options.home === undefined ? {} : { home: options.home },
  );
  if (root === null) {
    return {
      kind: 'no-brand-root',
      brand: brandKey,
      message: `Brand "${brandKey}" has no locations.video_projects and no brandRoots override on this machine.`,
    };
  }
  if (!path.isAbsolute(root)) {
    return {
      kind: 'no-brand-root',
      brand: brandKey,
      message: `Brand "${brandKey}" resolves to a relative root (${root}); a brand root must be absolute.`,
    };
  }

  const resolved = await resolveProject(root, projectRef);
  if (resolved.kind !== 'found') return { kind: 'project-refused', result: resolved };
  const { project } = resolved;

  if (video !== undefined) {
    const videoDir = path.join(project.path, 'videos', video);
    const notFound = (message: string): OpenContextResult => ({
      kind: 'video-not-found',
      video,
      path: videoDir,
      message,
    });
    try {
      if (!(await fs.stat(videoDir)).isDirectory())
        return notFound(`${videoDir} is not a directory`);
    } catch (error) {
      return notFound(errorMessage(error));
    }
  }

  const context: OpenContext = {
    brand: brand.key,
    projectDir: project.path,
    projectId: project.identity.id,
  };
  if (video !== undefined) context.video = video;
  return { kind: 'resolved', context };
}
