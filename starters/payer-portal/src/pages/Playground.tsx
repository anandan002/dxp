import React, { useState } from 'react';
import { Tabs, Card, CardContent, Badge } from '@dxp/ui';
import { AuthPanel } from '../components/AuthPanel';
import { ApiTester } from '../components/ApiTester';
import { fhirModules } from '../data/fhir-modules';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
  decoded: Record<string, unknown>;
}

const moduleTabs = fhirModules.map((m) => ({ key: m.name, label: m.name.split(' ')[0] }));

// FHIR / Da Vinci IG summary cards shown above the tester
const igCards = [
  {
    label: 'Da Vinci PAS',
    ig: 'HL7 Da Vinci PAS v2.0',
    what: 'Prior Authorization Support — submit, track, and decide PA requests using FHIR Claim (preauthorization) + ClaimResponse',
    fhirResources: ['Claim', 'ClaimResponse', 'CoverageEligibilityResponse', 'Questionnaire'],
  },
  {
    label: 'FHIR R4 Claims',
    ig: 'CPCDS / US Core v6',
    what: 'ExplanationOfBenefit read via FHIR. Member-facing claims history with adjudication detail and appeal workflow.',
    fhirResources: ['ExplanationOfBenefit', 'Patient', 'Coverage'],
  },
  {
    label: 'FHIR Coverage',
    ig: 'Da Vinci PDex + US Core',
    what: 'Real-time eligibility verification. Coverage, accumulators, and digital ID card from FHIR Coverage resources.',
    fhirResources: ['Coverage', 'CoverageEligibilityResponse', 'Patient'],
  },
  {
    label: 'Provider Directory',
    ig: 'Da Vinci PDex Plan Net',
    what: 'In-network provider search and NPI validation. Reads Practitioner, PractitionerRole, Organization from HAPI or NPPES.',
    fhirResources: ['Practitioner', 'PractitionerRole', 'Organization', 'Location'],
  },
  {
    label: 'HCC / Risk',
    ig: 'CMS-HCC v28',
    what: 'Population health risk scoring from Condition (ICD-10) resources. Powers care gap worklist and RAF score computation.',
    fhirResources: ['Condition', 'ExplanationOfBenefit', 'MeasureReport'],
  },
];

export function Playground() {
  const [activeModule, setActiveModule] = useState(fhirModules[0].name);
  const [token, setToken] = useState<TokenInfo | null>(null);

  const currentModule = fhirModules.find((m) => m.name === activeModule) || fhirModules[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">FHIR API Playground</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Live explorer for Da Vinci PAS, FHIR R4 Claims, Coverage, Provider Directory, and HCC Risk — all wired to HAPI FHIR
        </p>
      </div>

      {/* IG summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
        {igCards.map((card) => (
          <Card
            key={card.label}
            className={`cursor-pointer transition-all ${activeModule.startsWith(card.label.split(' ')[0]) ? 'ring-2 ring-[var(--dxp-brand)]' : ''}`}
            onClick={() => {
              const mod = fhirModules.find((m) => m.name.startsWith(card.label.split(' ')[0]));
              if (mod) setActiveModule(mod.name);
            }}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--dxp-text)]">{card.label}</span>
                <Badge variant="info" className="text-[9px]">Live</Badge>
              </div>
              <p className="text-[10px] text-[var(--dxp-brand)] font-mono">{card.ig}</p>
              <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">{card.what}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {card.fhirResources.map((r) => (
                  <span key={r} className="text-[9px] font-mono bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)] px-1.5 py-0.5 rounded">
                    {r}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auth */}
      <div className="mb-6">
        <AuthPanel token={token} onTokenChange={setToken} />
      </div>

      {/* Module tabs */}
      <div className="mb-6">
        <Tabs tabs={moduleTabs} active={activeModule} onChange={setActiveModule} variant="pill" />
      </div>

      {/* Tester */}
      <ApiTester module={currentModule} accessToken={token?.accessToken} />
    </div>
  );
}
