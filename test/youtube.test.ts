import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BrandSettings, readBrandSettings, writeBrandSettings } from '../src/brand-settings.js';
import {
  YouTubeApiError,
  YouTubeReader,
  readYouTubeChannel,
  readYouTubePlaylists,
  readYouTubeSync,
  readYouTubeVideos,
  syncYouTubeChannel,
  youtubeMirrorDir,
  type YouTubeFetch,
} from '../src/youtube.js';
import { buildTree, tempDir } from './helpers/fixtures.js';

const CHANNEL = 'UCfixture000000000000000';
const UPLOADS = 'UUfixture000000000000000';
const vid = (n: number) => `vid${String(n).padStart(8, '0')}`;

interface FakeOptions {
  playlists?: { id: string; title: string; members: string[]; itemCount?: number }[];
  uploads?: string[];
  /** playlist id → etag the server reports; a request carrying it gets 304. */
  etags?: Record<string, string>;
  fail?: { endpoint: string; status: number; body: string };
  noChannel?: boolean;
}

/** A fake Data API v3: answers channels/playlists/playlistItems/videos from fixture data, paging at 50. */
function fakeYouTube(opts: FakeOptions = {}) {
  const calls: { endpoint: string; params: URLSearchParams; headers: Record<string, string> }[] =
    [];
  const uploads = opts.uploads ?? [vid(1), vid(2), vid(3)];
  const playlists = opts.playlists ?? [
    { id: 'PLa', title: 'AI Agents', members: [vid(2), vid(1)] },
    { id: 'PLb', title: 'Prompts', members: [vid(3)] },
  ];
  const page = <T>(items: T[], params: URLSearchParams) => {
    const start = Number(params.get('pageToken') ?? 0);
    const size = Number(params.get('maxResults') ?? 5);
    const next = start + size < items.length ? String(start + size) : undefined;
    return { items: items.slice(start, start + size), ...(next ? { nextPageToken: next } : {}) };
  };
  const ok = (body: unknown, status = 200) =>
    new Response(status === 304 ? null : JSON.stringify(body), { status });
  const fetcher: YouTubeFetch = async (url, init) => {
    const u = new URL(url);
    if (!u.pathname.startsWith('/youtube/v3/')) return new Response(new Uint8Array([1, 2, 3]));
    const endpoint = u.pathname.split('/').pop() as string;
    calls.push({ endpoint, params: u.searchParams, headers: init?.headers ?? {} });
    if (opts.fail?.endpoint === endpoint)
      return new Response(opts.fail.body, { status: opts.fail.status });
    const p = u.searchParams;
    if (endpoint === 'channels') {
      if (opts.noChannel) return ok({ items: [] });
      return ok({
        items: [
          {
            id: CHANNEL,
            snippet: {
              title: 'Fixture',
              description: 'd',
              publishedAt: '2023-01-01T00:00:00Z',
              customUrl: '@fixture',
              thumbnails: { high: { url: 'https://yt3.ggpht.com/avatar-s800' } },
            },
            statistics: {
              subscriberCount: '10',
              viewCount: '100',
              videoCount: String(uploads.length),
            },
            contentDetails: { relatedPlaylists: { uploads: UPLOADS } },
          },
        ],
      });
    }
    if (endpoint === 'playlists') {
      return ok(
        page(
          playlists.map((pl) => ({
            id: pl.id,
            snippet: {
              title: pl.title,
              description: '',
              publishedAt: '2024-01-01T00:00:00Z',
              thumbnails: { high: { url: `https://i.ytimg.com/${pl.id}.jpg` } },
            },
            contentDetails: { itemCount: pl.itemCount ?? pl.members.length },
            status: { privacyStatus: 'public' },
          })),
          p,
        ),
      );
    }
    if (endpoint === 'playlistItems') {
      const id = p.get('playlistId') as string;
      const etag = opts.etags?.[id];
      if (etag && init?.headers?.['If-None-Match'] === etag) return ok(null, 304);
      const members =
        id === UPLOADS ? uploads : (playlists.find((pl) => pl.id === id)?.members ?? []);
      return ok({
        ...page(
          members.map((videoId, position) => ({
            snippet: { position, publishedAt: '2024-02-01T00:00:00Z', resourceId: { videoId } },
            contentDetails: { videoId, videoPublishedAt: '2024-01-15T00:00:00Z' },
          })),
          p,
        ),
        ...(etag ? { etag } : {}),
      });
    }
    if (endpoint === 'videos') {
      const ids = (p.get('id') ?? '').split(',');
      return ok({
        items: ids.map((id, i) => ({
          id,
          snippet: {
            title: `Video ${id}`,
            description: '',
            publishedAt: `2024-0${(i % 9) + 1}-01T00:00:00Z`,
            channelId: CHANNEL,
            thumbnails: { maxres: { url: `https://i.ytimg.com/vi/${id}/maxres.jpg` } },
          },
          statistics: { viewCount: '5' },
          contentDetails: { duration: 'PT3M' },
          status: { privacyStatus: 'public' },
        })),
      });
    }
    return new Response('nope', { status: 404 });
  };
  return { fetcher, calls };
}

const fixedNow = () => new Date('2026-10-06T10:00:00Z');

describe('syncYouTubeChannel', () => {
  it('mirrors channel, playlists with members, videos and thumbnails, and counts quota', async () => {
    const root = await tempDir();
    const { fetcher, calls } = fakeYouTube();
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
      by: { at: '2026-10-06T10:00:00.000Z', by: 'human:ui' },
    });
    expect(result.kind).toBe('synced');
    if (result.kind !== 'synced') return;
    expect(result.record.counts).toEqual({
      videos: 3,
      playlists: 2,
      memberships: 3,
      thumbnailsDownloaded: 3,
    });
    // channels 1 + playlists 1 + 2 playlists' items + uploads 1 + videos 1
    expect(result.record.quotaUnits).toBe(6);
    expect(calls).toHaveLength(6);
    expect(calls.every((c) => c.params.get('key') === 'k')).toBe(true);
    expect(calls[0]?.params.get('id')).toBe(CHANNEL);

    const channel = await readYouTubeChannel(root, 'fixture');
    expect(channel?.kind === 'valid' && channel.value).toMatchObject({
      id: CHANNEL,
      handle: 'fixture',
      videoCount: 3,
    });
    expect(channel?.kind === 'valid' && channel.value.avatarUrl).toBe(
      'https://yt3.ggpht.com/avatar-s800',
    );
    await expect(fs.stat(path.join(root, 'fixture', 'avatar.jpg'))).resolves.toBeTruthy();
    const playlists = await readYouTubePlaylists(root, 'fixture');
    expect(
      playlists?.kind === 'valid' &&
        playlists.value.playlists.map((p) => [p.id, p.items.map((i) => i.videoId)]),
    ).toEqual([
      ['PLa', [vid(2), vid(1)]],
      ['PLb', [vid(3)]],
    ]);
    const listing = await readYouTubeVideos(root, 'fixture');
    expect(listing.issues).toEqual([]);
    expect(listing.videos.map((v) => v.id)).toEqual([vid(3), vid(2), vid(1)]);
    expect(listing.videos[0]).toMatchObject({ privacy: 'public', hasTranscript: false });
    expect(listing.videos[0]?.thumbnailPath).toMatch(/thumbnail\.jpg$/);
    const sync = await readYouTubeSync(root, 'fixture');
    expect(sync?.kind === 'valid' && sync.value).toMatchObject({
      ok: true,
      channelId: CHANNEL,
      by: { by: 'human:ui' },
    });
    await expect(fs.stat(path.join(root, 'fixture', '.sync.lock'))).rejects.toThrow();
  });

  it('pages past 50 and resolves by handle', async () => {
    const root = await tempDir();
    const uploads = Array.from({ length: 120 }, (_, i) => vid(i));
    const { fetcher, calls } = fakeYouTube({
      uploads,
      playlists: [{ id: 'PLbig', title: 'Big', members: uploads.slice(0, 75) }],
    });
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { handle: '@fixture' },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
    });
    expect(result.kind === 'synced' && result.record.counts).toMatchObject({
      videos: 120,
      memberships: 75,
    });
    // channels 1 + playlists 1 + PLbig 2 pages + uploads 3 pages + videos 3 batches
    expect(result.kind === 'synced' && result.record.quotaUnits).toBe(10);
    expect(calls[0]?.params.get('forHandle')).toBe('@fixture');
  });

  it('reuses members on a 304 and skips unchanged thumbnails on a second sync', async () => {
    const root = await tempDir();
    const { fetcher, calls } = fakeYouTube({ etags: { PLa: '"etag-a"' } });
    await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
    });
    calls.length = 0;
    const second = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
    });
    expect(second.kind === 'synced' && second.record.counts).toMatchObject({
      memberships: 3,
      thumbnailsDownloaded: 0,
    });
    const sent = calls.find((c) => c.params.get('playlistId') === 'PLa');
    expect(sent?.headers['If-None-Match']).toBe('"etag-a"');
  });

  it('warns when a playlist shows fewer members than its count', async () => {
    const root = await tempDir();
    const { fetcher } = fakeYouTube({
      playlists: [{ id: 'PLp', title: 'Half private', members: [vid(1)], itemCount: 3 }],
    });
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
    });
    expect(result.kind === 'synced' && result.record.warnings[0]).toContain('lists 1 of 3');
  });

  it('records a failure without throwing and keeps the last good files', async () => {
    const root = await tempDir();
    await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fakeYouTube().fetcher,
      now: fixedNow,
    });
    const { fetcher } = fakeYouTube({
      fail: {
        endpoint: 'videos',
        status: 403,
        body: JSON.stringify({ error: { message: 'over', errors: [{ reason: 'quotaExceeded' }] } }),
      },
    });
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fetcher,
      now: fixedNow,
    });
    expect(result.kind).toBe('failed');
    expect(result.kind === 'failed' && result.record.error).toContain('quotaExceeded');
    expect((await readYouTubeVideos(root, 'fixture')).videos).toHaveLength(3);
    const sync = await readYouTubeSync(root, 'fixture');
    expect(sync?.kind === 'valid' && sync.value.ok).toBe(false);
  });

  it('fails cleanly when YouTube knows no such channel', async () => {
    const root = await tempDir();
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: 'UCnone' },
      apiKey: 'k',
      fetch: fakeYouTube({ noChannel: true }).fetcher,
      now: fixedNow,
    });
    expect(result.kind === 'failed' && result.record.error).toContain('no channel UCnone');
  });

  it('refuses a second sync of the same brand while one holds the lock', async () => {
    const root = await tempDir();
    await buildTree(root, { 'fixture/.sync.lock': 'x' });
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fakeYouTube().fetcher,
    });
    expect(result.kind).toBe('busy');
  });

  it('records a thumbnail that will not download as a warning', async () => {
    const root = await tempDir();
    const result = await syncYouTubeChannel({
      mirrorRoot: root,
      brandKey: 'fixture',
      channel: { id: CHANNEL },
      apiKey: 'k',
      fetch: fakeYouTube().fetcher,
      download: async () => new Response('gone', { status: 404 }),
      now: fixedNow,
    });
    expect(
      result.kind === 'synced' && result.record.warnings.filter((w) => w.startsWith('thumbnail')),
    ).toHaveLength(3);
    expect(result.kind === 'synced' && result.record.warnings).toContain(
      'channel avatar: HTTP 404',
    );
  });
});

describe('mirror readers', () => {
  it('read nothing from a brand never synced', async () => {
    const root = await tempDir();
    expect(await readYouTubeChannel(root, 'none')).toBeNull();
    expect(await readYouTubePlaylists(root, 'none')).toBeNull();
    expect(await readYouTubeSync(root, 'none')).toBeNull();
    expect(await readYouTubeVideos(root, 'none')).toEqual({ videos: [], issues: [] });
  });

  it('read yt-mirror files (no privacy) and report broken video folders', async () => {
    const root = await tempDir();
    await buildTree(root, {
      [`b/videos/${vid(1)}/metadata.json`]: {
        id: vid(1),
        title: 't',
        description: '',
        publishedAt: '2024-01-01T00:00:00Z',
        channelId: CHANNEL,
        tags: [],
        duration: 'PT1M',
        viewCount: 1,
        likeCount: 0,
        commentCount: 0,
        thumbnailUrl: '',
        fetchedAt: '2026-05-09T00:00:00Z',
      },
      [`b/videos/${vid(1)}/transcript.txt`]: 'hello',
      [`b/videos/${vid(2)}/metadata.json`]: '{ broken',
      [`b/videos/${vid(3)}/`]: null,
      'b/videos/not-a-video-id/': null,
    });
    const listing = await readYouTubeVideos(root, 'b');
    expect(listing.videos.map((v) => [v.id, v.hasTranscript, v.thumbnailPath])).toEqual([
      [vid(1), true, null],
    ]);
    expect(listing.issues).toHaveLength(2);
  });

  it('refuse a brand key that would leave the root', () => {
    expect(() => youtubeMirrorDir('/r', '../etc')).toThrow('not a brand key');
  });
});

describe('YouTubeReader errors', () => {
  it('carries endpoint, status and the API reason', async () => {
    const reader = new YouTubeReader('k', async () => new Response('plain text', { status: 500 }));
    const error = await reader.playlists(CHANNEL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YouTubeApiError);
    expect(String(error)).toContain('playlists 500: plain text');
  });
});

describe('fli.brand.json publish, youtube and studioDefaults blocks', () => {
  it('round-trip, keeping fields the schema does not name', async () => {
    const root = await tempDir();
    const settings = BrandSettings.parse({
      schema: 1,
      brand: 'appydave',
      colour: '#ffde59',
      publish: {
        ctas: { primaryCta: { label: 'Go', url: 'https://x' } },
        affiliates: [{ name: 'A', url: 'https://a', active: true, note: 'kept' }],
        playlists: { aiAgents: 'PLa' },
        descriptionTemplate: { legalDisclosure: 'L', endNote: 'E' },
        socialLinks: { website: 'https://appydave.com' },
        _meta: { source: 'flihub/server/brand-config.json' },
        somethingNew: { kept: true },
      },
      youtube: { activePlaylists: ['PLa'] },
      studioDefaults: { category: '26 Howto & Style' },
    });
    expect(settings.youtube).toEqual({ activePlaylists: ['PLa'], defaultPlaylists: [] });
    expect((await writeBrandSettings(root, settings)).kind).toBe('written');
    const read = await readBrandSettings(root);
    expect(read?.kind === 'valid' && read.value).toEqual(settings);
    expect(
      read?.kind === 'valid' && (read.value.publish as Record<string, unknown>).somethingNew,
    ).toEqual({ kept: true });
  });
});
