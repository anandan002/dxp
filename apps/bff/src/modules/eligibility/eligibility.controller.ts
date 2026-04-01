import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { EligibilityPort } from './ports/eligibility.port';

@ApiTags('eligibility')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibility: EligibilityPort) {}

  @Get('benefits')
  @ApiOperation({ summary: 'Get benefit categories for the authenticated member' })
  benefits(@DxpContext() ctx: DxpRequestContext) {
    return this.eligibility.getBenefits(ctx.tenantId, ctx.userId);
  }

  @Get('accumulators')
  @ApiOperation({ summary: 'Get deductible and out-of-pocket accumulators' })
  accumulators(@DxpContext() ctx: DxpRequestContext) {
    return this.eligibility.getAccumulators(ctx.tenantId, ctx.userId);
  }

  @Get('cost-estimate')
  @ApiOperation({ summary: 'Estimate cost for a procedure' })
  costEstimate(
    @DxpContext() ctx: DxpRequestContext,
    @Query('procedureCode') procedureCode: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.eligibility.getCostEstimate(ctx.tenantId, ctx.userId, procedureCode, providerId);
  }

  @Get('id-card')
  @ApiOperation({ summary: 'Get digital insurance ID card' })
  idCard(@DxpContext() ctx: DxpRequestContext) {
    return this.eligibility.getIdCard(ctx.tenantId, ctx.userId);
  }
}
