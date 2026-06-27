import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ) {
    const files = [
      ...(uploadedFiles.files ?? []),
      ...(uploadedFiles.file ?? []),
    ];
    return this.uploadService.upload(files, path);
  }

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }

  @Get('render')
  @ApiOperation({ summary: 'Render uploaded file' })
  async renderFile(
    @Query('key') key: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.uploadService.getFile(key);

    response.setHeader('Content-Type', file.contentType);
    if (file.contentLength) {
      response.setHeader('Content-Length', file.contentLength.toString());
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
