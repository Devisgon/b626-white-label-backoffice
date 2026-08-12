import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';



export class CreateProductInventoryDto {


  @ApiProperty({
    example:1,
    description:'Product ID',
  })
  @IsInt()
  @Min(1)
  product_id:number;




  @ApiProperty({
    example:1,
    description:'Inventory location ID',
  })
  @IsInt()
  @Min(1)
  location_id:number;




  @ApiPropertyOptional({
    example:100,
    default:0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  on_hand_quantity?:number;




  @ApiPropertyOptional({
    example:5,
    default:0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reserved_quantity?:number;




  @ApiPropertyOptional({
    example:20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorder_level?:number;




  @ApiPropertyOptional({
    example:10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_stock?:number;




  @ApiPropertyOptional({
    example:500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximum_stock?:number;



}