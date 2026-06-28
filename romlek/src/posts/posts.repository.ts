import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto } from './dto/create-post.dto';

type PostRow = {
  id: string;
  user_id: string | null;
  trip_id: number | null;
  album_id: string | null;
  body: string;
  location: string | null;
  status: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class PostsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(options: { publicOnly?: boolean; uploadedBy?: string; albumId?: string } = {}) {
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (options.uploadedBy) {
      params.push(options.uploadedBy);
      whereClauses.push(`p.user_id = $${params.length}`);
    }

    if (options.albumId) {
      params.push(options.albumId);
      whereClauses.push(`p.album_id = $${params.length}`);
    }

    const result = await this.databaseService.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.trip_id,
        p.album_id,
        p.body,
        p.location,
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
        CASE
          WHEN a.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', a.id,
            'user_id', a.user_id,
            'code', a.code,
            'title', a.title,
            'caption', a.caption,
            'location', a.location,
            'status', a.status,
            'created_at', a.created_at,
            'updated_at', a.updated_at
          )
        END AS album,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_id', m.id,
              'album_id', COALESCE(m.album_id, p.album_id),
              'album_code', a.code,
              'album_title', a.title,
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
      LEFT JOIN albums a ON a.id = p.album_id
      LEFT JOIN post_media pm ON pm.post_id = p.id
      LEFT JOIN media m ON m.id = pm.media_id
        ${options.publicOnly ? 'AND m.is_public = TRUE' : ''}
      LEFT JOIN media_posting_details posting_details ON posting_details.media_id = m.id
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      GROUP BY p.id, u.id, a.id
      ${options.publicOnly ? 'HAVING COUNT(m.id) > 0' : ''}
      ORDER BY p.created_at DESC, p.id DESC
    `,
      params,
    );

    return result.rows;
  }

  async create(post: CreatePostDto, mediaIds: number[]) {
    try {
      const result = await this.databaseService.query<PostRow>(
        `
        INSERT INTO posts (user_id, trip_id, album_id, body, location, status, published_at)
        VALUES ($1, $2, $3, $4, $5, $6::varchar, CASE WHEN $6::text = 'published' THEN NOW() ELSE NULL END)
        RETURNING *
      `,
        [
          this.toNullableId(post.user_id),
          this.toNullableId(post.trip_id),
          this.toNullableId(post.album_id),
          post.body,
          post.location?.trim() || null,
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

      if (!createdPost.album_id && mediaIds.length > 1) {
        const album = await this.createAlbumForPost(createdPost, post.album_title);
        const updatedPost = await this.databaseService.query<PostRow>(
          `
          UPDATE posts
          SET album_id = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `,
          [album.id, createdPost.id],
        );

        await this.assignMediaToAlbum(mediaIds, album.id);

        return updatedPost.rows[0] ?? { ...createdPost, album_id: album.id };
      }

      if (createdPost.album_id && mediaIds.length) {
        await this.assignMediaToAlbum(mediaIds, createdPost.album_id);
      }

      return createdPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  private toNullableId(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return String(value).trim() || null;
  }

  private async createAlbumForPost(post: PostRow, title?: string | null) {
    const result = await this.databaseService.query<{ id: string }>(
      `
      INSERT INTO albums (user_id, code, title, caption, location, status, source_post_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (source_post_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        caption = EXCLUDED.caption,
        location = EXCLUDED.location,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
      [
        post.user_id,
        this.generateAlbumCode(),
        title?.trim() || 'Album',
        post.body,
        post.location,
        post.status,
        post.id,
        post.created_at,
      ],
    );

    return result.rows[0];
  }

  private async assignMediaToAlbum(mediaIds: number[], albumId: string | number) {
    await this.databaseService.query(
      `
      UPDATE media
      SET album_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2::bigint[])
    `,
      [albumId, mediaIds],
    );
  }

  private generateAlbumCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ALB-${timestamp}-${suffix}`;
  }
}
