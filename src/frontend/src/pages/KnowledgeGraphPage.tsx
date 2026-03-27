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
import { BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SlideInPanel } from '../components/ui/SlideInPanel';
import { IntegrationStatusBadge } from '../components/ui/IntegrationStatusBadge';
import { KnowledgeGraphNode } from '../components/knowledge/KnowledgeGraphNode';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useKnowledgeGraph, useKnowledgeSearch } from '../hooks/useKnowledge';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { useDebounce } from '../hooks/useDebounce';
import type { EntityType, KnowledgeEntity } from '../types/knowledge';
import { Link } from 'react-router-dom';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Knowledge Graph' },
];

const NODE_TYPES: NodeTypes = { knowledgeNode: KnowledgeGraphNode };

const ENTITY_TYPE_OPTIONS: { value: EntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'concept', label: 'Concept' },
  { value: 'fact', label: 'Fact' },
  { value: 'agent_memory', label: 'Memory' },
  { value: 'embedding', label: 'Embedding' },
];

function buildKnowledgeFlow(
  entities: KnowledgeEntity[],
  edges: { id: string; source_id: string; target_id: string; relationship_type: string }[],
  searchQuery: string,
  searchResults: KnowledgeEntity[],
  filterType: EntityType | 'all',
) {
  const searchActive = searchQuery.trim().length > 0;
  const matchIds = new Set(searchResults.map((e) => e.id));
  const filterActive = filterType !== 'all';

  const filtered = filterActive
    ? entities.filter((e) => e.entity_type === filterType)
    : entities;

  const COLS = Math.max(1, Math.ceil(Math.sqrt(filtered.length)));
  const nodes: Node[] = filtered.map((entity, i) => ({
    id: entity.id,
    type: 'knowledgeNode',
    position: {
      x: entity.x ?? (i % COLS) * 160 + 50,
      y: entity.y ?? Math.floor(i / COLS) * 160 + 50,
    },
    data: {
      entity,
      isSearchMatch: searchActive ? matchIds.has(entity.id) : null,
      isSelected: false,
    },
  }));

  const nodeIds = new Set(filtered.map((e) => e.id));
  const flowEdges: Edge[] = edges
    .filter((e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id))
    .map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      label: e.relationship_type,
      style: { stroke: '#94a3b8', strokeWidth: 1 },
      labelStyle: { fontSize: 10, fill: '#94a3b8' },
    }));

  return { nodes, edges: flowEdges };
}

export function KnowledgeGraphPage() {
  const {
    graph,
    selectedEntity,
    setSelectedEntity,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    searchResults,
    displayedCount,
    loadMore,
  } = useKnowledgeStore();

  const mindStatus = useIntegrationStore((s) => s.getStatus('openmind'));
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { isLoading, isError } = useKnowledgeGraph(displayedCount);
  useKnowledgeSearch(debouncedQuery, debouncedQuery.length > 0);

  const displayedEntities = useMemo(() => {
    return graph?.entities.slice(0, displayedCount) ?? [];
  }, [graph, displayedCount]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      buildKnowledgeFlow(
        displayedEntities,
        graph?.edges ?? [],
        debouncedQuery,
        searchResults,
        filterType,
      ),
    [displayedEntities, graph?.edges, debouncedQuery, searchResults, filterType],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildKnowledgeFlow(
      displayedEntities,
      graph?.edges ?? [],
      debouncedQuery,
      searchResults,
      filterType,
    );
    setNodes(n);
  }, [displayedEntities, graph?.edges, debouncedQuery, searchResults, filterType, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = displayedEntities.find((e) => e.id === node.id);
      if (entity) setSelectedEntity(entity);
    },
    [displayedEntities, setSelectedEntity],
  );

  if (isError || mindStatus === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-6">
        <BookOpen className="w-12 h-12 text-oav-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-oav-text">OpenMind connection unavailable.</p>
        <p className="text-xs text-oav-muted max-w-xs">
          Knowledge graph requires OpenMind to be running.
        </p>
        <Link
          to="/settings?tab=integrations"
          className="text-oav-accent text-sm hover:underline"
        >
          Configure OpenMind →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="knowledge-graph-page">
      <div className="p-6 pb-3 space-y-1 shrink-0">
        <Breadcrumb items={BREADCRUMB} />
        <h1 className="text-xl font-bold text-oav-text">Knowledge Graph</h1>
      </div>

      <div className="flex-1 relative">
        {isLoading && !graph ? (
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

        {/* Search & legend overlay */}
        <div className="absolute top-4 left-4 right-4 z-30 bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="search"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5 text-sm w-72 focus:border-oav-accent focus:ring-1 focus:ring-oav-accent focus:outline-none text-oav-text placeholder:text-oav-muted/50"
              data-testid="knowledge-search-input"
            />
            <div className="inline-flex rounded-lg overflow-hidden border border-oav-border bg-oav-bg">
              {ENTITY_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterType(value)}
                  className={clsx(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    filterType === value ? 'bg-oav-accent text-white' : 'text-oav-muted hover:text-oav-text',
                  )}
                  data-testid={`filter-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-oav-muted ml-auto">
              <IntegrationStatusBadge status={mindStatus} />
            </span>
          </div>

          {/* Entity count + load more */}
          <div className="flex items-center gap-3 text-xs text-oav-muted">
            <span>
              Showing {displayedEntities.length} of {graph?.total_entities ?? 0} entities
            </span>
            {graph && displayedCount < graph.total_entities && (
              <button
                onClick={loadMore}
                className="text-oav-accent hover:underline"
                data-testid="load-more-entities"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Entity detail panel */}
      <SlideInPanel
        open={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        title={selectedEntity?.name ?? 'Entity Details'}
        width="360"
        data-testid="entity-detail-panel"
      >
        {selectedEntity && (
          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              {[
                { label: 'Type', value: selectedEntity.entity_type },
                { label: 'Relevance', value: selectedEntity.relevance_score.toFixed(2) },
                { label: 'Created', value: new Date(selectedEntity.created_at).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-oav-muted">{label}</span>
                  <span className="text-oav-text font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
            {selectedEntity.description && (
              <p className="text-xs text-oav-muted leading-relaxed">
                {selectedEntity.description}
              </p>
            )}

            {/* Related entities from graph edges */}
            {graph && (
              <div>
                <h3 className="text-xs text-oav-muted uppercase tracking-wider font-medium mb-2">
                  Related Entities
                </h3>
                <div className="space-y-1">
                  {graph.edges
                    .filter((e) => e.source_id === selectedEntity.id || e.target_id === selectedEntity.id)
                    .slice(0, 5)
                    .map((edge) => {
                      const relatedId = edge.source_id === selectedEntity.id ? edge.target_id : edge.source_id;
                      const related = graph.entities.find((e) => e.id === relatedId);
                      if (!related) return null;
                      return (
                        <button
                          key={edge.id}
                          onClick={() => setSelectedEntity(related)}
                          className="w-full flex items-center justify-between text-xs hover:bg-oav-surface-hover rounded px-2 py-1 transition-colors text-left"
                        >
                          <span className="text-oav-text truncate">{related.name}</span>
                          <span className="text-oav-muted ml-2 shrink-0">{edge.relationship_type}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
