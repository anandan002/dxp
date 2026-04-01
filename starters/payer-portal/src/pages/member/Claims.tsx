import React, { useState } from 'react';
import { DataTable, StatusBadge, FilterBar, type Column, type FilterOption } from '@dxp/ui';
import { useClaims } from '@dxp/sdk-react';
import { claims as mockClaims } from '../../data/mock';

const money = (v: unknown) => {
  const n = typeof v === 'number' ? v : (v as any)?.value ?? 0;
  return n.toLocaleString();
};

type Claim = typeof mockClaims[0];

const columns: Column<Claim>[] = [
  { key: 'claimNumber', header: 'Claim #', sortable: true, width: '160px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'serviceDate', header: 'Date', sortable: true, width: '110px' },
  { key: 'provider', header: 'Provider', sortable: true, render: (v) => {
    const s = String(v || '');
    // FHIR returns UUID references — show truncated; mock returns display names
    return s.length === 36 && s.includes('-') ? <span className="font-mono text-xs text-[var(--dxp-text-muted)]">{s.split('-')[0].toUpperCase()}</span> : <span>{s}</span>;
  }},
  {
    key: 'description' as any,
    header: 'Service',
    render: (_v: unknown, row: any) => {
      const label = row.description || row.primaryDiagnosis || '—';
      const code = row.procedureCode || '';
      return <span>{code && <span className="font-mono text-xs text-[var(--dxp-text-muted)] mr-1">{code}</span>}{label}</span>;
    },
  },
  { key: 'billedAmount', header: 'Billed', width: '100px', render: (v) => <span className="font-bold">${money(v)}</span> },
  { key: 'status', header: 'Status', width: '130px', render: (v) => <StatusBadge status={String(v)} /> },
];

const filters: FilterOption[] = [
  { key: 'paid', label: 'Paid', value: 'paid' },
  { key: 'in-review', label: 'In Review', value: 'in-review' },
  { key: 'submitted', label: 'Submitted', value: 'submitted' },
  { key: 'denied', label: 'Denied', value: 'denied' },
  { key: 'adjudicated', label: 'Adjudicated', value: 'adjudicated' },
];

export function Claims() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: claimsResult, isLoading } = useClaims();
  const claims = ((claimsResult?.data ?? mockClaims) as typeof mockClaims);

  const filtered = claims.filter((c) => {
    if (activeFilters.length > 0 && !activeFilters.includes(c.status)) return false;
    if (search && !c.claimNumber.toLowerCase().includes(search.toLowerCase()) && !c.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {isLoading && <div className="p-8 text-[var(--dxp-text-secondary)]">Loading claims...</div>}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Claims</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{claims.length} claims on file for the current plan year</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search claims..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
