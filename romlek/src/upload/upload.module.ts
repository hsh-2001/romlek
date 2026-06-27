import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UploadRepository } from './upload.repository';
import { UploadStorageService } from './upload-storage.service';
import { UploadHlsService } from './upload-hls.service';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    UploadRepository,
    UploadStorageService,
    UploadHlsService,
  ],
})
export class UploadModule {}
