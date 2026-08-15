import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePosDeviceDto {
  @ApiProperty({ example: 'Front Counter Terminal' })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty({ example: 'POS-001' })
  @IsString()
  @IsNotEmpty()
  deviceCode: string;
}
