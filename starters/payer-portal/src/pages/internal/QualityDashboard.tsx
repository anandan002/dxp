import React from 'react';
import { StatsDisplay, DataTable, Chart, Card, ProgressTracker, Badge, type Column, type ProgressStep } from '@dxp/ui';
import { useQualityDashboard } from '@dxp/sdk-react';
import { hedisMetrics, starsRating } from '../../data/mock-internal';

type HEDISMeasure = typeof hedisMetrics[0];

const columns: Column<HEDISMeasure>[] = [
  { key: 'measure', header: 'Measure', width: '90px', render: (v) => <span className="font-mono font-bold text-[var(--dxp-brand)]">{String(v)}</span> },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'rate', header: 'Rate', sortable: true, width: '80px', render: (v) => <span className="font-bold">{String(v)}%</span> },
  { key: 'benchmark', header: 'Benchmark', width: '100px', render: (v) => `${String(v)}%` },
  { key: 'percentile', header: 'Percentile', sortable: true, width: '100px', render: (v) => {
    const pct = Number(v);
    return <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'info' : pct >= 25 ? 'warning' : 'danger'}>{pct}th</Badge>;
  }},
  { key: 'trend', header: 'Trend', width: '100px', render: (v) => {
    const trend = String(v);
    return <Badge variant={trend === 'improving' ? 'success' : trend === 'stable' ? 'info' : 'danger'}>{trend}</Badge>;
  }},
];

const measuresVsBenchmark = hedisMetrics.map((m) => ({
  measure: m.measure,
  rate: m.rate,
  benchmark: m.benchmark,
}));

const gapClosureSteps: ProgressStep[] = [
  ...hedisMetrics
    .filter((m) => m.rate < m.benchmark)
    .map((m) => ({
      label: `${m.measure} — ${m.name}`,
      description: `${m.rate}% current vs ${m.benchmark}% benchmark (${(m.benchmark - m.rate).toFixed(1)}% gap)`,
      status: 'in-progress' as const,
    })),
  ...hedisMetrics
    .filter((m) => m.rate >= m.benchmark)
    .map((m) => ({
      label: `${m.measure} — ${m.name}`,
      description: `${m.rate}% current vs ${m.benchmark}% benchmark`,
      status: 'completed' as const,
    })),
];

const metAtBenchmark = hedisMetrics.filter((m) => m.rate >= m.benchmark);

export function QualityDashboard() {
  const { data: live } = useQualityDashboard();
  const overallStars = live?.overallStarsRating ?? starsRating.overall;
  const measuresCount = live?.measureCount ?? hedisMetrics.length;
  const metCount = live?.measureCount != null
    ? (live.measureCount - (live.openGapCount ?? 0))
    : metAtBenchmark.length;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Quality & HEDIS</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">CMS Stars rating, HEDIS performance, and quality gap closure tracking</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={[
          { label: 'Overall Stars', value: overallStars },
          { label: 'Previous Year', value: starsRating.previousYear },
          { label: 'Measures at Benchmark', value: metCount },
          { label: 'Total Measures', value: measuresCount },
        ]} />
      </div>

      {/* Stars rating breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Stars Rating Categories</h3>
          <div className="space-y-4">
            {starsRating.categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[var(--dxp-text)]">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-4 h-4 ${star <= cat.rating ? 'text-[var(--dxp-warning)]' : 'text-[var(--dxp-border)]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs font-bold ml-1">{cat.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Chart
          type="bar"
          data={measuresVsBenchmark}
          xKey="measure"
          yKeys={['rate', 'benchmark']}
          title="Measures vs Benchmarks"
          description="Current HEDIS rates compared to national benchmarks"
          height={250}
        />
      </div>

      {/* Gap closure tracker */}
      <div className="mb-10">
        <ProgressTracker
          steps={gapClosureSteps}
          title="Quality Gap Closure"
          estimatedCompletion="Target: 5-Star by 2027"
        />
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">HEDIS Measures</h3>
      <DataTable columns={columns} data={hedisMetrics} />
    </div>
  );
}
