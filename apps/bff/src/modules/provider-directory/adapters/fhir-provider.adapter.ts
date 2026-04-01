import { Injectable, Logger } from '@nestjs/common';
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
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

/**
 * FHIR-based Provider Directory adapter.
 * Queries Practitioner, PractitionerRole, Organization, and Location resources
 * following the DaVinci PDEX Plan Net IG.
 */
@Injectable()
export class FhirProviderAdapter extends ProviderDirectoryPort {
  private readonly logger = new Logger(FhirProviderAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async search(
    tenantId: string,
    query: ProviderSearchQuery,
  ): Promise<FhirPaginatedResult<ProviderSummary>> {
    const count = query.pageSize || 20;
    const offset = query.page && query.pageSize ? (query.page - 1) * query.pageSize : 0;

    // When a name filter is present, FHIR name indexing is on Practitioner not PractitionerRole.
    // Search Practitioner?name= first, then fetch their roles.
    if (query.name) {
      const practBundle = await this.fhir.search<Record<string, unknown>>(
        'Practitioner',
        { name: query.name, _count: String(count), _offset: String(offset) },
      );
      const practEntries = practBundle.entry || [];
      if (practEntries.length === 0) {
        return { entry: [], total: 0, link: [] };
      }

      const ids = practEntries
        .filter(e => e.resource.resourceType === 'Practitioner')
        .map(e => String(e.resource.id))
        .filter(Boolean);

      const practitioners = new Map<string, Record<string, unknown>>();
      for (const e of practEntries) {
        practitioners.set(String(e.resource.id), e.resource);
      }

      const roleParams: Record<string, string> = {
        practitioner: ids.join(','),
        _include: 'PractitionerRole:practitioner',
        _count: String(ids.length * 2),
      };
      if (query.specialty) roleParams.specialty = query.specialty;

      const rolesBundle = await this.fhir.search<Record<string, unknown>>('PractitionerRole', roleParams);
      const roles: Record<string, unknown>[] = [];
      for (const e of (rolesBundle.entry || [])) {
        if (e.resource.resourceType === 'PractitionerRole') roles.push(e.resource);
        else if (e.resource.resourceType === 'Practitioner') practitioners.set(String(e.resource.id), e.resource);
      }

      // Include practitioners without roles
      const coveredPractIds = new Set(roles.map(r => this.extractReferenceId(r, 'practitioner')).filter(Boolean));
      for (const id of ids) {
        if (!coveredPractIds.has(id)) {
          roles.push({ resourceType: 'PractitionerRole', id: `stub-${id}`, practitioner: { reference: `Practitioner/${id}` } });
        }
      }

      const summaries: ProviderSummary[] = roles.map(role => {
        const practRef = this.extractReferenceId(role, 'practitioner');
        const practitioner = practRef ? practitioners.get(practRef) : undefined;
        return this.mapToSummary(role, practitioner);
      });

      return {
        entry: summaries,
        total: practBundle.total || summaries.length,
        link: practBundle.link,
      };
    }

    // No name filter — search PractitionerRole directly
    const params: Record<string, string> = {
      _count: String(count),
      _include: 'PractitionerRole:practitioner',
      _offset: String(offset),
    };
    if (query.specialty) params.specialty = query.specialty;
    if (query.postalCode) params['location.address-postalcode'] = query.postalCode;
    if (query.acceptingNew !== undefined) params['new-patient'] = String(query.acceptingNew);
    if (query.language) params.communication = query.language;
    if (query.gender) params.gender = query.gender;

    const bundle = await this.fhir.search<Record<string, unknown>>('PractitionerRole', params);
    const entries = bundle.entry || [];

    const practitioners = new Map<string, Record<string, unknown>>();
    const roles: Record<string, unknown>[] = [];

    for (const entry of entries) {
      const resource = entry.resource;
      if (resource.resourceType === 'Practitioner') {
        practitioners.set(String(resource.id), resource);
      } else if (resource.resourceType === 'PractitionerRole') {
        roles.push(resource);
      }
    }

    const summaries: ProviderSummary[] = roles.map(role => {
      const practRef = this.extractReferenceId(role, 'practitioner');
      const practitioner = practRef ? practitioners.get(practRef) : undefined;
      return this.mapToSummary(role, practitioner);
    });

    return {
      entry: summaries,
      total: bundle.total || summaries.length,
      link: bundle.link,
    };
  }

  async getByNPI(tenantId: string, npi: string): Promise<ProviderDetail> {
    // Search Practitioner by NPI identifier
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'Practitioner',
      { identifier: `http://hl7.org/fhir/sid/us-npi|${npi}` },
    );

    const entries = bundle.entry || [];
    if (entries.length === 0) {
      throw new Error(`Provider with NPI ${npi} not found`);
    }

    const practitioner = entries[0].resource;
    const practitionerId = String(practitioner.id || '');

    // Fetch roles for this practitioner
    const rolesBundle = await this.fhir.search<Record<string, unknown>>(
      'PractitionerRole',
      { practitioner: practitionerId, _include: 'PractitionerRole:location' },
    );

    const roleEntries = rolesBundle.entry || [];
    const role = roleEntries.find(e => e.resource.resourceType === 'PractitionerRole')?.resource;
    const locations = roleEntries
      .filter(e => e.resource.resourceType === 'Location')
      .map(e => e.resource);

    return this.mapToDetail(practitioner, role, locations);
  }

  async validate(tenantId: string, npi: string): Promise<NetworkValidation> {
    const bundle = await this.fhir.search<Record<string, unknown>>(
      'Practitioner',
      { identifier: `http://hl7.org/fhir/sid/us-npi|${npi}`, _revinclude: 'PractitionerRole:practitioner' },
    );

    const entries = bundle.entry || [];
    const practitioner = entries.find(e => e.resource.resourceType === 'Practitioner')?.resource;
    const roles = entries.filter(e => e.resource.resourceType === 'PractitionerRole').map(e => e.resource);

    if (!practitioner) {
      return {
        npi,
        networkStatus: 'out-of-network',
        lastVerified: new Date().toISOString(),
        credentialingStatus: 'expired',
        specialties: [],
        locations: [],
      };
    }

    const activeRole = roles.find(r => r.active === true);

    return {
      npi,
      networkStatus: activeRole ? 'in-network' : 'out-of-network',
      lastVerified: new Date().toISOString(),
      credentialingStatus: activeRole ? 'active' : 'pending',
      specialties: roles.flatMap(r => this.extractSpecialties(r)),
      locations: roles.flatMap(r => this.extractLocationRefs(r)),
    };
  }

  async getQualityMetrics(tenantId: string): Promise<ProviderQualityMetrics> {
    const [allBundle, activeBundle] = await Promise.all([
      this.fhir.search<Record<string, unknown>>('Practitioner', { _summary: 'count' }),
      this.fhir.search<Record<string, unknown>>('PractitionerRole', { active: 'true', _summary: 'count' }),
    ]);

    return {
      totalProviders: allBundle.total || 0,
      inNetworkCount: activeBundle.total || 0,
      acceptingNewCount: 0,
      avgRating: 0,
      dataAccuracyRate: 0,
      anomalyCount: 0,
    };
  }

  // ── Mappers ────────────────────────────────────────────────────

  private mapToSummary(
    role: Record<string, unknown>,
    practitioner?: Record<string, unknown>,
  ): ProviderSummary {
    const specialtyCoding = this.extractFirstSpecialty(role);

    return {
      npi: practitioner ? this.extractNPI(practitioner) : '',
      name: practitioner ? this.formatName(practitioner) : this.extractDisplay(role, 'practitioner') || '',
      specialty: specialtyCoding || { code: '' },
      networkStatus: role.active ? 'in-network' : 'out-of-network',
      acceptingNewPatients: (role.availabilityExceptions as string)?.includes('accepting') || true,
      address: this.extractFirstAddress(role) || {},
      phone: this.extractPhone(role),
      organizationName: this.extractDisplay(role, 'organization'),
    };
  }

  private mapToDetail(
    practitioner: Record<string, unknown>,
    role?: Record<string, unknown>,
    locations?: Record<string, unknown>[],
  ): ProviderDetail {
    const names = (practitioner.name as Record<string, unknown>[]) || [];
    const comms = (practitioner.communication as Record<string, unknown>[]) || [];
    const qualifications = (practitioner.qualification as Record<string, unknown>[]) || [];

    return {
      npi: this.extractNPI(practitioner),
      name: this.formatName(practitioner),
      specialty: (role ? this.extractFirstSpecialty(role) : undefined) || { code: '' },
      networkStatus: role?.active ? 'in-network' : 'out-of-network',
      acceptingNewPatients: true,
      address: (locations?.length ? this.mapLocationAddress(locations[0]) : undefined) || {},
      phone: role ? this.extractPhone(role) : undefined,
      credentials: qualifications.map(q => {
        const code = q.code as Record<string, unknown> | undefined;
        return (code?.text as string) || this.extractFirstCode(code) || '';
      }),
      languages: comms.map(c => {
        const coding = c.coding as Record<string, unknown>[] | undefined;
        return (coding?.[0]?.display as string) || (c.text as string) || '';
      }),
      gender: practitioner.gender as string | undefined,
      boardCertifications: [],
      hospitalAffiliations: [],
      locations: (locations || []).map(loc => ({
        id: String(loc.id || ''),
        name: String(loc.name || ''),
        address: this.mapLocationAddress(loc) || {},
        phone: this.extractLocationPhone(loc) || '',
        fax: this.extractLocationContactBySystem(loc, 'fax'),
        hours: (loc.hoursOfOperation as string) || '',
      })),
      availability: [],
    };
  }

  private extractNPI(practitioner: Record<string, unknown>): string {
    const identifiers = (practitioner.identifier as Record<string, unknown>[]) || [];
    const npi = identifiers.find(
      i => (i.system as string) === 'http://hl7.org/fhir/sid/us-npi',
    );
    return String(npi?.value || practitioner.id || '');
  }

  private formatName(practitioner: Record<string, unknown>): string {
    const names = (practitioner.name as Record<string, unknown>[]) || [];
    if (names.length === 0) return '';
    const name = names[0];
    const given = (name.given as string[]) || [];
    const family = name.family as string || '';
    const prefix = (name.prefix as string[]) || [];
    return [...prefix, ...given, family].filter(Boolean).join(' ');
  }

  private extractFirstSpecialty(role: Record<string, unknown>): { code: string; display?: string } | undefined {
    const specialties = (role.specialty as Record<string, unknown>[]) || [];
    if (specialties.length === 0) return undefined;
    const coding = (specialties[0].coding as Record<string, unknown>[]) || [];
    return coding[0]
      ? { code: String(coding[0].code || ''), display: coding[0].display as string }
      : undefined;
  }

  private extractSpecialties(role: Record<string, unknown>): { code: string; display?: string }[] {
    const specialties = (role.specialty as Record<string, unknown>[]) || [];
    return specialties.flatMap(s => {
      const coding = (s.coding as Record<string, unknown>[]) || [];
      return coding.map(c => ({ code: String(c.code || ''), display: c.display as string }));
    });
  }

  private extractLocationRefs(role: Record<string, unknown>): string[] {
    const locations = (role.location as Record<string, unknown>[]) || [];
    return locations.map(l => String(l.reference || l.display || ''));
  }

  private extractFirstAddress(role: Record<string, unknown>): FhirAddress | undefined {
    const locations = (role.location as Record<string, unknown>[]) || [];
    if (locations.length === 0) return undefined;
    const loc = locations[0];
    // location might be a reference; return empty if no address inline
    const addr = loc.address as Record<string, unknown> | undefined;
    if (!addr) return undefined;
    return {
      line: addr.line as string[],
      city: addr.city as string,
      state: addr.state as string,
      postalCode: addr.postalCode as string,
      country: addr.country as string,
    };
  }

  private mapLocationAddress(loc: Record<string, unknown>): FhirAddress | undefined {
    const addr = loc.address as Record<string, unknown> | undefined;
    if (!addr) return undefined;
    return {
      line: addr.line as string[],
      city: addr.city as string,
      state: addr.state as string,
      postalCode: addr.postalCode as string,
      country: addr.country as string,
    };
  }

  private extractPhone(role: Record<string, unknown>): string | undefined {
    const telecoms = (role.telecom as Record<string, unknown>[]) || [];
    const phone = telecoms.find(t => t.system === 'phone');
    return phone?.value as string | undefined;
  }

  private extractLocationPhone(loc: Record<string, unknown>): string | undefined {
    const telecoms = (loc.telecom as Record<string, unknown>[]) || [];
    const phone = telecoms.find(t => t.system === 'phone');
    return phone?.value as string | undefined;
  }

  private extractLocationContactBySystem(loc: Record<string, unknown>, system: string): string | undefined {
    const telecoms = (loc.telecom as Record<string, unknown>[]) || [];
    const match = telecoms.find(t => t.system === system);
    return match?.value as string | undefined;
  }

  private extractDisplay(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    return ref?.display as string | undefined;
  }

  private extractReferenceId(obj: Record<string, unknown>, field: string): string | undefined {
    const ref = obj[field] as Record<string, unknown> | undefined;
    const refStr = ref?.reference as string | undefined;
    return refStr ? refStr.split('/').pop() : undefined;
  }

  private extractFirstCode(cc: Record<string, unknown> | undefined): string | undefined {
    if (!cc) return undefined;
    const coding = (cc.coding as Record<string, unknown>[]) || [];
    return coding[0]?.code as string | undefined;
  }
}
