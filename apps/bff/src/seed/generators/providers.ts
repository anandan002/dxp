import { SEED_CONFIG, uuid, pick, rand } from '../config';

const SPECIALTIES = [
  { code: '208D00000X', display: 'General Practice' },
  { code: '207RC0000X', display: 'Cardiovascular Disease' },
  { code: '207X00000X', display: 'Orthopedic Surgery' },
  { code: '207N00000X', display: 'Dermatology' },
  { code: '207RE0101X', display: 'Endocrinology' },
  { code: '2084P0800X', display: 'Psychiatry' },
  { code: '207RG0100X', display: 'Gastroenterology' },
  { code: '207RP1001X', display: 'Pulmonary Disease' },
  { code: '207V00000X', display: 'Obstetrics & Gynecology' },
  { code: '261QU0200X', display: 'Urgent Care' },
];
const FIRST = ['Sarah', 'James', 'Maria', 'Robert', 'Emily', 'Michael', 'Lisa', 'David', 'Jennifer', 'Thomas'];
const LAST = ['Chen', 'Wu', 'Rodriguez', 'Kim', 'Park', 'Patel', 'Brown', 'Garcia', 'Lee', 'Wilson'];
const SUFFIXES = ['MD', 'DO', 'MD', 'MD', 'DO'];

export function generateProviders(): any[] {
  const resources: any[] = [];
  for (let i = 0; i < SEED_CONFIG.providerCount; i++) {
    const id = uuid();
    const orgId = uuid();
    const spec = pick(SPECIALTIES);
    const first = pick(FIRST);
    const last = pick(LAST);
    const npi = String(1000000000 + i);

    resources.push({
      resourceType: 'Practitioner',
      id,
      identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: npi }],
      active: true,
      name: [{ use: 'official', given: [first], family: last, suffix: [pick(SUFFIXES)] }],
      telecom: [{ system: 'phone', value: `(617) 555-${String(rand(1000, 9999))}`, use: 'work' }],
    });

    resources.push({
      resourceType: 'Organization',
      id: orgId,
      active: true,
      name: `${last} Medical Group`,
      type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov' }] }],
      address: [{ line: [`${rand(1, 999)} Medical Center Dr`], city: 'Boston', state: 'MA', postalCode: '02116' }],
    });

    resources.push({
      resourceType: 'PractitionerRole',
      id: uuid(),
      practitioner: { reference: `Practitioner/${id}` },
      organization: { reference: `Organization/${orgId}` },
      specialty: [{ coding: [{ system: 'http://nucc.org/provider-taxonomy', code: spec.code, display: spec.display }] }],
      availableTime: [{ daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'], availableStartTime: '08:00:00', availableEndTime: '17:00:00' }],
    });
  }
  return resources;
}
