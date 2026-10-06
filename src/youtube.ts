import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { atomicWrite, errorCode, errorMessage, readJsonFile, takeLock } from './fs-utils.js';
import { readFileResult } from './results.js';
import { Stamp } from './stamp.js';

/**
 * The YouTube mirror (docs/youtube-channel-architecture.md in the flivideo repo): a local, read-only copy of a brand's
 * channel, its playlists with their members, and its public videos. YouTube stays the truth; a sync refreshes the copy
 * and every Fli app reads the copy. Read side only — writing to YouTube (OAuth per channel) is a later phase.
 *
 * Layout, keyed by **brand key** (a handle can change; `claudinglab` became AppyDave Labs):
 *
 *   <mirrorRoot>/<brandKey>/channel.json
 *   <mirrorRoot>/<brandKey>/playlists.json
 *   <mirrorRoot>/<brandKey>/videos/<videoId>/metadata.json  (+ thumbnail.jpg; transcript.txt from the retired yt-mirror)
 *   <mirrorRoot>/<brandKey>/sync.json
 *
 * Every API call made here costs 1 quota unit (channels/playlists/playlistItems/videos .list,
 * https://developers.google.com/youtube/v3/determine_quota_cost); a sync records its own count.
 */

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
export const YOUTUBE_CHANNEL_FILE = 'channel.json';
export const YOUTUBE_PLAYLISTS_FILE = 'playlists.json';
export const YOUTUBE_SYNC_FILE = 'sync.json';
export const YOUTUBE_VIDEOS_FOLDER = 'videos';
export const YOUTUBE_VIDEO_FILE = 'metadata.json';
export const YOUTUBE_THUMBNAIL_FILE = 'thumbnail.jpg';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export const YouTubeChannel = z.object({
  id: z.string().min(1),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  uploadsPlaylistId: z.string().min(1),
  subscriberCount: z.number(),
  viewCount: z.number(),
  videoCount: z.number(),
  fetchedAt: z.string(),
});
export type YouTubeChannel = z.infer<typeof YouTubeChannel>;

export const YouTubePlaylistItem = z.object({
  videoId: z.string().min(1),
  position: z.number().int(),
  /** When the video was added to the playlist (`snippet.publishedAt` of the playlist item). */
  addedAt: z.string().optional(),
  videoPublishedAt: z.string().optional(),
});
export type YouTubePlaylistItem = z.infer<typeof YouTubePlaylistItem>;

export const YouTubePlaylist = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  itemCount: z.number().int(),
  /** `public` | `unlisted` | `private`, as YouTube reports it. */
  privacy: z.string(),
  publishedAt: z.string(),
  thumbnailUrl: z.string(),
  /** The playlistItems listing's HTTP ETag, sent back as If-None-Match on the next sync. */
  itemsEtag: z.string().optional(),
  items: z.array(YouTubePlaylistItem),
});
export type YouTubePlaylist = z.infer<typeof YouTubePlaylist>;

export const YouTubePlaylistsFile = z.object({
  fetchedAt: z.string(),
  playlists: z.array(YouTubePlaylist),
});
export type YouTubePlaylistsFile = z.infer<typeof YouTubePlaylistsFile>;

/** A mirrored video. The fields before `privacy` are the retired yt-mirror's shape, so its files still read. */
export const YouTubeVideo = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  channelId: z.string(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  /** ISO 8601 duration (`PT12M3S`). */
  duration: z.string(),
  viewCount: z.number(),
  likeCount: z.number(),
  commentCount: z.number(),
  thumbnailUrl: z.string(),
  fetchedAt: z.string(),
  /** `public` | `unlisted` | `private`; absent in files written before playlists were mirrored. */
  privacy: z.string().optional(),
});
export type YouTubeVideo = z.infer<typeof YouTubeVideo>;

export const YouTubeSyncCounts = z.object({
  videos: z.number().int(),
  playlists: z.number().int(),
  memberships: z.number().int(),
  thumbnailsDownloaded: z.number().int(),
});
export type YouTubeSyncCounts = z.infer<typeof YouTubeSyncCounts>;

export const YouTubeSyncRecord = z.object({
  lastSyncAt: z.string(),
  ok: z.boolean(),
  durationMs: z.number().int(),
  /** API calls made, each 1 unit. */
  quotaUnits: z.number().int(),
  channelId: z.string().optional(),
  counts: YouTubeSyncCounts,
  warnings: z.array(z.string()),
  /** Why the sync stopped, when `ok` is false. The mirror keeps what the last good sync wrote. */
  error: z.string().optional(),
  by: Stamp.optional(),
});
export type YouTubeSyncRecord = z.infer<typeof YouTubeSyncRecord>;

export const ReadYouTubeChannelResult = readFileResult(YouTubeChannel);
export type ReadYouTubeChannelResult = z.infer<typeof ReadYouTubeChannelResult>;
export const ReadYouTubePlaylistsResult = readFileResult(YouTubePlaylistsFile);
export type ReadYouTubePlaylistsResult = z.infer<typeof ReadYouTubePlaylistsResult>;
export const ReadYouTubeSyncResult = readFileResult(YouTubeSyncRecord);
export type ReadYouTubeSyncResult = z.infer<typeof ReadYouTubeSyncResult>;

/** `<mirrorRoot>/<brandKey>`. Throws on a brand key that would leave the root. */
export function youtubeMirrorDir(mirrorRoot: string, brandKey: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(brandKey)) throw new Error(`not a brand key: ${brandKey}`);
  return path.join(mirrorRoot, brandKey);
}

export function readYouTubeChannel(mirrorRoot: string, brandKey: string) {
  return readJsonFile(
    path.join(youtubeMirrorDir(mirrorRoot, brandKey), YOUTUBE_CHANNEL_FILE),
    YouTubeChannel,
  );
}

export function readYouTubePlaylists(mirrorRoot: string, brandKey: string) {
  return readJsonFile(
    path.join(youtubeMirrorDir(mirrorRoot, brandKey), YOUTUBE_PLAYLISTS_FILE),
    YouTubePlaylistsFile,
  );
}

export function readYouTubeSync(mirrorRoot: string, brandKey: string) {
  return readJsonFile(
    path.join(youtubeMirrorDir(mirrorRoot, brandKey), YOUTUBE_SYNC_FILE),
    YouTubeSyncRecord,
  );
}

export const YouTubeVideoListing = z.object({
  videos: z.array(
    YouTubeVideo.extend({
      /** Absolute path of the thumbnail when one is mirrored. */
      thumbnailPath: z.string().nullable(),
      hasTranscript: z.boolean(),
    }),
  ),
  /** Video folders whose metadata.json is missing or malformed, as `<id>: <message>`. */
  issues: z.array(z.string()),
});
export type YouTubeVideoListing = z.infer<typeof YouTubeVideoListing>;

/** Every mirrored video of a brand, newest first. A brand never synced → no videos, no issues. */
export async function readYouTubeVideos(
  mirrorRoot: string,
  brandKey: string,
): Promise<YouTubeVideoListing> {
  const dir = path.join(youtubeMirrorDir(mirrorRoot, brandKey), YOUTUBE_VIDEOS_FOLDER);
  let ids: string[];
  try {
    ids = (await fs.readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && VIDEO_ID.test(entry.name))
      .map((entry) => entry.name);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return { videos: [], issues: [] };
    return { videos: [], issues: [`videos: ${errorMessage(error)}`] };
  }
  const videos: YouTubeVideoListing['videos'] = [];
  const issues: string[] = [];
  await Promise.all(
    ids.map(async (id) => {
      const videoDir = path.join(dir, id);
      const read = await readJsonFile(path.join(videoDir, YOUTUBE_VIDEO_FILE), YouTubeVideo);
      if (read === null) return void issues.push(`${id}: no ${YOUTUBE_VIDEO_FILE}`);
      if (read.kind === 'invalid') return void issues.push(`${id}: ${read.message}`);
      const names = new Set(await fs.readdir(videoDir).catch(() => [] as string[]));
      videos.push({
        ...read.value,
        thumbnailPath: names.has(YOUTUBE_THUMBNAIL_FILE)
          ? path.join(videoDir, YOUTUBE_THUMBNAIL_FILE)
          : null,
        hasTranscript: names.has('transcript.txt'),
      });
    }),
  );
  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  issues.sort();
  return { videos, issues };
}

// ─── the API client ──────────────────────────────────────────────────────────────────────────────────────────────

/** The fetch the client uses; tests inject one. */
export type YouTubeFetch = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<Response>;

/** A YouTube API answer that was not 2xx/304. `status` 403 with `quotaExceeded` in the message is the daily cap. */
export class YouTubeApiError extends Error {
  constructor(
    readonly endpoint: string,
    readonly status: number,
    message: string,
  ) {
    super(`YouTube ${endpoint} ${status}: ${message}`);
    this.name = 'YouTubeApiError';
  }
}

type Thumbs = Record<string, { url: string } | undefined>;
const bestThumb = (t: Thumbs | undefined): string =>
  (t?.maxres ?? t?.standard ?? t?.high ?? t?.medium ?? t?.default)?.url ?? '';

/** A read-only Data API v3 client over an API key, counting the quota units it spends. */
export class YouTubeReader {
  quotaUnits = 0;

  constructor(
    private readonly apiKey: string,
    private readonly fetcher: YouTubeFetch = (url, init) => fetch(url, init),
  ) {}

  /** GET one endpoint. `etag` → If-None-Match; a 304 returns `null`. */
  private async get<T>(endpoint: string, params: Record<string, string>, etag?: string) {
    const qs = new URLSearchParams({ ...params, key: this.apiKey });
    this.quotaUnits += 1;
    const res = await this.fetcher(`${YOUTUBE_API_BASE}/${endpoint}?${qs}`, {
      headers: etag ? { 'If-None-Match': etag } : {},
    });
    if (res.status === 304) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let message = body.slice(0, 300);
      try {
        const parsed = JSON.parse(body) as {
          error?: { message?: string; errors?: { reason?: string }[] };
        };
        const reason = parsed.error?.errors?.[0]?.reason;
        message = [reason, parsed.error?.message].filter(Boolean).join(': ') || message;
      } catch {
        // not JSON: keep the raw text
      }
      throw new YouTubeApiError(endpoint, res.status, message);
    }
    return (await res.json()) as T & { etag?: string };
  }

  /** Every page of a listing endpoint (50 per page, the API's maximum). */
  private async pages<I>(endpoint: string, params: Record<string, string>): Promise<I[]> {
    const out: I[] = [];
    let pageToken: string | undefined;
    do {
      const data = await this.get<{ items?: I[]; nextPageToken?: string }>(endpoint, {
        ...params,
        maxResults: '50',
        ...(pageToken ? { pageToken } : {}),
      });
      out.push(...(data?.items ?? []));
      pageToken = data?.nextPageToken;
    } while (pageToken);
    return out;
  }

  /** The channel by id (preferred: ids never change) or by handle. `null` when YouTube knows no such channel. */
  async channel(
    by: { id: string } | { handle: string },
    now: Date,
  ): Promise<YouTubeChannel | null> {
    type Item = {
      id: string;
      snippet: { title: string; description: string; publishedAt: string; customUrl?: string };
      statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
      contentDetails: { relatedPlaylists: { uploads: string } };
    };
    const filter: Record<string, string> =
      'id' in by ? { id: by.id } : { forHandle: `@${by.handle.replace(/^@/, '')}` };
    const data = await this.get<{ items?: Item[] }>('channels', {
      part: 'snippet,statistics,contentDetails',
      ...filter,
    });
    const item = data?.items?.[0];
    if (!item) return null;
    return {
      id: item.id,
      handle: (item.snippet.customUrl ?? ('handle' in by ? by.handle : '')).replace(/^@/, ''),
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
      subscriberCount: Number(item.statistics.subscriberCount ?? 0),
      viewCount: Number(item.statistics.viewCount ?? 0),
      videoCount: Number(item.statistics.videoCount ?? 0),
      fetchedAt: now.toISOString(),
    };
  }

  /** The channel's playlists, without members. */
  async playlists(channelId: string): Promise<Omit<YouTubePlaylist, 'items' | 'itemsEtag'>[]> {
    type Item = {
      id: string;
      snippet: { title: string; description: string; publishedAt: string; thumbnails?: Thumbs };
      contentDetails?: { itemCount?: number };
      status?: { privacyStatus?: string };
    };
    const items = await this.pages<Item>('playlists', {
      part: 'snippet,contentDetails,status',
      channelId,
    });
    return items.map((p) => ({
      id: p.id,
      title: p.snippet.title,
      description: p.snippet.description,
      itemCount: p.contentDetails?.itemCount ?? 0,
      privacy: p.status?.privacyStatus ?? 'public',
      publishedAt: p.snippet.publishedAt,
      thumbnailUrl: bestThumb(p.snippet.thumbnails),
    }));
  }

  /**
   * A playlist's members in order. With `etag`, an unchanged playlist answers 304 → `null` (it still costs the unit:
   * "All API requests, including invalid requests, incur at least a one-point quota cost" — Data API getting started).
   * A changed or first listing returns the items and the first page's ETag.
   */
  async playlistItems(
    playlistId: string,
    etag?: string,
  ): Promise<{ items: YouTubePlaylistItem[]; etag?: string } | null> {
    type Item = {
      snippet?: { position?: number; publishedAt?: string; resourceId?: { videoId?: string } };
      contentDetails?: { videoId?: string; videoPublishedAt?: string };
    };
    type Page = { items?: Item[]; nextPageToken?: string; etag?: string };
    const items: YouTubePlaylistItem[] = [];
    let pageToken: string | undefined;
    let firstEtag: string | undefined;
    do {
      const data: Page | null = await this.get<Page>(
        'playlistItems',
        {
          part: 'snippet,contentDetails',
          playlistId,
          maxResults: '50',
          ...(pageToken ? { pageToken } : {}),
        },
        pageToken ? undefined : etag,
      );
      if (data === null) return null;
      if (!pageToken) firstEtag = data.etag;
      for (const item of data.items ?? []) {
        const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
        if (!videoId) continue;
        items.push({
          videoId,
          position: item.snippet?.position ?? items.length,
          ...(item.snippet?.publishedAt ? { addedAt: item.snippet.publishedAt } : {}),
          ...(item.contentDetails?.videoPublishedAt
            ? { videoPublishedAt: item.contentDetails.videoPublishedAt }
            : {}),
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
    return { items, ...(firstEtag ? { etag: firstEtag } : {}) };
  }

  /** Full video records, 50 ids per call. Ids YouTube no longer returns (deleted, private to a key) are simply absent. */
  async videos(ids: string[], now: Date): Promise<YouTubeVideo[]> {
    type Item = {
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        tags?: string[];
        categoryId?: string;
        thumbnails?: Thumbs;
      };
      statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails?: { duration?: string };
      status?: { privacyStatus?: string };
    };
    const out: YouTubeVideo[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const data = await this.get<{ items?: Item[] }>('videos', {
        part: 'snippet,statistics,contentDetails,status',
        id: ids.slice(i, i + 50).join(','),
      });
      for (const v of data?.items ?? []) {
        out.push({
          id: v.id,
          title: v.snippet.title,
          description: v.snippet.description,
          publishedAt: v.snippet.publishedAt,
          channelId: v.snippet.channelId,
          tags: v.snippet.tags ?? [],
          ...(v.snippet.categoryId ? { categoryId: v.snippet.categoryId } : {}),
          duration: v.contentDetails?.duration ?? '',
          viewCount: Number(v.statistics?.viewCount ?? 0),
          likeCount: Number(v.statistics?.likeCount ?? 0),
          commentCount: Number(v.statistics?.commentCount ?? 0),
          thumbnailUrl: bestThumb(v.snippet.thumbnails),
          fetchedAt: now.toISOString(),
          ...(v.status?.privacyStatus ? { privacy: v.status.privacyStatus } : {}),
        });
      }
    }
    return out;
  }
}

// ─── the sync ────────────────────────────────────────────────────────────────────────────────────────────────────

export interface SyncYouTubeOptions {
  mirrorRoot: string;
  brandKey: string;
  /** The channel's id from the brand registry (preferred), or its handle. */
  channel: { id: string } | { handle: string };
  apiKey: string;
  fetch?: YouTubeFetch;
  /** Downloads thumbnails; defaults to `fetch`. */
  download?: (url: string) => Promise<Response>;
  now?: () => Date;
  by?: Stamp;
}

export const SyncYouTubeResult = z.union([
  z.object({ kind: z.literal('synced'), record: YouTubeSyncRecord }),
  z.object({ kind: z.literal('failed'), record: YouTubeSyncRecord }),
  z.object({ kind: z.literal('busy'), message: z.string() }),
]);
export type SyncYouTubeResult = z.infer<typeof SyncYouTubeResult>;

const SYNC_LOCK = '.sync.lock';
const LOCK_STALE_MS = 10 * 60_000;

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Refresh one brand's mirror: channel, playlists with members, and every upload's metadata (+ thumbnail when its URL
 * changed or the file is missing). Writes `sync.json` either way; a failed sync leaves the last good files in place.
 * One sync per brand at a time (`busy`). Never throws for an API or disk failure — the record says what happened.
 */
export async function syncYouTubeChannel(options: SyncYouTubeOptions): Promise<SyncYouTubeResult> {
  const now = options.now ?? (() => new Date());
  const started = now();
  const dir = youtubeMirrorDir(options.mirrorRoot, options.brandKey);
  await fs.mkdir(path.join(dir, YOUTUBE_VIDEOS_FOLDER), { recursive: true });
  const lock = path.join(dir, SYNC_LOCK);
  if (!(await takeLock(lock, 0, LOCK_STALE_MS))) {
    return { kind: 'busy', message: `${options.brandKey} is already syncing` };
  }

  const reader = new YouTubeReader(options.apiKey, options.fetch);
  const download = options.download ?? ((url: string) => (options.fetch ?? fetch)(url));
  const counts: YouTubeSyncCounts = {
    videos: 0,
    playlists: 0,
    memberships: 0,
    thumbnailsDownloaded: 0,
  };
  const warnings: string[] = [];
  let channelId: string | undefined;

  const finish = async (ok: boolean, error?: string): Promise<SyncYouTubeResult> => {
    const record: YouTubeSyncRecord = {
      lastSyncAt: started.toISOString(),
      ok,
      durationMs: Math.max(0, now().getTime() - started.getTime()),
      quotaUnits: reader.quotaUnits,
      ...(channelId ? { channelId } : {}),
      counts,
      warnings,
      ...(error ? { error } : {}),
      ...(options.by ? { by: options.by } : {}),
    };
    try {
      await atomicWrite(path.join(dir, YOUTUBE_SYNC_FILE), json(record));
    } finally {
      await fs.rm(lock, { force: true });
    }
    return { kind: ok ? 'synced' : 'failed', record };
  };

  try {
    const channel = await reader.channel(options.channel, started);
    if (!channel) {
      const which = 'id' in options.channel ? options.channel.id : `@${options.channel.handle}`;
      return await finish(false, `YouTube has no channel ${which}`);
    }
    channelId = channel.id;

    const previous = await readYouTubePlaylists(options.mirrorRoot, options.brandKey);
    const previousById = new Map(
      previous?.kind === 'valid' ? previous.value.playlists.map((p) => [p.id, p]) : [],
    );
    const playlists: YouTubePlaylist[] = [];
    for (const playlist of await reader.playlists(channel.id)) {
      const before = previousById.get(playlist.id);
      const listed = await reader.playlistItems(playlist.id, before?.itemsEtag);
      const items = listed === null ? (before?.items ?? []) : listed.items;
      const itemsEtag = listed === null ? before?.itemsEtag : listed.etag;
      playlists.push({ ...playlist, ...(itemsEtag ? { itemsEtag } : {}), items });
      if (items.length !== playlist.itemCount) {
        warnings.push(
          `playlist "${playlist.title}" lists ${items.length} of ${playlist.itemCount} videos (the rest are not visible to an API key)`,
        );
      }
    }

    const uploads = await reader.playlistItems(channel.uploadsPlaylistId);
    const ids = [...new Set((uploads?.items ?? []).map((item) => item.videoId))];
    const videos = await reader.videos(ids, started);

    // Write: videos first, then playlists and channel, so a reader never sees a member with no video behind it.
    for (const video of videos) {
      const videoDir = path.join(dir, YOUTUBE_VIDEOS_FOLDER, video.id);
      await fs.mkdir(videoDir, { recursive: true });
      const before = await readJsonFile(path.join(videoDir, YOUTUBE_VIDEO_FILE), YouTubeVideo);
      await atomicWrite(path.join(videoDir, YOUTUBE_VIDEO_FILE), json(video));
      const thumb = path.join(videoDir, YOUTUBE_THUMBNAIL_FILE);
      const haveThumb = await fs.stat(thumb).then(
        () => true,
        () => false,
      );
      const urlChanged =
        before?.kind !== 'valid' || before.value.thumbnailUrl !== video.thumbnailUrl;
      if (video.thumbnailUrl && (!haveThumb || urlChanged)) {
        try {
          const res = await download(video.thumbnailUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await atomicWriteBytes(thumb, new Uint8Array(await res.arrayBuffer()));
          counts.thumbnailsDownloaded += 1;
        } catch (error) {
          warnings.push(`thumbnail ${video.id}: ${errorMessage(error)}`);
        }
      }
    }
    const missing = ids.length - videos.length;
    if (missing > 0) warnings.push(`${missing} uploads listed but not returned by videos.list`);

    await atomicWrite(
      path.join(dir, YOUTUBE_PLAYLISTS_FILE),
      json({ fetchedAt: started.toISOString(), playlists } satisfies YouTubePlaylistsFile),
    );
    await atomicWrite(path.join(dir, YOUTUBE_CHANNEL_FILE), json(channel));

    counts.videos = videos.length;
    counts.playlists = playlists.length;
    counts.memberships = playlists.reduce((sum, p) => sum + p.items.length, 0);
    return await finish(true);
  } catch (error) {
    return await finish(false, errorMessage(error));
  }
}

async function atomicWriteBytes(target: string, bytes: Uint8Array): Promise<void> {
  const tmp = `${target}.${process.pid}.part`;
  try {
    await fs.writeFile(tmp, bytes);
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.rm(tmp, { force: true });
    throw error;
  }
}
