import React, { useState } from 'react';
import { DataTable, FilterBar, Badge, StatusBadge, type Column, type FilterOption } from '@dxp/ui';
import { useRiskWorklist } from '@dxp/sdk-react';
import { riskWorklist as mockRiskWorklist } from '../../data/mock-internal';

type RiskMember = typeof mockRiskWorklist[0];

const tierColors: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  moderate: 'info',
  low: 'default',
};

const columns: Column<RiskMember>[] = [
  { key: 'name', header: 'Member', sortable: true, render: (v, row) => (
    <div>
      <span className="font-bold text-[var(--dxp-text)]">{String(v)}</span>
      <p className="text-[10px] text-[var(--dxp-text-muted)] font-mono">{(row as RiskMember).memberId}</p>
    </div>
  )},
  { key: 'age', header: 'Age', width: '60px', sortable: true },
  { key: 'riskScore', header: 'Risk Score', sortable: true, width: '110px', render: (v) => <span className="font-bold text-lg">{String(v)}</span> },
  { key: 'riskTier', header: 'Tier', width: '100px', render: (v) => <Badge variant={tierColors[String(v)] || 'default'}>{String(v)}</Badge> },
  { key: 'openGaps', header: 'Gaps', width: '70px', render: (v) => Number(v) > 0 ? <span className="font-bold text-[var(--dxp-warning)]">{String(v)}</span> : <span className="text-[var(--dxp-text-muted)]">0</span> },
  { key: 'edVisits30d', header: 'ED (30d)', width: '80px', render: (v) => Number(v) > 0 ? <span className="font-bold text-[var(--dxp-danger)]">{String(v)}</span> : '0' },
  { key: 'admissions90d', header: 'Admits (90d)', width: '100px', render: (v) => Number(v) > 0 ? <span className="font-bold text-[var(--dxp-danger)]">{String(v)}</span> : '0' },
  { key: 'assignedCareManager', header: 'Care Manager', width: '140px' },
  { key: 'priority', header: 'Priority', width: '100px', render: (v) => <StatusBadge status={String(v)} /> },
];

const filters: FilterOption[] = [
  { key: 'critical', label: 'Critical', value: 'critical' },
  { key: 'high', label: 'High', value: 'high' },
  { key: 'urgent', label: 'Urgent Priority', value: 'urgent' },
];

export function RiskWorklist() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: worklistResult } = useRiskWorklist();
  const riskWorklist = ((worklistResult?.data ?? mockRiskWorklist) as any[]).map((m: any) => ({
    ...m,
    // Normalize FHIR WorklistEntry field names to match table column keys
    name: m.name || m.memberName || '',
    riskScore: m.riskScore ?? m.overallScore ?? 0,
    riskTier: m.riskTier || m.tier || 'low',
    assignedCareManager: m.assignedCareManager || m.careManagerAssigned || '',
    age: m.age ?? '—',
    edVisits30d: m.edVisits30d ?? 0,
    admissions90d: m.admissions90d ?? 0,
    priority: m.priority || (m.tier === 'critical' || m.riskTier === 'critical' ? 'urgent' : 'routine'),
  })) as typeof mockRiskWorklist;

  const filtered = riskWorklist.filter((m) => {
    const tierFilter = activeFilters.filter((f) => f === 'critical' || f === 'high');
    const priorityFilter = activeFilters.includes('urgent');
    if (tierFilter.length > 0 && !tierFilter.includes(m.riskTier)) return false;
    if (priorityFilter && m.priority !== 'urgent') return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.memberId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Risk Worklist</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{worklistResult?.total ?? riskWorklist.length} high-risk members requiring intervention</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search by name or member ID..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
