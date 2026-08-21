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

export class CreateOperationsShiftDto {
  @ApiProperty({
    example: 'Ali Raza',
  })
  @IsString()
  staff_name: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiProperty({
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  opening_float: number;

  @ApiPropertyOptional({
    example: 18500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  closing_cash?: number;

  @ApiProperty({
    example: '2026-08-19T08:00:00.000Z',
  })
  @IsDateString()
  shift_start: string;

  @ApiPropertyOptional({
    example: '2026-08-19T16:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  shift_end?: string;

  @ApiPropertyOptional({
    example: 'Open',
    default: 'Open',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
