// Sprint 7 — Organization hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useOrgStore } from '../stores/orgStore';
import type {
  Organization,
  OrgCreate,
  OrgMember,
  OrgWorkspace,
  OrgAnalytics,
  SharedAgent,
  ShareAgentInput,
} from '../types/organization';

// ----- Organization CRUD -----

export function useOrgs() {
  const setOrgs = useOrgStore((s) => s.setOrgs);

  return useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data } = await apiClient.get<Organization[]>('/api/v1/orgs');
      setOrgs(data);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useOrg(orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<Organization>(`/api/v1/orgs/${orgId}`);
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  const setCurrentOrgId = useOrgStore((s) => s.setCurrentOrgId);

  return useMutation({
    mutationFn: async (input: OrgCreate) => {
      const { data } = await apiClient.post<Organization>('/api/v1/orgs', input);
      return data;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      setCurrentOrgId(org.id);
    },
  });
}

export function useUpdateOrg(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Pick<Organization, 'name' | 'logo_url'>>) => {
      const { data } = await apiClient.put<Organization>(`/api/v1/orgs/${orgId}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId] });
    },
  });
}

// ----- Members -----

export function useOrgMembers(orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'members'],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgMember[]>(`/api/v1/orgs/${orgId}/members`);
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAddOrgMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; role: string }) => {
      const { data } = await apiClient.post<OrgMember>(`/api/v1/orgs/${orgId}/members`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId, 'members'] });
    },
  });
}

export function useRemoveOrgMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/v1/orgs/${orgId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId, 'members'] });
    },
  });
}

// ----- Workspaces -----

export function useOrgWorkspaces(orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'workspaces'],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgWorkspace[]>(`/api/v1/orgs/${orgId}/workspaces`);
      return data;
    },
    enabled: !!orgId,
  });
}

// ----- Analytics -----

export function useOrgAnalytics(orgId: string | null) {
  return useQuery({
    queryKey: ['orgs', orgId, 'analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgAnalytics>(`/api/v1/orgs/${orgId}/analytics`);
      return data;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// ----- Shared Agents -----

export function useSharedAgents() {
  return useQuery({
    queryKey: ['shared-agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<SharedAgent[]>('/api/v1/shared-agents');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useShareAgent(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ShareAgentInput) => {
      const { data } = await apiClient.post<SharedAgent>(`/api/v1/agents/${agentId}/share`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-agents'] });
    },
  });
}

export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sharedId: string) => {
      await apiClient.delete(`/api/v1/shared-agents/${sharedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-agents'] });
    },
  });
}
