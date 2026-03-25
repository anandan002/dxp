import React, { useState } from 'react';
import { DataTable, StatusBadge, DetailPanel, type Column } from '@dxp/ui';
import { policies } from '../data/mock';

type Policy = typeof policies[0];

const columns: Column<Policy>[] = [
  { key: 'id', header: 'Policy #', sortable: true, width: '120px' },
  { key: 'type', header: 'Type', sortable: true, width: '80px' },
  { key: 'name', header: 'Description', sortable: true },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} />, width: '100px' },
  { key: 'premium', header: 'Premium', width: '100px' },
  { key: 'coverage', header: 'Coverage', width: '120px' },
  { key: 'renewalDate', header: 'Renewal', sortable: true, width: '110px' },
];

export function Policies() {
  const [selected, setSelected] = useState<Policy | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Policies</h1>
          <p className="mt-1 text-sm text-gray-500">{policies.length} policies on file</p>
        </div>
      </div>

      {/* DataTable — sortable, clickable rows */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={policies}
          onRowClick={(row) => setSelected(row)}
        />
      </div>

      {/* DetailPanel — slide-over for policy details */}
      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Policy ${selected.id}` : ''}
        footer={
          <div className="flex gap-3">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Download Declaration
            </button>
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Request Change
            </button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Policy Number</label>
              <p className="text-sm text-gray-900">{selected.id}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Type</label>
              <p className="text-sm text-gray-900">{selected.type}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Description</label>
              <p className="text-sm text-gray-900">{selected.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Status</label>
              <p className="mt-1"><StatusBadge status={selected.status} /></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Premium</label>
                <p className="text-sm text-gray-900">{selected.premium}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Coverage</label>
                <p className="text-sm text-gray-900">{selected.coverage}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Renewal Date</label>
              <p className="text-sm text-gray-900">{selected.renewalDate}</p>
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
