import React from 'react';
import { StatsDisplay, Chart, DataTable, Card, StatusBadge, type Column, type Stat } from '@dxp/ui';

const qualityStats: Stat[] = [
  { label: 'NPI Match Rate', value: 94.2, format: 'percent' },
  { label: 'Address Accuracy', value: 88.7, format: 'percent' },
  { label: 'Taxonomy Coverage', value: 91.5, format: 'percent' },
  { label: 'Credentialing Current', value: 86.3, format: 'percent' },
  { label: 'Total Providers', value: 3842 },
];

const qualityTrend = [
  { month: 'Oct', npiMatch: 92.1, addressAccuracy: 86.2, taxonomyCoverage: 89.8 },
  { month: 'Nov', npiMatch: 92.8, addressAccuracy: 87.0, taxonomyCoverage: 90.1 },
  { month: 'Dec', npiMatch: 93.2, addressAccuracy: 87.5, taxonomyCoverage: 90.5 },
  { month: 'Jan', npiMatch: 93.5, addressAccuracy: 88.0, taxonomyCoverage: 91.0 },
  { month: 'Feb', npiMatch: 93.9, addressAccuracy: 88.4, taxonomyCoverage: 91.2 },
  { month: 'Mar', npiMatch: 94.2, addressAccuracy: 88.7, taxonomyCoverage: 91.5 },
];

type Anomaly = {
  id: string;
  provider: string;
  npi: string;
  issue: string;
  severity: string;
  detectedDate: string;
  status: string;
};

const anomalies: Anomaly[] = [
  { id: 'a-1', provider: 'Dr. Thomas Brown', npi: '1234567891', issue: 'NPI mismatch — taxonomy code updated at NPPES', severity: 'high', detectedDate: '2026-03-28', status: 'open' },
  { id: 'a-2', provider: 'Beacon Urgent Care', npi: '1234567892', issue: 'Address discrepancy — new location not reflected', severity: 'medium', detectedDate: '2026-03-25', status: 'in-review' },
  { id: 'a-3', provider: 'Dr. Emily Park', npi: '1234567893', issue: 'Credentialing expiration in 30 days', severity: 'medium', detectedDate: '2026-03-20', status: 'open' },
  { id: 'a-4', provider: 'Dr. David Lee', npi: '1234567894', issue: 'Missing board certification documentation', severity: 'high', detectedDate: '2026-03-18', status: 'open' },
  { id: 'a-5', provider: 'Boston Women\'s Health', npi: '1234567895', issue: 'Taxonomy code does not match specialty', severity: 'low', detectedDate: '2026-03-15', status: 'resolved' },
  { id: 'a-6', provider: 'Dr. Lisa Patel', npi: '1234567896', issue: 'Out-of-network provider incorrectly listed as in-network', severity: 'high', detectedDate: '2026-03-10', status: 'in-review' },
];

const anomalyColumns: Column<Anomaly>[] = [
  { key: 'provider', header: 'Provider', sortable: true },
  { key: 'npi', header: 'NPI', width: '120px', render: (v) => <span className="font-mono">{String(v)}</span> },
  { key: 'issue', header: 'Issue' },
  { key: 'severity', header: 'Severity', width: '100px', render: (v) => <StatusBadge status={String(v)} /> },
  { key: 'detectedDate', header: 'Detected', width: '110px', sortable: true },
  { key: 'status', header: 'Status', width: '110px', render: (v) => <StatusBadge status={String(v)} /> },
];

export function ProviderDataQuality() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Provider Data Quality</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Data integrity monitoring and anomaly detection</p>
      </div>

      <div className="mb-8">
        <StatsDisplay stats={qualityStats} />
      </div>

      <div className="mb-10">
        <Chart
          type="line"
          data={qualityTrend}
          xKey="month"
          yKeys={['npiMatch', 'addressAccuracy', 'taxonomyCoverage']}
          title="Quality Trends"
          description="Provider data quality metrics — last 6 months"
          height={280}
        />
      </div>

      <h3 className="text-lg font-bold text-[var(--dxp-text)] mb-4">Data Anomalies</h3>
      <DataTable columns={anomalyColumns} data={anomalies} />
    </div>
  );
}
