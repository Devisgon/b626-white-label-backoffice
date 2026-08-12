import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  default_tax_rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  default_margin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  age_restriction?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nacs_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pos_department_number?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}