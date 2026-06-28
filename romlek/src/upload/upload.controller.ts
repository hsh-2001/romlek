import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Head,
  Headers,
  Param,
  UseInterceptors,
  UploadedFiles,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import type { RenderedFile, RenderedFileMetadata } from './upload.types';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get()
  @ApiOperation({ summary: 'List uploaded media' })
  findAll(
    @Query('public_only') publicOnly?: string | boolean,
    @Query('uploaded_by') uploadedBy?: string,
  ) {
    return this.uploadService.findAll({ publicOnly, uploadedBy });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete uploaded media' })
  delete(@Param('id') id: string) {
    return this.uploadService.delete(id);
  }

  @Post()
  @ApiOperation({ summary: 'Upload files and create HLS for videos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
          description: 'Optional R2 folder path.',
        },
        uploaded_by: {
          type: 'string',
          description: 'Optional user id of the uploader.',
        },
        is_public: {
          type: 'boolean',
          description: 'Whether uploaded files should be public.',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  uploadFiles(
    @UploadedFiles()
    uploadedFiles: {
      files?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body('path') path?: string,
    @Body('uploaded_by') uploadedBy?: string,
    @Body('is_public') isPublic?: string | boolean,
  ) {
    const files = [
      ...(uploadedFiles.files ?? []),
      ...(uploadedFiles.file ?? []),
    ];

    return this.uploadService.upload(files, path, {
      uploadedBy,
      isPublic,
    });
  }

  @Head('render')
  @ApiOperation({ summary: 'Read uploaded media metadata' })
  async headRender(
    @Query('key') key: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const metadata = await this.uploadService.getFileMetadata(key);
    this.setRenderHeaders(response, metadata);
    response.status(metadata.statusCode).end();
  }

  @Get('render')
  @ApiOperation({ summary: 'Render uploaded media' })
  async render(
    @Query('key') key: string,
    @Headers('range') range: string | undefined,
    @Res() response: Response,
  ) {
    const file = await this.uploadService.getFile(key, range);
    this.setRenderHeaders(response, file);
    response.status(file.statusCode);
    file.body.pipe(response);
  }

  @Get('hls/playlist')
  @ApiOperation({ summary: 'Render uploaded video HLS playlist' })
  async hlsPlaylist(
    @Query('key') key: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const playlist = await this.uploadService.getHlsPlaylist(key);
    response.setHeader('Content-Type', playlist.contentType);
    response.setHeader('Cache-Control', 'no-store');
    return playlist.body;
  }

  @Get('hls/segment')
  @ApiOperation({ summary: 'Render uploaded video HLS segment' })
  async hlsSegment(
    @Query('key') key: string,
    @Query('segment') segment: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const signedUrl = await this.uploadService.getSignedHlsSegmentUrl(
      key,
      segment,
    );
    response.setHeader('Cache-Control', 'no-store');
    response.redirect(302, signedUrl);
  }

  @Post('hls/transcode')
  @ApiOperation({ summary: 'Create HLS for an existing uploaded video' })
  createHlsVariant(@Query('key') key: string) {
    return this.uploadService.createHlsForKey(key);
  }

  private setRenderHeaders(
    response: Response,
    file: RenderedFile | RenderedFileMetadata,
  ) {
    const filename = file.filename.replace(/"/g, '\\"');
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${filename}"`,
    );

    if (file.contentLength !== undefined) {
      response.setHeader('Content-Length', file.contentLength.toString());
    }

    if ('contentRange' in file && file.contentRange) {
      response.setHeader('Content-Range', file.contentRange);
    }

    if (file.etag) {
      response.setHeader('ETag', file.etag);
    }

    if (file.lastModified) {
      response.setHeader('Last-Modified', file.lastModified.toUTCString());
    }
  }
}
