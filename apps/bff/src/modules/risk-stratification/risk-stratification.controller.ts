import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { RiskStratificationPort, WorklistParams, CareGapFilters } from './ports/risk-stratification.port';

@ApiTags('population')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('population')
export class RiskStratificationController {
  constructor(private readonly riskStrat: RiskStratificationPort) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get population health dashboard metrics' })
  dashboard(@DxpContext() ctx: DxpRequestContext) {
    return this.riskStrat.getPopulationDashboard(ctx.tenantId);
  }

  @Get('worklist')
  @ApiOperation({ summary: 'Get risk-stratified worklist' })
  async worklist(
    @DxpContext() ctx: DxpRequestContext,
    @Query() params: WorklistParams,
  ) {
    const data = await this.riskStrat.getRiskWorklist(ctx.tenantId, params);
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    return { data, total: data.length, page, pageSize, hasMore: false };
  }

  @Get('member/:id/risk')
  @ApiOperation({ summary: 'Get individual member risk profile' })
  memberRisk(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.riskStrat.getMemberRiskProfile(ctx.tenantId, id);
  }

  @Get('care-gaps')
  @ApiOperation({ summary: 'List population care gaps' })
  careGaps(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: CareGapFilters,
  ) {
    return this.riskStrat.getCareGaps(ctx.tenantId, filters);
  }

  @Post('care-gaps/:id/close')
  @ApiOperation({ summary: 'Close a care gap' })
  closeGap(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.riskStrat.closeCareGap(ctx.tenantId, id);
  }
}
