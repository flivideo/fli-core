import { describe, expect, it } from 'vitest';
import { HELP_SCREENS, HelpScreenId, searchHelp, speedTip, tip } from '../src/index.js';

describe('help', () => {
  it('every screen has groups and the ? row', () => {
    for (const id of HelpScreenId.options) {
      const s = HELP_SCREENS[id];
      expect(s.groups.length).toBeGreaterThan(0);
      expect(s.groups.flatMap((g) => g.rows.map((r) => r.keys))).toContain('?');
    }
  });
  it('searchHelp filters rows and drops empty groups', () => {
    const g = HELP_SCREENS.viewer.groups;
    expect(searchHelp(g, '').length).toBe(g.length);
    const hit = searchHelp(g, 'faster');
    expect(hit.map((x) => x.group)).toEqual(['Play']);
    expect(searchHelp(g, 'zzz')).toEqual([]);
  });
  it('tip names its key; speedTip leaves K to keep in triage', () => {
    expect(tip('Play / pause', 'Space')).toBe('Play / pause (Space)');
    expect(tip('Close')).toBe('Close');
    expect(speedTip()).toContain('K 1x');
    expect(speedTip(true)).not.toContain('K');
  });
});
