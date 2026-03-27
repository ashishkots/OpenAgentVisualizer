"""Tests for challenge endpoints (Task 9)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_challenges_empty(authed_client: AsyncClient):
    """Listing challenges on a fresh workspace returns an empty list."""
    r = await authed_client.get("/api/challenges")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_challenge_not_found(authed_client: AsyncClient):
    """Fetching a non-existent challenge returns 404."""
    r = await authed_client.get("/api/challenges/nonexistent-id")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_challenge_progress_not_found(authed_client: AsyncClient):
    """Getting progress for a non-existent challenge returns 404."""
    r = await authed_client.get("/api/challenges/nonexistent-id/progress")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_challenge_list_response_is_list(authed_client: AsyncClient):
    """Challenges endpoint returns a JSON list."""
    r = await authed_client.get("/api/challenges")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_challenge_service_update_progress():
    """ChallengeService.update_progress sets current_value from DB aggregation."""
    from unittest.mock import AsyncMock, MagicMock
    from app.services.challenge_service import update_progress
    from app.models.challenge import Challenge
    from datetime import datetime, timedelta

    db = AsyncMock()
    db.scalar = AsyncMock(return_value=42)
    db.add = MagicMock()

    challenge = Challenge(
        id="c1",
        workspace_id="ws1",
        name="Test",
        type="workspace",
        goal_type="events",
        goal_value=100,
        current_value=0,
        reward_tokens=100,
        reward_xp=200,
        start_at=datetime.utcnow() - timedelta(days=1),
        end_at=datetime.utcnow() + timedelta(days=6),
        status="active",
    )
    result = await update_progress(db, challenge)
    assert result == 42
    assert challenge.current_value == 42


@pytest.mark.asyncio
async def test_challenge_service_check_expiry():
    """ChallengeService.check_expiry marks challenges as failed when past end_at."""
    from app.services.challenge_service import check_expiry
    from app.models.challenge import Challenge
    from datetime import datetime, timedelta
    from unittest.mock import AsyncMock, MagicMock

    db = AsyncMock()
    db.add = MagicMock()

    expired_challenge = Challenge(
        id="c2",
        workspace_id="ws1",
        name="Expired",
        type="workspace",
        goal_type="tasks",
        goal_value=100,
        current_value=10,  # did not meet goal
        reward_tokens=0,
        reward_xp=0,
        start_at=datetime.utcnow() - timedelta(days=8),
        end_at=datetime.utcnow() - timedelta(days=1),  # past end
        status="active",
    )
    result = await check_expiry(db, expired_challenge)
    assert result is True
    assert expired_challenge.status == "failed"


@pytest.mark.asyncio
async def test_challenge_service_check_completion():
    """ChallengeService.check_completion marks challenges as completed when goal met."""
    from app.services.challenge_service import check_completion
    from app.models.challenge import Challenge
    from datetime import datetime, timedelta
    from unittest.mock import AsyncMock, MagicMock, patch

    db = AsyncMock()
    db.add = MagicMock()
    db.execute = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=[])))
    db.get = AsyncMock(return_value=None)

    challenge = Challenge(
        id="c3",
        workspace_id="ws1",
        name="Completed",
        type="workspace",
        goal_type="tasks",
        goal_value=10,
        current_value=10,  # goal met
        reward_tokens=0,  # no wallet credit needed
        reward_xp=0,       # no XP distribution needed
        start_at=datetime.utcnow() - timedelta(days=1),
        end_at=datetime.utcnow() + timedelta(days=6),
        status="active",
    )
    result = await check_completion(db, challenge)
    assert result is True
    assert challenge.status == "completed"
