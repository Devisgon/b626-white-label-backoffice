import { Test, TestingModule } from '@nestjs/testing';
import { ProductAuditService } from './product-audit.service';

describe('ProductAuditService', () => {
  let service: ProductAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductAuditService],
    }).compile();

    service = module.get<ProductAuditService>(ProductAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
