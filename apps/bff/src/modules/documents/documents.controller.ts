import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { DocumentPort } from './ports/document.port';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentPort) {}

  @Get()
  @ApiOperation({ summary: 'List documents' })
  list(@DxpContext() ctx: DxpRequestContext, @Query('category') category?: string) {
    return this.documents.list(ctx.tenantId, { category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata' })
  get(@DxpContext() ctx: DxpRequestContext, @Param('id') id: string) {
    return this.documents.getById(ctx.tenantId, id);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get presigned download URL' })
  downloadUrl(@DxpContext() ctx: DxpRequestContext, @Param('id') id: string) {
    return this.documents.getDownloadUrl(ctx.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a document' })
  upload(@DxpContext() ctx: DxpRequestContext, @Body() body: { name: string; category: string; mimeType: string; data: string }) {
    return this.documents.upload(ctx.tenantId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  delete(@DxpContext() ctx: DxpRequestContext, @Param('id') id: string) {
    return this.documents.delete(ctx.tenantId, id);
  }
}
