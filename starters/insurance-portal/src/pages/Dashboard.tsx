import React from 'react';
import { StatsDisplay, Chart, StatusBadge, Card } from '@dxp/ui';
import { claims, notifications, claimsChartData, premiumChartData } from '../data/mock';

export function Dashboard() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Welcome back, Sarah</h1>
        <p className="text-[var(--dxp-text-secondary)] font-medium mt-1">Today is Monday, March 24, 2026</p>
      </div>

      {/* Stats Display — replaces individual DashboardCards */}
      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Active Policies', value: 3, delta: { value: 0, label: 'vs last month' } },
          { label: 'Open Claims', value: 1, delta: { value: -50, label: 'vs last month' } },
          { label: 'Pending Documents', value: 2, delta: { value: 100, label: 'new this week' } },
          { label: 'Next Payment', value: 482, format: 'currency' },
        ]} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={claimsChartData}
          xKey="month"
          yKeys={['filed', 'resolved']}
          title="Claims Activity"
          description="Filed vs resolved claims — last 6 months"
          height={250}
        />
        <Chart
          type="line"
          data={premiumChartData}
          xKey="month"
          yKeys={['amount']}
          title="Monthly Premium"
          description="Total premium trend"
          height={250}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        <section className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Recent Claims</h2>
            <button className="text-[var(--dxp-brand)] text-sm font-bold hover:underline">View All History</button>
          </div>
          <div className="flex flex-col gap-4">
            {claims.map((claim) => (
              <Card key={claim.id} interactive className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--dxp-brand-light)] flex items-center justify-center text-[var(--dxp-brand)]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--dxp-text)]">{claim.id}</span>
                    <p className="text-xs text-[var(--dxp-text-secondary)]">{claim.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--dxp-text)]">{claim.amount}</span>
                    <p className="text-[10px] text-[var(--dxp-text-muted)]">{claim.filedDate}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-8 bg-[var(--dxp-brand)] text-white overflow-hidden">
            <h3 className="text-2xl font-bold mb-2">Bundle & Save 15%</h3>
            <p className="text-white/80 text-sm max-w-xs mb-6">Add Pet Insurance to your current plan and enjoy exclusive premium benefits.</p>
            <button className="bg-white text-[var(--dxp-brand)] font-bold px-6 py-2.5 rounded-lg text-sm hover:shadow-lg transition-shadow">Explore Bundles</button>
          </Card>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--dxp-text)] tracking-tight">Notifications</h2>
            {unreadCount > 0 && <span className="text-[10px] font-bold bg-[var(--dxp-brand)] text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>}
          </div>
          <Card className="overflow-hidden">
            {notifications.map((n, i) => (
              <div key={n.id} className={`p-5 flex gap-4 cursor-pointer transition-colors hover:bg-[var(--dxp-border-light)] ${!n.read ? 'border-l-4 border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]' : ''} ${i < notifications.length - 1 ? 'border-b border-[var(--dxp-border-light)]' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!n.read ? 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]' : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)]'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} text-[var(--dxp-text)]`}>{n.title}</p>
                    <span className="text-[9px] text-[var(--dxp-text-muted)]">{n.date}</span>
                  </div>
                  <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed mt-1">{n.message}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card className="p-6">
            <h4 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Digital ID Card</h4>
            <div className="aspect-[1.58/1] rounded-lg bg-gradient-to-br from-[var(--dxp-brand)] to-[var(--dxp-brand-dark)] p-6 flex flex-col justify-between text-white">
              <div><span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Policy Holder</span><p className="text-lg font-bold">Sarah Thompson</p></div>
              <div><span className="text-[8px] opacity-70 uppercase tracking-widest font-bold">Policy Number</span><p className="text-xs font-mono">ACME-TR-2993881</p></div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
