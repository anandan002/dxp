import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoragePort } from './ports/storage.port';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StoragePort) {}

  @Post('presign/upload')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  presignUpload(@Body() body: { key: string; contentType: string; expiresIn?: number }) {
    return this.storage.getPresignedUploadUrl(body.key, body.contentType, body.expiresIn);
  }

  @Post('presign/download')
  @ApiOperation({ summary: 'Get presigned download URL' })
  presignDownload(@Body() body: { key: string; expiresIn?: number }) {
    return this.storage.getPresignedDownloadUrl(body.key, body.expiresIn);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a stored object' })
  delete(@Param('key') key: string, @Query('bucket') bucket?: string) {
    return this.storage.delete(key, bucket);
  }

  @Get('list')
  @ApiOperation({ summary: 'List objects by prefix' })
  list(@Query('prefix') prefix: string, @Query('bucket') bucket?: string) {
    return this.storage.list(prefix, bucket);
  }
}
