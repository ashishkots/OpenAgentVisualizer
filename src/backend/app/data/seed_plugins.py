"""Seed data: 5 plugin registry entries."""

PLUGIN_REGISTRY_SEEDS: list[dict] = [
    {
        "name": "event-logger",
        "description": "Logs all agent events to a rotating file on disk. "
                       "Useful for audit trails and offline analysis.",
        "version": "1.0.0",
        "author": "OAV Core Team",
        "manifest_url": None,
        "download_url": None,
        "verified": True,
        "downloads": 1000,
    },
    {
        "name": "slack-notifier",
        "description": "Sends real-time alerts to a Slack channel when agents trigger "
                       "alerts or reach level milestones.",
        "version": "2.1.0",
        "author": "OAV Core Team",
        "manifest_url": None,
        "download_url": None,
        "verified": True,
        "downloads": 2500,
    },
    {
        "name": "cost-alerter",
        "description": "Monitors agent token spend and fires a webhook alert when "
                       "cumulative cost exceeds a configurable USD threshold.",
        "version": "1.2.3",
        "author": "OAV Core Team",
        "manifest_url": None,
        "download_url": None,
        "verified": True,
        "downloads": 800,
    },
    {
        "name": "custom-metrics",
        "description": "Adds custom Prometheus metrics collection hooks so you can "
                       "instrument domain-specific KPIs alongside standard OAV metrics.",
        "version": "1.0.1",
        "author": "OAV Core Team",
        "manifest_url": None,
        "download_url": None,
        "verified": True,
        "downloads": 600,
    },
    {
        "name": "agent-namer",
        "description": "Auto-generates creative, memorable names for newly created agents "
                       "using an adjective-noun-number pattern.",
        "version": "0.9.0",
        "author": "Community",
        "manifest_url": None,
        "download_url": None,
        "verified": False,
        "downloads": 200,
    },
]
