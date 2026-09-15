import { z } from 'zod';

/** A JSON file that was found but could not be used. Readers return this instead of throwing. */
export const InvalidFile = z.object({
  kind: z.literal('invalid'),
  path: z.string(),
  reason: z.enum(['unreadable', 'not-json', 'schema']),
  message: z.string(),
});
export type InvalidFile = z.infer<typeof InvalidFile>;

/** A JSON file that was found and matched `value`'s schema. */
export function validFile<S extends z.ZodType>(value: S) {
  return z.object({ kind: z.literal('valid'), path: z.string(), value });
}
export type ValidFile<T> = z.infer<ReturnType<typeof validFile<z.ZodType<T>>>>;

/** Absent → `null`; present and valid → `ValidFile`; present and unusable → `InvalidFile`. */
export function readFileResult<S extends z.ZodType>(value: S) {
  return z.union([validFile(value), InvalidFile, z.null()]);
}
export type ReadFileResult<T> = z.infer<ReturnType<typeof readFileResult<z.ZodType<T>>>>;

/** Errors thrown by the name builders and `labPath` when handed input they must not turn into a name. */
export class FliCoreError extends Error {
  readonly code: 'invalid-input';
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'FliCoreError';
    this.code = 'invalid-input';
    this.issues = issues;
  }
}

export function issuesOf(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const where = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${where}: ${issue.message}`;
  });
}

/** Parse `input` with `schema` or throw a `FliCoreError` naming what was wrong. */
export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  input: unknown,
  what: string,
): z.infer<S> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = issuesOf(parsed.error);
    throw new FliCoreError(`Invalid ${what}: ${issues.join('; ')}`, issues);
  }
  return parsed.data;
}
