import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UseInterceptors,
  UploadedFiles,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiBody({ type: CreateUploadDto })
  create(@Body() createUploadDto: CreateUploadDto) {
    return this.uploadService.create(createUploadDto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload files' })
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
        path: {
          type: 'string',
          description: 'Optional path to upload files to',
        },
        uploaded_by: {
          type: 'string',
          description: 'Optional user id of the uploader',
        },
        is_public: {
          type: 'boolean',
          description: 'Whether uploaded files should be public',
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
  uploadFile(
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

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }

  @Get('render')
  @ApiOperation({ summary: 'Render uploaded file' })
  async renderFile(
    @Query('key') key: string,
    @Headers('range') range: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.uploadService.getFile(key, range);

    response.status(file.statusCode);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Accept-Ranges', 'bytes');
    if (file.contentLength !== undefined) {
      response.setHeader('Content-Length', file.contentLength.toString());
    }
    if (file.contentRange) {
      response.setHeader('Content-Range', file.contentRange);
    }
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${file.filename}"`,
    );

    return new StreamableFile(file.body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUploadDto: UpdateUploadDto) {
    return this.uploadService.update(+id, updateUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(+id);
  }
}
