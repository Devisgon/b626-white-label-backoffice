import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOperationsExpenseDto } from './dto/create-operations-expense.dto';
import { UpdateOperationsExpenseDto } from './dto/update-operations-expense.dto';

@Injectable()
export class OperationsExpensesService {
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
    const where: Prisma.operations_expensesWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const allowedSortFields = [
      'id',
      'category',
      'amount',
      'expense_date',
      'status',
      'created_at',
    ];

    const validSort = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    if (cursor) {
      const data = await this.prisma.operations_expenses.findMany({
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

    const totalRecords = await this.prisma.operations_expenses.count({ where });
    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.operations_expenses.findMany({
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
    const record = await this.prisma.operations_expenses.findFirst({
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
  async create(dto: CreateOperationsExpenseDto) {
    const {
      category,
      description,
      amount,
      location_id,
      expense_date,
      payment_method,
      status,
    } = dto;

    const record = await this.prisma.operations_expenses.create({
      // tenant_id / store_location_id are injected automatically by the
      // tenant-scoping Prisma extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        category,
        description,
        amount,
        location_id,
        expense_date: new Date(expense_date),
        payment_method,
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
  async update(id: number, dto: UpdateOperationsExpenseDto) {
    const existing = await this.prisma.operations_expenses.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Record not found.');
    }

    const record = await this.prisma.operations_expenses.update({
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
    const existing = await this.prisma.operations_expenses.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Record not found.');
    }

    const record = await this.prisma.operations_expenses.update({
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
    const existing = await this.prisma.operations_expenses.findFirst({
      where: { id: BigInt(id), deleted_at: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Deleted record not found.');
    }

    const record = await this.prisma.operations_expenses.update({
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
    const total = await this.prisma.operations_expenses.count({
      where: { deleted_at: null },
    });
    const active = await this.prisma.operations_expenses.count({
      where: { status: 'Active', deleted_at: null },
    });
    const inactive = await this.prisma.operations_expenses.count({
      where: { status: 'Inactive', deleted_at: null },
    });

    return {
      success: true,
      data: { total, active, inactive },
    };
  }
}
