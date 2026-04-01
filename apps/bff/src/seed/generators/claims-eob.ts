import { uuid, pick, rand, randomDate } from '../config';

const CPT_CODES = [
  { code: '99213', display: 'Office visit, est. patient', price: 150 },
  { code: '99214', display: 'Office visit, detailed', price: 225 },
  { code: '99215', display: 'Office visit, comprehensive', price: 350 },
  { code: '99285', display: 'ED visit, high severity', price: 950 },
  { code: '70553', display: 'MRI Brain w/wo contrast', price: 2800 },
  { code: '80053', display: 'Comprehensive metabolic panel', price: 85 },
  { code: '97110', display: 'Therapeutic exercises', price: 175 },
  { code: '43239', display: 'Upper GI endoscopy w/ biopsy', price: 3500 },
  { code: '36415', display: 'Venipuncture', price: 25 },
  { code: '71046', display: 'Chest X-ray 2 views', price: 120 },
];
const OUTCOMES = ['complete', 'complete', 'complete', 'queued', 'error'];

export function generateClaimsEOB(patients: any[], coverages: any[], practitionerIds: string[] = []): any[] {
  const eobs: any[] = [];
  patients.forEach((p, idx) => {
    const count = rand(3, 8);
    const cov = coverages[idx];
    for (let i = 0; i < count; i++) {
      const cpt = pick(CPT_CODES);
      const planPays = Math.round(cpt.price * 0.8);
      const memberPays = cpt.price - planPays;
      const provId = practitionerIds.length > 0 ? pick(practitionerIds) : uuid();
      eobs.push({
        resourceType: 'ExplanationOfBenefit',
        id: uuid(),
        status: 'active',
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
        use: 'claim',
        patient: { reference: `Patient/${p.id}` },
        billablePeriod: { start: randomDate('2025-06-01', '2026-03-31'), end: randomDate('2025-06-01', '2026-03-31') },
        created: new Date().toISOString(),
        insurer: { reference: 'Organization/payer-001' },
        provider: { reference: `Practitioner/${provId}` },
        outcome: pick(OUTCOMES),
        insurance: [{ focal: true, coverage: { reference: `Coverage/${cov.id}` } }],
        item: [{
          sequence: 1,
          productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: cpt.code, display: cpt.display }] },
          servicedDate: randomDate('2025-06-01', '2026-03-31'),
          net: { value: cpt.price, currency: 'USD' },
          adjudication: [
            { category: { coding: [{ code: 'submitted' }] }, amount: { value: cpt.price, currency: 'USD' } },
            { category: { coding: [{ code: 'benefit' }] }, amount: { value: planPays, currency: 'USD' } },
            { category: { coding: [{ code: 'copay' }] }, amount: { value: memberPays, currency: 'USD' } },
          ],
        }],
        total: [
          { category: { coding: [{ code: 'submitted' }] }, amount: { value: cpt.price, currency: 'USD' } },
          { category: { coding: [{ code: 'benefit' }] }, amount: { value: planPays, currency: 'USD' } },
        ],
      });
    }
  });
  return eobs;
}
