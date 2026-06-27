import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Express } from 'express';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UploadHlsService } from './upload-hls.service';
import { UploadRepository } from './upload.repository';
import { UploadStorageService } from './upload-storage.service';
import { UploadOptions } from './upload.types';
import {
  generateFilename,
  getExtension,
  getFileUrl,
  getHlsPlaylistUrl,
  isVideo,
  normalizeUploadPath,
  parseBoolean,
} from './upload.utils';

@Injectable()
export class UploadService {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly storage: UploadStorageService,
    private readonly hls: UploadHlsService,
  ) {}

  async upload(
    files?: Express.Multer.File[],
    path?: string,
    options: UploadOptions = {},
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPath = normalizeUploadPath(path);
    const uploadedFiles = await Promise.all(
      files.map((file) => this.uploadOne(file, uploadPath, options)),
    );

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    };
  }

  private async uploadOne(
    file: Express.Multer.File,
    path: string,
    options: UploadOptions,
  ) {
    const originalFilename = file.originalname?.trim();
    if (!originalFilename) {
      throw new BadRequestException('Uploaded file must have a filename');
    }

    const filename = generateFilename(originalFilename);
    const key = path ? `${path}/${filename}` : filename;

    try {
      await this.storage.putObject(key, file.buffer, file.mimetype);
      const hlsUrl = await this.hls.createVariantForUpload(file, key);
      const media = await this.uploadRepository.create(
        new CreateUploadDto({
          file_name: filename,
          original_name: originalFilename,
          file_path: key,
          file_url: getFileUrl(key),
          mime_type: file.mimetype,
          extension: getExtension(originalFilename),
          file_size: file.size,
          width: null,
          height: null,
          duration: null,
          storage_provider: 'r2',
          uploaded_by: options.uploadedBy?.trim() || null,
          is_public: parseBoolean(options.isPublic),
        }),
      );

      return {
        originalFilename,
        filename,
        path,
        key,
        hlsUrl,
        contentType: file.mimetype,
        size: file.size,
        media: hlsUrl ? { ...media, hls_url: hlsUrl } : media,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  getFile(key?: string, range?: string) {
    return this.storage.getFile(key, range);
  }

  getSignedRenderUrl(key?: string) {
    return this.storage.getSignedRenderUrl(key);
  }

  getFileMetadata(key?: string) {
    return this.storage.getFileMetadata(key);
  }

  getHlsPlaylist(key?: string) {
    return this.hls.getPlaylist(key);
  }

  getHlsSegment(key?: string, segment?: string) {
    return this.hls.getSegment(key, segment);
  }

  getSignedHlsSegmentUrl(key?: string, segment?: string) {
    return this.hls.getSignedSegmentUrl(key, segment);
  }

  createHlsForKey(key?: string) {
    return this.hls.createVariantForKey(key);
  }

  async findAll() {
    const uploads = await this.uploadRepository.findAll();
    return uploads.map((upload) =>
      isVideo(upload.mime_type, upload.original_name || upload.file_name)
        ? { ...upload, hls_url: getHlsPlaylistUrl(upload.file_path) }
        : upload,
    );
  }
}
