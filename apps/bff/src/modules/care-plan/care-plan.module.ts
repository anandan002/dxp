import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CarePlanPort } from './ports/care-plan.port';
import { FhirCarePlanAdapter } from './adapters/fhir-careplan.adapter';
import { CarePlanController } from './care-plan.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [CarePlanController],
  providers: [
    {
      provide: CarePlanPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('CARE_PLAN_ADAPTER', 'fhir-careplan');
        switch (adapter) {
          case 'fhir-careplan':
            return new FhirCarePlanAdapter(fhir);
          default:
            throw new Error(`Unknown care-plan adapter: ${adapter}. Supported: fhir-careplan`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [CarePlanPort],
})
export class CarePlanModule {}
