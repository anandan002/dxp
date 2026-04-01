import React from 'react';
import { Card } from '@dxp/ui';
import { useIdCard } from '@dxp/sdk-react';
import { digitalIdCard as mockIdCard } from '../../data/mock';

export function DigitalIdCard() {
  const { data: cardData, isLoading } = useIdCard();
  const digitalIdCard = (cardData ?? mockIdCard) as typeof mockIdCard;

  return (
    <div>
      {isLoading && <div className="p-4 text-[var(--dxp-text-secondary)]">Loading ID card...</div>}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Digital ID Card</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Your digital insurance card — present this at any provider visit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Front of card */}
        <div>
          <p className="text-xs font-bold text-[var(--dxp-text-muted)] uppercase tracking-widest mb-3">Front</p>
          <Card className="aspect-[1.6/1] bg-gradient-to-br from-[var(--dxp-brand)] to-[var(--dxp-brand-dark)] p-6 flex flex-col justify-between text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-lg font-bold">{digitalIdCard.payerName}</p>
              <p className="text-xs opacity-70 mt-0.5">{digitalIdCard.planName} ({digitalIdCard.planType})</p>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Member</p>
              <p className="text-base font-bold">{digitalIdCard.memberName}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3">
                <div>
                  <p className="text-[9px] opacity-60 uppercase tracking-widest">Member ID</p>
                  <p className="text-xs font-mono">{digitalIdCard.memberId}</p>
                </div>
                <div>
                  <p className="text-[9px] opacity-60 uppercase tracking-widest">Group</p>
                  <p className="text-xs font-mono">{digitalIdCard.groupNumber}</p>
                </div>
                <div>
                  <p className="text-[9px] opacity-60 uppercase tracking-widest">Effective</p>
                  <p className="text-xs font-mono">{digitalIdCard.effectiveDate}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Back of card */}
        <div>
          <p className="text-xs font-bold text-[var(--dxp-text-muted)] uppercase tracking-widest mb-3">Back</p>
          <Card className="aspect-[1.6/1] p-6 flex flex-col justify-between bg-[var(--dxp-surface)] border border-[var(--dxp-border)]">
            <div>
              <p className="text-xs font-bold text-[var(--dxp-text)] mb-3">Pharmacy Benefits (Rx)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">RxBIN</p>
                  <p className="text-sm font-mono font-bold text-[var(--dxp-text)]">{digitalIdCard.rxBin}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">RxPCN</p>
                  <p className="text-sm font-mono font-bold text-[var(--dxp-text)]">{digitalIdCard.rxPcn}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">RxGroup</p>
                  <p className="text-sm font-mono font-bold text-[var(--dxp-text)]">{digitalIdCard.rxGroup}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--dxp-border-light)] pt-4">
              <p className="text-xs font-bold text-[var(--dxp-text)] mb-2">Important Numbers</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-[var(--dxp-text-muted)] uppercase tracking-widest">Member Services</p>
                  <p className="text-sm font-bold text-[var(--dxp-brand)]">{digitalIdCard.payerPhone}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--dxp-text-muted)] uppercase tracking-widest">24/7 Nurse Line</p>
                  <p className="text-sm font-bold text-[var(--dxp-brand)]">1-800-555-0188</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
