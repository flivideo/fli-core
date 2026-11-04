// Key help for the Fli apps, framework-free (no React, no DOM): the keys per screen, grouped by job, plus the
// wording of a tooltip that names its key. One rule behind it: keyboard shortcuts live in tooltips and the ?
// cheat sheet, never as inline text beside a control. FliCut's Help.tsx is the model (flicut, 2026-09-24);
// FliStudio renders these in its `?` sheet. Switching FliCut onto this data is a follow-on.

import { z } from 'zod';

/** A screen that has a help sheet. Add one here, then give it groups in HELP_SCREENS. */
export const HelpScreenId = z.enum([
  'viewer',
  'viewer-triage',
  'storypilot-listen',
  'storypilot-prep',
]);
export type HelpScreenId = z.infer<typeof HelpScreenId>;

/** One row of the sheet: the key(s) and what they do. */
export const HelpRow = z.object({ keys: z.string(), what: z.string() });
export type HelpRow = z.infer<typeof HelpRow>;

export const HelpGroup = z.object({ group: z.string(), rows: z.array(HelpRow) });
export type HelpGroup = z.infer<typeof HelpGroup>;

export const HelpScreen = z.object({ title: z.string(), groups: z.array(HelpGroup) });
export type HelpScreen = z.infer<typeof HelpScreen>;

const row = (keys: string, what: string): HelpRow => ({ keys, what });

const SPEED = row('J K L', 'Slower · back to 1x · faster (0.25x … 4x, half steps)');
const HELP_KEY = row('?', 'This sheet (again, or Esc, to close)');

/** The keys, by screen and job. The `?` row is on every screen. */
export const HELP_SCREENS: Record<HelpScreenId, HelpScreen> = {
  viewer: {
    title: 'Viewer',
    groups: [
      { group: 'Play', rows: [row('Space', 'Play / pause (video and audio)'), SPEED] },
      { group: 'Move', rows: [row('← →', 'Previous / next file'), row('Esc', 'Close the viewer')] },
      { group: 'Help', rows: [HELP_KEY] },
    ],
  },
  // The Footage triage viewer: K is "keep" there, so it is not "back to 1x".
  'viewer-triage': {
    title: 'Viewer (triage)',
    groups: [
      {
        group: 'Play',
        rows: [
          row('Space', 'Play / pause (video and audio)'),
          row('J L', 'Slower · faster (0.25x … 4x, half steps)'),
        ],
      },
      { group: 'Mark', rows: [row('K', 'Keep (again: clear)'), row('X', 'Reject (again: clear)')] },
      { group: 'Move', rows: [row('← →', 'Previous / next file'), row('Esc', 'Close the viewer')] },
      { group: 'Help', rows: [HELP_KEY] },
    ],
  },
  'storypilot-listen': {
    title: 'Story Pilot · Listen',
    groups: [
      { group: 'Play', rows: [row('Space', 'Play / pause'), SPEED] },
      { group: 'Help', rows: [HELP_KEY] },
    ],
  },
  'upload-wizard': {
    title: 'Upload wizard',
    groups: [
      { group: 'Steps', rows: [row('← →', 'Back / next step')] },
      {
        group: 'Copy',
        rows: [
          row('C', 'Copy this step’s text or path'),
          row('S', 'Copy the subtitle file’s path (Subtitles step)'),
        ],
      },
      { group: 'Help', rows: [HELP_KEY] },
    ],
  },
  'storypilot-prep': {
    title: 'Story Pilot · Prep',
    groups: [
      {
        group: 'Angle',
        rows: [
          row('J K L', 'While an angle plays: slower · 1x · faster'),
          row('Enter', 'Save the angle you are editing'),
          row('Esc', 'Cancel the edit'),
        ],
      },
      { group: 'Help', rows: [HELP_KEY] },
    ],
  },
};

/** The groups for a screen, narrowed by a search word (case-insensitive, over group, keys and text). */
export function searchHelp(groups: readonly HelpGroup[], query: string): HelpGroup[] {
  const needle = query.trim().toLowerCase();
  return groups
    .map((g) => ({
      group: g.group,
      rows: g.rows.filter(
        (r) => !needle || `${g.group} ${r.keys} ${r.what}`.toLowerCase().includes(needle),
      ),
    }))
    .filter((g) => g.rows.length > 0);
}

/** A tooltip that names its key: `tip('Play / pause', 'Space')` → "Play / pause (Space)". No key → the text. */
export function tip(what: string, key?: string): string {
  return key ? `${what} (${key})` : what;
}

/** The speed control's tooltip. `triage` leaves K alone (it keeps/rejects there). */
export function speedTip(triage = false): string {
  return triage
    ? 'Playback speed (J slower · L faster)'
    : 'Playback speed (J slower · K 1x · L faster)';
}
