import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { PayerExchangePort, type MemberMatchRequest } from './ports/payer-exchange.port';

@ApiTags('payer-exchange')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payer-exchange')
export class PayerExchangeController {
  constructor(private readonly exchange: PayerExchangePort) {}

  @Post('member-match')
  memberMatch(@DxpContext() ctx: DxpRequestContext, @Body() request: MemberMatchRequest) {
    return this.exchange.memberMatch(ctx.tenantId, request);
  }

  @Post('export')
  exportMemberData(@DxpContext() ctx: DxpRequestContext, @Body() body: { patientRef: string }) {
    return this.exchange.exportMemberData(ctx.tenantId, body.patientRef);
  }

  @Get('export/:jobId')
  getExportStatus(@DxpContext() ctx: DxpRequestContext, @Param('jobId') jobId: string) {
    return this.exchange.getExportStatus(ctx.tenantId, jobId);
  }
}
