import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayerExchangePort } from './ports/payer-exchange.port';
import { PDexAdapter } from './adapters/pdex.adapter';
import { PayerExchangeController } from './payer-exchange.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [PayerExchangeController],
  providers: [
    {
      provide: PayerExchangePort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('PAYER_EXCHANGE_ADAPTER', 'pdex');
        switch (adapter) {
          case 'pdex':
            return new PDexAdapter(fhir);
          default:
            throw new Error(`Unknown payer-exchange adapter: ${adapter}. Supported: pdex`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [PayerExchangePort],
})
export class PayerExchangeModule {}
