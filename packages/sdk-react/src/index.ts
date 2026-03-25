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
