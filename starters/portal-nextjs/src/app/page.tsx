'use client';

import { DashboardCard } from '@dxp/ui';

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Portal Dashboard</h1>
      <p className="mt-2 text-gray-500">
        This is the DXP Next.js starter. Replace this page with your portal content.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Users" value={142} trend={{ value: 12, label: 'this month' }} />
        <DashboardCard title="Documents" value={38} subtitle="Across all categories" />
        <DashboardCard title="Pending" value={5} trend={{ value: -20, label: 'vs last week' }} />
        <DashboardCard title="Integrations" value={3} subtitle="Active connections" />
      </div>

      <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>1. Configure <code className="rounded bg-gray-100 px-1">src/lib/dxp.ts</code> with your BFF and Keycloak URLs</li>
          <li>2. Add pages under <code className="rounded bg-gray-100 px-1">src/app/</code> using <code className="rounded bg-gray-100 px-1">@dxp/ui</code> components</li>
          <li>3. Use <code className="rounded bg-gray-100 px-1">@dxp/sdk-react</code> hooks to fetch data from the BFF</li>
          <li>4. Customize the brand colors in <code className="rounded bg-gray-100 px-1">tailwind.config.js</code></li>
          <li>5. Run <code className="rounded bg-gray-100 px-1">pnpm dev</code> to start developing</li>
        </ul>
      </div>
    </div>
  );
}
