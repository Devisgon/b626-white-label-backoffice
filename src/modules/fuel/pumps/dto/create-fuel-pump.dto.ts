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

export class CreateFuelPumpDto {
  @ApiProperty({
    example: 'Pump 1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Fuel tank ID',
  })
  @IsInt()
  @Min(1)
  tank_id: number;

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
