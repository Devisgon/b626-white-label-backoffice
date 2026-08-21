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

export class CreateOperationsChecklistItemDto {
  @ApiProperty({
    example: 'Turn on lights',
  })
  @IsString()
  item_name: string;

  @ApiPropertyOptional({
    example: 'Opening',
    default: 'Opening',
  })
  @IsOptional()
  @IsString()
  checklist_type?: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e0-1234-4a5b-9c6d-7e8f9a0b1c2d',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiProperty({
    example: '2026-08-19T00:00:00.000Z',
  })
  @IsDateString()
  checklist_date: string;

  @ApiPropertyOptional({
    example: 'Ali Raza',
  })
  @IsOptional()
  @IsString()
  completed_by?: string;

  @ApiPropertyOptional({
    example: '2026-08-19T08:15:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @ApiPropertyOptional({
    example: 'Pending',
    default: 'Pending',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
