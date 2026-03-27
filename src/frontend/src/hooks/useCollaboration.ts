import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useCollaborationStore } from '../stores/collaborationStore';
import type { WorkspaceInvite, ActivityEntry } from '../types/collaboration';

interface CreateInvitePayload {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface CreateInviteResponse {
  invite: WorkspaceInvite;
  invite_url: string;
}

export function useInvites() {
  const setInvites = useCollaborationStore((s) => s.setInvites);

  return useQuery({
    queryKey: ['workspace-invites'],
    queryFn: async () => {
      const { data } = await apiClient.get<WorkspaceInvite[]>('/api/workspaces/invites');
      setInvites(data);
      return data;
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const addInvite = useCollaborationStore((s) => s.addInvite);

  return useMutation({
    mutationFn: async (payload: CreateInvitePayload) => {
      const { data } = await apiClient.post<CreateInviteResponse>('/api/workspaces/invite', payload);
      return data;
    },
    onSuccess: (data) => {
      addInvite(data.invite);
      void queryClient.invalidateQueries({ queryKey: ['workspace-invites'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const removeInvite = useCollaborationStore((s) => s.removeInvite);

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/workspaces/invites/${id}`);
      return id;
    },
    onSuccess: (id) => {
      removeInvite(id);
      void queryClient.invalidateQueries({ queryKey: ['workspace-invites'] });
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(`/api/workspaces/invites/${token}/accept`);
      return data;
    },
  });
}

export function useActivity() {
  const setActivity = useCollaborationStore((s) => s.setActivity);

  return useQuery({
    queryKey: ['workspace-activity'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActivityEntry[]>('/api/workspaces/activity?limit=50');
      setActivity(data);
      return data;
    },
    refetchInterval: 30_000,
  });
}
