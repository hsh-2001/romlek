'use client';

import { useEffect, useState } from 'react';
import { getInitials } from '@/app/_components/AppShell';
import { useAuth } from '@/app/_hooks/useAuth';

type ApiRecord = Record<string, unknown>;

export type TimelineMedia = {
  id: string;
  kind: 'image' | 'video' | 'file';
  url: string;
  hlsUrl?: string;
  alt: string;
  albumId?: string;
  albumCode?: string;
  albumTitle?: string;
  caption?: string;
  location?: string;
  poster?: string;
  uploadedBy?: string;
  isPublic?: boolean;
};

export type TimelinePost = {
  id: string | number;
  initials: string;
  name: string;
  username: string;
  time: string;
  createdAt?: string;
  body: string;
  location?: string;
  albumId?: string;
  albumCode?: string;
  albumTitle?: string;
  media: TimelineMedia[];
};

type TimelinePostOptions = {
  publicOnly?: boolean;
  uploadedBy?: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
const imageExtensions = new Set(['apng', 'avif', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'webp']);
const videoExtensions = new Set(['avi', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm']);

const isRecord = (value: unknown): value is ApiRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
const firstNumber = (...values: unknown[]) => values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
const firstBoolean = (...values: unknown[]) => values.find((value): value is boolean => typeof value === 'boolean');

const getApiItems = (payload: unknown): ApiRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.posts,
    payload.items,
    payload.files,
    payload.results,
    isRecord(payload.data) ? payload.data.posts : undefined,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.files : undefined,
    isRecord(payload.data) ? payload.data.results : undefined,
  ];

  const list = candidates.find(Array.isArray);
  return Array.isArray(list) ? list.filter(isRecord) : [];
};

const getNestedRecord = (value: ApiRecord, key: string) => (isRecord(value[key]) ? value[key] : {});

const getMediaRecord = (value: unknown): ApiRecord | null => {
  const media = typeof value === 'string' ? { url: value } : value;
  if (!isRecord(media)) {
    return null;
  }

  return {
    ...media,
    ...getNestedRecord(media, 'media'),
    ...getNestedRecord(media, 'file'),
    ...getNestedRecord(media, 'upload'),
  };
};

const getKeyFromMediaUrl = (url: string) => {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url, apiBaseUrl);
    const key = parsedUrl.searchParams.get('key')?.trim();
    return key || '';
  } catch {
    return '';
  }
};

const resolveMediaUrl = (url: string) => {
  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  if (!apiBaseUrl) {
    return url;
  }

  const base = new URL(apiBaseUrl);

  if (url.startsWith('/')) {
    const basePath = base.pathname.replace(/\/$/, '');
    const path = basePath && !url.startsWith(`${basePath}/`) ? `${basePath}${url}` : url;
    return `${base.origin}${path}`;
  }

  return new URL(url, `${apiBaseUrl.replace(/\/$/, '')}/`).toString();
};

const getExtensionFromPath = (value: string) => {
  const path = value.split('?')[0] || value;
  const basename = path.split('/').pop() || '';
  return basename.includes('.') ? basename.split('.').pop() || '' : '';
};

const inferMediaKind = (media: ApiRecord, url: string, key = ''): TimelineMedia['kind'] => {
  const explicitKind = firstString(media.kind, media.mediaKind, media.category).toLowerCase();
  if (explicitKind === 'image' || explicitKind === 'video' || explicitKind === 'file') {
    return explicitKind;
  }

  const mimeType = firstString(media.mime_type, media.mimeType, media.mimetype, media.contentType, media.type).toLowerCase();
  const filename = firstString(media.original_name, media.originalName, media.file_name, media.fileName, media.name, media.filename);
  const extension = firstString(media.extension, getExtensionFromPath(filename), getExtensionFromPath(key), getExtensionFromPath(url)).toLowerCase();

  if (mimeType.startsWith('image/') || imageExtensions.has(extension)) {
    return 'image';
  }

  if (mimeType.startsWith('video/') || videoExtensions.has(extension)) {
    return 'video';
  }

  return 'file';
};

const normalizeMedia = (value: unknown, index: number): TimelineMedia | null => {
  const media = getMediaRecord(value);
  if (!media) {
    return null;
  }

  const rawUrl =
    firstString(media.url, media.src, media.file_url, media.fileUrl, media.href) ||
    firstString(media.render_url, media.renderUrl);
  const key =
    firstString(media.key, media.file_path, media.filePath, media.path) ||
    getKeyFromMediaUrl(rawUrl);
  const resolvedRawUrl = rawUrl || (key ? `/upload/render?key=${encodeURIComponent(key)}` : '');

  if (!resolvedRawUrl) {
    return null;
  }

  const initialUrl = resolveMediaUrl(resolvedRawUrl);
  const alt = firstString(media.alt, media.caption, media.original_name, media.originalName, media.file_name, media.fileName) || 'Post media';
  const caption = firstString(media.caption, media.description, media.body, media.content);
  const location = firstString(media.location, media.place, media.store, media.branch, media.address);
  const albumId = firstString(media.album_id, media.albumId);
  const albumCode = firstString(media.album_code, media.albumCode);
  const albumTitle = firstString(media.album_title, media.albumTitle);
  const kind = inferMediaKind(media, initialUrl, key);
  const url = key ? resolveMediaUrl(`/upload/render?key=${encodeURIComponent(key)}`) : initialUrl;
  const rawHlsUrl = firstString(media.hls_url, media.hlsUrl) || (key ? `/upload/hls/playlist?key=${encodeURIComponent(key)}` : '');
  const hlsUrl = kind === 'video' && rawHlsUrl ? resolveMediaUrl(rawHlsUrl) : undefined;

  return {
    id:
      firstString(media.id, media.media_id, media.mediaId) ||
      String(firstNumber(media.id, media.media_id, media.mediaId) ?? '') ||
      firstString(media.file_path, media.key, media.url) ||
      `${url}-${index}`,
    kind,
    url,
    hlsUrl,
    alt,
    albumId: albumId || undefined,
    albumCode: albumCode || undefined,
    albumTitle: albumTitle || undefined,
    caption: caption || undefined,
    location: location || undefined,
    poster: firstString(media.poster, media.thumbnail_url, media.thumbnailUrl) || undefined,
    uploadedBy: firstString(media.uploaded_by, media.uploadedBy, media.uploader_id, media.uploaderId) || undefined,
    isPublic: firstBoolean(media.is_public, media.isPublic),
  };
};

const getMediaItems = (post: ApiRecord, options: TimelinePostOptions = {}) => {
  const mediaSources = [post.media, post.medias, post.attachments, post.files, post.uploads, post.images, post.videos];
  const media = mediaSources.flatMap((source) => (Array.isArray(source) ? source : []));
  const directMedia = [
    { url: firstString(post.image_url, post.imageUrl, post.image), kind: 'image' },
    { url: firstString(post.video_url, post.videoUrl, post.video), kind: 'video' },
    { url: firstString(post.file_url, post.fileUrl), kind: 'file' },
  ].filter((item) => item.url);

  return [...media, ...directMedia]
    .map(normalizeMedia)
    .filter((item): item is TimelineMedia => Boolean(item))
    .filter((item) => !options.publicOnly || item.isPublic === true);
};

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  return `${Math.floor(diffSeconds / 86400)}d`;
};

const normalizePost = (post: ApiRecord, index: number, options: TimelinePostOptions = {}): TimelinePost => {
  const author = [post.user, post.author, post.created_by, post.createdBy].find(isRecord) ?? {};
  const album = [post.album].find(isRecord) ?? {};
  const albumId = firstString(post.album_id, post.albumId, album.id);
  const albumCode = firstString(post.album_code, post.albumCode, album.code);
  const albumTitle = firstString(post.album_title, post.albumTitle, album.title);
  const name = firstString(author.name, author.display_name, author.displayName, post.name, post.author_name, post.authorName) || 'Romlek';
  const username = firstString(author.username, post.username, post.author_username, post.authorUsername) || 'romlek';
  const body = firstString(post.body, post.content, post.text, post.caption, post.description);
  const mediaItems = getMediaItems(post, options);
  const location =
    firstString(post.location, post.place, post.store, post.branch, post.address) ||
    mediaItems.find((media) => media.location)?.location ||
    '';
  const createdAt = firstString(post.created_at, post.createdAt, post.updated_at, post.updatedAt);
  const id = firstString(post.id, post.post_id, post.postId) || firstNumber(post.id, post.post_id, post.postId) || `api-post-${index}`;

  return {
    id,
    initials: getInitials(name),
    name,
    username,
    time: createdAt ? formatRelativeTime(createdAt) : firstString(post.time) || 'now',
    createdAt: createdAt || undefined,
    body,
    location: location || undefined,
    albumId: albumId || undefined,
    albumCode: albumCode || undefined,
    albumTitle: albumTitle || undefined,
    media: mediaItems,
  };
};

const normalizeUploadAsPost = (media: ApiRecord, index: number, options: TimelinePostOptions = {}): TimelinePost | null => {
  const normalizedMedia = normalizeMedia(media, index);
  if (!normalizedMedia || (options.publicOnly && normalizedMedia.isPublic !== true)) {
    return null;
  }

  const createdAt = firstString(media.created_at, media.createdAt, media.updated_at, media.updatedAt);
  const caption = firstString(media.caption, media.description, media.body, media.content, media.original_name, media.originalName);
  const location = firstString(media.location, media.place, media.store, media.branch, media.address);
  const username =
    firstString(media.uploader_username, media.uploaderUsername, media.username, media.author_username, media.authorUsername) ||
    (normalizedMedia.uploadedBy ? `user-${normalizedMedia.uploadedBy}` : 'romlek');
  const name = firstString(media.uploader_name, media.uploaderName, media.name, media.author_name, media.authorName) || username;

  return {
    id: firstString(media.id, media.file_path, media.key) || firstNumber(media.id) || `upload-${index}`,
    initials: getInitials(name),
    name,
    username,
    time: createdAt ? formatRelativeTime(createdAt) : 'now',
    createdAt: createdAt || undefined,
    body: caption,
    location: location || normalizedMedia.location,
    media: [normalizedMedia],
  };
};

export const useTimelinePosts = (refreshKey = 0, options: TimelinePostOptions = {}) => {
  const { api } = useAuth();
  const [posts, setPosts] = useState<TimelinePost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (options.uploadedBy) {
        const uploadedPosts: TimelinePost[] = [];
        const uploadedPostMediaIds = new Set<string>();

        try {
          const postSearchParams = new URLSearchParams();
          if (options.publicOnly) {
            postSearchParams.set('public_only', 'true');
          }

          postSearchParams.set('uploaded_by', options.uploadedBy);
          const postPayload = await api<unknown>(`/posts?${postSearchParams.toString()}`);
          uploadedPosts.push(
            ...getApiItems(postPayload)
              .map((post, index) => normalizePost(post, index, options))
              .filter((post) => !options.publicOnly || post.media.length > 0),
          );
          uploadedPosts.forEach((post) => post.media.forEach((media) => uploadedPostMediaIds.add(String(media.id))));
        } catch {
          // Older APIs may not support uploaded_by on posts yet; uploads still render below.
        }

        try {
          const searchParams = new URLSearchParams();
          if (options.publicOnly) {
            searchParams.set('public_only', 'true');
          }

          searchParams.set('uploaded_by', options.uploadedBy);
          const payload = await api<unknown>(`/upload?${searchParams.toString()}`);
          const standaloneUploads = getApiItems(payload)
            .map((media, index) => normalizeUploadAsPost(media, index, options))
            .filter((post): post is TimelinePost => Boolean(post))
            .filter((post) => !post.media.some((media) => uploadedPostMediaIds.has(String(media.id))));
          setPosts([...uploadedPosts, ...standaloneUploads]);
        } catch {
          setPosts(uploadedPosts);
        }

        return;
      }

      try {
        const query = options.publicOnly ? '?public_only=true' : '';
        const payload = await api<unknown>(`/posts${query}`);
        const normalizedPosts = getApiItems(payload)
          .map((post, index) => normalizePost(post, index, options))
          .filter((post) => !options.publicOnly || post.media.length > 0);
        if (normalizedPosts.length) {
          setPosts(normalizedPosts);
          return;
        }
      } catch {
        // The posts endpoint may not exist yet; uploads can still render as media posts.
      }

      try {
        const searchParams = new URLSearchParams();
        if (options.publicOnly) {
          searchParams.set('public_only', 'true');
        }

        if (options.uploadedBy) {
          searchParams.set('uploaded_by', options.uploadedBy);
        }

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const payload = await api<unknown>(`/upload${query}`);
        setPosts(getApiItems(payload).map((media, index) => normalizeUploadAsPost(media, index, options)).filter((post): post is TimelinePost => Boolean(post)));
      } catch {
        setPosts([]);
      }
    };

    void fetchPosts();
  }, [api, refreshKey, options.publicOnly, options.uploadedBy]);

  return posts;
};
