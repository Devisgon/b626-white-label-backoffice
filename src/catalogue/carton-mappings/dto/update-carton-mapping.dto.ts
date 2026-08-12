import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateCartonMappingDto {
  @ApiPropertyOptional({ example: 12, description: 'Number of child units inside one carton' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity?: number;
}
