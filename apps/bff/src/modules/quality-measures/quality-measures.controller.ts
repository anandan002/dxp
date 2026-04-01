import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { QualityMeasuresPort, QualityFilters, QualityCareGapFilters } from './ports/quality-measures.port';

@ApiTags('quality')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quality')
export class QualityMeasuresController {
  constructor(private readonly quality: QualityMeasuresPort) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get quality measures dashboard' })
  dashboard(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: QualityFilters,
  ) {
    return this.quality.getMeasures(ctx.tenantId, filters);
  }

  @Get('care-gaps')
  @ApiOperation({ summary: 'List quality care gaps' })
  careGaps(
    @DxpContext() ctx: DxpRequestContext,
    @Query() filters: QualityCareGapFilters,
  ) {
    return this.quality.getCareGaps(ctx.tenantId, filters);
  }

  @Post('outreach/:id')
  @ApiOperation({ summary: 'Trigger outreach for a care gap' })
  outreach(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
    @Body('channel') channel: 'sms' | 'phone' | 'app-push' | 'mail',
  ) {
    return this.quality.triggerOutreach(ctx.tenantId, id, channel);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get quality measure submission status' })
  submissions(@DxpContext() ctx: DxpRequestContext) {
    return this.quality.getSubmissionStatus(ctx.tenantId);
  }
}
