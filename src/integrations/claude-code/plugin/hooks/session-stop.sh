#!/usr/bin/env bash
# Closes the OAV session span when Claude Code exits.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
SESSION_FILE="${HOME}/.oav/.current_session_id"
SESSION_ID=$(cat "${SESSION_FILE}" 2>/dev/null || echo "unknown")

curl -s -X POST "${ENDPOINT}/api/events" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"session_stop\",\"agent_id\":\"claude-code\",\"data\":{\"session_id\":\"${SESSION_ID}\"}}" \
  --max-time 2 || true

rm -f "${SESSION_FILE}"
