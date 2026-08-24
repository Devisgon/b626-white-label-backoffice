import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}