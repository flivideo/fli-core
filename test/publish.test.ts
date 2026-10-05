import { describe, expect, it } from 'vitest';
import {
  NoFinalVideo,
  acceptableRows,
  clock,
  exportApp,
  isPersonChoice,
  launchFacts,
  markPublished,
  parseYoutubeId,
  promoteFile,
  publishReadiness,
  publishedVideos,
  type PublishExport,
  type PublishFacts,
  type PublishReadiness,
  type PublishRow,
} from '../src/publish.js';
import {
  CORE_KINDS,
  EMPTY_RESOURCES,
  addResource,
  mergeRegistry,
  setResourceStatus,
  type Resource,
  type ResourceKind,
  type ResourcesFile,
} from '../src/resources.js';

const NOW = new Date('2026-10-05T06:00:00.000Z');
const registry = mergeRegistry({});
const V = 'cutty-audio-cleanup';

const exp = (over: Partial<PublishExport> & { file: string }): PublishExport => ({
  kind: 'cut',
  variant: null,
  app: 'flicut',
  modifiedAt: '2026-10-05T05:11:00.000Z',
  durationSec: 344,
  srt: null,
  ...over,
});
const a100 = exp({
  file: `videos/${V}/${V}-audio-a100.mp4`,
  kind: 'audio',
  variant: 'a100',
});
const cut = exp({ file: `videos/${V}/${V}-cut.mp4`, modifiedAt: '2026-10-05T04:00:00.000Z' });
const facts = (over: Partial<PublishFacts> = {}): PublishFacts => ({
  video: V,
  exports: [a100, cut],
  edits: [{ file: `fli.cut.${V}.json`, app: 'flicut', modifiedAt: '2026-10-05T05:09:00.000Z' }],
  resources: [],
  launch: null,
  ...over,
});
const rowOf = (f: PublishFacts | PublishReadiness, piece: string) =>
  ('rows' in f ? f : publishReadiness(f)).rows.find((r) => r.piece === piece) as PublishRow;

describe('fli-core defines video, audio and captions as resource kinds (ruling 2)', () => {
  it('every registry carries them, chosen one at a time, from core; a file row restyles one', () => {
    expect(registry.kinds.map((k) => [k.kind, k.choose, k.from])).toEqual([
      ['video', 'one', 'core'],
      ['audio', 'one', 'core'],
      ['captions', 'one', 'core'],
    ]);
    const restyled = mergeRegistry({
      global: {
        ...EMPTY_RESOURCES,
        kinds: [{ ...(CORE_KINDS[0] as ResourceKind), label: 'The cut that ships' }],
      },
    });
    expect(restyled.kinds.find((k) => k.kind === 'video')).toMatchObject({
      label: 'The cut that ships',
      from: 'global',
    });
  });
});

describe('rule 2 — the video: the newest export of the newest edit', () => {
  it('infers the newest FliCut export and reads its audio from the name (D02 today)', () => {
    const r = publishReadiness(facts());
    expect(r.rows.map((x) => x.piece)).toEqual([
      'video',
      'audio',
      'captions',
      'thumbnail',
      'title',
      'description',
      'chapters',
      'studio',
      'published',
    ]);
    expect(r.rows[0]).toMatchObject({
      state: 'inferred',
      value: `${V}-audio-a100.mp4`,
      by: 'rule:newest-export',
      source: 'rule',
    });
    expect(r.rows[1]).toMatchObject({ state: 'inferred', value: 'Strong noise removal' });
    expect((r.rows[1] as PublishRow).why).toContain('a100');
    expect(r).toMatchObject({ ready: 3, total: 9, suggestions: 2 });
    expect(r.counts).toEqual({ set: 1, suggested: 0, inferred: 2, notReady: 6 });
  });

  it('prefers the newest edit’s app: a newer FliEdit edit with a -final wins over a later FliCut export', () => {
    const final = exp({
      file: `videos/${V}/${V}-final.mp4`,
      kind: 'final',
      app: 'fliedit',
      modifiedAt: '2026-10-05T05:00:00.000Z',
    });
    const f = facts({
      exports: [a100, final],
      edits: [
        { file: `fli.cut.${V}.json`, app: 'flicut', modifiedAt: '2026-10-05T03:00:00.000Z' },
        { file: `fli.edit.${V}.json`, app: 'fliedit', modifiedAt: '2026-10-05T04:30:00.000Z' },
      ],
    });
    expect(rowOf(f, 'video')).toMatchObject({ state: 'inferred', file: final.file });
    expect(rowOf(f, 'audio')).toMatchObject({ value: 'As mixed in FliEdit' });
  });

  it('is stale when the edit changed after its newest export, or the newest edit has no export', () => {
    const changed = facts({
      edits: [{ file: `fli.cut.${V}.json`, app: 'flicut', modifiedAt: '2026-10-05T05:30:00.000Z' }],
    });
    expect(rowOf(changed, 'video')).toMatchObject({ state: 'stale' });
    expect(rowOf(changed, 'video').why).toContain('changed after');
    const noExport = facts({
      edits: [
        { file: `fli.edit.${V}.json`, app: 'fliedit', modifiedAt: '2026-10-05T05:30:00.000Z' },
      ],
    });
    expect(rowOf(noExport, 'video')).toMatchObject({ state: 'stale', file: a100.file });
    expect(rowOf(noExport, 'video').why).toContain('FliEdit');
  });

  it('with no edit file, the newest export; with nothing, missing', () => {
    expect(rowOf(facts({ edits: [] }), 'video')).toMatchObject({ state: 'inferred' });
    expect(rowOf(facts({ exports: [] }), 'video').why).toContain('export from FliCut');
    expect(rowOf(facts({ exports: [], edits: [] }), 'video')).toMatchObject({ state: 'missing' });
    expect(rowOf(facts({ exports: [], edits: [] }), 'audio')).toMatchObject({ state: 'missing' });
    expect(rowOf(facts({ exports: [], edits: [] }), 'captions')).toMatchObject({
      state: 'missing',
    });
  });

  it('the audio of a plain -cut is "Off"; an unknown file says it cannot tell', () => {
    expect(rowOf(facts({ exports: [cut] }), 'audio')).toMatchObject({ value: 'Off (untouched)' });
    const odd = exp({ file: `videos/${V}/weird.mp4`, kind: null, app: null });
    expect(rowOf(facts({ exports: [odd], edits: [] }), 'audio')).toMatchObject({
      state: 'missing',
    });
  });
});

describe('rule 1 — a choice wins, and a person’s choice is told apart from an agent’s', () => {
  const promoted = (by: string) =>
    promoteFile(EMPTY_RESOURCES, { kind: 'video', video: V, path: cut.file }, registry, by, NOW);

  it('a person promoting the older -cut makes it the final: set, filled, by them', () => {
    const f = facts({ resources: promoted('human:ui').file.resources });
    expect(rowOf(f, 'video')).toMatchObject({ state: 'set', file: cut.file, by: 'human:ui' });
    expect(rowOf(f, 'video').why).toContain('is newer and is not used');
    expect(rowOf(f, 'audio')).toMatchObject({ value: 'Off (untouched)' });
  });

  it('an agent (or the CLI) promoting it is only a suggestion until a person accepts', () => {
    for (const by of ['agent:tuber', 'cli']) {
      const r = publishReadiness(facts({ resources: promoted(by).file.resources }));
      expect(r.rows[0]).toMatchObject({ state: 'suggested', by });
      expect(r.counts.suggested).toBe(1);
      expect(r.suggestions).toBe(2);
    }
    expect(isPersonChoice('human:ui')).toBe(true);
    expect(isPersonChoice('agent:tuber')).toBe(false);
  });

  it('a chosen file that is gone is stale', () => {
    const gone = promoteFile(
      EMPTY_RESOURCES,
      { kind: 'video', video: V, path: `videos/${V}/${V}-old.mp4` },
      registry,
      'human:ui',
      NOW,
    );
    expect(rowOf(facts({ resources: gone.file.resources }), 'video')).toMatchObject({
      state: 'stale',
    });
  });

  it('promoting twice keeps one resource; promoting another demotes the first (a marker, never a copy)', () => {
    const one = promoted('human:ui');
    expect(one.added).toBe(true);
    const again = promoteFile(
      one.file,
      { kind: 'video', video: V, path: cut.file, meta: { note: 'x' } },
      registry,
      'human:ui',
      NOW,
    );
    expect(again.added).toBe(false);
    expect(again.file.resources).toHaveLength(1);
    expect(again.resource.meta).toEqual({ note: 'x' });
    const other = promoteFile(
      again.file,
      { kind: 'video', video: V, path: a100.file },
      registry,
      'human:ui',
      NOW,
    );
    expect(other.file.resources.map((r) => r.status)).toEqual(['candidate', 'chosen']);
  });

  it('demotes the previous chosen even for a kind with no registry row (a thumbnail)', () => {
    let file = promoteFile(
      EMPTY_RESOURCES,
      { kind: 'thumbnail', video: V, path: 'resources/v/a.png' },
      registry,
      'human:ui',
      NOW,
    ).file;
    file = promoteFile(
      file,
      { kind: 'thumbnail', video: V, path: 'resources/v/b.png' },
      registry,
      'human:ui',
      NOW,
    ).file;
    expect(file.resources.map((r) => r.status)).toEqual(['candidate', 'chosen']);
  });

  it('accepted audio and captions are choices; captions of another export are ignored', () => {
    const withSrt = exp({
      ...a100,
      srt: {
        file: `videos/${V}/${V}-audio-a100.srt`,
        modifiedAt: a100.modifiedAt,
        durationSec: 344,
      },
    });
    let file: ResourcesFile = promoteFile(
      EMPTY_RESOURCES,
      { kind: 'audio', video: V, path: a100.file, meta: { treatment: 'a12' } },
      registry,
      'human:ui',
      NOW,
    ).file;
    file = promoteFile(
      file,
      { kind: 'captions', video: V, path: `videos/${V}/${V}-audio-a100.srt` },
      registry,
      'agent:tuber',
      NOW,
    ).file;
    const f = facts({ exports: [withSrt], resources: file.resources });
    expect(rowOf(f, 'audio')).toMatchObject({ state: 'set', value: 'Gentle noise removal' });
    expect(rowOf(f, 'captions')).toMatchObject({ state: 'suggested', by: 'agent:tuber' });
    expect(rowOf(facts({ resources: file.resources }), 'captions')).toMatchObject({
      state: 'missing',
    });
  });

  it('only resources of this video (or the project) count', () => {
    const elsewhere = promoteFile(
      EMPTY_RESOURCES,
      { kind: 'video', video: 'other-video', path: cut.file },
      registry,
      'human:ui',
      NOW,
    );
    expect(rowOf(facts({ resources: elsewhere.file.resources }), 'video').state).toBe('inferred');
  });
});

describe('rule 3 — captions come from the same export, with the same length', () => {
  const srt = (over: Partial<NonNullable<PublishExport['srt']>> = {}) => ({
    file: `videos/${V}/${V}-audio-a100.srt`,
    modifiedAt: '2026-10-05T05:11:00.000Z',
    durationSec: 343.2,
    ...over,
  });
  it('same stem, same length → inferred', () => {
    const r = rowOf(facts({ exports: [{ ...a100, srt: srt() }, cut] }), 'captions');
    expect(r).toMatchObject({ state: 'inferred', by: 'rule:same-export-captions' });
    expect(r.why).toContain('5:44');
  });
  it('a different length, or written before the export → stale', () => {
    expect(
      rowOf(facts({ exports: [{ ...a100, srt: srt({ durationSec: 300 }) }] }), 'captions').why,
    ).toContain('5:00');
    expect(
      rowOf(
        facts({ exports: [{ ...a100, srt: srt({ modifiedAt: '2026-10-04T00:00:00.000Z' }) }] }),
        'captions',
      ),
    ).toMatchObject({ state: 'stale' });
  });
  it('an unmeasurable length is still inferred, and says so', () => {
    expect(
      rowOf(facts({ exports: [{ ...a100, srt: srt({ durationSec: null }) }] }), 'captions').why,
    ).toContain('could not be measured');
  });
  it('another export’s captions are stale, never borrowed', () => {
    const r = rowOf(
      facts({ exports: [a100, { ...cut, srt: srt({ file: `videos/${V}/${V}-cut.srt` }) }] }),
      'captions',
    );
    expect(r).toMatchObject({ state: 'stale' });
    expect(r.why).toContain('another export');
  });
});

describe('rule 4 — YLO texts are stale when made before the final video', () => {
  const launch = {
    file: 'launch.json',
    madeAt: '2026-09-04T13:54:02.000Z',
    titles: [{ id: 't20', text: 'Clean Audio in a Noisy Room' }],
    description: 'Three fans.\nMore.',
    chapters: [{ n: '01', title: 'Intro', timestamp: '0:00' }],
  };
  it('D02: the 4 Sep run is older than today’s export → title, description, chapters stale', () => {
    const r = publishReadiness(facts({ launch }));
    for (const piece of ['title', 'description', 'chapters']) {
      expect(r.rows.find((x) => x.piece === piece)).toMatchObject({
        state: 'stale',
        by: 'rule:ylo-launch',
        source: 'ylo',
      });
    }
    expect(rowOf(r, 'chapters').why).toContain('old cut');
  });
  it('made after the final → inferred, with slot 1 and the first line', () => {
    const r = publishReadiness(
      facts({ launch: { ...launch, madeAt: '2026-10-05T06:00:00.000Z' } }),
    );
    expect(r.rows.find((x) => x.piece === 'title')).toMatchObject({
      state: 'inferred',
      value: 'Clean Audio in a Noisy Room',
    });
    expect(rowOf(r, 'description').value).toBe('Three fans.');
    expect(rowOf(r, 'chapters').value).toBe('1 chapters');
  });
  it('a chosen title beats YLO; candidates without a choice are counted; no chapters says why', () => {
    let file = addResource(
      EMPTY_RESOURCES,
      { kind: 'title', video: V, text: 'Mine' },
      registry,
      'agent:tuber',
      NOW,
    ).file;
    expect(rowOf(facts({ resources: file.resources }), 'title').why).toContain('1 candidate,');
    file = setResourceStatus(
      file,
      (file.resources[0] as Resource).id,
      'chosen',
      registry,
      'human:ui',
      NOW,
    ).file;
    expect(rowOf(facts({ launch, resources: file.resources }), 'title')).toMatchObject({
      state: 'set',
      value: 'Mine',
    });
    expect(rowOf(facts(), 'chapters').why).toContain('captions');
    const ch = addResource(
      EMPTY_RESOURCES,
      { kind: 'chapters', video: V, status: 'chosen', meta: { chapters: [{}, {}] } },
      registry,
      'agent:ylo',
      NOW,
    ).file;
    expect(rowOf(facts({ resources: ch.resources }), 'chapters')).toMatchObject({
      state: 'suggested',
      value: '2 chapters',
    });
  });
});

describe('rule 5 — thumbnail and visibility are never the rules’ to mark ready', () => {
  it('no thumbnail is ever inferred; candidates and in-test are counted', () => {
    let file = addResource(
      EMPTY_RESOURCES,
      { kind: 'thumbnail', video: V, path: 'resources/x/a.png', status: 'in-test' },
      registry,
      'agent:thumbs',
      NOW,
    ).file;
    const r = rowOf(facts({ resources: file.resources }), 'thumbnail');
    expect(r.state).toBe('missing');
    expect(r.why).toContain('1 in the YouTube test');
    file = addResource(
      file,
      { kind: 'thumbnail', video: V, path: 'resources/x/b.png', status: 'chosen' },
      registry,
      'human:ui',
      NOW,
    ).file;
    expect(rowOf(facts({ resources: file.resources }), 'thumbnail')).toMatchObject({
      state: 'set',
      value: 'b.png',
    });
    expect(rowOf(facts(), 'thumbnail').why).toContain('never choose');
  });
  it('studio settings are the brand default until set; visibility is named as yours', () => {
    expect(rowOf(facts(), 'studio')).toMatchObject({ state: 'default', by: 'rule:brand-default' });
    expect(rowOf(facts(), 'studio').why).toContain('Visibility is always yours');
    const s = addResource(
      EMPTY_RESOURCES,
      { kind: 'studio-settings', video: V, status: 'chosen', title: 'Howto, not for kids' },
      registry,
      'human:ui',
      NOW,
    ).file;
    expect(rowOf(facts({ resources: s.resources }), 'studio')).toMatchObject({
      state: 'set',
      value: 'Howto, not for kids',
    });
  });
});

describe('ruling 4 — marking published records the YouTube id, link and when', () => {
  it('needs a final; publishes it and every other chosen resource of the video', () => {
    expect(() => markPublished(EMPTY_RESOURCES, V, 'dQw4w9WgXcQ', 'human:ui', NOW)).toThrow(
      NoFinalVideo,
    );
    let file = promoteFile(
      EMPTY_RESOURCES,
      { kind: 'video', video: V, path: cut.file },
      registry,
      'human:ui',
      NOW,
    ).file;
    file = addResource(
      file,
      { kind: 'title', video: V, text: 'T', status: 'chosen' },
      registry,
      'human:ui',
      NOW,
    ).file;
    file = addResource(
      file,
      { kind: 'title', video: 'other', text: 'U', status: 'chosen' },
      registry,
      'human:ui',
      NOW,
    ).file;
    expect(() => markPublished(file, V, 'not an id', 'human:ui', NOW)).toThrow(/not a YouTube id/);
    const out = markPublished(file, V, 'https://youtu.be/dQw4w9WgXcQ', 'agent:tuber', NOW);
    expect(out.video.meta).toEqual({
      youtubeId: 'dQw4w9WgXcQ',
      url: 'https://youtu.be/dQw4w9WgXcQ',
      publishedAt: NOW.toISOString(),
    });
    expect(out.published.map((r) => r.kind)).toEqual(['video', 'title']);
    expect(out.file.resources.map((r) => r.status)).toEqual(['published', 'published', 'chosen']);
    const r = publishReadiness(facts({ resources: out.file.resources }));
    expect(r.rows.find((x) => x.piece === 'published')).toMatchObject({
      state: 'set',
      value: 'https://youtu.be/dQw4w9WgXcQ',
      by: 'agent:tuber',
    });
    expect(r.rows[0]).toMatchObject({ state: 'suggested', file: cut.file });
    expect(publishedVideos(out.file.resources)).toEqual([
      {
        resourceId: out.video.id,
        video: V,
        path: cut.file,
        youtubeId: 'dQw4w9WgXcQ',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        publishedAt: NOW.toISOString(),
        by: 'agent:tuber',
      },
    ]);
  });

  it('reads an id from the id or any common link', () => {
    for (const s of [
      'dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtube.com/shorts/dQw4w9WgXcQ',
      'https://studio.youtube.com/video/dQw4w9WgXcQ/edit',
    ]) {
      expect(parseYoutubeId(s)).toBe('dQw4w9WgXcQ');
    }
    expect(parseYoutubeId('https://youtu.be/short')).toBeNull();
    expect(parseYoutubeId('dQw4w9WgXcQx')).toBeNull();
  });
});

describe('accept: what a person can turn into their choice', () => {
  it('lists the suggested and inferred rows that name something, never studio or published', () => {
    const r = publishReadiness(
      facts({
        exports: [
          {
            ...a100,
            srt: {
              file: `videos/${V}/${V}-audio-a100.srt`,
              modifiedAt: a100.modifiedAt,
              durationSec: 344,
            },
          },
        ],
        launch: {
          file: 'launch.json',
          madeAt: '2026-10-05T06:00:00.000Z',
          titles: [{ id: 't1', text: 'T' }],
          description: 'D',
          chapters: [],
        },
      }),
    );
    expect(acceptableRows(r).map((x) => x.piece)).toEqual([
      'video',
      'audio',
      'captions',
      'title',
      'description',
    ]);
    expect(r).toMatchObject({ ready: 6, suggestions: 5 });
  });
});

describe('launchFacts — YLO launch.json, read tolerantly', () => {
  it('titles follow the variant slots; description.full and chapters; updated_at as when', () => {
    const l = launchFacts(
      {
        updated_at: '2026-09-04T20:54:02+07:00',
        candidates: {
          titles: [
            { id: 't01', text: 'One', rank: 2 },
            { id: 't20', text: 'Twenty', rank: 1 },
          ],
        },
        variants: [
          { slot: 2, title_ref: 't01' },
          { slot: 1, title_ref: 't20' },
          { slot: 3, title_ref: 'gone' },
        ],
        description: { full: 'Full', short: 'Short', chapters: [{ n: '01' }, 'junk'] },
      },
      'launch.json',
      NOW.toISOString(),
    );
    expect(l).toEqual({
      file: 'launch.json',
      madeAt: '2026-09-04T13:54:02.000Z',
      titles: [
        { id: 't20', text: 'Twenty' },
        { id: 't01', text: 'One' },
      ],
      description: 'Full',
      chapters: [{ n: '01' }],
    });
  });
  it('no slots → candidates by rank; nothing usable → empty; not an object → null', () => {
    const l = launchFacts(
      {
        candidates: { titles: [{ text: 'B', rank: 2 }, { id: 'a', text: 'A', rank: 1 }, 7] },
        description: { short: 'S' },
      },
      'launch.json',
      NOW.toISOString(),
    );
    expect(l).toMatchObject({
      madeAt: NOW.toISOString(),
      titles: [
        { id: 'a', text: 'A' },
        { id: null, text: 'B' },
      ],
      description: 'S',
      chapters: [],
    });
    expect(launchFacts({}, 'launch.json', NOW.toISOString())).toMatchObject({
      titles: [],
      description: null,
    });
    expect(launchFacts([1], 'launch.json', NOW.toISOString())).toBeNull();
  });
});

describe('small helpers', () => {
  it('clock and exportApp', () => {
    expect(clock(344)).toBe('5:44');
    expect(clock(3725)).toBe('1:02:05');
    expect(exportApp('audio')).toBe('flicut');
    expect(exportApp('overlay')).toBe('fliedit');
    expect(exportApp(null)).toBeNull();
  });
});
