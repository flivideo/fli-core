import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as core from '../src/index.js';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(full)));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

/** Every module specifier in a file: static imports, re-exports, side-effect imports, dynamic import() and require(). */
export function specifiers(source: string): string[] {
  const patterns = [
    /\bimport\s+(?:type\s+)?[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  return patterns.flatMap((pattern) =>
    [...source.matchAll(pattern)].map((match) => match[1] as string),
  );
}

const allowed = (specifier: string): boolean =>
  specifier.startsWith('./') ||
  specifier.startsWith('../') ||
  specifier === 'zod' ||
  specifier.startsWith('node:');

describe('architecture: zero app imports (spec §10)', () => {
  it('src/**/*.ts imports only relative modules, zod and node:*', async () => {
    const files = await sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(5);
    const offenders: string[] = [];
    for (const file of files) {
      const found = specifiers(await fs.readFile(file, 'utf8'));
      expect(found.length, `${file} should import something`).toBeGreaterThan(0);
      for (const specifier of found.filter((s) => !allowed(s))) {
        offenders.push(`${path.relative(SRC, file)} → ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the scanner catches every import form it guards against', () => {
    const sample = [
      "import { a } from '@appydave/core';",
      "import type { B } from 'flihub/shared/naming';",
      "export { c } from 'lodash';",
      "import 'side-effect';",
      "const d = await import('fs');",
      "const e = require('path');",
      "import { z } from 'zod';",
      "import fs from 'node:fs';",
      "import { x } from './x.js';",
    ].join('\n');
    expect(specifiers(sample).filter((s) => !allowed(s))).toEqual([
      '@appydave/core',
      'flihub/shared/naming',
      'lodash',
      'side-effect',
      'fs',
      'path',
    ]);
  });

  it('the package depends on zod only at runtime', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(SRC, '..', 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies ?? {})).toEqual(['zod']);
  });
});

describe('public surface (spec §4)', () => {
  it('exports every spec §4 function and schema', () => {
    const expected = [
      'Brand',
      'readBrands',
      'resolveBrandRoot',
      'ProjectIdentity',
      'readIdentity',
      'writeIdentity',
      'parseProjectFolder',
      'parseRecording',
      'recordingFileName',
      'parseVideoFile',
      'videoFileName',
      'parseAppFile',
      'appFileName',
      'classifyProjectEntry',
      'listProjects',
      'resolveProject',
      'nextCode',
      'BrandSettings',
      'readBrandSettings',
      'MachineSettings',
      'readMachineSettings',
      'labPath',
      'OpenContext',
      'parseOpenArgs',
    ];
    const exported = core as Record<string, unknown>;
    expect(expected.filter((name) => exported[name] === undefined)).toEqual([]);
  });

  it('does not leak internals', () => {
    const exported = Object.keys(core);
    for (const internal of [
      'atomicWrite',
      'readJsonFile',
      'parseOrThrow',
      'issuesOf',
      'errorCode',
    ]) {
      expect(exported).not.toContain(internal);
    }
  });
});
