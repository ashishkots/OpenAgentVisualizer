const ENDPOINT = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const API_KEY = process.env.OAV_API_KEY ?? '';

async function sendSpan({ tool, latencyMs, inputTokens = 0, outputTokens = 0, error = null }) {
  const now = Date.now() * 1e6;
  const span = {
    traceId: Math.random().toString(16).slice(2).padEnd(32, '0'),
    spanId: Math.random().toString(16).slice(2, 18),
    name: `tool:${tool}`,
    startTimeUnixNano: (now - latencyMs * 1e6).toString(),
    endTimeUnixNano: now.toString(),
    status: { code: error ? 2 : 1 },
    attributes: {
      'oav.source': 'codex',
      'oav.input_tokens': inputTokens,
      'oav.output_tokens': outputTokens,
      ...(error ? { 'oav.error': String(error) } : {}),
    },
  };
  try {
    await fetch(`${ENDPOINT}/v1/traces`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: [span] }] }] }),
      signal: AbortSignal.timeout(2000),
    });
  } catch { /* telemetry failures must never break Codex */ }
}

module.exports = {
  onToolStart({ tool }) { this._start = Date.now(); this._tool = tool; },
  async onToolEnd({ output, tokens }) {
    await sendSpan({ tool: this._tool, latencyMs: Date.now() - (this._start ?? Date.now()), ...tokens });
  },
  async onToolError({ error }) {
    await sendSpan({ tool: this._tool, latencyMs: Date.now() - (this._start ?? Date.now()), error });
  },
};
