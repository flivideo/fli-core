import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SpeedControl, rateLabel, type SpeedControlProps } from '../src/ui/index.js';

const html = (props: Partial<SpeedControlProps> & { value: number }): string =>
  renderToStaticMarkup(createElement(SpeedControl, { onChange: () => {}, ...props }));
const rungs = (markup: string): string[] =>
  [...markup.matchAll(/fli-speed__rate[^>]*>([^<]+)</g)].map((m) => m[1] as string);

// renderToStaticMarkup cannot click, so the handlers are read off the element tree.
type El = { props: Record<string, unknown> & { children?: unknown } };
function tree(props: Partial<SpeedControlProps> & { value: number }): El[] {
  const root = SpeedControl({ onChange: () => {}, ...props }) as unknown as El;
  const kids = (root.props.children as unknown[]).flat() as El[];
  return kids.filter(Boolean);
}
const clickable = (kids: El[], aria: string): El =>
  kids.find((k) => k.props['aria-label'] === aria) as El;

describe('SpeedControl', () => {
  it('shows three rungs by default, centred, with the active one pressed', () => {
    const m = html({ value: 1 });
    expect(rungs(m)).toEqual(['0.75x', '1x', '1.5x']);
    expect(m).toMatch(/is-active"[^>]*aria-pressed="true"[^>]*>1x</);
    expect(m.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it('honours visible, and pins at the edges with the right chevron greyed', () => {
    expect(rungs(html({ value: 1, visible: 5 }))).toHaveLength(5);
    const low = html({ value: 0.25 });
    expect(rungs(low)).toEqual(['0.25x', '0.5x', '0.75x']);
    expect(low).toMatch(/fli-speed__edge--slower is-disabled"[^>]*disabled=""/);
    expect(low).not.toMatch(/fli-speed__edge--faster is-disabled/);
    const high = html({ value: 4 });
    expect(rungs(high)).toEqual(['3x', '3.5x', '4x']);
    expect(high).toMatch(/fli-speed__edge--faster is-disabled/);
  });

  it('lights no rung for an off-ladder rate', () => {
    expect(html({ value: 1.25 })).not.toContain('aria-pressed="true"');
  });

  it('carries the keys in tooltips and no key text inline', () => {
    const m = html({ value: 1 });
    expect(m).toContain('title="Playback speed (J slower · K 1x · L faster)"');
    expect(m).toContain('title="Slower (J)"');
    expect(m).toContain('title="Faster (L)"');
    expect(html({ value: 1, triage: true })).toContain(
      'title="Playback speed (J slower · L faster)"',
    );
    expect(m.replace(/<[^>]*>/g, '')).toBe('‹0.75x1x1.5x›');
  });

  it('chevrons step the rate one rung, like J / L; a rung picks itself', () => {
    const onChange = vi.fn();
    const kids = tree({ value: 1, onChange });
    (clickable(kids, 'Slower').props['onClick'] as () => void)();
    (clickable(kids, 'Faster').props['onClick'] as () => void)();
    expect(onChange.mock.calls).toEqual([[0.75], [1.5]]);
    const rung = kids.find((k) => k.props['aria-pressed'] === false) as El;
    (rung.props['onClick'] as () => void)();
    expect(onChange).toHaveBeenLastCalledWith(0.75);
  });

  it('a chevron at the pin does nothing; an off-ladder rate steps from the nearest rung', () => {
    const onChange = vi.fn();
    (clickable(tree({ value: 4, onChange }), 'Faster').props['onClick'] as () => void)();
    expect(onChange).not.toHaveBeenCalled();
    (clickable(tree({ value: 1.25, onChange }), 'Faster').props['onClick'] as () => void)();
    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  it('disabled greys out everything; trailing, className, testid and a custom ladder pass through', () => {
    const m = html({ value: 1, disabled: true });
    expect(m).toContain('fli-speed is-disabled');
    expect(m.match(/disabled=""/g)).toHaveLength(5);
    const x = html({
      value: 2,
      ladder: [1, 2, 4],
      className: 'mine',
      'data-testid': 'sp',
      trailing: createElement('span', { className: 'rev' }, '◀ 8×'),
    });
    expect(rungs(x)).toEqual(['1x', '2x', '4x']);
    expect(x).toContain('class="fli-speed mine"');
    expect(x).toContain('data-testid="sp"');
    expect(x).toContain('data-testid="sp-slower"');
    expect(x.endsWith('◀ 8×</span></div>')).toBe(true);
  });

  it('rateLabel trims', () => {
    expect([0.25, 1, 3.5].map(rateLabel)).toEqual(['0.25x', '1x', '3.5x']);
  });
});
