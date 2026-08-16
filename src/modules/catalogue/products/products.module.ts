import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductAuditModule } from '../product-audit/product-audit.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    ProductAuditModule,
    PrismaModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}