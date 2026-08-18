import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { getRequestContext } from '../../common/context/request-context.store';

import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesQueryDto } from './dto/sales-query.dto';
import { RefundSaleDto } from './dto/refund-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // SERIALIZATION
  // ============================================================

  private serialize(data: any) {
    return JSON.parse(
      JSON.stringify(data, (_, value) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }

        if (
          value &&
          typeof value === 'object' &&
          typeof value.toNumber === 'function'
        ) {
          return value.toNumber();
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        return value;
      }),
    );
  }

  // ============================================================
  // VALIDATION HELPERS
  // ============================================================

  private validateId(value: any, field = 'ID'): bigint {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(`Invalid ${field}: ${value}`);
    }

    return BigInt(id);
  }

  private generateSaleNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `SALE-${timestamp}-${random}`;
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer.');
    }
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // ============================================================
  // CREATE SALE
  // ============================================================
  //
  // Stock model note: a product's stock lives in `product_inventory`,
  // one row per (product_id, inventory_location_id) warehouse. A single
  // sale line is fulfilled from ONE warehouse row (the first one found
  // with enough on_hand_quantity) rather than being split across
  // several warehouses — keeps refunds unambiguous, since each
  // sale_item remembers exactly which warehouse it came from via
  // `inventory_location_id`. If nobody has enough in one place, the
  // sale is rejected rather than partially fulfilled.

  async create(dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one product is required.');
    }

    const ctx = getRequestContext();
    if (!ctx.locationId) {
      throw new BadRequestException(
        'Select an active location first (POST /auth/active-location) before recording a sale.',
      );
    }

    // ----------------------------------------------------------
    // Validate incoming items
    // ----------------------------------------------------------

    const productIds = dto.items.map((item) => {
      this.validateQuantity(item.quantity);
      return this.validateId(item.product_id, 'product ID');
    });

    const uniqueProductIds = [
      ...new Set(productIds.map((id) => id.toString())),
    ].map((id) => BigInt(id));

    // ----------------------------------------------------------
    // Fetch products (tenant-scoped automatically)
    // ----------------------------------------------------------

    const products = await this.prisma.products.findMany({
      where: {
        id: { in: uniqueProductIds },
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        retail_price: true,
        tax: true,
        status: true,
      },
    });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = new Set(products.map((p) => p.id.toString()));
      const missingIds = uniqueProductIds
        .filter((id) => !foundIds.has(id.toString()))
        .map((id) => id.toString());

      throw new NotFoundException(
        `Product(s) not found: ${missingIds.join(', ')}`,
      );
    }

    const inactiveProduct = products.find(
      (product) =>
        product.status &&
        !['active', 'Active', 'ACTIVE'].includes(product.status),
    );

    if (inactiveProduct) {
      throw new BadRequestException(
        `Product ${inactiveProduct.id} is not active.`,
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id.toString(), product]),
    );

    // ----------------------------------------------------------
    // Fetch stock (tenant + active-location scoped automatically)
    // ----------------------------------------------------------

    const stockRows = await this.prisma.product_inventory.findMany({
      where: {
        product_id: { in: uniqueProductIds },
        deleted_at: null,
      },
      orderBy: { id: 'asc' },
    });

    const stockByProduct = new Map<string, typeof stockRows>();
    for (const row of stockRows) {
      const key = row.product_id.toString();
      if (!stockByProduct.has(key)) stockByProduct.set(key, []);
      stockByProduct.get(key)!.push(row);
    }

    // ----------------------------------------------------------
    // Build sale items — validate stock + per-item discount
    // ----------------------------------------------------------

    let subtotal = 0;
    const stockDeductions: {
      inventoryRowId: bigint;
      quantity: number;
    }[] = [];
    const insufficientStock: string[] = [];

    const saleItems = dto.items.map((item) => {
      const productId = this.validateId(item.product_id, 'product ID');
      const product = productMap.get(productId.toString());

      if (!product) {
        throw new NotFoundException(`Product ${item.product_id} not found.`);
      }

      const unitPrice = Number(product.retail_price ?? 0);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(
          `Invalid retail price for product ${product.id}.`,
        );
      }

      const grossLineTotal = this.roundMoney(unitPrice * item.quantity);
      const itemDiscount = this.roundMoney(Number(item.discount ?? 0));

      if (!Number.isFinite(itemDiscount) || itemDiscount < 0) {
        throw new BadRequestException(
          `Invalid discount for product ${product.id}.`,
        );
      }

      if (itemDiscount > grossLineTotal) {
        throw new BadRequestException(
          `Discount for product ${product.id} cannot exceed its line total (${grossLineTotal}).`,
        );
      }

      const lineTotal = this.roundMoney(grossLineTotal - itemDiscount);
      subtotal += lineTotal;

      // Pick the first warehouse row with enough on-hand stock.
      const candidates = stockByProduct.get(productId.toString()) ?? [];
      const stockRow = candidates.find(
        (row) => row.on_hand_quantity - row.reserved_quantity >= item.quantity,
      );

      if (!stockRow) {
        const label = product.name ?? product.id;

        if (candidates.length === 0) {
          // `product_inventory` is store-scoped (see tenant-scoping.extension.ts):
          // this product has ZERO stock rows under the caller's current active
          // location — either stock was never added for this location, or it
          // was added while a DIFFERENT location was active. This is distinct
          // from "not enough units" and is the most common cause of every
          // quantity (even 1) reading as unavailable.
          insufficientStock.push(
            `${label} — no stock recorded for your active location ` +
              `(activeLocationId: ${ctx.locationId}). Check that stock was ` +
              `added while THIS location was active, not a different one.`,
          );
        } else {
          const totalAvailable = candidates.reduce(
            (sum, row) => sum + (row.on_hand_quantity - row.reserved_quantity),
            0,
          );
          insufficientStock.push(
            `${label} (need ${item.quantity}, only ${totalAvailable} available at your active location)`,
          );
        }

        return null as any;
      }

      stockDeductions.push({
        inventoryRowId: stockRow.id,
        quantity: item.quantity,
      });

      return {
        product_id: product.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount: itemDiscount,
        tax: 0,
        total: lineTotal,
        inventory_location_id: stockRow.location_id,
      };
    });

    if (insufficientStock.length > 0) {
      throw new BadRequestException(
        `Insufficient stock for: ${insufficientStock.join(', ')}.`,
      );
    }

    subtotal = this.roundMoney(subtotal);

    // ----------------------------------------------------------
    // Sale-level tax and discount
    // ----------------------------------------------------------

    const tax = this.roundMoney(Number(dto.tax ?? 0));
    const discount = this.roundMoney(Number(dto.discount ?? 0));

    if (!Number.isFinite(tax)) {
      throw new BadRequestException('Tax must be a valid number.');
    }
    if (!Number.isFinite(discount)) {
      throw new BadRequestException('Discount must be a valid number.');
    }
    if (tax < 0) {
      throw new BadRequestException('Tax cannot be negative.');
    }
    if (discount < 0) {
      throw new BadRequestException('Discount cannot be negative.');
    }
    if (discount > subtotal) {
      throw new BadRequestException(
        'Discount cannot be greater than subtotal.',
      );
    }

    const total = this.roundMoney(subtotal + tax - discount);
    if (total < 0) {
      throw new BadRequestException('Sale total cannot be negative.');
    }

    const saleNumber = this.generateSaleNumber();

    // ----------------------------------------------------------
    // Create sale + deduct stock atomically
    // ----------------------------------------------------------

    const sale = await this.prisma.$transaction(
      async (tx) => {
        const createdSale = await tx.sale.create({
          data: {
            sale_number: saleNumber,
            customer_name: dto.customer_name ?? null,
            customer_phone: dto.customer_phone ?? null,
            subtotal,
            tax,
            discount,
            total,
            status: 'completed',
            payment_method: dto.payment_method ?? 'cash',
            items: { create: saleItems },
          },
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

        // Deduct stock. Re-checked with a conditional update (on_hand_quantity
        // must still be >= requested) so a concurrent sale can't oversell
        // between the read above and this write.
        for (const deduction of stockDeductions) {
          const result = await tx.product_inventory.updateMany({
            where: {
              id: deduction.inventoryRowId,
              on_hand_quantity: { gte: deduction.quantity },
            },
            data: {
              on_hand_quantity: { decrement: deduction.quantity },
            },
          });

          if (result.count === 0) {
            throw new ConflictException(
              'Stock changed while processing this sale — please retry.',
            );
          }
        }

        return createdSale;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return {
      success: true,
      message: 'Sale created successfully.',
      data: this.serialize(sale),
    };
  }

  // ============================================================
  // GET ALL SALES
  // ============================================================

  async findAll(query: SalesQueryDto) {
    const { search, status, payment_method, page = 1, limit = 10 } = query;

    const where: any = { deleted_at: null };

    if (search?.trim()) {
      const searchValue = search.trim();
      where.OR = [
        { sale_number: { contains: searchValue, mode: 'insensitive' } },
        { customer_name: { contains: searchValue, mode: 'insensitive' } },
        { customer_phone: { contains: searchValue, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (payment_method) where.payment_method = payment_method;

    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const currentLimit =
      Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const skip = (currentPage - 1) * currentLimit;

    const [totalRecords, data] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        skip,
        take: currentLimit,
        orderBy: { created_at: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / currentLimit),
      },
      data: this.serialize(data),
    };
  }

  // ============================================================
  // GET ONE SALE
  // ============================================================

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id, deleted_at: null },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                retail_price: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }

    return { success: true, data: this.serialize(sale) };
  }

  // ============================================================
  // SALES STATISTICS
  // ============================================================

  async getStats() {
    const [
      totalSales,
      completedSales,
      cancelledSales,
      revenue,
      discounts,
      tax,
      refunded,
      averageSale,
    ] = await Promise.all([
      this.prisma.sale.count({ where: { deleted_at: null } }),
      this.prisma.sale.count({
        where: { status: 'completed', deleted_at: null },
      }),
      this.prisma.sale.count({
        where: { status: 'cancelled', deleted_at: null },
      }),
      this.prisma.sale.aggregate({
        where: { deleted_at: null },
        _sum: { total: true },
      }),
      this.prisma.sale.aggregate({
        where: { deleted_at: null },
        _sum: { discount: true },
      }),
      this.prisma.sale.aggregate({
        where: { deleted_at: null },
        _sum: { tax: true },
      }),
      this.prisma.sale.aggregate({
        where: { deleted_at: null },
        _sum: { refunded_amount: true },
      }),
      this.prisma.sale.aggregate({
        where: { status: 'completed', deleted_at: null },
        _avg: { total: true },
      }),
    ]);

    return {
      success: true,
      data: {
        total_sales: totalSales,
        completed_sales: completedSales,
        cancelled_sales: cancelledSales,
        total_revenue: Number(revenue._sum.total ?? 0),
        total_discount: Number(discounts._sum.discount ?? 0),
        total_tax: Number(tax._sum.tax ?? 0),
        total_refunded: Number(refunded._sum.refunded_amount ?? 0),
        average_sale_value: Number(averageSale._avg.total ?? 0),
      },
    };
  }

  // ============================================================
  // UPDATE SALE
  // ============================================================

  async update(id: string, dto: UpdateSaleDto) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const existing = await this.prisma.sale.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Sale not found.');
    }

    if (existing.status === 'completed') {
      throw new ConflictException(
        'Completed sales cannot be edited. Create a reversal or refund instead.',
      );
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        customer_name: dto.customer_name ?? existing.customer_name,
        customer_phone: dto.customer_phone ?? existing.customer_phone,
        payment_method: dto.payment_method ?? existing.payment_method,
      },
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

    return {
      success: true,
      message: 'Sale updated successfully.',
      data: this.serialize(updated),
    };
  }

  // ============================================================
  // SOFT DELETE / CANCEL SALE
  // ============================================================

  async remove(id: string) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const existing = await this.prisma.sale.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Sale not found.');
    }

    if (existing.status === 'completed') {
      throw new ConflictException(
        'Completed sales cannot be deleted directly. Create a reversal or refund instead.',
      );
    }

    await this.prisma.sale.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'cancelled' },
    });

    return { success: true, message: 'Sale cancelled successfully.' };
  }

  // ============================================================
  // RESTORE SALE
  // ============================================================

  async restore(id: string) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const existing = await this.prisma.sale.findFirst({
      where: { id, deleted_at: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Deleted sale not found.');
    }

    const restored = await this.prisma.sale.update({
      where: { id },
      data: { deleted_at: null, status: 'completed' },
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

    return {
      success: true,
      message: 'Sale restored successfully.',
      data: this.serialize(restored),
    };
  }

  // ============================================================
  // REFUND / RETURN
  // ============================================================
  //
  // Restocks whichever warehouse (`inventory_location_id`) each line was
  // originally deducted from, so partial refunds stay accurate even when
  // a product is stocked in more than one warehouse. Omitting `items`
  // refunds every unit still outstanding on the sale.

  async refund(id: string, dto: RefundSaleDto) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id, deleted_at: null },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }

    if (!['completed', 'partially_refunded'].includes(sale.status)) {
      throw new ConflictException(
        `Sale with status "${sale.status}" cannot be refunded.`,
      );
    }

    // Resolve which lines to refund and how much.
    const refundPlan = new Map<string, number>(); // sale_item.id -> qty

    if (dto.items && dto.items.length > 0) {
      for (const requested of dto.items) {
        const line = sale.items.find(
          (i) => i.id === BigInt(requested.sale_item_id),
        );

        if (!line) {
          throw new NotFoundException(
            `Sale item ${requested.sale_item_id} not found on this sale.`,
          );
        }

        const remaining = line.quantity - line.refunded_quantity;
        if (requested.quantity > remaining) {
          throw new BadRequestException(
            `Cannot refund ${requested.quantity} of item ${requested.sale_item_id} — only ${remaining} unit(s) remain unrefunded.`,
          );
        }

        refundPlan.set(line.id.toString(), requested.quantity);
      }
    } else {
      // Full refund: every remaining unit on every line.
      for (const line of sale.items) {
        const remaining = line.quantity - line.refunded_quantity;
        if (remaining > 0) {
          refundPlan.set(line.id.toString(), remaining);
        }
      }
    }

    if (refundPlan.size === 0) {
      throw new BadRequestException('Nothing left to refund on this sale.');
    }

    let refundAmount = 0;
    const lineUpdates: { id: bigint; newRefundedQty: number }[] = [];
    const stockRestocks: {
      inventoryLocationId: bigint | null;
      productId: bigint;
      quantity: number;
    }[] = [];

    for (const line of sale.items) {
      const refundQty = refundPlan.get(line.id.toString());
      if (!refundQty) continue;

      const perUnitValue = this.roundMoney(Number(line.total) / line.quantity);
      refundAmount = this.roundMoney(refundAmount + perUnitValue * refundQty);

      lineUpdates.push({
        id: line.id,
        newRefundedQty: line.refunded_quantity + refundQty,
      });

      stockRestocks.push({
        inventoryLocationId: line.inventory_location_id,
        productId: line.product_id,
        quantity: refundQty,
      });
    }

    const newRefundedTotal = this.roundMoney(
      Number(sale.refunded_amount) + refundAmount,
    );
    const fullyRefunded = newRefundedTotal >= Number(sale.total);

    const updatedSale = await this.prisma.$transaction(async (tx) => {
      for (const lineUpdate of lineUpdates) {
        await tx.sale_items.update({
          where: { id: lineUpdate.id },
          data: { refunded_quantity: lineUpdate.newRefundedQty },
        });
      }

      for (const restock of stockRestocks) {
        if (restock.inventoryLocationId === null) continue;

        await tx.product_inventory.updateMany({
          where: {
            product_id: restock.productId,
            location_id: restock.inventoryLocationId,
          },
          data: { on_hand_quantity: { increment: restock.quantity } },
        });
      }

      return tx.sale.update({
        where: { id },
        data: {
          refunded_amount: newRefundedTotal,
          status: fullyRefunded ? 'refunded' : 'partially_refunded',
        },
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
    });

    return {
      success: true,
      message: fullyRefunded
        ? 'Sale fully refunded.'
        : 'Partial refund processed.',
      data: this.serialize(updatedSale),
    };
  }

  // ============================================================
  // RECEIPT / INVOICE
  // ============================================================

  async getReceipt(id: string) {
    if (!id) {
      throw new BadRequestException('Sale ID is required.');
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id, deleted_at: null },
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

    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }

    const [tenant, location] = await Promise.all([
      sale.tenant_id
        ? this.prisma.tenant.findUnique({
            where: { id: sale.tenant_id },
            select: { name: true },
          })
        : null,
      sale.store_location_id
        ? this.prisma.location.findUnique({
            where: { id: sale.store_location_id },
            select: { name: true, address: true },
          })
        : null,
    ]);

    const receipt = {
      sale_number: sale.sale_number,
      issued_at: sale.created_at,
      business_name: tenant?.name ?? null,
      location_name: location?.name ?? null,
      location_address: location?.address ?? null,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone,
      payment_method: sale.payment_method,
      status: sale.status,
      line_items: sale.items.map((item) => ({
        product_name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount: Number(item.discount),
        line_total: Number(item.total),
        refunded_quantity: item.refunded_quantity,
      })),
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      total: Number(sale.total),
      refunded_amount: Number(sale.refunded_amount),
      net_total: this.roundMoney(
        Number(sale.total) - Number(sale.refunded_amount),
      ),
    };

    return { success: true, data: this.serialize(receipt) };
  }
}
