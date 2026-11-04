import type { ReactElement } from 'react';
import { speedTip, tip } from '../help.js';
import { FORWARD_SPEEDS, speedWindow } from '../transport.js';

/**
 * The shared speed control (v0.32.0): `[‹] [0.75x] [1x] [1.5x] [›]`. Three rungs of the ladder are visible, centred on
 * the current rate; the chevrons step the RATE one rung exactly like J / L (the window follows); at 0.25× / 4× the window
 * pins and that chevron greys out. Controlled and presentational — it binds no keys (J / K / L stay in each player,
 * through `jkl()`). Unstyled apart from `speed.css`; every colour is a CSS variable the app supplies. Tooltips carry the
 * keys, no inline key text (the help rule).
 */
export type SpeedControlProps = {
  /** The current playback rate. */
  value: number;
  /** The user picked a rung or a chevron. */
  onChange: (rate: number) => void;
  /** Rungs on show (default 3). */
  visible?: number;
  /** The ladder (default `FORWARD_SPEEDS`). */
  ladder?: readonly number[];
  /** No media loaded: everything greys out. */
  disabled?: boolean;
  /** Footage triage: K keeps there, so the tooltip drops "K 1x". */
  triage?: boolean;
  /** Extra content after the right chevron (FliCut's reverse badge). */
  trailing?: ReactElement | null;
  className?: string;
  'data-testid'?: string;
};

/** The label a rung wears: `0.25x`, `1x`, `4x`. */
export const rateLabel = (rate: number): string => `${+rate.toFixed(2)}x`;

export function SpeedControl({
  value,
  onChange,
  visible = 3,
  ladder = FORWARD_SPEEDS,
  disabled = false,
  triage = false,
  trailing = null,
  className,
  'data-testid': testId,
}: SpeedControlProps): ReactElement {
  const w = speedWindow(ladder, value, visible);
  const step = (d: 1 | -1): void => {
    const next = ladder[w.index + d];
    if (next !== undefined) onChange(next);
  };
  const slower = disabled || !w.canBack;
  const faster = disabled || !w.canForward;
  const cls = ['fli-speed', disabled ? 'is-disabled' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const edge = (dir: 'slower' | 'faster', off: boolean, glyph: string): ReactElement => (
    <button
      type="button"
      className={`fli-speed__edge fli-speed__edge--${dir}${off ? ' is-disabled' : ''}`}
      disabled={off}
      aria-disabled={off}
      aria-label={dir === 'slower' ? 'Slower' : 'Faster'}
      title={tip(dir === 'slower' ? 'Slower' : 'Faster', dir === 'slower' ? 'J' : 'L')}
      data-testid={testId ? `${testId}-${dir}` : undefined}
      onClick={() => step(dir === 'slower' ? -1 : 1)}
    >
      {glyph}
    </button>
  );
  return (
    <div
      role="group"
      className={cls}
      title={speedTip(triage)}
      aria-label={speedTip(triage)}
      data-testid={testId}
    >
      {edge('slower', slower, '‹')}
      {w.rates.map((r, i) => {
        const active = w.exact && w.start + i === w.index;
        return (
          <button
            key={r}
            type="button"
            className={`fli-speed__rate${active ? ' is-active' : ''}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(r)}
          >
            {rateLabel(r)}
          </button>
        );
      })}
      {edge('faster', faster, '›')}
      {trailing}
    </div>
  );
}
