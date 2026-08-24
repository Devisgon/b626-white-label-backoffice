import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateFuelDeliveryDto {
  @ApiProperty({
    example: 1,
    description: 'Fuel tank ID',
  })
  @IsInt()
  @Min(1)
  tank_id: number;

  @ApiPropertyOptional({
    example: 'PSO Distributors',
  })
  @IsOptional()
  @IsString()
  supplier_name?: string;

  @ApiProperty({
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    example: 'INV-2026-001',
  })
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @ApiProperty({
    example: '2026-08-17T09:00:00.000Z',
  })
  @IsDateString()
  delivery_date: string;

  @ApiPropertyOptional({
    example: 'Received',
    default: 'Received',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
