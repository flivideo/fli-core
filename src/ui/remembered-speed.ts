import { FORWARD_SPEEDS } from '../transport.js';

/** The slice of `Storage` the helper needs (so tests, and non-browser hosts, can pass their own). */
export type SpeedStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type RememberedSpeedOptions = {
  /** Old keys read once: the first one holding a number is copied to the new key, then every old key is removed. */
  migrateFrom?: string[];
  /** Defaults to `globalThis.localStorage`; blocked or absent storage just means "no memory". */
  storage?: SpeedStorage | null;
};

export type RememberedSpeed = { get(): number; set(rate: number): void };

/** The storage key a remembered speed lives under: `fli:<app>:speed`. */
export const speedKey = (appKey: string): string => `fli:${appKey}:speed`;

/** The nearest `FORWARD_SPEEDS` rung to `rate` (ties go slower); `undefined` if it is not a finite number. */
export function snapSpeed(rate: unknown): number | undefined {
  const n =
    typeof rate === 'number' ? rate : typeof rate === 'string' && rate.trim() ? Number(rate) : NaN;
  if (!Number.isFinite(n)) return undefined;
  let best: number = FORWARD_SPEEDS[0];
  for (const r of FORWARD_SPEEDS) if (Math.abs(r - n) < Math.abs(best - n)) best = r;
  return best;
}

function defaultStorage(): SpeedStorage | null {
  try {
    return (globalThis as { localStorage?: SpeedStorage }).localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * A playback speed that survives a reload (v0.33.0): `localStorage['fli:<app>:speed']`, snapped to the nearest ladder
 * rung. Storage that is blocked, absent or throwing yields `fallback` and never throws. `migrateFrom` moves an old key
 * across once (read → write new → remove old); after that the new key wins and old keys are ignored.
 */
export function rememberedSpeed(
  appKey: string,
  fallback: number,
  opts: RememberedSpeedOptions = {},
): RememberedSpeed {
  const key = speedKey(appKey);
  const def = snapSpeed(fallback) ?? 1;
  const store = (): SpeedStorage | null =>
    opts.storage === undefined ? defaultStorage() : opts.storage;
  let migrated = false;
  const migrate = (s: SpeedStorage): void => {
    if (migrated) return;
    migrated = true;
    const old = opts.migrateFrom ?? [];
    if (old.length === 0) return;
    if (s.getItem(key) === null) {
      for (const k of old) {
        const v = snapSpeed(s.getItem(k));
        if (v !== undefined) {
          s.setItem(key, String(v));
          break;
        }
      }
    }
    for (const k of old) s.removeItem(k);
  };
  return {
    get() {
      try {
        const s = store();
        if (!s) return def;
        migrate(s);
        return snapSpeed(s.getItem(key)) ?? def;
      } catch {
        return def;
      }
    },
    set(rate) {
      const v = snapSpeed(rate);
      if (v === undefined) return;
      try {
        const s = store();
        if (!s) return;
        migrate(s);
        s.setItem(key, String(v));
      } catch {
        /* blocked storage: the speed just is not remembered */
      }
    },
  };
}
