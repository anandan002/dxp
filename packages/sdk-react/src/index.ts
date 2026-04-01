// @dxp/sdk-react — React hooks and providers for DXP platform

// Provider
export { DxpProvider } from './providers/dxp-provider';

// Client config
export { configureDxp, apiFetch } from './client/api-client';
export type { DxpConfig } from './client/api-client';

// Hooks
export { useAuth } from './hooks/use-auth';
export { useCms, useCmsItem, useCmsCreate } from './hooks/use-cms';
export { useDocuments, useDocumentUpload, useDocumentDownloadUrl } from './hooks/use-documents';
export { useSearch, useSuggest } from './hooks/use-search';
export { useSendNotification } from './hooks/use-notifications';
export { usePresignedUpload, usePresignedDownload } from './hooks/use-storage';

// Payer portal hooks
export { useClaims, useClaimDetail, useClaimEOB, useAppeal, useClaimsDashboard } from './hooks/use-claims';
export { useBenefits, useAccumulators, useCostEstimate, useIdCard } from './hooks/use-eligibility';
export {
  usePriorAuths, usePriorAuthDetail, usePACheck, usePATemplate,
  usePASubmit, usePADecide, usePAQueue, usePADashboard,
} from './hooks/use-prior-auth';
export { useProviderSearch, useProviderDetail } from './hooks/use-providers';
export { useCareTimeline, useCareTeam, usePrograms, useProgramDetail, useDischargePlan } from './hooks/use-care';
export { useMemberList, useMemberDashboard, useMemberProfile, useMemberPreferences, useUpdatePreferences } from './hooks/use-member';
export { usePopulationDashboard, useRiskWorklist, useMemberRiskProfile, useCareGaps, useCloseCareGap } from './hooks/use-population';
export { useQualityDashboard, useQualityCareGaps, useTriggerOutreach } from './hooks/use-quality';
export { useUtilizationDashboard, useContractScorecards, useVBCDetail, useScenarioSimulate } from './hooks/use-analytics';
