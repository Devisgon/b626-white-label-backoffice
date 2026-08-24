import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateTaxRuleDto {
  @ApiProperty({ example: 'Standard GST' })
  @IsString()
  name: string;

  @ApiProperty({ example: 17, description: 'Tax rate as a percentage, e.g. 17 = 17%' })
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercent: number;

  @ApiProperty({
    required: false,
    description: 'Scope this rate to one specific location. Omit to apply it to every location.',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}