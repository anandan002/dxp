import React, { useState } from 'react';
import { Card, Tabs, ProgressTracker, DataTable, StatusBadge, type Column } from '@dxp/ui';
import { useBenefits, useAccumulators, useIdCard } from '@dxp/sdk-react';
import { coverage as mockCoverage, accumulators as mockAccumulators } from '../../data/mock';
import { sampleEligibilityResult } from '../../data/mock-provider';

const services = sampleEligibilityResult.benefits.services;
type Service = typeof services[0];

const serviceColumns: Column<Service>[] = [
  { key: 'service', header: 'Service', sortable: true },
  { key: 'coverage', header: 'Coverage' },
  { key: 'authRequired', header: 'Auth Required', width: '140px', render: (v) => <StatusBadge status={v ? 'required' : 'not-required'} /> },
];

const mockCopay = sampleEligibilityResult.benefits.copay;
const mockCoinsurance = sampleEligibilityResult.benefits.coinsurance;
const mockPharmacy = sampleEligibilityResult.benefits.pharmacy;

export function Benefits() {
  const [activeTab, setActiveTab] = useState('summary');
  const { data: benefitsData } = useBenefits();
  const { data: accumulatorsData } = useAccumulators();
  const { data: idCardData } = useIdCard();

  // Plan header — prefer live ID card data, fall back to mock
  const planName = idCardData?.planName ?? mockCoverage.planName;
  const planType = idCardData?.planType ?? mockCoverage.planType;
  const groupNumber = idCardData?.groupNumber ?? mockCoverage.groupNumber;
  const effectiveDate = idCardData?.effectiveDate ?? mockCoverage.period.start;

  // Accumulators — prefer live data
  const accumulators = accumulatorsData ?? mockAccumulators;
  const accumulatorSteps = accumulatorsData
    ? accumulatorsData.map((a) => ({
        label: `${a.type === 'deductible' ? 'Deductible' : 'Out-of-Pocket Max'} (${a.network})`,
        description: `$${a.used.value.toLocaleString()} of $${a.limit.value.toLocaleString()} — $${a.remaining.value.toLocaleString()} remaining`,
        status: a.used.value >= a.limit.value ? 'completed' as const : a.used.value > 0 ? 'in-progress' as const : 'pending' as const,
      }))
    : (mockAccumulators as any[]).map((a) => ({
        label: `${a.type === 'deductible' ? 'Deductible' : 'Out-of-Pocket Max'} (${a.network})`,
        description: `$${a.used.toLocaleString()} of $${a.limit.toLocaleString()} — $${a.remaining.toLocaleString()} remaining`,
        status: a.used >= a.limit ? 'completed' as const : a.used > 0 ? 'in-progress' as const : 'pending' as const,
      }));

  // Benefits copay — from live data (Medical category copay) or mock
  type BenefitItem = { category: string; network: string; copay?: { value: number; currency: string }; priorAuthRequired: boolean };
  const medBenefit = (benefitsData as BenefitItem[] | undefined)?.find((b) => b.category === 'Medical');
  const liveCopay = medBenefit?.copay?.value;

  const copay = liveCopay !== undefined
    ? {
        pcpVisit: liveCopay,
        specialistVisit: medBenefit?.copay?.value ?? mockCopay.specialistVisit,
        urgentCare: liveCopay,
        emergencyRoom: liveCopay,
      }
    : mockCopay;

  const coinsurance = mockCoinsurance; // Not in FHIR Coverage — use mock
  const pharmacy = mockPharmacy;       // Not in FHIR Coverage — use mock

  // Covered services: use live benefits if available
  type LiveBenefitRow = { service: string; coverage: string; authRequired: boolean };
  const liveBenefitRows: LiveBenefitRow[] | null = benefitsData
    ? (benefitsData as BenefitItem[]).map((b) => ({
        service: b.category,
        coverage: b.network,
        authRequired: b.priorAuthRequired,
      }))
    : null;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Benefits & Coverage</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your {planName} plan details</p>
      </div>

      <Card className="p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Plan</span>
            <p className="text-sm font-bold text-[var(--dxp-text)] mt-1">{planName}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Type</span>
            <p className="text-sm font-bold text-[var(--dxp-text)] mt-1">{planType}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Group</span>
            <p className="text-sm font-bold text-[var(--dxp-text)] mt-1">{groupNumber || mockCoverage.groupNumber}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">Effective</span>
            <p className="text-sm font-bold text-[var(--dxp-text)] mt-1">{effectiveDate || mockCoverage.period.start}</p>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <ProgressTracker
          steps={accumulatorSteps}
          title="Accumulators — 2026 Plan Year"
          estimatedCompletion={`Plan year ends ${mockCoverage.period.end}`}
        />
      </div>

      <Tabs
        tabs={[
          { key: 'summary', label: 'Summary' },
          { key: 'services', label: 'Covered Services' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Copays</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">PCP Visit</span><span className="font-bold">${copay.pcpVisit}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Specialist</span><span className="font-bold">${copay.specialistVisit}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Urgent Care</span><span className="font-bold">${copay.urgentCare}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Emergency Room</span><span className="font-bold">${copay.emergencyRoom}</span></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Coinsurance</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">In-Network</span><span className="font-bold">{coinsurance.inNetwork}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Out-of-Network</span><span className="font-bold">{coinsurance.outOfNetwork}%</span></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Pharmacy</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Tier 1 Generic</span><span className="font-bold">${pharmacy.tier1Generic}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Tier 2 Preferred</span><span className="font-bold">${pharmacy.tier2Preferred}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Tier 3 Non-Preferred</span><span className="font-bold">${pharmacy.tier3NonPreferred}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--dxp-text-secondary)]">Tier 4 Specialty</span><span className="font-bold">{pharmacy.tier4Specialty}</span></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="pt-6">
          {liveBenefitRows ? (
            <DataTable
              columns={[
                { key: 'service', header: 'Service', sortable: true },
                { key: 'coverage', header: 'Network' },
                { key: 'authRequired', header: 'Auth Required', width: '140px', render: (v: unknown) => <StatusBadge status={v ? 'required' : 'not-required'} /> },
              ]}
              data={liveBenefitRows}
            />
          ) : (
            <DataTable columns={serviceColumns} data={services} />
          )}
        </div>
      )}
    </div>
  );
}
