import { describe, expect, it } from 'vitest';
import {
  cameThroughServe,
  decodeTailscaleValue,
  serveCallerOf,
  serveLoginsFrom,
  servePrincipalOf,
} from '../src/index.js';

// Placeholders only: this package is public.
const LIST = ['ann@example.com', 'bo@example.org'];
const serve = (extra: Record<string, string> = {}) => ({
  'x-forwarded-proto': 'https',
  'x-forwarded-for': '100.64.0.9',
  'tailscale-user-login': 'ann@example.com',
  'tailscale-user-name': 'Ann Example',
  ...extra,
});

describe('serveCallerOf', () => {
  it('names a listed login that came through Serve on loopback', () => {
    expect(serveCallerOf('127.0.0.1', serve(), LIST)).toEqual({
      kind: 'serve',
      login: 'ann@example.com',
      name: 'Ann Example',
      ip: '100.64.0.9',
    });
    expect(serveCallerOf('::ffff:127.0.0.1', serve(), LIST).kind).toBe('serve');
  });

  it('ignores identity headers on a connection that is not loopback (a forged header is only a claim)', () => {
    expect(serveCallerOf('100.64.0.9', serve(), LIST)).toEqual({ kind: 'direct', loopback: false });
  });

  it('a loopback call with no sign of Serve is direct', () => {
    expect(serveCallerOf('127.0.0.1', {}, LIST)).toEqual({ kind: 'direct', loopback: true });
  });

  it('refuses Funnel, no login, a blank login and a login not on the list', () => {
    expect(
      serveCallerOf('127.0.0.1', serve({ 'tailscale-funnel-request': '?1' }), LIST),
    ).toMatchObject({
      kind: 'refused',
      reason: 'funnel',
    });
    const noLogin: Record<string, string> = serve();
    delete noLogin['tailscale-user-login'];
    expect(serveCallerOf('127.0.0.1', noLogin, LIST)).toMatchObject({
      kind: 'refused',
      reason: 'no-login',
    });
    expect(serveCallerOf('127.0.0.1', serve({ 'tailscale-user-login': ' ' }), LIST)).toMatchObject({
      reason: 'no-login',
    });
    expect(
      serveCallerOf('127.0.0.1', serve({ 'tailscale-user-login': 'eve@example.net' }), LIST),
    ).toMatchObject({ kind: 'refused', reason: 'not-listed', login: 'eve@example.net' });
  });

  it('an https proto alone counts as Serve, so a tagged device with no login is refused, not let in as local', () => {
    expect(serveCallerOf('127.0.0.1', { 'x-forwarded-proto': 'https' }, LIST)).toMatchObject({
      kind: 'refused',
      reason: 'no-login',
    });
    expect(cameThroughServe({ 'x-forwarded-proto': 'http, https' })).toBe(false);
  });

  it('nobody is let in with an empty list', () => {
    expect(serveCallerOf('127.0.0.1', serve(), [])).toMatchObject({ reason: 'not-listed' });
  });

  it('matches the login case-insensitively and decodes a Q-encoded name', () => {
    const c = serveCallerOf(
      '127.0.0.1',
      serve({
        'tailscale-user-login': 'ANN@Example.com',
        'tailscale-user-name': '=?utf-8?q?Ren=C3=A9e_X?=',
      }),
      LIST,
    );
    expect(c).toMatchObject({ kind: 'serve', login: 'ann@example.com', name: 'Renée X' });
    expect(decodeTailscaleValue('plain')).toBe('plain');
  });
});

describe('serveLoginsFrom', () => {
  it('unset, blank and none mean nobody', () => {
    expect(serveLoginsFrom(undefined)).toEqual([]);
    expect(serveLoginsFrom('  ')).toEqual([]);
    expect(serveLoginsFrom('none')).toEqual([]);
  });
  it('splits on commas and spaces, lower-cases, drops repeats', () => {
    expect(serveLoginsFrom('Ann@Example.com, bo@example.org ann@example.com')).toEqual(LIST);
  });
});

describe('servePrincipalOf', () => {
  it('uses the first name, plain letters only', () => {
    expect(servePrincipalOf({ login: 'ann@example.com', name: 'Ann Example' })).toBe('human:ann');
    expect(servePrincipalOf({ login: 'x@example.com', name: 'Renée X' })).toBe('human:renee');
  });
  it('falls back to the login local part when the name is the login', () => {
    expect(servePrincipalOf({ login: 'bo.smith@example.org', name: 'bo.smith@example.org' })).toBe(
      'human:bosmith',
    );
  });
});
