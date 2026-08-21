import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';

@Injectable()
export class DeductionsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDeductionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found in your organization');
    }

    return this.prisma.deduction.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        isRecurring: dto.isRecurring ?? true,
        note: dto.note,
      },
    });
  }

  async findAll(tenantId: string, userId?: string) {
    return this.prisma.deduction.findMany({
      where: { tenantId, ...(userId ? { userId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDeductionDto) {
    const deduction = await this.findOneOrThrow(tenantId, id);
    return this.prisma.deduction.update({
      where: { id: deduction.id },
      data: { amount: dto.amount, isActive: dto.isActive, note: dto.note },
    });
  }

  async remove(tenantId: string, id: string) {
    const deduction = await this.findOneOrThrow(tenantId, id);
    await this.prisma.deduction.delete({ where: { id: deduction.id } });
    return { message: 'Deduction deleted' };
  }

  // Called by PayRunsService right after a one-time deduction has been
  // included in a processed pay run — non-recurring deductions should only
  // ever be charged once.
  async deactivateOneTime(userId: string) {
    await this.prisma.deduction.updateMany({
      where: { userId, isRecurring: false, isActive: true },
      data: { isActive: false },
    });
  }

  private async findOneOrThrow(tenantId: string, id: string) {
    const deduction = await this.prisma.deduction.findUnique({ where: { id } });
    if (!deduction || deduction.tenantId !== tenantId) {
      throw new NotFoundException('Deduction not found');
    }
    return deduction;
  }
}