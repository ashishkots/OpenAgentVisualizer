from __future__ import annotations
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional
import requests

@dataclass
class OAVSpan:
    agent_id: str
    operation: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    cost_usd: float
    source: str
    error: Optional[str] = None
    extra: dict = field(default_factory=dict)

    def to_otlp(self) -> dict:
        now_ns = int(time.time_ns())
        duration_ns = int(self.latency_ms * 1_000_000)
        return {
            "traceId": uuid.uuid4().hex,
            "spanId": uuid.uuid4().hex[:16],
            "name": self.operation,
            "startTimeUnixNano": now_ns - duration_ns,
            "endTimeUnixNano": now_ns,
            "status": {"code": 2 if self.error else 1},
            "attributes": {
                "oav.agent_id": self.agent_id,
                "oav.input_tokens": self.input_tokens,
                "oav.output_tokens": self.output_tokens,
                "oav.model": self.model,
                "oav.cost_usd": self.cost_usd,
                "oav.source": self.source,
                **({"oav.error": self.error} if self.error else {}),
                **{f"oav.extra.{k}": v for k, v in self.extra.items()},
            },
        }


class OAVBaseTracer:
    """Shared OTLP sender used by all 12 SDK adapters."""

    def __init__(self, endpoint: str, api_key: str, source: str, timeout: int = 5):
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.source = source
        self.timeout = timeout

    def send(self, span: OAVSpan) -> None:
        """Fire-and-forget OTLP HTTP export."""
        payload = {
            "resourceSpans": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": f"oav-{self.source}"}}]},
                "scopeSpans": [{"spans": [span.to_otlp()]}],
            }]
        }
        try:
            requests.post(
                f"{self.endpoint}/v1/traces",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                timeout=self.timeout,
            )
        except Exception:
            pass  # Never break the user's app for telemetry failure
