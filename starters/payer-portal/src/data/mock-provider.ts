// Mock data for the payer portal demo — Provider persona.
// In a real engagement, these come from the BFF via SDK hooks.

// ---------------------------------------------------------------------------
// Prior Auth Queue (provider-facing)
// ---------------------------------------------------------------------------

export const paQueue = [
  {
    id: 'paq-1',
    authNumber: 'PA-2026-1301',
    memberName: 'John Davis',
    memberId: 'MEM-2024-002103',
    urgency: 'urgent' as const,
    serviceCode: '27447',
    serviceDescription: 'Total Knee Replacement',
    requestingProvider: 'Dr. Maria Rodriguez',
    submittedDate: '2026-03-28',
    daysInQueue: 3,
    status: 'pending-clinical' as const,
    diagnosisCode: 'M17.11',
    diagnosisDescription: 'Primary osteoarthritis, right knee',
    notes: 'Conservative treatment failed after 6 months of PT. BMI 28. X-ray shows bone-on-bone.',
  },
  {
    id: 'paq-2',
    authNumber: 'PA-2026-1298',
    memberName: 'Emily Watson',
    memberId: 'MEM-2024-001592',
    urgency: 'routine' as const,
    serviceCode: '70553',
    serviceDescription: 'MRI Brain w/ & w/o Contrast',
    requestingProvider: 'Dr. Sarah Chen',
    submittedDate: '2026-03-25',
    daysInQueue: 6,
    status: 'pending-info' as const,
    diagnosisCode: 'R51.9',
    diagnosisDescription: 'Headache, unspecified',
    notes: 'Awaiting clinical notes from PCP. Headaches x 3 months, not responsive to OTC meds.',
  },
  {
    id: 'paq-3',
    authNumber: 'PA-2026-1310',
    memberName: 'Robert Martinez',
    memberId: 'MEM-2024-003421',
    urgency: 'urgent' as const,
    serviceCode: '43239',
    serviceDescription: 'Upper GI Endoscopy with Biopsy',
    requestingProvider: 'Dr. Thomas Brown',
    submittedDate: '2026-03-29',
    daysInQueue: 2,
    status: 'pending-clinical' as const,
    diagnosisCode: 'K21.0',
    diagnosisDescription: 'GERD with esophagitis',
    notes: 'Refractory GERD despite 8 weeks of PPI therapy. Weight loss 10 lbs. Dysphagia reported.',
  },
  {
    id: 'paq-4',
    authNumber: 'PA-2026-1287',
    memberName: 'Karen Liu',
    memberId: 'MEM-2024-001098',
    urgency: 'routine' as const,
    serviceCode: '97110',
    serviceDescription: 'Physical Therapy — 12 Sessions',
    requestingProvider: 'Dr. James Wu',
    submittedDate: '2026-03-22',
    daysInQueue: 9,
    status: 'auto-approved' as const,
    diagnosisCode: 'M54.5',
    diagnosisDescription: 'Low back pain',
    notes: 'Auto-approved per guideline PT-2026-LBP. First-line PT for acute LBP.',
  },
  {
    id: 'paq-5',
    authNumber: 'PA-2026-1315',
    memberName: 'David Chen',
    memberId: 'MEM-2024-004102',
    urgency: 'expedited' as const,
    serviceCode: '99205',
    serviceDescription: 'New Patient Specialist Visit — Oncology',
    requestingProvider: 'Dr. Sarah Chen',
    submittedDate: '2026-03-30',
    daysInQueue: 1,
    status: 'pending-clinical' as const,
    diagnosisCode: 'D49.9',
    diagnosisDescription: 'Neoplasm of unspecified behavior',
    notes: 'Expedited — abnormal lab findings, elevated PSA. PCP requesting urgent oncology consult.',
  },
  {
    id: 'paq-6',
    authNumber: 'PA-2026-1292',
    memberName: 'Susan Park',
    memberId: 'MEM-2024-002847',
    urgency: 'routine' as const,
    serviceCode: '90837',
    serviceDescription: 'Psychotherapy — 60 min',
    requestingProvider: 'Dr. Lisa Patel',
    submittedDate: '2026-03-24',
    daysInQueue: 7,
    status: 'pending-peer-review' as const,
    diagnosisCode: 'F41.1',
    diagnosisDescription: 'Generalized anxiety disorder',
    notes: 'Request for 24 additional sessions. Prior auth for initial 12 sessions expires March 31.',
  },
];

// ---------------------------------------------------------------------------
// Provider Statistics
// ---------------------------------------------------------------------------

export const providerStats = {
  totalSubmissions: 234,
  approvalRate: 78,
  avgTurnaroundDays: 2.3,
  pendingReview: 12,
  autoApprovalRate: 42,
  denialRate: 8,
  appealRate: 3.5,
  topDenialReasons: [
    { reason: 'Incomplete clinical documentation', count: 18 },
    { reason: 'Not medically necessary per guidelines', count: 12 },
    { reason: 'Out-of-network provider', count: 7 },
    { reason: 'Service requires step therapy', count: 5 },
  ],
};

// ---------------------------------------------------------------------------
// Sample Eligibility Result
// ---------------------------------------------------------------------------

export const sampleEligibilityResult = {
  member: {
    id: 'MEM-2024-001847',
    name: 'Sarah Thompson',
    dob: '1978-05-14',
    gender: 'female',
  },
  coverage: {
    planName: 'PPO Gold Plus',
    planType: 'PPO',
    groupNumber: 'GRP-887432',
    status: 'active' as const,
    effectiveDate: '2026-01-01',
    terminationDate: '2026-12-31',
  },
  benefits: {
    deductible: { individual: 1500, family: 3000, met: 687 },
    outOfPocketMax: { individual: 6000, family: 12000, met: 1247 },
    copay: {
      pcpVisit: 25,
      specialistVisit: 50,
      urgentCare: 75,
      emergencyRoom: 250,
    },
    coinsurance: {
      inNetwork: 20,
      outOfNetwork: 40,
    },
    pharmacy: {
      tier1Generic: 10,
      tier2Preferred: 35,
      tier3NonPreferred: 60,
      tier4Specialty: '20%',
    },
    services: [
      { service: 'Preventive Care', coverage: 'Covered 100%', authRequired: false },
      { service: 'Diagnostic Lab', coverage: 'Covered after deductible', authRequired: false },
      { service: 'Diagnostic Imaging', coverage: 'Covered after deductible', authRequired: true },
      { service: 'Inpatient Hospital', coverage: '80% after deductible', authRequired: true },
      { service: 'Outpatient Surgery', coverage: '80% after deductible', authRequired: true },
      { service: 'Physical Therapy', coverage: '80% after deductible, 30 visits/year', authRequired: true },
      { service: 'Mental Health Outpatient', coverage: '$50 copay', authRequired: false },
      { service: 'Mental Health Inpatient', coverage: '80% after deductible', authRequired: true },
      { service: 'Durable Medical Equipment', coverage: '80% after deductible', authRequired: true },
    ],
  },
  verified: true,
  verifiedAt: '2026-03-31T10:24:00Z',
};
