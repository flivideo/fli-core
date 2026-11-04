// Dev-only (not shipped: package "files" is dist). Renders the built SpeedControl in each app's REAL tokens and
// screenshots it at 1x, the 0.25x edge and the 4x edge. Usage:
//   npm run build && node scripts/speed-demo.mjs <outDir> [path-to-playwright-core]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpeedControl } from '../dist/ui/index.js';

const out = path.resolve(process.argv[2] ?? 'speed-demo');
const pw = createRequire(import.meta.url)(
  process.argv[3] ?? '/Users/davidcruwys/dev/ad/flivideo/flistudio/node_modules/playwright-core',
);
mkdirSync(out, { recursive: true });

// Tokens copied from each app's own stylesheet (read 2026-11-04), then mapped to --fli-speed-* once, as the app would.
const SKINS = {
  'flistudio-storypilot': {
    label: 'FliStudio / Story Pilot — AppyDave light (flistudio studio.css .fs-ctl; tokens.css)',
    page: '#faf5ec',
    css: `.skin{background:#f0ebe4;color:#342d2d;font-family:Roboto,'Helvetica Neue',Arial,sans-serif;border-bottom:1px solid #d4cdc4;--fli-speed-bg:#ffffff;--fli-speed-fg:#342d2d;--fli-speed-border:#342d2d;--fli-speed-radius:3px;--fli-speed-hover-bg:#e8e0d4;--fli-speed-active-bg:#342d2d;--fli-speed-active-fg:#faf5ec;--fli-speed-disabled-fg:#686159;--fli-speed-disabled-border:#d4cdc4;--fli-speed-size:13px}`,
  },
  flihub: {
    label:
      'FliHub — Warm Linen (flihub index.css @theme; old buttons: bg-blue-600 active, surface-muted idle)',
    page: '#e8e0d4',
    css: `.skin{background:#f5f1eb;color:#4a3e30;font-family:ui-sans-serif,system-ui,sans-serif;--fli-speed-bg:#eee8de;--fli-speed-fg:#4a3e30;--fli-speed-border:transparent;--fli-speed-radius:4px;--fli-speed-hover-bg:#ede5d8;--fli-speed-active-bg:#2563eb;--fli-speed-active-fg:#ffffff;--fli-speed-disabled-fg:#9a8a78;--fli-speed-disabled-border:transparent;--fli-speed-size:12px}`,
  },
  flicut: {
    label:
      'FliCut — AppyDave brand tokens (flicut index.css; Player control row: brand-border / near-white / linen hover)',
    page: '#faf5ec',
    css: `.skin{background:#faf5ec;color:#7a6e5e;font-family:'Roboto Mono','SF Mono',Menlo,monospace;--fli-speed-bg:#faf5ec;--fli-speed-fg:#342d2d;--fli-speed-border:#d4cdc4;--fli-speed-radius:4px;--fli-speed-hover-bg:#e8e0d4;--fli-speed-active-bg:#342d2d;--fli-speed-active-fg:#faf5ec;--fli-speed-disabled-fg:#b8ae9f;--fli-speed-disabled-border:#e8e0d4;--fli-speed-size:11px}`,
  },
};
const STATES = [
  ['1x', 1, 'Default — 1× lit in the middle'],
  ['0.25x-edge', 0.25, 'Edge — pinned at 0.25×, ‹ greyed'],
  ['4x-edge', 4, 'Edge — pinned at 4×, › greyed'],
];
const css = (await import('node:fs')).readFileSync(
  new URL('../src/ui/speed.css', import.meta.url),
  'utf8',
);
const row = (v) =>
  renderToStaticMarkup(
    createElement(SpeedControl, { value: v, onChange: () => {}, 'data-testid': 'speed' }),
  );

const browser = await pw.chromium.launch();
const shots = [];
for (const [name, skin] of Object.entries(SKINS)) {
  for (const [slug, value, caption] of STATES) {
    const page = await browser.newPage({
      viewport: { width: 560, height: 120 },
      deviceScaleFactor: 2,
    });
    await page.setContent(`<!doctype html><meta charset=utf-8><style>${css}
body{margin:0;padding:14px;background:${skin.page};font:12px system-ui;color:#555}
.skin{display:flex;align-items:center;gap:16px;padding:10px 16px;margin-top:8px}${skin.css}</style>
<div>${skin.label}<br>${caption}</div><div class="skin"><span>Speed</span>${row(value)}</div>`);
    const file = path.join(out, `${name}-${slug}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    await page.close();
  }
}
await browser.close();
writeFileSync(path.join(out, 'files.txt'), shots.join('\n') + '\n');
console.log(shots.join('\n'));
