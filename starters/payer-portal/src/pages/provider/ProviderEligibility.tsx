import React, { useState } from 'react';
import { Input, Button, Card, DetailPanel, ProgressTracker, StatusBadge } from '@dxp/ui';
import { useIdCard, useMemberProfile } from '@dxp/sdk-react';
import { sampleEligibilityResult } from '../../data/mock-provider';

export function ProviderEligibility() {
  const [memberId, setMemberId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [showResult, setShowResult] = useState(false);
  const { data: idCard } = useIdCard();
  const { data: liveProfile } = useMemberProfile();

  const result = {
    ...sampleEligibilityResult,
    member: {
      id: idCard?.memberId ?? liveProfile?.memberId ?? sampleEligibilityResult.member.id,
      name: idCard?.memberName ?? liveProfile?.name ?? sampleEligibilityResult.member.name,
      dob: liveProfile?.dateOfBirth ?? sampleEligibilityResult.member.dob,
      gender: liveProfile?.gender ?? sampleEligibilityResult.member.gender,
    },
    coverage: {
      ...sampleEligibilityResult.coverage,
      planName: idCard?.planName ?? sampleEligibilityResult.coverage.planName,
      planType: idCard?.planType ?? sampleEligibilityResult.coverage.planType,
      groupNumber: idCard?.groupNumber ?? sampleEligibilityResult.coverage.groupNumber,
      effectiveDate: idCard?.effectiveDate ?? sampleEligibilityResult.coverage.effectiveDate,
    },
  };

  const handleLookup = () => {
    setLookupId(memberId);
    setShowResult(true);
  };

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Eligibility Check</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Verify member eligibility and benefits in real time</p>
      </div>

      {/* Lookup form */}
      <Card className="p-6 mb-8 max-w-xl">
        <h2 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Member Lookup</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter Member ID (e.g. MEM-2024-001847)"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          <Button onClick={handleLookup}>Verify</Button>
        </div>
      </Card>

      {showResult && (
        <div>
          {/* Eligibility result */}
          <Card className="p-6 mb-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--dxp-text)]">Eligibility Verified</h3>
                <p className="text-xs text-[var(--dxp-text-secondary)]">Verified at {new Date(result.verifiedAt).toLocaleString()}</p>
              </div>
              <StatusBadge status={result.coverage.status} />
            </div>
          </Card>

          {/* Member + Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Member</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Name</span><span className="font-bold">{result.member.name}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Member ID</span><span className="font-mono">{result.member.id}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">DOB</span><span>{result.member.dob}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Gender</span><span className="capitalize">{result.member.gender}</span></div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Coverage</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Plan</span><span className="font-bold">{result.coverage.planName}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Type</span><span>{result.coverage.planType}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Group</span><span className="font-mono">{result.coverage.groupNumber}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Effective</span><span>{result.coverage.effectiveDate} — {result.coverage.terminationDate}</span></div>
              </div>
            </Card>
          </div>

          {/* Accumulators */}
          <div className="mb-6">
            <ProgressTracker
              steps={[
                {
                  label: `Individual Deductible: $${result.benefits.deductible.met} of $${result.benefits.deductible.individual}`,
                  description: `$${result.benefits.deductible.individual - result.benefits.deductible.met} remaining`,
                  status: result.benefits.deductible.met >= result.benefits.deductible.individual ? 'completed' : 'in-progress',
                },
                {
                  label: `Individual OOP Max: $${result.benefits.outOfPocketMax.met.toLocaleString()} of $${result.benefits.outOfPocketMax.individual.toLocaleString()}`,
                  description: `$${(result.benefits.outOfPocketMax.individual - result.benefits.outOfPocketMax.met).toLocaleString()} remaining`,
                  status: result.benefits.outOfPocketMax.met >= result.benefits.outOfPocketMax.individual ? 'completed' : 'in-progress',
                },
              ]}
              title="Accumulator Status"
            />
          </div>

          {/* Copays + Coinsurance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Copays</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">PCP</span><span className="font-bold">${result.benefits.copay.pcpVisit}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Specialist</span><span className="font-bold">${result.benefits.copay.specialistVisit}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Urgent Care</span><span className="font-bold">${result.benefits.copay.urgentCare}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">ER</span><span className="font-bold">${result.benefits.copay.emergencyRoom}</span></div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Coinsurance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">In-Network</span><span className="font-bold">{result.benefits.coinsurance.inNetwork}%</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Out-of-Network</span><span className="font-bold">{result.benefits.coinsurance.outOfNetwork}%</span></div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Pharmacy</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Tier 1</span><span className="font-bold">${result.benefits.pharmacy.tier1Generic}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Tier 2</span><span className="font-bold">${result.benefits.pharmacy.tier2Preferred}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Tier 3</span><span className="font-bold">${result.benefits.pharmacy.tier3NonPreferred}</span></div>
                <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Tier 4</span><span className="font-bold">{result.benefits.pharmacy.tier4Specialty}</span></div>
              </div>
            </Card>
          </div>

          {/* Covered services */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-3">Covered Services</h3>
            <div className="divide-y divide-[var(--dxp-border-light)]">
              {result.benefits.services.map((svc) => (
                <div key={svc.service} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--dxp-text)]">{svc.service}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--dxp-text-secondary)]">{svc.coverage}</span>
                    {svc.authRequired && <StatusBadge status="auth-required" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
