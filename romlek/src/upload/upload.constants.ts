export const MAX_RENDER_CHUNK_SIZE = 8 * 1024 * 1024;
export const SIGNED_RENDER_URL_TTL_SECONDS = 60 * 60;
export const HLS_SEGMENT_SECONDS = 4;
export const HLS_TRANSCODE_TIMEOUT_MS = 15 * 60 * 1000;

export const mediaContentTypes: Record<string, string> = {
  apng: 'image/apng',
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  ogg: 'video/ogg',
  ogv: 'video/ogg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webm: 'video/webm',
  webp: 'image/webp',
};

export const hlsContentTypes: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
};
