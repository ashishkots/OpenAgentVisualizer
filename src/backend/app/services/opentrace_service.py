"""OpenTrace integration service.

Fetches distributed trace data from the OpenTrace API and caches results in Redis.

Cache strategy (ADR-008):
  - Trace list per agent:  30 seconds  (key: opentrace:workspace:{workspace_id}:agent:{agent_id}:traces)
  - Full trace detail:     5 minutes   (key: opentrace:workspace:{workspace_id}:trace:{trace_id})
  - Search results:        not cached  (dynamic query)
"""

import logging
from typing import Any, Optional
from urllib.parse import urlencode

import orjson

from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_TRACE_LIST_TTL = 30       # seconds
_TRACE_DETAIL_TTL = 300    # seconds (5 minutes)


class OpenTraceService(BaseIntegrationClient):
    """HTTP client for the OpenTrace distributed tracing product."""

    product_name = "opentrace"
    env_base_url_key = "OPENTRACE_BASE_URL"
    env_api_key_key = "OPENTRACE_API_KEY"

    async def get_traces(
        self,
        workspace_id: str,
        agent_id: str,
        limit: int = 20,
        db: Any = None,
    ) -> list[dict]:
        """Fetch the most recent traces for an agent.

        Results are cached in Redis for 30 seconds.
        """
        redis = await get_redis()
        cache_key = f"opentrace:workspace:{workspace_id}:agent:{agent_id}:traces"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/traces?agent_id={agent_id}&limit={limit}",
            workspace_id=workspace_id,
            db=db,
        )
        traces: list[dict] = data if isinstance(data, list) else data.get("traces", [])
        await redis.setex(cache_key, _TRACE_LIST_TTL, orjson.dumps(traces))
        return traces

    async def get_trace_detail(
        self,
        workspace_id: str,
        trace_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch full trace with all spans.

        Results are cached in Redis for 5 minutes (traces are immutable).
        """
        redis = await get_redis()
        cache_key = f"opentrace:workspace:{workspace_id}:trace:{trace_id}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/traces/{trace_id}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _TRACE_DETAIL_TTL, orjson.dumps(data))
        return data

    async def get_trace_waterfall(
        self,
        workspace_id: str,
        trace_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch trace detail formatted for waterfall rendering.

        Reuses the trace detail cache.
        """
        return await self.get_trace_detail(workspace_id, trace_id, db)

    async def search_traces(
        self,
        workspace_id: str,
        params: dict[str, Any],
        db: Any = None,
    ) -> list[dict]:
        """Search traces with arbitrary filter parameters.

        Not cached — search results are dynamic.
        """
        filtered_params = {k: v for k, v in params.items() if v is not None}
        query_string = urlencode(filtered_params)
        path = f"/api/traces/search?{query_string}" if query_string else "/api/traces/search"
        data = await self._request("GET", path, workspace_id=workspace_id, db=db)
        return data if isinstance(data, list) else data.get("traces", [])


# Module-level singleton — one circuit breaker shared across all requests.
opentrace_service = OpenTraceService()
