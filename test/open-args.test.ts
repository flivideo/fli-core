import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { OpenArgs, OpenContext, parseOpenArgs } from '../src/open-args.js';

describe('parseOpenArgs (open contract §3, §5)', () => {
  it('reads --brand, --project, --video', () => {
    expect(
      parseOpenArgs(['--brand', 'appydave', '--project', 'a01-xmen', '--video', '01-xmen'], {}),
    ).toEqual({
      context: { brand: 'appydave', project: 'a01-xmen', video: '01-xmen' },
      missing: [],
    });
  });

  it('reads --name=value forms and ignores unknown arguments', () => {
    expect(
      parseOpenArgs(['open', '--verbose', '--brand=appydave', '-x', '--project=a01-xmen'], {}),
    ).toEqual({
      context: { brand: 'appydave', project: 'a01-xmen' },
      missing: [],
    });
  });

  it('falls back to FLIVIDEO_* env; argv wins', () => {
    const env = {
      FLIVIDEO_BRAND: 'kybernesis',
      FLIVIDEO_PROJECT: 'b01-env',
      FLIVIDEO_VIDEO: '02-env',
    };
    expect(parseOpenArgs([], env)).toEqual({
      context: { brand: 'kybernesis', project: 'b01-env', video: '02-env' },
      missing: [],
    });
    expect(parseOpenArgs(['--brand', 'appydave'], env).context).toEqual({
      brand: 'appydave',
      project: 'b01-env',
      video: '02-env',
    });
  });

  it('lists missing arguments in order; video only when required', () => {
    expect(parseOpenArgs([], {})).toEqual({ context: {}, missing: ['brand', 'project'] });
    expect(parseOpenArgs(['--project', 'a01-xmen'], {}, { requireVideo: true })).toEqual({
      context: { project: 'a01-xmen' },
      missing: ['brand', 'video'],
    });
  });

  it('treats a flag with no value, or an empty value, as missing', () => {
    expect(parseOpenArgs(['--brand', '--project', 'a01-xmen'], {})).toEqual({
      context: { project: 'a01-xmen' },
      missing: ['brand'],
    });
    expect(parseOpenArgs(['--project'], { FLIVIDEO_BRAND: '' })).toEqual({
      context: {},
      missing: ['brand', 'project'],
    });
    expect(parseOpenArgs(['--brand='], { FLIVIDEO_BRAND: 'appydave' }).context).toEqual({
      brand: 'appydave',
    });
  });

  it('keeps the last value of a repeated flag and stops at --', () => {
    expect(parseOpenArgs(['--brand', 'a', '--brand', 'b', '--', '--project', 'x'], {})).toEqual({
      context: { brand: 'b' },
      missing: ['project'],
    });
  });

  it('defaults env to empty and does not read process.env', () => {
    process.env.FLIVIDEO_BRAND = 'from-process';
    try {
      expect(parseOpenArgs([]).missing).toEqual(['brand', 'project']);
    } finally {
      delete process.env.FLIVIDEO_BRAND;
    }
  });

  it('produces context that OpenArgs accepts once complete', () => {
    const { context, missing } = parseOpenArgs(
      ['--brand', 'appydave', '--project', 'a01-xmen'],
      {},
    );
    expect(missing).toEqual([]);
    expect(OpenArgs.parse(context)).toEqual(context);
  });
});

describe('OpenContext and OpenArgs refuse unsafe values (F10)', () => {
  const ok = { brand: 'appydave', projectDir: '/x/v-appydave/a01-xmen', projectId: randomUUID() };

  it('refuses a relative projectDir', () => {
    const result = OpenContext.safeParse({ ...ok, projectDir: 'relative/path' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('projectDir must be an absolute path');
  });

  it.each(['../../etc', '01', 'xmen', '1-xmen', '00-xmen', '01-Xmen', '01-xmen/'])(
    'refuses video "%s" in both schemas',
    (video) => {
      expect(OpenContext.safeParse({ ...ok, video }).success).toBe(false);
      expect(OpenArgs.safeParse({ brand: 'appydave', project: 'a01-xmen', video }).success).toBe(
        false,
      );
    },
  );

  it('accepts a video folder name', () => {
    expect(OpenContext.parse({ ...ok, video: '10-xmen-short' }).video).toBe('10-xmen-short');
    expect(OpenArgs.parse({ brand: 'appydave', project: 'a01-xmen', video: '01-xmen' }).video).toBe(
      '01-xmen',
    );
  });
});

describe('OpenContext schema', () => {
  it('accepts the resolved context and rejects a bad id', () => {
    const ok = { brand: 'appydave', projectDir: '/x/v-appydave/a01-xmen', projectId: randomUUID() };
    expect(OpenContext.parse(ok)).toEqual(ok);
    expect(OpenContext.parse({ ...ok, video: '01-xmen' })).toMatchObject({ video: '01-xmen' });
    expect(OpenContext.safeParse({ ...ok, projectId: 'a01' }).success).toBe(false);
  });
});
