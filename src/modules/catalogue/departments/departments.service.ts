import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
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
  // GET ALL DEPARTMENTS
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
    const where: Prisma.departmentsWhereInput = {
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

    const validSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'id';

    // ==========================
    // CURSOR PAGINATION
    // ==========================
    if (cursor) {
      const data = await this.prisma.departments.findMany({
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

    // ==========================
    // OFFSET PAGINATION
    // ==========================
    const totalRecords =
      await this.prisma.departments.count({
        where,
      });

    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data =
      await this.prisma.departments.findMany({
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
        totalPages: Math.ceil(
          totalRecords / limit,
        ),
      },
      data: this.serialize(data),
    };
  }

  // ==========================
  // GET BY ID
  // ==========================
  async findOne(id: number) {
    const department =
      await this.prisma.departments.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!department) {
      throw new NotFoundException(
        'Department not found.',
      );
    }

    return {
      success: true,
      data: this.serialize(department),
    };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(
    createDepartmentDto: CreateDepartmentDto,
  ) {
    const existing =
      await this.prisma.departments.findFirst({
        where: {
          name: createDepartmentDto.name,
          deleted_at: null,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Department already exists.',
      );
    }

    const department =
      await this.prisma.departments.create({
        // tenant_id is injected automatically by the tenant-scoping Prisma
        // extension (see src/prisma/tenant-scoping.extension.ts)
        data: {
          ...createDepartmentDto,
          created_at: new Date(),
          updated_at: new Date(),
        } as any,
      });

    return {
      success: true,
      message:
        'Department created successfully.',
      data: this.serialize(department),
    };
  }
    // ==========================
  // UPDATE
  // ==========================
  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const existing =
      await this.prisma.departments.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Department not found.',
      );
    }

    if (
      updateDepartmentDto.name &&
      updateDepartmentDto.name !== existing.name
    ) {
      const duplicate =
        await this.prisma.departments.findFirst({
          where: {
            name: updateDepartmentDto.name,
            id: {
              not: BigInt(id),
            },
            deleted_at: null,
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Department already exists.',
        );
      }
    }

    const department =
      await this.prisma.departments.update({
        where: {
          id: BigInt(id),
        },
        data: {
          ...updateDepartmentDto,
          updated_at: new Date(),
        },
      });

    return {
      success: true,
      message:
        'Department updated successfully.',
      data: this.serialize(department),
    };
  }

  // ==========================
  // SOFT DELETE
  // ==========================
  async remove(id: number) {
    const existing =
      await this.prisma.departments.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Department not found.',
      );
    }

    const department =
      await this.prisma.departments.update({
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
      message:
        'Department deleted successfully.',
      data: this.serialize(department),
    };
  }

  // ==========================
  // RESTORE
  // ==========================
  async restore(id: number) {
    const existing =
      await this.prisma.departments.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: {
            not: null,
          },
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Deleted department not found.',
      );
    }

    const department =
      await this.prisma.departments.update({
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
      message:
        'Department restored successfully.',
      data: this.serialize(department),
    };
  }

  // ==========================
  // STATISTICS
  // ==========================
  async getStats() {
    const totalDepartments =
      await this.prisma.departments.count({
        where: {
          deleted_at: null,
        },
      });

    const activeDepartments =
      await this.prisma.departments.count({
        where: {
          status: 'Active',
          deleted_at: null,
        },
      });

    const inactiveDepartments =
      await this.prisma.departments.count({
        where: {
          status: 'Inactive',
          deleted_at: null,
        },
      });

    return {
      success: true,
      data: {
        totalDepartments,
        activeDepartments,
        inactiveDepartments,
      },
    };
  }
}
