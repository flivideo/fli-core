import { describe, expect, it } from 'vitest';
import { classifyProjectEntry, describeProjectEntry, type ProjectEntry } from '../src/classify.js';
import {
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  VideoFileKind,
} from '../src/video-file.js';
import { exportApp } from '../src/publish.js';

describe('the new zones (plan §4C item 1 + the workstream B rulings)', () => {
  it.each<[string, string, boolean?]>([
    ['motion', 'motion', true],
    ['motion/remotion/src/Scene.tsx', 'motion'],
    ['overlay/ch01/beats.json', 'overlay'],
    ['overlay/ch01/v5-frame/spec.json', 'overlay'],
    ['voice/short-vo.wav', 'voice'],
    ['avatar/short-alex.mp4', 'avatar'],
    ['script/script.md', 'script'],
    ['framing/ch01.json', 'framing'],
    ['cast/tool-xyz/screen-0.mov', 'cast'],
    ['-renders', 'renders', true],
    ['-renders/remotion/out/v.mp4', 'renders'],
    ['-trash/x.mov', 'trash'],
    ['first-edit/01-ch/project.json', 'assembly'],
    ['edit/01-ch/project.json', 'assembly'],
    ['first-edit/01-ch/work/words.json', 'assembly'],
    ['-other', 'legacy'],
    ['footage/clip.mov', 'other'],
  ])('%s → %s', (rel, zone, dir) => {
    expect(classifyProjectEntry(rel, dir)).toBe(zone);
  });

  it('a top-level file named like a zone is not that zone', () => {
    for (const name of [
      'motion',
      'overlay',
      'voice',
      'avatar',
      'script',
      'framing',
      '-renders',
      'first-edit',
    ]) {
      expect(classifyProjectEntry(name, false)).toBe('other');
    }
  });

  it('keeps first-edit out of video folder names (it is still in LEGACY_FOLDERS)', () => {
    expect(parseVideoFolder('first-edit')).toBeNull();
    expect(parseVideoFolder('edit')).not.toBeNull(); // reserved for the rename, but not yet a legacy name
  });
});

describe('describeProjectEntry: tiers', () => {
  const d = (rel: string, dir?: boolean): Partial<ProjectEntry> => {
    const { zone, tier, chapter, variant, role } = describeProjectEntry(rel, dir);
    return { zone, tier, chapter, variant, role };
  };

  it('overlay/<chapter>/beats.json is authored; <variant>/spec.json is generated (B ruling)', () => {
    expect(d('overlay/ch01/beats.json')).toEqual({
      zone: 'overlay',
      tier: 'authored',
      chapter: 'ch01',
      variant: null,
      role: 'beats',
    });
    expect(d('overlay/ch01/v5-frame/spec.json')).toEqual({
      zone: 'overlay',
      tier: 'generated',
      chapter: 'ch01',
      variant: 'v5-frame',
      role: 'spec',
    });
  });

  it('a flat overlay (ships = one video) has no chapter', () => {
    expect(d('overlay/beats.json')).toMatchObject({
      tier: 'authored',
      chapter: null,
      role: 'beats',
    });
    expect(d('overlay/v5-frame/spec.json')).toMatchObject({
      tier: 'generated',
      chapter: null,
      variant: 'v5-frame',
      role: 'spec',
    });
  });

  it('framing is authored in both places it can be', () => {
    expect(d('framing/ch01.json')).toMatchObject({ zone: 'framing', tier: 'authored' });
    expect(d('overlay/ch01/framing.json')).toMatchObject({
      tier: 'authored',
      role: 'framing',
      chapter: 'ch01',
    });
  });

  it("a variant's other files are generated and name no owner (a path alone cannot tell chapter from variant)", () => {
    expect(d('overlay/ch01/v5-frame/plates/p1.png')).toEqual({
      zone: 'overlay',
      tier: 'generated',
      chapter: null,
      variant: null,
      role: 'variant-file',
    });
  });

  it('a directory called beats.json is not the authored file', () => {
    expect(d('overlay/ch01/beats.json', true)).toMatchObject({
      tier: 'generated',
      role: 'variant-file',
    });
  });

  it.each<[string, ProjectEntry['tier']]>([
    ['fli.studio.json', 'authored'],
    ['fli.cut.x.json', 'authored'],
    ['script/script.md', 'authored'],
    ['motion/remotion/src/Scene.tsx', 'authored'],
    ['motion/remotion/node_modules/x/index.js', 'regenerable'],
    ['motion/hyperframes/.transcode-cache/a.mp4', 'regenerable'],
    ['motion/remotion/out/v.mp4', 'regenerable'],
    ['recordings/01-1-intro.mov', 'input'],
    ['hub/recordings/01-1-intro.mov', 'input'],
    ['voice/vo.wav', 'input'],
    ['avatar/a.mp4', 'input'],
    ['cast/t/screen.mov', 'input'],
    ['videos/x/x-final.mp4', 'output'],
    ['-renders/remotion/a.mp4', 'regenerable'],
    ['-trash/a.mov', 'regenerable'],
    ['first-edit/01-ch/project.json', 'authored'],
    ['first-edit/01-ch/work/words.json', 'regenerable'],
    ['first-edit/01-ch/exports/a.mp4', 'output'],
    ['footage/a.mov', 'other'],
  ])('%s is %s', (rel, tier) => {
    expect(describeProjectEntry(rel).tier).toBe(tier);
  });
});

describe('the part video kind (plan §4C item 2)', () => {
  it.each(['intro', 'body', 'outro'])('round-trips -part-%s', (part) => {
    const name = videoFileName({
      name: 'flivideo-tour',
      kind: 'part',
      variant: part as 'intro',
      ext: 'mp4',
    });
    expect(name).toBe(`flivideo-tour-part-${part}.mp4`);
    expect(parseVideoFile(name, 'flivideo-tour')).toEqual({
      name: 'flivideo-tour',
      kind: 'part',
      variant: part,
      ext: 'mp4',
    });
  });

  it('refuses a part that is not intro, body or outro, and a part with no section', () => {
    expect(() =>
      videoFileName({ name: 'x', kind: 'part', variant: 'middle', ext: 'mp4' } as never),
    ).toThrow();
    expect(parseVideoFile('x-part-middle.mp4', 'x').kind).toBe('unknown-kind');
    expect(parseVideoFile('x-part.mp4', 'x').kind).toBe('unknown-kind');
  });

  it('is a kind, written by FliCut (it sits on the assembly)', () => {
    expect(VideoFileKind.options).toContain('part');
    expect(exportApp('part')).toBe('flicut');
  });

  it('a video named like a part still splits once its name is known', () => {
    expect(parseVideoFile('the-part-part-intro.mp4', 'the-part')).toMatchObject({
      kind: 'part',
      variant: 'intro',
    });
  });
});
