import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto } from './dto/create-post.dto';

type PostRow = {
  id: string;
  user_id: number | null;
  trip_id: number | null;
  body: string;
  status: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class PostsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(options: { publicOnly?: boolean } = {}) {
    const result = await this.databaseService.query(`
      SELECT
        p.id,
        p.user_id,
        p.trip_id,
        p.body,
        p.status,
        p.published_at,
        p.created_at,
        p.updated_at,
        CASE
          WHEN u.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', u.id,
            'username', u.username,
            'name', u.username,
            'email', u.email
          )
        END AS user,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_id', m.id,
              'file_name', m.file_name,
              'original_name', m.original_name,
              'file_path', m.file_path,
              'file_url', m.file_url,
              'mime_type', m.mime_type,
              'extension', m.extension,
              'file_size', m.file_size,
              'width', m.width,
              'height', m.height,
              'duration', m.duration,
              'storage_provider', m.storage_provider,
              'uploaded_by', m.uploaded_by,
              'is_public', m.is_public,
              'caption', COALESCE(posting_details.caption, pm.caption),
              'location', posting_details.location,
              'sort_order', pm.sort_order,
              'created_at', m.created_at,
              'updated_at', m.updated_at
            )
            ORDER BY pm.sort_order ASC, m.created_at ASC
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) AS media
      FROM posts p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN post_media pm ON pm.post_id = p.id
      LEFT JOIN media m ON m.id = pm.media_id
      LEFT JOIN media_posting_details posting_details ON posting_details.media_id = m.id
        ${options.publicOnly ? 'AND m.is_public = TRUE' : ''}
      GROUP BY p.id, u.id
      ${options.publicOnly ? 'HAVING COUNT(m.id) > 0' : ''}
      ORDER BY p.created_at DESC, p.id DESC
    `);

    return result.rows;
  }

  async create(post: CreatePostDto, mediaIds: number[]) {
    const result = await this.databaseService.query<PostRow>(
      `
      INSERT INTO posts (user_id, trip_id, body, status, published_at)
      VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'published' THEN NOW() ELSE NULL END)
      RETURNING *
    `,
      [
        this.toNullableId(post.user_id),
        this.toNullableId(post.trip_id),
        post.body,
        post.status || 'draft',
      ],
    );
    const createdPost = result.rows[0];

    if (mediaIds.length) {
      await Promise.all(
        mediaIds.map((mediaId, index) =>
          this.databaseService.query(
            `
            INSERT INTO post_media (post_id, media_id, sort_order)
            VALUES ($1, $2, $3)
            ON CONFLICT (post_id, media_id)
            DO UPDATE SET sort_order = EXCLUDED.sort_order
          `,
            [createdPost.id, mediaId, index],
          ),
        ),
      );
    }

    return createdPost;
  }

  private toNullableId(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return String(value).trim() || null;
  }
}
