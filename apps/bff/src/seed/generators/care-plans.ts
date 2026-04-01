import { SEED_CONFIG, uuid, pick, rand, randomDate } from '../config';

// DEV_MEMBER_ID is always included so care pages work in dev auth bypass mode
const DEV_MEMBER_ID = '7de24de3-a6ee-464e-88ad-004799281205';

const CONDITIONS = [
  { code: 'I50.9', display: 'Heart Failure' },
  { code: 'E11.9', display: 'Type 2 Diabetes' },
  { code: 'N18.3', display: 'Chronic Kidney Disease Stage 3' },
  { code: 'I10', display: 'Hypertension' },
  { code: 'J44.1', display: 'COPD with Acute Exacerbation' },
  { code: 'F32.1', display: 'Major Depressive Disorder' },
];

const CARE_CATEGORIES = [
  { code: 'assess-plan', display: 'Assessment and Plan of Treatment' },
  { code: 'disease-mgmt', display: 'Disease Management' },
  { code: 'care-coords', display: 'Care Coordination' },
];

const ACTIVITIES = [
  'Annual wellness visit',
  'Medication reconciliation',
  'Specialist referral',
  'Lab work order',
  'Blood pressure monitoring',
  'Diabetes management program',
  'Smoking cessation counseling',
  'Weight management',
  'Physical therapy evaluation',
  'Nutritional counseling',
];

const ENCOUNTER_TYPES = [
  { code: 'AMB', display: 'Ambulatory' },
  { code: 'IMP', display: 'Inpatient' },
  { code: 'EMER', display: 'Emergency' },
  { code: 'HH', display: 'Home Health' },
];

const ENCOUNTER_REASONS = [
  { code: 'I50.9', display: 'Heart Failure follow-up' },
  { code: 'E11.65', display: 'Diabetes with hyperglycemia' },
  { code: 'I10', display: 'Hypertension management' },
  { code: 'Z00.00', display: 'Annual physical exam' },
  { code: 'Z23', display: 'Vaccine administration' },
  { code: 'J06.9', display: 'Acute upper respiratory infection' },
  { code: 'R51', display: 'Headache' },
  { code: 'M54.5', display: 'Low back pain' },
];

const CARE_TEAM_ROLES = [
  { code: 'PP', display: 'Primary Care Provider', specialty: 'General Practice' },
  { code: '56397003', display: 'Cardiologist', specialty: 'Cardiology' },
  { code: '11911009', display: 'Nephrologist', specialty: 'Nephrology' },
  { code: '309343006', display: 'Care Manager', specialty: 'Care Management' },
  { code: '106292003', display: 'Nurse Practitioner', specialty: 'Family Practice' },
];

export function generateCarePlans(patients: any[], practitionerIds: string[]): {
  carePlans: any[];
  encounters: any[];
  careTeams: any[];
  conditions: any[];
} {
  const carePlans: any[] = [];
  const encounters: any[] = [];
  const careTeams: any[] = [];
  const conditions: any[] = [];

  // Ensure dev member patient exists in the list (or add stub)
  const patientIds = patients.map((p: any) => p.id);
  if (!patientIds.includes(DEV_MEMBER_ID)) {
    patientIds.unshift(DEV_MEMBER_ID);
  }

  for (const patientId of patientIds) {
    const numConditions = rand(1, 3);
    const patientConditions = [];

    // Create Condition resources
    for (let c = 0; c < numConditions; c++) {
      const cond = pick(CONDITIONS);
      const conditionId = uuid();
      patientConditions.push({ id: conditionId, ...cond });
      conditions.push({
        resourceType: 'Condition',
        id: conditionId,
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }],
        },
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item',
          }],
        }],
        code: {
          coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: cond.code, display: cond.display }],
          text: cond.display,
        },
        subject: { reference: `Patient/${patientId}` },
        onsetDateTime: randomDate('2020-01-01', '2025-06-01'),
        recordedDate: randomDate('2025-01-01', '2026-01-01'),
      });
    }

    // Create CareTeam
    const careTeamId = uuid();
    const numTeamMembers = rand(2, 4);
    const teamMembers = [];
    for (let m = 0; m < numTeamMembers; m++) {
      const role = pick(CARE_TEAM_ROLES);
      const practId = practitionerIds.length > 0 ? pick(practitionerIds) : uuid();
      teamMembers.push({
        role: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: role.code,
            display: role.display,
          }],
        }],
        member: { reference: `Practitioner/${practId}`, display: role.specialty },
      });
    }

    careTeams.push({
      resourceType: 'CareTeam',
      id: careTeamId,
      status: 'active',
      name: 'Integrated Care Team',
      subject: { reference: `Patient/${patientId}` },
      period: { start: randomDate('2025-01-01', '2025-06-01') },
      participant: teamMembers,
      reasonCode: patientConditions.slice(0, 2).map(c => ({
        coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: c.code, display: c.display }],
      })),
    });

    // Create CarePlan
    const carePlanId = uuid();
    const numActivities = rand(2, 5);
    const planActivities = [];
    for (let a = 0; a < numActivities; a++) {
      planActivities.push({
        detail: {
          kind: 'ServiceRequest',
          status: pick(['scheduled', 'in-progress', 'completed', 'not-started']),
          intent: 'plan',
          description: pick(ACTIVITIES),
          scheduledString: randomDate('2026-01-01', '2026-12-31'),
        },
      });
    }

    carePlans.push({
      resourceType: 'CarePlan',
      id: carePlanId,
      status: 'active',
      intent: 'plan',
      category: [{
        coding: [{
          system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category',
          code: pick(CARE_CATEGORIES).code,
          display: pick(CARE_CATEGORIES).display,
        }],
      }],
      title: `Care Plan — ${patientConditions[0]?.display || 'Wellness'}`,
      description: 'Coordinated care plan for chronic condition management',
      subject: { reference: `Patient/${patientId}` },
      period: {
        start: randomDate('2025-01-01', '2025-06-01'),
        end: randomDate('2026-06-01', '2026-12-31'),
      },
      careTeam: [{ reference: `CareTeam/${careTeamId}` }],
      addresses: patientConditions.map(c => ({
        reference: `Condition/${c.id}`,
        display: c.display,
      })),
      goal: [{
        display: `Improve management of ${patientConditions[0]?.display || 'chronic conditions'}`,
      }],
      activity: planActivities,
    });

    // Create Encounters (2-5 per patient)
    const numEncounters = rand(2, 5);
    for (let e = 0; e < numEncounters; e++) {
      const encType = pick(ENCOUNTER_TYPES);
      const reason = pick(ENCOUNTER_REASONS);
      const practId = practitionerIds.length > 0 ? pick(practitionerIds) : uuid();
      const startDate = randomDate('2025-01-01', '2026-03-01');
      encounters.push({
        resourceType: 'Encounter',
        id: uuid(),
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: encType.code,
          display: encType.display,
        },
        type: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: '11429006',
            display: 'Consultation',
          }],
        }],
        subject: { reference: `Patient/${patientId}` },
        participant: [{
          individual: { reference: `Practitioner/${practId}` },
        }],
        period: {
          start: startDate,
          end: startDate,
        },
        reasonCode: [{
          coding: [{
            system: 'http://hl7.org/fhir/sid/icd-10-cm',
            code: reason.code,
            display: reason.display,
          }],
        }],
        hospitalization: encType.code === 'IMP' ? {
          admitSource: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/admit-source', code: 'emd' }],
          },
          dischargeDisposition: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition', code: 'home' }],
          },
        } : undefined,
      });
    }
  }

  return { carePlans, encounters, careTeams, conditions };
}
