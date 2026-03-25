import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CmsPort, CmsContentQuery, CreateContentDto } from './ports/cms.port';

@ApiTags('cms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsPort) {}

  @Get(':type')
  @ApiOperation({ summary: 'List content by type' })
  list(@Param('type') type: string, @Query() query: CmsContentQuery) {
    return this.cms.listContent(type, query);
  }

  @Get(':type/:id')
  @ApiOperation({ summary: 'Get content by type and ID' })
  get(@Param('type') type: string, @Param('id') id: string) {
    return this.cms.getContent(type, id);
  }

  @Post(':type')
  @ApiOperation({ summary: 'Create new content' })
  create(@Param('type') type: string, @Body() dto: CreateContentDto) {
    return this.cms.createContent(type, dto);
  }

  @Post(':type/:id/publish')
  @ApiOperation({ summary: 'Publish content' })
  publish(@Param('type') type: string, @Param('id') id: string) {
    return this.cms.publishContent(type, id);
  }

  @Delete(':type/:id')
  @ApiOperation({ summary: 'Delete content' })
  delete(@Param('type') type: string, @Param('id') id: string) {
    return this.cms.deleteContent(type, id);
  }
}
