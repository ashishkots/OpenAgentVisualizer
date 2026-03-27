import type { OAVClient } from './client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

function text(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }] };
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'oav_list_agents',
    description: 'List all AI agents in a workspace with their status and XP',
    inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' }, status: { type: 'string' } }, required: ['workspace_id'] },
  },
  {
    name: 'oav_get_agent',
    description: 'Get details for a specific agent by ID',
    inputSchema: { type: 'object', properties: { agent_id: { type: 'string' } }, required: ['agent_id'] },
  },
  {
    name: 'oav_get_metrics',
    description: 'Get dashboard metrics (cost, tokens, error rate) for a time period',
    inputSchema: { type: 'object', properties: { period: { type: 'string', enum: ['hour', 'day', 'week', 'month'] } }, required: ['period'] },
  },
  {
    name: 'oav_list_alerts',
    description: 'List active alerts, optionally filtered by severity',
    inputSchema: { type: 'object', properties: { severity: { type: 'string', enum: ['critical', 'warning', 'info'] } } },
  },
  {
    name: 'oav_resolve_alert',
    description: 'Resolve/dismiss an alert by ID',
    inputSchema: { type: 'object', properties: { alert_id: { type: 'string' } }, required: ['alert_id'] },
  },
  {
    name: 'oav_list_traces',
    description: 'List recent traces, optionally for a specific agent',
    inputSchema: { type: 'object', properties: { agent_id: { type: 'string' }, limit: { type: 'number' } } },
  },
  {
    name: 'oav_get_trace',
    description: 'Get full details of a specific trace by ID',
    inputSchema: { type: 'object', properties: { trace_id: { type: 'string' } }, required: ['trace_id'] },
  },
  {
    name: 'oav_get_cost_summary',
    description: 'Get cost breakdown by agent and model for a time period',
    inputSchema: { type: 'object', properties: { period: { type: 'string' } }, required: ['period'] },
  },
  {
    name: 'oav_get_leaderboard',
    description: 'Get top agents ranked by XP (gamification leaderboard)',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
  {
    name: 'oav_get_workspace',
    description: 'Get workspace metadata including agent count and OTLP endpoint',
    inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' } }, required: ['workspace_id'] },
  },
  {
    name: 'oav_list_integrations',
    description: 'List all configured integrations and their connection status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'oav_replay_session',
    description: 'Start replaying a recorded agent session',
    inputSchema: { type: 'object', properties: { session_id: { type: 'string' } }, required: ['session_id'] },
  },
  {
    name: 'oav_get_slo_status',
    description: 'Get current SLO compliance status for all monitored objectives',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'oav_get_topology',
    description: 'Get the agent dependency topology graph',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'oav_health_check',
    description: 'Check if OAV backend is reachable and healthy',
    inputSchema: { type: 'object', properties: {} },
  },
];

export async function handleTool(
  name: string,
  args: Record<string, unknown>,
  client: OAVClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'oav_list_agents':
        return text(await client.listAgents(args.workspace_id as string, args.status as string | undefined));
      case 'oav_get_agent':
        return text(await client.getAgent(args.agent_id as string));
      case 'oav_get_metrics':
        return text(await client.getMetrics(args.period as string));
      case 'oav_list_alerts':
        return text(await client.listAlerts(args.severity as string | undefined));
      case 'oav_resolve_alert':
        await client.resolveAlert(args.alert_id as string);
        return text({ success: true });
      case 'oav_list_traces':
        return text(await client.listTraces(args.agent_id as string | undefined, args.limit as number | undefined));
      case 'oav_get_trace':
        return text(await client.getTrace(args.trace_id as string));
      case 'oav_get_cost_summary':
        return text(await client.getCostSummary(args.period as string));
      case 'oav_get_leaderboard':
        return text(await client.getTopAgentsByXP(args.limit as number | undefined));
      case 'oav_get_workspace':
        return text(await client.getWorkspace(args.workspace_id as string));
      case 'oav_list_integrations':
        return text(await client.listIntegrations());
      case 'oav_replay_session':
        await client.replaySession(args.session_id as string);
        return text({ success: true });
      case 'oav_get_slo_status':
        return text(await client.getSLOStatus());
      case 'oav_get_topology':
        return text(await client.getTopology());
      case 'oav_health_check':
        return text({ status: 'ok', timestamp: new Date().toISOString() });
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(`Error calling ${name}: ${(err as Error).message}`);
  }
}
