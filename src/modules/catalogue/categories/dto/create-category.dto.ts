import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Beverages',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Soft drinks and juices',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
