import React, { useState } from 'react';
import { DataTable, StatusBadge, Button, Card, StepIndicator, FileUploadZone, Input, type Column } from '@dxp/ui';
import { claims } from '../data/mock';

type Claim = typeof claims[0];

const columns: Column<Claim>[] = [
  { key: 'id', header: 'Claim #', sortable: true, width: '150px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'type', header: 'Type', sortable: true, width: '130px' },
  { key: 'description', header: 'Description' },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} />, width: '130px' },
  { key: 'amount', header: 'Amount', width: '100px', render: (v) => <span className="font-bold">{String(v)}</span> },
  { key: 'filedDate', header: 'Filed', sortable: true, width: '100px' },
];

const steps = [{ label: 'Incident Details' }, { label: 'Supporting Documents' }, { label: 'Review & Submit' }];
const mockFiles = [
  { id: '1', name: 'photo.jpg', size: '2.4 MB', type: 'image' as const },
  { id: '2', name: 'estimate.pdf', size: '340 KB', type: 'document' as const },
];

export function Claims() {
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState(mockFiles);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Claims</h1>
          <p className="text-[var(--dxp-text-secondary)] max-w-lg leading-relaxed mt-2">Manage your active claims or start a new filing.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>+ File a New Claim</Button>
      </div>

      {showForm && (
        <Card className="p-8 mb-12">
          <StepIndicator steps={steps} currentStep={currentStep} />
          <div className="mt-8">
            {currentStep === 0 && (
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-2xl font-bold tracking-tight">Incident Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Policy</label>
                    <select className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm"><option>POL-001 — Tesla Model 3</option><option>POL-002 — 742 Evergreen</option></select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Claim Type</label>
                    <select className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm"><option>Collision</option><option>Water Damage</option></select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Description</label>
                  <textarea rows={3} className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm" placeholder="Describe what happened..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Date</label><Input type="date" /></div>
                  <div><label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Amount</label><Input placeholder="$0.00" /></div>
                </div>
              </div>
            )}
            {currentStep === 1 && (
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Upload Supporting Documents</h3>
                <p className="text-[var(--dxp-text-secondary)] text-sm mb-8">Provide photos, estimates, and reports to expedite processing.</p>
                <FileUploadZone files={files} onRemove={(id) => setFiles(files.filter((f) => f.id !== id))} />
              </div>
            )}
            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto text-center py-8">
                <h3 className="text-2xl font-bold tracking-tight mb-2">Review & Submit</h3>
                <p className="text-[var(--dxp-text-secondary)]">Review your claim details before submitting.</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-[var(--dxp-border-light)]">
            <Button variant="secondary" onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setShowForm(false)}>{currentStep === 0 ? 'Cancel' : 'Back'}</Button>
            <Button onClick={() => currentStep < 2 ? setCurrentStep(currentStep + 1) : setShowForm(false)}>{currentStep === 2 ? 'Submit Claim' : 'Continue'}</Button>
          </div>
        </Card>
      )}

      <h3 className="text-2xl font-extrabold tracking-tight mb-8">Claim History</h3>
      <DataTable columns={columns} data={claims} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <Card className="p-6 bg-[var(--dxp-brand-dark)] text-white flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <div><h5 className="font-bold text-lg">Need help with your estimate?</h5><p className="text-sm opacity-80">Our tool can help calculate repair costs from photos.</p></div>
        </Card>
        <Card interactive className="p-6 flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[var(--dxp-brand-light)] flex items-center justify-center flex-shrink-0 text-[var(--dxp-brand)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div><h5 className="font-bold text-lg text-[var(--dxp-text)]">Live Specialist Support</h5><p className="text-sm text-[var(--dxp-text-secondary)]">Connect with a claims specialist for guidance.</p></div>
        </Card>
      </div>
    </div>
  );
}
