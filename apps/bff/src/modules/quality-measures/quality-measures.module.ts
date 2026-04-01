import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QualityMeasuresPort } from './ports/quality-measures.port';
import { HedisEngineAdapter } from './adapters/hedis-engine.adapter';
import { QualityMeasuresController } from './quality-measures.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [QualityMeasuresController],
  providers: [
    {
      provide: QualityMeasuresPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('QUALITY_ADAPTER', 'hedis-engine');
        switch (adapter) {
          case 'hedis-engine':
            return new HedisEngineAdapter(fhir);
          default:
            throw new Error(`Unknown quality adapter: ${adapter}. Supported: hedis-engine`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [QualityMeasuresPort],
})
export class QualityMeasuresModule {}
