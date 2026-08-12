import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';


@Injectable()
export class InventoryService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}


  async create(
    createInventoryDto: CreateInventoryDto,
  ) {

    const {
      product_id,
      quantity,
      reserved_quantity,
      minimum_stock,
      maximum_stock,
      reorder_level,
      warehouse,
      status,
    } = createInventoryDto;


    const product =
      await this.prisma.products.findUnique({
        where: {
          id: BigInt(product_id),
        },
      });


    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }


    const inventory =
      await this.prisma.inventory.create({

        // tenant_id / store_location_id are injected automatically by the
        // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
        data: {

          product_id: BigInt(product_id),

          quantity,

          reserved_quantity:
            reserved_quantity ?? 0,

          minimum_stock,

          maximum_stock,

          reorder_level,

          warehouse,

          status:
            status ?? 'Active',

        } as any,

      });



    await this.prisma.inventory_logs.create({

      // tenant_id / store_location_id are injected automatically by the
      // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
      data: {

        inventory_id:
          inventory.id,

        product_id:
          BigInt(product_id),

        action:
          'CREATE',

        previous_quantity:
          0,

        new_quantity:
          quantity,

        reason:
          'Initial inventory creation',

      } as any,

    });



    return inventory;

  }





  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ) {


    const skip =
      (page - 1) * limit;



    const where:any = {

      deleted_at:null,

    };



    if(search){

      where.OR = [

        {
          warehouse:{
            contains:search,
            mode:'insensitive',
          },
        },


        {
          products:{
            name:{
              contains:search,
              mode:'insensitive',
            },
          },
        },

      ];

    }



    const [
      data,
      total,
    ] =
    await Promise.all([


      this.prisma.inventory.findMany({

        where,

        skip,

        take:limit,


        include:{

          products:true,

        },


        orderBy:{
          created_at:'desc',
        },

      }),



      this.prisma.inventory.count({
        where,
      }),


    ]);



    return {

      data,

      pagination:{

        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),

      },

    };


  }





  async findOne(
    id:number,
  ){

    const inventory =
      await this.prisma.inventory.findFirst({

        where:{

          id:BigInt(id),

          deleted_at:null,

        },

        include:{

          products:true,

          inventory_logs:true,

        },

      });



    if(!inventory){

      throw new NotFoundException(
        'Inventory not found',
      );

    }



    return inventory;

  }





  async update(
    id:number,
    updateInventoryDto:UpdateInventoryDto,
  ){


    const existing =
      await this.findOne(id);



    const updated =
      await this.prisma.inventory.update({

        where:{

          id:BigInt(id),

        },


        data:updateInventoryDto,

      });



    if(
      updateInventoryDto.quantity !== undefined
    ){

      await this.prisma.inventory_logs.create({

        // tenant_id / store_location_id are injected automatically by the
        // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
        data:{

          inventory_id:
            existing.id,

          product_id:
            existing.product_id,


          action:
            'UPDATE',


          previous_quantity:
            existing.quantity,


          new_quantity:
            updateInventoryDto.quantity,


          reason:
            'Inventory quantity updated',

        } as any,

      });

    }



    return updated;


  }






  async remove(
    id:number,
  ){

    await this.findOne(id);


    return this.prisma.inventory.update({

      where:{
        id:BigInt(id),
      },


      data:{

        deleted_at:
          new Date(),

      },

    });


  }





  async restore(
    id:number,
  ){

    const inventory =
      await this.prisma.inventory.findUnique({

        where:{
          id:BigInt(id),
        },

      });



    if(!inventory){

      throw new NotFoundException(
        'Inventory not found',
      );

    }



    return this.prisma.inventory.update({

      where:{
        id:BigInt(id),
      },


      data:{

        deleted_at:null,

      },

    });


  }





  async getStats(){


    const total =
      await this.prisma.inventory.count({

        where:{
          deleted_at:null,
        },

      });



    const lowStock =
      await this.prisma.inventory.count({

        where:{

          deleted_at:null,

          quantity:{
            lte:10,
          },

        },

      });



    return {

      totalInventoryItems:
        total,

      lowStockItems:
        lowStock,

    };


  }



}