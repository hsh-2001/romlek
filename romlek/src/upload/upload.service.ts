import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
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

  async upload(files?: Express.Multer.File[], path?: string) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPath = this.normalizePath(path);
    const uploadedFiles = await Promise.all(
      files.map((file) => this.uploadOne(file, uploadPath)),
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

  private async uploadOne(file: Express.Multer.File, path: string) {
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
      return {
        originalFilename: filename,
        filename: generatedFilename,
        path,
        key,
        contentType: file.mimetype,
        size: file.size,
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

  async getFile(key?: string) {
    const objectKey = this.normalizeObjectKey(key);

    try {
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      if (!object.Body) {
        throw new NotFoundException('File not found');
      }

      return {
        body: this.toReadable(object.Body),
        filename: objectKey.split('/').pop() ?? objectKey,
        contentType: object.ContentType ?? 'application/octet-stream',
        contentLength: object.ContentLength,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorName = error instanceof Error ? error.name : undefined;
      if (errorName === 'NoSuchKey' || errorName === 'NotFound') {
        throw new NotFoundException('File not found');
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
      const webStream = body.transformToWebStream() as Parameters<
        typeof Readable.fromWeb
      >[0];
      return Readable.fromWeb(webStream);
    }

    if (body && typeof body === 'object' && Symbol.asyncIterator in body) {
      return Readable.from(body as AsyncIterable<Uint8Array>);
    }

    throw new InternalServerErrorException('File body is not readable');
  }

  create(createUploadDto: CreateUploadDto) {
    return 'This action adds a new upload';
  }

  findAll() {
    return `This action returns all upload`;
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  update(id: number, updateUploadDto: UpdateUploadDto) {
    return `This action updates a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }
}
