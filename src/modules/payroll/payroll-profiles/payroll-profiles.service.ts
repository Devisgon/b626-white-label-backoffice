import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertPayrollProfileDto } from './dto/upsert-payroll-profile.dto';

@Injectable()
export class PayrollProfilesService {
  constructor(private prisma: PrismaService) {}

  // One profile per employee — created the first time an admin sets a pay
  // rate for them, updated after that. This is the foundation Day 2's
  // Timesheet/PayRun work will read from (rate + pay type).
  async upsert(tenantId: string, userId: string, dto: UpsertPayrollProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found in your organization');
    }

    if (dto.bankAccountId) {
      const account = await this.prisma.bankAccount.findUnique({ where: { id: dto.bankAccountId } });
      if (!account || account.tenantId !== tenantId) {
        throw new NotFoundException('Bank account not found in your organization');
      }
    }

    return this.prisma.payrollProfile.upsert({
      where: { userId },
      create: {
        tenantId,
        userId,
        payType: dto.payType,
        baseRate: dto.baseRate,
        overtimeRate: dto.overtimeRate,
        bankAccountId: dto.bankAccountId,
      },
      update: {
        payType: dto.payType,
        baseRate: dto.baseRate,
        overtimeRate: dto.overtimeRate,
        bankAccountId: dto.bankAccountId,
      },
    });
  }

  async findOne(tenantId: string, userId: string) {
    const profile = await this.prisma.payrollProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!profile || profile.tenantId !== tenantId) {
      throw new NotFoundException('No payroll profile found for this user');
    }
    return profile;
  }

  async findAll(tenantId: string) {
    return this.prisma.payrollProfile.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setActive(tenantId: string, userId: string, isActive: boolean) {
    const profile = await this.prisma.payrollProfile.findUnique({ where: { userId } });
    if (!profile || profile.tenantId !== tenantId) {
      throw new NotFoundException('No payroll profile found for this user');
    }
    return this.prisma.payrollProfile.update({ where: { userId }, data: { isActive } });
  }
}