import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client/api-client';

interface MemberDashboard {
  memberId: string;
  memberName: string;
  planName: string;
  openClaims: number;
  pendingPAs: number;
  careGaps: number;
  nextAppointment?: { date: string; provider: string; specialty: string };
  recentNotifications: number;
}

interface MemberPreferences {
  language: string;
  communicationChannel: 'email' | 'sms' | 'app-push' | 'mail';
  notificationFrequency: 'immediate' | 'daily-digest' | 'weekly';
  authorizedRepresentatives: string[];
}

export function useMemberList() {
  return useQuery({
    queryKey: ['member', 'list'],
    queryFn: () => apiFetch<{ id: string; name: string }[]>('/member/list'),
  });
}

export function useMemberDashboard() {
  return useQuery({
    queryKey: ['member', 'dashboard'],
    queryFn: () => apiFetch<MemberDashboard>('/member/dashboard'),
  });
}

export function useMemberProfile() {
  return useQuery({
    queryKey: ['member', 'profile'],
    queryFn: () => apiFetch<{
      id: string;
      name: string;
      dateOfBirth: string;
      gender: string;
      phone: string;
      email: string;
      address: { line: string[]; city: string; state: string; postalCode: string };
      planName: string;
      planType: string;
      memberId: string;
      groupNumber: string;
      effectiveDate: string;
    }>('/member/profile'),
  });
}

export function useMemberPreferences() {
  return useQuery({
    queryKey: ['member', 'preferences'],
    queryFn: () => apiFetch<MemberPreferences>('/member/preferences'),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<MemberPreferences>) =>
      apiFetch('/member/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member', 'preferences'] }),
  });
}
