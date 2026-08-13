import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';


import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';



import { ProductInventoryService } 
from './product-inventory.service';


import { CreateProductInventoryDto } 
from './dto/create-product-inventory.dto';


import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { RequireLocation } from '../../common/decorators/require-location.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../modules/auth/enums/role.enum';



@ApiTags('Catalogue - Product Inventory')
@Roles(Role.OWNER_ADMIN, Role.STORE_MANAGER, Role.INVENTORY_USER)
@RequireLocation()
@ApiBearerAuth('accessToken')
@Controller('catalogue/product-inventory')
export class ProductInventoryController {


  constructor(
    private readonly productInventoryService:
      ProductInventoryService,
  ) {}







  @Post()
  @ApiOperation({
    summary:'Assign product inventory to location',
  })
  @ApiResponse({
    status:201,
    description:'Product inventory created',
  })
  create(

    @Body()
    createProductInventoryDto:
      CreateProductInventoryDto,

  ){

    return this.productInventoryService.create(
      createProductInventoryDto,
    );

  }









  @Get()
  @ApiOperation({
    summary:'Get product inventories',
  })
  @ApiQuery({
    name:'page',
    required:false,
    example:1,
  })
  @ApiQuery({
    name:'limit',
    required:false,
    example:10,
  })
  @ApiQuery({
    name:'search',
    required:false,
    example:'Milk',
  })
  findAll(

    @Query('page')
    page?:number,


    @Query('limit')
    limit?:number,


    @Query('search')
    search?:string,

  ){


    return this.productInventoryService.findAll(

      page ? Number(page) : 1,

      limit ? Number(limit) : 10,

      search,

    );


  }









  @Get('stats')
  @ApiOperation({
    summary:'Product inventory statistics',
  })
  getStats(){

    return this.productInventoryService.getStats();

  }









  @Get(':id')
  @ApiOperation({
    summary:'Get product inventory by id',
  })
  findOne(

    @Param(
      'id',
      ParseIntPipe,
    )
    id:number,

  ){

    return this.productInventoryService.findOne(
      id,
    );

  }









  @Patch(':id')
  @ApiOperation({
    summary:'Update product inventory',
  })
  update(

    @Param(
      'id',
      ParseIntPipe,
    )
    id:number,


    @Body()
    updateProductInventoryDto:
      UpdateProductInventoryDto,

  ){


    return this.productInventoryService.update(

      id,

      updateProductInventoryDto,

    );


  }









  @Delete(':id')
  @ApiOperation({
    summary:'Soft delete product inventory',
  })
  remove(

    @Param(
      'id',
      ParseIntPipe,
    )
    id:number,

  ){

    return this.productInventoryService.remove(
      id,
    );

  }









  @Patch(':id/restore')
  @ApiOperation({
    summary:'Restore product inventory',
  })
  restore(

    @Param(
      'id',
      ParseIntPipe,
    )
    id:number,

  ){

    return this.productInventoryService.restore(
      id,
    );

  }



}