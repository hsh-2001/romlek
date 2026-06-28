import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  body?: string;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiPropertyOptional()
  travel_date?: string | null;

  @ApiPropertyOptional()
  duration?: string | null;

  @ApiPropertyOptional()
  travel_style?: string | null;

  @ApiPropertyOptional()
  companions?: string | null;

  @ApiPropertyOptional()
  budget?: string | null;

  @ApiPropertyOptional()
  highlights?: string | null;

  @ApiPropertyOptional()
  tips?: string | null;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional({ type: [Number] })
  media_ids_to_add?: Array<number | string>;

  @ApiPropertyOptional({ type: [Number] })
  media_ids_to_remove?: Array<number | string>;
}
