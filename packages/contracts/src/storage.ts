export interface StorageObject {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: string;
  url?: string;
}

export interface PresignedUrlRequest {
  key: string;
  bucket?: string;
  expiresIn?: number;
  contentType?: string;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: string;
}

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  url: string;
}
