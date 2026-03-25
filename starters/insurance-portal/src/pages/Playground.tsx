import React, { useState } from 'react';
import { Tabs } from '@dxp/ui';
import { AuthPanel } from '../components/AuthPanel';
import { ApiTester } from '../components/ApiTester';
import { adapterModules } from '../data/modules';

export function Playground() {
  const [activeModule, setActiveModule] = useState(adapterModules[0].name);
  const [token, setToken] = useState<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    obtainedAt: number;
    decoded: Record<string, unknown>;
  } | null>(null);

  const currentModule = adapterModules.find((m) => m.name === activeModule) || adapterModules[0];
  const tabs = adapterModules.map((m) => ({ key: m.name, label: m.name }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">API Playground</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Interactive explorer for BFF adapter modules</p>
      </div>

      <div className="mb-6">
        <AuthPanel token={token} onTokenChange={setToken} />
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} active={activeModule} onChange={setActiveModule} variant="pill" />
      </div>

      <ApiTester module={currentModule} accessToken={token?.accessToken} />
    </div>
  );
}
