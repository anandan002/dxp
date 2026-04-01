import React from 'react';
import { StatsDisplay, Chart, Card } from '@dxp/ui';
import { useClaimsDashboard } from '@dxp/sdk-react';
import { claimsDashboardMetrics } from '../../data/mock-internal';

export function ClaimsDashboard() {
  const { data: liveDash } = useClaimsDashboard();
  const totalClaims = liveDash?.totalClaims ?? claimsDashboardMetrics.totalClaimsThisMonth;
  const denialRate = liveDash?.denialRate != null ? +(liveDash.denialRate * 100).toFixed(1) : claimsDashboardMetrics.denialRate;
  const totalPaid = typeof liveDash?.totalPaid === 'object' ? liveDash.totalPaid.value : claimsDashboardMetrics.totalPaidAmount;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Claims Dashboard</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Claims processing metrics and operational analytics</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Claims This Month', value: totalClaims },
          { label: 'Auto-Adjudication', value: liveDash?.autoAdjudicationRate != null ? +(liveDash.autoAdjudicationRate * 100).toFixed(1) : claimsDashboardMetrics.autoAdjudicationRate, format: 'percent' },
          { label: 'Denial Rate', value: denialRate, format: 'percent' },
          { label: 'Avg Turnaround (days)', value: liveDash?.avgTurnaroundDays ?? claimsDashboardMetrics.avgTurnaroundDays },
          { label: 'Total Paid', value: totalPaid, format: 'currency' },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={claimsDashboardMetrics.claimsByType}
          xKey="type"
          yKeys={['count']}
          title="Claims by Type"
          description="Volume distribution by claim type this month"
          height={280}
        />
        <Chart
          type="bar"
          data={claimsDashboardMetrics.topDenialReasons}
          xKey="reason"
          yKeys={['count']}
          title="Top Denial Reasons"
          description="Most common denial reasons with CARC codes"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          type="line"
          data={claimsDashboardMetrics.monthlyTrend}
          xKey="month"
          yKeys={['received', 'processed', 'denied']}
          title="Monthly Volume Trend"
          description="Claims received, processed, and denied — last 6 months"
          height={250}
        />
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Processing Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Total Paid</span>
              <span className="text-sm font-bold">{claimsDashboardMetrics.totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Total Denied</span>
              <span className="text-sm font-bold text-[var(--dxp-danger)]">{claimsDashboardMetrics.totalDenied.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Pending</span>
              <span className="text-sm font-bold text-[var(--dxp-warning)]">{claimsDashboardMetrics.totalPending.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--dxp-text-secondary)]">Avg Claim Amount</span>
              <span className="text-sm font-bold">${claimsDashboardMetrics.avgClaimAmount.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-[var(--dxp-border-light)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--dxp-text-secondary)]">Auto-Adjudication Rate</span>
                <span className="text-sm font-bold">{claimsDashboardMetrics.autoAdjudicationRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--dxp-border-light)]">
                <div className="h-2 rounded-full bg-[var(--dxp-brand)]" style={{ width: `${claimsDashboardMetrics.autoAdjudicationRate}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
