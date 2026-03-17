import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgents, createAgent } from '../agentApi';
import * as apiModule from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() }
}));

describe('agentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAgents calls GET /api/agents', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValueOnce({ data: [] });
    const result = await getAgents();
    expect(apiModule.apiClient.get).toHaveBeenCalledWith('/api/agents');
    expect(result).toEqual([]);
  });

  it('createAgent calls POST /api/agents', async () => {
    const agent = { name: 'Bot', role: 'worker', framework: 'custom' };
    vi.mocked(apiModule.apiClient.post).mockResolvedValueOnce({ data: { id: '1', ...agent } });
    const result = await createAgent(agent);
    expect(apiModule.apiClient.post).toHaveBeenCalledWith('/api/agents', agent);
    expect(result.id).toBe('1');
  });
});
