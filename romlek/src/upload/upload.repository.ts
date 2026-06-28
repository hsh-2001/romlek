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
        whereClauses.push('media.is_public = TRUE');
      }

      if (options.uploadedBy) {
        params.push(options.uploadedBy);
        whereClauses.push(`media.uploaded_by = $${params.length}`);
      }

      const result = await this.databaseService.query<CreateUploadDto>(
        `
      SELECT
        media.id,
        media.file_name,
        media.original_name,
        media.file_path,
        media.file_url,
        media.mime_type,
        media.extension,
        media.file_size,
        media.width,
        media.height,
        media.duration,
        media.storage_provider,
        media.uploaded_by,
        uploader.username AS uploader_username,
        uploader.username AS uploader_name,
        media.is_public,
        posting_details.location,
        posting_details.caption,
        media.created_at,
        media.updated_at
      FROM media
      LEFT JOIN media_posting_details posting_details ON posting_details.media_id = media.id
      LEFT JOIN users uploader ON uploader.id = media.uploaded_by
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      ORDER BY media.created_at DESC, media.id DESC
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
        media.id,
        media.file_name,
        media.original_name,
        media.file_path,
        media.file_url,
        media.mime_type,
        media.extension,
        media.file_size,
        media.width,
        media.height,
        media.duration,
        media.storage_provider,
        media.uploaded_by,
        uploader.username AS uploader_username,
        uploader.username AS uploader_name,
        media.is_public,
        posting_details.location,
        posting_details.caption,
        media.created_at,
        media.updated_at
      FROM media
      LEFT JOIN media_posting_details posting_details ON posting_details.media_id = media.id
      LEFT JOIN users uploader ON uploader.id = media.uploaded_by
      WHERE media.id = $1
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

  async upsertPostingDetails(mediaId: string | number, details: { location: string; caption: string }) {
    try {
      const result = await this.databaseService.query(
        `
      INSERT INTO media_posting_details (media_id, location, caption)
      VALUES ($1, $2, $3)
      ON CONFLICT (media_id)
      DO UPDATE SET
        location = EXCLUDED.location,
        caption = EXCLUDED.caption,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
        [mediaId, details.location, details.caption],
      );

      return result.rows[0] ?? null;
    } catch (error) {
      console.error('Error saving posting details:', error);
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
