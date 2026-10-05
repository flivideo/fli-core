import { describe, expect, it } from 'vitest';
import {
  FORWARD_SPEEDS,
  MAX_SHUTTLE,
  ShuttleState,
  jkl,
  shuttle,
  shuttleLabel,
} from '../src/transport.js';

// Pins David's rules exactly as FliCut (test/transport-and-follow.test.ts) and FliCast (test/renderer/transport.test.ts)
// had them before the lift into core.

describe('jkl — David d06 2026-09-27: J / L slower / faster around K, both forward', () => {
  it('the ladder is 0.25× … 4×, forward only, with 1× in it', () => {
    expect([...FORWARD_SPEEDS]).toEqual([0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4]);
    expect(Math.min(...FORWARD_SPEEDS)).toBeGreaterThan(0);
  });

  it('L: paused → 1×, then one step faster each press, ceiling 4×', () => {
    let s = jkl({ playing: false, rate: 1 }, 'L');
    expect(s).toEqual({ playing: true, rate: 1 });
    for (const want of [1.5, 2, 2.5, 3, 3.5, 4, 4]) expect((s = jkl(s, 'L')).rate).toBe(want);
  });

  it('L while reversing plays forward at 1×', () => {
    expect(jkl({ playing: true, rate: -2 }, 'L')).toEqual({ playing: true, rate: 1 });
  });

  it('J: one step slower each press, floor 0.25×; paused → 0.75×', () => {
    let s: ShuttleState = { playing: true, rate: 1 };
    for (const want of [0.75, 0.5, 0.25, 0.25]) expect((s = jkl(s, 'J')).rate).toBe(want);
    expect(jkl({ playing: false, rate: 1 }, 'J')).toEqual({ playing: true, rate: 0.75 });
    expect(jkl({ playing: true, rate: 3 }, 'J')).toEqual({ playing: true, rate: 2.5 });
    expect(jkl({ playing: true, rate: -1 }, 'J')).toEqual({ playing: true, rate: 0.75 });
  });

  it('K: back to 1×, playing stays as it is, a reverse stops', () => {
    expect(jkl({ playing: true, rate: 4 }, 'K')).toEqual({ playing: true, rate: 1 });
    expect(jkl({ playing: false, rate: 0.5 }, 'K')).toEqual({ playing: false, rate: 1 });
    expect(jkl({ playing: true, rate: -2 }, 'K')).toEqual({ playing: false, rate: 1 });
  });

  it('a rate off the ladder counts as 1×', () => {
    expect(jkl({ playing: true, rate: 1.25 }, 'L')).toEqual({ playing: true, rate: 1.5 });
    expect(jkl({ playing: true, rate: 1.25 }, 'J')).toEqual({ playing: true, rate: 0.75 });
  });
});

describe('shuttle — the NLE shuttle (FliCast, FliCut ⇧J, FliEdit)', () => {
  const stopped: ShuttleState = { playing: false, rate: 1 };

  it('playForward: 1×, then doubles to 8× and holds', () => {
    let s = shuttle(stopped, 'playForward');
    expect(s).toEqual({ playing: true, rate: 1 });
    for (const want of [2, 4, 8, 8]) expect((s = shuttle(s, 'playForward')).rate).toBe(want);
    expect(MAX_SHUTTLE).toBe(8);
  });

  it('playBackward: −1×, then doubles backward; pressed while forward goes back at 1×', () => {
    const s = shuttle(stopped, 'playBackward');
    expect(s).toEqual({ playing: true, rate: -1 });
    expect(shuttle(s, 'playBackward').rate).toBe(-2);
    expect(shuttle({ playing: true, rate: 4 }, 'playBackward')).toEqual({
      playing: true,
      rate: -1,
    });
    expect(shuttle({ playing: true, rate: -8 }, 'playBackward').rate).toBe(-8);
  });

  it('playForward while reversing goes forward at 1×; stop pauses at 1×', () => {
    expect(shuttle({ playing: true, rate: -2 }, 'playForward')).toEqual({ playing: true, rate: 1 });
    expect(shuttle({ playing: true, rate: -4 }, 'stop')).toEqual({ playing: false, rate: 1 });
  });

  it('togglePlay: pause, or play at 1×', () => {
    expect(shuttle(stopped, 'togglePlay')).toEqual({ playing: true, rate: 1 });
    expect(shuttle({ playing: true, rate: 4 }, 'togglePlay')).toEqual({ playing: false, rate: 1 });
  });
});

describe('shuttleLabel', () => {
  it('reads ❚❚ / ▶ / ▶▶ / ◀ / ◀◀ and the speed', () => {
    expect(shuttleLabel(false, 1.25)).toBe('❚❚ 1.25×');
    expect(shuttleLabel(true, 1)).toBe('▶ 1×');
    expect(shuttleLabel(true, 0.75)).toBe('▶ 0.75×');
    expect(shuttleLabel(true, 4)).toBe('▶▶ 4×');
    expect(shuttleLabel(true, -1)).toBe('◀ 1×');
    expect(shuttleLabel(true, -4)).toBe('◀◀ 4×');
  });
});

describe('ShuttleState', () => {
  it('is a schema: playing + signed rate', () => {
    expect(ShuttleState.parse({ playing: true, rate: -2 })).toEqual({ playing: true, rate: -2 });
    expect(ShuttleState.safeParse({ playing: 'yes', rate: 1 }).success).toBe(false);
  });
});
