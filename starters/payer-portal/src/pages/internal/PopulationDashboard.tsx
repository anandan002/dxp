import React from 'react';
import { StatsDisplay, Chart, Card } from '@dxp/ui';
import { usePopulationDashboard } from '@dxp/sdk-react';
import { populationMetrics } from '../../data/mock-internal';

const riskTierData = [
  { tier: 'Low', count: populationMetrics.riskTiers.low.count, avgScore: populationMetrics.riskTiers.low.avgScore },
  { tier: 'Moderate', count: populationMetrics.riskTiers.moderate.count, avgScore: populationMetrics.riskTiers.moderate.avgScore },
  { tier: 'High', count: populationMetrics.riskTiers.high.count, avgScore: populationMetrics.riskTiers.high.avgScore },
  { tier: 'Critical', count: populationMetrics.riskTiers.critical.count, avgScore: populationMetrics.riskTiers.critical.avgScore },
];

const pmpmTrend = [
  { month: 'Oct', pmpm: 472 },
  { month: 'Nov', pmpm: 478 },
  { month: 'Dec', pmpm: 495 },
  { month: 'Jan', pmpm: 488 },
  { month: 'Feb', pmpm: 482 },
  { month: 'Mar', pmpm: 485 },
];

export function PopulationDashboard() {
  const { data: live } = usePopulationDashboard();
  const total = live?.totalMembers ?? populationMetrics.totalMembers;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Population Health</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Overview of {total.toLocaleString()} enrolled members</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Total Members', value: total },
          { label: 'Avg Risk Score', value: live?.avgRiskScore ?? populationMetrics.avgRiskScore },
          { label: 'ED Rate (per 1K)', value: live?.edUtilizationRate ?? populationMetrics.edUtilizationRate },
          { label: 'Readmission %', value: live?.readmissionRate ?? populationMetrics.readmissionRate, format: 'percent' },
          { label: 'Total Open Gaps', value: live?.totalOpenGaps ?? 0 },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Chart
          type="bar"
          data={riskTierData}
          xKey="tier"
          yKeys={['count']}
          title="Risk Tier Distribution"
          description="Member count by risk stratification tier"
          height={280}
        />
        <Chart
          type="line"
          data={pmpmTrend}
          xKey="month"
          yKeys={['pmpm']}
          title="PMPM Trend"
          description="Per member per month cost — last 6 months"
          height={280}
        />
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Top Conditions by Prevalence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {populationMetrics.topConditions.map((cond) => (
          <Card key={cond.icd10} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-[var(--dxp-text)]">{cond.condition}</h4>
                <p className="text-xs text-[var(--dxp-text-muted)] font-mono mt-0.5">{cond.icd10}</p>
              </div>
              <span className="text-lg font-bold text-[var(--dxp-brand)]">{cond.prevalence}%</span>
            </div>
            <p className="text-xs text-[var(--dxp-text-secondary)] mt-2">{cond.memberCount.toLocaleString()} members affected</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
