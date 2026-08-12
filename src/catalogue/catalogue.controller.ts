import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';

@ApiTags('Catalogue')
@ApiBearerAuth('accessToken')
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get()
  @ApiOperation({ summary: 'Get catalogue information' })
  getCatalogueInfo() {
    return this.catalogueService.getCatalogueInfo();
  }
}