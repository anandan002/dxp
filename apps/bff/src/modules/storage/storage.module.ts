import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoragePort } from './ports/storage.port';
import { MinioAdapter } from './adapters/minio.adapter';
import { AzureBlobAdapter } from './adapters/azure-blob.adapter';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: StoragePort,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('STORAGE_PROVIDER', 'minio');
        switch (provider) {
          case 'minio':
          case 's3':
            return new MinioAdapter(config);
          case 'azure':
            return new AzureBlobAdapter(config);
          default:
            throw new Error(`Unknown storage provider: ${provider}. Supported: minio, s3, azure`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [StoragePort],
})
export class StorageModule {}
