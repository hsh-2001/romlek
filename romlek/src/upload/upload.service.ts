import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { extname } from 'path';
import { Readable } from 'stream';
import { UploadRepository } from './upload.repository';

type WebStreamBody = {
  transformToWebStream: () => Parameters<typeof Readable.fromWeb>[0];
};

type UploadOptions = {
  uploadedBy?: string;
  isPublic?: string | boolean;
};

type RenderedFile = {
  body: Readable;
  filename: string;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  statusCode: number;
};

type ByteRange = {
  start?: number;
  end?: number;
  suffixLength?: number;
};

const MAX_RENDER_CHUNK_SIZE = 8 * 1024 * 1024;

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(
    private config: ConfigService,
    private readonly uploadRepository: UploadRepository,
  ) {
    const endpoint = this.getRequiredConfig('CF_R2_API');
    const accessKeyId = this.getRequiredConfig('CF_R2_ACCESS_KEY');
    const secretAccessKey = this.getRequiredConfig('CF_R2_SECRET_KEY');
    this.bucket = this.getRequiredConfig('CF_R2_BUCKET');

    if (accessKeyId.length !== 32) {
      throw new InternalServerErrorException(
        'CF_R2_ACCESS_KEY must be 32 characters',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  private getRequiredConfig(name: string) {
    const value = this.config.get<string>(name)?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured`);
    }
    return value;
  }

  async upload(
    files?: Express.Multer.File[],
    path?: string,
    options: UploadOptions = {},
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPath = this.normalizePath(path);
    const uploadedFiles = await Promise.all(
      files.map((file) => {
        return this.uploadOne(file, uploadPath, options);
      }),
    );

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    };
  }

  private normalizePath(path?: string) {
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
  }

  private async uploadOne(
    file: Express.Multer.File,
    path: string,
    options: UploadOptions,
  ) {
    const filename = file.originalname?.trim();
    if (!filename) {
      throw new BadRequestException('Uploaded file must have a filename');
    }

    const generatedFilename = this.generateFilename(filename);
    const key = path ? `${path}/${generatedFilename}` : generatedFilename;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await this.client.send(command);
      const media = await this.uploadRepository.create(
        new CreateUploadDto({
          file_name: generatedFilename,
          original_name: filename,
          file_path: key,
          file_url: this.getFileUrl(key),
          mime_type: file.mimetype,
          extension: this.getExtension(filename),
          file_size: file.size,
          width: null,
          height: null,
          duration: null,
          storage_provider: 'r2',
          uploaded_by: options.uploadedBy?.trim() || null,
          is_public: this.parseBoolean(options.isPublic),
        }),
      );

      return {
        originalFilename: filename,
        filename: generatedFilename,
        path,
        key,
        contentType: file.mimetype,
        size: file.size,
        media,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  private generateFilename(filename: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFilename = filename.replace(/[/\\]/g, '').replace(/\s+/g, '-');
    return `${timestamp}-${safeFilename}`;
  }

  private getExtension(filename: string) {
    return extname(filename).replace('.', '').toLowerCase() || null;
  }

  private getFileUrl(key: string) {
    return `/upload/render?key=${encodeURIComponent(key)}`;
  }

  private parseBoolean(value?: string | boolean) {
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true' || value === '1';
  }

  async getFile(key?: string, range?: string): Promise<RenderedFile> {
    const objectKey = this.normalizeObjectKey(key);
    const requestedRange = this.normalizeRange(range);

    try {
      const metadata = requestedRange
        ? await this.client.send(
            new HeadObjectCommand({
              Bucket: this.bucket,
              Key: objectKey,
            }),
          )
        : null;
      const totalSize = metadata?.ContentLength;
      const resolvedRange =
        requestedRange && totalSize !== undefined
          ? this.resolveRange(requestedRange, totalSize)
          : null;
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Range: resolvedRange
            ? `bytes=${resolvedRange.start}-${resolvedRange.end}`
            : undefined,
        }),
      );

      if (!object.Body) {
        throw new NotFoundException('File not found');
      }

      return {
        body: this.toReadable(object.Body),
        filename: objectKey.split('/').pop() ?? objectKey,
        contentType: object.ContentType ?? 'application/octet-stream',
        contentLength:
          resolvedRange && totalSize !== undefined
            ? resolvedRange.end - resolvedRange.start + 1
            : object.ContentLength,
        contentRange:
          resolvedRange && totalSize !== undefined
            ? `bytes ${resolvedRange.start}-${resolvedRange.end}/${totalSize}`
            : object.ContentRange,
        statusCode:
          resolvedRange || object.ContentRange
            ? HttpStatus.PARTIAL_CONTENT
            : HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorName = error instanceof Error ? error.name : undefined;
      if (errorName === 'NoSuchKey' || errorName === 'NotFound') {
        throw new NotFoundException('File not found');
      }

      if (errorName === 'InvalidRange') {
        throw new HttpException(
          'Requested range is not satisfiable',
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
        );
      }

      console.error('Error rendering file:', error);
      throw new InternalServerErrorException('Error rendering file');
    }
  }

  private normalizeObjectKey(key?: string) {
    const objectKey = key?.trim().replace(/^\/+/, '');
    if (!objectKey) {
      throw new BadRequestException('File key is required');
    }

    const keySegments = objectKey.split('/').filter(Boolean);
    if (keySegments.some((segment) => segment === '..')) {
      throw new BadRequestException('File key cannot contain .. segments');
    }

    return keySegments.join('/');
  }

  private normalizeRange(range?: string): ByteRange | undefined {
    const value = range?.trim();
    if (!value) {
      return undefined;
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(value);
    if (!match || value === 'bytes=-') {
      throw new BadRequestException('Invalid range header');
    }

    const [, startValue, endValue] = match;
    const start = startValue ? Number(startValue) : undefined;
    const end = endValue ? Number(endValue) : undefined;

    if (
      (start !== undefined && !Number.isSafeInteger(start)) ||
      (end !== undefined && !Number.isSafeInteger(end))
    ) {
      throw new BadRequestException('Invalid range header');
    }

    if (start === undefined && end !== undefined) {
      return { suffixLength: end };
    }

    return { start, end };
  }

  private resolveRange(range: ByteRange, totalSize: number) {
    if (!Number.isSafeInteger(totalSize) || totalSize <= 0) {
      throw new HttpException(
        'Requested range is not satisfiable',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    }

    if (range.suffixLength !== undefined) {
      if (range.suffixLength <= 0) {
        throw new BadRequestException('Invalid range header');
      }

      const length = Math.min(range.suffixLength, totalSize);
      return {
        start: totalSize - length,
        end: totalSize - 1,
      };
    }

    const start = range.start ?? 0;
    if (start >= totalSize) {
      throw new HttpException(
        'Requested range is not satisfiable',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    }

    const requestedEnd = range.end ?? totalSize - 1;
    if (requestedEnd < start) {
      throw new BadRequestException('Invalid range header');
    }

    const boundedEnd = Math.min(
      requestedEnd,
      totalSize - 1,
      start + MAX_RENDER_CHUNK_SIZE - 1,
    );

    return { start, end: boundedEnd };
  }

  private toReadable(body: unknown) {
    if (body instanceof Readable) {
      return body;
    }

    if (
      body &&
      typeof body === 'object' &&
      'transformToWebStream' in body &&
      typeof body.transformToWebStream === 'function'
    ) {
      const webStream = (body as WebStreamBody).transformToWebStream();
      return Readable.fromWeb(webStream);
    }

    if (body && typeof body === 'object' && Symbol.asyncIterator in body) {
      return Readable.from(body as AsyncIterable<Uint8Array>);
    }

    throw new InternalServerErrorException('File body is not readable');
  }

  async create(createUploadDto: CreateUploadDto) {
    return this.uploadRepository.create(createUploadDto);
  }

  findAll() {
    return this.uploadRepository.findAll();
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  update(id: number, _updateUploadDto: UpdateUploadDto) {
    return `This action updates a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }
}
