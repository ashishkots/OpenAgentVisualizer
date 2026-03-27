import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { AgentAvatar } from '../ui/AgentAvatar';
import { xpProgress } from '../../lib/xpLevels';
import type { Agent } from '../../types/agent';

const STATUS_DOT: Record<string, string> = {
  idle:     'bg-oav-muted',
  active:   'bg-oav-success',
  waiting:  'bg-oav-warning',
  error:    'bg-oav-error',
  complete: 'bg-oav-accent',
};

export const TopologyNode = memo(function TopologyNode({ data, selected }: NodeProps) {
  const agent = data.agent as Agent;
  const { level, name: levelName } = xpProgress(agent.xp_total);

  return (
    <div
      className={clsx(
        'bg-oav-surface border rounded-xl px-3 py-2 flex items-center gap-2 w-40 h-20',
        'transition-colors duration-150',
        selected
          ? 'border-oav-accent ring-2 ring-oav-accent/30'
          : 'border-oav-border hover:border-oav-accent/60 hover:bg-oav-surface-hover',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !rounded-full !border-2 !border-oav-border !bg-oav-surface"
      />
      <div className="relative shrink-0">
        <AgentAvatar name={agent.name} level={level} size="sm" />
        <span
          className={clsx(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-oav-surface',
            STATUS_DOT[agent.status] ?? 'bg-oav-muted',
          )}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-oav-text truncate">{agent.name}</p>
        <p className="text-[10px] text-oav-muted">Lv {level} · {levelName}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !rounded-full !border-2 !border-oav-border !bg-oav-surface"
      />
    </div>
  );
});
