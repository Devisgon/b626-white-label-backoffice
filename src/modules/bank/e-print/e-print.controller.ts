import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EPrintService } from './e-print.service';
import { PrintChecksDto } from './dto/print-checks.dto';
import { Ctx } from '../../../common/decorators/tenant-location.decorator';
import type { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('Bank e-Print')
@ApiSecurity('tenant-id')
@ApiSecurity('location-id')
@Controller('bank/e-print')
@ApiBearerAuth('accessToken')
export class EPrintController {
  constructor(private readonly service: EPrintService) {}

  @Get('checks')
  @ApiOperation({ summary: 'List unprinted checks eligible for printing' })
  @ApiQuery({
    name: 'onlyPayroll',
    required: false,
    description:
      'true = only payroll checks, false/omit = all checks except payroll',
  })
  listEligibleChecks(
    @Ctx() ctx: RequestContext,
    @Query('onlyPayroll') onlyPayroll?: string,
  ) {
    return this.service.listEligibleChecks(ctx, onlyPayroll === 'true');
  }

  @Post('checks/print')
  @ApiOperation({
    summary:
      'Print selected checks — assigns sequential check numbers and logs the batch',
  })
  printChecks(@Ctx() ctx: RequestContext, @Body() dto: PrintChecksDto) {
    return this.service.printChecks(ctx, dto);
  }

  @Get('print-history')
  @ApiOperation({ summary: 'List past check print batches' })
  getPrintHistory(@Ctx() ctx: RequestContext) {
    return this.service.getPrintHistory(ctx);
  }

  @Get('print-history/:id')
  @ApiOperation({ summary: 'Get a single print batch with its checks' })
  getBatch(@Ctx() ctx: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getBatch(ctx, id);
  }
}
