import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SlideInPanel } from '../components/ui/SlideInPanel';
import { FallbackBanner } from '../components/ui/FallbackBanner';
import { IntegrationStatusBadge } from '../components/ui/IntegrationStatusBadge';
import { MeshTopologyNode } from '../components/mesh/MeshTopologyNode';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useMeshTopology } from '../hooks/useMesh';
import { useMeshStore } from '../stores/meshStore';
import { useIntegrationStore } from '../stores/integrationStore';
import type { MeshNode, MeshEdge, MeshEdgeHealth } from '../types/mesh';
import { Link } from 'react-router-dom';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mesh Topology' },
];

const NODE_TYPES: NodeTypes = { meshNode: MeshTopologyNode };

const EDGE_STROKE: Record<string, number> = {
  lt10: 1, lt100: 2, lt1000: 3, gt1000: 4,
};
const EDGE_HEALTH_COLOR: Record<MeshEdgeHealth, string> = {
  healthy: '#34d399',
  high_latency: '#f59e0b',
  high_error: '#ef4444',
};

function buildFlow(meshNodes: MeshNode[], meshEdges: MeshEdge[]) {
  const COLS = Math.max(1, Math.ceil(Math.sqrt(meshNodes.length)));
  const nodes: Node[] = meshNodes.map((n, i) => ({
    id: n.id,
    type: 'meshNode',
    position: { x: (i % COLS) * 220 + 50, y: Math.floor(i / COLS) * 130 + 50 },
    data: { meshNode: n },
  }));

  const edges: Edge[] = meshEdges.map((e) => {
    let strokeWidth: number;
    if (e.messages_per_hr > 1000) strokeWidth = EDGE_STROKE.gt1000;
    else if (e.messages_per_hr > 100) strokeWidth = EDGE_STROKE.lt1000;
    else if (e.messages_per_hr > 10) strokeWidth = EDGE_STROKE.lt100;
    else strokeWidth = EDGE_STROKE.lt10;

    return {
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      type: 'smoothstep',
      style: {
        stroke: EDGE_HEALTH_COLOR[e.health],
        strokeWidth,
      },
      label: `${e.protocol}`,
      labelStyle: { fontSize: 9, fill: '#94a3b8' },
    };
  });

  return { nodes, edges };
}

export function MeshTopologyPage() {
  const { period, setPeriod, selectedNodeId, setSelectedNode, topology } = useMeshStore();
  const meshStatus = useIntegrationStore((s) => s.getStatus('openmesh'));

  const { isLoading, isError } = useMeshTopology(period);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlow(topology?.nodes ?? [], topology?.edges ?? []),
    [topology],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildFlow(topology?.nodes ?? [], topology?.edges ?? []);
    setNodes(n);
  }, [topology, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const selectedNode = topology?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full" data-testid="mesh-topology-page">
      {/* Breadcrumb + title */}
      <div className="p-6 pb-3 space-y-1 shrink-0">
        <Breadcrumb items={BREADCRUMB} />
        <h1 className="text-xl font-bold text-oav-text">Mesh Topology</h1>
      </div>

      {isError && (
        <div className="px-6 mb-2">
          <FallbackBanner
            productName="OpenMesh"
            fallbackDescription="Showing local topology. Mesh-specific data unavailable."
          />
        </div>
      )}

      <div className="flex-1 relative">
        {isLoading && !topology ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={NODE_TYPES}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#2d3748" gap={16} />
            <Controls />
          </ReactFlow>
        )}

        {/* Mesh stats overlay (top) */}
        {topology && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl px-4 py-2 text-xs flex flex-wrap items-center gap-4 pointer-events-none">
            <span className="flex items-center gap-1.5">
              <span className="text-oav-muted">Agents:</span>
              <span className="text-oav-text font-semibold tabular-nums">
                {topology.summary.total_agents}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-oav-muted">Connections:</span>
              <span className="text-oav-text font-semibold tabular-nums">
                {topology.summary.total_connections}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-oav-muted">Msg/min:</span>
              <span className="text-oav-text font-semibold tabular-nums">
                {topology.summary.messages_per_min.toLocaleString()}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-oav-muted">Avg Latency:</span>
              <span className="text-oav-text font-semibold tabular-nums">
                {topology.summary.avg_latency_ms}ms
              </span>
            </span>
            <span className="pointer-events-auto">
              <IntegrationStatusBadge status={meshStatus} />
            </span>
            {/* Period selector */}
            <div className="ml-auto flex gap-1 pointer-events-auto">
              {(['1h', '24h', '7d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                    period === p ? 'bg-oav-accent text-white' : 'text-oav-muted hover:text-oav-text',
                  )}
                  data-testid={`period-${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Node detail panel */}
      <SlideInPanel
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.agent_name ?? 'Node Details'}
        width="320"
        data-testid="mesh-node-panel"
      >
        {selectedNode && (
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              {[
                { label: 'Mesh Role', value: selectedNode.mesh_role },
                { label: 'Status', value: selectedNode.is_connected ? 'Connected' : 'Disconnected' },
                { label: 'Level', value: `${selectedNode.agent_level}` },
                { label: 'Peers', value: `${selectedNode.connected_peers}` },
                { label: 'Messages Sent', value: selectedNode.messages_sent.toLocaleString() },
                { label: 'Messages Received', value: selectedNode.messages_received.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-oav-muted">{label}</span>
                  <span className="text-oav-text font-medium">{value}</span>
                </div>
              ))}
            </div>
            <Link
              to={`/agents/${selectedNode.agent_id}`}
              className="block text-center text-sm text-oav-accent hover:underline mt-2"
            >
              View Full Profile →
            </Link>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
