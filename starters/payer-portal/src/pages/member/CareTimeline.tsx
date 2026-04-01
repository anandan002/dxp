import React from 'react';
import { StatusBadge, Card } from '@dxp/ui';
import { useCareTimeline } from '@dxp/sdk-react';
import { careTimeline as mockCareTimeline } from '../../data/mock';

// CareEventType values from contracts: admission | discharge | transfer | ed-visit | office-visit | telehealth | lab | imaging | procedure | follow-up
const typeIcons: Record<string, string> = {
  'admission':    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'discharge':    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  'ed-visit':     'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'office-visit': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  'telehealth':   'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  'lab':          'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'imaging':      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'procedure':    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'follow-up':    'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  'transfer':     'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
};

const typeColors: Record<string, string> = {
  'admission':    'bg-orange-50 text-orange-600',
  'discharge':    'bg-green-50 text-green-600',
  'ed-visit':     'bg-red-50 text-red-600',
  'office-visit': 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]',
  'telehealth':   'bg-teal-50 text-teal-600',
  'lab':          'bg-purple-50 text-purple-600',
  'imaging':      'bg-blue-50 text-blue-600',
  'procedure':    'bg-indigo-50 text-indigo-600',
  'follow-up':    'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]',
  'transfer':     'bg-yellow-50 text-yellow-600',
};

const typeLabel: Record<string, string> = {
  'admission':    'Inpatient Admission',
  'discharge':    'Discharge',
  'ed-visit':     'Emergency Visit',
  'office-visit': 'Office Visit',
  'telehealth':   'Telehealth Visit',
  'lab':          'Lab Work',
  'imaging':      'Imaging',
  'procedure':    'Procedure',
  'follow-up':    'Follow-Up',
  'transfer':     'Transfer',
};

// Normalise legacy mock type keys (visit → office-visit, emergency → ed-visit)
const normaliseType = (t: string): string => {
  const map: Record<string, string> = { visit: 'office-visit', emergency: 'ed-visit', referral: 'follow-up' };
  return map[t] || t;
};

export function CareTimeline() {
  const { data: timelineData, isLoading } = useCareTimeline();

  // timelineData from FHIR uses: id, type, date, description, provider, facility, status, notes
  // mockCareTimeline uses: id, type, date, title, summary, provider, facility, status
  const rawTimeline: any[] = (timelineData as any) ?? mockCareTimeline;

  return (
    <div>
      {isLoading && <div className="p-4 text-[var(--dxp-text-secondary)]">Loading care timeline...</div>}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Care Timeline</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your complete care history — {rawTimeline.length} events</p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--dxp-border)]" />

        <div className="space-y-6">
          {rawTimeline.map((event: any) => {
            const type = normaliseType(event.type || 'office-visit');
            // FHIR descriptions like "Ambulatory"/"Inpatient" are class names, not meaningful titles
            const genericDescriptions = new Set(['ambulatory', 'inpatient', 'emergency', 'encounter']);
            const rawDesc = event.title || event.description || '';
            const title = (rawDesc && !genericDescriptions.has(rawDesc.toLowerCase()))
              ? rawDesc
              : typeLabel[type] || 'Encounter';
            const summary = event.summary || event.notes || '';
            const provider = event.provider || '';
            const facility = event.facility || '';
            const subtitle = [provider, facility].filter(Boolean).join(' — ') || type;

            return (
              <div key={event.id} className="relative flex gap-6 pl-0">
                <div className={`relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${typeColors[type] || 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)]'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[type] || typeIcons['office-visit']} />
                  </svg>
                </div>

                <Card className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--dxp-text)]">{title}</h3>
                      <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[var(--dxp-text-muted)]">{event.date}</span>
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                  {summary && <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed">{summary}</p>}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
