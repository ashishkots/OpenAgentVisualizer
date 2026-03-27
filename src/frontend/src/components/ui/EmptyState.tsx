import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl bg-oav-surface-hover flex items-center justify-center"
        aria-hidden="true"
      >
        <Icon className="w-8 h-8 text-oav-muted" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-sm font-semibold text-oav-text">{title}</h3>
        <p className="text-sm text-oav-muted">{description}</p>
      </div>
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-oav-accent rounded-lg hover:bg-oav-accent/80 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none"
      >
        {actionLabel}
      </button>
    </div>
  );
}
