export type IntegrationStatus = 'connected' | 'not_configured' | 'error';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'cli_adapter' | 'cli_plugin' | 'sdk';
  status: IntegrationStatus;
  last_event_at: string | null;
  event_count_24h: number;
  install_command: string;
  version?: string;
  commands?: string[];
}
