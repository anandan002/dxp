import React from 'react';
import { StatsDisplay, Chart, Card, StatusBadge, ItemCarousel } from '@dxp/ui';
import { useMemberDashboard, useClaimsDashboard } from '@dxp/sdk-react';
import { claimsTrendData, spendingByCategory, claims as mockClaims, notifications } from '../../data/mock';

const careGapNotifs = notifications.filter((n) => n.category === 'care-gap');

export function Dashboard() {
  const { data: memberDash } = useMemberDashboard();
  const { data: claimsDash } = useClaimsDashboard();
  const claims = mockClaims;
  const memberName = memberDash?.memberName ?? 'Member';
  const firstName = memberName.split(' ')[0];
  const openClaims = memberDash?.openClaims ?? 3;
  const pendingPAs = memberDash?.pendingPAs ?? 1;
  const careGaps = memberDash?.careGaps ?? 4;
  const deductibleMet = claimsDash?.totalPaid
    ? (claimsDash.totalPaid as any)?.value ?? 687
    : 687;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Welcome back, {firstName}</h1>
        <p className="text-[var(--dxp-text-secondary)] font-medium mt-1">Your health plan at a glance</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Open Claims', value: openClaims, delta: { value: -2, label: 'vs last month' } },
          { label: 'Pending PAs', value: pendingPAs, delta: { value: 0, label: 'no change' } },
          { label: 'Care Gaps', value: careGaps, delta: { value: 1, label: 'action needed' } },
          { label: 'Deductible Met', value: deductibleMet, format: 'currency' },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={claimsTrendData}
          xKey="month"
          yKeys={['submitted', 'paid', 'denied']}
          title="Claims Trend"
          description="Submitted, paid, and denied claims — last 6 months"
          height={250}
        />
        <Chart
          type="bar"
          data={spendingByCategory}
          xKey="category"
          yKeys={['amount']}
          title="Spending by Category"
          description="Year-to-date member responsibility by service category"
          height={250}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        <section className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Recent Claims</h2>
            <button className="text-[var(--dxp-brand)] text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {claims.slice(0, 4).map((claim) => (
              <Card key={claim.id} interactive className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--dxp-brand-light)] flex items-center justify-center text-[var(--dxp-brand)]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--dxp-text)]">{claim.claimNumber}</span>
                    <p className="text-xs text-[var(--dxp-text-secondary)]">{claim.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--dxp-text)]">${claim.billedAmount.toLocaleString()}</span>
                    <p className="text-[10px] text-[var(--dxp-text-muted)]">{claim.serviceDate}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Care Gap Alerts</h2>
          <ItemCarousel
            title="Action Items"
            items={careGapNotifs.map((n) => ({
              id: n.id,
              content: (
                <Card className="p-4 h-full">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--dxp-warning)]/10 text-[var(--dxp-warning)] mb-2">Care Gap</span>
                  <h4 className="text-sm font-bold text-[var(--dxp-text)] mb-1">{n.title}</h4>
                  <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">{n.message}</p>
                </Card>
              ),
            }))}
          />

          <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Notifications</h2>
          <Card className="overflow-hidden">
            {notifications.slice(0, 5).map((n, i) => (
              <div key={n.id} className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-[var(--dxp-border-light)] ${!n.read ? 'border-l-4 border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]' : ''} ${i < 4 ? 'border-b border-[var(--dxp-border-light)]' : ''}`}>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} text-[var(--dxp-text)]`}>{n.title}</p>
                    <span className="text-[9px] text-[var(--dxp-text-muted)] shrink-0 ml-2">{n.date}</span>
                  </div>
                  <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed mt-1">{n.message}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
