import { Global, Module } from '@nestjs/common';
import { FhirClient } from './fhir-client.service';

@Global()
@Module({
  providers: [FhirClient],
  exports: [FhirClient],
})
export class FhirCoreModule {}
