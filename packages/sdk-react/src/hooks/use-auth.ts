import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId: string;
}

export function useAuth() {
  const query = useQuery({
    queryKey: ['identity', 'me'],
    queryFn: () => apiFetch<UserProfile>('/identity/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error,
  };
}
