import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================
  // SERIALIZE BIGINT
  // ==========================
  private serialize(data: any) {
    if (data === null || data === undefined) {
      return data;
    }

    return JSON.parse(
      JSON.stringify(data, (_, value) => {
        if (typeof value === 'bigint') return Number(value);
        if (value instanceof Date) return value.toISOString();
        return value;
      }),
    );
  }

  // ==========================
  // GET ALL BRANDS
  // ==========================
  async findAll(
    search?: string,
    status?: string,
    page?: number,
    limit = 10,
    sortBy = 'id',
    order: 'asc' | 'desc' = 'asc',
    cursor?: number,
  ) {
    const where: Prisma.brandsWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const allowedSortFields = [
      'id',
      'name',
      'status',
      'created_at',
      'updated_at',
    ];

    const validSort = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    // Cursor Pagination
    if (cursor) {
      const data = await this.prisma.brands.findMany({
        where,
        cursor: {
          id: BigInt(cursor),
        },
        skip: 1,
        take: limit + 1,
        orderBy: {
          [validSort]: order,
        },
      });

      const hasMore = data.length > limit;

      if (hasMore) {
        data.pop();
      }

      return {
        success: true,
        pagination: {
          type: 'cursor',
          limit,
          nextCursor: hasMore ? Number(data[data.length - 1].id) : null,
          hasMore,
        },
        data: this.serialize(data),
      };
    }

    // Offset Pagination
    const totalRecords = await this.prisma.brands.count({
      where,
    });

    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.brands.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSort]: order,
      },
    });

    return {
      success: true,
      pagination: {
        type: 'offset',
        page: currentPage,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
      data: this.serialize(data),
    };
  }

  // ==========================
  // GET BRAND BY ID
  // ==========================
  async findOne(id: number) {
    const brand = await this.prisma.brands.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found.');
    }

    return {
      success: true,
      data: this.serialize(brand),
    };
  }

  // ==========================
  // CREATE BRAND
  // ==========================
  async create(createBrandDto: CreateBrandDto) {
    const existing = await this.prisma.brands.findFirst({
      where: {
        name: createBrandDto.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException('Brand already exists.');
    }

    const brand = await this.prisma.brands.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        ...createBrandDto,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    });

    return {
      success: true,
      message: 'Brand created successfully.',
      data: this.serialize(brand),
    };
  }

  // ==========================
  // UPDATE BRAND
  // ==========================
  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const existing = await this.prisma.brands.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Brand not found.');
    }

    if (updateBrandDto.name && updateBrandDto.name !== existing.name) {
      const duplicate = await this.prisma.brands.findFirst({
        where: {
          name: updateBrandDto.name,
          id: {
            not: BigInt(id),
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('Brand already exists.');
      }
    }

    const brand = await this.prisma.brands.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...updateBrandDto,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Brand updated successfully.',
      data: this.serialize(brand),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing = await this.prisma.brands.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Brand not found.');
    }

    const brand = await this.prisma.brands.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'Inactive',
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Brand deleted successfully.',
      data: this.serialize(brand),
    };
  }

  // ==========================
  // RESTORE
  // ==========================
  async restore(id: number) {
    const existing = await this.prisma.brands.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: {
          not: null,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Deleted brand not found.');
    }

    const brand = await this.prisma.brands.update({
      where: {
        id: BigInt(id),
      },
      data: {
        deleted_at: null,
        status: 'Active',
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Brand restored successfully.',
      data: this.serialize(brand),
    };
  }

  // ==========================
  // BRAND STATISTICS
  // ==========================
  async getStats() {
    const totalBrands = await this.prisma.brands.count({
      where: {
        deleted_at: null,
      },
    });

    const activeBrands = await this.prisma.brands.count({
      where: {
        status: 'Active',
        deleted_at: null,
      },
    });

    const inactiveBrands = await this.prisma.brands.count({
      where: {
        status: 'Inactive',
        deleted_at: null,
      },
    });

    return {
      success: true,
      data: {
        totalBrands,
        activeBrands,
        inactiveBrands,
      },
    };
  }
}
