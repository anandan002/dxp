// Mock data for the insurance portal demo.
// In a real engagement, these come from the BFF via SDK hooks.

export const dashboardStats = {
  activePolicies: { value: 3, trend: { value: 0, label: 'vs last month' } },
  openClaims: { value: 1, trend: { value: -50, label: 'vs last month' } },
  pendingDocuments: { value: 2, trend: { value: 100, label: 'new this week' } },
  nextPayment: { value: '$482.00', subtitle: 'Due Apr 15, 2026' },
};

export const policies = [
  { id: 'POL-001', type: 'Auto', name: '2024 Tesla Model 3', status: 'Active', premium: '$185/mo', renewalDate: '2026-08-15', coverage: '$500,000' },
  { id: 'POL-002', type: 'Home', name: '742 Evergreen Terrace', status: 'Active', premium: '$215/mo', renewalDate: '2026-11-01', coverage: '$850,000' },
  { id: 'POL-003', type: 'Life', name: 'Term Life — 20 Year', status: 'Active', premium: '$82/mo', renewalDate: '2035-03-01', coverage: '$1,000,000' },
  { id: 'POL-004', type: 'Auto', name: '2022 Honda Civic', status: 'Expired', premium: '$142/mo', renewalDate: '2025-12-01', coverage: '$300,000' },
];

export const claims = [
  { id: 'CLM-2024-001', policyId: 'POL-001', type: 'Collision', description: 'Rear-end collision at intersection', status: 'Processing', filedDate: '2026-03-10', amount: '$4,200' },
  { id: 'CLM-2024-002', policyId: 'POL-002', type: 'Water Damage', description: 'Pipe burst in basement', status: 'Approved', filedDate: '2026-02-15', amount: '$12,500' },
  { id: 'CLM-2023-003', policyId: 'POL-001', type: 'Windshield', description: 'Cracked windshield from road debris', status: 'Approved', filedDate: '2025-11-20', amount: '$850' },
];

export const documents = [
  { id: 'DOC-001', name: 'Auto Policy Declaration — POL-001.pdf', category: 'Policy', uploadedAt: '2026-01-15', size: '245 KB' },
  { id: 'DOC-002', name: 'Home Inspection Report.pdf', category: 'Policy', uploadedAt: '2025-11-10', size: '1.2 MB' },
  { id: 'DOC-003', name: 'Collision Photos — CLM-2024-001.zip', category: 'Claim', uploadedAt: '2026-03-10', size: '8.4 MB' },
  { id: 'DOC-004', name: 'Repair Estimate — CLM-2024-001.pdf', category: 'Claim', uploadedAt: '2026-03-12', size: '320 KB' },
  { id: 'DOC-005', name: 'Water Damage Assessment.pdf', category: 'Claim', uploadedAt: '2026-02-16', size: '2.1 MB' },
];

export const claimsChartData = [
  { month: 'Oct', filed: 3, resolved: 2 },
  { month: 'Nov', filed: 2, resolved: 3 },
  { month: 'Dec', filed: 1, resolved: 1 },
  { month: 'Jan', filed: 4, resolved: 2 },
  { month: 'Feb', filed: 2, resolved: 4 },
  { month: 'Mar', filed: 1, resolved: 1 },
];

export const premiumChartData = [
  { month: 'Oct', amount: 482 },
  { month: 'Nov', amount: 482 },
  { month: 'Dec', amount: 482 },
  { month: 'Jan', amount: 497 },
  { month: 'Feb', amount: 497 },
  { month: 'Mar', amount: 497 },
];

export const claimProcessingSteps = [
  { label: 'Claim Filed', description: 'Submitted via portal', status: 'completed' as const, timestamp: 'Mar 10, 2026 — 9:15 AM' },
  { label: 'Documents Received', description: 'Photos + repair estimate uploaded', status: 'completed' as const, timestamp: 'Mar 12, 2026 — 2:30 PM' },
  { label: 'Adjuster Review', description: 'Assigned to adjuster Sarah M.', status: 'in-progress' as const, timestamp: 'Mar 18, 2026 — 10:00 AM' },
  { label: 'Estimate Approved', description: 'Repair cost assessment', status: 'pending' as const },
  { label: 'Payment Issued', description: 'Direct deposit to your account', status: 'pending' as const },
];

export const pendingApprovals = [
  {
    title: 'Policy Change Request',
    description: 'Add comprehensive coverage to POL-001 (2024 Tesla Model 3)',
    metadata: [
      { label: 'Policy', value: 'POL-001' },
      { label: 'Change', value: 'Add Comprehensive' },
      { label: 'New Premium', value: '$215/mo (+$30)' },
      { label: 'Effective', value: 'Apr 1, 2026' },
    ],
  },
];

export const quoteQuestions = [
  {
    id: 'insurance-type',
    title: 'What type of insurance do you need?',
    description: 'Select the coverage that best fits your needs.',
    options: [
      { id: 'auto', label: 'Auto Insurance', description: 'Cars, trucks, motorcycles' },
      { id: 'home', label: 'Home Insurance', description: 'House, condo, rental' },
      { id: 'life', label: 'Life Insurance', description: 'Term, whole, universal' },
      { id: 'bundle', label: 'Bundle & Save', description: 'Combine multiple policies' },
    ],
  },
  {
    id: 'coverage-level',
    title: 'What level of coverage are you looking for?',
    options: [
      { id: 'basic', label: 'Basic', description: 'State minimum requirements' },
      { id: 'standard', label: 'Standard', description: 'Balanced protection and value' },
      { id: 'premium', label: 'Premium', description: 'Maximum coverage and lowest deductibles' },
    ],
  },
  {
    id: 'priorities',
    title: 'What matters most to you?',
    description: 'Select all that apply.',
    multiSelect: true,
    options: [
      { id: 'low-premium', label: 'Lowest monthly premium' },
      { id: 'low-deductible', label: 'Low deductible' },
      { id: 'roadside', label: 'Roadside assistance' },
      { id: 'rental', label: 'Rental car coverage' },
      { id: 'accident-forgiveness', label: 'Accident forgiveness' },
    ],
  },
];

export const notifications = [
  { id: '1', title: 'Claim CLM-2024-001 Update', message: 'Your collision claim is now being processed by our adjuster.', read: false, date: '2026-03-22' },
  { id: '2', title: 'Payment Received', message: 'Your March premium payment of $482.00 has been received.', read: true, date: '2026-03-15' },
  { id: '3', title: 'Document Requested', message: 'Please upload repair estimate for claim CLM-2024-001.', read: false, date: '2026-03-11' },
  { id: '4', title: 'Policy Renewal Reminder', message: 'Your auto policy POL-001 renews on Aug 15, 2026.', read: true, date: '2026-03-01' },
];
