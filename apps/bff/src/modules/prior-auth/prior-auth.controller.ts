import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { PriorAuthPort } from './ports/prior-auth.port';
import { PAQueueFilters, PASubmission, PADecision } from '@dxp/contracts';

@ApiTags('prior-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prior-auth')
export class PriorAuthController {
  constructor(private readonly priorAuth: PriorAuthPort) {}

  // ── Member routes ──────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List prior authorizations' })
  async list(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: PAQueueFilters,
  ) {
    const result = await this.priorAuth.listPriorAuths(ctx.tenantId, filters);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const data = (result as any).entry ?? (result as any).data ?? [];
    const total = (result as any).total ?? data.length;
    return { data, total, page, pageSize, hasMore: page * pageSize < total };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get prior-auth dashboard metrics' })
  dashboard(@DxpContext() ctx: DxpRequestContext) {
    return this.priorAuth.getDashboardMetrics(ctx.tenantId);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get the clinical review queue' })
  async reviewQueue(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: PAQueueFilters,
  ) {
    const result = await this.priorAuth.getReviewQueue(ctx.tenantId, filters);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const data = (result as any).entry ?? (result as any).data ?? [];
    const total = (result as any).total ?? data.length;
    return { data, total, page, pageSize, hasMore: page * pageSize < total };
  }

  @Get('template/:code')
  @ApiOperation({ summary: 'Get documentation template for a service code' })
  template(
    @DxpContext() ctx: DxpRequestContext,
    @Param('code') code: string,
  ) {
    return this.priorAuth.getDocTemplate(ctx.tenantId, code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prior authorization detail' })
  detail(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.priorAuth.getPriorAuthDetail(ctx.tenantId, id);
  }

  // ── Provider routes ────────────────────────────────────────────

  @Post('check')
  @ApiOperation({ summary: 'Check if prior auth is required (CRD)' })
  check(
    @DxpContext() ctx: DxpRequestContext,
    @Body() body: { serviceCode: string; memberId: string },
  ) {
    return this.priorAuth.checkRequirement(ctx.tenantId, body.serviceCode, body.memberId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit a prior authorization request' })
  submit(
    @DxpContext() ctx: DxpRequestContext,
    @Body() data: PASubmission,
  ) {
    return this.priorAuth.submitRequest(ctx.tenantId, data);
  }

  // ── Internal / payer routes ────────────────────────────────────

  @Put(':id/decide')
  @ApiOperation({ summary: 'Record a decision on a prior authorization' })
  decide(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
    @Body() decision: PADecision,
  ) {
    return this.priorAuth.decide(ctx.tenantId, id, decision);
  }
}
