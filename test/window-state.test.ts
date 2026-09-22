import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  WindowStateFile,
  importWindowState,
  loadWindow,
  placeWindow,
  saveWindow,
  saveWindowSync,
  trackWindow,
  windowKey,
  windowStatePath,
  type DisplayArea,
  type TrackedWindow,
  type WindowRect,
} from '../src/window-state.js';
import { tempDir } from './helpers/fixtures.js';

// A laptop (primary) with a second monitor to its right.
const MAIN: DisplayArea = {
  id: 1,
  primary: true,
  workArea: { x: 0, y: 25, width: 1512, height: 920 },
};
const SECOND: DisplayArea = { id: 2, workArea: { x: 1512, y: 0, width: 2560, height: 1415 } };
const BOTH = [MAIN, SECOND];
const DEFAULTS = { width: 1200, height: 800 };

describe('placeWindow — reopen where David left it (2026-09-22)', () => {
  it('keeps a spot on the second screen exactly, and records which screen', () => {
    const saved = { x: 2000, y: 200, width: 1400, height: 900 };
    expect(placeWindow(saved, BOTH, DEFAULTS)).toEqual({ ...saved, displayId: 2 });
  });

  it('keeps a window that straddles both screens while its title strip can be grabbed', () => {
    const saved = { x: 1300, y: 100, width: 800, height: 600 };
    expect(placeWindow(saved, BOTH, DEFAULTS)).toMatchObject({ x: 1300, y: 100 });
  });

  it('monitor gone → the saved size, centred on the main screen', () => {
    const saved = { x: 2000, y: 200, width: 1000, height: 700, displayId: 2 };
    expect(placeWindow(saved, [MAIN], DEFAULTS)).toEqual({
      x: 256,
      y: 135,
      width: 1000,
      height: 700,
      displayId: 1,
    });
  });

  it('never off-screen: a sliver of title bar, or one above every screen, comes back to the main screen', () => {
    expect(
      placeWindow({ x: 1450, y: 100, width: 800, height: 600 }, [MAIN], DEFAULTS),
    ).toMatchObject({ displayId: 1, x: 356 });
    expect(placeWindow({ x: 100, y: -500, width: 800, height: 600 }, BOTH, DEFAULTS)).toMatchObject(
      { displayId: 1 },
    );
  });

  it('too big for the main screen → clamped to it; never below the minimum', () => {
    expect(placeWindow({ x: 9000, y: 0, width: 3000, height: 2000 }, [MAIN], DEFAULTS)).toEqual({
      x: 0,
      y: 25,
      width: 1512,
      height: 920,
      displayId: 1,
    });
    expect(
      placeWindow({ x: 100, y: 100, width: 200, height: 100 }, [MAIN], {
        ...DEFAULTS,
        minWidth: 640,
        minHeight: 400,
      }),
    ).toMatchObject({ width: 640, height: 400 });
  });

  it('nothing saved → the default size centred on the main screen; no displays → at 0,0', () => {
    expect(placeWindow(undefined, BOTH, DEFAULTS)).toEqual({
      x: 156,
      y: 85,
      width: 1200,
      height: 800,
      displayId: 1,
    });
    expect(placeWindow(null, [], DEFAULTS)).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
  });

  it('keepSize false (a uat harness) restores the monitor and spot but opens at the asked size; maximize comes back', () => {
    expect(
      placeWindow({ x: 2000, y: 200, width: 1400, height: 900, maximized: true }, BOTH, {
        ...DEFAULTS,
        keepSize: false,
      }),
    ).toEqual({ x: 2000, y: 200, width: 1200, height: 800, displayId: 2, maximized: true });
  });
});

describe('the store — one file, keyed by <app>/<role>', () => {
  it('lives at <home>/.fli/window-state.json', () => {
    expect(windowStatePath({ home: '/Users/x' })).toBe('/Users/x/.fli/window-state.json');
    expect(windowStatePath()).toMatch(/\.fli\/window-state\.json$/);
  });

  it('names keys <app>/<role> and refuses anything else', () => {
    expect(windowKey('flicast', 'editor')).toBe('flicast/editor');
    expect(windowKey('teletubby', 'prompter')).toBe('teletubby/prompter');
    expect(() => windowKey('FliCut', 'main')).toThrow(/not a window key/);
    expect(() => windowKey('flicut', 'a/b')).toThrow(/not a window key/);
  });

  it('keeps every app side by side, sync and async saves alike', async () => {
    const file = path.join(await tempDir(), '.fli', 'window-state.json');
    expect(loadWindow('flicut/main', file)).toBeUndefined();
    expect(await saveWindow('flicut/main', { x: 1, y: 2, width: 300, height: 200 }, file)).toBe(
      true,
    );
    expect(
      saveWindowSync(
        'flicast/editor',
        { x: 5, y: 6, width: 700, height: 500, maximized: true },
        file,
      ),
    ).toBe(true);
    expect(loadWindow('flicut/main', file)).toEqual({ x: 1, y: 2, width: 300, height: 200 });
    expect(loadWindow('flicast/editor', file)).toMatchObject({ maximized: true });
    const store = WindowStateFile.parse(JSON.parse(await fs.readFile(file, 'utf8')));
    expect(Object.keys(store.windows)).toEqual(['flicut/main', 'flicast/editor']);
    expect((await fs.readdir(path.dirname(file))).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('a torn or foreign file reads as empty and is rewritten; a bad entry is skipped', async () => {
    const file = path.join(await tempDir(), 'window-state.json');
    await fs.writeFile(file, '{');
    expect(loadWindow('flicut/main', file)).toBeUndefined();
    await fs.writeFile(
      file,
      JSON.stringify({
        schema: 1,
        windows: { 'flicut/main': { x: 1, y: 2, width: 0, height: 5 } },
      }),
    );
    expect(loadWindow('flicut/main', file)).toBeUndefined();
    expect(saveWindowSync('flicut/main', { x: 1, y: 2, width: 3, height: 4 }, file)).toBe(true);
    expect(loadWindow('flicut/main', file)).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it('never throws on a save it cannot make', async () => {
    const dir = await tempDir();
    const blocked = path.join(dir, 'a-file');
    await fs.writeFile(blocked, 'x');
    const file = path.join(blocked, 'window-state.json');
    expect(await saveWindow('flicut/main', { x: 0, y: 0, width: 1, height: 1 }, file)).toBe(false);
    expect(saveWindowSync('flicut/main', { x: 0, y: 0, width: 1, height: 1 }, file)).toBe(false);
    expect(
      importWindowState(
        { editor: { x: 0, y: 0, width: 1, height: 1 } },
        (k) => `flicast/${k}`,
        file,
      ),
    ).toBe(0);
  });
});

describe('importWindowState — FliCast moves its old positions in once', () => {
  it('imports usable entries under their new keys, never overwriting one already saved', async () => {
    const file = path.join(await tempDir(), 'window-state.json');
    saveWindowSync('flicast/editor', { x: 9, y: 9, width: 900, height: 600 }, file);
    const old = {
      editor: { x: 1, y: 1, width: 100, height: 100 },
      'api-console': { x: 2, y: 2, width: 200, height: 200, displayId: 2 },
      hud: { x: 3, y: 3, width: 300, height: 300 },
      broken: { x: 'no' },
    };
    const keyOf = (k: string) =>
      k === 'hud' ? null : `flicast/${k === 'api-console' ? 'console' : k}`;
    expect(importWindowState(old, keyOf, file)).toBe(1);
    expect(loadWindow('flicast/editor', file)).toEqual({ x: 9, y: 9, width: 900, height: 600 });
    expect(loadWindow('flicast/console', file)).toEqual({
      x: 2,
      y: 2,
      width: 200,
      height: 200,
      displayId: 2,
    });
    expect(importWindowState(old, keyOf, file)).toBe(0);
  });
});

class FakeWindow implements TrackedWindow {
  listeners: Record<string, Array<() => void>> = {};
  bounds: WindowRect = { x: 10, y: 20, width: 800, height: 600 };
  destroyed = false;
  minimized = false;
  fullScreen = false;
  maximized = false;
  on(event: string, listener: () => void) {
    (this.listeners[event] ??= []).push(listener);
    return this;
  }
  emit(event: string) {
    for (const l of this.listeners[event] ?? []) l();
  }
  isDestroyed = () => this.destroyed;
  isMinimized = () => this.minimized;
  isFullScreen = () => this.fullScreen;
  isMaximized = () => this.maximized;
  getNormalBounds = () => this.bounds;
}

describe('trackWindow — save on move, resize and close', () => {
  it('saves once a move settles, and synchronously on close', async () => {
    const file = path.join(await tempDir(), 'window-state.json');
    const win = new FakeWindow();
    trackWindow(win, 'teletubby/prompter', { file, debounceMs: 10, displayIdOf: () => 2 });
    win.bounds = { x: 2000, y: 100, width: 640, height: 480 };
    win.emit('move');
    win.emit('resize');
    await vi.waitFor(() =>
      expect(loadWindow('teletubby/prompter', file)).toMatchObject({ x: 2000 }),
    );
    expect(loadWindow('teletubby/prompter', file)).toEqual({
      x: 2000,
      y: 100,
      width: 640,
      height: 480,
      displayId: 2,
    });
    win.bounds = { x: 2100, y: 100, width: 640, height: 480 };
    win.maximized = true;
    win.emit('close');
    expect(loadWindow('teletubby/prompter', file)).toEqual({
      x: 2100,
      y: 100,
      width: 640,
      height: 480,
      maximized: true,
      displayId: 2,
    });
  });

  it('saves nothing while minimized, full screen or destroyed; the returned function cancels a pending save', async () => {
    const file = path.join(await tempDir(), 'window-state.json');
    const win = new FakeWindow();
    const cancel = trackWindow(win, 'flicut/main', { file, debounceMs: 5 });
    win.minimized = true;
    win.emit('close');
    win.minimized = false;
    win.fullScreen = true;
    win.emit('close');
    win.fullScreen = false;
    win.destroyed = true;
    win.emit('close');
    win.destroyed = false;
    win.emit('move');
    cancel();
    await new Promise((r) => setTimeout(r, 30));
    expect(loadWindow('flicut/main', file)).toBeUndefined();
  });

  it('never throws out of a listener: a window or display lookup that fails, or a store it cannot write', async () => {
    const dir = await tempDir();
    const win = new FakeWindow();
    trackWindow(win, 'flicut/main', {
      file: path.join(dir, 'window-state.json'),
      debounceMs: 5,
      displayIdOf: () => {
        throw new Error('display gone');
      },
    });
    expect(() => win.emit('close')).not.toThrow();
    win.emit('move');
    await new Promise((r) => setTimeout(r, 30));
    await fs.writeFile(path.join(dir, 'a-file'), 'x');
    const blocked = new FakeWindow();
    trackWindow(blocked, 'flicut/main', { file: path.join(dir, 'a-file', 'window-state.json') });
    expect(() => blocked.emit('close')).not.toThrow();
  });
});
