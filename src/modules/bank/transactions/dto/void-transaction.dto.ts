import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoidTransactionDto {
  @ApiProperty({ example: 'Duplicate entry — entered twice by mistake' })
  @IsString()
  @IsNotEmpty()
  voidReason: string;
}
