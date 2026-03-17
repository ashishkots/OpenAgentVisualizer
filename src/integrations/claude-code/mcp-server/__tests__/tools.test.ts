import { describe, it, expect, vi } from 'vitest';
import { TOOL_DEFINITIONS, handleTool } from '../src/tools';
import type { OAVClient } from '../src/client';

describe('MCP tool definitions', () => {
  it('exports exactly 15 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(15);
  });

  it('all tools have name, description, inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('oav_list_agents calls client.listAgents', async () => {
    const mockClient = { listAgents: vi.fn().mockResolvedValue([]) } as unknown as OAVClient;
    const result = await handleTool('oav_list_agents', { workspace_id: 'ws-1' }, mockClient);
    expect(mockClient.listAgents).toHaveBeenCalledWith('ws-1', undefined);
    expect(result.content[0].type).toBe('text');
  });

  it('oav_get_metrics calls client.getMetrics', async () => {
    const mockClient = { getMetrics: vi.fn().mockResolvedValue({ total_cost: 1.23 }) } as unknown as OAVClient;
    const result = await handleTool('oav_get_metrics', { period: 'day' }, mockClient);
    expect(mockClient.getMetrics).toHaveBeenCalledWith('day');
  });

  it('unknown tool returns error content', async () => {
    const mockClient = {} as OAVClient;
    const result = await handleTool('oav_nonexistent', {}, mockClient);
    expect(result.content[0].text).toContain('Unknown tool');
  });
});
