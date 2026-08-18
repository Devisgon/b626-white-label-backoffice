import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';

@Injectable()
export class TaxService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTaxRuleDto) {
    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
      if (!location || location.tenantId !== tenantId) {
        throw new NotFoundException('Location not found in your organization');
      }
    }

    return this.prisma.taxRule.create({
      data: {
        tenantId,
        name: dto.name,
        ratePercent: dto.ratePercent,
        locationId: dto.locationId,
      },
    });
  }

  // No locationId = rules that apply everywhere. Passing a locationId
  // returns both the location-specific rules AND the tenant-wide ones —
  // the caller (e.g. a sale/invoice calculation) applies whichever is
  // more specific.
  async findAll(tenantId: string, locationId?: string) {
    return this.prisma.taxRule.findMany({
      where: {
        tenantId,
        ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTaxRuleDto) {
    const rule = await this.findOneOrThrow(tenantId, id);
    return this.prisma.taxRule.update({
      where: { id: rule.id },
      data: { name: dto.name, ratePercent: dto.ratePercent, isActive: dto.isActive },
    });
  }

  async remove(tenantId: string, id: string) {
    const rule = await this.findOneOrThrow(tenantId, id);
    await this.prisma.taxRule.delete({ where: { id: rule.id } });
    return { message: 'Tax rule deleted' };
  }

  private async findOneOrThrow(tenantId: string, id: string) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule || rule.tenantId !== tenantId) {
      throw new NotFoundException('Tax rule not found');
    }
    return rule;
  }
}