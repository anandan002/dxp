import type { ConsentRecord, ConsentDecision } from '@dxp/contracts';

export abstract class ConsentPort {
  abstract getConsents(tenantId: string, memberId: string): Promise<ConsentRecord[]>;
  abstract grantConsent(tenantId: string, memberId: string, decision: ConsentDecision): Promise<ConsentRecord>;
  abstract revokeConsent(tenantId: string, consentId: string): Promise<void>;
}
