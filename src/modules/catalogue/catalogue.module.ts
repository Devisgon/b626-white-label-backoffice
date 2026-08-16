import { Module } from '@nestjs/common';
import { CatalogueController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductAuditModule } from './product-audit/product-audit.module';
import { DepartmentsModule } from './departments/departments.module';
import { UnitsModule } from './units/units.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { InventoryLocationsModule } from './inventory-locations/inventory-locations.module';
import { PriceBooksModule } from './price-books/price-books.module';
import { CartonMappingsModule } from './carton-mappings/carton-mappings.module';

@Module({
  imports: [
    BrandsModule,
    ProductsModule,
    CategoriesModule,
    ProductAuditModule,
    DepartmentsModule,
    UnitsModule,
    SuppliersModule,
    InventoryModule,
    InventoryLocationsModule,
    ProductInventoryModule,
    PriceBooksModule,
    CartonMappingsModule,
  ],
  controllers: [CatalogueController],
  providers: [CatalogueService],
  exports: [
    ProductsModule,
    CategoriesModule,
    ProductAuditModule,
    BrandsModule,
    DepartmentsModule,
    UnitsModule,
    SuppliersModule,
    InventoryModule,
    InventoryLocationsModule,
    ProductInventoryModule,
    PriceBooksModule,
    CartonMappingsModule,
  ],
})
export class CatalogueModule {}