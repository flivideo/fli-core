// The live-estate guard used by test/setup/isolate-home.ts (F11). Kept in its own module so tests can import the
// constants without re-running the setup.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const realHome = process.env.FLI_CORE_REAL_HOME ?? os.homedir();

export const GUARD_MESSAGE = 'isolate-home guard: a test tried to touch the live estate';

const caseFold = (value: string): string =>
  process.platform === 'darwin' || process.platform === 'win32' ? value.toLowerCase() : value;

const BLOCKED = [
  path.join(realHome, 'dev', 'video-projects'),
  path.join(realHome, '.config', 'appydave'),
  path.join(realHome, '.fli'),
].map((prefix) => caseFold(path.resolve(prefix)));

function toPath(arg: unknown): string | null {
  if (typeof arg === 'string') return arg;
  if (arg instanceof URL) return arg.protocol === 'file:' ? fileURLToPath(arg) : null;
  if (Buffer.isBuffer(arg)) return arg.toString();
  return null;
}

/** True when `candidate` is inside the real ~/dev/video-projects, ~/.config/appydave or ~/.fli. Pure. */
export function isGuardedPath(candidate: string): boolean {
  const resolved = caseFold(path.resolve(candidate));
  return BLOCKED.some((prefix) => resolved === prefix || resolved.startsWith(prefix + path.sep));
}

function assertAllowed(args: unknown[], pathArgs: number): void {
  for (const arg of args.slice(0, pathArgs)) {
    const candidate = toPath(arg);
    if (candidate === null) continue;
    if (isGuardedPath(candidate)) {
      throw Object.assign(new Error(`${GUARD_MESSAGE}: ${candidate}`), { code: 'EFLICORE_GUARD' });
    }
  }
}

const GUARDED = Symbol.for('fli-core.isolate-home.guarded');

function guard(
  target: Record<string, unknown>,
  names: readonly string[],
  pathArgs: number,
  async: boolean,
): void {
  for (const name of names) {
    const original = target[name];
    if (typeof original !== 'function' || (original as { [GUARDED]?: true })[GUARDED]) continue;
    const wrapped = async
      ? function (this: unknown, ...args: unknown[]) {
          try {
            assertAllowed(args, pathArgs);
          } catch (error) {
            return Promise.reject(error);
          }
          return (original as (...a: unknown[]) => unknown).apply(this, args);
        }
      : function (this: unknown, ...args: unknown[]) {
          assertAllowed(args, pathArgs);
          return (original as (...a: unknown[]) => unknown).apply(this, args);
        };
    Object.defineProperty(wrapped, GUARDED, { value: true });
    target[name] = wrapped;
  }
}

const ONE_PATH = [
  'readdir',
  'readFile',
  'stat',
  'lstat',
  'writeFile',
  'mkdir',
  'rm',
  'open',
  'access',
  'opendir',
  'chmod',
  'unlink',
  'mkdtemp',
] as const;
const TWO_PATHS = ['rename', 'link', 'symlink', 'copyFile'] as const;

/** Wrap the fs functions (promise and sync forms). Idempotent. */
export function installLiveEstateGuard(): void {
  const promises = fs.promises as unknown as Record<string, unknown>;
  guard(promises, ONE_PATH, 1, true);
  guard(promises, TWO_PATHS, 2, true);

  const sync = fs as unknown as Record<string, unknown>;
  guard(
    sync,
    ONE_PATH.map((name) => `${name}Sync`),
    1,
    false,
  );
  guard(
    sync,
    TWO_PATHS.map((name) => `${name}Sync`),
    2,
    false,
  );
  guard(sync, ['existsSync'], 1, false);
}
