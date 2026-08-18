import { Module } from '@nestjs/common';
import { ProductAuditService } from './product-audit.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductAuditService],
  exports: [ProductAuditService],
})
export class ProductAuditModule {}
