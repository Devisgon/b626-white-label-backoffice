import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateReceiptSettingsDto } from './dto/update-receipt-settings.dto';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async get(tenantId: string) {
    const existing = await this.prisma.receiptSettings.findUnique({ where: { tenantId } });
    if (existing) return existing;

    return {
      tenantId,
      footerText: null,
      showLogo: true,
      invoicePrefix: 'INV-',
      updatedAt: null,
    };
  }

  async update(tenantId: string, dto: UpdateReceiptSettingsDto) {
    return this.prisma.receiptSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: { ...dto },
    });
  }
}