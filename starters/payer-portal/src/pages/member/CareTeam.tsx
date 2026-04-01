import React from 'react';
import { Card, Badge } from '@dxp/ui';
import { useCareTeam } from '@dxp/sdk-react';
import { careTeam as mockCareTeam } from '../../data/mock';

// Map FHIR role codes to display labels
const roleLabel: Record<string, string> = {
  pcp: 'Primary Care Physician',
  specialist: 'Specialist',
  'care-manager': 'Care Manager',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  'social-worker': 'Social Worker',
};

export function CareTeam() {
  const { data: teamData, isLoading } = useCareTeam();
  const careTeam = ((teamData ?? mockCareTeam) as typeof mockCareTeam);

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">My Care Team</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your coordinated care team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careTeam.map((member) => (
          <Card key={member.id} interactive className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--dxp-brand-light)] flex items-center justify-center text-[var(--dxp-brand)] font-bold text-lg">
                  {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--dxp-text)]">{member.name}</h3>
                  <p className="text-xs text-[var(--dxp-text-secondary)]">{member.specialty}</p>
                </div>
              </div>
              {member.isPrimary && <Badge variant="info">Primary</Badge>}
            </div>

            <div>
              {(() => {
                const label = roleLabel[member.role] || member.role;
                const role = member.role as string;
                const variant = role === 'pcp' || role === 'Primary Care Physician' ? 'success' : role === 'specialist' || role === 'Specialist' ? 'info' : 'default';
                return <Badge variant={variant}>{label}</Badge>;
              })()}
            </div>

            {(member as any).facility && (
              <p className="text-xs text-[var(--dxp-text-secondary)]">{(member as any).facility}</p>
            )}

            <div className="mt-auto pt-3 border-t border-[var(--dxp-border-light)] space-y-1">
              {(member as any).phone && (
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3.5 h-3.5 text-[var(--dxp-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-[var(--dxp-text-secondary)]">{(member as any).phone}</span>
                </div>
              )}
              {(member as any).email && (
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3.5 h-3.5 text-[var(--dxp-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="text-[var(--dxp-brand)]">{(member as any).email}</span>
                </div>
              )}
              {!(member as any).phone && !(member as any).email && (
                <p className="text-xs text-[var(--dxp-text-muted)]">Contact through portal messaging</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
