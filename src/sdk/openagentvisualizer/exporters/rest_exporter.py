import json
from typing import Optional

import httpx

from openagentvisualizer.core.event import OAVEvent


class RESTExporter:
    def __init__(self, api_key: str, endpoint: str = "http://localhost:8000"):
        self._client = httpx.Client(
            base_url=endpoint,
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            timeout=2.0,
        )

    def export_sync(self, event: OAVEvent) -> None:
        try:
            self._client.post("/api/events", content=json.dumps(event.to_dict()))
        except Exception:
            pass  # silent fail — never crash user code

    def __del__(self):
        try:
            self._client.close()
        except Exception:
            pass
