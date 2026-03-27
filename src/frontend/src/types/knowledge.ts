// Sprint 3 — Knowledge Graph / OpenMind types

export type EntityType = 'concept' | 'fact' | 'agent_memory' | 'embedding';

export interface KnowledgeEntity {
  id: string;
  name: string;
  entity_type: EntityType;
  description: string | null;
  created_at: string;
  relevance_score: number;
  related_agent_ids: string[];
  x?: number; // force-layout position
  y?: number;
}

export interface KnowledgeEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  weight: number;
}

export interface KnowledgeGraph {
  entities: KnowledgeEntity[];
  edges: KnowledgeEdge[];
  total_entities: number;
  displayed_entities: number;
  generated_at: string;
}

export interface KnowledgeSearchResult {
  entities: KnowledgeEntity[];
  query: string;
  total: number;
}
