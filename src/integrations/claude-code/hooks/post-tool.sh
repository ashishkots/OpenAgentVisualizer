#!/usr/bin/env bash
# Registered as Claude Code PostToolUse hook.
# Input: JSON on stdin — {"tool_name": "...", "tool_result": {...}}
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
END_MS=$(date +%s%3N)

TMPFILE=$(ls -t /tmp/oav_hook_*.tool 2>/dev/null | head -1 || echo "")
START_MS="${END_MS}"
if [ -n "${TMPFILE}" ]; then
  START_FILE="${TMPFILE%.tool}.start"
  START_MS=$(cat "${START_FILE}" 2>/dev/null || echo "${END_MS}")
  rm -f "${TMPFILE}" "${START_FILE}" 2>/dev/null || true
fi

LATENCY=$((END_MS - START_MS))
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || echo "00000000000000000000000000000000")
NOW_NS=$((END_MS * 1000000))
START_NS=$(((START_MS) * 1000000))

curl -s -X POST "${ENDPOINT}/v1/traces" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"oav-claude-code\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"${TRACE_ID}\",\"spanId\":\"${TRACE_ID:0:16}\",\"name\":\"tool:${TOOL_NAME}\",\"startTimeUnixNano\":\"${START_NS}\",\"endTimeUnixNano\":\"${NOW_NS}\",\"status\":{\"code\":1},\"attributes\":{\"oav.source\":\"claude-code\",\"oav.latency_ms\":${LATENCY}}}]}]}]}" \
  --max-time 2 || true
