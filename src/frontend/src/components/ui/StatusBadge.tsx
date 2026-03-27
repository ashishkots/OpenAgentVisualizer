import { clsx } from 'clsx';
import type { AgentStatus } from '../../types/agent';

interface Props {
  status: AgentStatus;
  className?: string;
}

const STATUS_CONFIG: Record<AgentStatus, { bg: string; text: string; label: string; pulse: boolean }> = {
  idle:     { bg: 'bg-oav-muted/20',    text: 'text-oav-muted',    label: 'Idle',     pulse: false },
  active:   { bg: 'bg-oav-success/20',  text: 'text-oav-success',  label: 'Active',   pulse: true  },
  waiting:  { bg: 'bg-oav-warning/20',  text: 'text-oav-warning',  label: 'Waiting',  pulse: false },
  error:    { bg: 'bg-oav-error/20',    text: 'text-oav-error',    label: 'Error',    pulse: true  },
  complete: { bg: 'bg-oav-accent/20',   text: 'text-oav-accent',   label: 'Complete', pulse: false },
};

export function StatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className,
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.pulse && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', {
            'bg-oav-success': status === 'active',
            'bg-oav-error':   status === 'error',
          })}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}
