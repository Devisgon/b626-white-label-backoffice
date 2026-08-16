import { Module } from '@nestjs/common';


import { ProductInventoryController } 
from './product-inventory.controller';


import { ProductInventoryService } 
from './product-inventory.service';


import { PrismaService } 
from '../../../prisma/prisma.service';



@Module({

  controllers:[

    ProductInventoryController,

  ],



  providers:[

    ProductInventoryService,

    PrismaService,

  ],



  exports:[

    ProductInventoryService,

  ],


})
export class ProductInventoryModule {}