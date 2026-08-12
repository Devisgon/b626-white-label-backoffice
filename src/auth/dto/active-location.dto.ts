import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ActiveLocationDto {
  @ApiProperty({ example: 'b7e2c1a4-...' })
  @IsUUID()
  locationId: string;
}
