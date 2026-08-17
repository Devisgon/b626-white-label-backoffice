import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { CreateMappingDto } from './create-mapping.dto';

export class UpdateMappingDto extends PartialType(CreateMappingDto) {
  @ApiPropertyOptional({ enum: ['unresolved', 'partial', 'mapped', 'blocked'] })
  @IsOptional()
  @IsIn(['unresolved', 'partial', 'mapped', 'blocked'])
  status?: string;
}
