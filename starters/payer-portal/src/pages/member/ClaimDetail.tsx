import React from 'react';
import { StepIndicator, DataTable, Card, Button, StatusBadge, type Column } from '@dxp/ui';
import { useClaimDetail } from '@dxp/sdk-react';
import { claimDetail as mockClaimDetail } from '../../data/mock';

type ServiceLine = typeof mockClaimDetail.serviceLines[0];

const lifecycleSteps = [
  { label: 'Submitted' },
  { label: 'Received' },
  { label: 'Medical Review' },
  { label: 'Adjudicated' },
  { label: 'Payment' },
];

const serviceLineColumns: Column<ServiceLine>[] = [
  { key: 'lineNumber', header: '#', width: '50px' },
  { key: 'procedureCode', header: 'CPT', width: '80px', render: (v) => <span className="font-mono">{String(v)}</span> },
  { key: 'description', header: 'Service' },
  { key: 'billedAmount', header: 'Billed', width: '100px', render: (v) => <span className="font-bold">${Number(v).toLocaleString()}</span> },
  { key: 'allowedAmount', header: 'Allowed', width: '100px', render: (v) => `$${Number(v).toLocaleString()}` },
  { key: 'paidAmount', header: 'Paid', width: '100px', render: (v) => `$${Number(v).toLocaleString()}` },
  { key: 'status', header: 'Status', width: '140px', render: (v) => <StatusBadge status={String(v)} /> },
];

export function ClaimDetail() {
  // Route params not available in this SPA; use first seeded claim or fall back to mock
  const { data: liveDetail } = useClaimDetail('');
  const claim = (liveDetail as typeof mockClaimDetail | undefined) ?? mockClaimDetail;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Claim {claim.claimNumber}</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Explanation of Benefits — service date {claim.serviceDate}</p>
      </div>

      {/* Claim lifecycle */}
      <Card className="p-6 mb-8">
        <h2 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Claim Lifecycle</h2>
        <StepIndicator steps={lifecycleSteps} currentStep={2} />
      </Card>

      {/* Claim summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Status</span>
          <p className="mt-1"><StatusBadge status={claim.status} /></p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Total Billed</span>
          <p className="text-lg font-bold text-[var(--dxp-text)] mt-1">${claim.adjudication.totalBilled.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Plan Paid</span>
          <p className="text-lg font-bold text-[var(--dxp-text)] mt-1">${claim.adjudication.planPaid.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Your Responsibility</span>
          <p className="text-lg font-bold text-[var(--dxp-text)] mt-1">${claim.adjudication.memberResponsibility.toLocaleString()}</p>
        </Card>
      </div>

      {/* Provider + patient info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Provider</h3>
          <div className="space-y-2 text-sm">
            <p className="font-bold text-[var(--dxp-text)]">{claim.provider.name}</p>
            <p className="text-[var(--dxp-text-secondary)]">NPI: {claim.provider.npi}</p>
            <p className="text-[var(--dxp-text-secondary)]">{claim.provider.address}</p>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Diagnosis</h3>
          <div className="space-y-2">
            {claim.diagnosis.map((dx) => (
              <div key={dx.code} className="flex items-center gap-2 text-sm">
                <span className="font-mono font-bold text-[var(--dxp-brand)]">{dx.code}</span>
                <span className="text-[var(--dxp-text-secondary)]">{dx.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Service lines table */}
      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Service Lines</h3>
      <DataTable columns={serviceLineColumns} data={claim.serviceLines} />

      {/* Denial reason + appeal */}
      {claim.denialReason && (
        <Card className="p-6 mt-8 border-l-4 border-[var(--dxp-warning)]">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Review Note</h3>
          <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed mb-4">{claim.denialReason}</p>
          <Button>File Appeal</Button>
        </Card>
      )}

      {/* Adjustments + remarks */}
      {claim.adjudication.remarks.length > 0 && (
        <Card className="p-5 mt-6">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Remarks</h3>
          <ul className="space-y-1">
            {claim.adjudication.remarks.map((r, i) => (
              <li key={i} className="text-sm text-[var(--dxp-text-secondary)]">{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
