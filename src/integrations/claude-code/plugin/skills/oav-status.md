# OAV Status

Fetch and display OpenAgentVisualizer workspace health.

Use the `oav_workspace_info` MCP tool and `oav_get_metrics` with `period=day` to retrieve:
- Agent count and status breakdown (working / idle / error)
- Active alert count by severity
- Total cost today
- Top agent by XP (use `oav_get_leaderboard` with `limit=1`)

Format output as a compact status table. If any Critical alerts exist, highlight in red at the top.
