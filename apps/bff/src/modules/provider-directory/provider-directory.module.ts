import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderDirectoryPort } from './ports/provider-directory.port';
import { FhirProviderAdapter } from './adapters/fhir-provider.adapter';
import { NppesAdapter } from './adapters/nppes.adapter';
import { ProviderDirectoryController } from './provider-directory.controller';
import { FhirClient } from '../fhir-core/fhir-client.service';

@Module({
  controllers: [ProviderDirectoryController],
  providers: [
    {
      provide: ProviderDirectoryPort,
      useFactory: (config: ConfigService, fhir: FhirClient) => {
        const adapter = config.get<string>('PROVIDER_DIRECTORY_ADAPTER', 'fhir-provider');
        switch (adapter) {
          case 'fhir-provider':
            return new FhirProviderAdapter(fhir);
          case 'nppes':
            return new NppesAdapter();
          default:
            throw new Error(`Unknown provider-directory adapter: ${adapter}. Supported: fhir-provider, nppes`);
        }
      },
      inject: [ConfigService, FhirClient],
    },
  ],
  exports: [ProviderDirectoryPort],
})
export class ProviderDirectoryModule {}
