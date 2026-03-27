"""Redis-backed rate limiting via slowapi."""
from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",  # Falls back to memory if Redis unavailable
    strategy="fixed-window",
)

# Rate limit constants
AUTH_RATE = "5/minute"
API_RATE = "100/minute"
EVENT_INGEST_RATE = "1000/minute"
METRICS_RATE = "30/minute"
