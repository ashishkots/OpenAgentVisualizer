#!/usr/bin/env bash
# Registered as Claude Code PreToolUse hook.
# Input: JSON on stdin — {"tool_name": "...", "tool_input": {...}}
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "${INPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
SPAN_ID="oav-$(date +%s%N)-$$"
TMPFILE="/tmp/oav_hook_${SPAN_ID}"

echo "${TOOL_NAME}" > "${TMPFILE}.tool"
date +%s%3N > "${TMPFILE}.start"
echo "${SPAN_ID}" >&2
