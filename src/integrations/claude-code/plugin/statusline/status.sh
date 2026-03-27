#!/usr/bin/env bash
# Outputs OAV status line segment for Claude Code status bar.
ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"

RESPONSE=$(curl -s "${ENDPOINT}/api/dashboard/metrics?period=day" \
  -H "Authorization: Bearer ${API_KEY}" \
  --max-time 1 2>/dev/null)

if [ -z "${RESPONSE}" ]; then
  echo "⬡ OAV offline"
  exit 0
fi

AGENTS=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent_count',0))" 2>/dev/null || echo "?")
COST=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"\${d.get('total_cost',0):.2f}\")" 2>/dev/null || echo "?")

ALERTS=$(curl -s "${ENDPOINT}/api/alerts?limit=1&severity=critical" \
  -H "Authorization: Bearer ${API_KEY}" \
  --max-time 1 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "${ALERTS}" -gt 0 ] 2>/dev/null; then
  echo "⬡ OAV  ${AGENTS} agents  ⚠ ${ALERTS} alert  \$${COST}"
else
  echo "⬡ OAV  ${AGENTS} agents  \$${COST}"
fi
