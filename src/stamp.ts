import { z } from 'zod';
import { PrincipalName } from './capability.js';

/**
 * Who changed a record, and when (David 2026-09-24: "keep a time updated and a who agent versus human"). `by` is the
 * principal the change came through — `human:ui`, `cli` or `agent:<name>` — so an agent can answer "who changed this,
 * and when" without a log. Written by the one app that owns the record; never trusted as proof of identity.
 */
export const Stamp = z.object({
  at: z.iso.datetime({ offset: true }),
  by: PrincipalName,
});
export type Stamp = z.infer<typeof Stamp>;

/** A stamp for a change made now by `by`. */
export function stampOf(by: PrincipalName, now: Date = new Date()): Stamp {
  return Stamp.parse({ at: now.toISOString(), by });
}
