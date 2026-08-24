import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateFuelPriceDto {
  @ApiProperty({
    example: 'Diesel',
  })
  @IsString()
  fuel_type: string;

  @ApiProperty({
    example: 272.5,
  })
  @IsNumber()
  @Min(0)
  price_per_liter: number;

  @ApiProperty({
    example: '2026-08-17T00:00:00.000Z',
  })
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
