import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
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
        title: this.normalizeOptionalText(post.title),
        body: body || '',
        location: this.normalizeOptionalText(post.location),
        travel_date: this.normalizeOptionalText(post.travel_date),
        duration: this.normalizeOptionalText(post.duration),
        travel_style: this.normalizeOptionalText(post.travel_style),
        companions: this.normalizeOptionalText(post.companions),
        budget: this.normalizeOptionalText(post.budget),
        highlights: this.normalizeOptionalText(post.highlights),
        tips: this.normalizeOptionalText(post.tips),
        status: post.status?.trim() || 'draft',
      },
      mediaIds,
    );
  }

  async update(id: string, post: UpdatePostDto) {
    const updatedPost = await this.postsRepository.update(id.trim(), {
      ...post,
      title: post.title === undefined ? undefined : this.normalizeOptionalText(post.title),
      body: post.body?.trim(),
      location: post.location === undefined ? undefined : this.normalizeOptionalText(post.location),
      travel_date: post.travel_date === undefined ? undefined : this.normalizeOptionalText(post.travel_date),
      duration: post.duration === undefined ? undefined : this.normalizeOptionalText(post.duration),
      travel_style: post.travel_style === undefined ? undefined : this.normalizeOptionalText(post.travel_style),
      companions: post.companions === undefined ? undefined : this.normalizeOptionalText(post.companions),
      budget: post.budget === undefined ? undefined : this.normalizeOptionalText(post.budget),
      highlights: post.highlights === undefined ? undefined : this.normalizeOptionalText(post.highlights),
      tips: post.tips === undefined ? undefined : this.normalizeOptionalText(post.tips),
      status: post.status?.trim(),
      media_ids_to_add: this.normalizeMediaIds(post.media_ids_to_add),
      media_ids_to_remove: this.normalizeMediaIds(post.media_ids_to_remove),
    });

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    return updatedPost;
  }

  private normalizeMediaIds(mediaIds?: Array<number | string>) {
    if (!Array.isArray(mediaIds)) {
      return [];
    }

    return Array.from(
      new Set(
        mediaIds
          .map((mediaId) => Number(mediaId))
          .filter((mediaId) => Number.isSafeInteger(mediaId) && mediaId > 0),
      ),
    );
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    return value.trim() || null;
  }
}
