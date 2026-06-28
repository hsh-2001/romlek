import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiPropertyOptional()
  user_id?: string | null;

  @ApiPropertyOptional()
  trip_id?: number | string | null;

  @ApiPropertyOptional()
  album_id?: number | string | null;

  @ApiPropertyOptional()
  album_title?: string | null;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional({ default: 'draft' })
  status?: string;

  @ApiPropertyOptional({ type: [Number] })
  media_ids?: Array<number | string>;
}
