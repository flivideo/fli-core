import { z } from 'zod';
import { defineCapability } from './capability.js';
import { BusyWork } from './failure-codes.js';

/**
 * The lifecycle verb contract (agent-drivable step 2, David 2026-09-23: "Do we have support for closing them down
 * using Agent?"). Two halves, one meaning:
 *
 *   inside an app — `system.status`, `system.quit`, `system.restart` on its own door. An app registers these
 *     contracts and binds its own handlers; the reply is sent BEFORE the process goes away.
 *   from outside — `scripts/app.sh status|stop|restart` in the app's checkout, which works when the door does not
 *     answer. A hub (FliStudio's `app.stop` / `app.restart`) drives every app this way, never with `pkill`.
 *
 * Quitting is refused as `app-busy` while the app holds work that a quit would lose (a recording, an unsaved edit,
 * an export). `details.busy` says what, so a caller can wait and retry rather than force it.
 */

export const LifecycleVerb = z.enum(['status', 'start', 'stop', 'restart']);
export type LifecycleVerb = z.infer<typeof LifecycleVerb>;

export const SystemStatus = z.object({
  app: z.string(),
  version: z.string(),
  pid: z.number().int().positive(),
  startedAt: z.iso.datetime(),
  /** The brand + project this run is pointed at, when it has one. */
  context: z
    .object({ brand: z.string(), project: z.string(), video: z.string().optional() })
    .nullable(),
  busy: z.array(BusyWork),
});
export type SystemStatus = z.infer<typeof SystemStatus>;

export const SystemQuitInput = z.object({
  /** Quit even while busy. Human-only: an agent waits for the work to finish instead. */
  force: z.boolean().optional(),
});
export type SystemQuitInput = z.infer<typeof SystemQuitInput>;

export const SystemQuitOutput = z.object({
  pid: z.number().int().positive(),
  /** When the process will be gone, roughly — the reply leaves first. */
  quittingInMs: z.number().int().min(0),
});
export type SystemQuitOutput = z.infer<typeof SystemQuitOutput>;

/** The three contracts every Fli app registers on its own door. Bind the handlers in the app. */
export const LIFECYCLE_CAPABILITIES = {
  'system.status': defineCapability({
    kind: 'query',
    description: 'Is the app up, which run is it, what is it pointed at, and is it busy.',
    input: z.object({}),
    output: SystemStatus,
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [],
  }),
  'system.quit': defineCapability({
    kind: 'command',
    description: 'Quit the app. Refused while it is busy unless a person forces it.',
    input: SystemQuitInput,
    output: SystemQuitOutput,
    sideEffects: 'external-side-effect',
    idempotent: true,
    confirmationRequired: true,
    failureModes: ['app-busy'],
    humanOnly: { when: (input) => input.force === true, note: 'force: true' },
  }),
  'system.restart': defineCapability({
    kind: 'command',
    description:
      'Quit and start again on the same brand and project. Refused while it is busy unless forced.',
    input: SystemQuitInput,
    output: SystemQuitOutput,
    sideEffects: 'external-side-effect',
    idempotent: false,
    confirmationRequired: true,
    failureModes: ['app-busy'],
    humanOnly: { when: (input) => input.force === true, note: 'force: true' },
  }),
};

export const AppScriptOpen = z.object({
  brand: z.string().min(1),
  project: z.string().min(1),
  video: z.string().min(1).optional(),
});
export type AppScriptOpen = z.infer<typeof AppScriptOpen>;

/**
 * The argv for `scripts/app.sh` (`bash scripts/app.sh …` in the app's checkout). `start` and `restart` take the open
 * context (door 2); `status` and `stop` take none.
 */
export function appScriptArgs(verb: LifecycleVerb, open?: AppScriptOpen): string[] {
  const args: string[] = [verb];
  if (open && (verb === 'start' || verb === 'restart')) {
    const o = AppScriptOpen.parse(open);
    args.push('--brand', o.brand, '--project', o.project);
    if (o.video) args.push('--video', o.video);
  }
  return args;
}
