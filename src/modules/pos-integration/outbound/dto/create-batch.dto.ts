import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateBatchDto {
  @ApiPropertyOptional({
    type: [String],
    description:
      'Specific mapping IDs to include. If omitted, all eligible (mapped, non-blocked) mappings are included.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mappingIds?: string[];
}
