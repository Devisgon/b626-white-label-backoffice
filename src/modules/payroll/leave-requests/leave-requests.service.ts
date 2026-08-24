import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        userId,
        leaveType: dto.leaveType,
        startDate: start,
        endDate: end,
        reason: dto.reason,
      },
    });
  }

  async myRequests(tenantId: string, userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { tenantId, userId },
      orderBy: { startDate: 'desc' },
    });
  }

  // ---------- Admin ----------

  async findAll(tenantId: string, status?: string, userId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}), ...(userId ? { userId } : {}) },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async decide(tenantId: string, id: string, adminUserId: string, status: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`This request has already been ${request.status.toLowerCase()}`);
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: adminUserId, approvedAt: new Date() },
    });
  }
}