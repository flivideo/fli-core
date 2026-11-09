import { execFile } from 'node:child_process';
import { promises as fs, constants as fsConstants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

/**
 * The door for typing into a live Claude Code conversation in tmux. Typing into a terminal is code execution on this
 * machine, so the rules live here, where every app shares them:
 *
 *  - only a real live Claude session can be chosen: a tmux pane with a process that has a `sessions/<pid>.json` of kind
 *    `interactive`. A pane's command name can't tell you (it's often a version number), and a pane's shell needn't be the
 *    parent, so panes are matched by terminal;
 *  - a send goes only when that session is at its prompt: status `idle` and the pane not in copy mode. Text and Enter
 *    given to a permission prompt could answer it with nobody seeing. An unknown status refuses;
 *  - text is flattened to one line and can't start with `/` or `!`, which Claude Code reads as commands;
 *  - programs are run with an args array, never a shell string.
 *
 * Whether a program may call this at all is the caller's rule: an app must only reach it from a person's action.
 *
 * `sessions/<pid>.json` is Claude Code's own, undocumented file. If it can't be read or its shape changes, the list comes
 * back empty with a reason. Nothing is guessed. Node only; nothing here throws.
 */

/** Runs a program with an args array, resolving its stdout. Tests pass a fake. */
export type ConversationRun = (file: string, args: string[]) => Promise<string>;

export const realConversationRun: ConversationRun = (file, args) =>
  new Promise((resolve, reject) => {
    execFile(file, args, { timeout: 20_000, maxBuffer: 4_000_000 }, (err, out, errOut) => {
      if (err) reject(new Error(String(errOut).trim() || err.message));
      else resolve(String(out));
    });
  });

export interface ConversationOptions {
  run?: ConversationRun;
  /** Claude Code's folder. Default `~/.claude`. */
  claudeHome?: string;
  /** The tmux binary. Default: the usual install places (an app started from the Finder has a short PATH), then PATH. */
  tmux?: string;
  /** Pause while waiting for a read-back. Tests pass a fake. */
  sleep?: (ms: number) => Promise<void>;
}

export const LiveConversation = z.object({
  /** The Claude session id: what's sent to and saved. */
  id: z.string(),
  /** The tmux session name a person reads. A name can pass to a different Claude, so it's never the address. */
  label: z.string(),
  paneId: z.string(),
  /** As Claude Code reports it. */
  status: z.string().nullable(),
  /** The working folder, which also locates the transcript. */
  cwd: z.string().nullable(),
  /** True only when a send would be allowed now. */
  atPrompt: z.boolean(),
});
export type LiveConversation = z.infer<typeof LiveConversation>;

export const ConversationList = z.object({
  conversations: z.array(LiveConversation),
  /** Why the list is empty, when it is. */
  reason: z.string().optional(),
});
export type ConversationList = z.infer<typeof ConversationList>;

const homeOf = (deps: ConversationOptions): string =>
  deps.claudeHome ?? path.join(os.homedir(), '.claude');
const runOf = (deps: ConversationOptions): ConversationRun => deps.run ?? realConversationRun;
const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const TMUX_PLACES = ['/opt/homebrew/bin/tmux', '/usr/local/bin/tmux'];

async function tmuxOf(deps: ConversationOptions): Promise<string> {
  if (deps.tmux) return deps.tmux;
  for (const place of TMUX_PLACES) {
    try {
      await fs.access(place, fsConstants.X_OK);
      return place;
    } catch {
      // not here
    }
  }
  return 'tmux';
}

/** The status a session must report before anything is typed into it. */
export const AT_PROMPT_STATUS = 'idle';

interface SessionFile {
  kind?: unknown;
  sessionId?: unknown;
  status?: unknown;
  cwd?: unknown;
}

/** Every live Claude conversation in a tmux pane. A pane holding two is two rows. */
export async function listLiveConversations(
  deps: ConversationOptions = {},
): Promise<ConversationList> {
  const run = runOf(deps);
  const home = homeOf(deps);
  let panesOut: string;
  try {
    panesOut = await run(await tmuxOf(deps), [
      'list-panes',
      '-a',
      '-F',
      '#{session_name}\t#{pane_id}\t#{pane_tty}\t#{pane_in_mode}',
    ]);
  } catch (e) {
    return { conversations: [], reason: `tmux isn't answering: ${message(e)}` };
  }
  const panes = panesOut
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [label = '', paneId = '', tty = '', inMode = '0'] = line.split('\t');
      return { label, paneId, tty: tty.replace(/^\/dev\//, ''), inMode: inMode !== '0' };
    });
  if (panes.length === 0) return { conversations: [], reason: 'No tmux panes are open.' };

  let processes: string;
  try {
    processes = await run('/bin/ps', ['-A', '-o', 'pid=,tty=']);
  } catch (e) {
    return { conversations: [], reason: `Can't list processes: ${message(e)}` };
  }
  const pidsByTty = new Map<string, string[]>();
  for (const line of processes.split('\n')) {
    const [pid, tty] = line.trim().split(/\s+/);
    if (!pid || !tty) continue;
    pidsByTty.set(tty, [...(pidsByTty.get(tty) ?? []), pid]);
  }

  let files: Set<string>;
  try {
    files = new Set(await fs.readdir(path.join(home, 'sessions')));
  } catch (e) {
    return { conversations: [], reason: `Can't read Claude's session list: ${message(e)}` };
  }

  const conversations: LiveConversation[] = [];
  for (const pane of panes) {
    for (const pid of pidsByTty.get(pane.tty) ?? []) {
      if (!files.has(`${pid}.json`)) continue;
      let session: SessionFile;
      try {
        session = JSON.parse(
          await fs.readFile(path.join(home, 'sessions', `${pid}.json`), 'utf8'),
        ) as SessionFile;
      } catch {
        continue;
      }
      if (session.kind !== 'interactive' || typeof session.sessionId !== 'string') continue;
      const status = typeof session.status === 'string' ? session.status : null;
      conversations.push({
        id: session.sessionId,
        label: pane.label,
        paneId: pane.paneId,
        status,
        cwd: typeof session.cwd === 'string' ? session.cwd : null,
        atPrompt: status === AT_PROMPT_STATUS && !pane.inMode,
      });
    }
  }
  return conversations.length
    ? { conversations }
    : { conversations, reason: 'No live Claude sessions were found in tmux.' };
}

/** Longest text the door takes. */
export const CONVERSATION_MAX_CHARS = 4000;

export const ConversationRefusal = z.enum([
  'no-such-conversation',
  'not-at-prompt',
  'nothing-to-send',
  'too-long',
  'unsafe-start',
  'delivery-failed',
]);
export type ConversationRefusal = z.infer<typeof ConversationRefusal>;

export const SendResult = z.union([
  z.object({
    outcome: z.enum(['confirmed', 'typed-unconfirmed']),
    conversation: z.string(),
    label: z.string(),
    sent: z.int().min(0),
  }),
  z.object({ outcome: z.literal('refused'), reason: ConversationRefusal, message: z.string() }),
]);
export type SendResult = z.infer<typeof SendResult>;

/** One line, no control characters, trimmed. Newlines become spaces first, so words don't join up. */
export function cleanForPrompt(text: string): string {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\p{Cc}/gu, '')
    .trim();
}

export interface SendOptions {
  /** How long to look for the text in the transcript. Default 5 s. */
  confirmMs?: number;
  /** Most text this door takes. Default `CONVERSATION_MAX_CHARS`. */
  maxChars?: number;
}

const CONFIRM_POLL_MS = 250;
const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Type one line into a live conversation and press Enter, then look for `marker` in its transcript. `confirmed` means a
 * user turn holding the marker was read back; `typed-unconfirmed` means tmux took it and that wasn't seen in time.
 */
export async function sendToConversation(
  id: string,
  text: string,
  marker: string,
  deps: ConversationOptions = {},
  options: SendOptions = {},
): Promise<SendResult> {
  const refuse = (reason: ConversationRefusal, why: string): SendResult => ({
    outcome: 'refused',
    reason,
    message: why,
  });
  const line = cleanForPrompt(text);
  if (!line) return refuse('nothing-to-send', 'Nothing to send.');
  const maxChars = options.maxChars ?? CONVERSATION_MAX_CHARS;
  if (line.length > maxChars) return refuse('too-long', `At most ${maxChars} characters.`);
  if (line.startsWith('/') || line.startsWith('!')) {
    return refuse('unsafe-start', 'Text starting with / or ! would run as a command.');
  }

  const { conversations, reason } = await listLiveConversations(deps);
  const target = conversations.find((c) => c.id === id);
  if (!target) return refuse('no-such-conversation', reason ?? 'That conversation has ended.');
  if (!target.atPrompt) {
    const state = target.status === 'busy' ? 'is busy' : "isn't at its prompt";
    return refuse('not-at-prompt', `${target.label} ${state}.`);
  }

  const run = runOf(deps);
  const tmux = await tmuxOf(deps);
  // tmux parses a final `;` as its own separator, even after `--`.
  const typed = line.endsWith(';') ? `${line.slice(0, -1)}\\;` : line;
  try {
    await run(tmux, ['send-keys', '-t', target.paneId, '-l', '--', typed]);
    await run(tmux, ['send-keys', '-t', target.paneId, 'Enter']);
  } catch (e) {
    return refuse('delivery-failed', message(e));
  }

  const done = {
    conversation: target.id,
    label: target.label,
    sent: line.length,
  };
  const file = transcriptPath(homeOf(deps), target);
  if (file) {
    const sleep = deps.sleep ?? defaultSleep;
    const waited = options.confirmMs ?? 5000;
    for (let spent = 0; spent <= waited; spent += CONFIRM_POLL_MS) {
      if (await transcriptHasUserTurn(file, marker)) return { outcome: 'confirmed', ...done };
      await sleep(CONFIRM_POLL_MS);
    }
  }
  return { outcome: 'typed-unconfirmed', ...done };
}

/** `<home>/projects/<cwd with every non-alphanumeric as ->/<id>.jsonl`, or null with no working folder. */
function transcriptPath(home: string, c: Pick<LiveConversation, 'id' | 'cwd'>): string | null {
  if (!c.cwd) return null;
  return path.join(home, 'projects', c.cwd.replace(/[^a-zA-Z0-9]/g, '-'), `${c.id}.jsonl`);
}

/** Bytes read from the end of a transcript. */
export const CONVERSATION_TAIL_BYTES = 600_000;

async function tailOf(file: string): Promise<string | null> {
  let handle: fs.FileHandle;
  try {
    handle = await fs.open(file, 'r');
  } catch {
    return null;
  }
  try {
    const { size } = await handle.stat();
    const start = Math.max(0, size - CONVERSATION_TAIL_BYTES);
    const buf = Buffer.alloc(size - start);
    await handle.read(buf, 0, buf.length, start);
    return buf.toString('utf8');
  } finally {
    await handle.close();
  }
}

interface TranscriptRow {
  type?: string;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  timestamp?: string;
  message?: { content?: unknown };
}

function parseRow(line: string): TranscriptRow | null {
  try {
    return JSON.parse(line) as TranscriptRow;
  } catch {
    return null; // a cut first line of the tail
  }
}

const textOf = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content
          .filter((b) => (b as { type?: string } | null)?.type === 'text')
          .map((b) => String((b as { text?: unknown }).text ?? ''))
          .join('\n')
      : '';

async function transcriptHasUserTurn(file: string, marker: string): Promise<boolean> {
  const tail = await tailOf(file);
  if (tail === null) return false;
  for (const line of tail.split('\n').reverse()) {
    if (!line.includes(marker)) continue;
    const row = parseRow(line);
    if (row?.type === 'user' && textOf(row.message?.content).includes(marker)) return true;
  }
  return false;
}

export const ConversationMessage = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  at: z.string().nullable(),
});
export type ConversationMessage = z.infer<typeof ConversationMessage>;

export const ConversationTail = z.object({
  conversation: z.string(),
  messages: z.array(ConversationMessage),
  /** Why there's nothing to show, when there isn't. */
  note: z.string().nullable(),
});
export type ConversationTail = z.infer<typeof ConversationTail>;

const CLIP_CHARS = 1500;

/** The last `n` messages of a transcript's text: typed turns and replies, never tool output or harness text. Pure. */
export function lastConversationMessages(jsonl: string, n: number): ConversationMessage[] {
  const out: ConversationMessage[] = [];
  const lines = jsonl.split('\n');
  for (let i = lines.length - 1; i >= 0 && out.length < n; i -= 1) {
    const raw = lines[i]?.trim();
    if (!raw) continue;
    const row = parseRow(raw);
    if (!row || row.isMeta || row.isCompactSummary) continue;
    if (row.type !== 'user' && row.type !== 'assistant') continue;
    const text = textOf(row.message?.content).trim();
    if (!text || (row.type === 'user' && text.startsWith('<'))) continue;
    out.push({ role: row.type, text: text.slice(0, CLIP_CHARS), at: row.timestamp ?? null });
  }
  return out.reverse();
}

/** The last `n` messages of a live conversation, or a note saying why they can't be read. */
export async function readConversationTail(
  id: string,
  n: number,
  deps: ConversationOptions = {},
): Promise<ConversationTail> {
  const none = (note: string): ConversationTail => ({ conversation: id, messages: [], note });
  const { conversations, reason } = await listLiveConversations(deps);
  const target = conversations.find((c) => c.id === id);
  if (!target) return none(reason ?? 'That conversation has ended.');
  const file = transcriptPath(homeOf(deps), target);
  const tail = file ? await tailOf(file) : null;
  if (tail === null) return none("Can't read this conversation's transcript.");
  return { conversation: id, messages: lastConversationMessages(tail, n), note: null };
}

const LOOPBACK = /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/;

/**
 * Is an HTTP request really from this machine? The socket and every hop in `x-forwarded-for` must be loopback, and no
 * `tailscale-*` header present. A caller can add hops, never remove one, so a forged header only makes it stricter.
 */
export function isLocalRequest(req: {
  remoteAddress: string | undefined;
  headers: Record<string, string | string[] | undefined>;
}): boolean {
  if (!LOOPBACK.test(req.remoteAddress ?? '')) return false;
  const hops = String(req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  if (!hops.every((h) => LOOPBACK.test(h))) return false;
  return !Object.keys(req.headers).some((h) => h.toLowerCase().startsWith('tailscale-'));
}
