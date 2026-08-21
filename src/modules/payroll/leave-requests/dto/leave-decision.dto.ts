import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LeaveDecisionDto {
  @ApiProperty({ required: false, example: 'Approved — coverage arranged' })
  @IsOptional()
  @IsString()
  note?: string;
}