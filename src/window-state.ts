import { promises as fs, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

/**
 * Window positions that survive a restart (David, 2026-09-22): every Fli app window reopens where he last put it —
 * same monitor, position and size — including the windows a test, uat or scratch-home run opens, which he parks on his
 * second screen while debugging. ONE store for every app and every home, keyed by `<app>/<role>`.
 *
 * Built from FliCut's version (flicut cb7a774) with what FliCast's (flicast 0e952f7) had on top: a minimum size, a
 * "position only" mode for harnesses that need a known size, never-throwing saves, and a one-off import of an older
 * store. Electron-free on purpose (fli-core imports only zod and node:*): the app passes its displays and its window.
 */

export const WindowRect = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type WindowRect = z.infer<typeof WindowRect>;

export const SavedWindow = WindowRect.extend({
  maximized: z.boolean().optional(),
  /** Electron display id the window was on — informational; placement is decided by geometry. */
  displayId: z.number().optional(),
});
export type SavedWindow = z.infer<typeof SavedWindow>;

/** The store: `{ schema: 1, windows: { "<app>/<role>": SavedWindow } }`. */
export const WindowStateFile = z.object({
  schema: z.literal(1),
  windows: z.record(z.string(), SavedWindow),
});
export type WindowStateFile = z.infer<typeof WindowStateFile>;

/** One display as the app sees it: Electron's `display.id`, `display.workArea` and whether it is the primary one. */
export const DisplayArea = z.object({
  id: z.number(),
  /** The display's work area (excludes the menu bar and Dock). */
  workArea: WindowRect,
  primary: z.boolean().optional(),
});
export type DisplayArea = z.infer<typeof DisplayArea>;

export interface PlaceOptions {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  /**
   * `false`: restore the monitor and position but open at `width` × `height` (FliCast's uat harness — its layout
   * stories need a known size). Default `true`: the saved size comes back too.
   */
  keepSize?: boolean;
}

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** At least this much of the window's title strip must be on a display for its spot to count as reachable. */
const GRAB_W = 120;
const GRAB_H = 24;

/**
 * `<home>/.fli/window-state.json`. Without `home`, the account's REAL home (`os.userInfo()`), not `$HOME`: a test or
 * scratch run overrides HOME, and its windows must still remember where David parked them.
 */
export function windowStatePath(options: { home?: string } = {}): string {
  let home = options.home;
  if (!home) {
    try {
      home = os.userInfo().homedir;
    } catch {
      home = os.homedir();
    }
  }
  return path.join(home, '.fli', 'window-state.json');
}

/** The store key for a window: `flicut/main`, `flicast/editor`, `teletubby/prompter`, `flicut/scratch`. */
export function windowKey(app: string, role: string): string {
  const key = `${app}/${role}`;
  if (!KEY.test(key))
    throw new Error(`"${key}" is not a window key: use <app>/<role> in kebab-case.`);
  return key;
}

function overlap(a: WindowRect, b: WindowRect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Where a window opens. A saved spot is kept exactly when its title strip is grabbable on a display that exists now
 * (so it may straddle two monitors, as David leaves it). Otherwise — monitor unplugged, resolution changed, nothing
 * saved — it is centred on the primary display, clamped to fit and never below the minimum. Never off-screen.
 */
export function placeWindow(
  saved: SavedWindow | undefined | null,
  displays: readonly DisplayArea[],
  defaults: PlaceOptions,
): SavedWindow {
  const keepSize = defaults.keepSize ?? true;
  const floor = (w: number, h: number) => ({
    width: Math.max(defaults.minWidth ?? 0, w),
    height: Math.max(defaults.minHeight ?? 0, h),
  });
  const want = floor(
    keepSize && saved ? saved.width : defaults.width,
    keepSize && saved ? saved.height : defaults.height,
  );
  const maximized = saved?.maximized ? { maximized: true } : {};
  if (saved && want.width > 0 && want.height > 0) {
    const strip: WindowRect = { x: saved.x, y: saved.y, width: want.width, height: GRAB_H };
    const on = displays.find((d) => {
      const w =
        Math.min(strip.x + strip.width, d.workArea.x + d.workArea.width) -
        Math.max(strip.x, d.workArea.x);
      return overlap(strip, d.workArea) > 0 && w >= Math.min(GRAB_W, want.width);
    });
    if (on) return { x: saved.x, y: saved.y, ...want, displayId: on.id, ...maximized };
  }
  const main = displays.find((d) => d.primary) ?? displays[0];
  if (!main) return { x: 0, y: 0, ...want, ...maximized };
  const wa = main.workArea;
  const size = floor(Math.min(want.width, wa.width), Math.min(want.height, wa.height));
  return {
    x: Math.round(wa.x + (wa.width - size.width) / 2),
    y: Math.round(wa.y + (wa.height - size.height) / 2),
    ...size,
    displayId: main.id,
    ...maximized,
  };
}

function usable(value: unknown): SavedWindow | undefined {
  const parsed = SavedWindow.safeParse(value);
  return parsed.success &&
    [parsed.data.x, parsed.data.y, parsed.data.width, parsed.data.height].every(Number.isFinite) &&
    parsed.data.width > 0 &&
    parsed.data.height > 0
    ? parsed.data
    : undefined;
}

/** Every usable entry of a store's text; a torn or foreign file reads as empty (it is rewritten on the next save). */
function entries(text: string): Record<string, SavedWindow> {
  try {
    const raw = JSON.parse(text) as { windows?: unknown };
    if (!raw || typeof raw.windows !== 'object' || raw.windows === null) return {};
    const out: Record<string, SavedWindow> = {};
    for (const [key, value] of Object.entries(raw.windows)) {
      const w = usable(value);
      if (w) out[key] = w;
    }
    return out;
  } catch {
    return {};
  }
}

function readSync(file: string): Record<string, SavedWindow> {
  try {
    return entries(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

const serialise = (windows: Record<string, SavedWindow>): string =>
  JSON.stringify({ schema: 1, windows } satisfies WindowStateFile, null, 2);

/** Synchronous, so the bounds are known BEFORE the window is constructed (no flash at the default spot). */
export function loadWindow(key: string, file: string = windowStatePath()): SavedWindow | undefined {
  return readSync(file)[key];
}

/**
 * Save one window: read-modify-write of its key, atomic rename, so several apps (and a test run) saving at once never
 * leave a torn file. Never throws — a window that cannot remember its spot is not worth an error. `false` = not saved.
 */
export async function saveWindow(
  key: string,
  state: SavedWindow,
  file: string = windowStatePath(),
): Promise<boolean> {
  try {
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    const windows = { ...entries(text), [key]: state };
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, serialise(windows));
    await fs.rename(tmp, file);
    return true;
  } catch {
    return false;
  }
}

/** The close-time save: synchronous, because on quit the process may exit before an async write lands. */
export function saveWindowSync(
  key: string,
  state: SavedWindow,
  file: string = windowStatePath(),
): boolean {
  try {
    const windows = { ...readSync(file), [key]: state };
    mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmp, serialise(windows));
    renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
}

/**
 * One-off import of positions an app kept elsewhere (FliCast's `{ "<role>": bounds }` file): each usable entry is
 * written under the key `keyOf` gives it, unless the store already has that key — never overwrites. Returns how many
 * were imported; `keyOf` returning `null` skips an entry.
 */
export function importWindowState(
  old: Record<string, unknown>,
  keyOf: (oldKey: string) => string | null,
  file: string = windowStatePath(),
): number {
  const windows = readSync(file);
  let imported = 0;
  for (const [oldKey, value] of Object.entries(old)) {
    const key = keyOf(oldKey);
    const w = usable(value);
    if (!key || !w || windows[key]) continue;
    windows[key] = w;
    imported++;
  }
  if (imported === 0) return 0;
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmp, serialise(windows));
    renameSync(tmp, file);
    return imported;
  } catch {
    return 0;
  }
}

/**
 * The part of an Electron `BrowserWindow` that `trackWindow` needs. Methods, not data — so a structural type rather
 * than a zod schema; an Electron window satisfies it as it is.
 */
export type TrackedWindow = {
  on(event: 'move' | 'resize' | 'close', listener: () => void): unknown;
  isDestroyed(): boolean;
  isMinimized(): boolean;
  isFullScreen(): boolean;
  isMaximized(): boolean;
  getNormalBounds(): WindowRect;
};

export interface TrackOptions {
  /** `screen.getDisplayMatching(bounds).id`, to record which monitor it was on. */
  displayIdOf?: (bounds: WindowRect) => number;
  file?: string;
  /** Wait this long after the last move/resize before saving; default 400 ms. */
  debounceMs?: number;
}

/**
 * Remember a window from now on: saved after a move or resize settles, and synchronously on close. Normal bounds, so a
 * maximized window keeps its real size; nothing is saved while minimized or full screen. Returns a function that
 * cancels a pending save.
 */
export function trackWindow(
  win: TrackedWindow,
  key: string,
  options: TrackOptions = {},
): () => void {
  const file = options.file ?? windowStatePath();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const current = (): SavedWindow | null => {
    if (win.isDestroyed() || win.isFullScreen() || win.isMinimized()) return null;
    const b = win.getNormalBounds();
    return {
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      ...(options.displayIdOf ? { displayId: options.displayIdOf(b) } : {}),
      ...(win.isMaximized() ? { maximized: true } : {}),
    };
  };
  const later = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const s = current();
      if (s) void saveWindow(key, s, file);
    }, options.debounceMs ?? 400);
  };
  win.on('move', later);
  win.on('resize', later);
  win.on('close', () => {
    clearTimeout(timer);
    const s = current();
    if (s) saveWindowSync(key, s, file);
  });
  return () => clearTimeout(timer);
}
