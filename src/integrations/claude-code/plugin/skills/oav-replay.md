# OAV Replay

Open session replay for a recent session.

1. Ask the user: "Which session? Last session, or a session ID?" (default: last session).
2. Use `oav_replay_session` with the session_id and optional speed multiplier.
3. Output the replay URL returned and instruct user to open it in a browser.
4. The replay shows the full agent execution timeline with tool calls, costs, and decisions.
