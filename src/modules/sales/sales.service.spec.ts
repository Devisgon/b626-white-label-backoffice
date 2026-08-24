import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getRequestContext } from '../../common/context/request-context.store';

jest.mock('../../common/context/request-context.store', () => ({
  getRequestContext: jest.fn(),
}));

const mockGetRequestContext = getRequestContext as jest.Mock;

describe('SalesService', () => {
  let service: SalesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      products: { findMany: jest.fn() },
      product_inventory: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [SalesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SalesService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const baseDto = {
      customer_name: 'Ali Khan',
      payment_method: 'cash',
      items: [{ product_id: 37, quantity: 2 }],
    } as any;

    it('rejects the sale when no active location is selected', async () => {
      mockGetRequestContext.mockReturnValue({ tenantId: 'tenant-1', locationId: null });

      await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(baseDto)).rejects.toThrow(/active location/i);
    });

    it('rejects with a location-specific message when stock has no row for the active location', async () => {
      // Regression test for the shadowed-PrismaService bug: stock created
      // through a non-extended PrismaService instance ends up with
      // store_location_id/tenant_id = null, so it silently never matches
      // product_inventory.findMany scoped to the active location — every
      // quantity, even 1, reads as "unavailable".
      mockGetRequestContext.mockReturnValue({
        tenantId: 'tenant-1',
        locationId: 'c8ff49f6-421b-48de-a36e-4abbc337a1c2',
      });

      prisma.products.findMany.mockResolvedValue([
        { id: BigInt(37), name: 'Coca Cola 500ml', sku: 'CC-500', barcode: null, retail_price: 150, tax: 0, status: 'Active' },
      ]);
      prisma.product_inventory.findMany.mockResolvedValue([]);

      await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(baseDto)).rejects.toThrow(/no stock recorded for your active location/i);
    });

    it('completes the sale and deducts stock when a matching row exists', async () => {
      mockGetRequestContext.mockReturnValue({
        tenantId: 'tenant-1',
        locationId: 'c8ff49f6-421b-48de-a36e-4abbc337a1c2',
      });

      prisma.products.findMany.mockResolvedValue([
        { id: BigInt(37), name: 'Coca Cola 500ml', sku: 'CC-500', barcode: null, retail_price: 150, tax: 0, status: 'Active' },
      ]);
      prisma.product_inventory.findMany.mockResolvedValue([
        { id: BigInt(4), product_id: BigInt(37), location_id: BigInt(4), on_hand_quantity: 100, reserved_quantity: 0 },
      ]);

      const mockTx = {
        sale: { create: jest.fn().mockResolvedValue({ id: 'sale-uuid', items: [] }) },
        product_inventory: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.create(baseDto);

      expect(result.success).toBe(true);
      expect(mockTx.product_inventory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: BigInt(4) }),
          data: { on_hand_quantity: { decrement: 2 } },
        }),
      );
    });
  });
});