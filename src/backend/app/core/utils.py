from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return current UTC datetime (timezone-naive, compatible with TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.utcnow()
