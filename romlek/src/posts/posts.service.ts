import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsRepository } from './posts.repository';
import { parseBoolean } from '../upload/upload.utils';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  findAll(options: { publicOnly?: string | boolean; uploadedBy?: string; albumId?: string } = {}) {
    return this.postsRepository.findAll({
      publicOnly: parseBoolean(options.publicOnly),
      uploadedBy: options.uploadedBy?.trim() || undefined,
      albumId: options.albumId?.trim() || undefined,
    });
  }

  create(post: CreatePostDto) {
    const body = post.body?.trim();
    const mediaIds = this.normalizeMediaIds(post.media_ids);

    if (!body && !mediaIds.length) {
      throw new BadRequestException('Post body or media is required');
    }

    return this.postsRepository.create(
      {
        ...post,
        body: body || '',
        status: post.status?.trim() || 'draft',
      },
      mediaIds,
    );
  }

  private normalizeMediaIds(mediaIds?: Array<number | string>) {
    if (!Array.isArray(mediaIds)) {
      return [];
    }

    return mediaIds
      .map((mediaId) => Number(mediaId))
      .filter((mediaId) => Number.isSafeInteger(mediaId) && mediaId > 0);
  }
}
