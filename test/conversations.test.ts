import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cleanForPrompt,
  isLocalRequest,
  lastConversationMessages,
  listLiveConversations,
  readConversationTail,
  realConversationRun,
  sendToConversation,
  type ConversationOptions,
} from '../src/index.js';
import { tempDir } from './helpers/fixtures.js';

type Pane = { label: string; paneId: string; tty: string; inMode?: boolean };

/** A fake machine: tmux panes, the processes on their terminals, and Claude's session files. */
async function machine(opts: {
  panes?: Pane[];
  pids?: Record<string, string[]>;
  sessions?: Record<string, object | string>;
  tmuxFails?: boolean;
  psFails?: boolean;
  noSessionsDir?: boolean;
  sendFails?: boolean;
  onEnter?: (home: string) => Promise<void>;
}) {
  const home = await tempDir();
  if (!opts.noSessionsDir) await fs.mkdir(path.join(home, 'sessions'));
  for (const [pid, body] of Object.entries(opts.noSessionsDir ? {} : (opts.sessions ?? {}))) {
    await fs.writeFile(
      path.join(home, 'sessions', `${pid}.json`),
      typeof body === 'string' ? body : JSON.stringify(body),
    );
  }
  const calls: string[][] = [];
  const deps: ConversationOptions = {
    claudeHome: home,
    tmux: 'tmux',
    sleep: async () => {},
    run: async (file, args) => {
      calls.push([file, ...args]);
      if (file === '/bin/ps') {
        if (opts.psFails) throw new Error('ps failed');
        return Object.entries(opts.pids ?? {})
          .flatMap(([tty, pids]) => pids.map((p) => `  ${p} ${tty}`))
          .join('\n');
      }
      if (args[0] === 'list-panes') {
        if (opts.tmuxFails) throw new Error('no server running');
        return (opts.panes ?? [])
          .map((p) => [p.label, p.paneId, `/dev/${p.tty}`, p.inMode ? '1' : '0'].join('\t'))
          .join('\n');
      }
      if (opts.sendFails) throw new Error("can't find pane");
      if (args.includes('Enter')) await opts.onEnter?.(home);
      return '';
    },
  };
  return { home, deps, calls };
}

const session = (over: object = {}) => ({
  kind: 'interactive',
  sessionId: 'sid-1',
  status: 'idle',
  cwd: '/work/my_app',
  ...over,
});
const pane: Pane = { label: 'writing-desk', paneId: '%7', tty: 'ttys001' };
const one = { panes: [pane], pids: { ttys001: ['100', '101'] }, sessions: { '101': session() } };

const typed = (calls: string[][]) =>
  calls.filter((c) => ['set-buffer', 'paste-buffer', 'send-keys'].includes(String(c[1])));

describe('listLiveConversations', () => {
  it('finds a Claude on the pane by its terminal, not its parent or command name', async () => {
    const { deps } = await machine(one);
    expect(await listLiveConversations(deps)).toEqual({
      conversations: [
        {
          id: 'sid-1',
          label: 'writing-desk',
          paneId: '%7',
          status: 'idle',
          cwd: '/work/my_app',
          atPrompt: true,
        },
      ],
    });
  });

  it('leaves out a plain shell, a non-interactive session and an unreadable file', async () => {
    const { deps } = await machine({
      panes: [
        pane,
        { label: 'shell', paneId: '%8', tty: 'ttys002' },
        { label: 'bg', paneId: '%9', tty: 'ttys003' },
        { label: 'bad', paneId: '%10', tty: 'ttys004' },
      ],
      pids: { ttys001: ['1'], ttys002: ['2'], ttys003: ['3'], ttys004: ['4'] },
      sessions: { '1': session(), '3': session({ kind: 'background' }), '4': 'not json' },
    });
    expect((await listLiveConversations(deps)).conversations.map((c) => c.label)).toEqual([
      'writing-desk',
    ]);
  });

  it('shows two Claudes in one tmux session as two rows', async () => {
    const { deps } = await machine({
      panes: [pane, { ...pane, paneId: '%8', tty: 'ttys002' }],
      pids: { ttys001: ['1'], ttys002: ['2'] },
      sessions: { '1': session(), '2': session({ sessionId: 'sid-2' }) },
    });
    expect((await listLiveConversations(deps)).conversations.map((c) => c.id)).toEqual([
      'sid-1',
      'sid-2',
    ]);
  });

  it.each([
    ['busy', {}],
    ['shell', {}],
    ['some-new-state', {}],
  ])('is not at its prompt when status is %s', async (status) => {
    const { deps } = await machine({ ...one, sessions: { '101': session({ status }) } });
    expect((await listLiveConversations(deps)).conversations[0]?.atPrompt).toBe(false);
  });

  it('is not at its prompt with no status, or in copy mode', async () => {
    const none = await machine({ ...one, sessions: { '101': session({ status: undefined }) } });
    expect((await listLiveConversations(none.deps)).conversations[0]).toMatchObject({
      status: null,
      atPrompt: false,
    });
    const copy = await machine({ ...one, panes: [{ ...pane, inMode: true }] });
    expect((await listLiveConversations(copy.deps)).conversations[0]?.atPrompt).toBe(false);
  });

  it('comes back empty with a reason, never a guess', async () => {
    const reasonOf = async (o: Parameters<typeof machine>[0]) =>
      (await listLiveConversations((await machine(o)).deps)).reason;
    expect(await reasonOf({ tmuxFails: true })).toMatch(/tmux/);
    expect(await reasonOf({ panes: [] })).toMatch(/No tmux panes/);
    expect(await reasonOf({ ...one, psFails: true })).toMatch(/processes/);
    expect(await reasonOf({ ...one, noSessionsDir: true })).toMatch(/session list/);
    expect(await reasonOf({ ...one, sessions: {} })).toMatch(/No live Claude/);
  });
});

describe('cleanForPrompt', () => {
  it('turns newlines to spaces first, so words do not join, then strips control characters', () => {
    expect(cleanForPrompt('  one\ntwo\r\n\nthree\u0007\u001b[0m ')).toBe('one two three[0m');
  });
});

describe('sendToConversation', () => {
  const heard = (id: string, text: string) => async (home: string) => {
    const dir = path.join(home, 'projects', '-work-my-app');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${id}.jsonl`),
      `${JSON.stringify({ type: 'assistant', message: { content: 'n_x earlier mention' } })}\n${JSON.stringify({ type: 'user', message: { content: text } })}\n`,
    );
  };

  it('pastes the line into the pane, presses Enter, and reports confirmed on read-back', async () => {
    const { deps, calls } = await machine({ ...one, onEnter: heard('sid-1', 'hello n_x') });
    expect(await sendToConversation('sid-1', 'hello n_x', 'n_x', deps)).toEqual({
      outcome: 'confirmed',
      conversation: 'sid-1',
      label: 'writing-desk',
      sent: 9,
    });
    const buffer = `fli-tell-${process.pid}`;
    expect(typed(calls)).toEqual([
      ['tmux', 'set-buffer', '-b', buffer, '--', 'hello n_x'],
      ['tmux', 'paste-buffer', '-p', '-d', '-b', buffer, '-t', '%7'],
      ['tmux', 'send-keys', '-t', '%7', 'Enter'],
    ]);
  });

  it('is typed-unconfirmed when the marker is only in a reply, or the transcript never shows it', async () => {
    const reply = await machine({
      ...one,
      onEnter: heard('sid-1', 'something else'),
    });
    expect(
      await sendToConversation('sid-1', 'hello n_x', 'n_x', reply.deps, { confirmMs: 500 }),
    ).toMatchObject({ outcome: 'typed-unconfirmed' });
    const silent = await machine(one);
    expect(
      await sendToConversation('sid-1', 'hello', 'n_x', silent.deps, { confirmMs: 500 }),
    ).toMatchObject({ outcome: 'typed-unconfirmed' });
  });

  it('is typed-unconfirmed when the session has no working folder to find a transcript', async () => {
    const { deps } = await machine({ ...one, sessions: { '101': session({ cwd: undefined }) } });
    expect(await sendToConversation('sid-1', 'hello', 'n_x', deps)).toMatchObject({
      outcome: 'typed-unconfirmed',
    });
  });

  it('escapes a final semicolon, which tmux would otherwise eat', async () => {
    const { deps, calls } = await machine(one);
    await sendToConversation('sid-1', 'stop here;', 'n_x', deps, { confirmMs: 0 });
    expect(typed(calls)[0]?.at(-1)).toBe('stop here\\;');
  });

  it.each([
    ['', 'nothing-to-send'],
    [' \n ', 'nothing-to-send'],
    ['x'.repeat(4001), 'too-long'],
    ['/compact', 'unsafe-start'],
    ['\n  /compact', 'unsafe-start'],
    ['!rm -rf x', 'unsafe-start'],
    ['\u0007!rm -rf x', 'unsafe-start'],
  ])('refuses %j as %s and types nothing', async (text, reason) => {
    const { deps, calls } = await machine(one);
    expect(await sendToConversation('sid-1', text, 'n_x', deps)).toMatchObject({
      outcome: 'refused',
      reason,
    });
    expect(typed(calls)).toEqual([]);
  });

  it('refuses an id that is not a live Claude, by session id and never by name', async () => {
    const { deps, calls } = await machine(one);
    expect(await sendToConversation('writing-desk', 'hi', 'n_x', deps)).toMatchObject({
      outcome: 'refused',
      reason: 'no-such-conversation',
    });
    expect(typed(calls)).toEqual([]);
  });

  it('says the conversation has ended when others are still live', async () => {
    const { deps } = await machine(one);
    expect(await sendToConversation('gone', 'hi', 'n_x', deps)).toMatchObject({
      message: 'That conversation has ended.',
    });
  });

  it.each([
    [{ status: 'busy' }, 'writing-desk is busy.'],
    [{ status: 'shell' }, "writing-desk isn't at its prompt."],
    [{ status: 'waiting' }, "writing-desk isn't at its prompt."],
  ])('refuses %j and types nothing', async (over, why) => {
    const { deps, calls } = await machine({ ...one, sessions: { '101': session(over) } });
    expect(await sendToConversation('sid-1', 'hi', 'n_x', deps)).toEqual({
      outcome: 'refused',
      reason: 'not-at-prompt',
      message: why,
    });
    expect(typed(calls)).toEqual([]);
  });

  it('refuses a pane in copy mode', async () => {
    const { deps, calls } = await machine({ ...one, panes: [{ ...pane, inMode: true }] });
    expect(await sendToConversation('sid-1', 'hi', 'n_x', deps)).toMatchObject({
      reason: 'not-at-prompt',
    });
    expect(typed(calls)).toEqual([]);
  });

  it('says so when tmux refuses the keys', async () => {
    const { deps } = await machine({ ...one, sendFails: true });
    expect(await sendToConversation('sid-1', 'hi', 'n_x', deps)).toMatchObject({
      outcome: 'refused',
      reason: 'delivery-failed',
    });
  });
});

describe('reading a conversation back', () => {
  const lines = [
    '{"cut off',
    JSON.stringify({ type: 'user', timestamp: 't1', message: { content: 'first' } }),
    JSON.stringify({
      type: 'assistant',
      timestamp: 't2',
      message: { content: [{ type: 'text', text: 'reply' }, { type: 'tool_use' }] },
    }),
    JSON.stringify({ type: 'user', isMeta: true, message: { content: 'meta' } }),
    JSON.stringify({ type: 'user', message: { content: '<system-reminder>x' } }),
    JSON.stringify({
      type: 'user',
      message: { content: [{ type: 'tool_result', content: 'output' }] },
    }),
    JSON.stringify({ type: 'user', isCompactSummary: true, message: { content: 'summary' } }),
    JSON.stringify({ type: 'system', message: { content: 'other' } }),
    JSON.stringify({ type: 'user', timestamp: 't3', message: { content: 'second' } }),
  ].join('\n');

  it('keeps typed turns and replies only, the newest n, oldest first', () => {
    expect(lastConversationMessages(lines, 2)).toEqual([
      { role: 'assistant', text: 'reply', at: 't2' },
      { role: 'user', text: 'second', at: 't3' },
    ]);
  });

  it('shows a pasted message without its envelope', () => {
    const line = JSON.stringify({
      type: 'user',
      message: {
        content:
          '\n\n<pasted_content id="ab12">\n[app moment] hello\n</pasted_content id="ab12">\n',
      },
    });
    expect(lastConversationMessages(line, 1)).toEqual([
      { role: 'user', text: '[app moment] hello', at: null },
    ]);
  });

  it('reads the live conversation', async () => {
    const { home, deps } = await machine(one);
    const dir = path.join(home, 'projects', '-work-my-app');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'sid-1.jsonl'), lines);
    expect(await readConversationTail('sid-1', 1, deps)).toMatchObject({
      conversation: 'sid-1',
      messages: [{ role: 'user', text: 'second' }],
      note: null,
    });
  });

  it('says why when it cannot', async () => {
    const { deps } = await machine(one);
    expect(await readConversationTail('sid-1', 3, deps)).toMatchObject({
      messages: [],
      note: expect.stringMatching(/transcript/),
    });
    expect(await readConversationTail('gone', 3, deps)).toMatchObject({
      note: 'That conversation has ended.',
    });
  });
});

describe('realConversationRun', () => {
  it('runs a program with an args array and rejects with its error', async () => {
    expect(await realConversationRun('/bin/echo', ['a; b'])).toBe('a; b\n');
    await expect(realConversationRun('/bin/ls', ['/no/such/place'])).rejects.toThrow();
  });
});

describe('isLocalRequest', () => {
  const local = { remoteAddress: '127.0.0.1', headers: {} };
  it('takes loopback, with loopback hops', () => {
    expect(isLocalRequest(local)).toBe(true);
    expect(
      isLocalRequest({ remoteAddress: '::1', headers: { 'x-forwarded-for': '127.0.0.1, ::1' } }),
    ).toBe(true);
  });
  it('refuses a remote socket, a remote hop, a Tailscale header, or no address', () => {
    expect(isLocalRequest({ remoteAddress: '192.0.2.4', headers: {} })).toBe(false);
    expect(
      isLocalRequest({ ...local, headers: { 'x-forwarded-for': '127.0.0.1, 192.0.2.4' } }),
    ).toBe(false);
    expect(isLocalRequest({ ...local, headers: { 'Tailscale-User-Login': 'a@example.com' } })).toBe(
      false,
    );
    expect(isLocalRequest({ remoteAddress: undefined, headers: {} })).toBe(false);
  });
});
