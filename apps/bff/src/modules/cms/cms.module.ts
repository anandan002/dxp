import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmsPort } from './ports/cms.port';
import { StrapiAdapter } from './adapters/strapi.adapter';
import { PayloadAdapter } from './adapters/payload.adapter';
import { CmsController } from './cms.controller';

@Module({
  controllers: [CmsController],
  providers: [
    {
      provide: CmsPort,
      useFactory: (config: ConfigService) => {
        const adapter = config.get<string>('CMS_ADAPTER', 'strapi');
        switch (adapter) {
          case 'strapi':
            return new StrapiAdapter(config);
          case 'payload':
            return new PayloadAdapter(config);
          default:
            throw new Error(`Unknown CMS adapter: ${adapter}. Supported: strapi, payload, aem`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [CmsPort],
})
export class CmsModule {}
