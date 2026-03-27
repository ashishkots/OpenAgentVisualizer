from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
import uuid

from app.core.database import engine, Base, AsyncSessionLocal, get_db
from app.core.redis_client import get_redis, close_redis
from app.core.security import hash_password
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.correlation import CorrelationIDMiddleware
from app.core.rate_limiter import limiter

# Import all models so Base.metadata is populated before create_all
from app.models.user import User, Workspace, WorkspaceMember  # noqa: F401
from app.models.agent import Agent, Task  # noqa: F401
from app.models.event import Event, Span, AgentSession  # noqa: F401
from app.models.gamification import XPTransaction, Alert  # noqa: F401
from app.models.metrics import MetricsRaw, MetricsAgg  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.achievement import Achievement  # noqa: F401
from app.models.integration import IntegrationConfig  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.invite import WorkspaceInvite  # noqa: F401
from app.models.activity import ActivityFeed  # noqa: F401
from app.models.quest import Quest, AgentQuestProgress  # noqa: F401
from app.models.skill import SkillTree, SkillNode, AgentSkill  # noqa: F401
from app.models.wallet import Wallet, Transaction  # noqa: F401
from app.models.shop import ShopItem, Inventory  # noqa: F401
from app.models.tournament import Tournament, TournamentEntry  # noqa: F401
from app.models.season import Season, SeasonalXP  # noqa: F401
from app.models.team import Team, TeamMember  # noqa: F401
from app.models.challenge import Challenge, ChallengeProgress  # noqa: F401
from app.models.webhook import Webhook, WebhookDelivery  # noqa: F401
from app.models.plugin import Plugin, PluginRegistry  # noqa: F401
from app.models.sso import SSOConfig, SSOSession  # noqa: F401
from app.models.organization import Organization, OrgMember, SharedAgent  # noqa: F401

from app.routers import (
    auth,
    agents,
    events,
    otlp_receiver,
    sessions,
    metrics,
    alerts,
    gamification,
)
from app.routers import websocket as ws_router
from app.routers.spans import router as spans_router
from app.routers import integrations as integrations_router
from app.routers import ue5_websocket
from app.routers import admin as admin_router
from app.routers import notifications as notifications_router
from app.routers import export as export_router
from app.routers import invites as invites_router
from app.routers import activity as activity_router
from app.routers import tournaments as tournaments_router
from app.routers import seasons as seasons_router
from app.routers import teams as teams_router
from app.routers import challenges as challenges_router
from app.routers import quests as quests_router
from app.routers import skills as skills_router
from app.routers import wallet as wallet_router
from app.routers import shop as shop_router
from app.routers import sso as sso_router
from app.routers import organizations as organizations_router
from app.routers import shared_agents as shared_agents_router
from app.services.websocket_manager import manager as ws_manager
from app.core.logging import get_logger

_logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Initialize DB tables (Alembic handles production; create_all for dev/test)
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: Base.metadata.create_all(c, checkfirst=True))
    # Warm up Redis pool (fixes race condition — single init here, not lazy)
    await get_redis()
    # Seed default user and workspace
    await seed_default_user()
    # Seed gamification data (quests, skills, shop items) if tables are empty
    await seed_gamification_data()
    # Seed plugin registry entries if table is empty
    await seed_plugin_registry()
    yield
    # Shutdown
    _logger.info("shutdown.initiated", event="graceful_shutdown_start")
    await ws_manager.close_all()
    _logger.info("shutdown.websockets_drained", event="websocket_connections_closed")
    await close_redis()
    _logger.info("shutdown.complete", event="graceful_shutdown_complete")


async def seed_default_user() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == settings.SEED_EMAIL))
        if existing:
            return
        user = User(
            email=settings.SEED_EMAIL,
            hashed_password=hash_password(settings.SEED_PASSWORD),
        )
        ws = Workspace(name="Default Workspace", slug=f"default-{uuid.uuid4().hex[:6]}")
        member = WorkspaceMember(workspace=ws, user=user, role="owner")
        db.add_all([user, ws, member])
        await db.commit()


async def seed_gamification_data() -> None:
    """Seed quests, skill trees/nodes, and shop items if tables are empty."""
    from app.data.seed_quests import QUEST_SEEDS
    from app.data.seed_skills import SKILL_TREE_SEEDS, SKILL_NODE_SEEDS
    from app.data.seed_shop import SHOP_ITEM_SEEDS
    from app.models.quest import Quest
    from app.models.skill import SkillTree, SkillNode
    from app.models.shop import ShopItem
    from app.models.user import Workspace

    async with AsyncSessionLocal() as db:
        # Quests — use first workspace as owner for seed data
        quest_count = await db.scalar(select(func.count(Quest.id)))
        if quest_count == 0:
            ws = await db.scalar(select(Workspace).limit(1))
            if ws:
                for q in QUEST_SEEDS:
                    db.add(Quest(workspace_id=ws.id, **q))
                await db.commit()
                _logger.info("seed.quests", count=len(QUEST_SEEDS))

        # Skill trees and nodes
        tree_count = await db.scalar(select(func.count(SkillTree.id)))
        if tree_count == 0:
            tree_id_map: dict[str, str] = {}
            for t in SKILL_TREE_SEEDS:
                tree = SkillTree(**t)
                db.add(tree)
                await db.flush()
                tree_id_map[t["name"]] = tree.id

            # Build nodes, resolving parent references
            node_id_map: dict[str, str] = {}
            for n in SKILL_NODE_SEEDS:
                tree_name = n.pop("tree_name")
                parent_name = n.pop("parent_name")
                node = SkillNode(
                    tree_id=tree_id_map[tree_name],
                    parent_id=node_id_map.get(parent_name) if parent_name else None,
                    **n,
                )
                db.add(node)
                await db.flush()
                node_id_map[n["name"]] = node.id

            await db.commit()
            _logger.info("seed.skill_trees", trees=len(SKILL_TREE_SEEDS), nodes=len(SKILL_NODE_SEEDS))

        # Shop items
        item_count = await db.scalar(select(func.count(ShopItem.id)))
        if item_count == 0:
            for item in SHOP_ITEM_SEEDS:
                db.add(ShopItem(**item))
            await db.commit()
            _logger.info("seed.shop_items", count=len(SHOP_ITEM_SEEDS))


async def seed_plugin_registry() -> None:
    """Seed plugin registry with 5 example entries if the table is empty."""
    from app.data.seed_plugins import PLUGIN_REGISTRY_SEEDS
    from app.models.plugin import PluginRegistry

    async with AsyncSessionLocal() as db:
        count = await db.scalar(select(func.count(PluginRegistry.id)))
        if count == 0:
            for entry in PLUGIN_REGISTRY_SEEDS:
                db.add(PluginRegistry(**entry))
            await db.commit()
            _logger.info("seed.plugin_registry", count=len(PLUGIN_REGISTRY_SEEDS))


app = FastAPI(title="OpenAgentVisualizer API", version="3.0.0", lifespan=lifespan)

app.state.limiter = limiter

from slowapi import _rate_limit_exceeded_handler  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CorrelationIDMiddleware)

# ---- Prometheus metrics instrumentation ----
# The /metrics endpoint is exposed without JWT auth (standard Prometheus scrape pattern).
# excluded_handlers prevents the /metrics endpoint from being tracked in HTTP counters,
# which would cause infinite recursion on scrape.
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402

_instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/api/health"],
)
_instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/health/live", tags=["health"])
async def liveness() -> dict:
    """Liveness probe — returns 200 if process is running."""
    return {"status": "alive"}


@app.get("/api/health/ready", tags=["health"])
async def readiness(db: AsyncSession = Depends(get_db)):
    """Readiness probe — checks all dependencies (postgres + redis)."""
    checks: dict[str, str] = {}

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"

    # Redis
    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "ready" if all_ok else "degraded", "checks": checks},
    )


app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(events.router)
app.include_router(otlp_receiver.router)
app.include_router(ws_router.router)
app.include_router(sessions.router)
app.include_router(metrics.router)
app.include_router(alerts.router)
app.include_router(gamification.router)
app.include_router(spans_router)
app.include_router(integrations_router.router)
app.include_router(ue5_websocket.router)
app.include_router(admin_router.router)
app.include_router(notifications_router.router)
app.include_router(export_router.router)
app.include_router(invites_router.router)
app.include_router(activity_router.router)
app.include_router(tournaments_router.router)
app.include_router(seasons_router.router)
app.include_router(teams_router.router)
app.include_router(challenges_router.router)
app.include_router(quests_router.router)
app.include_router(skills_router.router)
app.include_router(wallet_router.router)
app.include_router(shop_router.router)
app.include_router(sso_router.router)
app.include_router(organizations_router.router)
app.include_router(shared_agents_router.router)
