import { Lock, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { SkillNode as SkillNodeType, SkillNodeState } from '../../types/skill';

interface SkillNodeProps {
  node: SkillNodeType;
  state: SkillNodeState;
  onClick?: (node: SkillNodeType) => void;
}

export function SkillNode({ node, state, onClick }: SkillNodeProps) {
  const isInteractive = state === 'available';

  return (
    <div className="relative flex flex-col items-center gap-1 group">
      <button
        onClick={() => isInteractive && onClick?.(node)}
        disabled={!isInteractive}
        aria-label={`${node.name} — ${state}${state === 'available' ? `, costs ${node.cost} tokens, requires level ${node.level_required}` : ''}`}
        aria-pressed={state === 'unlocked'}
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg',
          state === 'locked' && [
            'bg-oav-border text-oav-muted border-2 border-oav-border',
            'cursor-not-allowed',
          ],
          state === 'available' && [
            'bg-oav-accent/20 text-oav-accent border-2 border-oav-accent',
            'cursor-pointer hover:bg-oav-accent/30 hover:scale-105',
            'animate-[level-pulse_2s_ease-in-out_infinite]',
            'focus-visible:ring-oav-accent',
            'shadow-glow-accent',
          ],
          state === 'unlocked' && [
            'bg-oav-success/20 text-oav-success border-2 border-oav-success',
            'cursor-default',
            'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
            'focus-visible:ring-oav-success',
          ],
        )}
      >
        {state === 'locked' && (
          <Lock className="w-5 h-5" aria-hidden="true" />
        )}
        {state === 'available' && (
          <span className="text-lg" aria-hidden="true">
            {node.icon || '✦'}
          </span>
        )}
        {state === 'unlocked' && (
          <Check className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Tooltip on hover */}
      <div
        className={clsx(
          'absolute bottom-full mb-2 left-1/2 -translate-x-1/2',
          'hidden group-hover:block group-focus-within:block',
          'z-50 pointer-events-none',
        )}
        role="tooltip"
      >
        <div className="bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-xs text-oav-text whitespace-nowrap shadow-lg">
          <p className="font-semibold mb-0.5">{node.name}</p>
          <p className="text-oav-muted text-[11px] max-w-[160px] whitespace-normal">{node.description}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="text-oav-gold">{node.cost} tokens</span>
            <span className="text-oav-muted">Lv. {node.level_required}+</span>
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-oav-border" />
      </div>

      {/* Node name label */}
      <span
        className={clsx(
          'text-[10px] font-medium text-center max-w-[64px] leading-tight',
          state === 'locked' && 'text-oav-muted',
          state === 'available' && 'text-oav-accent',
          state === 'unlocked' && 'text-oav-success',
        )}
      >
        {node.name}
      </span>
    </div>
  );
}
