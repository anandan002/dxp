import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationPort } from './ports/integration.port';
import { RestAdapter } from './adapters/rest.adapter';
import { IntegrationController } from './integration.controller';

@Module({
  controllers: [IntegrationController],
  providers: [
    {
      provide: IntegrationPort,
      useFactory: (config: ConfigService) => new RestAdapter(config),
      inject: [ConfigService],
    },
  ],
  exports: [IntegrationPort],
})
export class IntegrationModule {}
