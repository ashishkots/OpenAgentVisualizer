"""Prometheus metrics definitions for OpenAgentVisualizer.

Custom business metrics registered as module-level singletons.
HTTP metrics are auto-instrumented by prometheus-fastapi-instrumentator in main.py.
"""

from prometheus_client import Counter, Gauge, Histogram

# ---- HTTP counters (auto-instrumented names for reference) ----
# oav_http_requests_total
# oav_http_request_duration_seconds
# (managed by prometheus-fastapi-instrumentator)

# ---- Custom business metrics ----

oav_events_ingested_total = Counter(
    "oav_events_ingested_total",
    "Total events ingested via /api/events and /api/events/batch",
)

oav_websocket_connections_active = Gauge(
    "oav_websocket_connections_active",
    "Number of active WebSocket connections",
)

oav_agents_active = Gauge(
    "oav_agents_active",
    "Number of agents with status != idle",
)

oav_xp_awarded_total = Counter(
    "oav_xp_awarded_total",
    "Total XP awarded across all agents",
)

oav_celery_tasks_total = Counter(
    "oav_celery_tasks_total",
    "Total Celery tasks executed",
    labelnames=["task_name", "status"],
)

oav_celery_task_duration_seconds = Histogram(
    "oav_celery_task_duration_seconds",
    "Duration of Celery task execution in seconds",
    labelnames=["task_name"],
    buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0],
)

oav_integration_requests_total = Counter(
    "oav_integration_requests_total",
    "Total requests made to external integration services",
    labelnames=["integration", "status"],
)
