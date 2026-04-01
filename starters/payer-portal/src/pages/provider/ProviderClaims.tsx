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
  { key: 'serviceDate', header: 'Service Date', sortable: true, width: '120px' },
  { key: 'type', header: 'Type', sortable: true, width: '110px' },
  { key: 'description', header: 'Service' },
  { key: 'billedAmount', header: 'Billed', width: '100px', render: (v) => <span className="font-bold">${money(v)}</span> },
  { key: 'allowedAmount', header: 'Allowed', width: '100px', render: (v) => money(v) !== '0' ? `$${money(v)}` : <span className="text-[var(--dxp-text-muted)]">--</span> },
  { key: 'paidAmount', header: 'Paid', width: '100px', render: (v) => money(v) !== '0' ? `$${money(v)}` : <span className="text-[var(--dxp-text-muted)]">--</span> },
  { key: 'status', header: 'Status', width: '130px', render: (v) => <StatusBadge status={String(v)} /> },
];

const filters: FilterOption[] = [
  { key: 'paid', label: 'Paid', value: 'paid' },
  { key: 'in-review', label: 'In Review', value: 'in-review' },
  { key: 'submitted', label: 'Submitted', value: 'submitted' },
  { key: 'denied', label: 'Denied', value: 'denied' },
  { key: 'adjudicated', label: 'Adjudicated', value: 'adjudicated' },
];

export function ProviderClaims() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: claimsResult } = useClaims('');
  const claims = ((claimsResult?.data ?? mockClaims) as typeof mockClaims);

  const filtered = claims.filter((c) => {
    if (activeFilters.length > 0 && !activeFilters.includes(c.status)) return false;
    if (search && !c.claimNumber.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Claims Status</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Track claim status and reimbursement details</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search by claim # or service..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
