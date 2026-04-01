// Mock data for the payer portal demo — Member persona.
// In a real engagement, these come from the BFF via SDK hooks.

// ---------------------------------------------------------------------------
// Member Profile
// ---------------------------------------------------------------------------

export const memberProfile = {
  id: 'MEM-2024-001847',
  name: 'Sarah Thompson',
  dob: '1978-05-14',
  gender: 'female' as const,
  email: 'sarah.thompson@email.com',
  phone: '(617) 555-0142',
  address: {
    line: ['142 Beacon Street', 'Apt 3B'],
    city: 'Boston',
    state: 'MA',
    postalCode: '02116',
  },
};

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export const coverage = {
  id: 'COV-PPO-887432',
  planName: 'PPO Gold Plus',
  planType: 'PPO' as const,
  groupNumber: 'GRP-887432',
  memberId: 'MEM-2024-001847',
  status: 'active' as const,
  payerName: 'Meridian Health Plan',
  period: {
    start: '2026-01-01',
    end: '2026-12-31',
  },
};

// ---------------------------------------------------------------------------
// Accumulators (deductible, OOP max)
// ---------------------------------------------------------------------------

export const accumulators = [
  { type: 'deductible' as const, network: 'in-network' as const, limit: 1500, used: 687, remaining: 813 },
  { type: 'out-of-pocket-max' as const, network: 'in-network' as const, limit: 6000, used: 1247, remaining: 4753 },
  { type: 'deductible' as const, network: 'out-of-network' as const, limit: 3000, used: 0, remaining: 3000 },
];

// ---------------------------------------------------------------------------
// Digital ID Card
// ---------------------------------------------------------------------------

export const digitalIdCard = {
  memberId: 'MEM-2024-001847',
  memberName: 'Sarah Thompson',
  groupNumber: 'GRP-887432',
  planName: 'PPO Gold Plus',
  planType: 'PPO',
  rxBin: '610014',
  rxPcn: 'MHPRX',
  rxGroup: 'MHP2026',
  payerName: 'Meridian Health Plan',
  payerPhone: '1-800-555-0199',
  effectiveDate: '2026-01-01',
};

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const claims = [
  {
    id: 'clm-1',
    claimNumber: 'CLM-2026-4401',
    type: 'Professional',
    status: 'paid' as const,
    serviceDate: '2026-02-15',
    provider: 'Dr. Sarah Chen',
    procedureCode: '99213',
    description: 'Office visit — established patient, level 3',
    billedAmount: 150,
    allowedAmount: 135,
    paidAmount: 108,
    memberOwes: 27,
  },
  {
    id: 'clm-2',
    claimNumber: 'CLM-2026-4523',
    type: 'Facility',
    status: 'in-review' as const,
    serviceDate: '2026-03-10',
    provider: 'Boston Imaging Center',
    procedureCode: '70553',
    description: 'MRI Brain w/o & w/ contrast',
    billedAmount: 2800,
    allowedAmount: 2100,
    paidAmount: 0,
    memberOwes: 0,
  },
  {
    id: 'clm-3',
    claimNumber: 'CLM-2026-4102',
    type: 'Facility',
    status: 'adjudicated' as const,
    serviceDate: '2026-01-22',
    provider: 'Mass General ED',
    procedureCode: '99285',
    description: 'ED visit — high severity',
    billedAmount: 950,
    allowedAmount: 820,
    paidAmount: 656,
    memberOwes: 164,
  },
  {
    id: 'clm-4',
    claimNumber: 'CLM-2026-4612',
    type: 'Professional',
    status: 'paid' as const,
    serviceDate: '2026-02-28',
    provider: 'Quest Diagnostics',
    procedureCode: '80053',
    description: 'Comprehensive metabolic panel',
    billedAmount: 85,
    allowedAmount: 62,
    paidAmount: 62,
    memberOwes: 0,
  },
  {
    id: 'clm-5',
    claimNumber: 'CLM-2026-4701',
    type: 'Professional',
    status: 'paid' as const,
    serviceDate: '2026-03-01',
    provider: 'Dr. James Wu',
    procedureCode: '99214',
    description: 'Cardiology consult — established patient, level 4',
    billedAmount: 225,
    allowedAmount: 198,
    paidAmount: 158.40,
    memberOwes: 39.60,
  },
  {
    id: 'clm-6',
    claimNumber: 'CLM-2026-4830',
    type: 'Professional',
    status: 'submitted' as const,
    serviceDate: '2026-03-20',
    provider: 'PT Solutions',
    procedureCode: '97110',
    description: 'Physical therapy — therapeutic exercises',
    billedAmount: 175,
    allowedAmount: 0,
    paidAmount: 0,
    memberOwes: 0,
  },
  {
    id: 'clm-7',
    claimNumber: 'CLM-2026-4215',
    type: 'Dental',
    status: 'denied' as const,
    serviceDate: '2026-02-10',
    provider: 'Smile Dental',
    procedureCode: 'D1110',
    description: 'Dental prophylaxis — adult cleaning',
    billedAmount: 200,
    allowedAmount: 0,
    paidAmount: 0,
    memberOwes: 200,
  },
  {
    id: 'clm-8',
    claimNumber: 'CLM-2026-4910',
    type: 'Pharmacy',
    status: 'paid' as const,
    serviceDate: '2026-03-15',
    provider: 'CVS Pharmacy',
    procedureCode: 'NDC-00781-1506',
    description: 'Atorvastatin 20mg — 30 day supply',
    billedAmount: 45,
    allowedAmount: 38,
    paidAmount: 28,
    memberOwes: 10,
  },
];

// ---------------------------------------------------------------------------
// Claim Detail (full EOB for the MRI claim)
// ---------------------------------------------------------------------------

export const claimDetail = {
  id: 'clm-2',
  claimNumber: 'CLM-2026-4523',
  status: 'in-review' as const,
  serviceDate: '2026-03-10',
  receivedDate: '2026-03-12',
  provider: {
    name: 'Boston Imaging Center',
    npi: '1234567890',
    taxId: '04-1234567',
    address: '100 Longwood Ave, Boston, MA 02115',
  },
  patient: {
    name: 'Sarah Thompson',
    memberId: 'MEM-2024-001847',
    dob: '1978-05-14',
  },
  diagnosis: [
    { code: 'R51.9', description: 'Headache, unspecified' },
    { code: 'G43.909', description: 'Migraine, unspecified, not intractable' },
  ],
  serviceLines: [
    {
      lineNumber: 1,
      procedureCode: '70551',
      description: 'MRI Brain without contrast',
      serviceDate: '2026-03-10',
      billedAmount: 1800,
      allowedAmount: 1350,
      paidAmount: 0,
      memberOwes: 0,
      status: 'pending-review' as const,
    },
    {
      lineNumber: 2,
      procedureCode: '70553',
      description: 'MRI Brain with contrast',
      serviceDate: '2026-03-10',
      billedAmount: 1000,
      allowedAmount: 750,
      paidAmount: 0,
      memberOwes: 0,
      status: 'pending-review' as const,
    },
  ],
  adjudication: {
    totalBilled: 2800,
    totalAllowed: 2100,
    planPaid: 0,
    memberResponsibility: 0,
    adjustments: [
      { type: 'contractual', amount: 700, description: 'Provider contractual adjustment' },
    ],
    remarks: ['Claim is pending medical review. An additional clinical review is required before processing.'],
  },
  denialReason: 'Pending medical review — clinical documentation required to determine medical necessity per policy guideline MR-2026-IMG.',
};

// ---------------------------------------------------------------------------
// Prior Authorizations
// ---------------------------------------------------------------------------

export const priorAuths = [
  {
    id: 'pa-1',
    authNumber: 'PA-2026-1101',
    status: 'approved' as const,
    urgency: 'routine' as const,
    serviceCode: '70553',
    serviceDescription: 'MRI Lumbar Spine',
    requestingProvider: 'Dr. Sarah Chen',
    servicingProvider: 'Boston Imaging Center',
    submittedDate: '2026-02-15',
    decisionDate: '2026-02-20',
    expirationDate: '2026-05-20',
    diagnosisCode: 'M54.5',
    diagnosisDescription: 'Low back pain',
  },
  {
    id: 'pa-2',
    authNumber: 'PA-2026-1247',
    status: 'pending' as const,
    urgency: 'routine' as const,
    serviceCode: '27447',
    serviceDescription: 'Total Knee Replacement',
    requestingProvider: 'Dr. Maria Rodriguez',
    servicingProvider: 'Mass General Hospital',
    submittedDate: '2026-03-15',
    decisionDate: null,
    expirationDate: null,
    diagnosisCode: 'M17.11',
    diagnosisDescription: 'Primary osteoarthritis, right knee',
  },
  {
    id: 'pa-3',
    authNumber: 'PA-2026-1189',
    status: 'denied' as const,
    urgency: 'routine' as const,
    serviceCode: '90792',
    serviceDescription: 'Psychiatric Diagnostic Evaluation',
    requestingProvider: 'Dr. Sarah Chen',
    servicingProvider: 'Dr. Lisa Patel',
    submittedDate: '2026-03-01',
    decisionDate: '2026-03-05',
    expirationDate: null,
    diagnosisCode: 'F32.1',
    diagnosisDescription: 'Major depressive disorder, single episode, moderate',
    denialReason: 'Not medically necessary — initial evaluation can be performed by PCP per clinical guideline BH-2026-001.',
  },
  {
    id: 'pa-4',
    authNumber: 'PA-2026-1042',
    status: 'approved' as const,
    urgency: 'routine' as const,
    serviceCode: '97110',
    serviceDescription: 'Physical Therapy — 12 sessions',
    requestingProvider: 'Dr. James Wu',
    servicingProvider: 'PT Solutions',
    submittedDate: '2026-01-05',
    decisionDate: '2026-01-10',
    expirationDate: '2026-04-10',
    diagnosisCode: 'M79.3',
    diagnosisDescription: 'Panniculitis, unspecified',
  },
  {
    id: 'pa-5',
    authNumber: 'PA-2025-0987',
    status: 'expired' as const,
    urgency: 'routine' as const,
    serviceCode: '99205',
    serviceDescription: 'Specialist Referral — Endocrinology',
    requestingProvider: 'Dr. Sarah Chen',
    servicingProvider: 'Dr. Robert Kim',
    submittedDate: '2025-11-20',
    decisionDate: '2025-12-01',
    expirationDate: '2026-03-01',
    diagnosisCode: 'E11.9',
    diagnosisDescription: 'Type 2 diabetes mellitus without complications',
  },
];

// ---------------------------------------------------------------------------
// Providers (Find a Provider directory)
// ---------------------------------------------------------------------------

export const providers = [
  {
    id: 'prov-1',
    name: 'Dr. Sarah Chen',
    specialty: 'Family Medicine',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 0.3,
    rating: 4.8,
    reviewCount: 312,
    address: '100 Beacon Street, Suite 200, Boston, MA 02116',
    phone: '(617) 555-0201',
    languages: ['English', 'Mandarin'],
    gender: 'female' as const,
  },
  {
    id: 'prov-2',
    name: 'Dr. James Wu',
    specialty: 'Cardiology',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 1.2,
    rating: 4.9,
    reviewCount: 487,
    address: '250 Longwood Ave, Floor 5, Boston, MA 02115',
    phone: '(617) 555-0302',
    languages: ['English', 'Cantonese'],
    gender: 'male' as const,
  },
  {
    id: 'prov-3',
    name: 'Dr. Maria Rodriguez',
    specialty: 'Orthopedic Surgery',
    network: 'in-network' as const,
    acceptingNewPatients: false,
    distance: 2.1,
    rating: 4.7,
    reviewCount: 256,
    address: '55 Fruit Street, Wang Building, Boston, MA 02114',
    phone: '(617) 555-0403',
    languages: ['English', 'Spanish'],
    gender: 'female' as const,
  },
  {
    id: 'prov-4',
    name: 'Dr. Emily Park',
    specialty: 'Dermatology',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 0.8,
    rating: 4.5,
    reviewCount: 198,
    address: '330 Brookline Ave, Suite 110, Boston, MA 02215',
    phone: '(617) 555-0504',
    languages: ['English', 'Korean'],
    gender: 'female' as const,
  },
  {
    id: 'prov-5',
    name: 'Dr. Robert Kim',
    specialty: 'Endocrinology',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 3.4,
    rating: 4.6,
    reviewCount: 174,
    address: '1153 Centre Street, Suite 4, Boston, MA 02130',
    phone: '(617) 555-0605',
    languages: ['English'],
    gender: 'male' as const,
  },
  {
    id: 'prov-6',
    name: 'Dr. Lisa Patel',
    specialty: 'Psychiatry',
    network: 'out-of-network' as const,
    acceptingNewPatients: true,
    distance: 1.5,
    rating: 4.8,
    reviewCount: 221,
    address: '800 Washington Street, Suite 302, Boston, MA 02111',
    phone: '(617) 555-0706',
    languages: ['English', 'Hindi', 'Gujarati'],
    gender: 'female' as const,
  },
  {
    id: 'prov-7',
    name: 'Beacon Urgent Care',
    specialty: 'Urgent Care',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 0.5,
    rating: 4.2,
    reviewCount: 1045,
    address: '15 Charles Street, Boston, MA 02114',
    phone: '(617) 555-0807',
    languages: ['English', 'Spanish', 'Portuguese'],
    gender: null,
  },
  {
    id: 'prov-8',
    name: 'Dr. Thomas Brown',
    specialty: 'Gastroenterology',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 4.2,
    rating: 4.4,
    reviewCount: 142,
    address: '736 Cambridge Street, Suite 8, Brighton, MA 02135',
    phone: '(617) 555-0908',
    languages: ['English'],
    gender: 'male' as const,
  },
  {
    id: 'prov-9',
    name: 'Boston Women\'s Health',
    specialty: 'OB/GYN',
    network: 'in-network' as const,
    acceptingNewPatients: true,
    distance: 1.8,
    rating: 4.7,
    reviewCount: 389,
    address: '75 Francis Street, Suite 3A, Boston, MA 02115',
    phone: '(617) 555-1009',
    languages: ['English', 'Spanish', 'French'],
    gender: null,
  },
  {
    id: 'prov-10',
    name: 'Dr. David Lee',
    specialty: 'Pulmonology',
    network: 'in-network' as const,
    acceptingNewPatients: false,
    distance: 5.1,
    rating: 4.3,
    reviewCount: 98,
    address: '2100 Dorchester Ave, Suite 201, Dorchester, MA 02124',
    phone: '(617) 555-1110',
    languages: ['English', 'Vietnamese'],
    gender: 'male' as const,
  },
];

// ---------------------------------------------------------------------------
// Care Timeline
// ---------------------------------------------------------------------------

export const careTimeline = [
  {
    id: 'evt-1',
    type: 'visit' as const,
    title: 'Annual Wellness Visit',
    provider: 'Dr. Sarah Chen',
    facility: 'Beacon Street Family Medicine',
    date: '2026-01-05',
    status: 'completed' as const,
    summary: 'Routine wellness exam. Labs ordered — lipid panel, HbA1c, comprehensive metabolic panel.',
  },
  {
    id: 'evt-2',
    type: 'emergency' as const,
    title: 'ED Visit — Chest Pain',
    provider: 'Mass General ED',
    facility: 'Massachusetts General Hospital',
    date: '2026-01-22',
    status: 'completed' as const,
    summary: 'Presented with acute chest pain. EKG normal sinus rhythm. Troponin negative x2. Admitted for observation.',
  },
  {
    id: 'evt-3',
    type: 'admission' as const,
    title: 'Cardiac Observation Admission',
    provider: 'Mass General Hospital',
    facility: 'Massachusetts General Hospital',
    date: '2026-01-22',
    status: 'completed' as const,
    summary: 'Observation stay for chest pain workup. Stress echo performed — no wall motion abnormalities. Discharged stable.',
  },
  {
    id: 'evt-4',
    type: 'discharge' as const,
    title: 'Discharge — Mass General',
    provider: 'Mass General Hospital',
    facility: 'Massachusetts General Hospital',
    date: '2026-01-24',
    status: 'completed' as const,
    summary: 'Discharged with cardiology follow-up in 1 week. Continue atorvastatin. Referred to cardiac rehab.',
  },
  {
    id: 'evt-5',
    type: 'visit' as const,
    title: 'Cardiology Follow-up',
    provider: 'Dr. James Wu',
    facility: 'Longwood Cardiology Associates',
    date: '2026-02-01',
    status: 'completed' as const,
    summary: 'Post-discharge follow-up. Stable. Continue current medications. Enrolled in cardiac rehab program.',
  },
  {
    id: 'evt-6',
    type: 'lab' as const,
    title: 'Lab Work — Lipid Panel',
    provider: 'Quest Diagnostics',
    facility: 'Quest Diagnostics — Copley',
    date: '2026-02-28',
    status: 'completed' as const,
    summary: 'Total cholesterol 198, LDL 118, HDL 52, Triglycerides 140. HbA1c 6.8%. Improved from prior.',
  },
  {
    id: 'evt-7',
    type: 'imaging' as const,
    title: 'MRI Brain Ordered',
    provider: 'Boston Imaging Center',
    facility: 'Boston Imaging Center',
    date: '2026-03-10',
    status: 'in-progress' as const,
    summary: 'MRI ordered for persistent headaches. Claim under medical review for necessity determination.',
  },
  {
    id: 'evt-8',
    type: 'referral' as const,
    title: 'Endocrinology Referral',
    provider: 'Dr. Robert Kim',
    facility: 'Centre Street Endocrinology',
    date: '2026-04-15',
    status: 'planned' as const,
    summary: 'Referral for diabetes management optimization. HbA1c trending down but still above target.',
  },
];

// ---------------------------------------------------------------------------
// Care Team
// ---------------------------------------------------------------------------

export const careTeam = [
  {
    id: 'ct-1',
    name: 'Dr. Sarah Chen',
    role: 'Primary Care Physician' as const,
    specialty: 'Family Medicine',
    isPrimary: true,
    phone: '(617) 555-0201',
    email: 'schen@beaconfm.org',
    facility: 'Beacon Street Family Medicine',
  },
  {
    id: 'ct-2',
    name: 'Dr. James Wu',
    role: 'Specialist' as const,
    specialty: 'Cardiology',
    isPrimary: false,
    phone: '(617) 555-0302',
    email: 'jwu@longwoodcardio.org',
    facility: 'Longwood Cardiology Associates',
  },
  {
    id: 'ct-3',
    name: 'Lisa Park RN',
    role: 'Care Manager' as const,
    specialty: 'Care Coordination',
    isPrimary: false,
    phone: '(617) 555-0403',
    email: 'lpark@meridianhealth.com',
    facility: 'Meridian Health Plan',
  },
  {
    id: 'ct-4',
    name: 'Mark Johnson PharmD',
    role: 'Pharmacist' as const,
    specialty: 'Clinical Pharmacy',
    isPrimary: false,
    phone: '(617) 555-0504',
    email: 'mjohnson@cvs.com',
    facility: 'CVS Pharmacy — Beacon Hill',
  },
  {
    id: 'ct-5',
    name: 'Amy Garcia LCSW',
    role: 'Social Worker' as const,
    specialty: 'Behavioral Health',
    isPrimary: false,
    phone: '(617) 555-0605',
    email: 'agarcia@meridianhealth.com',
    facility: 'Meridian Health Plan',
  },
];

// ---------------------------------------------------------------------------
// Health Programs
// ---------------------------------------------------------------------------

export const programs = [
  {
    id: 'prog-1',
    name: 'Diabetes Management',
    status: 'enrolled' as const,
    enrolledDate: '2025-06-15',
    description: 'Comprehensive diabetes care program — self-management education, regular monitoring, and care coordination.',
    milestones: [
      { id: 'ms-1', label: 'HbA1c Check', status: 'completed' as const, completedDate: '2026-02-28' },
      { id: 'ms-2', label: 'Diet Counseling', status: 'completed' as const, completedDate: '2025-09-10' },
      { id: 'ms-3', label: 'Medication Review', status: 'completed' as const, completedDate: '2026-01-05' },
      { id: 'ms-4', label: 'Foot Exam', status: 'completed' as const, completedDate: '2026-01-05' },
      { id: 'ms-5', label: 'Eye Exam', status: 'pending' as const, dueDate: '2026-06-15' },
      { id: 'ms-6', label: 'Self-Management Class', status: 'pending' as const, dueDate: '2026-04-30' },
    ],
  },
  {
    id: 'prog-2',
    name: 'Cardiac Rehabilitation',
    status: 'enrolled' as const,
    enrolledDate: '2026-02-01',
    description: 'Phase II cardiac rehab — supervised exercise, risk factor modification, and lifestyle counseling.',
    milestones: [
      { id: 'ms-7', label: 'Initial Assessment', status: 'completed' as const, completedDate: '2026-02-05' },
      { id: 'ms-8', label: 'Session 3 of 12', status: 'completed' as const, completedDate: '2026-03-05' },
      { id: 'ms-9', label: 'Session 6 of 12', status: 'pending' as const, dueDate: '2026-04-01' },
      { id: 'ms-10', label: 'Session 9 of 12', status: 'pending' as const, dueDate: '2026-05-01' },
      { id: 'ms-11', label: 'Session 12 of 12', status: 'pending' as const, dueDate: '2026-06-01' },
      { id: 'ms-12', label: 'Completion Assessment', status: 'pending' as const, dueDate: '2026-06-15' },
    ],
  },
  {
    id: 'prog-3',
    name: 'Behavioral Health Support',
    status: 'enrolled' as const,
    enrolledDate: '2026-03-01',
    description: 'Integrated behavioral health — screening, counseling, and care coordination for depression management.',
    milestones: [
      { id: 'ms-13', label: 'PHQ-9 Screening', status: 'pending' as const, dueDate: '2026-04-01' },
      { id: 'ms-14', label: 'Initial Counseling Session', status: 'pending' as const, dueDate: '2026-04-15' },
      { id: 'ms-15', label: 'Follow-up Assessment', status: 'pending' as const, dueDate: '2026-06-01' },
      { id: 'ms-16', label: 'Care Plan Review', status: 'pending' as const, dueDate: '2026-07-01' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = [
  { id: 'notif-1', title: 'Your MRI Brain claim is under review', message: 'Claim CLM-2026-4523 is pending medical review. We will notify you when a decision is made.', read: false, date: '2026-03-12', category: 'claims' as const },
  { id: 'notif-2', title: 'Prior auth approved: Physical Therapy 12 sessions', message: 'Your authorization PA-2026-1042 for physical therapy has been approved through April 10, 2026.', read: true, date: '2026-01-12', category: 'auth' as const },
  { id: 'notif-3', title: 'Care gap alert: Colorectal cancer screening overdue', message: 'You are due for colorectal cancer screening. Please schedule with your PCP.', read: false, date: '2026-03-01', category: 'care-gap' as const },
  { id: 'notif-4', title: 'New EOB available for ED Visit', message: 'Your Explanation of Benefits for the January 22 ED visit is now available.', read: true, date: '2026-02-05', category: 'claims' as const },
  { id: 'notif-5', title: 'Prior auth denied: Psychiatric Evaluation', message: 'Authorization PA-2026-1189 was denied. You may appeal this decision within 60 days.', read: false, date: '2026-03-07', category: 'auth' as const },
  { id: 'notif-6', title: 'Appointment reminder: Dr. Kim on April 15', message: 'You have an upcoming appointment with Dr. Robert Kim (Endocrinology) on April 15, 2026 at 10:00 AM.', read: false, date: '2026-04-10', category: 'appointment' as const },
  { id: 'notif-7', title: 'Your prescription refill is ready at CVS', message: 'Atorvastatin 20mg 30-day supply is ready for pickup at CVS Pharmacy — Beacon Hill.', read: true, date: '2026-03-16', category: 'pharmacy' as const },
  { id: 'notif-8', title: 'Care gap alert: Annual flu shot recommended', message: 'You have not received a flu vaccination this season. Contact your PCP to schedule.', read: false, date: '2026-03-20', category: 'care-gap' as const },
  { id: 'notif-9', title: 'Deductible update: $687 of $1,500 met', message: 'Your in-network deductible is 46% met for the 2026 plan year. $813 remaining.', read: true, date: '2026-03-01', category: 'benefits' as const },
  { id: 'notif-10', title: 'Cardiac Rehab: Session 3 completed', message: 'Great progress! You have completed 3 of 12 cardiac rehabilitation sessions.', read: true, date: '2026-03-05', category: 'programs' as const },
];

// ---------------------------------------------------------------------------
// Dashboard Stats (for StatsDisplay)
// ---------------------------------------------------------------------------

export const dashboardStats = [
  { label: 'Open Claims', value: 3, delta: { value: -2, label: 'vs last month' } },
  { label: 'Pending PAs', value: 1, delta: { value: 0, label: 'no change' } },
  { label: 'Care Gaps', value: 4, delta: { value: 1, label: 'action needed' } },
  { label: 'Next Appointment', value: 'Apr 15', format: 'text' as const },
];

// ---------------------------------------------------------------------------
// Claims Trend Data (for Chart)
// ---------------------------------------------------------------------------

export const claimsTrendData = [
  { month: 'Oct', submitted: 3, paid: 2, denied: 0 },
  { month: 'Nov', submitted: 2, paid: 2, denied: 1 },
  { month: 'Dec', submitted: 4, paid: 3, denied: 0 },
  { month: 'Jan', submitted: 3, paid: 2, denied: 0 },
  { month: 'Feb', submitted: 5, paid: 4, denied: 1 },
  { month: 'Mar', submitted: 4, paid: 2, denied: 1 },
];

// ---------------------------------------------------------------------------
// Spending by Category (for Chart)
// ---------------------------------------------------------------------------

export const spendingByCategory = [
  { category: 'Medical', amount: 3200 },
  { category: 'Pharmacy', amount: 540 },
  { category: 'Dental', amount: 200 },
  { category: 'Vision', amount: 150 },
  { category: 'Behavioral', amount: 0 },
];
