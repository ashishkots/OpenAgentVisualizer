export function formatCost(usd: number | undefined | null): string {
  const n = usd ?? 0;
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(2)}K`;
  }
  return `$${n.toFixed(4)}`;
}

export function formatTokens(tokens: number | undefined | null): string {
  return (tokens ?? 0).toLocaleString('en-US');
}

export function formatDuration(ms: number | undefined | null): string {
  const n = ms ?? 0;
  if (n < 60_000) {
    return `${(n / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(n / 60_000);
  const seconds = Math.floor((n % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
