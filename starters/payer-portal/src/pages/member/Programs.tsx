import React from 'react';
import { Card, ProgressTracker, StatusBadge } from '@dxp/ui';
import { usePrograms } from '@dxp/sdk-react';
import { programs as mockPrograms } from '../../data/mock';

export function Programs() {
  const { data: programsData, isLoading } = usePrograms();
  const programs = ((programsData ?? mockPrograms) as typeof mockPrograms);

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Programs & Wellness</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your enrolled health programs and progress</p>
      </div>

      <div className="space-y-8">
        {programs.map((program) => {
          const completed = program.milestones.filter((m) => m.status === 'completed').length;
          const total = program.milestones.length;

          return (
            <Card key={program.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--dxp-text)]">{program.name}</h2>
                  <p className="text-sm text-[var(--dxp-text-secondary)] mt-1">{program.description}</p>
                </div>
                <StatusBadge status={program.status} />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs text-[var(--dxp-text-muted)]">Enrolled {program.enrolledDate}</span>
                <span className="text-xs font-bold text-[var(--dxp-brand)]">{completed} of {total} milestones complete</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[var(--dxp-border-light)] mb-6">
                <div
                  className="h-2 rounded-full bg-[var(--dxp-brand)] transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>

              <ProgressTracker
                steps={program.milestones.map((m) => ({
                  label: (m as any).title || (m as any).label || (m as any).description || 'Activity',
                  description: (m as any).description && (m as any).title && (m as any).description !== (m as any).title
                    ? (m as any).description
                    : m.status === 'completed' && 'completedDate' in m
                      ? `Completed ${(m as any).completedDate}`
                      : 'dueDate' in m ? `Due ${(m as any).dueDate}` : undefined,
                  status: m.status === 'completed' ? 'completed' : 'pending',
                }))}
                title={`${program.name} Milestones`}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
