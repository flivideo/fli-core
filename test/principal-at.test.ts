import { describe, expect, it } from 'vitest';
import { PrincipalName, principalKind } from '../src/index.js';

describe('principal names — agent:<seat>@<rig>', () => {
  it.each(['agent:bruce-boss@exec', 'agent:tuber', 'agent:a.b_c@r-1.x'])(
    'accepts %s as an agent',
    (p) => {
      expect(PrincipalName.safeParse(p).success).toBe(true);
      expect(principalKind(p)).toBe('agent');
    },
  );
  it.each(['agent:a@b@c', 'agent:@x', 'agent:a@', 'agent:', 'agent:a b@c', 'agent:a@b c'])(
    'refuses %s',
    (p) => {
      expect(PrincipalName.safeParse(p).success).toBe(false);
      expect(principalKind(p)).toBeNull();
    },
  );
  it('leaves human, human:surface and cli unchanged', () => {
    expect(principalKind('human')).toBe('human');
    expect(principalKind('human:ui')).toBe('human');
    expect(principalKind('cli')).toBe('cli');
    expect(principalKind('human@x')).toBeNull();
    expect(principalKind('cli@x')).toBeNull();
  });
});
