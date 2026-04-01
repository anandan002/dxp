import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { ProviderDirectoryPort } from './ports/provider-directory.port';
import { ProviderSearchQuery } from '@dxp/contracts';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('providers')
export class ProviderDirectoryController {
  constructor(private readonly providers: ProviderDirectoryPort) {}

  @Get('search')
  @ApiOperation({ summary: 'Search the provider directory' })
  async search(
    @DxpContext() ctx: DxpRequestContext,
    @Query() query: ProviderSearchQuery,
  ) {
    const result = await this.providers.search(ctx.tenantId, query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const data = (result as any).entry ?? (result as any).data ?? [];
    const total = (result as any).total ?? data.length;
    return { data, total, page, pageSize, hasMore: page * pageSize < total };
  }

  @Get('quality')
  @ApiOperation({ summary: 'Get provider directory quality metrics' })
  quality(@DxpContext() ctx: DxpRequestContext) {
    return this.providers.getQualityMetrics(ctx.tenantId);
  }

  @Get(':npi')
  @ApiOperation({ summary: 'Get provider detail by NPI' })
  getByNPI(
    @DxpContext() ctx: DxpRequestContext,
    @Param('npi') npi: string,
  ) {
    return this.providers.getByNPI(ctx.tenantId, npi);
  }

  @Get(':npi/validate')
  @ApiOperation({ summary: 'Validate provider network status' })
  validate(
    @DxpContext() ctx: DxpRequestContext,
    @Param('npi') npi: string,
  ) {
    return this.providers.validate(ctx.tenantId, npi);
  }
}
