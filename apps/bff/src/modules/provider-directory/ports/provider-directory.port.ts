// Provider Directory Port — the contract that all provider-directory adapters must implement.
// Consumers inject ProviderDirectoryPort and never know which adapter is active.

import {
  ProviderSummary,
  ProviderDetail,
  ProviderSearchQuery,
  NetworkValidation,
  ProviderQualityMetrics,
} from '@dxp/contracts';
import { FhirPaginatedResult } from '@dxp/contracts';

export abstract class ProviderDirectoryPort {
  abstract search(
    tenantId: string,
    query: ProviderSearchQuery,
  ): Promise<FhirPaginatedResult<ProviderSummary>>;

  abstract getByNPI(tenantId: string, npi: string): Promise<ProviderDetail>;

  abstract validate(tenantId: string, npi: string): Promise<NetworkValidation>;

  abstract getQualityMetrics(tenantId: string): Promise<ProviderQualityMetrics>;
}
