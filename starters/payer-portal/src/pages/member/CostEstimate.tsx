import React, { useState } from 'react';
import { Select, OrderSummary, Card } from '@dxp/ui';

const procedures = [
  { value: 'mri-brain', label: 'MRI Brain w/ & w/o Contrast (70553)' },
  { value: 'knee-replacement', label: 'Total Knee Replacement (27447)' },
  { value: 'colonoscopy', label: 'Colonoscopy with Biopsy (45380)' },
  { value: 'office-visit', label: 'Office Visit — Level 4 (99214)' },
  { value: 'pt-session', label: 'Physical Therapy Session (97110)' },
  { value: 'ed-visit', label: 'Emergency Dept Visit — High Severity (99285)' },
];

const estimates: Record<string, { items: { label: string; amount: string }[]; total: string }> = {
  'mri-brain': {
    items: [
      { label: 'Facility fee (70553)', amount: '$2,100.00' },
      { label: 'Contractual adjustment', amount: '-$700.00' },
      { label: 'Plan pays (80%)', amount: '-$1,120.00' },
      { label: 'Applied to deductible', amount: '$280.00' },
    ],
    total: '$280.00',
  },
  'knee-replacement': {
    items: [
      { label: 'Surgeon fee', amount: '$4,500.00' },
      { label: 'Facility / hospital', amount: '$32,000.00' },
      { label: 'Anesthesia', amount: '$2,800.00' },
      { label: 'Contractual adjustment', amount: '-$14,300.00' },
      { label: 'Plan pays (80%)', amount: '-$20,000.00' },
    ],
    total: '$5,000.00',
  },
  'colonoscopy': {
    items: [
      { label: 'Procedure fee (45380)', amount: '$1,800.00' },
      { label: 'Anesthesia', amount: '$600.00' },
      { label: 'Contractual adjustment', amount: '-$720.00' },
      { label: 'Plan pays (80%)', amount: '-$1,344.00' },
    ],
    total: '$336.00',
  },
  'office-visit': {
    items: [
      { label: 'Office visit — Level 4', amount: '$225.00' },
      { label: 'Specialist copay', amount: '$50.00' },
      { label: 'Plan pays', amount: '-$175.00' },
    ],
    total: '$50.00',
  },
  'pt-session': {
    items: [
      { label: 'PT session (97110)', amount: '$175.00' },
      { label: 'Contractual adjustment', amount: '-$35.00' },
      { label: 'Plan pays (80%)', amount: '-$112.00' },
    ],
    total: '$28.00',
  },
  'ed-visit': {
    items: [
      { label: 'ED facility fee', amount: '$950.00' },
      { label: 'Physician fee', amount: '$350.00' },
      { label: 'Contractual adjustment', amount: '-$480.00' },
      { label: 'ER copay', amount: '$250.00' },
      { label: 'Plan pays (80%)', amount: '-$456.00' },
    ],
    total: '$364.00',
  },
};

export function CostEstimate() {
  const [selected, setSelected] = useState('');

  const estimate = selected ? estimates[selected] : null;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Cost Estimator</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Get an estimate for common procedures under your PPO Gold Plus plan</p>
      </div>

      <div className="max-w-2xl">
        <div className="mb-8">
          <label className="block text-sm font-bold text-[var(--dxp-text)] mb-2">Select a procedure</label>
          <Select
            options={procedures}
            value={selected}
            onChange={setSelected}
            placeholder="Choose a procedure..."
          />
        </div>

        {estimate && (
          <OrderSummary
            title="Estimated Cost Breakdown"
            items={estimate.items}
            total={{ label: 'Your Estimated Responsibility', amount: estimate.total }}
            note="This is an estimate based on in-network rates and your current plan accumulators. Actual costs may vary."
          />
        )}

        <Card className="p-5 mt-6 border-l-4 border-[var(--dxp-brand)]">
          <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-2">Important Disclaimer</h3>
          <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed">
            Cost estimates are for informational purposes only and are not a guarantee of your final cost.
            Actual costs depend on services rendered, provider billing, your current accumulator balances,
            and any applicable prior authorization requirements. Contact Member Services for detailed benefits questions.
          </p>
        </Card>
      </div>
    </div>
  );
}
