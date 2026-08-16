import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCartonMappingDto } from './dto/create-carton-mapping.dto';
import { UpdateCartonMappingDto } from './dto/update-carton-mapping.dto';

@Injectable()
export class CartonMappingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private validateId(value: any): bigint {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new BadRequestException(`Invalid ID: ${value} must be a positive integer`);
    }
    return BigInt(num);
  }

  private async findActiveProductOrFail(id: bigint, label: string) {
    const product = await this.prisma.products.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`${label} product not found.`);
    }

    return product;
  }

  // ==========================
  // GET ALL (optionally filtered by carton parent product)
  // ==========================
  async findAll(cartonProductId?: number, page = 1, limit = 10) {
    const where = cartonProductId
      ? { carton_product_id: BigInt(cartonProductId) }
      : {};

    const totalRecords = await this.prisma.carton_mappings.count({ where });
    const skip = (page - 1) * limit;

    const data = await this.prisma.carton_mappings.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        carton: { select: { id: true, name: true, sku: true } },
        child: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      success: true,
      pagination: {
        page,
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
    const validId = this.validateId(id);

    const mapping = await this.prisma.carton_mappings.findFirst({
      where: { id: validId },
      include: {
        carton: { select: { id: true, name: true, sku: true } },
        child: { select: { id: true, name: true, sku: true } },
      },
    });

    if (!mapping) {
      throw new NotFoundException('Carton mapping not found.');
    }

    return { success: true, data: this.serialize(mapping) };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(dto: CreateCartonMappingDto) {
    if (dto.carton_product_id === dto.child_product_id) {
      throw new BadRequestException('A product cannot be mapped as a carton of itself.');
    }

    const cartonId = this.validateId(dto.carton_product_id);
    const childId = this.validateId(dto.child_product_id);

    await this.findActiveProductOrFail(cartonId, 'Carton');
    await this.findActiveProductOrFail(childId, 'Child');

    const duplicate = await this.prisma.carton_mappings.findFirst({
      where: { carton_product_id: cartonId, child_product_id: childId },
    });

    if (duplicate) {
      throw new ConflictException(
        'A carton mapping already exists for this carton/child product pair.',
      );
    }

    const mapping = await this.prisma.carton_mappings.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        carton_product_id: cartonId,
        child_product_id: childId,
        quantity: dto.quantity,
      } as any,
      include: {
        carton: { select: { id: true, name: true, sku: true } },
        child: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      success: true,
      message: 'Carton mapping created successfully.',
      data: this.serialize(mapping),
    };
  }

  // ==========================
  // UPDATE (quantity only — parent/child pair is immutable, create a new mapping instead)
  // ==========================
  async update(id: number, dto: UpdateCartonMappingDto) {
    const validId = this.validateId(id);

    const existing = await this.prisma.carton_mappings.findFirst({
      where: { id: validId },
    });

    if (!existing) {
      throw new NotFoundException('Carton mapping not found.');
    }

    const updated = await this.prisma.carton_mappings.update({
      where: { id: validId },
      data: { ...dto },
      include: {
        carton: { select: { id: true, name: true, sku: true } },
        child: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      success: true,
      message: 'Carton mapping updated successfully.',
      data: this.serialize(updated),
    };
  }

  // ==========================
  // DELETE (hard delete — schema has no soft-delete column for carton mappings)
  // ==========================
  async remove(id: number) {
    const validId = this.validateId(id);

    const existing = await this.prisma.carton_mappings.findFirst({
      where: { id: validId },
    });

    if (!existing) {
      throw new NotFoundException('Carton mapping not found.');
    }

    await this.prisma.carton_mappings.delete({ where: { id: validId } });

    return { success: true, message: 'Carton mapping deleted successfully.' };
  }
}
