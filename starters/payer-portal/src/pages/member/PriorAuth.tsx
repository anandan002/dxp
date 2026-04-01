import React, { useState } from 'react';
import { DataTable, StatusBadge, FilterBar, type Column, type FilterOption } from '@dxp/ui';
import { usePriorAuths } from '@dxp/sdk-react';
import { priorAuths as mockPriorAuths } from '../../data/mock';

type PA = typeof mockPriorAuths[0];

const columns: Column<PA>[] = [
  { key: 'authNumber', header: 'Auth #', sortable: true, width: '150px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'serviceDescription', header: 'Service', sortable: true },
  { key: 'requestingProvider', header: 'Requesting Provider', width: '180px' },
  { key: 'submittedDate', header: 'Submitted', sortable: true, width: '110px' },
  { key: 'decisionDate', header: 'Decision', width: '110px', render: (v) => v ? String(v) : <span className="text-[var(--dxp-text-muted)]">Pending</span> },
  { key: 'status', header: 'Status', width: '130px', render: (v) => <StatusBadge status={String(v)} /> },
];

const filters: FilterOption[] = [
  { key: 'approved', label: 'Approved', value: 'approved' },
  { key: 'pending', label: 'Pending', value: 'pending' },
  { key: 'denied', label: 'Denied', value: 'denied' },
  { key: 'expired', label: 'Expired', value: 'expired' },
];

// Map FHIR Claim preauth statuses to display statuses
const normaliseStatus = (s: string) => {
  const map: Record<string, string> = { submitted: 'pending', draft: 'pending', active: 'approved', cancelled: 'expired', 'entered-in-error': 'expired' };
  return map[s] || s;
};

export function PriorAuth() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: paResult, isLoading } = usePriorAuths();
  const rawPAs = paResult?.data ?? mockPriorAuths;
  const priorAuths = (rawPAs as any[]).map((pa) => ({ ...pa, status: normaliseStatus(pa.status) })) as typeof mockPriorAuths;

  const filtered = priorAuths.filter((pa) => {
    if (activeFilters.length > 0 && !activeFilters.includes(pa.status)) return false;
    if (search && !pa.authNumber.toLowerCase().includes(search.toLowerCase()) && !pa.serviceDescription.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {isLoading && <div className="p-8 text-[var(--dxp-text-secondary)]">Loading authorizations...</div>}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Prior Authorizations</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{priorAuths.length} authorizations on file</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search authorizations..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
