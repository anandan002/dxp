import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiskStratificationPort } from './ports/risk-stratification.port';
import { HccEngineAdapter } from './adapters/hcc-engine.adapter';
import { RiskStratificationController } from './risk-stratification.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [RiskStratificationController],
  providers: [
    {
      provide: RiskStratificationPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('RISK_STRAT_ADAPTER', 'hcc-engine');
        switch (adapter) {
          case 'hcc-engine':
            return new HccEngineAdapter(fhir);
          default:
            throw new Error(`Unknown risk-strat adapter: ${adapter}. Supported: hcc-engine`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [RiskStratificationPort],
})
export class RiskStratificationModule {}
