import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoidTransferDto {
  @ApiProperty({ example: 'Entered wrong amount, redoing transfer' })
  @IsString()
  @IsNotEmpty()
  voidReason: string;
}
