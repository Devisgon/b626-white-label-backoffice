import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TimesheetNoteDto {
  @ApiProperty({ required: false, example: 'Left 15 min early — approved by manager verbally' })
  @IsOptional()
  @IsString()
  notes?: string;
}