import { Injectable, Logger } from '@nestjs/common';
import { ConsentPort } from '../ports/consent.port';
import { FhirClient } from '../../fhir-core/fhir-client.service';
import type { ConsentRecord, ConsentDecision } from '@dxp/contracts';

@Injectable()
export class FhirConsentAdapter extends ConsentPort {
  private readonly logger = new Logger(FhirConsentAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async getConsents(tenantId: string, memberId: string): Promise<ConsentRecord[]> {
    const bundle = await this.fhir.search('Consent', { patient: `Patient/${memberId}` });
    return (bundle.entry ?? []).map((e: any) => this.mapConsent(e.resource));
  }

  async grantConsent(tenantId: string, memberId: string, decision: ConsentDecision): Promise<ConsentRecord> {
    const resource = {
      resourceType: 'Consent',
      status: 'active',
      scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: decision.scope }] },
      patient: { reference: `Patient/${memberId}` },
      dateTime: new Date().toISOString(),
      category: (decision.categories ?? []).map((c) => ({ text: c })),
      provision: { period: { start: new Date().toISOString().split('T')[0], end: decision.expirationDate } },
    };
    const created = await this.fhir.create('Consent', resource);
    return this.mapConsent(created);
  }

  async revokeConsent(tenantId: string, consentId: string): Promise<void> {
    const existing = await this.fhir.read<Record<string, unknown>>('Consent', consentId);
    await this.fhir.update('Consent', consentId, { ...existing, status: 'inactive' });
  }

  private mapConsent(r: any): ConsentRecord {
    return {
      id: r.id,
      memberId: r.patient?.reference?.replace('Patient/', '') ?? '',
      status: r.status ?? 'active',
      scope: r.scope?.coding?.[0]?.code ?? 'patient-privacy',
      description: r.scope?.coding?.[0]?.display ?? r.scope?.text ?? 'Privacy consent',
      grantedDate: r.dateTime ?? '',
      expirationDate: r.provision?.period?.end,
      categories: (r.category ?? []).map((c: any) => c.text ?? c.coding?.[0]?.display ?? ''),
    };
  }
}
