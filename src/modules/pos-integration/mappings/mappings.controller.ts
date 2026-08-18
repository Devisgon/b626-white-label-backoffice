import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MappingsService } from './mappings.service';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { UpdateMappingDto } from './dto/update-mapping.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('POS Integration - Mappings')
@ApiBearerAuth('accessToken')
@Controller('pos-integration/mappings')
export class MappingsController {
  constructor(private readonly service: MappingsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a mapping row between an internal entity and its external POS key',
  })
  create(@Ctx() ctx: RequestContext, @Body() dto: CreateMappingDto) {
    return this.service.create(ctx, dto);
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Mapping stats — total, required, mapped, unresolved, partial, blocked',
  })
  getOverview(@Ctx() ctx: RequestContext) {
    return this.service.getOverview(ctx);
  }

  @Get()
  @ApiOperation({ summary: 'List mappings' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['unresolved', 'partial', 'mapped', 'blocked'],
  })
  @ApiQuery({ name: 'internalEntityType', required: false })
  findAll(
    @Ctx() ctx: RequestContext,
    @Query('status') status?: string,
    @Query('internalEntityType') internalEntityType?: string,
  ) {
    return this.service.findAll(ctx, status, internalEntityType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single mapping' })
  findOne(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(ctx, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mapping' })
  update(
    @Ctx() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMappingDto,
  ) {
    return this.service.update(ctx, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mapping' })
  remove(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(ctx, id);
  }
}
