import { describe, expect, it } from 'vitest';
import { appFileName, parseAppFile, type AppFile } from '../src/app-file.js';
import { parseProjectFolder, projectFolderName } from '../src/project-folder.js';
import { parseRecording, recordingFileName, type Recording } from '../src/recording.js';
import { FliCoreError } from '../src/results.js';
import {
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  videoFolderName,
  type VideoFile,
} from '../src/video-file.js';

function thrown(fn: () => unknown): FliCoreError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(FliCoreError);
    return error as FliCoreError;
  }
  throw new Error('expected a FliCoreError');
}

describe('parseProjectFolder / projectFolderName', () => {
  it('parses <code>-<slug>', () => {
    expect(parseProjectFolder('a01-xmen')).toEqual({ code: 'a01', slug: 'xmen' });
    expect(parseProjectFolder('d02-cutty-audio-cleanup')).toEqual({
      code: 'd02',
      slug: 'cutty-audio-cleanup',
    });
  });

  it.each([
    'catalog',
    'docs',
    'a1-xmen',
    'A01-xmen',
    'a001-xmen',
    'a01',
    'a01-',
    'a01-Xmen',
    'a01--x',
    'a01-x-',
    'a01_xmen',
  ])('returns null for %s', (name) => {
    expect(parseProjectFolder(name)).toBeNull();
  });

  it('round-trips', () => {
    for (const name of ['a01-xmen', 'd02-cutty-audio-cleanup', 'z99-a-1-b']) {
      const parsed = parseProjectFolder(name);
      expect(parsed).not.toBeNull();
      expect(projectFolderName(parsed as NonNullable<typeof parsed>)).toBe(name);
    }
  });

  it('refuses to build a bad name', () => {
    expect(thrown(() => projectFolderName({ code: 'a1', slug: 'xmen' })).issues[0]).toMatch(
      /^code:/,
    );
    expect(() => projectFolderName({ code: 'a01', slug: 'X Men' })).toThrow(FliCoreError);
  });
});

describe('parseRecording / recordingFileName (FliHub naming rules)', () => {
  it('parses NN-S-slug.ext', () => {
    expect(parseRecording('01-1-intro.mov')).toEqual({
      chapter: 1,
      segment: 1,
      slug: 'intro',
      tags: [],
      ext: 'mov',
    });
  });

  it('parses trailing tags, keeps the order', () => {
    expect(parseRecording('10-10-john-product-manager-CTA-SKOOL.mov')).toEqual({
      chapter: 10,
      segment: 10,
      slug: 'john-product-manager',
      tags: ['CTA', 'SKOOL'],
      ext: 'mov',
    });
    expect(parseRecording('02-3-demo-1ST-V2.mov')?.tags).toEqual(['1ST', 'V2']);
  });

  it('is lenient on a one-digit chapter and builds two digits', () => {
    const parsed = parseRecording('1-1-demo.mov');
    expect(parsed).toEqual({ chapter: 1, segment: 1, slug: 'demo', tags: [], ext: 'mov' });
    expect(recordingFileName(parsed as Recording)).toBe('01-1-demo.mov');
  });

  it('accepts a recording with no segment (FliHub NN-slug)', () => {
    expect(parseRecording('05-outro.mov')).toEqual({
      chapter: 5,
      segment: null,
      slug: 'outro',
      tags: [],
      ext: 'mov',
    });
  });

  it('reads transcripts with the same rule', () => {
    expect(parseRecording('01-1-intro.srt')).toMatchObject({
      chapter: 1,
      segment: 1,
      slug: 'intro',
      ext: 'srt',
    });
  });

  it('keeps numeric words and periods in the slug', () => {
    expect(parseRecording('03-2-v1.5-release-555.mov')).toMatchObject({
      slug: 'v1.5-release-555',
      tags: [],
    });
  });

  it.each([
    'intro.mov',
    '01-1-intro',
    '01-1-v1.5',
    '001-1-intro.mov',
    '00-1-intro.mov',
    '01-0-intro.mov',
    '01-1.mov',
    '01-1-CTA.mov',
    '01-1-Intro.mov',
    '01-1-in_tro.mov',
    '01-1--intro.mov',
  ])('returns null for %s', (name) => {
    expect(parseRecording(name)).toBeNull();
  });

  it('round-trips', () => {
    const cases: Recording[] = [
      { chapter: 1, segment: 1, slug: 'intro', tags: [], ext: 'mov' },
      { chapter: 12, segment: 30, slug: 'setup-bmad', tags: ['TECHSTACK', 'API'], ext: 'mov' },
      { chapter: 99, segment: null, slug: 'outro', tags: ['CTA'], ext: 'mp4' },
      { chapter: 4, segment: 2, slug: 'v1.5-notes', tags: [], ext: 'srt' },
    ];
    for (const recording of cases) {
      expect(parseRecording(recordingFileName(recording))).toEqual(recording);
    }
    for (const name of ['01-1-intro.mov', '10-10-john-product-manager-CTA.mov', '07-outro.mov']) {
      expect(recordingFileName(parseRecording(name) as Recording)).toBe(name);
    }
  });

  it('refuses a no-segment slug starting with a number, which would not round-trip (F6)', () => {
    const numbered = { chapter: 1, segment: null, slug: '2-intro', tags: [], ext: 'mov' };
    const bare = { chapter: 1, segment: null, slug: '5', tags: [], ext: 'mov' };
    expect(thrown(() => recordingFileName(numbered)).issues).toEqual([
      'slug: a slug starting with a number needs a segment',
    ]);
    expect(() => recordingFileName(bare)).toThrow(FliCoreError);
    expect(recordingFileName({ ...numbered, segment: 3 })).toBe('01-3-2-intro.mov');
    expect(parseRecording('01-3-2-intro.mov')).toEqual({ ...numbered, segment: 3 });
    expect(recordingFileName({ ...numbered, slug: 'v2-intro' })).toBe('01-v2-intro.mov');
  });

  it('refuses to build a bad name', () => {
    expect(() =>
      recordingFileName({ chapter: 0, segment: 1, slug: 'intro', tags: [], ext: 'mov' }),
    ).toThrow(FliCoreError);
    expect(() =>
      recordingFileName({ chapter: 100, segment: 1, slug: 'intro', tags: [], ext: 'mov' }),
    ).toThrow(FliCoreError);
    expect(() =>
      recordingFileName({ chapter: 1, segment: 1, slug: 'Intro', tags: [], ext: 'mov' }),
    ).toThrow(FliCoreError);
    expect(() =>
      recordingFileName({ chapter: 1, segment: 1, slug: 'intro', tags: ['cta'], ext: 'mov' }),
    ).toThrow(FliCoreError);
    expect(() =>
      recordingFileName({ chapter: 1, segment: 1, slug: 'intro', tags: [], ext: '.mov' }),
    ).toThrow(FliCoreError);
  });
});

describe('divergences from FliHub parseRecordingFilename (F7)', () => {
  // FliHub shared/naming.ts is the working definition (spec §4). @flivideo/core is deliberately stricter; these pin the
  // four known differences so W3 (FliHub adopting the library) decides knowingly. Listed in README.md too.
  it('rejects segment 0 (FliHub parses 01-0-intro.mov)', () => {
    expect(parseRecording('01-0-intro.mov')).toBeNull();
  });

  it('rejects an empty slug (FliHub parses 01-1.mov with name "")', () => {
    expect(parseRecording('01-1.mov')).toBeNull();
  });

  it('rejects uppercase in the slug (FliHub parses 01-1-Intro.mov)', () => {
    expect(parseRecording('01-1-Intro.mov')).toBeNull();
  });

  it('normalises a zero-padded segment (FliHub keeps "01"; core rebuilds 01-01-intro.mov as 01-1-intro.mov)', () => {
    const parsed = parseRecording('01-01-intro.mov');
    expect(parsed).toMatchObject({ chapter: 1, segment: 1, slug: 'intro' });
    expect(recordingFileName(parsed as Recording)).toBe('01-1-intro.mov');
  });
});

describe('parseVideoFile / videoFileName (L1)', () => {
  it('parses the four v1 kinds (spec §11 #5)', () => {
    expect(parseVideoFile('01-cut.mp4')).toEqual({
      video: 1,
      kind: 'cut',
      variant: null,
      ext: 'mp4',
    });
    expect(parseVideoFile('01-audio-dfn100.m4a')).toEqual({
      video: 1,
      kind: 'audio',
      variant: 'dfn100',
      ext: 'm4a',
    });
    expect(parseVideoFile('01-overlay-v5-frame.mp4')).toEqual({
      video: 1,
      kind: 'overlay',
      variant: 'v5-frame',
      ext: 'mp4',
    });
    expect(parseVideoFile('01-final.mp4')).toEqual({
      video: 1,
      kind: 'final',
      variant: null,
      ext: 'mp4',
    });
    expect(parseVideoFile('01-cut.srt')).toEqual({
      video: 1,
      kind: 'cut',
      variant: null,
      ext: 'srt',
    });
  });

  it.each([
    ['01-draft.mp4', 1, 'mp4'],
    ['01-audio.m4a', 1, 'm4a'],
    ['01-overlay.mp4', 1, 'mp4'],
    ['01-cut-v2.mp4', 1, 'mp4'],
    ['01-final-v2.mp4', 1, 'mp4'],
    ['12-Cut.mp4', 12, 'mp4'],
    ['notes.txt', null, 'txt'],
    ['README', null, null],
    ['00-cut.mp4', null, 'mp4'],
    ['1-cut.mp4', null, 'mp4'],
  ])('%s is unknown-kind, never a throw', (name, video, ext) => {
    expect(parseVideoFile(name)).toEqual({ kind: 'unknown-kind', name, video, ext });
  });

  it('round-trips', () => {
    const cases: VideoFile[] = [
      { video: 1, kind: 'cut', variant: null, ext: 'mp4' },
      { video: 2, kind: 'audio', variant: 'dfn100', ext: 'm4a' },
      { video: 10, kind: 'overlay', variant: 'v5-frame', ext: 'mp4' },
      { video: 99, kind: 'final', variant: null, ext: 'mov' },
    ];
    for (const file of cases) {
      expect(parseVideoFile(videoFileName(file))).toEqual(file);
    }
    for (const name of [
      '01-cut.mp4',
      '01-audio-dfn100.m4a',
      '01-overlay-v5-frame.mp4',
      '01-final.mp4',
    ]) {
      expect(videoFileName(parseVideoFile(name) as VideoFile)).toBe(name);
    }
  });

  it('lets cut and final omit the variant', () => {
    expect(videoFileName({ video: 3, kind: 'final', ext: 'mp4' })).toBe('03-final.mp4');
  });

  it('refuses to build a bad name', () => {
    expect(() =>
      videoFileName({ video: 1, kind: 'audio', variant: null, ext: 'm4a' } as never),
    ).toThrow(FliCoreError);
    expect(() =>
      videoFileName({ video: 1, kind: 'cut', variant: 'v2', ext: 'mp4' } as never),
    ).toThrow(FliCoreError);
    expect(() => videoFileName({ video: 0, kind: 'cut', ext: 'mp4' })).toThrow(FliCoreError);
    expect(() => videoFileName({ video: 1, kind: 'draft', ext: 'mp4' } as never)).toThrow(
      FliCoreError,
    );
  });
});

describe('parseVideoFolder / videoFolderName', () => {
  it('parses and round-trips <NN>-<name>', () => {
    expect(parseVideoFolder('01-xmen')).toEqual({ video: 1, name: 'xmen' });
    expect(videoFolderName({ video: 2, name: 'xmen-short' })).toBe('02-xmen-short');
    for (const name of ['01-xmen', '02-xmen-short', '99-a']) {
      expect(
        videoFolderName(parseVideoFolder(name) as NonNullable<ReturnType<typeof parseVideoFolder>>),
      ).toBe(name);
    }
  });

  it.each(['xmen', '1-xmen', '00-xmen', '01-', '01-Xmen'])('returns null for %s', (name) => {
    expect(parseVideoFolder(name)).toBeNull();
  });

  it('refuses to build a bad name', () => {
    expect(() => videoFolderName({ video: 100, name: 'x' })).toThrow(FliCoreError);
  });
});

describe('parseAppFile / appFileName (D1, scheme D)', () => {
  it('round-trips the four §11 #12 names', () => {
    const expected: Record<string, AppFile> = {
      'fli.studio.json': { app: 'studio' },
      'fli.hub.json': { app: 'hub' },
      'fli.cut.01-xmen.json': { app: 'cut', subject: '01-xmen' },
      'fli.cast.tool-xyz.json': { app: 'cast', subject: 'tool-xyz' },
    };
    for (const [name, file] of Object.entries(expected)) {
      expect(parseAppFile(name)).toEqual(file);
      expect(appFileName(file)).toBe(name);
      expect(parseAppFile(appFileName(file))).toEqual(file);
    }
  });

  it('takes fli.<app> as the first two segments; the rest is the subject', () => {
    expect(parseAppFile('fli.cut.01-xmen.v2.json')).toEqual({ app: 'cut', subject: '01-xmen.v2' });
    expect(parseAppFile('fli.flicut.Tool_X.json')).toEqual({ app: 'flicut', subject: 'Tool_X' });
  });

  it.each([
    'project.json',
    'projects.json',
    'meta.json',
    'fli.json',
    'fli..json',
    'fli.hub',
    'fli.Hub.json',
    'fli.hub..json',
    'fli.hub.x..y.json',
    'xfli.hub.json',
    'fli.hub.json.bak',
  ])('%s is not an app file', (name) => {
    expect(parseAppFile(name)).toBeNull();
  });

  it('refuses to build a bad name', () => {
    expect(() => appFileName({ app: 'Hub' })).toThrow(FliCoreError);
    expect(() => appFileName({ app: 'cut', subject: '../x' })).toThrow(FliCoreError);
    expect(() => appFileName({ app: 'cut', subject: '' })).toThrow(FliCoreError);
  });
});
