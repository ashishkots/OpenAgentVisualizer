# OAV Debug

Deep-dive debug for a specific agent.

Usage: `/oav-debug <agent_id>`

1. Use `oav_get_traces` for the agent (limit=50).
2. Use `oav_get_slo_status` for the agent.
3. Use `oav_get_topology` to show what agents this agent depends on.
4. Present findings:
   - Recent error traces (if any)
   - SLO breach count and type
   - Dependency chain
   - Suggested actions based on error patterns
