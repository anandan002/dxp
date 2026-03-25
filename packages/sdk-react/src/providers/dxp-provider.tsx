import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureDxp, DxpConfig } from '../client/api-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

interface DxpProviderProps {
  config: Partial<DxpConfig>;
  children: React.ReactNode;
}

export function DxpProvider({ config, children }: DxpProviderProps) {
  useEffect(() => {
    configureDxp(config);
  }, [config]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
