import React, { useState } from 'react';
import { Tabs, MultiStepForm, DataTable, StatusBadge, Input, Select, type Column } from '@dxp/ui';
import { usePAQueue, usePASubmit } from '@dxp/sdk-react';
import { paQueue as mockPAQueue } from '../../data/mock-provider';

type PAItem = typeof mockPAQueue[0];

const submissionColumns: Column<PAItem>[] = [
  { key: 'authNumber', header: 'Auth #', width: '150px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'memberName', header: 'Member', sortable: true },
  { key: 'serviceDescription', header: 'Service' },
  { key: 'urgency', header: 'Urgency', width: '100px', render: (v) => <StatusBadge status={String(v)} /> },
  { key: 'submittedDate', header: 'Submitted', sortable: true, width: '110px' },
  { key: 'status', header: 'Status', width: '150px', render: (v) => <StatusBadge status={String(v)} /> },
];

export function ProviderPriorAuth() {
  const [activeTab, setActiveTab] = useState('submit');
  const [submitted, setSubmitted] = useState(false);
  const { data: queueResult } = usePAQueue();
  const paQueue = ((queueResult?.data ?? mockPAQueue) as typeof mockPAQueue);
  const { mutateAsync: submitPA } = usePASubmit();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Prior Authorizations</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Submit new prior authorization requests and track existing submissions</p>
      </div>

      <Tabs
        tabs={[
          { key: 'submit', label: 'Submit New' },
          { key: 'submissions', label: 'My Submissions' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'submit' && (
        <div className="pt-6 max-w-3xl">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--dxp-text)]">PA Request Submitted</h3>
              <p className="text-sm text-[var(--dxp-text-secondary)] mt-2">You will be notified when a decision is made.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-sm font-bold text-[var(--dxp-brand)] hover:underline">Submit Another</button>
            </div>
          ) : (
            <MultiStepForm
              steps={[
                {
                  title: 'Member Information',
                  description: 'Enter the member details for this authorization request.',
                  content: (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Member ID</label>
                          <Input placeholder="MEM-XXXX-XXXXXX" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Date of Birth</label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Member Name</label>
                        <Input placeholder="First and last name" />
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Service Details',
                  description: 'Specify the service requiring authorization.',
                  content: (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Urgency</label>
                        <Select
                          options={[
                            { value: 'routine', label: 'Routine' },
                            { value: 'urgent', label: 'Urgent' },
                            { value: 'expedited', label: 'Expedited' },
                          ]}
                          value=""
                          onChange={() => {}}
                          placeholder="Select urgency..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">CPT / Service Code</label>
                          <Input placeholder="e.g. 70553" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">ICD-10 Diagnosis</label>
                          <Input placeholder="e.g. M54.5" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Service Description</label>
                        <Input placeholder="Describe the requested service..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Servicing Provider / Facility</label>
                        <Input placeholder="Provider or facility name" />
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Clinical Information',
                  description: 'Provide clinical justification for this request.',
                  content: (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Clinical Notes</label>
                        <textarea
                          rows={4}
                          className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm"
                          placeholder="Describe the clinical justification, prior treatments attempted, and medical necessity..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--dxp-text-secondary)] mb-1.5">Prior Treatments</label>
                        <Input placeholder="List prior treatments that were attempted..." />
                      </div>
                    </div>
                  ),
                },
              ]}
              onSubmit={() => setSubmitted(true)}
              submitLabel="Submit PA Request"
            />
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="pt-6">
          <DataTable columns={submissionColumns} data={paQueue} />
        </div>
      )}
    </div>
  );
}
