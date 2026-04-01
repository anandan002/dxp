import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { CarePlanPort } from './ports/care-plan.port';

@ApiTags('care')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('care')
export class CarePlanController {
  constructor(private readonly carePlan: CarePlanPort) {}

  @Get('timeline')
  @ApiOperation({ summary: 'Get care event timeline for the authenticated member' })
  timeline(@DxpContext() ctx: DxpRequestContext) {
    return this.carePlan.getCareTimeline(ctx.tenantId, ctx.userId);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get care team members for the authenticated member' })
  team(@DxpContext() ctx: DxpRequestContext) {
    return this.carePlan.getCareTeam(ctx.tenantId, ctx.userId);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List health programs for the authenticated member' })
  programs(@DxpContext() ctx: DxpRequestContext) {
    return this.carePlan.listPrograms(ctx.tenantId, ctx.userId);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get program detail by ID' })
  programDetail(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.carePlan.getProgramDetail(ctx.tenantId, id);
  }

  @Get('discharge/:id')
  @ApiOperation({ summary: 'Get discharge plan for an encounter' })
  dischargePlan(
    @DxpContext() ctx: DxpRequestContext,
    @Param('id') id: string,
  ) {
    return this.carePlan.getDischargePlan(ctx.tenantId, id);
  }
}
