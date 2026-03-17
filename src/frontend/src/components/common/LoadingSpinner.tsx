interface Props { size?: 'sm' | 'md' | 'lg'; className?: string; }
export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const dim = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={`${dim} ${className} animate-spin rounded-full border-2 border-transparent`}
      style={{ borderTopColor: 'var(--oav-accent)' }}
      role="status"
      aria-label="Loading"
    />
  );
}
