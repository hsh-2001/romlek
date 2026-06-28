import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiPropertyOptional()
  user_id?: number | string | null;

  @ApiPropertyOptional()
  trip_id?: number | string | null;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ default: 'draft' })
  status?: string;

  @ApiPropertyOptional({ type: [Number] })
  media_ids?: Array<number | string>;
}
