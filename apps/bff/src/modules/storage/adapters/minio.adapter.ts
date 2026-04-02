import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  StoragePort,
  StorageObject,
  PresignedUrl,
  UploadOptions,
} from '../ports/storage.port';

@Injectable()
export class MinioAdapter extends StoragePort {
  private readonly logger = new Logger(MinioAdapter.name);
  private readonly endpoint: string;
  private readonly defaultBucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    super();
    this.endpoint = this.config.get<string>('MINIO_ENDPOINT', 'http://localhost:5031');
    this.defaultBucket = this.config.get<string>('MINIO_DEFAULT_BUCKET', 'dxp-documents');
    this.accessKey = this.config.get<string>('MINIO_ROOT_USER', 'dxp_minio');
    this.secretKey = this.config.get<string>('MINIO_ROOT_PASSWORD', 'dxp_minio_pass');
  }

  async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject> {
    const bucket = options?.bucket || this.defaultBucket;
    const contentType = options?.contentType || 'application/octet-stream';

    // Use MinIO S3-compatible API
    await axios.put(`${this.endpoint}/${bucket}/${key}`, data, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': data.length,
      },
      auth: { username: this.accessKey, password: this.secretKey },
    });

    return {
      key,
      bucket,
      size: data.length,
      contentType,
      lastModified: new Date().toISOString(),
    };
  }

  async download(key: string, bucket?: string): Promise<Buffer> {
    const b = bucket || this.defaultBucket;
    const response = await axios.get(`${this.endpoint}/${b}/${key}`, {
      responseType: 'arraybuffer',
      auth: { username: this.accessKey, password: this.secretKey },
    });
    return Buffer.from(response.data);
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<PresignedUrl> {
    // In production, use the MinIO JS SDK for proper presigned URLs.
    // This is a simplified version for the adapter pattern demonstration.
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    return {
      url: `${this.endpoint}/${this.defaultBucket}/${key}?X-Amz-Expires=${expiresIn}`,
      key,
      expiresAt,
    };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<PresignedUrl> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    return {
      url: `${this.endpoint}/${this.defaultBucket}/${key}?X-Amz-Expires=${expiresIn}`,
      key,
      expiresAt,
    };
  }

  async delete(key: string, bucket?: string): Promise<void> {
    const b = bucket || this.defaultBucket;
    await axios.delete(`${this.endpoint}/${b}/${key}`, {
      auth: { username: this.accessKey, password: this.secretKey },
    });
  }

  async list(prefix: string, bucket?: string): Promise<StorageObject[]> {
    // Simplified — full implementation would use S3 ListObjectsV2
    this.logger.debug(`Listing objects with prefix: ${prefix} in bucket: ${bucket || this.defaultBucket}`);
    return [];
  }
}

