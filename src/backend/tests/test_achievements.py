"""Tests for the achievement system (OAV-224)."""

import pytest
from httpx import AsyncClient

from app.services.achievement_definitions import ACHIEVEMENT_DEFS
from app.services.gamification_service import (
    GamificationService,
    LEVEL_THRESHOLDS,
    LEVEL_NAMES,
    XP_AWARDS,
)


# ---------------------------------------------------------------------------
# Unit tests — gamification service (10-level system)
# ---------------------------------------------------------------------------


def test_level_thresholds_has_10_entries():
    assert len(LEVEL_THRESHOLDS) == 10


def test_level_names_has_10_entries():
    assert len(LEVEL_NAMES) == 10


def test_level_from_xp_zero_is_level_1():
    svc = GamificationService()
    assert svc.level_from_xp(0) == 1


def test_level_from_xp_level_boundaries():
    svc = GamificationService()
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        expected_level = i + 1
        assert svc.level_from_xp(threshold) == expected_level, (
            f"XP={threshold} should be level {expected_level}"
        )


def test_level_from_xp_below_boundary():
    svc = GamificationService()
    # Just below level 2 threshold (500) should be level 1
    assert svc.level_from_xp(499) == 1


def test_level_from_xp_max():
    svc = GamificationService()
    assert svc.level_from_xp(100_000) == 10
    assert svc.level_from_xp(999_999) == 10


def test_level_name_novice():
    svc = GamificationService()
    assert svc.level_name(1) == "Novice"


def test_level_name_transcendent():
    svc = GamificationService()
    assert svc.level_name(10) == "Transcendent"


def test_xp_to_next_level_returns_gap():
    svc = GamificationService()
    # Level 1 ends at 500; agent at 0 XP needs 500 more
    assert svc.xp_to_next_level(0) == 500


def test_xp_to_next_level_returns_none_at_max():
    svc = GamificationService()
    assert svc.xp_to_next_level(100_000) is None


def test_process_xp_gain_triggers_level_up():
    svc = GamificationService()
    # Agent at 490 XP receives 20 XP — crosses level 2 threshold at 500
    event = svc.process_xp_gain(current_xp=490, xp_delta=20, agent_id="agent-1")
    assert event is not None
    assert event["type"] == "level_up"
    assert event["old_level"] == 1
    assert event["new_level"] == 2
    assert event["level_name"] == "Apprentice"


def test_process_xp_gain_no_level_up():
    svc = GamificationService()
    event = svc.process_xp_gain(current_xp=0, xp_delta=100, agent_id="agent-1")
    assert event is None


def test_xp_awards_event_ingested():
    svc = GamificationService()
    assert svc.xp_for_trigger("event_ingested") == 25


def test_xp_awards_task_completed():
    svc = GamificationService()
    assert svc.xp_for_trigger("task_completed") == 100


def test_xp_awards_error_recovered():
    svc = GamificationService()
    assert svc.xp_for_trigger("error_recovered") == 200


def test_xp_awards_unknown_trigger_returns_zero():
    svc = GamificationService()
    assert svc.xp_for_trigger("nonexistent_trigger") == 0


# ---------------------------------------------------------------------------
# Unit tests — achievement definitions
# ---------------------------------------------------------------------------


def test_achievement_defs_has_10_entries():
    assert len(ACHIEVEMENT_DEFS) == 10


def test_achievement_defs_ids_are_sequential():
    ids = list(ACHIEVEMENT_DEFS.keys())
    expected = [f"ACH-{i:03d}" for i in range(1, 11)]
    assert ids == expected


def test_all_achievements_have_required_fields():
    for ach_id, defn in ACHIEVEMENT_DEFS.items():
        assert defn.id == ach_id
        assert defn.name
        assert defn.description
        assert defn.condition_summary
        assert defn.xp_bonus > 0
        assert defn.icon


def test_trailblazer_highest_xp_bonus():
    trailblazer = ACHIEVEMENT_DEFS["ACH-010"]
    assert trailblazer.xp_bonus == 1000
    assert all(
        trailblazer.xp_bonus >= d.xp_bonus
        for ach_id, d in ACHIEVEMENT_DEFS.items()
        if ach_id != "ACH-010"
    )


# ---------------------------------------------------------------------------
# Integration tests — achievement API endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_achievement_definitions(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/achievements/definitions")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 10
    ids = [d["id"] for d in data]
    for i in range(1, 11):
        assert f"ACH-{i:03d}" in ids


@pytest.mark.asyncio
async def test_get_agent_achievements_empty(authed_client: AsyncClient):
    r = await authed_client.post(
        "/api/agents",
        json={"name": "AchBot", "role": "worker", "framework": "custom"},
    )
    assert r.status_code == 201
    agent_id = r.json()["id"]

    r = await authed_client.get(f"/api/gamification/achievements/{agent_id}")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_agent_achievements_not_found(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/achievements/nonexistent-agent-id")
    assert r.status_code == 404
