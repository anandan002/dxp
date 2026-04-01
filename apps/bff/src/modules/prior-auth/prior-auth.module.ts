import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriorAuthPort } from './ports/prior-auth.port';
import { DaVinciPASAdapter } from './adapters/davinci-pas.adapter';
import { ManualPAAdapter } from './adapters/manual-pa.adapter';
import { PriorAuthController } from './prior-auth.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [PriorAuthController],
  providers: [
    {
      provide: PriorAuthPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('PRIOR_AUTH_ADAPTER', 'davinci-pas');
        switch (adapter) {
          case 'davinci-pas':
            return new DaVinciPASAdapter(fhir);
          case 'manual-pa':
            return new ManualPAAdapter();
          default:
            throw new Error(`Unknown prior-auth adapter: ${adapter}. Supported: davinci-pas, manual-pa`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [PriorAuthPort],
})
export class PriorAuthModule {}
