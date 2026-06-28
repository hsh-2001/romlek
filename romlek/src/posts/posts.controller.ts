import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts with attached media' })
  findAll(
    @Query('public_only') publicOnly?: string | boolean,
    @Query('uploaded_by') uploadedBy?: string,
    @Query('album_id') albumId?: string,
  ) {
    return this.postsService.findAll({ publicOnly, uploadedBy, albumId });
  }

  @Post()
  @ApiOperation({ summary: 'Create a post with optional media attachments' })
  @ApiBody({ type: CreatePostDto })
  create(@Body() post: CreatePostDto) {
    return this.postsService.create(post);
  }
}
