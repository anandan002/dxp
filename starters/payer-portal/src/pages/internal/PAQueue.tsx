import React, { useState } from 'react';
import { DataTable, FilterBar, StatusBadge, ApprovalCard, type Column, type FilterOption } from '@dxp/ui';
import { usePAQueue } from '@dxp/sdk-react';
import { paQueue as mockPAQueue } from '../../data/mock-provider';

type PAItem = typeof mockPAQueue[0];

const columns: Column<PAItem>[] = [
  { key: 'authNumber', header: 'Auth #', width: '150px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'memberName', header: 'Member', sortable: true },
  { key: 'serviceDescription', header: 'Service' },
  { key: 'urgency', header: 'Urgency', width: '100px', render: (v) => <StatusBadge status={String(v)} /> },
  { key: 'daysInQueue', header: 'Days', sortable: true, width: '70px', render: (v) => <span className="font-bold">{String(v)}</span> },
  { key: 'requestingProvider', header: 'Provider', width: '160px' },
  { key: 'status', header: 'Status', width: '160px', render: (v) => <StatusBadge status={String(v)} /> },
];

const filters: FilterOption[] = [
  { key: 'pending-clinical', label: 'Pending Clinical', value: 'pending-clinical' },
  { key: 'pending-info', label: 'Pending Info', value: 'pending-info' },
  { key: 'pending-peer-review', label: 'Peer Review', value: 'pending-peer-review' },
  { key: 'urgent', label: 'Urgent', value: 'urgent' },
  { key: 'expedited', label: 'Expedited', value: 'expedited' },
];

export function PAQueue() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { data: queueResult } = usePAQueue();
  const paQueue = ((queueResult?.data ?? mockPAQueue) as typeof mockPAQueue);

  const filtered = paQueue.filter((pa) => {
    const statusFilters = activeFilters.filter((f) => f.startsWith('pending'));
    const urgencyFilters = activeFilters.filter((f): f is 'urgent' | 'expedited' => f === 'urgent' || f === 'expedited');
    if (statusFilters.length > 0 && !statusFilters.includes(pa.status)) return false;
    if (urgencyFilters.length > 0 && !(urgencyFilters as string[]).includes(pa.urgency)) return false;
    if (search && !pa.authNumber.toLowerCase().includes(search.toLowerCase()) && !pa.memberName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingClinical = filtered.filter((pa) => pa.status === 'pending-clinical');

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">PA Queue</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">{queueResult?.total ?? paQueue.length} authorizations in queue</p>
      </div>

      {/* Approval cards for urgent items */}
      {pendingClinical.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Requires Clinical Decision</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingClinical.slice(0, 2).map((pa) => (
              <ApprovalCard
                key={pa.id}
                title={`${pa.authNumber} — ${pa.memberName}`}
                description={`${pa.serviceDescription} (${pa.diagnosisDescription})`}
                metadata={[
                  { label: 'Provider', value: pa.requestingProvider },
                  { label: 'Urgency', value: pa.urgency },
                  { label: 'Days in Queue', value: String(pa.daysInQueue) },
                ]}
                status="pending"
                onApprove={() => {}}
                onReject={() => {}}
                approveLabel="Approve"
                rejectLabel="Deny"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Search by auth # or member..."
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
