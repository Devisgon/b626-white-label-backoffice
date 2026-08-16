import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
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
        if (typeof value === 'bigint') {
          return Number(value);
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        return value;
      }),
    );
  }

  // ==========================
  // GET ALL CATEGORIES
  // SEARCH + FILTER +
  // OFFSET + CURSOR PAGINATION
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
    const where: Prisma.categoriesWhereInput = {
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

    const validSort =
      allowedSortFields.includes(sortBy) ? sortBy : 'id';

    // CURSOR PAGINATION
    if (cursor) {
      const data = await this.prisma.categories.findMany({
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
          nextCursor: hasMore
            ? Number(data[data.length - 1].id)
            : null,
          hasMore,
        },
        data: this.serialize(data),
      };
    }

    // OFFSET PAGINATION

    const totalRecords =
      await this.prisma.categories.count({
        where,
      });

    const currentPage = page || 1;

    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.categories.findMany({
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
  // GET CATEGORY
  // ==========================
  async findOne(id: number) {
    const category =
      await this.prisma.categories.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    return {
      success: true,
      data: this.serialize(category),
    };
  }

  // ==========================
  // CREATE CATEGORY
  // ==========================
  async create(
    createCategoryDto: CreateCategoryDto,
  ) {
    const exists =
      await this.prisma.categories.findFirst({
        where: {
          name: createCategoryDto.name,
          deleted_at: null,
        },
      });

    if (exists) {
      throw new ConflictException(
        'Category already exists.',
      );
    }

    const category =
      await this.prisma.categories.create({
        // tenant_id is injected automatically by the tenant-scoping Prisma
        // extension (see src/prisma/tenant-scoping.extension.ts)
        data: {
          ...createCategoryDto,
          created_at: new Date(),
          updated_at: new Date(),
        } as any,
      });

    return {
      success: true,
      message: 'Category created successfully.',
      data: this.serialize(category),
    };
  }

  // ==========================
  // UPDATE CATEGORY
  // ==========================
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const existing =
      await this.prisma.categories.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existing.name
    ) {
      const duplicate =
        await this.prisma.categories.findFirst({
          where: {
            name: updateCategoryDto.name,
            deleted_at: null,
            id: {
              not: BigInt(id),
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Category already exists.',
        );
      }
    }

    const category =
      await this.prisma.categories.update({
        where: {
          id: BigInt(id),
        },
        data: {
          ...updateCategoryDto,
          updated_at: new Date(),
        },
      });

    return {
      success: true,
      message: 'Category updated successfully.',
      data: this.serialize(category),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing =
      await this.prisma.categories.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    const category =
      await this.prisma.categories.update({
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
      message: 'Category deleted successfully.',
      data: this.serialize(category),
    };
  }

  // ==========================
  // RESTORE CATEGORY
  // ==========================
  async restore(id: number) {
    const existing =
      await this.prisma.categories.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: {
            not: null,
          },
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Deleted category not found.',
      );
    }

    const category =
      await this.prisma.categories.update({
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
      message: 'Category restored successfully.',
      data: this.serialize(category),
    };
  }

  // ==========================
  // CATEGORY STATS
  // ==========================
  async getStats() {
    const total =
      await this.prisma.categories.count({
        where: {
          deleted_at: null,
        },
      });

    const active =
      await this.prisma.categories.count({
        where: {
          status: 'Active',
          deleted_at: null,
        },
      });

    const inactive =
      await this.prisma.categories.count({
        where: {
          status: 'Inactive',
          deleted_at: null,
        },
      });

    return {
      success: true,
      data: {
        totalCategories: total,
        activeCategories: active,
        inactiveCategories: inactive,
      },
    };
  }
}