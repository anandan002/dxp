import React from 'react';
import { StatsDisplay, Chart, DataTable, Card, Citation, Badge, type Column } from '@dxp/ui';
import { useMemberRiskProfile, useMemberProfile } from '@dxp/sdk-react';
import { riskWorklist } from '../../data/mock-internal';

const mockMember = riskWorklist[0];

const scoreBreakdown = [
  { component: 'Clinical', score: 2.25 },
  { component: 'Utilization', score: 0.86 },
  { component: 'Behavioral', score: 0.42 },
  { component: 'Social', score: 0.28 },
];

const riskFactors = [
  { factor: 'Heart Failure', weight: 0.85, category: 'Chronic Condition' },
  { factor: 'Type 2 Diabetes w/ Complications', weight: 0.72, category: 'Chronic Condition' },
  { factor: 'CKD Stage 3', weight: 0.68, category: 'Chronic Condition' },
  { factor: 'Age 72+', weight: 0.45, category: 'Demographic' },
  { factor: 'ED Visits (2 in 30d)', weight: 0.62, category: 'Utilization' },
  { factor: 'Recent Admission', weight: 0.55, category: 'Utilization' },
  { factor: 'Medication Non-Adherence', weight: 0.48, category: 'Behavioral' },
];

type Condition = { condition: string; icd10: string; severity: string; lastCaptured: string };

const conditions: Condition[] = [
  { condition: 'Heart Failure', icd10: 'I50.9', severity: 'High', lastCaptured: '2026-03-15' },
  { condition: 'Type 2 Diabetes with CKD', icd10: 'E11.65', severity: 'High', lastCaptured: '2026-02-28' },
  { condition: 'Chronic Kidney Disease Stage 3', icd10: 'N18.3', severity: 'Moderate', lastCaptured: '2026-01-22' },
  { condition: 'Hypertension', icd10: 'I10', severity: 'Moderate', lastCaptured: '2026-03-15' },
];

const conditionColumns: Column<Condition>[] = [
  { key: 'condition', header: 'Condition', sortable: true },
  { key: 'icd10', header: 'ICD-10', width: '100px', render: (v) => <span className="font-mono text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'severity', header: 'Severity', width: '100px', render: (v) => <Badge variant={String(v) === 'High' ? 'danger' : 'warning'}>{String(v)}</Badge> },
  { key: 'lastCaptured', header: 'Last Captured', width: '130px', sortable: true },
];

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

function getCurrentMemberId(): string {
  if (typeof localStorage === 'undefined') {
    return '';
  }
  const raw = localStorage.getItem('dxp_dev_member_id');
  const match = raw?.match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : '';
}

export function MemberRiskProfile() {
  const currentMemberId = getCurrentMemberId();
  const { data: liveRisk } = useMemberRiskProfile(currentMemberId);
  const { data: liveProfile } = useMemberProfile();

  const memberName = liveProfile?.name ?? mockMember.name;
  const memberDisplayId = liveProfile?.memberId ?? mockMember.memberId;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Member Risk Profile</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{memberName} — {memberDisplayId}</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Risk Score', value: liveRisk?.overallScore ?? mockMember.riskScore },
          { label: 'Clinical Score', value: liveRisk?.clinicalScore ?? mockMember.openGaps },
          { label: 'Claims Score', value: liveRisk?.claimsScore ?? mockMember.edVisits30d },
          { label: 'SDOH Score', value: liveRisk?.sdohScore ?? mockMember.admissions90d },
          { label: 'Age', value: mockMember.age },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={scoreBreakdown}
          xKey="component"
          yKeys={['score']}
          title="Risk Score Breakdown"
          description="Component scores that make up the overall risk score"
          height={250}
        />
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Risk Factors</h3>
          <div className="space-y-3">
            {riskFactors.map((rf) => (
              <div key={rf.factor} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--dxp-text)]">{rf.factor}</span>
                    <span className="text-xs text-[var(--dxp-text-muted)]">{rf.category}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--dxp-border-light)]">
                    <div className="h-1.5 rounded-full bg-[var(--dxp-brand)]" style={{ width: `${rf.weight * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--dxp-text)] w-10 text-right">{rf.weight}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Active Conditions</h3>
      <DataTable columns={conditionColumns} data={conditions} />

      <div className="mt-8">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Care Manager Notes</h3>
          <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed">{mockMember.notes}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-[var(--dxp-text-muted)]">Assigned: {mockMember.assignedCareManager}</span>
            <span className="text-xs text-[var(--dxp-text-muted)]">Last encounter: {mockMember.lastEncounter}</span>
            <Badge variant={mockMember.riskTier === 'critical' ? 'danger' : 'warning'}>{mockMember.riskTier}</Badge>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Citation
          source="CMS HCC Risk Adjustment Model"
          title="V28 Risk Adjustment Documentation"
          excerpt="Risk scores are calculated using the CMS-HCC model based on demographic factors and hierarchical condition categories."
          date="2026-01-01"
        />
      </div>
    </div>
  );
}
