import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  CapabilityRefusal,
  JSONRPC_CODES,
  LIFECYCLE_CAPABILITIES,
  OpenRpcDocument,
  SUITE_FAILURE_CODES,
  SUITE_REFUSAL_DETAILS,
  answerJsonRpc,
  appScriptArgs,
  assertAppendOnly,
  authorize,
  bearerMatches,
  controlFilePath,
  defineCapabilities,
  defineCapability,
  defineFailureCodes,
  describeCapabilities,
  failureCode,
  isHumanOnly,
  newControlToken,
  nextFailureCode,
  openRpcText,
  pidAlive,
  principalKind,
  readControlFile,
  removeControlFile,
  renderApiPage,
  requiredFields,
  toOpenRpc,
  writeControlFile,
  type CallAnswer,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

const TrashInput = z.object({
  brand: z.string(),
  project: z.string(),
  confirm: z.boolean().optional(),
});
const MigrateInput = z.object({ project: z.string(), apply: z.boolean().optional() });

const SET = defineCapabilities({
  'project.list': defineCapability({
    kind: 'query',
    description: 'List projects.',
    input: z.object({ brand: z.string().describe('Brand key') }),
    output: z.array(z.string()),
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: ['unknown-brand'],
  }),
  'project.empty-trash': defineCapability({
    kind: 'command',
    description: 'Delete inside -trash/.',
    input: TrashInput,
    output: z.object({ removed: z.number() }),
    sideEffects: 'destructive',
    idempotent: true,
    confirmationRequired: true,
    failureModes: ['confirm-required'],
    humanOnly: true,
  }),
  'project.migrate-layout': defineCapability({
    kind: 'command',
    description: 'Dry run for anyone; apply is a person’s.',
    input: MigrateInput,
    output: z.object({ moved: z.boolean() }),
    sideEffects: 'reversible-write',
    idempotent: false,
    confirmationRequired: true,
    failureModes: [],
    humanOnly: { when: (i) => i.apply === true, note: 'apply: true' },
  }),
  'agent.only': defineCapability({
    kind: 'query',
    description: 'Only agents.',
    input: z.object({}),
    output: z.null(),
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [],
    principals: ['agent'],
  }),
});

/** The value, or a failed test naming what was missing (the lint forbids `!`). */
function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`expected ${what}`);
  return value;
}

const scalarVerb = () =>
  defineCapability({
    kind: 'query',
    description: 'Takes a string.',
    input: z.string(),
    output: z.null(),
    sideEffects: 'read-only',
    idempotent: true,
    confirmationRequired: false,
    failureModes: [],
  });

const CODES = defineFailureCodes({
  'unknown-capability': JSONRPC_CODES.methodNotFound,
  'invalid-input': JSONRPC_CODES.invalidParams,
  internal: JSONRPC_CODES.internalError,
  'confirm-required': -32002,
});

describe('defineCapability — the contract', () => {
  it('fills defaults: every principal, not human-only, fast', () => {
    const list = SET['project.list'];
    expect(list.principals).toEqual(['human', 'agent', 'cli']);
    expect(list.humanOnly).toBe(false);
    expect(list.expectedDuration).toBe('fast');
  });

  it('a human-only verb allows the human alone', () => {
    expect(SET['project.empty-trash'].principals).toEqual(['human']);
  });

  it('refuses a declaration that contradicts itself', () => {
    const base = {
      kind: 'query' as const,
      description: 'x',
      input: z.object({}),
      output: z.null(),
      sideEffects: 'read-only' as const,
      idempotent: true,
      confirmationRequired: false,
      failureModes: [],
    };
    expect(() =>
      defineCapability({ ...base, humanOnly: true, principals: ['human', 'agent'] }),
    ).toThrow(/human-only but allows/);
    expect(() => defineCapability({ ...base, principals: [] })).toThrow(/no principal/);
  });

  it('names must be family.verb', () => {
    expect(() => defineCapabilities({ nodot: SET['project.list'] })).toThrow(/family\.verb/);
    expect(() => defineCapabilities({ 'Bad.verb': SET['project.list'] })).toThrow();
  });

  it('knows the required fields', () => {
    expect(requiredFields(SET['project.empty-trash'])).toEqual(['brand', 'project']);
    const scalar = scalarVerb();
    expect(requiredFields(scalar)).toEqual([]);
  });
});

describe('authorize — the ★ fence', () => {
  it('reads principal names', () => {
    expect(principalKind('human')).toBe('human');
    expect(principalKind('human:ui')).toBe('human');
    expect(principalKind('agent:claude')).toBe('agent');
    expect(principalKind('cli')).toBe('cli');
    expect(principalKind('agent')).toBeNull();
    expect(principalKind('root')).toBeNull();
  });

  it('lets anyone call an open verb', () => {
    for (const p of ['human:ui', 'agent:x', 'cli']) {
      expect(authorize('project.list', SET['project.list'], p)).toMatchObject({ ok: true });
    }
  });

  it('refuses agents and the CLI on a human-only verb, with typed details', () => {
    const answer = authorize('project.empty-trash', SET['project.empty-trash'], 'agent:claude');
    expect(answer.ok).toBe(false);
    if (answer.ok) return;
    expect(answer.refusal.failureMode).toBe('forbidden');
    expect(SUITE_REFUSAL_DETAILS.forbidden.parse(answer.refusal.details)).toEqual({
      capability: 'project.empty-trash',
      principal: 'agent:claude',
      allowed: ['human'],
      humanOnly: true,
    });
    expect(authorize('project.empty-trash', SET['project.empty-trash'], 'cli').ok).toBe(false);
    expect(authorize('project.empty-trash', SET['project.empty-trash'], 'human:ui').ok).toBe(true);
  });

  it('fences by input: a dry run is open, apply is a person’s', () => {
    const c = SET['project.migrate-layout'];
    expect(authorize('project.migrate-layout', c, 'agent:x', { project: 'a' }).ok).toBe(true);
    const applied = authorize('project.migrate-layout', c, 'agent:x', {
      project: 'a',
      apply: true,
    });
    expect(applied.ok).toBe(false);
    if (!applied.ok) expect(applied.refusal.message).toMatch(/apply: true/);
    expect(authorize('project.migrate-layout', c, 'human', { project: 'a', apply: true }).ok).toBe(
      true,
    );
    expect(isHumanOnly(c)).toBe(false);
  });

  it('refuses a kind the verb does not list, and a name that is no principal', () => {
    expect(authorize('agent.only', SET['agent.only'], 'human:ui').ok).toBe(false);
    expect(authorize('agent.only', SET['agent.only'], 'agent:x').ok).toBe(true);
    const bogus = authorize('project.list', SET['project.list'], 'nobody');
    expect(bogus.ok).toBe(false);
    if (!bogus.ok) expect(bogus.refusal.message).toMatch(/not a principal/);
  });
});

describe('failure codes — frozen integers', () => {
  it('keeps the numbers FliCast published for the suite names', () => {
    expect(SUITE_FAILURE_CODES).toMatchObject({
      forbidden: -32001,
      missing: -32013,
      'no-brand-root': -32014,
      'not-a-project': -32029,
      'project-ambiguous': -32037,
      'project-not-found': -32038,
      'registry-unreadable': -32040,
      unauthorized: -32042,
      'unknown-brand': -32043,
      'video-invalid': -32045,
      'video-not-found': -32046,
      'app-busy': -32049,
    });
    expect(Object.isFrozen(SUITE_FAILURE_CODES)).toBe(true);
  });

  it('merges an app table and refuses a bad one', () => {
    expect(CODES['confirm-required']).toBe(-32002);
    expect(CODES.forbidden).toBe(-32001);
    expect(() => defineFailureCodes({ forbidden: -32005 })).toThrow(/suite refusal at -32001/);
    expect(() => defineFailureCodes({ mine: -32001 })).toThrow(/already forbidden/);
    expect(() => defineFailureCodes({ a: -32050, b: -32050 })).toThrow(/already a/);
    expect(() => defineFailureCodes({ far: 7 })).toThrow(/neither/);
    expect(defineFailureCodes({ forbidden: -32001 }).forbidden).toBe(-32001);
  });

  it('answers internal for an unknown name and finds the next free number', () => {
    expect(failureCode(CODES, 'nope')).toBe(JSONRPC_CODES.internalError);
    expect(nextFailureCode(CODES)).toBe(-32003);
    const full = Object.fromEntries(Array.from({ length: 99 }, (_, i) => [`n${i}`, -32001 - i]));
    expect(() => nextFailureCode(full)).toThrow(/full/);
  });

  it('assertAppendOnly names every broken promise', () => {
    expect(assertAppendOnly({ a: -32002 }, { a: -32002, b: -32003 })).toEqual([]);
    expect(assertAppendOnly({ a: -32002, b: -32003 }, { a: -32004 })).toEqual([
      'a was -32002, now -32004',
      'b (-32003) was removed',
    ]);
  });

  it('CapabilityRefusal carries the refusal as data', () => {
    expect(new CapabilityRefusal('app-busy', 'Recording.', { busy: [] }).toRefusal()).toEqual({
      failureMode: 'app-busy',
      message: 'Recording.',
      details: { busy: [] },
    });
    expect(new CapabilityRefusal('missing', 'x').toRefusal()).toEqual({
      failureMode: 'missing',
      message: 'x',
    });
  });
});

describe('control file — {port, token, pid}', () => {
  it('lives where the Electron apps already put it', () => {
    expect(controlFilePath('flicut', { home: '/h' })).toBe(
      '/h/Library/Application Support/flicut/control.json',
    );
    expect(() => controlFilePath('../x')).toThrow();
  });

  it('writes 0600, reads live, removes only its own', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'app', 'control.json');
    const token = newControlToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    await writeControlFile(file, { port: 7151, token, pid: process.pid });
    expect((await fs.stat(file)).mode & 0o777).toBe(0o600);
    expect(await readControlFile(file)).toMatchObject({
      kind: 'live',
      control: { port: 7151, token },
    });
    expect(await removeControlFile(file, process.pid + 1)).toBe(false);
    expect(await removeControlFile(file)).toBe(true);
    expect(await readControlFile(file)).toEqual({ kind: 'absent', path: file });
    expect(await removeControlFile(file)).toBe(false);
  });

  it('a file whose process is gone is stale, never a door', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'control.json');
    await fs.writeFile(file, JSON.stringify({ port: 1, token: 'x'.repeat(16), pid: 2 ** 22 + 1 }));
    expect((await readControlFile(file)).kind).toBe('stale');
    await fs.writeFile(file, JSON.stringify({ port: 1, token: 'x'.repeat(16) }));
    expect((await readControlFile(file)).kind).toBe('live');
  });

  it('reads an unusable file as invalid', async () => {
    const dir = await tempDir();
    const file = path.join(dir, 'control.json');
    await fs.writeFile(file, '{');
    expect((await readControlFile(file)).kind).toBe('invalid');
    await fs.writeFile(file, JSON.stringify({ port: 'x' }));
    expect((await readControlFile(file)).kind).toBe('invalid');
    expect((await readControlFile(dir)).kind).toBe('invalid');
  });

  it('pidAlive and bearerMatches', () => {
    expect(pidAlive(process.pid)).toBe(true);
    expect(pidAlive(2 ** 22 + 1)).toBe(false);
    expect(pidAlive(1)).toBe(true);
    const t = newControlToken();
    expect(bearerMatches(`Bearer ${t}`, t)).toBe(true);
    expect(bearerMatches(`bearer ${t}`, t)).toBe(true);
    expect(bearerMatches(`Bearer ${t}x`, t)).toBe(false);
    expect(bearerMatches(undefined, t)).toBe(false);
    expect(bearerMatches(t, t)).toBe(false);
  });
});

describe('OpenRPC — one generator', () => {
  const doc = toOpenRpc({
    title: 'Test API',
    version: '1.0.0+api1',
    description: 'A test.',
    servers: [{ name: 'loopback', url: 'http://127.0.0.1:{port}/api/rpc' }],
    capabilities: SET,
    codes: CODES,
    refusalDetails: SUITE_REFUSAL_DETAILS,
    generatedBy: 'test',
  });

  it('is a valid document with every method, sorted', () => {
    expect(OpenRpcDocument.parse(doc).methods.map((m) => m.name)).toEqual([
      'agent.only',
      'project.empty-trash',
      'project.list',
      'project.migrate-layout',
    ]);
    expect(doc.info.description).toMatch(/2 are human-only/);
  });

  it('carries the fence, principals and typed refusals', () => {
    const trash = must(doc.methods.find((m) => m.name === 'project.empty-trash'));
    expect(trash['x-human-only']).toBe(true);
    expect(trash['x-principals']).toEqual(['human']);
    expect(trash.errors.map((e) => [e.message, e.code])).toEqual([
      ['forbidden', -32001],
      ['confirm-required', -32002],
    ]);
    const forbidden = trash.errors[0] as unknown as {
      data: { properties: { details: { properties: object } } };
    };
    expect(Object.keys(forbidden.data.properties.details.properties)).toContain('humanOnly');
    const migrate = must(doc.methods.find((m) => m.name === 'project.migrate-layout'));
    expect(migrate['x-human-only']).toEqual({ when: 'apply: true' });
    const list = must(doc.methods.find((m) => m.name === 'project.list'));
    expect(list.params).toEqual([
      expect.objectContaining({ name: 'brand', required: true, summary: 'Brand key' }),
    ]);
  });

  it('describes a non-object input as one param', () => {
    const scalar = toOpenRpc({
      title: 't',
      version: '1',
      servers: [],
      capabilities: { 'x.y': scalarVerb() },
      codes: CODES,
    });
    expect(must(scalar.methods[0]).params).toEqual([
      expect.objectContaining({ name: 'input', required: true }),
    ]);
    expect(scalar['x-generated-by']).toBeUndefined();
  });

  it('is deterministic text', () => {
    const again = toOpenRpc({
      title: 'Test API',
      version: '1.0.0+api1',
      description: 'A test.',
      servers: [{ name: 'loopback', url: 'http://127.0.0.1:{port}/api/rpc' }],
      capabilities: SET,
      codes: CODES,
      refusalDetails: SUITE_REFUSAL_DETAILS,
      generatedBy: 'test',
    });
    expect(openRpcText(again)).toBe(openRpcText(doc));
    expect(openRpcText(doc).endsWith('}\n')).toBe(true);
  });

  it('describeCapabilities gives JSON Schemas', () => {
    const meta = must(describeCapabilities(SET).find((m) => m.name === 'project.list'));
    expect(meta).toMatchObject({ family: 'project', required: ['brand'], humanOnly: false });
    expect((meta.input as { type: string }).type).toBe('object');
  });
});

describe('answerJsonRpc — the JSON-RPC 2.0 door', () => {
  const seam = async (method: string, params: Record<string, unknown>): Promise<CallAnswer> => {
    if (method === 'boom') throw new Error('kaput');
    if (method === 'echo') return { ok: true, value: params };
    if (method === 'trash')
      return {
        ok: false,
        error: { failureMode: 'forbidden', message: 'No.', details: { humanOnly: true } },
      };
    if (method === 'plain')
      return { ok: false, error: { failureMode: 'confirm-required', message: 'Ask.' } };
    return { ok: false, error: { failureMode: 'unknown-capability', message: `No ${method}.` } };
  };
  const answer = (body: unknown) => answerJsonRpc(body, seam, { codes: CODES });

  it('answers a result', async () => {
    expect(await answer({ jsonrpc: '2.0', id: 1, method: 'echo', params: { a: 1 } })).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { a: 1 },
    });
    expect(await answer({ jsonrpc: '2.0', id: 'x', method: 'echo' })).toMatchObject({ result: {} });
  });

  it('maps a named refusal to its code and keeps the name in data', async () => {
    expect(await answer({ jsonrpc: '2.0', id: 2, method: 'trash' })).toEqual({
      jsonrpc: '2.0',
      id: 2,
      error: {
        code: -32001,
        message: 'No.',
        data: { failureMode: 'forbidden', details: { humanOnly: true } },
      },
    });
    expect(await answer({ jsonrpc: '2.0', id: 3, method: 'plain' })).toMatchObject({
      error: { code: -32002, data: { failureMode: 'confirm-required' } },
    });
    expect(await answer({ jsonrpc: '2.0', id: 4, method: 'nope' })).toMatchObject({
      error: { code: -32601 },
    });
  });

  it('uses the standard codes when the app table leaves them out', async () => {
    const bare = await answerJsonRpc({ jsonrpc: '2.0', id: 1, method: 'nope' }, seam, {
      codes: defineFailureCodes({}),
    });
    expect(bare).toMatchObject({ error: { code: -32601 } });
    const renamed = await answerJsonRpc({ jsonrpc: '2.0', id: 1, method: 'boom' }, seam, {
      codes: defineFailureCodes({}),
      names: { internal: 'io-error' },
    });
    expect(renamed).toMatchObject({ error: { code: -32603, data: { failureMode: 'io-error' } } });
  });

  it('refuses positional params, bad requests, and turns a throw into internal', async () => {
    expect(await answer({ jsonrpc: '2.0', id: 5, method: 'echo', params: [1] })).toMatchObject({
      error: { code: -32602, data: { failureMode: 'invalid-input' } },
    });
    expect(await answer({ id: 6, method: 'echo' })).toMatchObject({
      id: 6,
      error: { code: -32600 },
    });
    expect(await answer('nonsense')).toMatchObject({ id: null, error: { code: -32600 } });
    expect(await answer({ jsonrpc: '2.0', id: 7, method: 'boom' })).toMatchObject({
      error: { code: -32603, message: 'kaput' },
    });
  });

  it('handles batches and notifications', async () => {
    expect(await answer({ jsonrpc: '2.0', method: 'echo' })).toBeNull();
    expect(await answer([])).toMatchObject({ error: { code: -32600 } });
    expect(
      await answer([
        { jsonrpc: '2.0', id: 1, method: 'echo' },
        { jsonrpc: '2.0', method: 'echo' },
      ]),
    ).toEqual([{ jsonrpc: '2.0', id: 1, result: {} }]);
    expect(await answer([{ jsonrpc: '2.0', method: 'echo' }])).toBeNull();
  });
});

describe('renderApiPage — reference and console', () => {
  const doc = toOpenRpc({
    title: 'Evil </script><script>alert(1)</script>',
    version: '1',
    servers: [],
    capabilities: SET,
    codes: CODES,
  });

  function embedded(html: string, id: string): unknown {
    const match = new RegExp(`<script id="${id}" type="application/json">(.*?)</script>`, 's').exec(
      html,
    );
    return JSON.parse(must(match?.[1], id));
  }

  it('embeds the document so no string can close its script tag', () => {
    const html = renderApiPage(doc);
    expect(html).not.toContain('</script><script>alert');
    expect(html).toContain('Evil &#60;/script&#62;');
    expect((embedded(html, 'fli-openrpc') as { methods: unknown[] }).methods).toHaveLength(4);
    expect(embedded(html, 'fli-config')).toEqual({
      mode: 'reference',
      rpcPath: null,
      principal: 'agent:console',
      tokenPath: null,
    });
  });

  it('is light-only', () => {
    const html = renderApiPage(doc);
    expect(html).toContain('color-scheme: light');
    expect(html).not.toContain('prefers-color-scheme');
  });

  it('the console knows where to fire and as whom', () => {
    const html = renderApiPage(doc, {
      console: {
        rpcPath: '/api/rpc',
        principal: 'agent:studio-console',
        tokenPath: '/api/session',
      },
      otherPage: { href: '/api/docs', label: 'Reference' },
    });
    expect(embedded(html, 'fli-config')).toEqual({
      mode: 'console',
      rpcPath: '/api/rpc',
      principal: 'agent:studio-console',
      tokenPath: '/api/session',
    });
    expect(html).toContain('<a class="other" href="/api/docs">Reference</a>');
    expect(html).toContain('— console</title>');
  });
});

describe('lifecycle — status, quit, restart', () => {
  it('every app registers the same three contracts', () => {
    expect(Object.keys(LIFECYCLE_CAPABILITIES)).toEqual([
      'system.status',
      'system.quit',
      'system.restart',
    ]);
    const quit = LIFECYCLE_CAPABILITIES['system.quit'];
    expect(authorize('system.quit', quit, 'agent:x', {}).ok).toBe(true);
    expect(authorize('system.quit', quit, 'agent:x', { force: true }).ok).toBe(false);
    expect(
      authorize('system.restart', LIFECYCLE_CAPABILITIES['system.restart'], 'human', {
        force: true,
      }).ok,
    ).toBe(true);
    expect(quit.failureModes).toEqual(['app-busy']);
    expect(SUITE_REFUSAL_DETAILS['app-busy'].parse({ busy: [{ what: 'recording' }] })).toBeTruthy();
  });

  it('builds scripts/app.sh argv', () => {
    expect(appScriptArgs('stop')).toEqual(['stop']);
    expect(appScriptArgs('status', { brand: 'a', project: 'b' })).toEqual(['status']);
    expect(
      appScriptArgs('restart', { brand: 'appydave', project: 'a01-x', video: 'intro' }),
    ).toEqual(['restart', '--brand', 'appydave', '--project', 'a01-x', '--video', 'intro']);
    expect(() => appScriptArgs('start', { brand: '', project: 'b' })).toThrow();
  });
});
