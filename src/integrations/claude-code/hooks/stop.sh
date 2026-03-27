#!/usr/bin/env bash
# Registered as Claude Code Stop hook — fires when Claude Code session ends.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
NOW_NS=$(($(date +%s%3N) * 1000000))
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || echo "00000000000000000000000000000000")

curl -s -X POST "${ENDPOINT}/v1/traces" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"oav-claude-code\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"${TRACE_ID}\",\"spanId\":\"${TRACE_ID:0:16}\",\"name\":\"session:stop\",\"startTimeUnixNano\":\"${NOW_NS}\",\"endTimeUnixNano\":\"${NOW_NS}\",\"status\":{\"code\":1},\"attributes\":{\"oav.source\":\"claude-code\",\"oav.event\":\"session_stop\"}}]}]}]}" \
  --max-time 2 || true
