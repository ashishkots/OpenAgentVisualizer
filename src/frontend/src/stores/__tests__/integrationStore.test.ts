import { describe, it, expect, beforeEach } from 'vitest';
import { useIntegrationStore } from '../integrationStore';
import type { IntegrationConfig } from '../../types/integration';

describe('useIntegrationStore', () => {
  beforeEach(() => {
    useIntegrationStore.getState().reset();
  });

  it('initialises with null configs', () => {
    const state = useIntegrationStore.getState();
    expect(state.configs.opentrace).toBeNull();
    expect(state.configs.openmesh).toBeNull();
  });

  it('setConfig updates a single product config', () => {
    const cfg = {
      id: '1',
      workspace_id: 'ws1',
      product_name: 'opentrace' as const,
      base_url: 'http://localhost',
      api_key: 'sk-test',
      enabled: true,
      status: 'connected' as const,
      last_checked_at: null,
      created_at: '',
      updated_at: '',
    };
    useIntegrationStore.getState().setConfig('opentrace', cfg);
    expect(useIntegrationStore.getState().configs.opentrace).toEqual(cfg);
  });

  it('setAllConfigs populates multiple products', () => {
    const configs: IntegrationConfig[] = [
      { id: '1', workspace_id: 'ws1', product_name: 'opentrace', base_url: 'http://a', api_key: '', enabled: true, status: 'connected', last_checked_at: null, created_at: '', updated_at: '' },
      { id: '2', workspace_id: 'ws1', product_name: 'openmesh', base_url: 'http://b', api_key: '', enabled: false, status: 'not_configured', last_checked_at: null, created_at: '', updated_at: '' },
    ];
    useIntegrationStore.getState().setAllConfigs(configs);
    expect(useIntegrationStore.getState().configs.opentrace?.base_url).toBe('http://a');
    expect(useIntegrationStore.getState().configs.openmesh?.base_url).toBe('http://b');
  });

  it('getStatus returns not_configured for null config', () => {
    expect(useIntegrationStore.getState().getStatus('openmind')).toBe('not_configured');
  });

  it('getStatus returns not_configured for disabled config', () => {
    useIntegrationStore.getState().setConfig('opentrace', {
      id: '1', workspace_id: 'ws1', product_name: 'opentrace', base_url: '', api_key: '', enabled: false, status: 'connected', last_checked_at: null, created_at: '', updated_at: '',
    });
    expect(useIntegrationStore.getState().getStatus('opentrace')).toBe('not_configured');
  });

  it('getStatus returns the config status when enabled', () => {
    useIntegrationStore.getState().setConfig('opentrace', {
      id: '1', workspace_id: 'ws1', product_name: 'opentrace', base_url: '', api_key: '', enabled: true, status: 'degraded', last_checked_at: null, created_at: '', updated_at: '',
    });
    expect(useIntegrationStore.getState().getStatus('opentrace')).toBe('degraded');
  });

  it('reset clears all state', () => {
    useIntegrationStore.getState().setConfig('opentrace', {
      id: '1', workspace_id: 'ws1', product_name: 'opentrace', base_url: 'http://x', api_key: '', enabled: true, status: 'connected', last_checked_at: null, created_at: '', updated_at: '',
    });
    useIntegrationStore.getState().reset();
    expect(useIntegrationStore.getState().configs.opentrace).toBeNull();
  });
});
