import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/api';
import { useSecurityStore } from '../stores/securityStore';
import type {
  ComplianceScore,
  AgentSecurityProfile,
  SecurityViolation,
  ViolationTimelinePoint,
} from '../types/security';

export function useSecurityScores() {
  const setComplianceScore = useSecurityStore((s) => s.setComplianceScore);

  const query = useQuery({
    queryKey: ['security-scores'],
    queryFn: async () => {
      const { data } = await apiClient.get<ComplianceScore>('/api/security/scores');
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data) setComplianceScore(query.data);
  }, [query.data, setComplianceScore]);

  return query;
}

export function useSecurityViolations(limit = 50) {
  const setViolations = useSecurityStore((s) => s.setViolations);

  const query = useQuery({
    queryKey: ['security-violations', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<SecurityViolation[]>('/api/security/violations', {
        params: { limit },
      });
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.data) setViolations(query.data);
  }, [query.data, setViolations]);

  return query;
}

export function useSecurityGrades() {
  const setAgentProfiles = useSecurityStore((s) => s.setAgentProfiles);

  const query = useQuery({
    queryKey: ['security-grades'],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentSecurityProfile[]>('/api/security/grades');
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data) setAgentProfiles(query.data);
  }, [query.data, setAgentProfiles]);

  return query;
}

export function useViolationTimeline() {
  const setTimeline = useSecurityStore((s) => s.setViolationTimeline);

  const query = useQuery({
    queryKey: ['violation-timeline'],
    queryFn: async () => {
      const { data } = await apiClient.get<ViolationTimelinePoint[]>(
        '/api/security/violations/timeline',
      );
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data) setTimeline(query.data);
  }, [query.data, setTimeline]);

  return query;
}

export function useAgentSecurityProfile(agentId: string | null) {
  return useQuery({
    queryKey: ['security-agent', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentSecurityProfile>(
        `/api/security/agents/${agentId}`,
      );
      return data;
    },
    enabled: !!agentId,
    staleTime: 60_000,
  });
}
