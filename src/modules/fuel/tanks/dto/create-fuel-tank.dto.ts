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

export class CreateFuelTankDto {
  @ApiProperty({
    example: 'Tank 1 - Premium',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Petrol',
  })
  @IsString()
  fuel_type: string;

  @ApiProperty({
    example: 20000,
  })
  @IsNumber()
  @Min(0)
  capacity: number;

  @ApiPropertyOptional({
    example: 15000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

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
