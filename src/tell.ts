import { z } from 'zod';
import { PrincipalName } from './capability.js';
import {
  NOTE_ENTITY,
  NoteChannel,
  type ChangeInput,
  type NoteInput,
  type NoteWhere,
} from './note-record.js';

/**
 * Point and tell: a person marks a moment in an app, says what's wrong and sends it to a conversation they choose.
 * This is the message. It's saved in an ordinary note (`meta.tell`) before anything is sent, so a failed send never
 * loses it, and `meta` is kept by older readers where an unknown top-level key would be stripped.
 *
 * The common part holds no app-specific field. An app's own data goes in `detail.<app>`, the one app-owned block. Every
 * object is loose, so a field added later (a voice recording as `said.audio`, say) survives a read by this version.
 *
 * Browser-safe (zod only). Sending is in `conversations.ts`. How an app adopts it: `docs/point-and-tell.md`.
 */

const Name = z.string().trim().min(1);

/** What's open in the app: `{ kind: 'document', id: 'chapter-2.md' }`. */
export const TellOpen = z.looseObject({
  kind: Name,
  id: Name,
  label: Name.optional(),
});
export type TellOpen = z.infer<typeof TellOpen>;

/** Where the moment sits on the thing being reviewed: `{ unit: 'line', value: 42 }`. */
export const TellPosition = z.looseObject({
  unit: Name,
  value: z.number(),
  label: Name.optional(),
});
export type TellPosition = z.infer<typeof TellPosition>;

export const TellMoment = z.looseObject({
  /** The instant of the person's action, not of finishing typing. */
  capturedAt: z.iso.datetime({ offset: true }),
  /** How it was marked: `key` or `pointer` today. Open, so a later way of marking fits. */
  origin: Name,
  position: TellPosition,
  /** The thing pointed at, when the person pointed at one. */
  pointedAt: z
    .looseObject({ entityType: Name, entityId: Name, label: z.string().optional() })
    .optional(),
});
export type TellMoment = z.infer<typeof TellMoment>;

/** The person's words. Optional so a voice-only moment can be added later; a text box always fills it. */
export const TellSaid = z.looseObject({
  text: z.string().min(1).optional(),
  channel: NoteChannel,
});
export type TellSaid = z.infer<typeof TellSaid>;

/** Where it went. For a conversation: `kind: 'conversation'`, `id` the session id, `label` the name a person reads. */
export const TellTo = z.looseObject({
  kind: Name,
  id: Name,
  label: Name.optional(),
});
export type TellTo = z.infer<typeof TellTo>;

export const TellMessage = z
  .looseObject({
    v: z.literal(1),
    app: Name,
    open: TellOpen,
    moment: TellMoment,
    said: TellSaid,
    from: PrincipalName,
    /** Null when it was only kept. */
    to: TellTo.nullable(),
    /** The app-owned block: exactly one key, equal to `app`. */
    detail: z.record(z.string(), z.unknown()),
  })
  .superRefine((message, ctx) => {
    const keys = Object.keys(message.detail);
    if (keys.length !== 1 || keys[0] !== message.app) {
      ctx.addIssue({
        code: 'custom',
        path: ['detail'],
        message: `detail must have exactly one key, "${message.app}"`,
      });
    }
  });
export type TellMessage = z.infer<typeof TellMessage>;

/** The key a message sits under in `note.meta`. */
export const TELL_META_KEY = 'tell';
/** The `target.field` of the line that records how a send went. Not a life-state line, so it never settles the note. */
export const TELL_DELIVERY_FIELD = 'delivery';
/** The moment's entity type when nothing in particular was pointed at. */
export const TELL_ENTITY = 'moment';

export const TellOutcome = z.enum(['confirmed', 'typed-unconfirmed', 'refused']);
export type TellOutcome = z.infer<typeof TellOutcome>;

export const TellDelivery = z.object({
  outcome: TellOutcome,
  conversation: Name,
  at: z.iso.datetime({ offset: true }),
  /** Why, on a refusal. */
  error: z.string().optional(),
});
export type TellDelivery = z.infer<typeof TellDelivery>;

export interface TellNoteOptions {
  /** `note` by default. */
  kind?: 'note' | 'ask';
  where?: NoteWhere;
  /** What goes in `note.text` when the message has no words of its own (a voice-only moment). */
  standIn?: string;
}

/** The note a message is saved as. Validates the message and throws on a bad one. */
export function tellNoteInput(message: TellMessage, options: TellNoteOptions = {}): NoteInput {
  const m = TellMessage.parse(message);
  const pointed = m.moment.pointedAt;
  const text = m.said.text ?? options.standIn;
  return {
    by: m.from,
    kind: options.kind ?? 'note',
    channel: m.said.channel,
    ...(options.where ? { where: options.where } : {}),
    target: {
      app: m.app,
      entityType: pointed?.entityType ?? TELL_ENTITY,
      entityId: pointed?.entityId ?? `${m.open.id}@${m.moment.position.value}`,
    },
    ...(text !== undefined ? { text } : {}),
    meta: { [TELL_META_KEY]: m },
  };
}

/** The `change` line that records how a send of note `noteId` went. A retry writes another one, never another note. */
export function tellDeliveryChange(
  message: Pick<TellMessage, 'app' | 'from'>,
  noteId: string,
  delivery: TellDelivery,
  where?: NoteWhere,
): ChangeInput {
  return {
    by: message.from,
    target: {
      app: message.app,
      entityType: NOTE_ENTITY,
      scope: 'one',
      entityId: noteId,
      field: TELL_DELIVERY_FIELD,
    },
    after: TellDelivery.parse(delivery),
    ...(where ? { where } : {}),
  };
}

/** Longest line typed into a conversation. */
export const TELL_MAX_CHARS = 4000;

export interface TellLineOptions {
  /** The saved note, always named, so a reader can get the whole record however much was dropped here. */
  noteId: string;
  notesFile: string;
  maxChars?: number;
  /** `detail.<app>` keys to drop, first to go first, when the line is over the limit. */
  dropOrder?: readonly string[];
}

/**
 * The one line typed into a conversation. Always starts `[<app> moment]`, so it can never be read as a slash or shell
 * command. Over the limit it drops `detail` fields in the caller's order and says which, then all of `detail`, then
 * shortens the person's words. The note id and file are always kept.
 */
export function tellLine(message: TellMessage, options: TellLineOptions): string {
  const maxChars = options.maxChars ?? TELL_MAX_CHARS;
  const app = message.app;
  const at = message.moment.position.label ?? String(message.moment.position.value);
  const ref = `note ${options.noteId} in ${options.notesFile}`;
  const build = (said: string, detail: unknown, dropped: readonly string[]): string => {
    const data = {
      open: message.open,
      moment: message.moment,
      ...(detail !== undefined ? { detail } : {}),
      ...(dropped.length ? { dropped } : {}),
    };
    return `[${app} moment] ${said} · at ${at} · ${ref} · ${JSON.stringify(data)}`.replace(
      /\s*\r?\n\s*/g,
      ' ',
    );
  };

  const said = message.said.text ?? '(no words)';
  const whole = message.detail[app] as Record<string, unknown>;
  const dropped: string[] = [];
  const kept = () =>
    Object.fromEntries(Object.entries(whole).filter(([k]) => !dropped.includes(k)));
  let line = build(said, kept(), dropped);
  for (const key of options.dropOrder ?? []) {
    if (line.length <= maxChars) return line;
    if (!(key in whole)) continue;
    dropped.push(key);
    line = build(said, kept(), dropped);
  }
  if (line.length <= maxChars) return line;

  line = build(said, undefined, ['detail']);
  if (line.length <= maxChars) return line;

  const notes = ['detail', 'words shortened'];
  const spare = maxChars - build('', undefined, notes).length - 1;
  return build(`${said.slice(0, Math.max(0, spare))}…`, undefined, notes);
}
