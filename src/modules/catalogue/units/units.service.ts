import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
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
  // GET ALL UNITS
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
    const where: Prisma.unitsWhereInput = {
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
          short_name: {
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
      'short_name',
      'status',
      'created_at',
      'updated_at',
    ];

    const validSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'id';

    // Cursor Pagination
    if (cursor) {
      const data = await this.prisma.units.findMany({
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

    // Offset Pagination
    const totalRecords = await this.prisma.units.count({
      where,
    });

    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.units.findMany({
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
  // GET ONE
  // ==========================
  async findOne(id: number) {
    const unit = await this.prisma.units.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }

    return {
      success: true,
      data: this.serialize(unit),
    };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(createUnitDto: CreateUnitDto) {
    const existing = await this.prisma.units.findFirst({
      where: {
        name: createUnitDto.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException('Unit already exists.');
    }

    const unit = await this.prisma.units.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        ...createUnitDto,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    });

    return {
      success: true,
      message: 'Unit created successfully.',
      data: this.serialize(unit),
    };
  }

  // ==========================
  // UPDATE
  // ==========================
  async update(id: number, updateUnitDto: UpdateUnitDto) {
    const existing = await this.prisma.units.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Unit not found.');
    }

    if (
      updateUnitDto.name &&
      updateUnitDto.name !== existing.name
    ) {
      const duplicate = await this.prisma.units.findFirst({
        where: {
          name: updateUnitDto.name,
          id: {
            not: BigInt(id),
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('Unit already exists.');
      }
    }

    const unit = await this.prisma.units.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...updateUnitDto,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Unit updated successfully.',
      data: this.serialize(unit),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing = await this.prisma.units.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Unit not found.');
    }

    const unit = await this.prisma.units.update({
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
      message: 'Unit deleted successfully.',
      data: this.serialize(unit),
    };
  }

  // ==========================
  // RESTORE
  // ==========================
  async restore(id: number) {
    const existing = await this.prisma.units.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: {
          not: null,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Deleted unit not found.');
    }

    const unit = await this.prisma.units.update({
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
      message: 'Unit restored successfully.',
      data: this.serialize(unit),
    };
  }

  // ==========================
  // STATISTICS
  // ==========================
  async getStats() {
    const totalUnits = await this.prisma.units.count({
      where: {
        deleted_at: null,
      },
    });

    const activeUnits = await this.prisma.units.count({
      where: {
        status: 'Active',
        deleted_at: null,
      },
    });

    const inactiveUnits = await this.prisma.units.count({
      where: {
        status: 'Inactive',
        deleted_at: null,
      },
    });

    return {
      success: true,
      data: {
        totalUnits,
        activeUnits,
        inactiveUnits,
      },
    };
  }
}