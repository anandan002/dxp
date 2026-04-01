import React, { useState } from 'react';
import { DataTable, Chart, DetailPanel, Card, Badge, StatusBadge, type Column } from '@dxp/ui';
import { useContractScorecards } from '@dxp/sdk-react';
import { contractScorecards as mockContractScorecards } from '../../data/mock-internal';

type Contract = typeof mockContractScorecards[0];

const columns: Column<Contract>[] = [
  { key: 'providerGroup', header: 'Provider Group', sortable: true },
  { key: 'contractType', header: 'Type', width: '120px', render: (v) => <Badge variant={String(v) === 'Value-Based' ? 'success' : String(v) === 'Capitated' ? 'info' : 'default'}>{String(v)}</Badge> },
  { key: 'memberPanel', header: 'Members', sortable: true, width: '100px', render: (v) => Number(v).toLocaleString() },
  { key: 'qualityScore', header: 'Quality', sortable: true, width: '90px', render: (v, row) => {
    const r = row as Contract;
    return <span className={`font-bold ${Number(v) >= r.qualityBenchmark ? 'text-green-600' : 'text-[var(--dxp-warning)]'}`}>{String(v)}%</span>;
  }},
  { key: 'sharedSavings', header: 'Shared Savings', sortable: true, width: '140px', render: (v) => Number(v) > 0 ? <span className="font-bold text-green-600">${(Number(v) / 1000).toFixed(0)}K</span> : <span className="text-[var(--dxp-text-muted)]">--</span> },
];

export function ContractAnalytics() {
  const [selected, setSelected] = useState<Contract | null>(null);
  const { data: liveContracts } = useContractScorecards();
  const contractScorecards = ((liveContracts ?? mockContractScorecards) as typeof mockContractScorecards);
  const sharedSavingsData = contractScorecards
    .filter((c) => c.sharedSavings > 0)
    .map((c) => ({
      group: c.providerGroup.split(' ').slice(0, 2).join(' '),
      savings: c.sharedSavings / 1000,
    }));

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Contract Analytics</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Provider contract performance scorecards and shared savings tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={sharedSavingsData}
          xKey="group"
          yKeys={['savings']}
          title="Shared Savings ($K)"
          description="Shared savings by provider group (value-based and capitated contracts)"
          height={250}
        />
        <div className="grid grid-cols-2 gap-4">
          {contractScorecards.slice(0, 4).map((c) => (
            <Card key={c.id} interactive className="p-4 cursor-pointer" onClick={() => setSelected(c)}>
              <h4 className="text-xs font-bold text-[var(--dxp-text)] mb-2 line-clamp-1">{c.providerGroup}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--dxp-text)]">${c.costPerformance.pmpm}</span>
                <span className="text-xs text-[var(--dxp-text-muted)]">PMPM</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold ${c.costPerformance.savingsRate > 0 ? 'text-green-600' : 'text-[var(--dxp-danger)]'}`}>
                  {c.costPerformance.savingsRate > 0 ? '+' : ''}{c.costPerformance.savingsRate}%
                </span>
                <span className="text-[10px] text-[var(--dxp-text-muted)]">vs benchmark</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">All Contracts</h3>
      <DataTable columns={columns} data={contractScorecards} onRowClick={(row) => setSelected(row)} />

      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.providerGroup : ''}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Contract Type</label>
              <p className="text-sm mt-1"><Badge variant={selected.contractType === 'Value-Based' ? 'success' : selected.contractType === 'Capitated' ? 'info' : 'default'}>{selected.contractType}</Badge></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Providers</label>
                <p className="text-sm font-bold mt-1">{selected.providerCount}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Member Panel</label>
                <p className="text-sm font-bold mt-1">{selected.memberPanel.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Cost Performance</label>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between"><span>PMPM</span><span className="font-bold">${selected.costPerformance.pmpm}</span></div>
                <div className="flex justify-between"><span>Benchmark</span><span>${selected.costPerformance.benchmark}</span></div>
                <div className="flex justify-between"><span>Savings Rate</span>
                  <span className={`font-bold ${selected.costPerformance.savingsRate > 0 ? 'text-green-600' : 'text-[var(--dxp-danger)]'}`}>
                    {selected.costPerformance.savingsRate > 0 ? '+' : ''}{selected.costPerformance.savingsRate}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Quality</label>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between"><span>Score</span><span className="font-bold">{selected.qualityScore}%</span></div>
                <div className="flex justify-between"><span>Benchmark</span><span>{selected.qualityBenchmark}%</span></div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Utilization</label>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between"><span>ED Rate</span><span>{selected.utilizationMetrics.edRate}/1K</span></div>
                <div className="flex justify-between"><span>Admission Rate</span><span>{selected.utilizationMetrics.admissionRate}/1K</span></div>
                <div className="flex justify-between"><span>Readmission Rate</span><span>{selected.utilizationMetrics.readmissionRate}%</span></div>
              </div>
            </div>
            {selected.sharedSavings > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--dxp-text-muted)]">Shared Savings</label>
                <p className="text-lg font-bold text-green-600 mt-1">${(selected.sharedSavings / 1000).toFixed(0)}K</p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
