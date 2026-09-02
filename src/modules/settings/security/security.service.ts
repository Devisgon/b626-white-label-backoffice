import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async get(tenantId: string) {
    const existing = await this.prisma.securityPolicy.findUnique({ where: { tenantId } });
    if (existing) return existing;

    return {
      tenantId,
      minPasswordLength: 8,
      sessionTimeoutMinutes: 60,
      require2FA: false,
      updatedAt: null,
    };
  }

  async update(tenantId: string, dto: UpdateSecurityPolicyDto) {
    return this.prisma.securityPolicy.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: { ...dto },
    });
  }
}