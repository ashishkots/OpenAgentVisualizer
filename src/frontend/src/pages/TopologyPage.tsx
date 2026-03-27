import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAgentStore } from '../stores/agentStore';
import { TopologyNode } from '../components/topology/TopologyNode';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { Agent, AgentGraph } from '../types/agent';

const nodeTypes = { agentNode: TopologyNode };

const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string; strokeWidth: number }> = {
  delegates_to:   { stroke: '#3b82f6', strokeWidth: 2 },
  shared_session: { stroke: '#94a3b8', strokeDasharray: '5 4', strokeWidth: 1 },
  data_flow:      { stroke: '#a855f7', strokeWidth: 2 },
};

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Topology' }];

function buildNodesAndEdges(
  agents: Agent[],
  relationships: AgentGraph['relationships'],
): { nodes: Node[]; edges: Edge[] } {
  const COLS = Math.ceil(Math.sqrt(agents.length));
  const X_SPACING = 220;
  const Y_SPACING = 120;

  const nodes: Node[] = agents.map((agent, i) => ({
    id: agent.id,
    type: 'agentNode',
    position: {
      x: (i % COLS) * X_SPACING + 50,
      y: Math.floor(i / COLS) * Y_SPACING + 50,
    },
    data: { agent },
  }));

  const edges: Edge[] = relationships.map((r, i) => ({
    id: `${r.source}-${r.target}-${i}`,
    source: r.source,
    target: r.target,
    type: 'smoothstep',
    animated: r.relationship_type === 'data_flow',
    style: EDGE_STYLES[r.relationship_type] ?? EDGE_STYLES.delegates_to,
    label: r.relationship_type.replace(/_/g, ' '),
    className: 'edge-enter',
  }));

  return { nodes, edges };
}

export function TopologyPage() {
  const navigate = useNavigate();
  const storeAgents = useAgentStore((s) => s.agents);
  const agents = Object.values(storeAgents);

  const { data: graph, isLoading } = useQuery({
    queryKey: ['agent-graph'],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentGraph>('/api/agents/graph');
      return data;
    },
    staleTime: 30_000,
  });

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const agentList = graph?.agents ?? agents;
    const rels = graph?.relationships ?? [];
    return buildNodesAndEdges(agentList, rels);
  }, [graph, agents]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildNodesAndEdges(
      graph?.agents ?? agents,
      graph?.relationships ?? [],
    );
    setNodes(n);
  }, [graph, agents, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    navigate(`/agents/${node.id}`);
  }, [navigate]);

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-3 space-y-1 shrink-0">
        <Breadcrumb items={BREADCRUMB} />
        <h1 className="text-xl font-bold text-oav-text">Topology Graph</h1>
      </div>

      {agents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState message="No agents to display" />
        </div>
      ) : (
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#2d3748" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const agent = (node.data as { agent: Agent }).agent;
                const colors: Record<string, string> = {
                  active: '#22c55e',
                  error: '#ef4444',
                  waiting: '#f59e0b',
                  complete: '#3b82f6',
                };
                return colors[agent.status] ?? '#94a3b8';
              }}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-oav-surface border border-oav-border rounded-xl p-3 text-xs z-30">
            <p className="text-oav-muted mb-2 font-medium">Edge Types</p>
            {Object.entries(EDGE_STYLES).map(([type, style]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <svg width="24" height="8">
                  <line
                    x1="0" y1="4" x2="24" y2="4"
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.strokeDasharray}
                  />
                </svg>
                <span className="text-oav-muted capitalize">{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
