import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
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
  // GET ALL SUPPLIERS
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
    const where: Prisma.suppliersWhereInput = {
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
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
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
      'email',
      'status',
      'created_at',
      'updated_at',
    ];

    const validSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'id';

    // Cursor Pagination
    if (cursor) {
      const data = await this.prisma.suppliers.findMany({
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
    const totalRecords = await this.prisma.suppliers.count({
      where,
    });

    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.suppliers.findMany({
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
    const supplier = await this.prisma.suppliers.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }

    return {
      success: true,
      data: this.serialize(supplier),
    };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(createSupplierDto: CreateSupplierDto) {
    const existing = await this.prisma.suppliers.findFirst({
      where: {
        name: createSupplierDto.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Supplier already exists.',
      );
    }

    const supplier = await this.prisma.suppliers.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        ...createSupplierDto,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    });

    return {
      success: true,
      message: 'Supplier created successfully.',
      data: this.serialize(supplier),
    };
  }

  // ==========================
  // UPDATE
  // ==========================
  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
  ) {
    const existing = await this.prisma.suppliers.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Supplier not found.',
      );
    }

    if (
      updateSupplierDto.name &&
      updateSupplierDto.name !== existing.name
    ) {
      const duplicate =
        await this.prisma.suppliers.findFirst({
          where: {
            name: updateSupplierDto.name,
            id: {
              not: BigInt(id),
            },
            deleted_at: null,
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Supplier already exists.',
        );
      }
    }

    const supplier = await this.prisma.suppliers.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...updateSupplierDto,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Supplier updated successfully.',
      data: this.serialize(supplier),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing = await this.prisma.suppliers.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Supplier not found.',
      );
    }

    const supplier = await this.prisma.suppliers.update({
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
      message: 'Supplier deleted successfully.',
      data: this.serialize(supplier),
    };
  }

  // ==========================
  // RESTORE
  // ==========================
  async restore(id: number) {
    const existing = await this.prisma.suppliers.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: {
          not: null,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Deleted supplier not found.',
      );
    }

    const supplier = await this.prisma.suppliers.update({
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
      message: 'Supplier restored successfully.',
      data: this.serialize(supplier),
    };
  }

  // ==========================
  // STATISTICS
  // ==========================
  async getStats() {
    const totalSuppliers =
      await this.prisma.suppliers.count({
        where: {
          deleted_at: null,
        },
      });

    const activeSuppliers =
      await this.prisma.suppliers.count({
        where: {
          status: 'Active',
          deleted_at: null,
        },
      });

    const inactiveSuppliers =
      await this.prisma.suppliers.count({
        where: {
          status: 'Inactive',
          deleted_at: null,
        },
      });

    return {
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
      },
    };
  }
}