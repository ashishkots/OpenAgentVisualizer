# OAV Agents

List all agents in the current workspace and optionally open agent detail in a browser tab.

1. Use `oav_list_agents` with the default workspace_id from `oav_workspace_info`.
2. Display as a table: Agent Name | Status | XP | Last Active.
3. Ask the user if they want to open any agent's detail page.
4. If yes, output the URL: `$OAV_ENDPOINT/agents/<agent_id>` and suggest they open it in a browser.
