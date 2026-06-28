import { Injectable } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UploadRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(options: { publicOnly?: boolean; uploadedBy?: string | null } = {}) {
    try {
      const whereClauses: string[] = [];
      const params: unknown[] = [];

      if (options.publicOnly) {
        whereClauses.push('is_public = TRUE');
      }

      if (options.uploadedBy) {
        params.push(options.uploadedBy);
        whereClauses.push(`uploaded_by = $${params.length}`);
      }

      const result = await this.databaseService.query<CreateUploadDto>(
        `
      SELECT
        id,
        file_name,
        original_name,
        file_path,
        file_url,
        mime_type,
        extension,
        file_size,
        width,
        height,
        duration,
        storage_provider,
        uploaded_by,
        is_public,
        created_at,
        updated_at
      FROM media
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
    `,
        params,
      );

      return result.rows;
    } catch (error) {
      console.error('Error finding uploads:', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const result = await this.databaseService.query<CreateUploadDto>(
        `
      SELECT
        id,
        file_name,
        original_name,
        file_path,
        file_url,
        mime_type,
        extension,
        file_size,
        width,
        height,
        duration,
        storage_provider,
        uploaded_by,
        is_public,
        created_at,
        updated_at
      FROM media
      WHERE id = $1
      LIMIT 1
    `,
        [id],
      );

      return result.rows[0] ?? null;
    } catch (error) {
      console.error('Error finding upload:', error);
      throw error;
    }
  }

  async create(createUploadDto: CreateUploadDto) {
    try {
      const result = await this.databaseService.query<CreateUploadDto>(
        `
      INSERT INTO media (
        file_name,
        original_name,
        file_path,
        file_url,
        mime_type,
        extension,
        file_size,
        width,
        height,
        duration,
        storage_provider,
        uploaded_by,
        is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
        [
          createUploadDto.file_name,
          createUploadDto.original_name,
          createUploadDto.file_path,
          createUploadDto.file_url,
          createUploadDto.mime_type,
          createUploadDto.extension,
          createUploadDto.file_size,
          createUploadDto.width,
          createUploadDto.height,
          createUploadDto.duration,
          createUploadDto.storage_provider,
          createUploadDto.uploaded_by,
          createUploadDto.is_public,
        ],
      );
      return result?.rows[0] ?? null;
    } catch (error) {
      console.error('Error creating upload:', error);
      throw error;
    }
  }

  async deleteById(id: string) {
    try {
      const result = await this.databaseService.query<CreateUploadDto>(
        `
      DELETE FROM media
      WHERE id = $1
      RETURNING *
    `,
        [id],
      );

      return result.rows[0] ?? null;
    } catch (error) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  }
}
