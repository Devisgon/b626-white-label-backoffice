import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreatePayeeDto } from './create-payee.dto';

export class UpdatePayeeDto extends PartialType(CreatePayeeDto) {
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
