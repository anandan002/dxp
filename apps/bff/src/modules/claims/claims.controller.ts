import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { ClaimsPort } from './ports/claims.port';
import { ClaimFilters, AppealSubmission } from '@dxp/contracts';

@ApiTags('claims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsPort) {}

  @Get()
  @ApiOperation({ summary: 'List claims for the authenticated member' })
  async list(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: ClaimFilters,
  ) {
    const result = await this.claims.listClaims(ctx.tenantId, ctx.userId, filters);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    // Normalise FHIR paginated result → PaginatedResponse
    const data = (result as any).entry ?? (result as any).data ?? [];
    const total = (result as any).total ?? data.length;
    return { data, total, page, pageSize, hasMore: page * pageSize < total };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get claims dashboard metrics' })
  dashboard(@DxpContext() ctx: DxpRequestContext) {
    return this.claims.getDashboardMetrics(ctx.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get claim detail / EOB' })
  detail(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.claims.getEOB(ctx.tenantId, id);
  }

  @Post(':id/appeal')
  @ApiOperation({ summary: 'Submit an appeal for a denied claim' })
  appeal(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
    @Body() data: AppealSubmission,
  ) {
    return this.claims.submitAppeal(ctx.tenantId, id, data);
  }
}
