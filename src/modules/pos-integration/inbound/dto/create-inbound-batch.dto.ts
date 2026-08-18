import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInboundBatchDto {
  @ApiProperty({
    type: [Object],
    description: 'Raw items received from the POS device, as-is',
    example: [
      { externalEntityKey: 'ITEM-00231', field: 'price', newValue: 2.75 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsObject({ each: true })
  @Type(() => Object)
  items: Record<string, any>[];
}
