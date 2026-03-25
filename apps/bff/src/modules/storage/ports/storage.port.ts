// Storage Port — contract for all storage adapters.
// Swap providers by changing STORAGE_PROVIDER env var.

export interface StorageObject {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: string;
}

export interface PresignedUrl {
  url: string;
  key: string;
  expiresAt: string;
}

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export abstract class StoragePort {
  abstract upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject>;
  abstract download(key: string, bucket?: string): Promise<Buffer>;
  abstract getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<PresignedUrl>;
  abstract getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<PresignedUrl>;
  abstract delete(key: string, bucket?: string): Promise<void>;
  abstract list(prefix: string, bucket?: string): Promise<StorageObject[]>;
}
