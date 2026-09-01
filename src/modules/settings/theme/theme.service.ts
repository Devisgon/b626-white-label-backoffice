import { Injectable } from '@nestjs/common';
import { ThemeKey } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  // Just the key — the frontend owns the actual color definitions for
  // each key in its own config. Backend never stores or resolves colors.
  async getMyTheme(tenantId: string) {
    const storeProfile = await this.prisma.storeProfile.findUnique({ where: { tenantId } });
    return { themeKey: storeProfile?.themeKey ?? ThemeKey.GREEN };
  }

  async selectTheme(tenantId: string, themeKey: ThemeKey) {
    await this.prisma.storeProfile.upsert({
      where: { tenantId },
      create: { tenantId, storeName: '', themeKey },
      update: { themeKey },
    });
    return { themeKey };
  }
}