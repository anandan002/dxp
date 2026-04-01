import { SEED_CONFIG, uuid, pick, rand, randomDate } from '../config';

const FIRST_NAMES = ['Sarah', 'James', 'Maria', 'Robert', 'Emily', 'Michael', 'Lisa', 'David', 'Jennifer', 'Thomas', 'Amy', 'Daniel', 'Patricia', 'William', 'Jessica', 'Richard', 'Susan', 'Joseph', 'Karen', 'Charles', 'Nancy', 'Mark', 'Betty', 'Donald', 'Margaret'];
const LAST_NAMES = ['Thompson', 'Wu', 'Rodriguez', 'Kim', 'Park', 'Patel', 'Chen', 'Brown', 'Garcia', 'Lee', 'Wilson', 'Johnson', 'Davis', 'Miller', 'Taylor', 'Anderson', 'White', 'Harris', 'Clark', 'Lewis'];
const STREETS = ['Beacon St', 'Commonwealth Ave', 'Boylston St', 'Tremont St', 'Newbury St', 'Cambridge St', 'Huntington Ave', 'Marlborough St', 'Charles St', 'Harvard St'];
const CITIES = ['Boston', 'Cambridge', 'Brookline', 'Somerville', 'Newton', 'Quincy', 'Waltham', 'Medford'];
const ZIPS = ['02116', '02134', '02139', '02144', '02458', '02169', '02451', '02155'];

// Fixed dev patient — matches DEV_MEMBER_ID in jwt-auth.guard.ts bypass mode.
// Always first in the array so EOB/PA generators include claims for this member.
export const DEV_PATIENT = {
  resourceType: 'Patient',
  id: '7de24de3-a6ee-464e-88ad-004799281205',
  identifier: [
    { system: 'urn:oid:2.16.840.1.113883.19.5', value: 'MEM-2024-000001' },
  ],
  name: [{ use: 'official', given: ['James'], family: 'Garcia' }],
  telecom: [
    { system: 'phone', value: '(617) 555-0100', use: 'home' },
    { system: 'email', value: 'james.garcia@email.com', use: 'home' },
  ],
  gender: 'male',
  birthDate: '1952-04-15',
  address: [{
    use: 'home',
    line: ['142 Beacon St'],
    city: 'Boston',
    state: 'MA',
    postalCode: '02116',
    country: 'US',
  }],
  maritalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus', code: 'M' }] },
};

export function generatePatients(): any[] {
  const patients: any[] = [DEV_PATIENT];
  for (let i = 1; i < SEED_CONFIG.patientCount; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const cityIdx = rand(0, CITIES.length - 1);
    patients.push({
      resourceType: 'Patient',
      id: uuid(),
      identifier: [
        { system: 'urn:oid:2.16.840.1.113883.19.5', value: `MEM-${2024}-${String(i + 1).padStart(6, '0')}` },
      ],
      name: [{ use: 'official', given: [first], family: last }],
      telecom: [
        { system: 'phone', value: `(617) 555-${String(rand(1000, 9999))}`, use: 'home' },
        { system: 'email', value: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`, use: 'home' },
      ],
      gender: pick(['male', 'female']),
      birthDate: randomDate('1940-01-01', '2005-12-31'),
      address: [{
        use: 'home',
        line: [`${rand(1, 999)} ${pick(STREETS)}`],
        city: CITIES[cityIdx],
        state: 'MA',
        postalCode: ZIPS[cityIdx],
        country: 'US',
      }],
      maritalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus', code: pick(['M', 'S', 'D', 'W']) }] },
    });
  }
  return patients;
}
