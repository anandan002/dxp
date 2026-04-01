import { uuid, pick, randomDate } from '../config';

const PA_SERVICES = [
  { code: '70553', display: 'MRI Brain' },
  { code: '27447', display: 'Total Knee Replacement' },
  { code: '90792', display: 'Psychiatric Evaluation' },
  { code: '97110', display: 'Physical Therapy' },
  { code: '99205', display: 'Specialist Referral' },
];
const STATUSES = ['active', 'active', 'cancelled', 'draft'];
const DECISIONS = ['approved', 'denied', 'pended', 'approved', 'approved'];

export function generatePriorAuths(patients: any[], coverages: any[], practitionerIds: string[] = []): any[] {
  const auths: any[] = [];
  patients.forEach((p, idx) => {
    if (Math.random() > 0.6) return;
    const count = Math.random() > 0.5 ? 2 : 1;
    const cov = coverages[idx];
    for (let i = 0; i < count; i++) {
      const svc = pick(PA_SERVICES);
      const provId = practitionerIds.length > 0 ? pick(practitionerIds) : uuid();
      auths.push({
        resourceType: 'Claim',
        id: uuid(),
        status: pick(STATUSES),
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
        use: 'preauthorization',
        patient: { reference: `Patient/${p.id}` },
        created: randomDate('2025-06-01', '2026-03-31'),
        insurer: { reference: 'Organization/payer-001' },
        provider: { reference: `Practitioner/${provId}` },
        priority: { coding: [{ code: pick(['routine', 'urgent']) }] },
        insurance: [{ sequence: 1, focal: true, coverage: { reference: `Coverage/${cov.id}` } }],
        item: [{
          sequence: 1,
          productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: svc.code, display: svc.display }] },
          servicedDate: randomDate('2026-01-01', '2026-12-31'),
        }],
        extension: [{
          url: 'http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-reviewAction',
          valueCodeableConcept: { coding: [{ code: pick(DECISIONS) }] },
        }],
      });
    }
  });
  return auths;
}
