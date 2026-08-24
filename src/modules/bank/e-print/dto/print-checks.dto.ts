import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsUUID,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class PrintChecksDto {
  @ApiProperty({
    type: [String],
    description: 'Transaction IDs to print as checks',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  transactionIds: string[];

  @ApiProperty({
    example: '12564',
    description:
      'Starting check number — assigned sequentially to selected transactions',
  })
  @IsString()
  @IsNotEmpty()
  startingCheckNumber: string;
}
