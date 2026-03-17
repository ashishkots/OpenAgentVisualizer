# OAV Alerts

Triage and resolve active alerts.

1. Use `oav_get_alerts` to fetch all active alerts.
2. Display grouped by severity: Critical → High → Medium → Low.
3. For each alert: ID, message, agent, timestamp.
4. Ask the user which alert IDs to resolve (accept comma-separated list or "all").
5. For each selected ID, use `oav_send_event` with `type=resolve_alert` and `data={alert_id: "<id>"}`.
6. Confirm resolution count.
