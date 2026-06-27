import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// );
export class CreateUploadDto {
  @ApiProperty()
  file_name!: string;
  @ApiProperty()
  original_name!: string;
  @ApiProperty()
  file_path!: string;
  @ApiPropertyOptional({ nullable: true })
  file_url?: string | null;
  @ApiProperty()
  mime_type!: string;
  @ApiPropertyOptional({ nullable: true })
  extension?: string | null;
  @ApiProperty()
  file_size!: number;
  @ApiPropertyOptional({ nullable: true })
  width?: number | null;
  @ApiPropertyOptional({ nullable: true })
  height?: number | null;
  @ApiPropertyOptional({ nullable: true })
  duration?: number | null;
  @ApiPropertyOptional({ default: 'r2' })
  storage_provider?: string;
  @ApiPropertyOptional({ nullable: true })
  uploaded_by?: string | null;
  @ApiPropertyOptional({ default: false })
  is_public?: boolean;
  @ApiPropertyOptional()
  created_at?: Date;
  @ApiPropertyOptional()
  updated_at?: Date;

  constructor(partial: Partial<CreateUploadDto>) {
    Object.assign(this, partial);
  }
}
