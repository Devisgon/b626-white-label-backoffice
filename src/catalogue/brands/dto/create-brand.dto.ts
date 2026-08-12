import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Nestle',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Food & Beverage Brand',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}