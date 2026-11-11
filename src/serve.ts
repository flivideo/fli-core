/**
 * Who is calling through Tailscale Serve (shared by every Fli app that puts Serve in front of a loopback service).
 *
 * Tailscale Serve proxies a tailnet caller to a service bound to loopback. It deletes any identity header the caller
 * sent (`Tailscale-User-*`, and the underscore spellings) and writes its own, so on a LOOPBACK connection that came
 * through Serve the login header is Serve's word, not the caller's. On any other connection the headers are only the
 * caller's claim and count for nothing.
 *
 * Serve gives no login to a tagged device, and Funnel (the public internet) carries `Tailscale-Funnel-Request`. Both
 * are refused here: there is no person to check.
 *
 * Pure and browser-safe (a type-only import), so a Vite gate, a server and their tests can all use it.
 */

import type { PrincipalName } from './capability.js';

/** Request headers as Node gives them (names lower-cased). */
export type ServeHeaders = Record<string, string | string[] | undefined>;

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/** `::ffff:100.1.2.3` → `100.1.2.3`; `[::1]` → `::1`; a zone id dropped; lower-cased. */
export function plainAddress(address: string): string {
  let a = address.trim().toLowerCase();
  if (a.startsWith('[') && a.endsWith(']')) a = a.slice(1, -1);
  const zone = a.indexOf('%');
  if (zone >= 0) a = a.slice(0, zone);
  if (a.startsWith('::ffff:') && IPV4.test(a.slice(7))) a = a.slice(7);
  return a;
}

export function isLoopback(address: string): boolean {
  const a = plainAddress(address);
  return a === '::1' || /^127\.\d+\.\d+\.\d+$/.test(a);
}

/** The comma-separated hops of every `x-forwarded-for` value, in order. */
export function hopsOf(forwardedFor: string | string[] | undefined): string[] {
  const values = Array.isArray(forwardedFor) ? forwardedFor : forwardedFor ? [forwardedFor] : [];
  return values
    .flatMap((v) => v.split(','))
    .map((h) => h.trim())
    .filter(Boolean)
    .map(plainAddress);
}

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** A Tailscale identity header, or a client's underscore spelling of one (Serve deletes both). */
export function isTailscaleHeader(name: string): boolean {
  return /^tailscale[-_]/i.test(name);
}

/**
 * Serve writes non-ASCII names as RFC 2047 Q-encoded words (`=?utf-8?q?Ann=E2=80=99s?=`); plain ASCII arrives as is.
 */
export function decodeTailscaleValue(value: string): string {
  return value.replace(/=\?utf-8\?q\?([^?]*)\?=\s*/gi, (_m, body: string) => {
    const bytes: number[] = [];
    for (let i = 0; i < body.length; i++) {
      const c = body.charAt(i);
      if (c === '_') bytes.push(32);
      else if (c === '=' && /^[0-9a-f]{2}$/i.test(body.slice(i + 1, i + 3))) {
        bytes.push(parseInt(body.slice(i + 1, i + 3), 16));
        i += 2;
      } else bytes.push(c.charCodeAt(0));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  });
}

/**
 * Did this request come through Tailscale Serve? Serve always sets `X-Forwarded-Proto: https` (its https listener)
 * and, for a caller with a user identity, the `Tailscale-User-*` headers. A local proxy may append its own proto, so
 * the FIRST value is the one that counts. Only meaningful on a loopback connection.
 */
export function cameThroughServe(headers: ServeHeaders): boolean {
  if (Object.keys(headers).some(isTailscaleHeader)) return true;
  const proto = one(headers['x-forwarded-proto'])?.split(',')[0]?.trim().toLowerCase();
  return proto === 'https';
}

/**
 * A login list setting (comma or space separated, case ignored). Unset, empty or `none` = nobody: a service that
 * names its callers by login must never default to letting anyone in.
 */
export function serveLoginsFrom(setting: string | undefined): string[] {
  const raw = (setting ?? '').trim();
  if (raw === '' || raw.toLowerCase() === 'none') return [];
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((l) => l.toLowerCase()),
    ),
  ];
}

export type ServeCaller =
  /** Not through Serve: the connection's own address decides, by the app's own rules (loopback, a token, a list). */
  | { kind: 'direct'; loopback: boolean }
  /** Through Serve, with a login on the list. `name` is Serve's display name (the login when it gave none). */
  | { kind: 'serve'; login: string; name: string; ip: string }
  /** Through Serve but refused. `why` is safe to show the caller and to log. */
  | {
      kind: 'refused';
      reason: 'funnel' | 'no-login' | 'not-listed';
      why: string;
      login?: string;
      ip: string;
    };

/**
 * Who is really calling, from the connection and its headers.
 *  - Not loopback: `direct` (headers count for nothing; a forged `Tailscale-User-Login` from a tailnet address is
 *    just a claim).
 *  - Loopback with no sign of Serve: `direct` (this machine's own caller, an ssh tunnel ending here).
 *  - Loopback through Serve: Funnel is refused, no login is refused (a tagged device), a login not on `logins` is
 *    refused, a listed login is a `serve` caller.
 */
export function serveCallerOf(
  socketAddress: string | undefined,
  headers: ServeHeaders,
  logins: readonly string[],
): ServeCaller {
  const loopback = isLoopback(socketAddress ?? '');
  if (!loopback || !cameThroughServe(headers)) return { kind: 'direct', loopback };
  const hops = hopsOf(headers['x-forwarded-for']).filter((h) => !isLoopback(h));
  const ip = hops[0] ?? 'unknown'; // Serve SETS x-forwarded-for to its caller; a local proxy appends after it
  if (one(headers['tailscale-funnel-request']) !== undefined) {
    return {
      kind: 'refused',
      reason: 'funnel',
      why: 'Calls from the public internet (Tailscale Funnel) are refused.',
      ip,
    };
  }
  const rawLogin = one(headers['tailscale-user-login']);
  if (!rawLogin || !rawLogin.trim()) {
    return {
      kind: 'refused',
      reason: 'no-login',
      why: 'Tailscale gave no login for this caller (a tagged device has none), so there is no one to check.',
      ip,
    };
  }
  const login = decodeTailscaleValue(rawLogin).trim().toLowerCase();
  if (!logins.includes(login)) {
    return {
      kind: 'refused',
      reason: 'not-listed',
      why: `The login ${login} is not on this service's list.`,
      login,
      ip,
    };
  }
  const rawName = one(headers['tailscale-user-name']);
  const name = (rawName && decodeTailscaleValue(rawName).trim()) || login;
  return { kind: 'serve', login, name, ip };
}

/**
 * The principal a Serve caller acts as: `human:<first name>`, lower-cased letters and digits only (a login's local
 * part when the display name gives none). A Serve caller's own `x-fli-principal` claim is never used.
 */
export function servePrincipalOf(caller: { login: string; name: string }): PrincipalName {
  const first = caller.name.trim().split(/\s+/)[0] ?? '';
  const clean = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const fromName = first.includes('@') ? '' : clean(first);
  return `human:${fromName || clean(caller.login.split('@')[0] ?? '') || 'teammate'}`;
}
