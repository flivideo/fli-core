import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
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

describe('the browser-safe entry (@flivideo/core/contracts, v0.7.2)', () => {
  it('reaches no node:* module anywhere in its import graph', async () => {
    const seen = new Set<string>();
    const nodeImports: string[] = [];
    const visit = async (file: string): Promise<void> => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const spec of specifiers(await fs.readFile(file, 'utf8'))) {
        if (spec.startsWith('node:')) nodeImports.push(`${path.relative(SRC, file)} → ${spec}`);
        else if (spec.startsWith('.'))
          await visit(path.resolve(path.dirname(file), spec.replace(/\.js$/, '.ts')));
      }
    };
    await visit(path.join(SRC, 'contracts.ts'));
    expect(seen.size).toBeGreaterThan(5);
    expect(nodeImports).toEqual([]);
  });

  it('is a subset of the main entry, and carries the agent-drivable layer', async () => {
    const contracts = (await import('../src/contracts.js')) as Record<string, unknown>;
    const main = core as Record<string, unknown>;
    expect(Object.keys(contracts).filter((k) => contracts[k] !== main[k])).toEqual([]);
    for (const name of [
      'defineCapability',
      'authorize',
      'SUITE_FAILURE_CODES',
      'AppBusyDetails',
      'SystemStatus',
      'LIFECYCLE_CAPABILITIES',
      'toOpenRpc',
      'answerJsonRpc',
      'renderApiPage',
      'parseAppFile',
      'parseRecording',
    ]) {
      expect(contracts[name], name).toBeDefined();
    }
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

  it('exports every data shape as a zod schema under its type name (spec §10, F4)', () => {
    const schemas = [
      'InvalidFile',
      'Brand',
      'BrandsFile',
      'BrandsRead',
      'ReadBrandsResult',
      'SkippedBrand',
      'ProjectIdentity',
      'ReadIdentityResult',
      'WriteIdentityResult',
      'ProjectCode',
      'ProjectFolder',
      'Recording',
      'VideoFile',
      'UnknownVideoFile',
      'ParsedVideoFile',
      'VideoFolder',
      'VideoFolderName',
      'ProjectAspect',
      'ProjectShape',
      'WindowRect',
      'SavedWindow',
      'WindowStateFile',
      'DisplayArea',
      'AppFile',
      'ProjectZone',
      'MemberProject',
      'OtherFolder',
      'ArchivedEntry',
      'ProjectListing',
      'ResolveProjectResult',
      'NextCodeResult',
      'BrandSettings',
      'ReadBrandSettingsResult',
      'MachineSettings',
      'ResolvedMachineSettings',
      'MachineSettingsResult',
      'LabPathInput',
      'OpenArgName',
      'OpenArgs',
      'RawOpenArgs',
      'ParsedOpenArgs',
      'OpenContext',
      'OpenContextResult',
      'ProjectRefusal',
      'PrincipalKind',
      'PrincipalName',
      'CapabilityKind',
      'SideEffects',
      'CapabilityMeta',
      'Refusal',
      'FailureCodeTable',
      'ForbiddenDetails',
      'MissingDetails',
      'BusyWork',
      'AppBusyDetails',
      'ControlFile',
      'ControlFileRead',
      'OpenRpcDocument',
      'OpenRpcServer',
      'JsonRpcRequest',
      'SystemStatus',
      'SystemQuitInput',
      'SystemQuitOutput',
      'LifecycleVerb',
      'AppScriptOpen',
      'TranscriptFiles',
      'TranscriptFound',
      'TranscriptJob',
      'TranscriptJobStatus',
    ];
    const exported = core as Record<string, unknown>;
    expect(schemas.filter((name) => !(exported[name] instanceof z.ZodType))).toEqual([]);
    expect(core.scanned(z.string())).toBeInstanceOf(z.ZodType);
    expect(core.validFile(z.string())).toBeInstanceOf(z.ZodType);
    expect(core.readFileResult(z.string())).toBeInstanceOf(z.ZodType);
  });

  it('src/ declares no hand-written interfaces for data shapes (only option bags)', async () => {
    const declared: string[] = [];
    for (const file of await sourceFiles(SRC)) {
      const source = await fs.readFile(file, 'utf8');
      for (const match of source.matchAll(/export interface (\w+)/g))
        declared.push(match[1] as string);
    }
    expect(declared.filter((name) => !name.endsWith('Options')).sort()).toEqual([]);
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
