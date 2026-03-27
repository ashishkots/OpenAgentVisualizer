// Sprint 3 — Integration types

export type IntegrationType = 'opentrace' | 'openmesh' | 'openmind' | 'openshield';

export type IntegrationStatus = 'connected' | 'degraded' | 'disconnected' | 'not_configured';

export interface IntegrationConfig {
  id: string;
  workspace_id: string;
  product_name: IntegrationType;
  base_url: string;
  api_key: string; // masked on read
  enabled: boolean;
  status: IntegrationStatus;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConfigInput {
  base_url: string;
  api_key: string;
  enabled: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  latency_ms: number | null;
  error: string | null;
  tested_at: string;
}
