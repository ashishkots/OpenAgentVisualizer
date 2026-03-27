// Sprint 7 — SSO types

export type SSOProviderType = 'saml' | 'oidc';

export interface SSOConfig {
  id: string;
  workspace_id: string;
  provider_type: SSOProviderType;
  // SAML fields
  entity_id: string | null;
  sso_url: string | null;
  certificate: string | null;
  metadata_url: string | null;
  // OIDC fields
  client_id: string | null;
  client_secret: string | null; // masked on read
  issuer: string | null;
  // Common
  enabled: boolean;
  created_at: string;
}

export interface SSOConfigInput {
  provider_type: SSOProviderType;
  // SAML
  entity_id?: string;
  sso_url?: string;
  certificate?: string;
  metadata_url?: string;
  // OIDC
  client_id?: string;
  client_secret?: string;
  issuer?: string;
  enabled: boolean;
}

export interface SSOTestResult {
  success: boolean;
  message: string;
  tested_at: string;
}
