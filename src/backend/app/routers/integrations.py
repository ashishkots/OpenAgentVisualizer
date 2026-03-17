from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.event import Event
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

KNOWN_INTEGRATIONS = [
    {"id": "claude-code",       "name": "Claude Code",             "type": "cli",  "install_command": "oav install claude-code"},
    {"id": "codex",             "name": "Codex CLI",               "type": "cli",  "install_command": "oav install codex"},
    {"id": "gemini-cli",        "name": "Google Gemini CLI",        "type": "cli",  "install_command": "oav install gemini"},
    {"id": "langchain",         "name": "LangChain",               "type": "sdk",  "install_command": "pip install openagentvisualizer[langchain]"},
    {"id": "langgraph",         "name": "LangGraph",               "type": "sdk",  "install_command": "pip install openagentvisualizer[langchain]"},
    {"id": "crewai",            "name": "CrewAI",                  "type": "sdk",  "install_command": "pip install openagentvisualizer[crewai]"},
    {"id": "autogen",           "name": "AutoGen",                 "type": "sdk",  "install_command": "pip install openagentvisualizer[autogen]"},
    {"id": "openai-agents",     "name": "OpenAI Agents SDK",        "type": "sdk",  "install_command": "pip install openagentvisualizer[openai]"},
    {"id": "anthropic",         "name": "Anthropic SDK",           "type": "sdk",  "install_command": "pip install openagentvisualizer[anthropic]"},
    {"id": "haystack",          "name": "Haystack",                "type": "sdk",  "install_command": "pip install openagentvisualizer[haystack]"},
    {"id": "llamaindex",        "name": "LlamaIndex",              "type": "sdk",  "install_command": "pip install openagentvisualizer[llamaindex]"},
    {"id": "semantic-kernel",   "name": "Semantic Kernel",         "type": "sdk",  "install_command": "pip install openagentvisualizer[semantic-kernel]"},
    {"id": "dspy",              "name": "DSPy",                    "type": "sdk",  "install_command": "pip install openagentvisualizer[dspy]"},
    {"id": "pydantic-ai",       "name": "Pydantic AI",             "type": "sdk",  "install_command": "pip install openagentvisualizer[pydantic-ai]"},
    {"id": "smolagents",        "name": "Smolagents (HuggingFace)", "type": "sdk",  "install_command": "pip install openagentvisualizer[smolagents]"},
]


@router.get("")
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = []
    for integration in KNOWN_INTEGRATIONS:
        try:
            # Events tagged with this integration ID are stored with event_type prefixed by integration id
            # e.g. event_type = "claude-code.agent.task.started"
            # Count events in the last 24h whose event_type starts with the integration id
            count_result = await db.execute(
                select(func.count()).select_from(Event).where(
                    Event.event_type.like(f"{integration['id']}.%"),
                    Event.timestamp >= cutoff,
                )
            )
            count_24h = count_result.scalar() or 0

            # Get the most recent event for last_seen
            last_result = await db.execute(
                select(Event.timestamp).where(
                    Event.event_type.like(f"{integration['id']}.%"),
                    Event.timestamp >= cutoff,
                ).order_by(Event.timestamp.desc()).limit(1)
            )
            last_ts = last_result.scalar_one_or_none()
            last_seen = last_ts.isoformat() if last_ts else None
            status = "connected" if last_ts else "not_configured"
        except Exception:
            count_24h = 0
            last_seen = None
            status = "not_configured"
        result.append({
            **integration,
            "status": status,
            "last_seen": last_seen,
            "event_count_24h": count_24h,
        })
    return result
