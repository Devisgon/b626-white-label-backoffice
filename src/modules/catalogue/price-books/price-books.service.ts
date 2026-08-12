import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePriceBookDto } from './dto/create-price-book.dto';
import { UpdatePriceBookDto } from './dto/update-price-book.dto';
import {
  AddPriceBookItemDto,
  UpdatePriceBookItemDto,
} from './dto/price-book-item.dto';

@Injectable()
export class PriceBooksService {
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
      throw new BadRequestException(
        `Invalid ID: ${value} must be a positive integer`,
      );
    }
    return BigInt(num);
  }

  // ==========================
  // GET ALL PRICE BOOKS
  // SEARCH + FILTER + OFFSET/CURSOR PAGINATION
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
    const where: Prisma.price_booksWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
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
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    if (cursor !== undefined && cursor !== null) {
      if (!Number.isInteger(cursor) || cursor <= 0) {
        throw new BadRequestException('Cursor must be a positive integer');
      }

      const cursorExists = await this.prisma.price_books.findFirst({
        where: { id: BigInt(cursor) },
        select: { id: true },
      });

      if (!cursorExists) {
        throw new BadRequestException('Invalid cursor: record does not exist');
      }

      const data = await this.prisma.price_books.findMany({
        where,
        cursor: { id: BigInt(cursor) },
        skip: 1,
        take: limit + 1,
        orderBy: { [validSortBy]: order },
        include: { _count: { select: { items: true } } },
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

    const totalRecords = await this.prisma.price_books.count({ where });
    const currentPage = page || 1;
    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.price_books.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [validSortBy]: order },
      include: { _count: { select: { items: true } } },
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
  // GET ONE (with items)
  // ==========================
  async findOne(id: number) {
    const validId = this.validateId(id);

    const priceBook = await this.prisma.price_books.findFirst({
      where: { id: validId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, barcode: true },
            },
          },
        },
      },
    });

    if (!priceBook) {
      throw new NotFoundException('Price book not found.');
    }

    return { success: true, data: this.serialize(priceBook) };
  }

  // ==========================
  // CREATE
  // ==========================
  async create(dto: CreatePriceBookDto) {
    const exists = await this.prisma.price_books.findFirst({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException(`Price book "${dto.name}" already exists.`);
    }

    const priceBook = await this.prisma.price_books.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? 'Active',
      } as any,
    });

    return {
      success: true,
      message: 'Price book created successfully.',
      data: this.serialize(priceBook),
    };
  }

  // ==========================
  // UPDATE
  // ==========================
  async update(id: number, dto: UpdatePriceBookDto) {
    const validId = this.validateId(id);

    const existing = await this.prisma.price_books.findFirst({
      where: { id: validId },
    });

    if (!existing) {
      throw new NotFoundException('Price book not found.');
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.price_books.findFirst({
        where: { name: dto.name, id: { not: validId } },
      });

      if (duplicate) {
        throw new ConflictException(`Price book "${dto.name}" already exists.`);
      }
    }

    const priceBook = await this.prisma.price_books.update({
      where: { id: validId },
      data: { ...dto },
    });

    return {
      success: true,
      message: 'Price book updated successfully.',
      data: this.serialize(priceBook),
    };
  }

  // ==========================
  // DELETE (hard delete — schema has no soft-delete column for price books)
  // ==========================
  async remove(id: number) {
    const validId = this.validateId(id);

    const existing = await this.prisma.price_books.findFirst({
      where: { id: validId },
    });

    if (!existing) {
      throw new NotFoundException('Price book not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.price_book_items.deleteMany({
        where: { price_book_id: validId },
      });
      await tx.price_books.delete({ where: { id: validId } });
    });

    return {
      success: true,
      message: 'Price book deleted successfully.',
    };
  }

  // ==========================
  // ADD ITEM
  // ==========================
  async addItem(priceBookId: number, dto: AddPriceBookItemDto) {
    const validPriceBookId = this.validateId(priceBookId);
    const validProductId = this.validateId(dto.product_id);

    const priceBook = await this.prisma.price_books.findFirst({
      where: { id: validPriceBookId },
    });

    if (!priceBook) {
      throw new NotFoundException('Price book not found.');
    }

    const product = await this.prisma.products.findFirst({
      where: { id: validProductId, deleted_at: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const existingItem = await this.prisma.price_book_items.findFirst({
      where: { price_book_id: validPriceBookId, product_id: validProductId },
    });

    if (existingItem) {
      throw new ConflictException(
        'This product already has a price in this price book. Use update instead.',
      );
    }

    const item = await this.prisma.price_book_items.create({
      // tenant_id is injected automatically by the tenant-scoping Prisma
      // extension (see src/prisma/tenant-scoping.extension.ts)
      data: {
        price_book_id: validPriceBookId,
        product_id: validProductId,
        selling_price: dto.selling_price,
      } as any,
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      success: true,
      message: 'Item added to price book successfully.',
      data: this.serialize(item),
    };
  }

  // ==========================
  // UPDATE ITEM
  // ==========================
  async updateItem(
    priceBookId: number,
    itemId: number,
    dto: UpdatePriceBookItemDto,
  ) {
    const validPriceBookId = this.validateId(priceBookId);
    const validItemId = this.validateId(itemId);

    const item = await this.prisma.price_book_items.findFirst({
      where: { id: validItemId, price_book_id: validPriceBookId },
    });

    if (!item) {
      throw new NotFoundException('Price book item not found.');
    }

    const updated = await this.prisma.price_book_items.update({
      where: { id: validItemId },
      data: { ...dto },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      success: true,
      message: 'Price book item updated successfully.',
      data: this.serialize(updated),
    };
  }

  // ==========================
  // REMOVE ITEM
  // ==========================
  async removeItem(priceBookId: number, itemId: number) {
    const validPriceBookId = this.validateId(priceBookId);
    const validItemId = this.validateId(itemId);

    const item = await this.prisma.price_book_items.findFirst({
      where: { id: validItemId, price_book_id: validPriceBookId },
    });

    if (!item) {
      throw new NotFoundException('Price book item not found.');
    }

    await this.prisma.price_book_items.delete({ where: { id: validItemId } });

    return {
      success: true,
      message: 'Item removed from price book successfully.',
    };
  }
}
