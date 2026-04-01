import React from 'react';
import { StatsDisplay, DataTable, Chart, Card, Citation, type Column } from '@dxp/ui';
import { useCareGaps } from '@dxp/sdk-react';
import { hccGaps } from '../../data/mock-internal';

type HCCGap = typeof hccGaps[0];

const columns: Column<HCCGap>[] = [
  { key: 'memberName', header: 'Member', sortable: true, render: (v, row) => (
    <div>
      <span className="font-bold text-[var(--dxp-text)]">{String(v)}</span>
      <p className="text-[10px] text-[var(--dxp-text-muted)] font-mono">{(row as HCCGap).memberId}</p>
    </div>
  )},
  { key: 'suspectedCondition', header: 'Suspected Condition' },
  { key: 'icd10Current', header: 'Current', width: '80px', render: (v) => v ? <span className="font-mono">{String(v)}</span> : <span className="text-[var(--dxp-text-muted)]">—</span> },
  { key: 'icd10Suspected', header: 'Target', width: '80px', render: (v) => v ? <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> : <span className="text-[var(--dxp-text-muted)]">—</span> },
  { key: 'hccCategory', header: 'HCC Category', width: '200px' },
  { key: 'rafImpact', header: 'RAF Impact', sortable: true, width: '100px', render: (v) => Number(v) > 0 ? <span className="font-bold text-[var(--dxp-brand)]">+{String(v)}</span> : <span className="text-[var(--dxp-text-muted)]">0</span> },
  { key: 'provider', header: 'Provider', width: '140px' },
  { key: 'nextVisit', header: 'Next Visit', width: '110px', render: (v) => v ? String(v) : <span className="text-[var(--dxp-text-muted)]">Not scheduled</span> },
];

export function HCCDashboard() {
  const { data: careGapsResult } = useCareGaps({ status: 'open' });
  const gaps = (careGapsResult?.data ?? hccGaps) as HCCGap[];
  const openGapCount = careGapsResult?.total ?? hccGaps.length;

  const totalRafImpact = gaps.reduce((sum, g) => sum + (g.rafImpact || 0), 0);
  const gapsWithVisits = gaps.filter((g) => g.nextVisit).length;

  const gapDistribution = [
    { category: 'Diabetes', count: gaps.filter((g) => g.hccCategory?.includes('Diabetes')).length },
    { category: 'Heart Failure', count: gaps.filter((g) => g.hccCategory?.includes('Heart')).length },
    { category: 'Pulmonary', count: gaps.filter((g) => g.hccCategory?.includes('Pulmonary')).length },
    { category: 'Behavioral', count: gaps.filter((g) => g.hccCategory?.includes('Depressive') || g.hccCategory?.includes('Bipolar')).length },
    { category: 'Arthritis', count: gaps.filter((g) => g.hccCategory?.includes('Arthritis')).length },
    { category: 'Other', count: gaps.filter((g) => g.hccCategory?.includes('Not HCC')).length },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">HCC Recapture</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Hierarchical Condition Category coding gap identification and recapture tracking</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Open Gaps', value: openGapCount },
          { label: 'Total RAF Impact', value: totalRafImpact },
          { label: 'Avg RAF/Gap', value: gaps.length > 0 ? Number((totalRafImpact / gaps.length).toFixed(3)) : 0 },
          { label: 'Visits Scheduled', value: gapsWithVisits },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={gapDistribution}
          xKey="category"
          yKeys={['count']}
          title="Gap Distribution"
          description="HCC coding gaps by condition category"
          height={250}
        />
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Recapture Summary</h3>
          <div className="space-y-3">
            {gaps.slice(0, 5).map((gap) => (
              <div key={gap.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-[var(--dxp-text)]">{gap.memberName}</span>
                  {gap.icd10Current && gap.icd10Suspected && (
                    <span className="text-[var(--dxp-text-muted)] ml-2">{gap.icd10Current} &rarr; {gap.icd10Suspected}</span>
                  )}
                </div>
                {gap.rafImpact ? <span className="font-bold text-[var(--dxp-brand)]">+{gap.rafImpact}</span> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">All Coding Gaps</h3>
      <DataTable columns={columns} data={gaps} />

      <div className="mt-8">
        <Citation
          source="CMS Risk Adjustment"
          title="HCC V28 Risk Adjustment Model Documentation"
          excerpt="Risk adjustment factor (RAF) scores determine capitated payment rates. Accurate coding ensures appropriate reimbursement for member acuity."
          date="2026-01-01"
        />
      </div>
    </div>
  );
}
