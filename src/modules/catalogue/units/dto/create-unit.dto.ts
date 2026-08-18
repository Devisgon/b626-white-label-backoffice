import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    example: 'Kilogram',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'kg',
  })
  @IsOptional()
  @IsString()
  short_name?: string;

  @ApiPropertyOptional({
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
