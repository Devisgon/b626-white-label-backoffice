import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { withTenantScoping } from './tenant-scoping.extension';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: async () => {
        const client = new PrismaClient();
        await client.$connect();
        // Cast: $extends() returns a structurally-compatible proxy, not a
        // `PrismaService` instance, but every consumer only calls methods
        // PrismaClient already has (findMany, create, $transaction, ...),
        // so this is safe — see PrismaService's own comment.
        return withTenantScoping(client);
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() {
    await (this.prisma as unknown as PrismaClient).$disconnect();
  }
}
