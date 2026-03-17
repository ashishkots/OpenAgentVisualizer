export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-oav-muted">
      <p>{message}</p>
    </div>
  );
}
