import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewInboundBatchDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  decision: string;

  @ApiPropertyOptional({
    example: 'Data looked inconsistent with current mappings',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
