// Sprint 7 — Plugin types

export type PluginStatus = 'installed' | 'disabled' | 'error';

export interface PluginManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: string[];
  hooks: string[];
  routes: string[];
}

export interface Plugin {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  manifest: PluginManifest;
  status: PluginStatus;
  installed_by: string;
  installed_at: string;
}

export interface PluginRegistry {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  manifest_url: string;
  download_url: string;
  verified: boolean;
  downloads: number;
  created_at: string;
}

export interface PluginInstallRequest {
  registry_id: string;
}
