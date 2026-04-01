import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EligibilityPort } from './ports/eligibility.port';
import { FhirCoverageAdapter } from './adapters/fhir-coverage.adapter';
import { EligibilityController } from './eligibility.controller';
import { MemberController } from './member.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [EligibilityController, MemberController],
  providers: [
    {
      provide: EligibilityPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('ELIGIBILITY_ADAPTER', 'fhir-coverage');
        switch (adapter) {
          case 'fhir-coverage':
            return new FhirCoverageAdapter(fhir);
          default:
            throw new Error(`Unknown eligibility adapter: ${adapter}. Supported: fhir-coverage`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [EligibilityPort],
})
export class EligibilityModule {}
