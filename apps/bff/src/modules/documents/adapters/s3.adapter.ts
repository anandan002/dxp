import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentPort, DocumentMetadata, UploadDocumentDto, DocumentQuery } from '../ports/document.port';

@Injectable()
export class S3DocumentAdapter extends DocumentPort {
  private readonly logger = new Logger(S3DocumentAdapter.name);
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    super();
    this.bucket = this.config.get<string>('S3_BUCKET', 'dxp-documents');
  }

  async upload(tenantId: string, dto: UploadDocumentDto): Promise<DocumentMetadata> {
    const id = `doc-${Date.now()}`;
    const key = `${tenantId}/${dto.category}/${id}-${dto.name}`;
    this.logger.log(`Uploading to S3: ${key}`);

    // In production: use @aws-sdk/client-s3 PutObjectCommand
    return {
      id,
      name: dto.name,
      mimeType: dto.mimeType,
      size: typeof dto.data === 'string' ? dto.data.length : dto.data.length,
      category: dto.category,
      uploadedBy: 'system',
      uploadedAt: new Date().toISOString(),
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
    };
  }

  async getById(tenantId: string, id: string): Promise<DocumentMetadata> {
    this.logger.debug(`Get document: ${tenantId}/${id}`);
    // In production: query metadata store or S3 head-object
    return { id, name: '', mimeType: '', size: 0, category: '', uploadedBy: '', uploadedAt: '' };
  }

  async list(tenantId: string, query: DocumentQuery): Promise<{ data: DocumentMetadata[]; total: number }> {
    this.logger.debug(`List documents for tenant: ${tenantId}`);
    // In production: S3 ListObjectsV2 with prefix filtering
    return { data: [], total: 0 };
  }

  async getDownloadUrl(tenantId: string, id: string): Promise<string> {
    // In production: generate presigned URL with GetObjectCommand
    return `https://${this.bucket}.s3.amazonaws.com/${tenantId}/${id}?X-Amz-Expires=3600`;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Delete document: ${tenantId}/${id}`);
    // In production: S3 DeleteObjectCommand
  }
}
