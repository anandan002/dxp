import React from 'react';
import { StatsDisplay, Chart, Card } from '@dxp/ui';
import { usePADashboard } from '@dxp/sdk-react';
import { paDashboardMetrics } from '../../data/mock-internal';

const byUrgencyData = [
  { urgency: 'Urgent', pending: paDashboardMetrics.byUrgency.urgent.pending },
  { urgency: 'Expedited', pending: paDashboardMetrics.byUrgency.expedited.pending },
  { urgency: 'Routine', pending: paDashboardMetrics.byUrgency.routine.pending },
];

const byServiceData = paDashboardMetrics.byServiceCategory;

export function PADashboard() {
  const { data: live } = usePADashboard();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">PA Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Prior authorization performance metrics and trends</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Total This Month', value: live?.totalRequests ?? paDashboardMetrics.totalThisMonth },
          { label: 'Auto Rate', value: live?.automationRate != null ? live.automationRate : paDashboardMetrics.autoApprovedThisMonth, delta: { value: 82, label: 'automation rate' } },
          { label: 'Approved', value: live?.approved ?? paDashboardMetrics.approvedThisMonth },
          { label: 'Denied', value: live?.denied ?? paDashboardMetrics.deniedThisMonth },
          { label: 'Pending Review', value: live?.pendingReview ?? paDashboardMetrics.totalPending },
          { label: 'Avg Turnaround (hrs)', value: live?.avgTurnaroundHoursRoutine ?? paDashboardMetrics.avgTurnaroundRoutineDays },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={byUrgencyData}
          xKey="urgency"
          yKeys={['pending']}
          title="Pending by Urgency"
          description="Current pending PAs by urgency classification"
          height={250}
        />
        <Chart
          type="bar"
          data={byServiceData}
          xKey="category"
          yKeys={['count', 'approvalRate']}
          title="By Service Category"
          description="Volume and approval rate by service type"
          height={250}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          type="line"
          data={paDashboardMetrics.turnaroundTrend}
          xKey="month"
          yKeys={['avgDays']}
          title="Turnaround Time Trend"
          description="Average decision turnaround in days — last 6 months"
          height={250}
        />
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Automation Rate</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full bg-[var(--dxp-border-light)]">
                  <div className="h-2 rounded-full bg-[var(--dxp-brand)]" style={{ width: `${paDashboardMetrics.automationRate}%` }} />
                </div>
                <span className="text-sm font-bold">{paDashboardMetrics.automationRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Urgent Avg Turnaround</span>
              <span className="text-sm font-bold">{paDashboardMetrics.avgTurnaroundUrgentHrs}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Peer Review Pending</span>
              <span className="text-sm font-bold">{paDashboardMetrics.peerReviewPending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Appeals Pending</span>
              <span className="text-sm font-bold">{paDashboardMetrics.appealsPending}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
