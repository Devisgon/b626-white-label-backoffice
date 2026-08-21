import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  // The raw API key is hashed immediately and never stored or logged in
  // plain text — same as how passwords are handled in AuthService. Once
  // created, the raw key is shown to the admin exactly once (in the
  // create response) and never again; losing it means creating a new
  // integration.
  async create(tenantId: string, dto: CreateIntegrationDto) {
    const apiKeyHash = await bcrypt.hash(dto.apiKey, 10);
    return this.prisma.apiIntegration.create({
      data: { tenantId, provider: dto.provider, apiKeyHash },
      select: { id: true, provider: true, isActive: true, createdAt: true }, // never select apiKeyHash back out
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.apiIntegration.findMany({
      where: { tenantId },
      select: { id: true, provider: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setActive(tenantId: string, id: string, isActive: boolean) {
    const integration = await this.prisma.apiIntegration.findUnique({ where: { id } });
    if (!integration || integration.tenantId !== tenantId) {
      throw new NotFoundException('Integration not found');
    }
    return this.prisma.apiIntegration.update({
      where: { id },
      data: { isActive },
      select: { id: true, provider: true, isActive: true, createdAt: true },
    });
  }

  async remove(tenantId: string, id: string) {
    const integration = await this.prisma.apiIntegration.findUnique({ where: { id } });
    if (!integration || integration.tenantId !== tenantId) {
      throw new NotFoundException('Integration not found');
    }
    await this.prisma.apiIntegration.delete({ where: { id } });
    return { message: 'Integration deleted' };
  }
}