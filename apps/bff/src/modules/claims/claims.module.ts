import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaimsPort } from './ports/claims.port';
import { FhirClaimAdapter } from './adapters/fhir-claim.adapter';
import { ClaimsController } from './claims.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [ClaimsController],
  providers: [
    {
      provide: ClaimsPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('CLAIMS_ADAPTER', 'fhir-claim');
        switch (adapter) {
          case 'fhir-claim':
            return new FhirClaimAdapter(fhir);
          default:
            throw new Error(`Unknown claims adapter: ${adapter}. Supported: fhir-claim`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [ClaimsPort],
})
export class ClaimsModule {}
