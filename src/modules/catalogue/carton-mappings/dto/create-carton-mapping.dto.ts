import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CreateCartonMappingDto {
  @ApiProperty({
    example: 10,
    description: 'Product ID of the carton / case (parent)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  carton_product_id!: number;

  @ApiProperty({
    example: 25,
    description: 'Product ID of the child/unit product inside the carton',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  child_product_id!: number;

  @ApiProperty({
    example: 12,
    description: 'Number of child units inside one carton',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}
