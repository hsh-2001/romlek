import { Readable } from 'stream';

export type WebStreamBody = {
  transformToWebStream: () => Parameters<typeof Readable.fromWeb>[0];
};

export type UploadOptions = {
  uploadedBy?: string | number;
  isPublic?: string | boolean;
  location?: string;
  caption?: string;
};

export type RenderedFile = {
  body: Readable;
  filename: string;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  etag?: string;
  lastModified?: Date;
  statusCode: number;
};

export type RenderedFileMetadata = Omit<
  RenderedFile,
  'body' | 'contentRange'
>;

export type StoredObject = {
  body: Readable;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
};

export type ByteRange = {
  start?: number;
  end?: number;
  suffixLength?: number;
};
