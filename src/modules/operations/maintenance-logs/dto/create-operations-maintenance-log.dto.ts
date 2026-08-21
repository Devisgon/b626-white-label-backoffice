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

export class CreateOperationsMaintenanceLogDto {
  @ApiProperty({
    example: 'Pump 2 not dispensing',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Nozzle stuck, needs technician',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({
    example: 'Medium',
    default: 'Medium',
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({
    example: 'Ali Raza',
  })
  @IsOptional()
  @IsString()
  reported_by?: string;

  @ApiPropertyOptional({
    example: 'Reported',
    default: 'Reported',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
