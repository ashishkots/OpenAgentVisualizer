interface Props { title: string; action?: React.ReactNode; }
export function SectionHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-oav-muted text-xs font-semibold uppercase tracking-widest">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
