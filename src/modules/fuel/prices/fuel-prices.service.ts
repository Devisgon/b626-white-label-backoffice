import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFuelPriceDto } from './dto/create-fuel-price.dto';
import { UpdateFuelPriceDto } from './dto/update-fuel-price.dto';

@Injectable()
export class FuelPricesService {
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
  // GET ALL
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
    const where: Prisma.fuel_pricesWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [{ fuel_type: { contains: search, mode: 'insensitive' } }];
    }

    if (status) {
      where.status = status;
    }

    const allowedSortFields = [
      'id',
      'fuel_type',
      'price_per_liter',
      'effective_from',
      'status',
      'created_at',
    ];

    const validSort = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    if (cursor) {
      const data = await this.prisma.fuel_prices.findMany({
        where,
        cursor: { id: BigInt(cursor) },
        skip: 1,
        take: limit + 1,
        orderBy: { [validSort]: order },
      });

      const hasMore = data.length > limit;
      if (hasMore) data.pop();

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

    const totalRecords = await this.prisma.fuel_prices.count({ where });
    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.fuel_prices.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [validSort]: order },
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
    const record = await this.prisma.fuel_prices.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!record) {
      throw new NotFoundException('Record not found.');
    }

    return { success: true, data: this.serialize(record) };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(dto: CreateFuelPriceDto) {
    const { fuel_type, price_per_liter, effective_from, location_id, status } =
      dto;

    const record = await this.prisma.fuel_prices.create({
      // tenant_id / store_location_id are injected automatically by the
      // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        fuel_type,
        price_per_liter,
        effective_from: new Date(effective_from),
        location_id,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    });

    return {
      success: true,
      message: 'Created successfully.',
      data: this.serialize(record),
    };
  }

  // ==========================
  // UPDATE
  // ==========================
  async update(id: number, dto: UpdateFuelPriceDto) {
    const existing = await this.prisma.fuel_prices.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Record not found.');
    }

    const record = await this.prisma.fuel_prices.update({
      where: { id: BigInt(id) },
      data: {
        ...dto,
        updated_at: new Date(),
      } as any,
    });

    return {
      success: true,
      message: 'Updated successfully.',
      data: this.serialize(record),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing = await this.prisma.fuel_prices.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Record not found.');
    }

    const record = await this.prisma.fuel_prices.update({
      where: { id: BigInt(id) },
      data: {
        status: 'Inactive',
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Deleted successfully.',
      data: this.serialize(record),
    };
  }

  // ==========================
  // RESTORE
  // ==========================
  async restore(id: number) {
    const existing = await this.prisma.fuel_prices.findFirst({
      where: { id: BigInt(id), deleted_at: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Deleted record not found.');
    }

    const record = await this.prisma.fuel_prices.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: null,
        status: 'Active',
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Restored successfully.',
      data: this.serialize(record),
    };
  }

  // ==========================
  // STATISTICS
  // ==========================
  async getStats() {
    const total = await this.prisma.fuel_prices.count({
      where: { deleted_at: null },
    });
    const active = await this.prisma.fuel_prices.count({
      where: { status: 'Active', deleted_at: null },
    });
    const inactive = await this.prisma.fuel_prices.count({
      where: { status: 'Inactive', deleted_at: null },
    });

    return {
      success: true,
      data: { total, active, inactive },
    };
  }
}
