import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.CASUAL })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-26' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false, example: 'Family event' })
  @IsOptional()
  @IsString()
  reason?: string;
}