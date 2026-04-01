import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { ConsentPort } from './ports/consent.port';
import type { ConsentDecision } from '@dxp/contracts';

@ApiTags('consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly consent: ConsentPort) {}

  @Get()
  getConsents(@DxpContext() ctx: DxpRequestContext) {
    return this.consent.getConsents(ctx.tenantId, ctx.userId);
  }

  @Post()
  grantConsent(@DxpContext() ctx: DxpRequestContext, @Body() decision: ConsentDecision) {
    return this.consent.grantConsent(ctx.tenantId, ctx.userId, decision);
  }

  @Delete(':id')
  revokeConsent(@DxpContext() ctx: DxpRequestContext, @Param('id') id: string) {
    return this.consent.revokeConsent(ctx.tenantId, id);
  }
}
