"""OpenMesh integration service.

Fetches multi-agent mesh topology data from the OpenMesh API and caches in Redis.

Cache strategy:
  - Topology:     60 seconds  (key: openmesh:workspace:{id}:topology)
  - Stats:         5 minutes  (key: openmesh:workspace:{id}:stats:{period})
"""

import logging
from typing import Any

import orjson

from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_TOPOLOGY_TTL = 60       # seconds
_STATS_TTL = 300         # seconds (5 minutes)


class OpenMeshService(BaseIntegrationClient):
    """HTTP client for the OpenMesh multi-agent mesh networking product."""

    product_name = "openmesh"
    env_base_url_key = "OPENMESH_BASE_URL"
    env_api_key_key = "OPENMESH_API_KEY"

    async def get_topology(
        self,
        workspace_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch the current mesh topology. Cached for 60 seconds."""
        redis = await get_redis()
        cache_key = f"openmesh:workspace:{workspace_id}:topology"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/mesh/topology?workspace_id={workspace_id}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _TOPOLOGY_TTL, orjson.dumps(data))
        return data

    async def get_node(
        self,
        workspace_id: str,
        node_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch detail for a single mesh node."""
        return await self._request(
            "GET",
            f"/api/mesh/nodes/{node_id}",
            workspace_id=workspace_id,
            db=db,
        )

    async def get_stats(
        self,
        workspace_id: str,
        period: str = "1h",
        db: Any = None,
    ) -> dict:
        """Fetch mesh aggregate statistics. Cached for 5 minutes."""
        redis = await get_redis()
        cache_key = f"openmesh:workspace:{workspace_id}:stats:{period}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/mesh/stats?workspace_id={workspace_id}&period={period}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _STATS_TTL, orjson.dumps(data))
        return data


# Module-level singleton
openmesh_service = OpenMeshService()
