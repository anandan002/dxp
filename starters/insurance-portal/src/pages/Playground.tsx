import React, { useState } from 'react';
import { AuthPanel } from '../components/AuthPanel';
import { ApiTester } from '../components/ApiTester';
import { adapterModules } from '../data/modules';

// ── Module grouping ──────────────────────────────────────────────────────────

const FHIR_MODULE_NAMES = new Set([
  'Prior Auth (Da Vinci PAS)',
  'Claims (FHIR EOB)',
  'Eligibility (FHIR Coverage)',
  'Provider Directory',
  'Risk Stratification (HCC)',
]);

const coreModules  = adapterModules.filter((m) => !FHIR_MODULE_NAMES.has(m.name));
const fhirModules  = adapterModules.filter((m) =>  FHIR_MODULE_NAMES.has(m.name));

// ── Grouped tab bar ──────────────────────────────────────────────────────────

interface GroupedTabsProps {
  active: string;
  onChange: (name: string) => void;
}

function GroupedTabs({ active, onChange }: GroupedTabsProps) {
  const tabCls = (name: string) =>
    `px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
      active === name
        ? 'bg-[var(--dxp-brand)] text-white shadow-sm'
        : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)]'
    }`;

  return (
    <div className="space-y-3">
      {/* Core Platform */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2 px-1">
          Core Platform
        </p>
        <div className="flex flex-wrap gap-1.5">
          {coreModules.map((m) => (
            <button key={m.name} onClick={() => onChange(m.name)} className={tabCls(m.name)}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--dxp-border-light)]" />

      {/* Healthcare / FHIR */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">
            Healthcare — FHIR / Da Vinci
          </p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
            FHIR R4
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {fhirModules.map((m) => (
            <button
              key={m.name}
              onClick={() => onChange(m.name)}
              className={
                active === m.name
                  ? 'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer bg-teal-600 text-white shadow-sm'
                  : 'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)]'
              }
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const isFhir = FHIR_MODULE_NAMES.has(activeModule);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">API Playground</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Interactive explorer for BFF adapter modules</p>
      </div>

      <div className="mb-6">
        <AuthPanel token={token} onTokenChange={setToken} />
      </div>

      {/* Grouped module selector */}
      <div className="mb-6 p-4 rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)]">
        <GroupedTabs active={activeModule} onChange={setActiveModule} />
      </div>

      {/* Active group indicator */}
      {isFhir && (
        <div className="mb-4 flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-[var(--dxp-radius)] px-3 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            <strong>FHIR R4 module</strong> — results come live from HAPI FHIR via the BFF adapter.
            Requires <code className="font-mono">make up</code> + <code className="font-mono">pnpm seed:fhir</code>.
          </span>
        </div>
      )}

      <ApiTester module={currentModule} accessToken={token?.accessToken} />
    </div>
  );
}
