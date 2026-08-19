import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}