#!/usr/bin/env bash
# Registers a new OAV session on Claude Code session start.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
SESSION_ID="cc-$(date +%s)-$$"

curl -s -X POST "${ENDPOINT}/api/events" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"session_start\",\"agent_id\":\"claude-code\",\"data\":{\"session_id\":\"${SESSION_ID}\",\"pid\":$$}}" \
  --max-time 2 || true

mkdir -p "${HOME}/.oav"
echo "${SESSION_ID}" > "${HOME}/.oav/.current_session_id"
