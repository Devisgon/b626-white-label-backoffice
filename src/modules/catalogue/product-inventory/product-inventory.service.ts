import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';

import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';

@Injectable()
export class ProductInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductInventoryDto: CreateProductInventoryDto) {
    const {
      product_id,

      location_id,

      on_hand_quantity,

      reserved_quantity,

      reorder_level,

      minimum_stock,

      maximum_stock,
    } = createProductInventoryDto;

    const product = await this.prisma.products.findFirst({
      where: {
        id: BigInt(product_id),

        deleted_at: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const location = await this.prisma.inventory_locations.findFirst({
      where: {
        id: BigInt(location_id),

        deleted_at: null,
      },
    });

    if (!location) {
      throw new NotFoundException('Inventory location not found');
    }

    const existing = await this.prisma.product_inventory.findUnique({
      where: {
        product_id_location_id: {
          product_id: BigInt(product_id),

          location_id: BigInt(location_id),
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already assigned to this location');
    }

    return this.prisma.product_inventory.create({
      // tenant_id / store_location_id are injected automatically by the
      // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        product_id: BigInt(product_id),

        location_id: BigInt(location_id),

        on_hand_quantity: on_hand_quantity ?? 0,

        reserved_quantity: reserved_quantity ?? 0,

        reorder_level,

        minimum_stock,

        maximum_stock,
      } as any,

      include: {
        product: true,

        location: true,
      },
    });
  }

  async findAll(
    page = 1,

    limit = 10,

    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        {
          product: {
            name: {
              contains: search,

              mode: 'insensitive',
            },
          },
        },

        {
          location: {
            name: {
              contains: search,

              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product_inventory.findMany({
        where,

        skip,

        take: limit,

        include: {
          product: true,

          location: true,
        },

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.product_inventory.count({
        where,
      }),
    ]);

    return {
      data,

      pagination: {
        total,

        page,

        limit,

        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const inventory = await this.prisma.product_inventory.findFirst({
      where: {
        id: BigInt(id),

        deleted_at: null,
      },

      include: {
        product: true,

        location: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Product inventory not found');
    }

    return {
      ...inventory,

      available_quantity:
        inventory.on_hand_quantity - inventory.reserved_quantity,
    };
  }

  async update(
    id: number,

    updateProductInventoryDto: UpdateProductInventoryDto,
  ) {
    await this.findOne(id);

    return this.prisma.product_inventory.update({
      where: {
        id: BigInt(id),
      },

      data: updateProductInventoryDto,

      include: {
        product: true,

        location: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.product_inventory.update({
      where: {
        id: BigInt(id),
      },

      data: {
        deleted_at: new Date(),
      },
    });
  }

  async restore(id: number) {
    const inventory = await this.prisma.product_inventory.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!inventory) {
      throw new NotFoundException('Product inventory not found');
    }

    return this.prisma.product_inventory.update({
      where: {
        id: BigInt(id),
      },

      data: {
        deleted_at: null,
      },
    });
  }

  async getStats() {
    const total = await this.prisma.product_inventory.count({
      where: {
        deleted_at: null,
      },
    });

    const lowStock = await this.prisma.product_inventory.count({
      where: {
        deleted_at: null,

        on_hand_quantity: {
          lte: 10,
        },
      },
    });

    return {
      totalProductInventory: total,

      lowStockItems: lowStock,
    };
  }
}
