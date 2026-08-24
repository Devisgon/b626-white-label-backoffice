import { Module } from '@nestjs/common';
import { CartonMappingsController } from './carton-mappings.controller';
import { CartonMappingsService } from './carton-mappings.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CartonMappingsController],
  providers: [CartonMappingsService],
  exports: [CartonMappingsService],
})
export class CartonMappingsModule {}
