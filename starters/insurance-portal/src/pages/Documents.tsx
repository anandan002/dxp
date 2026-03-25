import React, { useState } from 'react';
import { Tabs, DocumentCard, Button } from '@dxp/ui';
import { documents } from '../data/mock';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'policy', label: 'Policy Documents' },
  { key: 'claim', label: 'Claim Documents' },
  { key: 'uploads', label: 'Uploads' },
];

function getFileType(name: string): 'pdf' | 'image' | 'zip' | 'doc' {
  if (name.endsWith('.zip')) return 'zip';
  if (name.endsWith('.jpg') || name.endsWith('.png')) return 'image';
  return 'pdf';
}

export function Documents() {
  const [activeTab, setActiveTab] = useState('all');
  const filtered = activeTab === 'all' ? documents : documents.filter((d) => d.category.toLowerCase() === activeTab);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Documents</h1>
          <p className="text-[var(--dxp-text-secondary)] text-lg mt-1">All your policy and claim documents in one place</p>
        </div>
        <Button>Upload Document</Button>
      </div>

      <div className="mb-10">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="pill" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((doc) => (
          <DocumentCard
            key={doc.id}
            name={doc.name}
            category={doc.category.toLowerCase() as 'policy' | 'claim'}
            reference={doc.id}
            date={doc.uploadedAt}
            size={doc.size}
            fileType={getFileType(doc.name)}
            onDownload={() => {}}
          />
        ))}
        <div className="border-2 border-dashed border-[var(--dxp-border)] rounded-xl p-6 flex flex-col items-center justify-center text-center group hover:border-[var(--dxp-brand)] hover:bg-[var(--dxp-brand-light)] transition-all cursor-pointer min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-[var(--dxp-border-light)] flex items-center justify-center mb-4 group-hover:bg-[var(--dxp-brand)] group-hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="font-bold text-[var(--dxp-text-secondary)] group-hover:text-[var(--dxp-brand)]">New Document</span>
          <span className="text-xs text-[var(--dxp-text-muted)]">Drag and drop files here</span>
        </div>
      </div>
    </div>
  );
}
