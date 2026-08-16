import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import { CreateInventoryLocationDto } from './dto/create-inventory-location.dto';

import { UpdateInventoryLocationDto } from './dto/update-inventory-location.dto';



@Injectable()
export class InventoryLocationsService {


  constructor(
    private readonly prisma: PrismaService,
  ) {}





  async create(
    createInventoryLocationDto: CreateInventoryLocationDto,
  ) {


    const {
      name,
      code,
      address,
      status,
    } = createInventoryLocationDto;



    const existing =
      await this.prisma.inventory_locations.findUnique({

        where:{
          code,
        },

      });



    if(existing){

      throw new ConflictException(
        'Location code already exists',
      );

    }





    return this.prisma.inventory_locations.create({

      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data:{

        name,

        code,

        address,

        status:
          status ?? 'Active',

      } as any,

    });


  }









  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ){


    const skip =
      (page - 1) * limit;



    const where:any = {

      deleted_at:null,

    };



    if(search){

      where.OR=[

        {
          name:{
            contains:search,
            mode:'insensitive',
          },
        },


        {
          code:{
            contains:search,
            mode:'insensitive',
          },
        },


      ];

    }




    const [
      data,
      total,
    ] =
    await Promise.all([



      this.prisma.inventory_locations.findMany({

        where,


        skip,

        take:limit,


        include:{

          inventories:true,

        },


        orderBy:{

          created_at:'desc',

        },


      }),




      this.prisma.inventory_locations.count({

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


    const location =
      await this.prisma.inventory_locations.findFirst({

        where:{

          id:BigInt(id),

          deleted_at:null,

        },


        include:{

          inventories:true,

        },


      });





    if(!location){

      throw new NotFoundException(
        'Inventory location not found',
      );

    }




    return location;


  }









  async update(
    id:number,

    updateInventoryLocationDto:
      UpdateInventoryLocationDto,

  ){



    await this.findOne(id);




    if(
      updateInventoryLocationDto.code
    ){

      const duplicate =
        await this.prisma.inventory_locations.findFirst({

          where:{

            code:
              updateInventoryLocationDto.code,


            NOT:{

              id:BigInt(id),

            },

          },

        });




      if(duplicate){

        throw new ConflictException(
          'Location code already exists',
        );

      }

    }







    return this.prisma.inventory_locations.update({

      where:{

        id:BigInt(id),

      },


      data:updateInventoryLocationDto,


    });



  }









  async remove(
    id:number,
  ){



    await this.findOne(id);




    return this.prisma.inventory_locations.update({

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



    const location =
      await this.prisma.inventory_locations.findUnique({

        where:{

          id:BigInt(id),

        },

      });





    if(!location){

      throw new NotFoundException(
        'Inventory location not found',
      );

    }




    return this.prisma.inventory_locations.update({

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
      await this.prisma.inventory_locations.count({

        where:{

          deleted_at:null,

        },

      });





    const active =
      await this.prisma.inventory_locations.count({

        where:{

          deleted_at:null,

          status:'Active',

        },

      });






    return {


      totalLocations:
        total,


      activeLocations:
        active,


    };


  }



}