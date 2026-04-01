import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsentPort } from './ports/consent.port';
import { FhirConsentAdapter } from './adapters/fhir-consent.adapter';
import { ConsentController } from './consent.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [ConsentController],
  providers: [
    {
      provide: ConsentPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('CONSENT_ADAPTER', 'fhir-consent');
        switch (adapter) {
          case 'fhir-consent':
            return new FhirConsentAdapter(fhir);
          default:
            throw new Error(`Unknown consent adapter: ${adapter}. Supported: fhir-consent`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [ConsentPort],
})
export class ConsentModule {}
