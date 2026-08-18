import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class CreateInventoryLocationDto {
  @ApiProperty({
    example: 'Main Warehouse',
    description: 'Inventory location name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'WH-001',
    description: 'Unique warehouse code',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: 'Sahiwal Main Branch',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
