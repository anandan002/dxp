import { Controller, Get, Put, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { IdentityPort, UpdateProfileDto } from './ports/identity.port';

@ApiTags('identity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('identity')
export class IdentityController {
  constructor(private readonly identity: IdentityPort) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  me(@DxpContext() ctx: DxpRequestContext) {
    return this.identity.getUser(ctx.userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users in tenant' })
  list(@DxpContext() ctx: DxpRequestContext, @Query('page') page?: string) {
    return this.identity.listUsers(ctx.tenantId, page ? parseInt(page) : 1);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user profile' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.identity.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Trigger password reset email' })
  resetPassword(@Param('id') id: string) {
    return this.identity.resetPassword(id);
  }
}
