import { BadRequestException } from '@nestjs/common';
import { basename, extname } from 'path';
import { mediaContentTypes } from './upload.constants';

export const getExtension = (filename: string) =>
  extname(filename).replace('.', '').toLowerCase() || null;

export const generateFilename = (filename: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeFilename = filename.replace(/[/\\]/g, '').replace(/\s+/g, '-');
  return `${timestamp}-${safeFilename}`;
};

export const getFileUrl = (key: string) =>
  `/upload/render?key=${encodeURIComponent(key)}`;

export const getHlsPlaylistUrl = (key: string) =>
  `/upload/hls/playlist?key=${encodeURIComponent(key)}`;

export const getHlsPrefix = (key: string) => `hls/${key}`;

export const getHlsPlaylistKey = (key: string) =>
  `${getHlsPrefix(key)}/index.m3u8`;

export const parseBoolean = (value?: string | boolean) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return value === 'true' || value === '1';
};

export const normalizeUploadPath = (path?: string) => {
  const trimmedPath = path?.trim();
  if (!trimmedPath) {
    return '';
  }

  const pathSegments = trimmedPath
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (pathSegments.some((segment) => segment === '..')) {
    throw new BadRequestException('Upload path cannot contain .. segments');
  }

  return pathSegments.join('/');
};

export const normalizeObjectKey = (key?: string) => {
  const objectKey = key?.trim().replace(/^\/+/, '');
  if (!objectKey) {
    throw new BadRequestException('File key is required');
  }

  const keySegments = objectKey.split('/').filter(Boolean);
  if (keySegments.some((segment) => segment === '..')) {
    throw new BadRequestException('File key cannot contain .. segments');
  }

  return keySegments.join('/');
};

export const normalizeHlsSegment = (segment?: string) => {
  const value = segment?.trim();
  if (!value || !/^[a-zA-Z0-9._-]+\.ts$/.test(value)) {
    throw new BadRequestException('Invalid HLS segment');
  }
  return basename(value);
};

export const getExtensionContentType = (filename: string) => {
  const extension = getExtension(filename);
  return extension ? mediaContentTypes[extension] : undefined;
};

export const getContentType = (filename: string, contentType?: string) => {
  const normalizedContentType = contentType?.trim().toLowerCase();
  if (
    normalizedContentType &&
    normalizedContentType !== 'application/octet-stream' &&
    normalizedContentType !== 'binary/octet-stream'
  ) {
    return normalizedContentType;
  }

  return getExtensionContentType(filename) || 'application/octet-stream';
};

export const isVideo = (mimeType?: string, filename = '') => {
  const normalizedMimeType = mimeType?.toLowerCase() ?? '';
  const extension = getExtension(filename);
  return (
    normalizedMimeType.startsWith('video/') ||
    Boolean(extension && mediaContentTypes[extension]?.startsWith('video/'))
  );
};
