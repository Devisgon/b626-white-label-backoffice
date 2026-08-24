import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTaxRuleDto {
  @ApiProperty({ required: false, example: 'Standard GST' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 17 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercent?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}