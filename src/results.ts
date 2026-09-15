import { z } from 'zod';

/** A JSON file that was found and matched its schema. */
export interface ValidFile<T> {
  kind: 'valid';
  path: string;
  value: T;
}

/** A JSON file that was found but could not be used. Readers return this instead of throwing. */
export const InvalidFile = z.object({
  kind: z.literal('invalid'),
  path: z.string(),
  reason: z.enum(['unreadable', 'not-json', 'schema']),
  message: z.string(),
});
export type InvalidFile = z.infer<typeof InvalidFile>;

/** Absent → `null`; present and valid → `ValidFile`; present and unusable → `InvalidFile`. */
export type ReadFileResult<T> = ValidFile<T> | InvalidFile | null;

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
