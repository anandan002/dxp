import { uuid, pick, randomDate } from '../config';

const CONSENT_CATEGORIES = [
  { code: '59284-0', display: 'Consent Document', policy: 'data-sharing' },
  { code: '57016-8', display: 'Privacy policy acknowledgement', policy: 'privacy' },
  { code: '64292-6', display: 'Release of information consent', policy: 'release-of-info' },
];

const SCOPE_CODES = [
  { code: 'patient-privacy', display: 'Privacy Consent', system: 'http://terminology.hl7.org/CodeSystem/consentscope' },
  { code: 'research', display: 'Research', system: 'http://terminology.hl7.org/CodeSystem/consentscope' },
  { code: 'treatment', display: 'Treatment', system: 'http://terminology.hl7.org/CodeSystem/consentscope' },
];

export function generateConsents(patients: any[]): any[] {
  const consents: any[] = [];

  for (const patient of patients) {
    const numConsents = Math.random() > 0.3 ? 2 : 1;
    for (let i = 0; i < numConsents; i++) {
      const category = pick(CONSENT_CATEGORIES);
      const scope = pick(SCOPE_CODES);
      consents.push({
        resourceType: 'Consent',
        id: uuid(),
        status: pick(['active', 'active', 'active', 'inactive']),
        scope: {
          coding: [{ system: scope.system, code: scope.code, display: scope.display }],
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: category.code,
            display: category.display,
          }],
        }],
        patient: { reference: `Patient/${patient.id}` },
        dateTime: randomDate('2024-01-01', '2026-01-01'),
        performer: [{ reference: `Patient/${patient.id}` }],
        organization: [{ reference: 'Organization/payer-001', display: 'Meridian Health Plan' }],
        policyRule: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: category.policy,
            display: category.display,
          }],
        },
        provision: {
          type: 'permit',
          period: {
            start: randomDate('2024-01-01', '2025-01-01'),
            end: randomDate('2026-06-01', '2028-12-31'),
          },
          purpose: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
            code: 'TREAT',
            display: 'Treatment',
          }],
        },
      });
    }
  }

  return consents;
}
