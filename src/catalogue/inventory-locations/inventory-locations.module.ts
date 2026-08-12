import { Module } from '@nestjs/common';


import { InventoryLocationsController } 
from './inventory-locations.controller';


import { InventoryLocationsService } 
from './inventory-locations.service';


import { PrismaService } 
from '../../prisma/prisma.service';



@Module({

  controllers:[

    InventoryLocationsController,

  ],



  providers:[

    InventoryLocationsService,

    PrismaService,

  ],



  exports:[

    InventoryLocationsService,

  ],


})
export class InventoryLocationsModule {}