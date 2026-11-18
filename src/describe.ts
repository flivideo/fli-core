import { z } from 'zod';
import type { CapabilityMeta} from './capability.js';
import { describeCapabilities, type CapabilityContract } from './capability.js';

/**
 * "Describe yourself" (RPC Map milestone 1): the ONE document every Fli app can answer with — who it is, what it is for,
 * its parts (the app's core and each extension, every one with its own owner), the commands of each part, the data
 * files it reads and writes, the events it emits, the settings and where they live, and which commands are actually
 * used. Browser-safe (zod and the capability contract only), so a screen can read the shape too.
 *
 * The document is data: an app builds it with `describeApp` from facts its parts SUPPLY (an extension describes itself;
 * the host never writes an extension's facts for it). Versioned `describe/1`; a field is added, never renamed.
 */

export const DESCRIBE_SCHEMA = 'describe/1';

/** How a command touches the world, in the three words a person uses. */
export const CommandAccess = z.enum(['read', 'write', 'long-job']);
export type CommandAccess = z.infer<typeof CommandAccess>;

export const CommandInput = z.object({
  name: z.string(),
  required: z.boolean(),
  /** `string`, `number`, `"a" | "b"`, `string[]`, `object` … a person-readable type. */
  type: z.string(),
  description: z.string().optional(),
});
export type CommandInput = z.infer<typeof CommandInput>;

export const CommandUsage = z.object({
  calls: z.number().int().min(0),
  firstUsed: z.string().nullable(),
  lastUsed: z.string().nullable(),
  lastPrincipal: z.string().nullable(),
  lastFailureMode: z.string().nullable(),
});
export type CommandUsage = z.infer<typeof CommandUsage>;

export const DescribedCommand = z.object({
  name: z.string(),
  family: z.string(),
  summary: z.string(),
  access: CommandAccess,
  /** `true`, `false`, or the note saying which inputs only a person may send. */
  humanOnly: z.union([z.boolean(), z.object({ when: z.string() })]),
  kind: z.string(),
  sideEffects: z.string(),
  inputs: z.array(CommandInput),
  /** The shape of the answer's `value`, one line: `object { ok, project, … }`. */
  output: z.string(),
  /** One request that would work as written (JSON-RPC 2.0, by-name params). */
  example: z.object({
    jsonrpc: z.literal('2.0'),
    id: z.number(),
    method: z.string(),
    params: z.record(z.string(), z.unknown()),
  }),
  failureModes: z.array(z.string()),
  /** Present when the app keeps call telemetry (`usage/1`); `calls: 0` is "never called since it began counting". */
  usage: CommandUsage.optional(),
});
export type DescribedCommand = z.infer<typeof DescribedCommand>;

export const DataFileAccess = z.enum(['read', 'write', 'read-write']);
export const DescribedDataFile = z.object({
  /** A path or pattern, with `<placeholders>` for the project / brand / video parts. */
  path: z.string(),
  access: DataFileAccess,
  purpose: z.string(),
});
export type DescribedDataFile = z.infer<typeof DescribedDataFile>;

export const DescribedEvent = z.object({
  name: z.string(),
  /** Where it goes: `socket.io`, `file`, `stdout` … */
  channel: z.string().optional(),
  purpose: z.string(),
});
export type DescribedEvent = z.infer<typeof DescribedEvent>;

export const DescribedSetting = z.object({
  name: z.string(),
  /** Where it lives: `env`, `fli.brand.json`, `<brand root>/-storypilot/settings.json` … */
  where: z.string(),
  purpose: z.string(),
});
export type DescribedSetting = z.infer<typeof DescribedSetting>;

export const DescribedLink = z.object({ label: z.string(), href: z.string() });

/** What a part supplies about itself (everything but its commands, which come from its capability set). */
export const PartFacts = z.object({
  key: z.string(),
  name: z.string(),
  /** One paragraph: what the part is for. */
  purpose: z.string(),
  version: z.string(),
  /** Who answers for it: a person, a lane or a repo. */
  owner: z.string(),
  dataFiles: z.array(DescribedDataFile).default([]),
  events: z.array(DescribedEvent).default([]),
  settings: z.array(DescribedSetting).default([]),
  docs: z.array(DescribedLink).default([]),
});
export type PartFacts = z.input<typeof PartFacts>;

export const DescribedPart = PartFacts.extend({
  kind: z.enum(['core', 'extension']),
  /** An extension's verb namespace (`story`, `overlay`, `broll`). */
  namespace: z.string().optional(),
  /** The pipeline stage box it sits in, when it has one. */
  stage: z.string().optional(),
  contractVersion: z.number().int().optional(),
  /** Other apps this part may call. */
  apps: z.array(z.string()).optional(),
  commands: z.array(DescribedCommand),
});
export type DescribedPart = z.infer<typeof DescribedPart>;

export const DescribedApp = z.object({
  name: z.string(),
  version: z.string(),
  gitSha: z.string().nullable(),
  machine: z.string(),
  purpose: z.string(),
  startedAt: z.string().nullable(),
});

export const DescribeDocument = z.object({
  schema: z.literal(DESCRIBE_SCHEMA),
  generatedAt: z.string(),
  app: DescribedApp,
  parts: z.array(DescribedPart),
  /** Counts a reader would otherwise have to add up. */
  totals: z.object({
    parts: z.number().int(),
    commands: z.number().int(),
    read: z.number().int(),
    write: z.number().int(),
    longJob: z.number().int(),
    humanOnly: z.number().int(),
    /** Only when telemetry is on. */
    used: z.number().int().optional(),
    unused: z.number().int().optional(),
  }),
  /** Where the counts live and since when they have been kept; absent when the app keeps none. */
  usageSince: z.string().nullable().optional(),
  docs: z.array(DescribedLink).default([]),
});
export type DescribeDocument = z.infer<typeof DescribeDocument>;

// ── From a capability to a described command ─────────────────────────────────────────────────────────────────────────

type Json = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  items?: Json;
  properties?: Record<string, Json & { description?: string }>;
  required?: string[];
  anyOf?: Json[];
  oneOf?: Json[];
  default?: unknown;
  description?: string;
  minimum?: number;
};

/** A one-line, person-readable type for a JSON Schema fragment. */
export function typeOfSchema(schema: unknown, depth = 0): string {
  const s = (schema ?? {}) as Json;
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(' | ');
  const union = s.anyOf ?? s.oneOf;
  if (union) {
    const parts = [...new Set(union.map((u) => typeOfSchema(u, depth + 1)))];
    return parts.join(' | ') || 'any';
  }
  const type = Array.isArray(s.type) ? s.type.join(' | ') : s.type;
  if (type === 'array') return `${s.items ? typeOfSchema(s.items, depth + 1) : 'any'}[]`;
  if (type === 'object' || s.properties) {
    const keys = Object.keys(s.properties ?? {});
    if (depth > 0 || keys.length === 0) return 'object';
    return `object { ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? ', …' : ''} }`;
  }
  return type ?? 'any';
}

/** A value that satisfies a JSON Schema fragment, for the example request. Placeholders are `<name>`. */
export function exampleOf(schema: unknown, name = 'value', depth = 0): unknown {
  const s = (schema ?? {}) as Json;
  if (s.default !== undefined) return s.default;
  if (s.const !== undefined) return s.const;
  if (s.enum && s.enum.length > 0) return s.enum[0];
  const union = s.anyOf ?? s.oneOf;
  if (union && union.length > 0) {
    const first = union.find((u) => (u as Json).type !== 'null') ?? union[0];
    return exampleOf(first, name, depth + 1);
  }
  const type = Array.isArray(s.type) ? (s.type.find((t) => t !== 'null') ?? 'null') : s.type;
  switch (type) {
    case 'string':
      return `<${name}>`;
    case 'number':
    case 'integer':
      return typeof s.minimum === 'number' ? s.minimum : 1;
    case 'boolean':
      return true;
    case 'null':
      return null;
    case 'array':
      return depth > 2 || !s.items ? [] : [exampleOf(s.items, name, depth + 1)];
    default: {
      if (!s.properties || depth > 2) return {};
      const required = new Set(s.required ?? []);
      return Object.fromEntries(
        Object.entries(s.properties)
          .filter(([key]) => required.has(key))
          .map(([key, v]) => [key, exampleOf(v, key, depth + 1)]),
      );
    }
  }
}

/** The three words: read (changes nothing), long-job (slow), write (everything else). */
export function accessOf(contract: CapabilityContract): CommandAccess {
  if (contract.sideEffects === 'read-only') return 'read';
  if (contract.kind === 'task' || contract.expectedDuration === 'slow') return 'long-job';
  return 'write';
}

function inputsOf(schema: unknown): CommandInput[] {
  const s = (schema ?? {}) as Json;
  if (!s.properties) return [];
  const required = new Set(s.required ?? []);
  return Object.entries(s.properties).map(([name, field]) => ({
    name,
    required: required.has(name),
    type: typeOfSchema(field, 1),
    ...(field.description ? { description: field.description } : {}),
  }));
}

/** One capability as a described command (without usage; `describeApp` adds that). */
export function commandOf(
  meta: CapabilityMeta,
  contract: CapabilityContract,
  id = 1,
): DescribedCommand {
  return {
    name: meta.name,
    family: meta.family,
    summary: meta.description,
    access: accessOf(contract),
    humanOnly: meta.humanOnly,
    kind: meta.kind,
    sideEffects: meta.sideEffects,
    inputs: inputsOf(meta.input),
    output: typeOfSchema(meta.output),
    example: {
      jsonrpc: '2.0',
      id,
      method: meta.name,
      params: (exampleOf(meta.input) as Record<string, unknown>) ?? {},
    },
    failureModes: meta.failureModes,
  };
}

// ── The call counts (kept by usage.ts) ───────────────────────────────────────────────────────────────────────────────

export const UsageRecord = z.object({
  calls: z.number().int().min(0),
  firstUsed: z.string().nullable(),
  lastUsed: z.string().nullable(),
  lastPrincipal: z.string().nullable(),
  lastFailureMode: z.string().nullable(),
});
export type UsageRecord = z.infer<typeof UsageRecord>;

export interface DescribePartOptions {
  facts: PartFacts;
  kind: 'core' | 'extension';
  capabilities: Readonly<Record<string, CapabilityContract>>;
  namespace?: string;
  stage?: string;
  contractVersion?: number;
  apps?: readonly string[];
}

export interface DescribeAppOptions {
  app: {
    name: string;
    version: string;
    gitSha?: string | null;
    machine: string;
    purpose: string;
    startedAt?: string | null;
  };
  parts: readonly DescribePartOptions[];
  /** Per-verb counts; absent → the document carries no `usage`. */
  usage?: Readonly<Record<string, UsageRecord>>;
  usageSince?: string | null;
  docs?: readonly { label: string; href: string }[];
  now?: Date;
}

const EMPTY_USAGE: CommandUsage = {
  calls: 0,
  firstUsed: null,
  lastUsed: null,
  lastPrincipal: null,
  lastFailureMode: null,
};

/**
 * Build the document. Parts keep the order given; commands within a part sort by name. A verb that two parts both
 * declare is a bug in the app and throws, so the map never shows one command twice.
 */
export function describeApp(options: DescribeAppOptions): DescribeDocument {
  const seen = new Map<string, string>();
  const parts: DescribedPart[] = options.parts.map((part) => {
    const metas = describeCapabilities({ ...part.capabilities });
    const commands = metas.map((meta, i) => {
      const owner = seen.get(meta.name);
      if (owner) throw new Error(`${meta.name} is declared by both ${owner} and ${part.facts.key}`);
      seen.set(meta.name, part.facts.key);
      const command = commandOf(meta, part.capabilities[meta.name] as CapabilityContract, i + 1);
      return options.usage
        ? { ...command, usage: { ...EMPTY_USAGE, ...options.usage[meta.name] } }
        : command;
    });
    return {
      ...PartFacts.parse(part.facts),
      kind: part.kind,
      ...(part.namespace ? { namespace: part.namespace } : {}),
      ...(part.stage ? { stage: part.stage } : {}),
      ...(part.contractVersion !== undefined ? { contractVersion: part.contractVersion } : {}),
      ...(part.apps && part.apps.length > 0 ? { apps: [...part.apps] } : {}),
      commands,
    };
  });
  const all = parts.flatMap((p) => p.commands);
  const used = options.usage ? all.filter((c) => (c.usage?.calls ?? 0) > 0).length : undefined;
  return DescribeDocument.parse({
    schema: DESCRIBE_SCHEMA,
    generatedAt: (options.now ?? new Date()).toISOString(),
    app: {
      name: options.app.name,
      version: options.app.version,
      gitSha: options.app.gitSha ?? null,
      machine: options.app.machine,
      purpose: options.app.purpose,
      startedAt: options.app.startedAt ?? null,
    },
    parts,
    totals: {
      parts: parts.length,
      commands: all.length,
      read: all.filter((c) => c.access === 'read').length,
      write: all.filter((c) => c.access === 'write').length,
      longJob: all.filter((c) => c.access === 'long-job').length,
      humanOnly: all.filter((c) => c.humanOnly !== false).length,
      ...(used !== undefined ? { used, unused: all.length - used } : {}),
    },
    ...(options.usage ? { usageSince: options.usageSince ?? null } : {}),
    docs: options.docs ?? [],
  });
}
