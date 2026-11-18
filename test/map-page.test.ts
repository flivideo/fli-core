/* eslint-disable @typescript-eslint/no-non-null-assertion -- tests index into arrays they just built */
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { renderMapPage } from '../src/index.js';

describe('renderMapPage', () => {
  const html = renderMapPage({
    describePath: '/api/describe',
    rpcPath: '/api/rpc',
    tokenPath: '/api/session',
    consoleHref: '/api/console',
  });

  it('is one light, self-contained page with one inline script', () => {
    expect(html).toContain('color-scheme: light');
    expect(html).not.toContain('prefers-color-scheme');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3)/);
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).toContain('#faf5ec');
    expect(html).toContain('#ffde59');
  });

  it('reads its config from the options and is valid JavaScript', () => {
    const script = /<script>([\s\S]*)<\/script>/.exec(html)![1]!;
    expect(script).toContain('"describePath":"/api/describe"');
    expect(script).toContain('"principal":"agent:map"');
    expect(() => new vm.Script(script)).not.toThrow();
  });

  it('only offers Try it for read commands', () => {
    expect(html).toContain("c.access === 'read' && c.humanOnly === false");
  });

  it('escapes a hostile config value so it cannot close the script', () => {
    const evil = renderMapPage({
      describePath: '/x',
      rpcPath: '</script><b>',
      principal: 'agent:q',
    });
    expect(evil).not.toContain('</script><b>');
  });
});
