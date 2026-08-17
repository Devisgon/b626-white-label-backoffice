import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateStoreProfileDto } from './dto/update-store-profile.dto';

@Injectable()
export class StoreProfileService {
  constructor(private prisma: PrismaService) {}

  // One StoreProfile per tenant. If it doesn't exist yet (e.g. tenant
  // was created before this module existed), return sensible defaults
  // instead of a 404 — this is a settings SCREEN, not a lookup, so it
  // should always render something editable.
  async get(tenantId: string) {
    const existing = await this.prisma.storeProfile.findUnique({ where: { tenantId } });
    if (existing) return existing;

    return {
      tenantId,
      storeName: '',
      logoUrl: null,
      contactEmail: null,
      contactPhone: null,
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      updatedAt: null,
    };
  }

  async update(tenantId: string, dto: UpdateStoreProfileDto) {
    return this.prisma.storeProfile.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: { ...dto },
    });
  }
}