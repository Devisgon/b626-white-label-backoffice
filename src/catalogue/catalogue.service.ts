import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogueService {
  getCatalogueInfo() {
    return {
      module: 'Catalogue',
      description: 'Central catalogue module for managing products, categories, suppliers, departments, brands, and related master data.',
      version: '1.0.0',
    };
  }
}