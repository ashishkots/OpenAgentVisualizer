import { memo, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import { AgentAvatar } from '../ui/AgentAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { useMeshStore } from '../../stores/meshStore';
import type { MeshNode } from '../../types/mesh';

const ROLE_CLASSES = {
  Producer: { bg: 'bg-oav-mesh/20',      text: 'text-oav-mesh'      },
  Consumer: { bg: 'bg-oav-knowledge/20', text: 'text-oav-knowledge' },
  Router:   { bg: 'bg-oav-3d/20',        text: 'text-oav-3d'        },
} as const;

interface MeshNodeData {
  meshNode: MeshNode;
}

export const MeshTopologyNode = memo(function MeshTopologyNode({ data, selected }: NodeProps<MeshNodeData>) {
  const { meshNode } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const liveUpdateNodeIds = useMeshStore((s) => s.liveUpdateNodeIds);
  const isUpdating = liveUpdateNodeIds.has(meshNode.id);

  // Live update pulse animation
  useEffect(() => {
    if (isUpdating && nodeRef.current) {
      animateSafe(() => {
        gsap.timeline()
          .to(nodeRef.current, {
            boxShadow: '0 0 0 6px rgba(52, 211, 153, 0.4)',
            duration: 0.15,
            ease: 'power2.out',
          })
          .to(nodeRef.current, {
            boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)',
            duration: 0.45,
            ease: 'power2.out',
          });
      });
    }
  }, [isUpdating]);

  const roleClasses = ROLE_CLASSES[meshNode.mesh_role] ?? ROLE_CLASSES.Consumer;
  const isDisconnected = !meshNode.is_connected;

  return (
    <div
      ref={nodeRef}
      className={clsx(
        'bg-oav-surface border border-oav-border rounded-xl px-3 py-2',
        'flex items-center gap-2 w-40',
        'transition-all duration-200',
        'hover:border-oav-accent/60 hover:bg-oav-surface-hover',
        selected && 'border-oav-accent ring-2 ring-oav-accent/30',
        isDisconnected && 'opacity-40 border-dashed',
      )}
      data-testid="mesh-topology-node"
      aria-label={`${meshNode.agent_name} — ${meshNode.mesh_role}`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !rounded-full !border-2 !border-oav-border !bg-oav-surface" />

      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <AgentAvatar name={meshNode.agent_name} level={meshNode.agent_level} size="sm" />
        {isDisconnected && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 rounded-full bg-oav-error/20 text-oav-error font-medium border border-oav-error/30">
            DC
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-oav-text truncate">{meshNode.agent_name}</p>
        <p className="text-[10px] text-oav-muted">Lv {meshNode.agent_level}</p>
        {/* Mesh role badge */}
        <span
          className={clsx(
            'inline-block mt-0.5 text-[10px] px-1.5 py-0 rounded-full font-medium leading-5',
            roleClasses.bg,
            roleClasses.text,
          )}
        >
          {meshNode.mesh_role}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !rounded-full !border-2 !border-oav-border !bg-oav-surface" />
    </div>
  );
});
