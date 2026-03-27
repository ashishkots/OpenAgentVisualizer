"""OpenShield security integration service.

Fetches security posture and violation data from the OpenShield API and caches in Redis.

Cache strategy:
  - Workspace posture:  2 minutes  (key: openshield:workspace:{id}:posture)
  - Agent posture:      2 minutes  (key: openshield:agent:{agent_id}:posture)
  - Violations:         not cached (dynamic time-range query)
"""

import logging
from typing import Any, Optional

import orjson

from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_POSTURE_TTL = 120  # seconds (2 minutes)


class OpenShieldService(BaseIntegrationClient):
    """HTTP client for the OpenShield AI data privacy and safety product."""

    product_name = "openshield"
    env_base_url_key = "OPENSHIELD_BASE_URL"
    env_api_key_key = "OPENSHIELD_API_KEY"

    async def get_posture(
        self,
        workspace_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch workspace-level security posture. Cached for 2 minutes."""
        redis = await get_redis()
        cache_key = f"openshield:workspace:{workspace_id}:posture"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/posture?workspace_id={workspace_id}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _POSTURE_TTL, orjson.dumps(data))
        return data

    async def get_agent_posture(
        self,
        workspace_id: str,
        agent_id: str,
        db: Any = None,
    ) -> dict:
        """Fetch per-agent security posture. Cached for 2 minutes."""
        redis = await get_redis()
        cache_key = f"openshield:agent:{agent_id}:posture"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET",
            f"/api/posture/agents/{agent_id}",
            workspace_id=workspace_id,
            db=db,
        )
        await redis.setex(cache_key, _POSTURE_TTL, orjson.dumps(data))
        return data

    async def get_violations(
        self,
        workspace_id: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        db: Any = None,
    ) -> list[dict]:
        """Fetch workspace violations within a time range. Not cached."""
        params = f"workspace_id={workspace_id}"
        if start:
            params += f"&start={start}"
        if end:
            params += f"&end={end}"
        data = await self._request(
            "GET",
            f"/api/violations?{params}",
            workspace_id=workspace_id,
            db=db,
        )
        return data if isinstance(data, list) else data.get("violations", [])

    async def get_agent_violations(
        self,
        workspace_id: str,
        agent_id: str,
        db: Any = None,
    ) -> list[dict]:
        """Fetch violations for a specific agent. Not cached."""
        data = await self._request(
            "GET",
            f"/api/violations/agents/{agent_id}",
            workspace_id=workspace_id,
            db=db,
        )
        return data if isinstance(data, list) else data.get("violations", [])


# Module-level singleton
openshield_service = OpenShieldService()
