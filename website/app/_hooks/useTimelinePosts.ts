'use client';

import { useEffect, useState } from 'react';
import { getInitials } from '@/app/_components/AppShell';
import { useAuth } from '@/app/_hooks/useAuth';

type ApiRecord = Record<string, unknown>;

export type TimelineMedia = {
  id: string;
  kind: 'image' | 'video' | 'file';
  url: string;
  alt: string;
  poster?: string;
};

export type TimelinePost = {
  id: string | number;
  initials: string;
  name: string;
  username: string;
  time: string;
  body: string;
  media: TimelineMedia[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
const imageExtensions = new Set(['apng', 'avif', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'webp']);
const videoExtensions = new Set(['avi', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm']);

const isRecord = (value: unknown): value is ApiRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
const firstNumber = (...values: unknown[]) => values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));

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
    payload.results,
    isRecord(payload.data) ? payload.data.posts : undefined,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.results : undefined,
  ];

  const list = candidates.find(Array.isArray);
  return Array.isArray(list) ? list.filter(isRecord) : [];
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

const inferMediaKind = (media: ApiRecord, url: string): TimelineMedia['kind'] => {
  const mimeType = firstString(media.mime_type, media.mimeType, media.contentType, media.type).toLowerCase();
  const filename = firstString(media.original_name, media.originalName, media.file_name, media.fileName, media.name, media.filename);
  const extension = firstString(media.extension, filename.split('?')[0]?.split('.').pop(), url.split('?')[0]?.split('.').pop()).toLowerCase();

  if (mimeType.startsWith('image/') || imageExtensions.has(extension)) {
    return 'image';
  }

  if (mimeType.startsWith('video/') || videoExtensions.has(extension)) {
    return 'video';
  }

  return 'file';
};

const normalizeMedia = (value: unknown, index: number): TimelineMedia | null => {
  const media = typeof value === 'string' ? { url: value } : value;
  if (!isRecord(media)) {
    return null;
  }

  const key = firstString(media.key, media.file_path, media.filePath, media.path);
  const rawUrl =
    firstString(media.url, media.src, media.file_url, media.fileUrl, media.href) ||
    (key ? `/upload/render?key=${encodeURIComponent(key)}` : '');

  if (!rawUrl) {
    return null;
  }

  const url = resolveMediaUrl(rawUrl);
  const alt = firstString(media.alt, media.caption, media.original_name, media.originalName, media.file_name, media.fileName) || 'Post media';

  return {
    id: firstString(media.id, media.media_id, media.mediaId, media.file_path, media.key, media.url) || `${url}-${index}`,
    kind: inferMediaKind(media, url),
    url,
    alt,
    poster: firstString(media.poster, media.thumbnail_url, media.thumbnailUrl) || undefined,
  };
};

const getMediaItems = (post: ApiRecord) => {
  const mediaSources = [post.media, post.medias, post.attachments, post.files, post.uploads, post.images, post.videos];
  const list = mediaSources.find(Array.isArray);
  const media = Array.isArray(list) ? list : [];
  const directMedia = [firstString(post.image_url, post.imageUrl, post.image), firstString(post.video_url, post.videoUrl, post.video), firstString(post.file_url, post.fileUrl)].filter(Boolean);

  return [...media, ...directMedia].map(normalizeMedia).filter((item): item is TimelineMedia => Boolean(item));
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

const normalizePost = (post: ApiRecord, index: number): TimelinePost => {
  const author = [post.user, post.author, post.created_by, post.createdBy].find(isRecord) ?? {};
  const name = firstString(author.name, author.display_name, author.displayName, post.name, post.author_name, post.authorName) || 'Romlek';
  const username = firstString(author.username, post.username, post.author_username, post.authorUsername) || 'romlek';
  const body = firstString(post.body, post.content, post.text, post.caption, post.description);
  const createdAt = firstString(post.created_at, post.createdAt, post.updated_at, post.updatedAt);
  const id = firstString(post.id, post.post_id, post.postId) || firstNumber(post.id, post.post_id, post.postId) || `api-post-${index}`;

  return {
    id,
    initials: getInitials(name),
    name,
    username,
    time: createdAt ? formatRelativeTime(createdAt) : firstString(post.time) || 'now',
    body,
    media: getMediaItems(post),
  };
};

const normalizeUploadAsPost = (media: ApiRecord, index: number): TimelinePost | null => {
  const normalizedMedia = normalizeMedia(media, index);
  if (!normalizedMedia) {
    return null;
  }

  const createdAt = firstString(media.created_at, media.createdAt, media.updated_at, media.updatedAt);

  return {
    id: firstString(media.id, media.file_path, media.key) || firstNumber(media.id) || `upload-${index}`,
    initials: 'R',
    name: 'Romlek',
    username: 'romlek',
    time: createdAt ? formatRelativeTime(createdAt) : 'now',
    body: firstString(media.caption, media.description, media.original_name, media.originalName),
    media: [normalizedMedia],
  };
};

export const useTimelinePosts = () => {
  const { api } = useAuth();
  const [posts, setPosts] = useState<TimelinePost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const payload = await api<unknown>('/posts');
        const normalizedPosts = getApiItems(payload).map(normalizePost);
        if (normalizedPosts.length) {
          setPosts(normalizedPosts);
          return;
        }
      } catch {
        // The posts endpoint may not exist yet; uploads can still render as media posts.
      }

      try {
        const payload = await api<unknown>('/upload');
        setPosts(getApiItems(payload).map(normalizeUploadAsPost).filter((post): post is TimelinePost => Boolean(post)));
      } catch {
        setPosts([]);
      }
    };

    void fetchPosts();
  }, [api]);

  return posts;
};
