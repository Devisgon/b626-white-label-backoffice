import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductAuditService } from '../product-audit/product-audit.service';
import { UpdateProductDto } from './dto/update-product.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productAuditService: ProductAuditService,
  ) {}

  // ==========================
  // HELPER: Serialize BigInt
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
  // HELPER: Validate and convert to BigInt
  // ==========================
  private validateAndConvertToBigInt(value: any): bigint {
    if (value === null || value === undefined) {
      throw new BadRequestException('Invalid ID: value is null or undefined');
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new BadRequestException(
        `Invalid ID: ${value} must be a positive integer`,
      );
    }

    return BigInt(num);
  }

  // ==========================
  // HELPER: Safely parse numeric values
  // ==========================
  private safeParseFloat(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return null;
    }

    return num;
  }

  private safeParseInt(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      return null;
    }

    return num;
  }

  // ==========================
  // HELPER: Parse boolean from CSV
  // ==========================
  private parseBoolean(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const str = String(value).trim().toLowerCase();
    return ['true', '1', 'yes'].includes(str);
  }

  // ==========================
  // HELPER: Validate tax rate
  // ==========================
  private validateTaxRate(tax: number | null): number | null {
    if (tax === null) return null;

    if (tax < 0 || tax > 100) {
      throw new BadRequestException(
        `Tax rate must be between 0 and 100: ${tax}`,
      );
    }

    return tax;
  }

  // ==========================
  // HELPER: Validate stock values
  // ==========================
  private validateStockValues(
    minStock: number | null | undefined,
    maxStock: number | null | undefined,
  ): void {
    if (
      minStock !== null &&
      minStock !== undefined &&
      maxStock !== null &&
      maxStock !== undefined &&
      minStock > maxStock
    ) {
      throw new BadRequestException(
        `Minimum stock (${minStock}) cannot exceed maximum stock (${maxStock})`,
      );
    }
  }

  // ==========================
  // HELPER: Check unique fields with race-condition safety
  // ==========================
  private async checkUniqueFields(
    tx: Prisma.TransactionClient,
    sku?: string,
    itemCode?: string,
    barcode?: string,
    excludeId?: bigint,
    pluCode?: string,
  ): Promise<void> {
    const whereCondition = excludeId ? { id: { not: excludeId } } : {};

    if (sku) {
      const exists = await tx.products.findFirst({
        where: {
          sku,
          deleted_at: null,
          ...whereCondition,
        },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`SKU "${sku}" already exists.`);
      }
    }

    if (itemCode) {
      const exists = await tx.products.findFirst({
        where: {
          item_code: itemCode,
          deleted_at: null,
          ...whereCondition,
        },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Item Code "${itemCode}" already exists.`);
      }
    }

    if (barcode) {
      const exists = await tx.products.findFirst({
        where: {
          barcode,
          deleted_at: null,
          ...whereCondition,
        },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Barcode "${barcode}" already exists.`);
      }
    }

    if (pluCode) {
      const exists = await tx.products.findFirst({
        where: {
          plu_code: pluCode,
          deleted_at: null,
          ...whereCondition,
        },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`PLU Code "${pluCode}" already exists.`);
      }
    }
  }

  // ==========================
  // GET ALL PRODUCTS
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
    categoryId?: number,
    brandId?: number,
    supplierId?: number,
    departmentId?: number,
    saleType?: string,
    inventoryTracking?: boolean,
  ) {
    const where: Prisma.productsWhereInput = {
      deleted_at: null,
    };

    // SEARCH
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          item_code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          barcode: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // STATUS FILTER
    if (status) {
      where.status = status;
    }

    // CATEGORY / BRAND / SUPPLIER / DEPARTMENT FILTERS
    if (categoryId !== undefined) {
      where.category_id = BigInt(categoryId);
    }

    if (brandId !== undefined) {
      where.brand_id = BigInt(brandId);
    }

    if (supplierId !== undefined) {
      where.supplier_id = BigInt(supplierId);
    }

    if (departmentId !== undefined) {
      where.department_id = BigInt(departmentId);
    }

    // SALE TYPE FILTER
    if (saleType) {
      where.sale_type = saleType;
    }

    // INVENTORY TRACKING FILTER
    if (inventoryTracking !== undefined) {
      where.inventory_tracking = inventoryTracking;
    }

    const allowedSortFields = [
      'id',
      'name',
      'sku',
      'item_code',
      'barcode',
      'status',
      'created_at',
      'updated_at',
    ];

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    // CURSOR PAGINATION
    if (cursor !== undefined && cursor !== null) {
      // Validate cursor is a positive integer
      if (!Number.isInteger(cursor) || cursor <= 0) {
        throw new BadRequestException('Cursor must be a positive integer');
      }

      // Verify cursor exists
      const cursorExists = await this.prisma.products.findFirst({
        where: {
          id: BigInt(cursor),
          deleted_at: null,
        },
        select: { id: true },
      });

      if (!cursorExists) {
        throw new BadRequestException('Invalid cursor: record does not exist');
      }

      const data = await this.prisma.products.findMany({
        where,

        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },

          suppliers: {
            select: {
              id: true,
              name: true,
            },
          },

          brands: {
            select: {
              id: true,
              name: true,
            },
          },

          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        cursor: {
          id: BigInt(cursor),
        },

        skip: 1,

        take: limit + 1,

        orderBy: {
          [validSortBy]: order,
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

    // OFFSET PAGINATION
    const totalRecords = await this.prisma.products.count({
      where,
    });

    const currentPage = page || 1;

    const skip = (currentPage - 1) * limit;

    const data = await this.prisma.products.findMany({
      where,

      include: {
        categories: {
          select: {
            id: true,
            name: true,
          },
        },

        suppliers: {
          select: {
            id: true,
            name: true,
          },
        },

        brands: {
          select: {
            id: true,
            name: true,
          },
        },

        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      skip,

      take: limit,

      orderBy: {
        [validSortBy]: order,
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
  // GET PRODUCT BY ID
  // ==========================
  async findOne(id: number) {
    const validId = this.validateAndConvertToBigInt(id);

    const data = await this.prisma.products.findFirst({
      where: {
        id: validId,
        deleted_at: null,
      },

      include: {
        categories: {
          select: {
            id: true,
            name: true,
          },
        },

        suppliers: {
          select: {
            id: true,
            name: true,
          },
        },

        brands: {
          select: {
            id: true,
            name: true,
          },
        },

        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!data) {
      throw new NotFoundException('Product not found.');
    }

    return {
      success: true,
      data: this.serialize(data),
    };
  }

  // ==========================
  // CREATE PRODUCT
  // ==========================
  async create(createProductDto: CreateProductDto) {
    // Validate stock values
    this.validateStockValues(
      createProductDto.minimum_stock,
      createProductDto.maximum_stock,
    );

    // SKU VALIDATION
    if (createProductDto.sku) {
      const skuExists = await this.prisma.products.findFirst({
        where: {
          sku: createProductDto.sku,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (skuExists) {
        throw new ConflictException('SKU already exists.');
      }
    }

    // ITEM CODE VALIDATION
    if (createProductDto.item_code) {
      const itemCodeExists = await this.prisma.products.findFirst({
        where: {
          item_code: createProductDto.item_code,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (itemCodeExists) {
        throw new ConflictException('Item Code already exists.');
      }
    }

    // BARCODE VALIDATION
    if (createProductDto.barcode) {
      const barcodeExists = await this.prisma.products.findFirst({
        where: {
          barcode: createProductDto.barcode,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (barcodeExists) {
        throw new ConflictException('Barcode already exists.');
      }
    }

    // PLU CODE VALIDATION
    if (createProductDto.plu_code) {
      const pluExists = await this.prisma.products.findFirst({
        where: {
          plu_code: createProductDto.plu_code,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (pluExists) {
        throw new ConflictException('PLU Code already exists.');
      }
    }

    // CATEGORY VALIDATION
    if (createProductDto.category_id !== undefined) {
      const category = await this.prisma.categories.findFirst({
        where: {
          id: BigInt(createProductDto.category_id),
          deleted_at: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found.');
      }
    }

    // SUPPLIER VALIDATION
    if (createProductDto.supplier_id !== undefined) {
      const supplier = await this.prisma.suppliers.findFirst({
        where: {
          id: BigInt(createProductDto.supplier_id),
          deleted_at: null,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found.');
      }
    }

    // BRAND VALIDATION
    if (createProductDto.brand_id !== undefined) {
      const brand = await this.prisma.brands.findFirst({
        where: {
          id: BigInt(createProductDto.brand_id),
          deleted_at: null,
        },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found.');
      }
    }

    // DEPARTMENT VALIDATION
    let department: {
      id: bigint;
      default_tax_rate: any;
    } | null = null;
    if (createProductDto.department_id !== undefined) {
      department = await this.prisma.departments.findFirst({
        where: {
          id: BigInt(createProductDto.department_id),
          deleted_at: null,
        },
        select: {
          id: true,
          default_tax_rate: true,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found.');
      }
    }

    // Apply department default tax if tax is not provided
    if (
      department &&
      (createProductDto.tax === null || createProductDto.tax === undefined)
    ) {
      createProductDto.tax = department.default_tax_rate;
    }

    // Validate tax rate
    if (createProductDto.tax !== undefined && createProductDto.tax !== null) {
      this.validateTaxRate(createProductDto.tax);
    }

    // CREATE PRODUCT
    const data = await this.prisma.$transaction(async (tx) => {
      // Check duplicates inside transaction
      await this.checkUniqueFields(
        tx,
        createProductDto.sku,
        createProductDto.item_code,
        createProductDto.barcode,
        undefined,
        createProductDto.plu_code,
      );

      const product = await tx.products.create({
        // tenant_id is injected automatically by the tenant-scoping
        // Prisma extension (see src/prisma/tenant-scoping.extension.ts)
        data: {
          ...createProductDto,

          category_id:
            createProductDto.category_id !== undefined
              ? BigInt(createProductDto.category_id)
              : undefined,

          supplier_id:
            createProductDto.supplier_id !== undefined
              ? BigInt(createProductDto.supplier_id)
              : undefined,

          brand_id:
            createProductDto.brand_id !== undefined
              ? BigInt(createProductDto.brand_id)
              : undefined,

          department_id:
            createProductDto.department_id !== undefined
              ? BigInt(createProductDto.department_id)
              : undefined,

          created_at: new Date(),
          updated_at: new Date(),
        } as any,

        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },

          suppliers: {
            select: {
              id: true,
              name: true,
            },
          },

          brands: {
            select: {
              id: true,
              name: true,
            },
          },

          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // AUDIT LOG
      await this.productAuditService.log(
        {
          product_id: Number(product.id),
          action: 'CREATE',
          description: `Product "${product.name}" created.`,
          new_data: this.serialize(product),
          performed_by: null,
        },
        tx,
      );

      return product;
    });

    return {
      success: true,
      message: 'Product created successfully.',
      data: this.serialize(data),
    };
  }

  // ==========================
  // UPDATE PRODUCT
  // ==========================
  async update(id: number, updateProductDto: UpdateProductDto) {
    const validId = this.validateAndConvertToBigInt(id);

    // Validate stock values
    this.validateStockValues(
      updateProductDto.minimum_stock,
      updateProductDto.maximum_stock,
    );

    // FIND PRODUCT
    const existing = await this.prisma.products.findFirst({
      where: {
        id: validId,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found.');
    }

    // SKU VALIDATION
    if (updateProductDto.sku && updateProductDto.sku !== existing.sku) {
      const duplicate = await this.prisma.products.findFirst({
        where: {
          sku: updateProductDto.sku,
          id: {
            not: validId,
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('SKU already exists.');
      }
    }

    // ITEM CODE VALIDATION
    if (
      updateProductDto.item_code &&
      updateProductDto.item_code !== existing.item_code
    ) {
      const duplicate = await this.prisma.products.findFirst({
        where: {
          item_code: updateProductDto.item_code,
          id: {
            not: validId,
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('Item Code already exists.');
      }
    }

    // BARCODE VALIDATION
    if (
      updateProductDto.barcode &&
      updateProductDto.barcode !== existing.barcode
    ) {
      const duplicate = await this.prisma.products.findFirst({
        where: {
          barcode: updateProductDto.barcode,
          id: {
            not: validId,
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('Barcode already exists.');
      }
    }

    // PLU CODE VALIDATION
    if (
      updateProductDto.plu_code &&
      updateProductDto.plu_code !== existing.plu_code
    ) {
      const duplicate = await this.prisma.products.findFirst({
        where: {
          plu_code: updateProductDto.plu_code,
          id: {
            not: validId,
          },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException('PLU Code already exists.');
      }
    }

    // CATEGORY VALIDATION
    if (updateProductDto.category_id !== undefined) {
      const category = await this.prisma.categories.findFirst({
        where: {
          id: BigInt(updateProductDto.category_id),
          deleted_at: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found.');
      }
    }

    // SUPPLIER VALIDATION
    if (updateProductDto.supplier_id !== undefined) {
      const supplier = await this.prisma.suppliers.findFirst({
        where: {
          id: BigInt(updateProductDto.supplier_id),
          deleted_at: null,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found.');
      }
    }

    // BRAND VALIDATION
    if (updateProductDto.brand_id !== undefined) {
      const brand = await this.prisma.brands.findFirst({
        where: {
          id: BigInt(updateProductDto.brand_id),
          deleted_at: null,
        },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found.');
      }
    }

    // DEPARTMENT VALIDATION
    let department: {
      id: bigint;
      default_tax_rate: any;
    } | null = null;
    if (updateProductDto.department_id !== undefined) {
      department = await this.prisma.departments.findFirst({
        where: {
          id: BigInt(updateProductDto.department_id),
          deleted_at: null,
        },
        select: {
          id: true,
          default_tax_rate: true,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found.');
      }
    }

    // Apply department default tax if tax is not provided
    if (
      department &&
      (updateProductDto.tax === null || updateProductDto.tax === undefined)
    ) {
      updateProductDto.tax = department.default_tax_rate;
    }

    // Validate tax rate
    if (updateProductDto.tax !== undefined && updateProductDto.tax !== null) {
      this.validateTaxRate(updateProductDto.tax);
    }

    // UPDATE PRODUCT
    const product = await this.prisma.$transaction(async (tx) => {
      // Check duplicates inside transaction
      await this.checkUniqueFields(
        tx,
        updateProductDto.sku,
        updateProductDto.item_code,
        updateProductDto.barcode,
        validId,
        updateProductDto.plu_code,
      );

      const updated = await tx.products.update({
        where: {
          id: validId,
        },

        data: {
          ...updateProductDto,

          category_id:
            updateProductDto.category_id !== undefined
              ? BigInt(updateProductDto.category_id)
              : undefined,

          supplier_id:
            updateProductDto.supplier_id !== undefined
              ? BigInt(updateProductDto.supplier_id)
              : undefined,

          brand_id:
            updateProductDto.brand_id !== undefined
              ? BigInt(updateProductDto.brand_id)
              : undefined,

          department_id:
            updateProductDto.department_id !== undefined
              ? BigInt(updateProductDto.department_id)
              : undefined,

          updated_at: new Date(),
        },

        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },

          suppliers: {
            select: {
              id: true,
              name: true,
            },
          },

          brands: {
            select: {
              id: true,
              name: true,
            },
          },

          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // AUDIT LOG
      await this.productAuditService.log(
        {
          product_id: Number(updated.id),
          action: 'UPDATE',
          description: `Product "${updated.name}" updated.`,
          old_data: this.serialize(existing),
          new_data: this.serialize(updated),
          performed_by: null,
        },
        tx,
      );

      return updated;
    });

    return {
      success: true,
      message: 'Product updated successfully.',
      data: this.serialize(product),
    };
  }

  // ==========================
  // SOFT DELETE PRODUCT
  // ==========================
  async remove(id: number) {
    const validId = this.validateAndConvertToBigInt(id);

    // PRODUCT EXISTS?
    const existing = await this.prisma.products.findFirst({
      where: {
        id: validId,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found.');
    }

    const data = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.products.update({
        where: {
          id: validId,
        },
        data: {
          status: 'Inactive',
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Audit Log
      await this.productAuditService.log(
        {
          product_id: Number(deleted.id),
          action: 'DELETE',
          description: `Product "${existing.name}" soft deleted.`,
          old_data: this.serialize(existing),
          new_data: this.serialize(deleted),
          performed_by: null,
        },
        tx,
      );

      return deleted;
    });

    return {
      success: true,
      message: 'Product deleted successfully.',
      data: this.serialize(data),
    };
  }

  // ==========================
  // PRODUCT STATISTICS
  // ==========================
  async getStats() {
    const totalProducts = await this.prisma.products.count({
      where: {
        deleted_at: null,
      },
    });

    const activeProducts = await this.prisma.products.count({
      where: {
        status: 'Active',
        deleted_at: null,
      },
    });

    const inactiveProducts = await this.prisma.products.count({
      where: {
        status: 'Inactive',
        deleted_at: null,
      },
    });

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
      },
    };
  }

  // ==========================
  // PRODUCTS PER CATEGORY
  // ==========================
  async getCategorySummary() {
    // Optimized: Single query with groupBy instead of N+1 queries
    const categoryCounts = await this.prisma.products.groupBy({
      by: ['category_id'],
      where: {
        deleted_at: null,
        category_id: {
          not: null,
        },
      },
      _count: {
        category_id: true,
      },
    });

    const categoryIds = categoryCounts
      .map((item) => item.category_id)
      .filter((id): id is bigint => id !== null);

    if (categoryIds.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const categories = await this.prisma.categories.findMany({
      where: {
        id: {
          in: categoryIds,
        },
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      products:
        categoryCounts.find((c) => c.category_id === category.id)?._count
          .category_id || 0,
    }));

    return {
      success: true,
      data: this.serialize(result),
    };
  }

  // ==========================
  // RESTORE PRODUCT
  // ==========================
  async restore(id: number) {
    const validId = this.validateAndConvertToBigInt(id);

    // FIND DELETED PRODUCT
    const existing = await this.prisma.products.findFirst({
      where: {
        id: validId,
        deleted_at: {
          not: null,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Deleted product not found.');
    }

    // SKU CONFLICT CHECK
    if (existing.sku) {
      const duplicateSku = await this.prisma.products.findFirst({
        where: {
          sku: existing.sku,
          deleted_at: null,
          id: {
            not: validId,
          },
        },
      });

      if (duplicateSku) {
        throw new ConflictException(
          'Cannot restore product. SKU already exists.',
        );
      }
    }

    // ITEM CODE CONFLICT CHECK
    if (existing.item_code) {
      const duplicateItemCode = await this.prisma.products.findFirst({
        where: {
          item_code: existing.item_code,
          deleted_at: null,
          id: {
            not: validId,
          },
        },
      });

      if (duplicateItemCode) {
        throw new ConflictException(
          'Cannot restore product. Item Code already exists.',
        );
      }
    }

    // BARCODE CONFLICT CHECK
    if (existing.barcode) {
      const duplicateBarcode = await this.prisma.products.findFirst({
        where: {
          barcode: existing.barcode,
          deleted_at: null,
          id: {
            not: validId,
          },
        },
      });

      if (duplicateBarcode) {
        throw new ConflictException(
          'Cannot restore product. Barcode already exists.',
        );
      }
    }

    // PLU CODE CONFLICT CHECK
    if (existing.plu_code) {
      const duplicatePlu = await this.prisma.products.findFirst({
        where: {
          plu_code: existing.plu_code,
          deleted_at: null,
          id: {
            not: validId,
          },
        },
      });

      if (duplicatePlu) {
        throw new ConflictException(
          'Cannot restore product. PLU Code already exists.',
        );
      }
    }

    // RESTORE PRODUCT
    const product = await this.prisma.$transaction(async (tx) => {
      const restored = await tx.products.update({
        where: {
          id: validId,
        },

        data: {
          deleted_at: null,
          status: 'Active',
          updated_at: new Date(),
        },

        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },

          suppliers: {
            select: {
              id: true,
              name: true,
            },
          },

          brands: {
            select: {
              id: true,
              name: true,
            },
          },

          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // AUDIT LOG
      await this.productAuditService.log(
        {
          product_id: Number(restored.id),
          action: 'RESTORE',
          description: `Product "${restored.name}" restored.`,
          old_data: this.serialize(existing),
          new_data: this.serialize(restored),
          performed_by: null,
        },
        tx,
      );

      return restored;
    });

    return {
      success: true,
      message: 'Product restored successfully.',
      data: this.serialize(product),
    };
  }
  async findByBarcode(barcode: string) {
    const product = await this.prisma.products.findFirst({
      where: {
        barcode,
        deleted_at: null,
      },

      include: {
        categories: true,
        suppliers: true,
        brands: true,
        departments: true,
        inventories: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return {
      success: true,
      data: this.serialize(product),
    };
  }
  // ==========================
  // PRODUCT HISTORY
  // ==========================
  async getProductHistory(id: number) {
    const validId = this.validateAndConvertToBigInt(id);

    const data = await this.prisma.product_audit_logs.findMany({
      where: {
        product_id: validId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      success: true,
      data: this.serialize(data),
    };
  }

  // ==========================
  // IMPORT PRODUCTS CSV
  // ==========================
  async importProducts(file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('CSV file is required.');
    }

    // Parse CSV and create products
    const results: any[] = [];
    const bufferStream = Readable.from(file.buffer);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const createdProducts: any[] = [];
    const errors: { row: any; error: string }[] = [];

    for (const row of results) {
      try {
        // Validate required fields
        if (!row.name || !row.sku || !row.barcode || !row.category_id) {
          errors.push({
            row,
            error:
              'Missing required fields: name, sku, barcode, or category_id',
          });
          continue;
        }

        // Check SKU
        const skuExists = await this.prisma.products.findFirst({
          where: {
            sku: row.sku,
            deleted_at: null,
          },
          select: { id: true },
        });

        if (skuExists) {
          errors.push({
            row,
            error: `SKU "${row.sku}" already exists`,
          });
          continue;
        }

        // Check Barcode
        const barcodeExists = await this.prisma.products.findFirst({
          where: {
            barcode: row.barcode,
            deleted_at: null,
          },
          select: { id: true },
        });

        if (barcodeExists) {
          errors.push({
            row,
            error: `Barcode "${row.barcode}" already exists`,
          });
          continue;
        }

        // Check PLU Code
        if (row.plu_code) {
          const pluExists = await this.prisma.products.findFirst({
            where: {
              plu_code: row.plu_code,
              deleted_at: null,
            },
            select: { id: true },
          });

          if (pluExists) {
            errors.push({
              row,
              error: `PLU Code "${row.plu_code}" already exists`,
            });
            continue;
          }
        }

        // Check Item Code
        if (row.item_code) {
          const itemCodeExists = await this.prisma.products.findFirst({
            where: {
              item_code: row.item_code,
              deleted_at: null,
            },
            select: { id: true },
          });

          if (itemCodeExists) {
            errors.push({
              row,
              error: `Item Code "${row.item_code}" already exists`,
            });
            continue;
          }
        }

        // Check Category
        const category = await this.prisma.categories.findFirst({
          where: {
            id: BigInt(row.category_id),
            deleted_at: null,
          },
          select: { id: true },
        });

        if (!category) {
          errors.push({
            row,
            error: `Category ID "${row.category_id}" not found`,
          });
          continue;
        }

        // Check Supplier if provided
        if (row.supplier_id) {
          const supplier = await this.prisma.suppliers.findFirst({
            where: {
              id: BigInt(row.supplier_id),
              deleted_at: null,
            },
            select: { id: true },
          });

          if (!supplier) {
            errors.push({
              row,
              error: `Supplier ID "${row.supplier_id}" not found`,
            });
            continue;
          }
        }

        // Check Brand if provided
        if (row.brand_id) {
          const brand = await this.prisma.brands.findFirst({
            where: {
              id: BigInt(row.brand_id),
              deleted_at: null,
            },
            select: { id: true },
          });

          if (!brand) {
            errors.push({
              row,
              error: `Brand ID "${row.brand_id}" not found`,
            });
            continue;
          }
        }

        // Check Department if provided and get defaults
        let department: {
          id: bigint;
          default_tax_rate: any;
        } | null = null;
        if (row.department_id) {
          department = await this.prisma.departments.findFirst({
            where: {
              id: BigInt(row.department_id),
              deleted_at: null,
            },
            select: {
              id: true,
              default_tax_rate: true,
            },
          });

          if (!department) {
            errors.push({
              row,
              error: `Department ID "${row.department_id}" not found`,
            });
            continue;
          }
        }

        // Safely parse numeric values
        const retailPrice = this.safeParseFloat(row.retail_price);
        const cost = this.safeParseFloat(row.cost);
        let taxValue = this.safeParseFloat(row.tax);
        const minStock = this.safeParseInt(row.minimum_stock);
        const maxStock = this.safeParseInt(row.maximum_stock);

        // Validate numeric fields
        if (
          row.retail_price !== undefined &&
          row.retail_price !== '' &&
          retailPrice === null
        ) {
          errors.push({
            row,
            error: `Invalid retail_price: "${row.retail_price}" is not a valid number`,
          });
          continue;
        }

        if (row.cost !== undefined && row.cost !== '' && cost === null) {
          errors.push({
            row,
            error: `Invalid cost: "${row.cost}" is not a valid number`,
          });
          continue;
        }

        if (row.tax !== undefined && row.tax !== '' && taxValue === null) {
          errors.push({
            row,
            error: `Invalid tax: "${row.tax}" is not a valid number`,
          });
          continue;
        }

        if (
          row.minimum_stock !== undefined &&
          row.minimum_stock !== '' &&
          minStock === null
        ) {
          errors.push({
            row,
            error: `Invalid minimum_stock: "${row.minimum_stock}" is not a valid integer`,
          });
          continue;
        }

        if (
          row.maximum_stock !== undefined &&
          row.maximum_stock !== '' &&
          maxStock === null
        ) {
          errors.push({
            row,
            error: `Invalid maximum_stock: "${row.maximum_stock}" is not a valid integer`,
          });
          continue;
        }

        // Validate stock values
        if (minStock !== null && maxStock !== null && minStock > maxStock) {
          errors.push({
            row,
            error: `Minimum stock (${minStock}) cannot exceed maximum stock (${maxStock})`,
          });
          continue;
        }

        // Apply department defaults if department exists and tax not provided
        if (
          department &&
          (row.tax === null || row.tax === undefined || row.tax === '')
        ) {
          taxValue = department.default_tax_rate;
        }

        // Validate tax rate
        if (taxValue !== null) {
          if (taxValue < 0 || taxValue > 100) {
            errors.push({
              row,
              error: `Tax rate must be between 0 and 100: ${taxValue}`,
            });
            continue;
          }
        }

        // Create product
        const product = await this.prisma.$transaction(async (tx) => {
          // Check duplicates inside transaction
          await this.checkUniqueFields(
            tx,
            row.sku,
            row.item_code,
            row.barcode,
            undefined,
            row.plu_code,
          );

          const wholesalePrice = this.safeParseFloat(row.wholesale_price);
          const packSize = this.safeParseInt(row.pack_size);

          const created = await tx.products.create({
            // tenant_id is injected automatically by the tenant-scoping
            // Prisma extension (see src/prisma/tenant-scoping.extension.ts)
            data: {
              name: row.name,
              sku: row.sku,
              item_code: row.item_code || null,
              barcode: row.barcode,
              plu_code: row.plu_code || null,
              description: row.description || null,
              retail_price: retailPrice,
              wholesale_price: wholesalePrice,
              cost: cost,
              sale_type: row.sale_type || null,
              unit: row.unit || null,
              size: row.size || null,
              tax: taxValue,
              inventory_tracking: this.parseBoolean(row.inventory_tracking),
              minimum_stock: minStock,
              maximum_stock: maxStock,
              is_multi_pack: this.parseBoolean(row.is_multi_pack),
              pack_size: packSize,
              pack_type: row.pack_type || null,
              status: row.status || 'Active',
              category_id: BigInt(row.category_id),
              supplier_id: row.supplier_id ? BigInt(row.supplier_id) : null,
              brand_id: row.brand_id ? BigInt(row.brand_id) : null,
              department_id: row.department_id
                ? BigInt(row.department_id)
                : null,
              created_at: new Date(),
              updated_at: new Date(),
            } as any,

            include: {
              categories: {
                select: {
                  id: true,
                  name: true,
                },
              },

              suppliers: {
                select: {
                  id: true,
                  name: true,
                },
              },

              brands: {
                select: {
                  id: true,
                  name: true,
                },
              },

              departments: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Audit Log
          await this.productAuditService.log(
            {
              product_id: Number(created.id),
              action: 'CREATE',
              description: `Product "${created.name}" imported via CSV.`,
              new_data: this.serialize(created),
              performed_by: null,
            },
            tx,
          );

          return created;
        });

        createdProducts.push(product);
      } catch (error: any) {
        errors.push({
          row,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `CSV processed: ${createdProducts.length} products created, ${errors.length} errors.`,
      created: createdProducts.length,
      errors: errors.length,
      errorDetails: errors,
      data: this.serialize(createdProducts),
    };
  }
}
