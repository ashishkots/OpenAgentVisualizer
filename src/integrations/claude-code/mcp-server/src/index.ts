import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, handleTool } from './tools.js';
import { OAVClient } from './client.js';

const OAV_ENDPOINT = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const OAV_API_KEY = process.env.OAV_API_KEY ?? '';

const client = new OAVClient(OAV_ENDPOINT, OAV_API_KEY);
const server = new Server({ name: 'oav-mcp-server', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  return handleTool(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>, client);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
