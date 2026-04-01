import React, { useState } from 'react';
import { StatsDisplay, Chart, FilterBar, Card, type FilterOption } from '@dxp/ui';
import { useUtilizationDashboard } from '@dxp/sdk-react';
import { utilizationTrends, populationMetrics } from '../../data/mock-internal';

const filters: FilterOption[] = [
  { key: 'ed', label: 'ED Visits', value: 'ed' },
  { key: 'inpatient', label: 'Inpatient', value: 'inpatient' },
  { key: 'outpatient', label: 'Outpatient', value: 'outpatient' },
  { key: 'readmissions', label: 'Readmissions', value: 'readmissions' },
];

export function UtilizationDashboard() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { data: live } = useUtilizationDashboard();

  // Determine which y-keys to show based on filters
  const allKeys = ['edVisits', 'inpatientAdmissions', 'outpatientVisits', 'readmissions'];
  const filterKeyMap: Record<string, string> = {
    ed: 'edVisits',
    inpatient: 'inpatientAdmissions',
    outpatient: 'outpatientVisits',
    readmissions: 'readmissions',
  };
  const yKeys = activeFilters.length > 0
    ? activeFilters.map((f) => filterKeyMap[f]).filter(Boolean)
    : allKeys;

  const trends = (live?.trends?.length ? live.trends : utilizationTrends) as typeof utilizationTrends;
  const latestMonth = trends[trends.length - 1];
  const prevMonth = trends.length >= 2 ? trends[trends.length - 2] : latestMonth;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Utilization Management</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Service utilization trends and monitoring</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'ED Rate (per 1K)', value: populationMetrics.edUtilizationRate },
          { label: 'Readmission Rate', value: populationMetrics.readmissionRate, format: 'percent' },
          { label: 'ED Visits (latest)', value: latestMonth.edVisits },
          { label: 'Inpatient (latest)', value: latestMonth.inpatientAdmissions },
          { label: 'Outpatient (latest)', value: latestMonth.outpatientVisits },
        ]} />
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onToggle={(key) => setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key])}
          onClear={() => setActiveFilters([])}
          searchPlaceholder="Filter metrics..."
        />
      </div>

      <div className="mb-10">
        <Chart
          type="line"
          data={trends}
          xKey="month"
          yKeys={yKeys}
          title="Utilization Trends"
          description="ED visits, inpatient admissions, outpatient visits, and readmissions — last 6 months"
          height={350}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">ED Visits</h4>
          <p className="text-2xl font-bold text-[var(--dxp-text)]">{latestMonth.edVisits.toLocaleString()}</p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">
            {latestMonth.edVisits < prevMonth.edVisits ? 'Trending down' : 'Trending up'}
          </p>
        </Card>
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Inpatient Admissions</h4>
          <p className="text-2xl font-bold text-[var(--dxp-text)]">{latestMonth.inpatientAdmissions}</p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">
            {latestMonth.inpatientAdmissions < prevMonth.inpatientAdmissions ? 'Trending down' : 'Trending up'}
          </p>
        </Card>
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Outpatient Visits</h4>
          <p className="text-2xl font-bold text-[var(--dxp-text)]">{latestMonth.outpatientVisits.toLocaleString()}</p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">
            {latestMonth.outpatientVisits > prevMonth.outpatientVisits ? 'Trending up' : 'Trending down'}
          </p>
        </Card>
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Readmissions (30d)</h4>
          <p className="text-2xl font-bold text-[var(--dxp-text)]">{latestMonth.readmissions}</p>
          <p className="text-xs text-[var(--dxp-text-secondary)] mt-1">
            {latestMonth.readmissions < prevMonth.readmissions ? 'Trending down' : 'Trending up'}
          </p>
        </Card>
      </div>
    </div>
  );
}
