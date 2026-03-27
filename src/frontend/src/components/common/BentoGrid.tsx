interface Props { children: React.ReactNode; className?: string; }
export function BentoGrid({ children, className = '' }: Props) {
  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      {children}
    </div>
  );
}
