import { uuid, pick } from '../config';

const PLANS = [
  { code: 'HMO', display: 'HMO Gold', copay: 25, deductible: 1500 },
  { code: 'PPO', display: 'PPO Gold Plus', copay: 40, deductible: 1500 },
  { code: 'HDHP', display: 'HDHP Bronze', copay: 0, deductible: 7000 },
  { code: 'MA', display: 'Medicare Advantage', copay: 15, deductible: 0 },
];

export function generateCoverage(patients: any[]): any[] {
  return patients.map((p) => {
    const plan = pick(PLANS);
    return {
      resourceType: 'Coverage',
      id: uuid(),
      status: 'active',
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: plan.code, display: plan.display }] },
      subscriber: { reference: `Patient/${p.id}` },
      beneficiary: { reference: `Patient/${p.id}` },
      relationship: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship', code: 'self' }] },
      period: { start: '2026-01-01', end: '2026-12-31' },
      payor: [{ reference: 'Organization/payer-001', display: 'Meridian Health Plan' }],
      class: [
        { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'plan' }] }, value: plan.code, name: plan.display },
        { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'group' }] }, value: `GRP-${String(Math.floor(Math.random() * 900000) + 100000)}` },
      ],
      costToBeneficiary: [
        { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-copay-type', code: 'copay' }] }, valueMoney: { value: plan.copay, currency: 'USD' } },
        { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-copay-type', code: 'deductible' }] }, valueMoney: { value: plan.deductible, currency: 'USD' } },
      ],
    };
  });
}
