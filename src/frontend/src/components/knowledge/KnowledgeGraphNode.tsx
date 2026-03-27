import { memo, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Lightbulb, CheckCircle2, Brain, Hexagon } from 'lucide-react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import type { KnowledgeEntity, EntityType } from '../../types/knowledge';

interface KnowledgeNodeData {
  entity: KnowledgeEntity;
  isSearchMatch: boolean | null; // null = no active search
  isSelected: boolean;
}

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  concept: Lightbulb,
  fact: CheckCircle2,
  agent_memory: Brain,
  embedding: Hexagon,
};

function ConceptNode({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-oav-knowledge/20 border-2 border-oav-knowledge flex flex-col items-center justify-center gap-0.5">
      <Lightbulb className="w-4 h-4 text-oav-knowledge" aria-hidden="true" />
      <span className="text-[9px] font-medium text-oav-text leading-tight max-w-[44px] truncate text-center block">
        {name}
      </span>
    </div>
  );
}

function FactNode({ name }: { name: string }) {
  return (
    <div className="w-20 h-10 rounded-lg bg-oav-success/20 border-2 border-oav-success flex flex-col items-center justify-center gap-0.5 px-1">
      <CheckCircle2 className="w-4 h-4 text-oav-success" aria-hidden="true" />
      <span className="text-[9px] font-medium text-oav-text leading-tight w-full truncate text-center block">
        {name}
      </span>
    </div>
  );
}

function AgentMemoryNode({ name }: { name: string }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <div className="absolute w-10 h-10 bg-oav-purple/20 border-2 border-oav-purple rotate-45 rounded-sm" />
      <div className="relative z-10 flex flex-col items-center gap-0.5">
        <Brain className="w-4 h-4 text-oav-purple" aria-hidden="true" />
        <span className="text-[9px] font-medium text-oav-text leading-tight max-w-[44px] truncate text-center block">
          {name}
        </span>
      </div>
    </div>
  );
}

function EmbeddingNode({ name }: { name: string }) {
  return (
    <div
      className="w-12 h-12 flex items-center justify-center bg-oav-shield/20"
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        boxShadow: '0 0 0 2px #fb923c',
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <Hexagon className="w-4 h-4 text-oav-shield" aria-hidden="true" />
        <span className="text-[9px] font-medium text-oav-text leading-tight max-w-[40px] truncate text-center block">
          {name}
        </span>
      </div>
    </div>
  );
}

export const KnowledgeGraphNode = memo(function KnowledgeGraphNode({
  data,
  selected,
}: NodeProps<KnowledgeNodeData>) {
  const { entity, isSearchMatch } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const truncatedName = entity.name.slice(0, 20);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || isSearchMatch === null) return;

    animateSafe(() => {
      if (isSearchMatch) {
        gsap.to(node, { opacity: 1, scale: 1.05, duration: 0.3, ease: 'power2.out', filter: 'brightness(1.25)' });
      } else {
        gsap.to(node, { opacity: 0.2, scale: 1.0, duration: 0.3, ease: 'power2.out', filter: 'brightness(1)' });
      }
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.style.opacity = isSearchMatch ? '1' : '0.2';
    }
  }, [isSearchMatch]);

  return (
    <div
      ref={nodeRef}
      className={clsx(
        'relative flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out',
        selected && 'ring-2 ring-oav-accent/50 ring-offset-1 ring-offset-oav-bg rounded-full',
      )}
      data-testid="knowledge-graph-node"
      aria-label={`${entity.entity_type}: ${entity.name}`}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />

      {entity.entity_type === 'concept' && <ConceptNode name={truncatedName} />}
      {entity.entity_type === 'fact' && <FactNode name={truncatedName} />}
      {entity.entity_type === 'agent_memory' && <AgentMemoryNode name={truncatedName} />}
      {entity.entity_type === 'embedding' && <EmbeddingNode name={truncatedName} />}

      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  );
});
