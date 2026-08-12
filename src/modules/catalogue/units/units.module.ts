import { Module } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  controllers: [UnitsController],
  providers: [UnitsService, PrismaService],
})
export class UnitsModule {}
