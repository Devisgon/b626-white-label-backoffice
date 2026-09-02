import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  // Auto-provisions a row (enabled by default) for every PaymentMethod
  // enum value the first time this tenant is queried — so the settings
  // screen always has all 4 rows to show/toggle, even for a tenant that
  // was created before this feature existed.
  async list(tenantId: string) {
    await this.prisma.$transaction(
      Object.values(PaymentMethod).map((method) =>
        this.prisma.paymentMethodConfig.upsert({
          where: { tenantId_method: { tenantId, method } },
          create: { tenantId, method, isEnabled: true },
          update: {},
        }),
      ),
    );

    return this.prisma.paymentMethodConfig.findMany({ where: { tenantId }, orderBy: { method: 'asc' } });
  }

  async setEnabled(tenantId: string, method: PaymentMethod, isEnabled: boolean) {
    return this.prisma.paymentMethodConfig.upsert({
      where: { tenantId_method: { tenantId, method } },
      create: { tenantId, method, isEnabled },
      update: { isEnabled },
    });
  }
}