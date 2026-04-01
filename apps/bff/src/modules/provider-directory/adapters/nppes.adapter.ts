import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import {
  ProviderSummary,
  ProviderDetail,
  ProviderSearchQuery,
  NetworkValidation,
  ProviderQualityMetrics,
  FhirPaginatedResult,
  FhirAddress,
} from '@dxp/contracts';
import { ProviderDirectoryPort } from '../ports/provider-directory.port';

/**
 * NPPES NPI Registry adapter.
 * Queries the public CMS NPI Registry API (https://npiregistry.cms.hhs.gov/api/).
 * Good for NPI validation and basic provider data; no network status info.
 */
@Injectable()
export class NppesAdapter extends ProviderDirectoryPort {
  private readonly logger = new Logger(NppesAdapter.name);
  private readonly baseUrl = 'https://npiregistry.cms.hhs.gov/api/?version=2.1';

  async search(
    _tenantId: string,
    query: ProviderSearchQuery,
  ): Promise<FhirPaginatedResult<ProviderSummary>> {
    const params = new URLSearchParams();
    params.set('version', '2.1');
    params.set('limit', String(query.pageSize || 20));
    params.set('skip', String(((query.page || 1) - 1) * (query.pageSize || 20)));

    if (query.name) {
      // Attempt to split into first/last
      const parts = query.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        params.set('first_name', parts[0]);
        params.set('last_name', parts.slice(1).join(' '));
      } else {
        params.set('last_name', query.name);
      }
    }
    if (query.specialty) params.set('taxonomy_description', query.specialty);
    if (query.postalCode) params.set('postal_code', query.postalCode);
    if (query.gender) params.set('gender', query.gender === 'male' ? 'M' : 'F');

    const data = await this.fetch(params);
    const results = (data.results || []) as Record<string, unknown>[];

    return {
      entry: results.map(r => this.mapToSummary(r)),
      total: (data.result_count as number) || results.length,
    };
  }

  async getByNPI(_tenantId: string, npi: string): Promise<ProviderDetail> {
    const params = new URLSearchParams();
    params.set('version', '2.1');
    params.set('number', npi);

    const data = await this.fetch(params);
    const results = (data.results || []) as Record<string, unknown>[];

    if (results.length === 0) {
      throw new HttpException(
        { code: 'PROVIDER_NOT_FOUND', message: `NPI ${npi} not found in NPPES registry` },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapToDetail(results[0]);
  }

  async validate(_tenantId: string, npi: string): Promise<NetworkValidation> {
    const params = new URLSearchParams();
    params.set('version', '2.1');
    params.set('number', npi);

    const data = await this.fetch(params);
    const results = (data.results || []) as Record<string, unknown>[];

    if (results.length === 0) {
      return {
        npi,
        networkStatus: 'out-of-network',
        lastVerified: new Date().toISOString(),
        credentialingStatus: 'expired',
        specialties: [],
        locations: [],
      };
    }

    const result = results[0];
    const taxonomies = (result.taxonomies as Record<string, unknown>[]) || [];

    return {
      npi,
      // NPPES cannot determine network status — only that the NPI is valid
      networkStatus: 'pending',
      lastVerified: new Date().toISOString(),
      credentialingStatus: 'active',
      specialties: taxonomies.map(t => ({
        code: String(t.code || ''),
        display: String(t.desc || ''),
      })),
      locations: this.extractAddressStrings(result),
    };
  }

  async getQualityMetrics(_tenantId: string): Promise<ProviderQualityMetrics> {
    // NPPES has no quality data — return zeroes
    return {
      totalProviders: 0,
      inNetworkCount: 0,
      acceptingNewCount: 0,
      avgRating: 0,
      dataAccuracyRate: 0,
      anomalyCount: 0,
    };
  }

  // ── NPPES API ──────────────────────────────────────────────────

  private async fetch(params: URLSearchParams): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}&${params.toString()}`;
    this.logger.debug(`NPPES GET ${url}`);

    const response = await globalThis.fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`NPPES ${response.status}: ${text}`);
      throw new HttpException(
        { code: 'NPPES_ERROR', message: `NPPES returned ${response.status}` },
        HttpStatus.BAD_GATEWAY,
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  // ── Mappers ────────────────────────────────────────────────────

  private mapToSummary(result: Record<string, unknown>): ProviderSummary {
    const basic = (result.basic as Record<string, unknown>) || {};
    const addresses = (result.addresses as Record<string, unknown>[]) || [];
    const taxonomies = (result.taxonomies as Record<string, unknown>[]) || [];
    const primaryTaxonomy = taxonomies.find(t => t.primary === true) || taxonomies[0];
    const practiceAddr = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0];

    return {
      npi: String(result.number || ''),
      name: this.formatNppesName(basic),
      specialty: primaryTaxonomy
        ? { code: String(primaryTaxonomy.code || ''), display: String(primaryTaxonomy.desc || '') }
        : { code: '' },
      networkStatus: 'pending', // NPPES cannot determine network status
      acceptingNewPatients: true,
      address: practiceAddr ? this.mapNppesAddress(practiceAddr) : {},
      phone: practiceAddr?.telephone_number as string | undefined,
      organizationName: (basic.organization_name as string) || undefined,
    };
  }

  private mapToDetail(result: Record<string, unknown>): ProviderDetail {
    const summary = this.mapToSummary(result);
    const basic = (result.basic as Record<string, unknown>) || {};
    const addresses = (result.addresses as Record<string, unknown>[]) || [];
    const taxonomies = (result.taxonomies as Record<string, unknown>[]) || [];

    return {
      ...summary,
      credentials: basic.credential ? [String(basic.credential)] : [],
      languages: [],
      gender: basic.gender === 'M' ? 'male' : basic.gender === 'F' ? 'female' : undefined,
      boardCertifications: taxonomies
        .filter(t => t.license)
        .map(t => String(t.desc || '')),
      hospitalAffiliations: [],
      locations: addresses.map((addr, idx) => ({
        id: String(idx),
        name: String(addr.address_purpose || 'Office'),
        address: this.mapNppesAddress(addr),
        phone: String(addr.telephone_number || ''),
        fax: addr.fax_number as string | undefined,
        hours: '',
      })),
      availability: [],
    };
  }

  private formatNppesName(basic: Record<string, unknown>): string {
    // Organization
    if (basic.organization_name) return String(basic.organization_name);
    // Individual
    const parts = [
      basic.name_prefix,
      basic.first_name,
      basic.middle_name,
      basic.last_name,
      basic.credential,
    ].filter(Boolean);
    return parts.join(' ');
  }

  private mapNppesAddress(addr: Record<string, unknown>): FhirAddress {
    const lines: string[] = [];
    if (addr.address_1) lines.push(String(addr.address_1));
    if (addr.address_2) lines.push(String(addr.address_2));
    return {
      line: lines.length > 0 ? lines : undefined,
      city: addr.city as string | undefined,
      state: addr.state as string | undefined,
      postalCode: addr.postal_code as string | undefined,
      country: addr.country_code as string | undefined,
    };
  }

  private extractAddressStrings(result: Record<string, unknown>): string[] {
    const addresses = (result.addresses as Record<string, unknown>[]) || [];
    return addresses.map(a => {
      const parts = [a.address_1, a.city, a.state, a.postal_code].filter(Boolean);
      return parts.join(', ');
    });
  }
}
