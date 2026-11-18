/* eslint-disable @typescript-eslint/no-non-null-assertion -- tests index into arrays they just built */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  DESCRIBE_SCHEMA,
  DescribeDocument,
  accessOf,
  defineCapability,
  describeApp,
  exampleOf,
  typeOfSchema,
} from '../src/index.js';

const read = defineCapability({
  kind: 'query',
  description: 'List the things.',
  input: z.object({ brand: z.string().describe('The brand key'), limit: z.number().optional() }),
  output: z.object({ things: z.array(z.string()) }),
  sideEffects: 'read-only',
  idempotent: true,
  confirmationRequired: false,
  failureModes: ['brand-not-found'],
});
const write = defineCapability({
  kind: 'command',
  description: 'Rename a thing.',
  input: z.object({ id: z.string(), to: z.enum(['a', 'b']) }),
  output: z.object({ ok: z.literal(true) }),
  sideEffects: 'reversible-write',
  idempotent: false,
  confirmationRequired: false,
  failureModes: [],
  humanOnly: { when: (i) => i.to === 'b', note: 'to: b' },
});
const job = defineCapability({
  kind: 'task',
  description: 'Render.',
  input: z.object({}),
  output: z.object({ job: z.string() }),
  sideEffects: 'external-side-effect',
  idempotent: false,
  confirmationRequired: true,
  expectedDuration: 'slow',
  failureModes: [],
  humanOnly: true,
});

const facts = (key: string) => ({
  key,
  name: key.toUpperCase(),
  purpose: `${key} is for things.`,
  version: '1.2.3',
  owner: 'team',
});

describe('describeApp', () => {
  const doc = describeApp({
    app: { name: 'demo', version: '0.1.0', gitSha: 'abc1234', machine: 'm2', purpose: 'Demo.' },
    parts: [
      {
        kind: 'core',
        facts: facts('core'),
        capabilities: { 'thing.list': read, 'thing.render': job },
      },
      {
        kind: 'extension',
        facts: {
          ...facts('ext'),
          dataFiles: [{ path: '<project>/ext.json', access: 'read-write', purpose: 'state' }],
        },
        namespace: 'ext',
        stage: 'script',
        contractVersion: 2,
        apps: ['teletubby'],
        capabilities: { 'ext.rename': write },
      },
    ],
    now: new Date('2026-11-18T00:00:00Z'),
  });

  it('is a versioned document that parses back', () => {
    expect(doc.schema).toBe(DESCRIBE_SCHEMA);
    expect(DescribeDocument.parse(doc)).toEqual(doc);
    expect(doc.app).toMatchObject({ name: 'demo', gitSha: 'abc1234', machine: 'm2' });
    expect(doc.parts.map((p) => p.key)).toEqual(['core', 'ext']);
  });

  it('classes a command read / write / long-job and marks the fence', () => {
    const [list, render] = doc.parts[0]!.commands;
    expect(list).toMatchObject({ name: 'thing.list', access: 'read', humanOnly: false });
    expect(render).toMatchObject({ name: 'thing.render', access: 'long-job', humanOnly: true });
    const rename = doc.parts[1]!.commands[0]!;
    expect(rename.access).toBe('write');
    expect(rename.humanOnly).toEqual({ when: 'to: b' });
    expect(doc.totals).toMatchObject({
      parts: 2,
      commands: 3,
      read: 1,
      write: 1,
      longJob: 1,
      humanOnly: 2,
    });
    expect(doc.totals.used).toBeUndefined();
    expect(doc.parts[0]!.commands[0]!.usage).toBeUndefined();
  });

  it('lists inputs with their types and an example request that fits the input', () => {
    const list = doc.parts[0]!.commands[0]!;
    expect(list.inputs).toEqual([
      { name: 'brand', required: true, type: 'string', description: 'The brand key' },
      { name: 'limit', required: false, type: 'number' },
    ]);
    expect(list.output).toBe('object { things }');
    expect(list.example).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'thing.list',
      params: { brand: '<brand>' },
    });
    const rename = doc.parts[1]!.commands[0]!;
    expect(rename.example.params).toEqual({ id: '<id>', to: 'a' });
    expect(rename.inputs[1]!.type).toBe('"a" | "b"');
  });

  it("carries each part's own facts and extension fields", () => {
    const ext = doc.parts[1]!;
    expect(ext).toMatchObject({
      kind: 'extension',
      namespace: 'ext',
      stage: 'script',
      contractVersion: 2,
      apps: ['teletubby'],
      version: '1.2.3',
    });
    expect(ext.dataFiles).toHaveLength(1);
    expect(doc.parts[0]!.dataFiles).toEqual([]);
  });

  it('adds usage per command, zero for the never-called, and totals used / unused', () => {
    const withUsage = describeApp({
      app: { name: 'demo', version: '1', machine: 'm', purpose: 'p' },
      parts: [
        {
          kind: 'core',
          facts: facts('core'),
          capabilities: { 'thing.list': read, 'thing.render': job },
        },
      ],
      usage: {
        'thing.list': {
          calls: 4,
          firstUsed: '2026-11-17T00:00:00.000Z',
          lastUsed: '2026-11-18T00:00:00.000Z',
          lastPrincipal: 'agent:x',
          lastFailureMode: null,
        },
      },
      usageSince: '2026-11-17T00:00:00.000Z',
    });
    const [list, render] = withUsage.parts[0]!.commands;
    expect(list!.usage).toMatchObject({ calls: 4, lastPrincipal: 'agent:x' });
    expect(render!.usage).toEqual({
      calls: 0,
      firstUsed: null,
      lastUsed: null,
      lastPrincipal: null,
      lastFailureMode: null,
    });
    expect(withUsage.totals).toMatchObject({ used: 1, unused: 1 });
    expect(withUsage.usageSince).toBe('2026-11-17T00:00:00.000Z');
  });

  it('refuses a verb two parts both declare', () => {
    expect(() =>
      describeApp({
        app: { name: 'd', version: '1', machine: 'm', purpose: 'p' },
        parts: [
          { kind: 'core', facts: facts('a'), capabilities: { 'x.y': read } },
          { kind: 'extension', facts: facts('b'), capabilities: { 'x.y': read } },
        ],
      }),
    ).toThrow(/declared by both a and b/);
  });
});

describe('helpers', () => {
  it('accessOf', () => {
    expect(accessOf(read)).toBe('read');
    expect(accessOf(write)).toBe('write');
    expect(accessOf(job)).toBe('long-job');
  });

  it('typeOfSchema reads arrays, unions, nesting and unknowns', () => {
    expect(typeOfSchema({ type: 'array', items: { type: 'string' } })).toBe('string[]');
    expect(typeOfSchema({ anyOf: [{ type: 'string' }, { type: 'null' }] })).toBe('string | null');
    expect(typeOfSchema({ const: 'x' })).toBe('"x"');
    expect(typeOfSchema({ type: 'object', properties: { a: {} } }, 1)).toBe('object');
    expect(typeOfSchema({ type: ['string', 'number'] })).toBe('string | number');
    expect(typeOfSchema(undefined)).toBe('any');
    const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`k${i}`, {}]));
    expect(typeOfSchema({ type: 'object', properties: many })).toMatch(/…/);
  });

  it('exampleOf picks defaults, enums, required fields and caps the depth', () => {
    expect(exampleOf({ type: 'string', default: 'z' })).toBe('z');
    expect(exampleOf({ enum: ['q', 'r'] })).toBe('q');
    expect(exampleOf({ type: 'integer', minimum: 3 })).toBe(3);
    expect(exampleOf({ type: 'boolean' })).toBe(true);
    expect(exampleOf({ type: 'null' })).toBeNull();
    expect(exampleOf({ anyOf: [{ type: 'null' }, { type: 'string' }] }, 'n')).toBe('<n>');
    expect(exampleOf({ type: 'array', items: { type: 'number' } })).toEqual([1]);
    expect(
      exampleOf({
        type: 'object',
        required: ['a'],
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      }),
    ).toEqual({ a: '<a>' });
    expect(exampleOf({ type: 'object' })).toEqual({});
  });
});
