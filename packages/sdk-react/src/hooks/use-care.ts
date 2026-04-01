import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';
import type { CareEvent, CareTeamMember, HealthProgram, DischargePlan } from '@dxp/contracts';

export function useCareTimeline() {
  return useQuery({
    queryKey: ['care', 'timeline'],
    queryFn: () => apiFetch<CareEvent[]>('/care/timeline'),
  });
}

export function useCareTeam() {
  return useQuery({
    queryKey: ['care', 'team'],
    queryFn: () => apiFetch<CareTeamMember[]>('/care/team'),
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ['care', 'programs'],
    queryFn: () => apiFetch<HealthProgram[]>('/care/programs'),
  });
}

export function useProgramDetail(programId: string) {
  return useQuery({
    queryKey: ['care', 'programs', programId],
    queryFn: () => apiFetch<HealthProgram>(`/care/programs/${programId}`),
    enabled: !!programId,
  });
}

export function useDischargePlan(encounterId: string) {
  return useQuery({
    queryKey: ['care', 'discharge', encounterId],
    queryFn: () => apiFetch<DischargePlan>(`/care/discharge/${encounterId}`),
    enabled: !!encounterId,
  });
}
