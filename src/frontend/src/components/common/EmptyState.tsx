interface Props { message: string; icon?: string; action?: React.ReactNode; }
export function EmptyState({ message, icon = '⬡', action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-3xl text-oav-muted opacity-40">{icon}</span>
      <p className="text-oav-muted text-sm text-center max-w-xs">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
