import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type PostRow = {
  id: string;
  user_id: string | null;
  trip_id: number | null;
  album_id: string | null;
  title: string | null;
  body: string;
  location: string | null;
  travel_date: Date | string | null;
  duration: string | null;
  travel_style: string | null;
  companions: string | null;
  budget: string | null;
  highlights: string | null;
  tips: string | null;
  status: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type NormalizedUpdatePostDto = Omit<UpdatePostDto, 'media_ids_to_add' | 'media_ids_to_remove'> & {
  media_ids_to_add?: number[];
  media_ids_to_remove?: number[];
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
        p.title,
        p.body,
        p.location,
        p.travel_date,
        p.duration,
        p.travel_style,
        p.companions,
        p.budget,
        p.highlights,
        p.tips,
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
        INSERT INTO posts (
          user_id,
          trip_id,
          album_id,
          title,
          body,
          location,
          travel_date,
          duration,
          travel_style,
          companions,
          budget,
          highlights,
          tips,
          status,
          published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13, $14::varchar, CASE WHEN $14::text = 'published' THEN NOW() ELSE NULL END)
        RETURNING *
      `,
        [
          this.toNullableId(post.user_id),
          this.toNullableId(post.trip_id),
          this.toNullableId(post.album_id),
          this.toNullableText(post.title),
          post.body,
          this.toNullableText(post.location),
          this.toNullableDate(post.travel_date),
          this.toNullableText(post.duration),
          this.toNullableText(post.travel_style),
          this.toNullableText(post.companions),
          this.toNullableText(post.budget),
          this.toNullableText(post.highlights),
          this.toNullableText(post.tips),
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

  async update(id: string, post: NormalizedUpdatePostDto) {
    const result = await this.databaseService.query<PostRow>(
      `
      UPDATE posts
      SET title = CASE WHEN $2 THEN $3 ELSE title END,
          body = COALESCE($4, body),
          location = CASE WHEN $5 THEN $6 ELSE location END,
          travel_date = CASE WHEN $7 THEN $8::date ELSE travel_date END,
          duration = CASE WHEN $9 THEN $10 ELSE duration END,
          travel_style = CASE WHEN $11 THEN $12 ELSE travel_style END,
          companions = CASE WHEN $13 THEN $14 ELSE companions END,
          budget = CASE WHEN $15 THEN $16 ELSE budget END,
          highlights = CASE WHEN $17 THEN $18 ELSE highlights END,
          tips = CASE WHEN $19 THEN $20 ELSE tips END,
          status = COALESCE($21, status),
          published_at = CASE
            WHEN COALESCE($21, status) = 'published' AND published_at IS NULL THEN NOW()
            WHEN COALESCE($21, status) <> 'published' THEN NULL
            ELSE published_at
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [
        id,
        post.title !== undefined,
        this.toNullableText(post.title),
        post.body ?? null,
        post.location !== undefined,
        this.toNullableText(post.location),
        post.travel_date !== undefined,
        this.toNullableDate(post.travel_date),
        post.duration !== undefined,
        this.toNullableText(post.duration),
        post.travel_style !== undefined,
        this.toNullableText(post.travel_style),
        post.companions !== undefined,
        this.toNullableText(post.companions),
        post.budget !== undefined,
        this.toNullableText(post.budget),
        post.highlights !== undefined,
        this.toNullableText(post.highlights),
        post.tips !== undefined,
        this.toNullableText(post.tips),
        post.status ?? null,
      ],
    );

    if (result.rows[0]?.album_id) {
      await this.syncAlbumForPost(result.rows[0]);
    }

    const updatedPost = result.rows[0];
    if (!updatedPost) {
      return null;
    }

    const mediaIdsToRemove = post.media_ids_to_remove ?? [];
    const removeIdSet = new Set(mediaIdsToRemove);
    const mediaIdsToAdd = (post.media_ids_to_add ?? []).filter((mediaId) => !removeIdSet.has(mediaId));

    if (mediaIdsToRemove.length) {
      await this.detachMediaFromPost(updatedPost.id, mediaIdsToRemove);
    }

    if (mediaIdsToAdd.length) {
      const postForMedia = await this.ensureAlbumForUpdatedPost(updatedPost);
      await this.attachMediaToPost(postForMedia, mediaIdsToAdd);
    }

    return updatedPost;
  }

  private toNullableId(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return String(value).trim() || null;
  }

  private toNullableText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    return value.trim() || null;
  }

  private toNullableDate(value?: string | null) {
    const date = this.toNullableText(value);
    return date || null;
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
        title?.trim() || post.title?.trim() || post.location?.trim() || 'Trip Story',
        post.body,
        post.location,
        post.status,
        post.id,
        post.created_at,
      ],
    );

    return result.rows[0];
  }

  private async syncAlbumForPost(post: PostRow) {
    await this.databaseService.query(
      `
      UPDATE albums
      SET title = COALESCE($2, title),
          caption = $3,
          location = $4,
          status = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [post.album_id, post.title, post.body, post.location, post.status],
    );
  }

  private async ensureAlbumForUpdatedPost(post: PostRow) {
    if (post.album_id) {
      return post;
    }

    const existingMediaCount = await this.databaseService.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM post_media
      WHERE post_id = $1
    `,
      [post.id],
    );

    if (Number(existingMediaCount.rows[0]?.count ?? 0) === 0) {
      return post;
    }

    const album = await this.createAlbumForPost(post, post.location || 'Album');
    const updatedPost = await this.databaseService.query<PostRow>(
      `
      UPDATE posts
      SET album_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
      [album.id, post.id],
    );

    await this.databaseService.query(
      `
      UPDATE media
      SET album_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT media_id
        FROM post_media
        WHERE post_id = $2
      )
    `,
      [album.id, post.id],
    );

    return updatedPost.rows[0] ?? { ...post, album_id: album.id };
  }

  private async detachMediaFromPost(postId: string | number, mediaIds: number[]) {
    await this.databaseService.query(
      `
      DELETE FROM post_media
      WHERE post_id = $1
        AND media_id = ANY($2::bigint[])
    `,
      [postId, mediaIds],
    );

    await this.databaseService.query(
      `
      UPDATE media m
      SET is_public = EXISTS (
            SELECT 1
            FROM post_media pm
            WHERE pm.media_id = m.id
          ),
          album_id = CASE
            WHEN EXISTS (
              SELECT 1
              FROM post_media pm
              WHERE pm.media_id = m.id
            ) THEN album_id
            ELSE NULL
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE m.id = ANY($1::bigint[])
    `,
      [mediaIds],
    );
  }

  private async attachMediaToPost(post: PostRow, mediaIds: number[]) {
    const existingResult = await this.databaseService.query<{ media_id: string }>(
      `
      SELECT media_id::text AS media_id
      FROM post_media
      WHERE post_id = $1
        AND media_id = ANY($2::bigint[])
    `,
      [post.id, mediaIds],
    );
    const existingMediaIds = new Set(existingResult.rows.map((row) => row.media_id));
    const mediaIdsToAttach = mediaIds.filter((mediaId) => !existingMediaIds.has(String(mediaId)));

    if (!mediaIdsToAttach.length) {
      return;
    }

    const orderResult = await this.databaseService.query<{ next_order: number }>(
      `
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
      FROM post_media
      WHERE post_id = $1
    `,
      [post.id],
    );
    const startOrder = Number(orderResult.rows[0]?.next_order ?? 0);

    await Promise.all(
      mediaIdsToAttach.map((mediaId, index) =>
        this.databaseService.query(
          `
          INSERT INTO post_media (post_id, media_id, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, media_id)
          DO NOTHING
        `,
          [post.id, mediaId, startOrder + index],
        ),
      ),
    );

    await this.databaseService.query(
      `
      UPDATE media
      SET is_public = TRUE,
          album_id = COALESCE(album_id, $2),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::bigint[])
    `,
      [mediaIdsToAttach, post.album_id],
    );

    await Promise.all(
      mediaIdsToAttach.map((mediaId) =>
        this.databaseService.query(
          `
          INSERT INTO media_posting_details (media_id, location, caption)
          VALUES ($1, $2, $3)
          ON CONFLICT (media_id)
          DO UPDATE SET
            location = EXCLUDED.location,
            caption = EXCLUDED.caption,
            updated_at = CURRENT_TIMESTAMP
        `,
          [mediaId, post.location, post.body],
        ),
      ),
    );
  }

  private async assignMediaToAlbum(mediaIds: number[], albumId: string | number) {
    await this.databaseService.query(
      `
      UPDATE media
      SET album_id = COALESCE(album_id, $1),
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
