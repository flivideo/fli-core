import { z } from 'zod';
import { type PrincipalName } from './capability.js';
import {
  Resource,
  ResourceNotFound,
  addResource,
  setResourceStatus,
  type ResourceChange,
  type ResourceRegistry,
  type ResourcesFile,
} from './resources.js';
import { stampOf } from './stamp.js';

/**
 * Ready for YouTube (David 2026-10-05, mock https://claude.ai/artifact/9hLAvSeF9b6DJWEX3yMEmP): a VIEW over files and
 * choices that already exist — never a new folder or a copy. Every piece that goes to YouTube is a row; a choice David
 * (or an agent) made wins; otherwise a rule makes a labelled guess and says why. Pure: the app gathers the facts (files,
 * times, lengths, the resources, YLO's `launch.json`) and these functions judge them, so every app judges the same way.
 *
 * The rules (mock §"Readiness rules"):
 * 1. A choice always wins over a guess, and stays until it is changed.
 * 2. Video: the newest export of the newest edit, from whichever app made it (FliCut alone is a complete edit). It must
 *    be newer than that edit's last change, or it is stale.
 * 3. Captions must come from the same export as the video, and their length must match it.
 * 4. Titles, description and chapters are stale if they were made before the final video.
 * 5. Thumbnail and visibility are always a person's: the rules never mark them ready.
 * Each verdict keeps its `why`, ready for the transcription-style audit trail (not built here).
 */

export const PUBLISH_PIECES = [
  'video',
  'audio',
  'captions',
  'thumbnail',
  'title',
  'description',
  'chapters',
  'studio',
  'published',
] as const;
export const PublishPiece = z.enum(PUBLISH_PIECES);
export type PublishPiece = z.infer<typeof PublishPiece>;

const LABELS: Record<PublishPiece, string> = {
  video: 'Video',
  audio: 'Audio',
  captions: 'Captions',
  thumbnail: 'Thumbnail',
  title: 'Title',
  description: 'Description',
  chapters: 'Chapters',
  studio: 'Studio settings',
  published: 'Published link',
};

/**
 * Human vs AI must be visible (David 2026-10-05): `set` — a person's choice; `suggested` — an agent's choice (Tuber,
 * YLO…), waiting for a person to accept it; `inferred` — a rule's guess; `default` — the brand's default applies;
 * `missing`; `stale`. Suggestions count as ready, but always separately ("6/9 ready · 3 are suggestions").
 */
export const PublishState = z.enum(['set', 'suggested', 'inferred', 'default', 'missing', 'stale']);
export type PublishState = z.infer<typeof PublishState>;

/** The states that count as ready. */
export const READY_STATES: readonly PublishState[] = ['set', 'suggested', 'inferred', 'default'];
/** The ready states a person has not decided. */
export const SUGGESTION_STATES: readonly PublishState[] = ['suggested', 'inferred'];

/** A choice is a person's when its principal is `human:…`; `cli` and `agent:…` choices are suggestions. */
export function isPersonChoice(by: string): boolean {
  return by.startsWith('human:');
}

/** The rule behind each guess: a row's `by` is `rule:<id>`. */
export const PUBLISH_RULES = {
  'newest-export': 'The newest export of the newest edit, from whichever app made it.',
  'audio-from-name': "The audio treatment read from the export's file name.",
  'same-export-captions': 'Captions from the same export as the video, with a matching length.',
  'ylo-launch': "YLO's launch.json, stale when made before the final video.",
  'brand-default': "The brand's Studio defaults.",
} as const;
export type PublishRuleId = keyof typeof PUBLISH_RULES;

/** The app that writes an export kind: FliCut writes `-cut` and `-audio-<treatment>`, FliEdit `-final` (+ overlays). */
export const EditApp = z.enum(['flicut', 'fliedit']);
export type EditApp = z.infer<typeof EditApp>;

const Iso = z.iso.datetime({ offset: true });

/** One file in `videos/<name>/` that a person could ship, with its caption file beside it (same stem) if any. */
export const PublishExport = z.object({
  /** Project-relative, `/`-separated. */
  file: z.string().min(1),
  /** `cut` · `audio` · `final` · `overlay` (D15) · `part`, or null for a file that does not parse. */
  kind: z.enum(['cut', 'audio', 'final', 'overlay', 'part']).nullable(),
  variant: z.string().nullable(),
  app: EditApp.nullable(),
  /**
   * Where the file came from, in words, when the app knows better than the kind does ("FliCut export", "FliEdit
   * export", "generated render", "placed file"). Shown instead of guessing an app from the name.
   */
  source: z.string().nullable().default(null),
  modifiedAt: Iso,
  durationSec: z.number().nullable(),
  srt: z
    .object({ file: z.string().min(1), modifiedAt: Iso, durationSec: z.number().nullable() })
    .nullable(),
});
export type PublishExport = z.infer<typeof PublishExport>;

/** An edit document for the video: FliCut's `fli.cut.<name>.json` or FliEdit's `fli.edit.<name>.json`. */
export const PublishEdit = z.object({ file: z.string().min(1), app: EditApp, modifiedAt: Iso });
export type PublishEdit = z.infer<typeof PublishEdit>;

/** What YLO's `launch.json` (the workshop) offers, reduced to what the rules need. */
export const PublishLaunch = z.object({
  file: z.string().min(1),
  /** When its texts were made (`updated_at`, else the file's time). */
  madeAt: Iso,
  /** The titles bound to YLO's variant slots, slot 1 first. */
  titles: z.array(z.object({ id: z.string().nullable(), text: z.string() })),
  description: z.string().nullable(),
  /** YLO's `Chapter{n,title,timestamp}` list (empty when none). */
  chapters: z.array(z.record(z.string(), z.unknown())),
});
export type PublishLaunch = z.infer<typeof PublishLaunch>;

export const PublishFacts = z.object({
  /** The video folder name, or null for a project with no video yet. */
  video: z.string().nullable(),
  exports: z.array(PublishExport),
  edits: z.array(PublishEdit),
  /** The project's resources for this video (and the project's own, `video: null`). */
  resources: z.array(Resource),
  launch: PublishLaunch.nullable(),
});
export type PublishFacts = z.infer<typeof PublishFacts>;

export const PublishRow = z.object({
  piece: PublishPiece,
  label: z.string(),
  state: PublishState,
  /** What would ship, in a few words (a file name, a title, "Strong noise removal"). */
  value: z.string().nullable(),
  /** The project-relative file behind it, when there is one. */
  file: z.string().nullable(),
  /** Where the answer came from: `choice`, `rule`, `brand`, `ylo`, or `none`. */
  source: z.enum(['choice', 'rule', 'brand', 'ylo', 'none']),
  /** One line: why this state. Kept for the audit trail. */
  why: z.string(),
  /** The resource behind a choice, so a person or agent can change it. */
  resourceId: z.string().nullable(),
  /** Who made it: a principal (`human:ui`, `agent:tuber`, `cli`) or `rule:<id>`; null when nothing is there. */
  by: z.string().nullable(),
  /** When the thing behind it was made or chosen (for an ⓘ, never shown as a timestamp). */
  at: Iso.nullable(),
});
export type PublishRow = z.infer<typeof PublishRow>;

export const PublishReadiness = z.object({
  video: z.string().nullable(),
  rows: z.array(PublishRow),
  ready: z.number().int(),
  total: z.number().int(),
  /** Ready rows a person has not decided (agent choices + rule guesses). */
  suggestions: z.number().int(),
  counts: z.object({
    set: z.number().int(),
    suggested: z.number().int(),
    inferred: z.number().int(),
    notReady: z.number().int(),
  }),
});
export type PublishReadiness = z.infer<typeof PublishReadiness>;

/** FliCut's audio treatments by file token (flicut `ARM_REGISTRY`, plain labels). An unknown token shows as itself. */
export const AUDIO_TREATMENTS: Readonly<Record<string, string>> = Object.freeze({
  none: 'Off (untouched)',
  raw: 'Off (untouched)',
  a12: 'Gentle noise removal',
  a100: 'Strong noise removal',
  auphonic: 'Server enhancement',
});

/** The app that writes a D15 export kind. */
export function exportApp(kind: PublishExport['kind']): EditApp | null {
  if (kind === 'cut' || kind === 'audio' || kind === 'part') return 'flicut';
  if (kind === 'final' || kind === 'overlay') return 'fliedit';
  return null;
}

const APP_NAMES: Record<EditApp, string> = { flicut: 'FliCut', fliedit: 'FliEdit' };
const LIVE = new Set(['chosen', 'published']);
const base = (file: string) => file.split('/').pop() as string;

/** `5:44` from seconds. */
export function clock(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** The caption length matches the video's when they differ by no more than this. */
export const CAPTION_LENGTH_TOLERANCE_SEC = 2;

/** The newest live (`chosen`, then `published`) resource of a kind; a chosen one is the newer decision. */
function liveOf(resources: Resource[], kind: string): Resource | null {
  const of = resources.filter((r) => r.kind === kind && LIVE.has(r.status));
  const newest = (rs: Resource[]) =>
    [...rs].sort((a, b) => b.changed.at.localeCompare(a.changed.at))[0] ?? null;
  return newest(of.filter((r) => r.status === 'chosen')) ?? newest(of);
}

const newestFirst = <T extends { modifiedAt: string }>(xs: T[]) =>
  [...xs].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

function row(
  piece: PublishPiece,
  state: PublishState,
  why: string,
  more: Partial<Omit<PublishRow, 'piece' | 'label' | 'state' | 'why'>> = {},
): PublishRow {
  return {
    piece,
    label: LABELS[piece],
    state,
    why,
    value: more.value ?? null,
    file: more.file ?? null,
    source: more.source ?? 'none',
    resourceId: more.resourceId ?? null,
    by: more.by ?? null,
    at: more.at ?? null,
  };
}

/** A row for a live resource: `set` when a person chose it, `suggested` when an agent (or the CLI) did. */
function choiceRow(
  piece: PublishPiece,
  r: Resource,
  why: { person: string; agent: string },
  more: Partial<Omit<PublishRow, 'piece' | 'label' | 'state' | 'why'>> = {},
): PublishRow {
  const person = isPersonChoice(r.changed.by);
  return row(piece, person ? 'set' : 'suggested', person ? why.person : why.agent, {
    source: 'choice',
    resourceId: r.id,
    by: r.changed.by,
    at: r.changed.at,
    ...more,
  });
}
const rule = (id: PublishRuleId) => `rule:${id}`;

/** The video that would ship and the row for it (rules 1 and 2). */
function videoRow(f: PublishFacts): { row: PublishRow; final: PublishExport | null } {
  const chosen = liveOf(f.resources, 'video');
  if (chosen?.path) {
    const final = f.exports.find((e) => e.file === chosen.path) ?? null;
    const label = base(chosen.path);
    if (!final) {
      return {
        final: null,
        row: row('video', 'stale', `${label} was chosen, but it is no longer in videos/.`, {
          value: label,
          file: chosen.path,
          source: 'choice',
          resourceId: chosen.id,
          by: chosen.changed.by,
          at: chosen.changed.at,
        }),
      };
    }
    const newer = newestFirst(f.exports).find(
      (e) => e.file !== final.file && e.modifiedAt > final.modifiedAt,
    );
    const note = newer ? `; ${base(newer.file)} is newer and is not used` : '';
    return {
      final,
      row: choiceRow(
        'video',
        chosen,
        {
          person: `You made this the final${note}.`,
          agent: `${chosen.changed.by} suggests this as the final${note}.`,
        },
        { value: label, file: final.file },
      ),
    };
  }
  if (f.exports.length === 0) {
    const edit = newestFirst(f.edits)[0];
    return {
      final: null,
      row: row(
        'video',
        'missing',
        edit
          ? `No export in videos/${f.video ?? ''} yet; export from ${APP_NAMES[edit.app]}.`
          : 'No edit and no export yet.',
      ),
    };
  }
  const edit = newestFirst(f.edits)[0] ?? null;
  // A part or an overlay is a piece of a video, never the video that ships.
  const shippable = f.exports.filter((e) => e.kind !== 'part' && e.kind !== 'overlay');
  if (shippable.length === 0) {
    return {
      final: null,
      row: row(
        'video',
        'missing',
        'Only parts and overlays in videos/; no whole video to ship yet.',
      ),
    };
  }
  const fromEdit = edit ? newestFirst(shippable.filter((e) => e.app === edit.app)) : [];
  const final = fromEdit[0] ?? (newestFirst(shippable)[0] as PublishExport);
  const more = {
    value: base(final.file),
    file: final.file,
    source: 'rule' as const,
    by: rule('newest-export'),
    at: final.modifiedAt,
  };
  if (edit && fromEdit.length === 0) {
    return {
      final,
      row: row(
        'video',
        'stale',
        `The newest edit is in ${APP_NAMES[edit.app]} and has no export yet; this one is older.`,
        more,
      ),
    };
  }
  if (edit && final.modifiedAt < edit.modifiedAt) {
    return {
      final,
      row: row(
        'video',
        'stale',
        `The ${APP_NAMES[edit.app]} edit changed after this export; export again.`,
        more,
      ),
    };
  }
  const from = final.source ?? (final.app ? APP_NAMES[final.app] : null);
  const by = from ? ` (${from})` : '';
  return {
    final,
    row: row(
      'video',
      'inferred',
      edit ? `The newest export of the newest edit${by}.` : `The newest export in videos/${by}.`,
      more,
    ),
  };
}

function audioRow(f: PublishFacts, final: PublishExport | null): PublishRow {
  const chosen = liveOf(f.resources, 'audio');
  if (chosen) {
    const token = typeof chosen.meta?.treatment === 'string' ? chosen.meta.treatment : null;
    return choiceRow(
      'audio',
      chosen,
      { person: 'You chose this audio.', agent: `${chosen.changed.by} suggests this audio.` },
      {
        value: token ? (AUDIO_TREATMENTS[token] ?? token) : (chosen.title ?? chosen.path ?? null),
        file: chosen.path ?? null,
      },
    );
  }
  if (!final) return row('audio', 'missing', 'Waits for the video.');
  const at = {
    file: final.file,
    source: 'rule' as const,
    by: rule('audio-from-name'),
    at: final.modifiedAt,
  };
  if (final.kind === 'audio' && final.variant) {
    return row('audio', 'inferred', `Read from the file name (${final.variant}).`, {
      ...at,
      value: AUDIO_TREATMENTS[final.variant] ?? final.variant,
    });
  }
  if (final.kind === 'cut') {
    return row('audio', 'inferred', 'A plain -cut export: no noise removal.', {
      ...at,
      value: AUDIO_TREATMENTS.none as string,
    });
  }
  if (final.kind === 'final') {
    if (final.app === 'fliedit') {
      return row('audio', 'inferred', 'As mixed in FliEdit.', {
        ...at,
        value: 'As mixed in FliEdit',
      });
    }
    const from = final.source ?? 'placed file';
    return row('audio', 'inferred', `The final is a ${from}; its audio is what it holds.`, {
      ...at,
      value: `As in the ${from}`,
    });
  }
  return row('audio', 'missing', `Cannot tell the audio from ${base(final.file)}.`, {
    file: final.file,
  });
}

function captionsRow(f: PublishFacts, final: PublishExport | null): PublishRow {
  const chosen = liveOf(f.resources, 'captions');
  if (chosen?.path && final && chosen.path === final.srt?.file) {
    return choiceRow(
      'captions',
      chosen,
      {
        person: 'You accepted these captions.',
        agent: `${chosen.changed.by} suggests these captions.`,
      },
      { value: base(chosen.path), file: chosen.path },
    );
  }
  if (!final) return row('captions', 'missing', 'Waits for the video.');
  const srt = final.srt;
  const by = rule('same-export-captions');
  if (!srt) {
    const other = newestFirst(
      f.exports.flatMap((e) => (e.srt && e.file !== final.file ? [e.srt] : [])),
    )[0];
    return other
      ? row(
          'captions',
          'stale',
          `No .srt beside ${base(final.file)}; ${base(other.file)} belongs to another export.`,
          { file: other.file, source: 'rule', by, at: other.modifiedAt },
        )
      : row('captions', 'missing', `No .srt beside ${base(final.file)}; export it with captions.`);
  }
  const more = {
    value: base(srt.file),
    file: srt.file,
    source: 'rule' as const,
    by,
    at: srt.modifiedAt,
  };
  if (srt.modifiedAt < final.modifiedAt) {
    return row('captions', 'stale', 'Written before this export of the video.', more);
  }
  if (srt.durationSec !== null && final.durationSec !== null) {
    const gap = Math.abs(srt.durationSec - final.durationSec);
    if (gap > CAPTION_LENGTH_TOLERANCE_SEC) {
      return row(
        'captions',
        'stale',
        `Captions run ${clock(srt.durationSec)}, the video ${clock(final.durationSec)}.`,
        more,
      );
    }
    return row(
      'captions',
      'inferred',
      `From the same export, same length (${clock(final.durationSec)}).`,
      more,
    );
  }
  return row(
    'captions',
    'inferred',
    'From the same export; the length could not be measured.',
    more,
  );
}

/** Rule 4 for a YLO text: stale when it was made before the final video. */
function yloRow(
  piece: 'title' | 'description' | 'chapters',
  f: PublishFacts,
  final: PublishExport | null,
): PublishRow {
  const chosen = liveOf(f.resources, piece);
  const noun = piece === 'chapters' ? 'chapter list' : piece;
  if (chosen) {
    const chapters = Array.isArray(chosen.meta?.chapters) ? chosen.meta.chapters.length : 0;
    return choiceRow(
      piece,
      chosen,
      { person: `You chose this ${noun}.`, agent: `${chosen.changed.by} suggests this ${noun}.` },
      {
        value:
          piece === 'chapters'
            ? `${chapters} chapters`
            : firstLine(chosen.text ?? chosen.title ?? ''),
      },
    );
  }
  const launch = f.launch;
  const offered =
    launch &&
    (piece === 'title'
      ? launch.titles.length > 0
      : piece === 'description'
        ? launch.description !== null
        : launch.chapters.length > 0);
  const candidates = f.resources.filter((r) => r.kind === piece && r.status !== 'retired').length;
  if (!launch || !offered) {
    if (piece === 'chapters') {
      return row(piece, 'missing', "Chapters come from the final video's captions; none yet.");
    }
    return row(
      piece,
      'missing',
      candidates > 0
        ? `${candidates} candidate${candidates === 1 ? '' : 's'}, none chosen.`
        : 'Nothing yet: Tuber or YLO writes it.',
    );
  }
  const value =
    piece === 'title'
      ? (launch.titles[0] as { text: string }).text
      : piece === 'description'
        ? firstLine(launch.description as string)
        : `${launch.chapters.length} chapters`;
  const more = {
    value,
    file: launch.file,
    source: 'ylo' as const,
    by: rule('ylo-launch'),
    at: launch.madeAt,
  };
  if (final && launch.madeAt < final.modifiedAt) {
    return row(
      piece,
      'stale',
      `Made by YLO before the final video${piece === 'chapters' ? '; the timestamps follow the old cut' : ''}.`,
      more,
    );
  }
  return row(
    piece,
    'inferred',
    piece === 'title'
      ? `YLO's slot 1 of ${launch.titles.length}; accept it to make it yours.`
      : "From YLO's launch.json; accept it to make it yours.",
    more,
  );
}

function firstLine(text: string): string {
  const line = text.split('\n').find((l) => l.trim() !== '') ?? '';
  return line.length > 120 ? `${line.slice(0, 119)}…` : line;
}

/** Rule 5: never inferred. An agent's choice is still only a suggestion. */
function thumbnailRow(f: PublishFacts): PublishRow {
  const chosen = liveOf(f.resources, 'thumbnail');
  const inTest = f.resources.filter((r) => r.kind === 'thumbnail' && r.status === 'in-test').length;
  const test = inTest > 0 ? `; ${inTest} in the YouTube test` : '';
  if (chosen) {
    return choiceRow(
      'thumbnail',
      chosen,
      {
        person: `You chose this thumbnail${test}.`,
        agent: `${chosen.changed.by} suggests this thumbnail${test}.`,
      },
      {
        value: chosen.title ?? (chosen.path ? base(chosen.path) : null),
        file: chosen.path ?? null,
      },
    );
  }
  const candidates = f.resources.filter(
    (r) => r.kind === 'thumbnail' && r.status !== 'retired',
  ).length;
  return row(
    'thumbnail',
    'missing',
    candidates > 0
      ? `${candidates} candidate${candidates === 1 ? '' : 's'}${test}, none chosen. The rules never choose a thumbnail.`
      : 'Nothing chosen. The rules never choose a thumbnail.',
  );
}

function studioRow(f: PublishFacts): PublishRow {
  const chosen = liveOf(f.resources, 'studio-settings');
  if (chosen) {
    return choiceRow(
      'studio',
      chosen,
      {
        person: 'You set these for this video.',
        agent: `${chosen.changed.by} suggests these settings.`,
      },
      { value: chosen.title ?? firstLine(chosen.text ?? '') },
    );
  }
  return row(
    'studio',
    'default',
    "Brand defaults apply until Tuber's checklist runs. Visibility is always yours, at upload.",
    {
      value: 'Category, audience, playlists, end screen',
      source: 'brand',
      by: rule('brand-default'),
    },
  );
}

function publishedRow(f: PublishFacts): PublishRow {
  const published = publishedVideos(f.resources)[0];
  if (published) {
    return row('published', 'set', `Marked published by ${published.by}.`, {
      value: published.url,
      file: published.path,
      source: 'choice',
      resourceId: published.resourceId,
      by: published.by,
      at: published.publishedAt,
    });
  }
  return row('published', 'missing', 'Not on YouTube yet; mark it published with its YouTube id.');
}

/** Judge one video's readiness. Pure. */
export function publishReadiness(input: z.input<typeof PublishFacts>): PublishReadiness {
  const f = PublishFacts.parse(input);
  const own = {
    ...f,
    resources: f.resources.filter((r) => r.video === f.video || r.video === null),
  };
  const video = videoRow(own);
  const rows = [
    video.row,
    audioRow(own, video.final),
    captionsRow(own, video.final),
    thumbnailRow(own),
    yloRow('title', own, video.final),
    yloRow('description', own, video.final),
    yloRow('chapters', own, video.final),
    studioRow(own),
    publishedRow(own),
  ];
  const count = (...states: PublishState[]) => rows.filter((r) => states.includes(r.state)).length;
  const set = count('set', 'default');
  const suggested = count('suggested');
  const inferred = count('inferred');
  return {
    video: f.video,
    rows,
    ready: count(...READY_STATES),
    total: rows.length,
    suggestions: count(...SUGGESTION_STATES),
    counts: { set, suggested, inferred, notReady: rows.length - set - suggested - inferred },
  };
}

/**
 * What `accept` would turn into a person's choice: every `suggested` or `inferred` row that names something to keep
 * (a file, a resource, or a YLO text). Studio defaults and the published link are never suggestions.
 */
export function acceptableRows(readiness: PublishReadiness): PublishRow[] {
  return readiness.rows.filter(
    (r) =>
      SUGGESTION_STATES.includes(r.state) &&
      (r.resourceId !== null || r.file !== null) &&
      r.piece !== 'studio' &&
      r.piece !== 'published',
  );
}

/**
 * The hook for whatever comes after publishing (post-publish posts, YLO's related-videos linking): every published
 * video in a project's resources, newest first, with its YouTube id, link and when. Read `fli.resources.json` (fli-core
 * `readResources`) and call this; FliStudio's `publish.published` answers the same across a brand.
 */
export const PublishedVideo = z.object({
  resourceId: z.string(),
  video: z.string().nullable(),
  path: z.string().nullable(),
  youtubeId: z.string(),
  url: z.string(),
  publishedAt: Iso,
  by: z.string(),
});
export type PublishedVideo = z.infer<typeof PublishedVideo>;

export function publishedVideos(resources: Resource[]): PublishedVideo[] {
  return resources
    .filter(
      (r) =>
        r.kind === 'video' && r.status === 'published' && typeof r.meta?.youtubeId === 'string',
    )
    .map((r) => {
      const youtubeId = r.meta?.youtubeId as string;
      return {
        resourceId: r.id,
        video: r.video,
        path: r.path ?? null,
        youtubeId,
        url: typeof r.meta?.url === 'string' ? r.meta.url : youtubeUrl(youtubeId),
        publishedAt: typeof r.meta?.publishedAt === 'string' ? r.meta.publishedAt : r.changed.at,
        by: r.changed.by,
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** An 11-character YouTube id, from the id itself or a watch / youtu.be / shorts / studio link; null otherwise. */
export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m =
    /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/live\/|\/embed\/|\/video\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/.exec(
      s,
    );
  return m ? (m[1] as string) : null;
}

export function youtubeUrl(id: string): string {
  return `https://youtu.be/${id}`;
}

/**
 * Promote a file (ruling 1: a marker, never a copy): the resource of `kind` for `video` whose `path` is `path` becomes
 * `chosen` — added when there is none — and the kind's previous chosen one goes back to `candidate`. Pure.
 */
export function promoteFile(
  file: ResourcesFile,
  target: {
    kind: string;
    video: string | null;
    path: string;
    title?: string;
    meta?: Record<string, unknown>;
  },
  registry: ResourceRegistry,
  by: PrincipalName,
  now: Date = new Date(),
): ResourceChange & { added: boolean } {
  const existing = file.resources.find(
    (r) => r.kind === target.kind && r.video === target.video && r.path === target.path,
  );
  let change: ResourceChange;
  if (existing) {
    const withMeta =
      target.meta === undefined
        ? file
        : {
            ...file,
            resources: file.resources.map((r) =>
              r.id === existing.id ? { ...r, meta: { ...r.meta, ...target.meta } } : r,
            ),
          };
    change = setResourceStatus(withMeta, existing.id, 'chosen', registry, by, now);
  } else {
    change = addResource(
      file,
      {
        kind: target.kind,
        video: target.video,
        path: target.path,
        status: 'chosen',
        ...(target.title ? { title: target.title } : {}),
        ...(target.meta ? { meta: target.meta } : {}),
      },
      registry,
      by,
      now,
    );
  }
  // One thing ships per piece, whatever the kind's row says (a thumbnail without a registry row included).
  const stamp = stampOf(by, now);
  const resources = change.file.resources.map((r) =>
    r.id !== change.resource.id &&
    r.kind === target.kind &&
    r.video === target.video &&
    r.status === 'chosen'
      ? { ...r, status: 'candidate' as const, changed: stamp }
      : r,
  );
  return { ...change, file: { ...change.file, resources }, added: !existing };
}

/** Thrown by `markPublished` when the video has no chosen final to publish. */
export class NoFinalVideo extends Error {
  constructor(readonly video: string | null) {
    super(`${video ?? 'The project'} has no final video yet; promote one first.`);
  }
}

/**
 * Mark a video published (ruling 4): its chosen `video` resource becomes `published` and keeps the YouTube id
 * (`meta.youtubeId`, `meta.url`, `meta.publishedAt` — read back with `publishedVideos`); every other chosen resource of that video goes `published` with it, so what shipped has one
 * status. Throws `NoFinalVideo` without a chosen (or already published) video, `ResourceNotFound` never. Pure.
 */
export function markPublished(
  file: ResourcesFile,
  video: string | null,
  youtubeId: string,
  by: PrincipalName,
  now: Date = new Date(),
): { file: ResourcesFile; video: Resource; published: Resource[] } {
  const id = parseYoutubeId(youtubeId);
  if (id === null) throw new Error(`"${youtubeId}" is not a YouTube id or link.`);
  const mine = file.resources.filter((r) => r.video === video);
  const final = liveOf(mine, 'video');
  if (!final) throw new NoFinalVideo(video);
  const stamp = stampOf(by, now);
  const published: Resource[] = [];
  const resources = file.resources.map((r) => {
    if (r.id === final.id) {
      const next = Resource.parse({
        ...r,
        status: 'published',
        meta: { ...r.meta, youtubeId: id, url: youtubeUrl(id), publishedAt: stamp.at },
        changed: stamp,
      });
      published.push(next);
      return next;
    }
    if (r.video === video && r.status === 'chosen' && r.kind !== 'video') {
      const next = { ...r, status: 'published' as const, changed: stamp };
      published.push(next);
      return next;
    }
    return r;
  });
  const videoResource = published.find((r) => r.id === final.id);
  if (!videoResource) throw new ResourceNotFound(final.id);
  return { file: { ...file, resources }, video: videoResource, published };
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/**
 * Reduce YLO's `launch.json` (the workshop; contract `agents/ylo/docs/schema/launch-metadata.schema.ts`) to what the
 * rules need — tolerant: anything missing is simply not offered, and a file that is not an object answers null.
 * Titles: the variant slots' `title_ref`s in slot order, else the candidates by rank. `fileTime` is the fallback for
 * when it was made.
 */
export function launchFacts(value: unknown, file: string, fileTime: string): PublishLaunch | null {
  const root = asRecord(value);
  if (!root) return null;
  const candidates = asRecord(root.candidates);
  const pool = (Array.isArray(candidates?.titles) ? candidates.titles : [])
    .map(asRecord)
    .filter((t): t is Record<string, unknown> => t !== null && typeof t.text === 'string');
  const byId = new Map(pool.map((t) => [String(t.id), t]));
  const slots = (Array.isArray(root.variants) ? root.variants : [])
    .map(asRecord)
    .filter((v): v is Record<string, unknown> => v !== null)
    .sort((a, b) => Number(a.slot ?? 0) - Number(b.slot ?? 0))
    .map((v) => byId.get(String(v.title_ref)))
    .filter((t): t is Record<string, unknown> => t !== undefined);
  const ranked = [...pool].sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99));
  const titles = (slots.length > 0 ? slots : ranked).map((t) => ({
    id: typeof t.id === 'string' ? t.id : null,
    text: t.text as string,
  }));
  const description = asRecord(root.description);
  const full =
    typeof description?.full === 'string'
      ? description.full
      : typeof description?.short === 'string'
        ? description.short
        : null;
  const chapters = (Array.isArray(description?.chapters) ? description.chapters : [])
    .map(asRecord)
    .filter((c): c is Record<string, unknown> => c !== null);
  const at = Iso.safeParse(root.updated_at);
  return PublishLaunch.parse({
    file,
    madeAt: at.success ? new Date(at.data).toISOString() : fileTime,
    titles,
    description: full,
    chapters,
  });
}
