export function formatCost(usd: number): string {
  if (usd >= 1000) {
    return `$${(usd / 1000).toFixed(2)}K`;
  }
  return `$${usd.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  return tokens.toLocaleString('en-US');
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
