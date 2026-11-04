import { z } from 'zod';

/**
 * J / K / L — the speed keys every Fli player shares (v0.16.0). David (2026-10-05): "being able to press J, K, and L
 * was wonderful... It feels like a global system... it probably should be part of Core." Lifted from FliCut's
 * `hotkeys.ts` and FliCast's `transport.ts` unchanged; pure, so a renderer can import it (`@flivideo/core/contracts`).
 *
 * Two models over one state:
 *   jkl()      David's ruling (d06 2026-09-27): J and L are slower / faster AROUND K, both going forward.
 *   shuttle()  the NLE shuttle: L again doubles 1× → 2× → 4× → 8×, J the same backward. FliCut binds it to ⇧J
 *              (reverse); FliCast and FliEdit bind J / L to it.
 */

/** Playing or not, and the signed rate: +1 forward at 1×, −2 backward at 2×. */
export const ShuttleState = z.object({
  playing: z.boolean(),
  rate: z.number(),
});
export type ShuttleState = z.infer<typeof ShuttleState>;

/** The shuttle's top speed either way. */
export const MAX_SHUTTLE = 8;

/** The forward ladder J and L climb (David d06 2026-09-27). 1× is K. */
export const FORWARD_SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4] as const;

export type JklKey = 'J' | 'K' | 'L';

/**
 * J / K / L as David rules them. L: paused (or reversing) → 1×, else one step faster (ceiling 4×). J: paused (or
 * reversing) → 0.75×, else one step slower (floor 0.25×). K: back to 1×, playing stays as it is (a reverse stops).
 * A rate off the ladder counts as 1×. Pure. Reverse is `shuttle(s, 'playBackward')`.
 */
export function jkl(s: ShuttleState, key: JklKey): ShuttleState {
  const fwd = s.playing && s.rate > 0;
  const i = FORWARD_SPEEDS.findIndex((r) => Math.abs(r - s.rate) < 1e-9);
  const at = i < 0 ? FORWARD_SPEEDS.indexOf(1) : i;
  const step = (d: 1 | -1): number =>
    FORWARD_SPEEDS[Math.min(FORWARD_SPEEDS.length - 1, Math.max(0, at + d))] ?? 1;
  if (key === 'K') return { playing: s.playing && s.rate > 0, rate: 1 };
  if (key === 'L') return { playing: true, rate: fwd ? step(1) : 1 };
  return { playing: true, rate: fwd ? step(-1) : 0.75 };
}

export type ShuttleAction = 'togglePlay' | 'playForward' | 'playBackward' | 'stop';

/**
 * The NLE shuttle. playForward: again while going forward doubles (to 8×), else 1× forward. playBackward: the same
 * backward (pressed while going forward it stops, then goes back at 1×). stop: paused at 1×. togglePlay (Space):
 * pause, or play at 1×. Pure.
 */
export function shuttle(s: ShuttleState, action: ShuttleAction): ShuttleState {
  switch (action) {
    case 'togglePlay':
      return s.playing ? { playing: false, rate: 1 } : { playing: true, rate: 1 };
    case 'playForward':
      return s.playing && s.rate > 0
        ? { playing: true, rate: Math.min(MAX_SHUTTLE, s.rate * 2) }
        : { playing: true, rate: 1 };
    case 'playBackward':
      return s.playing && s.rate < 0
        ? { playing: true, rate: Math.max(-MAX_SHUTTLE, s.rate * 2) }
        : { playing: true, rate: -1 };
    case 'stop':
      return { playing: false, rate: 1 };
  }
}

/** What a speed badge says: ❚❚ / ▶ / ◀ and the speed (`◀◀ 4×` reads "backward, fast"). */
export function shuttleLabel(playing: boolean, rate: number): string {
  const speed = `${+Math.abs(rate).toFixed(2)}×`;
  if (!playing) return `❚❚ ${speed}`;
  const arrow = rate < 0 ? (Math.abs(rate) > 1 ? '◀◀' : '◀') : Math.abs(rate) > 1 ? '▶▶' : '▶';
  return `${arrow} ${speed}`;
}

/** Where the speed control's window sits on a ladder (v0.32.0). */
export type SpeedWindow = {
  /** The rungs on show: `visible` consecutive rungs, the window pinned (not shrunk) at either end of the ladder. */
  rates: number[];
  /** Index in `ladder` of the first rung shown. */
  start: number;
  /** Index in `ladder` of the rung nearest the current rate. */
  index: number;
  /** True when the current rate is exactly that rung; false for an off-ladder rate (no rung is lit). */
  exact: boolean;
  /** False at the first rung: the slower chevron greys out. */
  canBack: boolean;
  /** False at the last rung: the faster chevron greys out. */
  canForward: boolean;
};

/**
 * The window the 3-visible speed control shows (David 2026-11-04): `visible` rungs centred on the current rate, pinned
 * at the first / last rung so it slides rather than shrinks. A rate off the ladder (a stale saved value) builds the
 * window around the nearest rung and lights none (`exact: false`). `visible` is clamped to 1…ladder length. Pure.
 */
export function speedWindow(ladder: readonly number[], current: number, visible = 3): SpeedWindow {
  const n = ladder.length;
  if (n === 0)
    return { rates: [], start: 0, index: 0, exact: false, canBack: false, canForward: false };
  let index = 0;
  for (let i = 1; i < n; i++) {
    if (Math.abs((ladder[i] as number) - current) < Math.abs((ladder[index] as number) - current))
      index = i;
  }
  const size = Math.min(n, Math.max(1, Math.floor(visible)));
  const start = Math.min(n - size, Math.max(0, index - Math.floor(size / 2)));
  return {
    rates: ladder.slice(start, start + size),
    start,
    index,
    exact: Math.abs((ladder[index] as number) - current) < 1e-9,
    canBack: index > 0,
    canForward: index < n - 1,
  };
}
