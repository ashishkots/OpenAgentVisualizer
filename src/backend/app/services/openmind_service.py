"""OpenMind knowledge graph integration service.

Fetches knowledge graph data from the OpenMind API and caches in Redis.

Cache strategy:
  - Graph snapshot:  5 minutes   (key: openmind:workspace:{id}:graph:{limit}:{offset})
  - Entity detail:   10 minutes  (key: openmind:entity:{entity_id})
  - Search:          not cached  (dynamic query)
"""

import logging
from typing import Any
from urllib.parse import quote

import orjson

from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_GRAPH_TTL = 300    # seconds (5 minutes)
_ENTITY_TTL = 600   # seconds (10 minutes)


class OpenMindService(BaseIntegrationClient):
    """HTTP client for the OpenMind knowledge graph product."""

    product_name = "openmind"
    env_base_url_key = "OPENMIND_BASE_URL"
    env_api_key_key = "OPENMIND_API_KEY"

    async def get_graph(
        self,
        workspace_id: str,
        limit: int = 200,
        offset: int = 0,
        db: Any = None,
    ) -> dict:
        """Fetch a paginated knowledge graph snapshot. Cached for 5 minutes."""
        redis = await get_redis()
        cache_key = f"openmind:workspace:{workspace_id}:graph:{limit}:{offset}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/graph?workspace_id={workspace_id}&limit={limit}&offset={offset}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _GRAPH_TTL, orjson.dumps(data))
        return data

    async def get_entity(
        self,
        workspace_id: str,
        entity_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch full entity detail. Cached for 10 minutes."""
        redis = await get_redis()
        cache_key = f"openmind:entity:{entity_id}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/graph/entities/{entity_id}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _ENTITY_TTL, orjson.dumps(data))
        return data

    async def search_entities(
        self,
        workspace_id: str,
        query: str,
        db: Any = None,
    ) -> list[dict]:
        """Search entities by query string. Not cached."""
        data = await self._request(
            "GET",
            f"/api/graph/search?q={quote(query, safe='')}&workspace_id={workspace_id}",
            workspace_id=workspace_id,
            db=db,
        )
        return data if isinstance(data, list) else data.get("entities", [])


# Module-level singleton
openmind_service = OpenMindService()
