import { BadRequestException, Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { promisify } from 'util';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import {
  HLS_SEGMENT_SECONDS,
  HLS_TRANSCODE_TIMEOUT_MS,
  hlsContentTypes,
} from './upload.constants';
import { RenderedFile } from './upload.types';
import { UploadStorageService } from './upload-storage.service';
import {
  getExtension,
  getHlsPlaylistKey,
  getHlsPlaylistUrl,
  getHlsPrefix,
  isVideo,
  normalizeHlsSegment,
  normalizeObjectKey,
} from './upload.utils';

const execFileAsync = promisify(execFile);

@Injectable()
export class UploadHlsService {
  constructor(private readonly storage: UploadStorageService) {}

  async createVariantForUpload(file: Express.Multer.File, key: string) {
    return this.createVariantFromBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      key,
    );
  }

  async createVariantForKey(key?: string) {
    const objectKey = normalizeObjectKey(key);
    const file = await this.storage.getFile(objectKey);
    const buffer = await this.storage.readObjectBuffer(file.body);
    const hlsUrl = await this.createVariantFromBuffer(
      buffer,
      file.filename,
      file.contentType,
      objectKey,
    );

    if (!hlsUrl) {
      throw new BadRequestException('HLS variant could not be created');
    }

    return {
      key: objectKey,
      hls_url: hlsUrl,
    };
  }

  async getPlaylist(key?: string) {
    const objectKey = normalizeObjectKey(key);
    const playlistKey = getHlsPlaylistKey(objectKey);
    const object = await this.storage.getObject(playlistKey);
    const playlist = (await this.storage.readObjectText(object.body)).replace(
      /^([^#][^\r\n]*)$/gm,
      (segment) =>
        `/api/upload/hls/segment?key=${encodeURIComponent(objectKey)}&segment=${encodeURIComponent(segment)}`,
    );

    return {
      body: playlist,
      filename: 'index.m3u8',
      contentType: hlsContentTypes.m3u8,
    };
  }

  async getSegment(key?: string, segment?: string): Promise<RenderedFile> {
    const objectKey = normalizeObjectKey(key);
    const segmentName = normalizeHlsSegment(segment);
    const segmentKey = `${getHlsPrefix(objectKey)}/${segmentName}`;
    const object = await this.storage.getObject(segmentKey);

    return {
      body: object.body,
      filename: segmentName,
      contentType: hlsContentTypes.ts,
      contentLength: object.contentLength,
      etag: object.etag,
      lastModified: object.lastModified,
      statusCode: 200,
    };
  }

  async getSignedSegmentUrl(key?: string, segment?: string) {
    const objectKey = normalizeObjectKey(key);
    const segmentName = normalizeHlsSegment(segment);
    const segmentKey = `${getHlsPrefix(objectKey)}/${segmentName}`;

    return this.storage.getSignedObjectUrl(
      segmentKey,
      segmentName,
      hlsContentTypes.ts,
      'public, max-age=31536000, immutable',
    );
  }

  private async createVariantFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    key: string,
  ) {
    if (!isVideo(mimeType, filename)) {
      return undefined;
    }

    const workDir = await mkdtemp(join(tmpdir(), 'romlek-hls-'));
    const inputPath = join(workDir, `input${extname(filename) || '.mp4'}`);
    const outputDir = join(workDir, 'hls');
    const playlistPath = join(outputDir, 'index.m3u8');
    const segmentPattern = join(outputDir, 'segment-%05d.ts');

    try {
      await writeFile(inputPath, buffer);
      await mkdir(outputDir);
      await this.runFfmpeg(inputPath, playlistPath, segmentPattern);
      await this.uploadGeneratedFiles(outputDir, getHlsPrefix(key));

      return getHlsPlaylistUrl(key);
    } catch (error) {
      console.error('Error creating HLS variant:', error);
      return undefined;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async runFfmpeg(
    inputPath: string,
    playlistPath: string,
    segmentPattern: string,
  ) {
    await execFileAsync(
      ffmpeg.path,
      [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-profile:v',
        'main',
        '-level',
        '4.0',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-f',
        'hls',
        '-hls_time',
        HLS_SEGMENT_SECONDS.toString(),
        '-hls_playlist_type',
        'vod',
        '-hls_segment_filename',
        segmentPattern,
        playlistPath,
      ],
      { timeout: HLS_TRANSCODE_TIMEOUT_MS },
    );
  }

  private async uploadGeneratedFiles(outputDir: string, hlsPrefix: string) {
    const files = await readdir(outputDir);
    await Promise.all(
      files.map(async (filename) => {
        const extension = getExtension(filename);
        await this.storage.putObject(
          `${hlsPrefix}/${filename}`,
          await readFile(join(outputDir, filename)),
          (extension && hlsContentTypes[extension]) ||
            'application/octet-stream',
        );
      }),
    );
  }
}
