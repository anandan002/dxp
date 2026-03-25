export interface DocumentMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface UploadDocumentDto {
  name: string;
  category: string;
  mimeType: string;
  data: Buffer | string;
}

export interface DocumentQuery {
  category?: string;
  uploadedBy?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export abstract class DocumentPort {
  abstract upload(tenantId: string, dto: UploadDocumentDto): Promise<DocumentMetadata>;
  abstract getById(tenantId: string, id: string): Promise<DocumentMetadata>;
  abstract list(tenantId: string, query: DocumentQuery): Promise<{ data: DocumentMetadata[]; total: number }>;
  abstract getDownloadUrl(tenantId: string, id: string): Promise<string>;
  abstract delete(tenantId: string, id: string): Promise<void>;
}
