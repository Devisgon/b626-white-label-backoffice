import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString } from 'class-validator';

export class UpdatePosDeviceDto {
  @ApiPropertyOptional({ example: 'Front Counter Terminal - Updated' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ enum: ['online', 'offline', 'disabled'] })
  @IsOptional()
  @IsIn(['online', 'offline', 'disabled'])
  status?: string;
}
