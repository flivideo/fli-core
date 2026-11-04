import { describe, expect, it } from 'vitest';
import { rememberedSpeed, snapSpeed, speedKey, type SpeedStorage } from '../src/ui/index.js';

const mem = (init: Record<string, string> = {}): SpeedStorage & { data: Map<string, string> } => {
  const data = new Map(Object.entries(init));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  };
};
const blocked: SpeedStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('SecurityError');
  },
  removeItem() {
    throw new Error('SecurityError');
  },
};

describe('rememberedSpeed', () => {
  it('keys as fli:<app>:speed', () => expect(speedKey('flicut')).toBe('fli:flicut:speed'));

  it('snaps to the nearest rung', () => {
    expect(snapSpeed(1.2)).toBe(1);
    expect(snapSpeed(1.3)).toBe(1.5);
    expect(snapSpeed(99)).toBe(4);
    expect(snapSpeed(0)).toBe(0.25);
    expect(snapSpeed('2')).toBe(2);
    expect(snapSpeed('fast')).toBeUndefined();
    expect(snapSpeed(NaN)).toBeUndefined();
    expect(snapSpeed(null)).toBeUndefined();
  });

  it('returns the default when nothing is stored, and snaps the default', () => {
    expect(rememberedSpeed('a', 2, { storage: mem() }).get()).toBe(2);
    expect(rememberedSpeed('a', 1.6, { storage: mem() }).get()).toBe(1.5);
  });

  it('round-trips a set, snapped', () => {
    const s = mem();
    const r = rememberedSpeed('a', 1, { storage: s });
    r.set(2.4);
    expect(s.data.get('fli:a:speed')).toBe('2.5');
    expect(rememberedSpeed('a', 1, { storage: s }).get()).toBe(2.5);
  });

  it('ignores a garbage stored value and a garbage set', () => {
    const s = mem({ 'fli:a:speed': 'banana' });
    const r = rememberedSpeed('a', 1.5, { storage: s });
    expect(r.get()).toBe(1.5);
    r.set(NaN);
    expect(s.data.get('fli:a:speed')).toBe('banana');
  });

  it('never throws on blocked or absent storage', () => {
    const r = rememberedSpeed('a', 2, { storage: blocked, migrateFrom: ['old'] });
    expect(() => r.set(3)).not.toThrow();
    expect(r.get()).toBe(2);
    const none = rememberedSpeed('a', 2, { storage: null });
    none.set(3);
    expect(none.get()).toBe(2);
  });

  it('falls back to globalThis.localStorage, and survives its absence', () => {
    expect(rememberedSpeed('a', 1).get()).toBe(1); // node: no localStorage
    const g = globalThis as { localStorage?: SpeedStorage };
    const s = mem();
    g.localStorage = s;
    try {
      const r = rememberedSpeed('g', 1);
      r.set(3);
      expect(s.data.get('fli:g:speed')).toBe('3');
    } finally {
      delete g.localStorage;
    }
  });

  it('migrates an old key once: write new, remove old', () => {
    const s = mem({ old: '1.5' });
    const r = rememberedSpeed('a', 2, { storage: s, migrateFrom: ['old'] });
    expect(r.get()).toBe(1.5);
    expect(s.data.has('old')).toBe(false);
    expect(s.data.get('fli:a:speed')).toBe('1.5');
    // old key reappearing later is not read again
    s.data.set('old', '4');
    expect(r.get()).toBe(1.5);
    expect(rememberedSpeed('a', 2, { storage: s, migrateFrom: ['old'] }).get()).toBe(1.5);
    expect(s.data.has('old')).toBe(false);
  });

  it('migration never overwrites an existing new key, and takes the first valid old key', () => {
    const s = mem({ 'fli:a:speed': '3', old: '1' });
    expect(rememberedSpeed('a', 2, { storage: s, migrateFrom: ['old'] }).get()).toBe(3);
    expect(s.data.has('old')).toBe(false);
    const t = mem({ o1: 'x', o2: '0.5' });
    expect(rememberedSpeed('a', 2, { storage: t, migrateFrom: ['o1', 'o2'] }).get()).toBe(0.5);
    expect(t.data.size).toBe(1);
  });

  it('migrates on set too', () => {
    const s = mem({ old: '1.5' });
    rememberedSpeed('a', 2, { storage: s, migrateFrom: ['old'] }).set(4);
    expect(s.data.get('fli:a:speed')).toBe('4');
    expect(s.data.has('old')).toBe(false);
  });
});
