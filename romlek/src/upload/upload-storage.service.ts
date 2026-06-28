import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import {
  MAX_RENDER_CHUNK_SIZE,
  SIGNED_RENDER_URL_TTL_SECONDS,
} from './upload.constants';
import {
  ByteRange,
  RenderedFile,
  RenderedFileMetadata,
  StoredObject,
  WebStreamBody,
} from './upload.types';
import {
  getContentType,
  getExtensionContentType,
  normalizeObjectKey,
} from './upload.utils';

@Injectable()
export class UploadStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
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

  async putObject(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(key: string) {
    const objectKey = normalizeObjectKey(key);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  async deletePrefix(prefix: string) {
    const objectPrefix = normalizeObjectKey(prefix).replace(/\/?$/, '/');
    let continuationToken: string | undefined;

    do {
      const listedObjects = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: objectPrefix,
          ContinuationToken: continuationToken,
        }),
      );
      const objects = (listedObjects.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => Boolean(key));

      if (objects.length) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: objects.map((key) => ({ Key: key })),
              Quiet: true,
            },
          }),
        );
      }

      continuationToken = listedObjects.NextContinuationToken;
    } while (continuationToken);
  }

  async getFile(key?: string, range?: string): Promise<RenderedFile> {
    const objectKey = normalizeObjectKey(key);
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
        contentType: getContentType(objectKey, object.ContentType),
        contentLength:
          resolvedRange && totalSize !== undefined
            ? resolvedRange.end - resolvedRange.start + 1
            : object.ContentLength,
        contentRange:
          resolvedRange && totalSize !== undefined
            ? `bytes ${resolvedRange.start}-${resolvedRange.end}/${totalSize}`
            : object.ContentRange,
        etag: object.ETag,
        lastModified: object.LastModified,
        statusCode:
          resolvedRange || object.ContentRange
            ? HttpStatus.PARTIAL_CONTENT
            : HttpStatus.OK,
      };
    } catch (error) {
      this.handleObjectError(error, 'Error rendering file');
    }
  }

  async getFileMetadata(key?: string): Promise<RenderedFileMetadata> {
    const objectKey = normalizeObjectKey(key);

    try {
      const metadata = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      return {
        filename: objectKey.split('/').pop() ?? objectKey,
        contentType: getContentType(objectKey, metadata.ContentType),
        contentLength: metadata.ContentLength,
        etag: metadata.ETag,
        lastModified: metadata.LastModified,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.handleObjectError(error, 'Error reading file metadata');
    }
  }

  async getObject(key: string): Promise<StoredObject> {
    try {
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      if (!object.Body) {
        throw new NotFoundException('File not found');
      }

      return {
        body: this.toReadable(object.Body),
        contentLength: object.ContentLength,
        etag: object.ETag,
        lastModified: object.LastModified,
      };
    } catch (error) {
      this.handleObjectError(error, 'Error reading file');
    }
  }

  async getSignedRenderUrl(key?: string) {
    const objectKey = normalizeObjectKey(key);
    const filename = objectKey.split('/').pop() ?? objectKey;

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseCacheControl: 'public, max-age=3600',
        ResponseContentDisposition: `inline; filename="${filename.replace(/"/g, '\\"')}"`,
        ResponseContentType: getExtensionContentType(objectKey),
      }),
      { expiresIn: SIGNED_RENDER_URL_TTL_SECONDS },
    );
  }

  async getSignedObjectUrl(
    key: string,
    filename: string,
    contentType: string,
    cacheControl: string,
  ) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseCacheControl: cacheControl,
        ResponseContentDisposition: `inline; filename="${filename.replace(/"/g, '\\"')}"`,
        ResponseContentType: contentType,
      }),
      { expiresIn: SIGNED_RENDER_URL_TTL_SECONDS },
    );
  }

  async readObjectText(body: Readable) {
    return (await this.readObjectBuffer(body)).toString('utf8');
  }

  async readObjectBuffer(body: Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private getRequiredConfig(name: string) {
    const value = this.config.get<string>(name)?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured`);
    }
    return value;
  }

  private normalizeRange(range?: string): ByteRange | undefined {
    const value = range?.trim();
    if (!value) {
      return undefined;
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(value);
    if (!match || value === 'bytes=-') {
      throw new HttpException('Invalid range header', HttpStatus.BAD_REQUEST);
    }

    const [, startValue, endValue] = match;
    const start = startValue ? Number(startValue) : undefined;
    const end = endValue ? Number(endValue) : undefined;

    if (
      (start !== undefined && !Number.isSafeInteger(start)) ||
      (end !== undefined && !Number.isSafeInteger(end))
    ) {
      throw new HttpException('Invalid range header', HttpStatus.BAD_REQUEST);
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
        throw new HttpException('Invalid range header', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('Invalid range header', HttpStatus.BAD_REQUEST);
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

  private handleObjectError(error: unknown, message: string): never {
    if (
      error instanceof NotFoundException ||
      error instanceof HttpException
    ) {
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

    console.error(message, error);
    throw new InternalServerErrorException(message);
  }
}
