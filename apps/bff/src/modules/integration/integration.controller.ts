import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationPort, IntegrationRequest } from './ports/integration.port';

@ApiTags('integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integration: IntegrationPort) {}

  @Get()
  @ApiOperation({ summary: 'List configured integrations' })
  list() {
    return this.integration.listIntegrations();
  }

  @Post(':name/call')
  @ApiOperation({ summary: 'Call an external integration' })
  call(@Param('name') name: string, @Body() request: IntegrationRequest) {
    return this.integration.call(name, request);
  }
}
