import React from 'react';
import { StatsDisplay, Chart, DataTable, StatusBadge, type Column } from '@dxp/ui';
import { usePADashboard } from '@dxp/sdk-react';
import { providerStats, paQueue } from '../../data/mock-provider';

type PAItem = typeof paQueue[0];

const recentPAColumns: Column<PAItem>[] = [
  { key: 'authNumber', header: 'Auth #', width: '150px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'memberName', header: 'Member', sortable: true },
  { key: 'serviceDescription', header: 'Service' },
  { key: 'urgency', header: 'Urgency', width: '100px', render: (v) => <StatusBadge status={String(v)} /> },
  { key: 'status', header: 'Status', width: '150px', render: (v) => <StatusBadge status={String(v)} /> },
  { key: 'daysInQueue', header: 'Days', width: '70px', render: (v) => <span className="font-bold">{String(v)}</span> },
];

const submissionTrend = [
  { month: 'Oct', submitted: 38, approved: 30, denied: 3 },
  { month: 'Nov', submitted: 42, approved: 33, denied: 4 },
  { month: 'Dec', submitted: 35, approved: 27, denied: 2 },
  { month: 'Jan', submitted: 40, approved: 31, denied: 3 },
  { month: 'Feb', submitted: 45, approved: 35, denied: 4 },
  { month: 'Mar', submitted: 34, approved: 26, denied: 2 },
];

export function ProviderDashboard() {
  const { data: live } = usePADashboard();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Provider Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Prior authorization performance and activity overview</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Total Submissions', value: live?.totalRequests ?? providerStats.totalSubmissions },
          { label: 'Auto Rate', value: live?.automationRate ?? providerStats.approvalRate, format: 'percent' },
          { label: 'Avg Turnaround (hrs)', value: live?.avgTurnaroundHoursRoutine ?? providerStats.avgTurnaroundDays },
          { label: 'Pending Review', value: live?.pendingReview ?? providerStats.pendingReview, delta: { value: -2, label: 'vs last week' } },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={submissionTrend}
          xKey="month"
          yKeys={['submitted', 'approved', 'denied']}
          title="Submission Trends"
          description="PA submissions, approvals, and denials — last 6 months"
          height={250}
        />
        <Chart
          type="bar"
          data={providerStats.topDenialReasons}
          xKey="reason"
          yKeys={['count']}
          title="Top Denial Reasons"
          description="Most common reasons for PA denials"
          height={250}
        />
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Recent Prior Authorizations</h3>
      <DataTable columns={recentPAColumns} data={paQueue} />
    </div>
  );
}
