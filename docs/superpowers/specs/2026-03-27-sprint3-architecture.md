# OpenAgentVisualizer Sprint 3 -- Architecture Design Document

**Author:** Tech Lead (Stage 2.1)
**Date:** 2026-03-27
**Status:** APPROVED
**Sprint:** 3
**Inputs:** Sprint 3 PRD, PM Handoff (stage-1.1), Sprint 2 Architecture, existing Sprint 1-2 codebase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [UE5 Pixel Streaming Architecture](#2-ue5-pixel-streaming-architecture)
3. [Cross-Product Integration Architecture](#3-cross-product-integration-architecture)
4. [OpenTrace Integration (OAV-302)](#4-opentrace-integration-oav-302)
5. [OpenMesh Integration (OAV-303)](#5-openmesh-integration-oav-303)
6. [OpenMind Integration (OAV-304)](#6-openmind-integration-oav-304)
7. [OpenShield Integration (OAV-305)](#7-openshield-integration-oav-305)
8. [CLI Plugin Architecture (OAV-306)](#8-cli-plugin-architecture-oav-306)
9. [GitHub Actions CI Architecture (OAV-241)](#9-github-actions-ci-architecture-oav-241)
10. [Production Docker Architecture (OAV-242)](#10-production-docker-architecture-oav-242)
11. [Prometheus Metrics Architecture (OAV-243)](#11-prometheus-metrics-architecture-oav-243)
12. [E2E Test Architecture (OAV-235)](#12-e2e-test-architecture-oav-235)
13. [New API Endpoints](#13-new-api-endpoints)
14. [New Database Migrations](#14-new-database-migrations)
15. [Implementation Sequencing](#15-implementation-sequencing)

---

## 1. Architecture Overview

Sprint 3 extends the Sprint 2 visual platform along three axes: immersive 3D via UE5 Pixel Streaming, cross-product integrations with four Open* Suite products, and developer tooling (CLI, CI, production Docker, Prometheus, E2E tests). The architecture preserves the existing backend (FastAPI + SQLAlchemy + Redis + Celery) and frontend (React + PixiJS + XState + Zustand) patterns established in Sprints 1-2.

```
                             +------------------------------+
                             |     React SPA (Vite)         |
                             +------------------------------+
                             | Existing Pages | New Pages   |
                             | Dashboard, World | Trace Explorer   |
                             | Topology, etc.   | Mesh Topology    |
                             |                  | Knowledge Graph  |
                             |                  | Security         |
                             |                  | 3D Viewer        |
                             +----------+-------+-----------+
                                        |
              +-------------------------+-------------------------+
              |                         |                         |
   +----------v----------+  +-----------v-----------+  +----------v----------+
   | PixiJS Canvas       |  | UE5 Pixel Streaming   |  | Integration UIs     |
   | (2D fallback)       |  | (WebRTC video)        |  | (ReactFlow, Recharts|
   +----------+----------+  +-----------+-----------+  |  Waterfall, etc.)   |
              |                         |              +----------+----------+
              |                         |                         |
   +----------v----------+  +-----------v-----------+  +----------v----------+
   | XState Machines     |  | Signaling Server      |  | TanStack Query      |
   | (per-agent FSM)     |  | (WebRTC negotiation)  |  | (integration API)   |
   +----------+----------+  +-----------+-----------+  +----------+----------+
              |                         |                         |
              +-------------------------+-------------------------+
                                        |
                             +----------v----------+
                             |   FastAPI Backend    |
                             +----------+----------+
                             |  /ws/live (existing) |
                             |  /ws/ue5  (new)      |
                             |  /api/integrations/* |
                             |  /metrics            |
                             +----------+----------+
                                        |
              +-------------------------+-------------------------+
              |                         |                         |
   +----------v--------+  +------------v----------+  +-----------v-----------+
   | Redis              |  | PostgreSQL +          |  | Celery Workers        |
   | (cache, pub/sub,   |  | TimescaleDB           |  | (integration sync,    |
   |  circuit breakers) |  | + integration_configs  |  |  xp_decay, graph)     |
   +--------------------+  +-----------------------+  +----------+------------+
                                                                 |
                                                      +----------v-----------+
                                                      | External Products    |
                                                      | OpenTrace, OpenMesh  |
                                                      | OpenMind, OpenShield |
                                                      +----------------------+
```

### Key Architectural Decisions (Sprint 3)

**ADR-006: UE5 Pixel Streaming is a progressive enhancement; 2D canvas is always the baseline.**
The UE5 3D viewer is optional infrastructure. The frontend detects UE5 availability via a 3-second WebRTC connection timeout. If UE5 is unavailable, the existing PixiJS 2D canvas renders immediately. The UE5 container is not part of the main `docker-compose.yml` because it requires GPU hardware. A separate `docker-compose.ue5.yml` is provided for GPU-equipped hosts.

**ADR-007: All cross-product integrations use a shared circuit breaker and consistent service pattern.**
Every integration follows the same structure: `IntegrationClient` (HTTP client with circuit breaker) -> `IntegrationService` (caching, data mapping) -> `IntegrationRouter` (FastAPI endpoints). Circuit breaker state is stored in-memory per process (not Redis) because it represents local connection health. This avoids Redis round-trips on every integration call.

**ADR-008: Integration configuration lives in both environment variables and a database table.**
Environment variables (`OPENTRACE_BASE_URL`, etc.) provide defaults. The `integration_configs` database table allows per-workspace overrides managed via the Settings page. The service layer checks the database first, then falls back to environment variables. API keys are stored encrypted at rest using Fernet symmetric encryption derived from `SECRET_KEY`.

**ADR-009: CLI plugin authenticates via API key, not JWT.**
The existing `X-API-Key` header authentication (via `get_workspace_id_from_api_key` in `dependencies.py`) is reused. API keys are non-expiring and suitable for non-interactive terminal use. The CLI stores the API key in `~/.oav/config.toml`.

**ADR-010: Prometheus metrics use the `prometheus-fastapi-instrumentator` library for automatic HTTP metrics, plus custom counters/gauges.**
The `/metrics` endpoint is excluded from JWT authentication (standard Prometheus scrape pattern). Custom business metrics (events ingested, WebSocket connections, XP awarded) are registered as module-level singletons in `app/core/metrics.py`.

---

## 2. UE5 Pixel Streaming Architecture

### 2.1 System Components

```
+-------------------+       +-------------------+       +-------------------+
| Browser (React)   |<----->| Signaling Server  |<----->| UE5 Application   |
| - WebRTC viewer   |  WS   | (Node.js/cirrus)  |  WS   | - Pixel Streaming |
| - DataChannel I/O |       | - SDP exchange    |       | - Agent avatars   |
+--------+----------+       | - ICE candidates  |       | - WebSocket client|
         |                   +-------------------+       +--------+----------+
         |                                                        |
         |  HTTP/WS                                    WebSocket  |
         |                                                        |
+--------v------------------------------------------------------- v----------+
|                        FastAPI Backend                                      |
|  /ws/ue5  -- bidirectional UE5 state relay                                 |
|  /ws/live -- existing frontend event stream                                |
+----------------------------------------------------------------------------+
```

### 2.2 WebRTC Connection Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Signaling as Signaling Server
    participant UE5

    Browser->>Signaling: WS connect
    Signaling->>Browser: config (ICE servers)
    Browser->>Signaling: offer (SDP)
    Signaling->>UE5: forward offer
    UE5->>Signaling: answer (SDP)
    Signaling->>Browser: forward answer
    Browser->>Signaling: ICE candidates
    Signaling->>UE5: forward ICE
    UE5->>Signaling: ICE candidates
    Signaling->>Browser: forward ICE
    Note over Browser,UE5: WebRTC P2P established
    Browser->>UE5: DataChannel messages
    UE5->>Browser: Video stream + DataChannel
```

### 2.3 WebSocket Protocol (`/ws/ue5`)

The `/ws/ue5` endpoint on the FastAPI backend acts as a relay between the React frontend and the UE5 application. Both connect to this endpoint; the backend routes messages based on `source` field.

**Authentication:** Same JWT-based auth as `/ws/live`. UE5 connects with a service API key via `X-API-Key` header.

**Message envelope:**

```json
{
  "type": "<message_type>",
  "source": "web" | "ue5",
  "workspace_id": "<uuid>",
  "payload": { ... },
  "timestamp": "<ISO 8601>"
}
```

**Web App -> UE5 messages (5 types):**

| Type | Payload Schema | Description |
|------|---------------|-------------|
| `focus_agent` | `{ "agent_id": "string" }` | Camera flies to agent |
| `select_agent` | `{ "agent_id": "string" }` | Highlight agent in 3D scene |
| `deselect_all` | `{}` | Remove all highlights |
| `set_view_mode` | `{ "mode": "overview" \| "agent_follow" \| "free_camera" }` | Camera mode switch |
| `sync_agents` | `{ "agents": [{ "id": "string", "name": "string", "status": "string", "level": int, "xp_total": int }] }` | Full agent state sync (sent on UE5 connect and periodically every 10s) |

**UE5 -> Web App messages (3 types):**

| Type | Payload Schema | Description |
|------|---------------|-------------|
| `agent_clicked` | `{ "agent_id": "string" }` | User clicked 3D avatar |
| `camera_moved` | `{ "position": { "x": float, "y": float, "z": float }, "rotation": { "pitch": float, "yaw": float, "roll": float } }` | Camera state for minimap sync |
| `scene_ready` | `{ "agent_count": int, "scene_version": "string" }` | UE5 finished loading scene |

**Backend-originated messages (to both web and UE5):**

| Type | Payload Schema | Trigger |
|------|---------------|---------|
| `agent_state_changed` | `{ "agent_id": "string", "status": "string", "level": int, "xp_total": int }` | Agent update via existing event pipeline |
| `agent_spawned` | `{ "agent_id": "string", "name": "string", "status": "string" }` | New agent registered |

### 2.4 Backend Implementation

**New file: `src/backend/app/routers/ue5_websocket.py`**

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager
from app.core.security import decode_token
from app.core.dependencies import get_workspace_id_from_api_key
import orjson

router = APIRouter(tags=["ue5"])

# In-memory: track one UE5 connection and N web connections per workspace
_ue5_connections: dict[str, WebSocket] = {}  # workspace_id -> ws
_web_connections: dict[str, set[WebSocket]] = {}  # workspace_id -> set

@router.websocket("/ws/ue5")
async def ws_ue5(
    websocket: WebSocket,
    workspace_id: str = Query(...),
    token: str = Query(None),
    api_key: str = Query(None),
):
    """Bidirectional relay between web clients and UE5 application."""
    # Auth: JWT for web clients, API key for UE5
    source = await _authenticate(websocket, token, api_key, workspace_id)
    if source is None:
        return

    await websocket.accept()
    _register(workspace_id, source, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            msg = orjson.loads(raw)
            msg["source"] = source
            msg["workspace_id"] = workspace_id
            await _relay(workspace_id, source, msg)
    except WebSocketDisconnect:
        _unregister(workspace_id, source, websocket)
```

The relay logic:
- Messages from `"web"` are forwarded to the UE5 connection for that workspace.
- Messages from `"ue5"` are broadcast to all web connections for that workspace.
- `agent_state_changed` and `agent_spawned` are injected by subscribing to the existing Redis Pub/Sub channel `ws:workspace:{id}` and forwarding relevant events.

### 2.5 Frontend Implementation

**New file: `src/frontend/src/components/ue5/PixelStreamViewer.tsx`**

This component manages:
1. WebRTC connection to the signaling server via the `@epicgames-ps/lib-pixelstreamingfrontend-ue5.5` npm package (Epic's official Pixel Streaming client library).
2. A `<video>` element for the stream.
3. DataChannel for input forwarding (mouse, keyboard).
4. Connection status tracking for fallback logic.

**New file: `src/frontend/src/components/ue5/UE5CommandChannel.ts`**

A singleton class that manages the `/ws/ue5` WebSocket connection:

```typescript
export class UE5CommandChannel {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(payload: unknown) => void>> = new Map();

  connect(workspaceId: string, token: string): void { ... }
  send(type: string, payload: Record<string, unknown>): void { ... }
  on(type: string, handler: (payload: unknown) => void): () => void { ... }
  disconnect(): void { ... }
}

export const ue5Channel = new UE5CommandChannel();
```

**New file: `src/frontend/src/pages/World3DPage.tsx`**

```typescript
export function World3DPage() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [ue5Status, setUe5Status] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [reconnecting, setReconnecting] = useState(false);

  // Attempt UE5 connection with 3-second timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ue5Status === 'connecting') {
        setUe5Status('failed');
        setViewMode('2d');
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [ue5Status]);

  // On mid-session disconnect: 10s reconnection window then fallback
  // ...

  return (
    <div>
      {/* View toggle: 2D / 3D tabs */}
      <ViewToggle mode={viewMode} onToggle={setViewMode} ue5Available={ue5Status === 'connected'} />

      {ue5Status === 'failed' && viewMode === '3d' && (
        <Banner variant="info">
          3D viewer unavailable -- showing 2D view.
          <Link to="/settings">Configure 3D</Link>
        </Banner>
      )}

      {viewMode === '3d' && ue5Status === 'connected' ? (
        <PixelStreamViewer />
      ) : (
        <WorldCanvas />  {/* existing 2D PixiJS canvas */}
      )}
    </div>
  );
}
```

### 2.6 Fallback Detection Logic

1. On mount, check `VITE_UE5_ENABLED` env var. If `false`, immediately render 2D.
2. If enabled, attempt WebRTC connection to signaling server URL (`VITE_UE5_SIGNALING_URL`).
3. Set 3-second timeout. If no `scene_ready` message arrives, set status to `failed` and render 2D with info banner.
4. If connection drops mid-session: show reconnection spinner overlay, retry every 2 seconds for 10 seconds total. If all retries fail, switch to 2D with banner.
5. User can manually toggle between 2D and 3D via a tab control. Toggling preserves the selected agent ID.

### 2.7 Docker Configuration

**New file: `docker-compose.ue5.yml`** (separate from main stack, requires GPU host)

```yaml
version: "3.9"
services:
  signaling:
    image: ghcr.io/epicgames/pixel-streaming-signalling-server:5.5
    ports:
      - "8888:8888"   # HTTP
      - "8443:8443"   # WSS
    environment:
      - STUN_SERVER=stun:stun.l.google.com:19302

  ue5-app:
    image: ${UE5_IMAGE:-ghcr.io/ashishkots/oav-ue5:latest}
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
    environment:
      - SIGNALING_URL=ws://signaling:8888
      - BACKEND_WS_URL=ws://host.docker.internal:8000/ws/ue5
      - BACKEND_API_KEY=${UE5_API_KEY}
    depends_on:
      - signaling
```

### 2.8 Environment Variables (Backend)

Add to `Settings` class in `config.py`:

```python
# UE5 Pixel Streaming
UE5_ENABLED: bool = False
UE5_SIGNALING_URL: str = "ws://localhost:8888"
```

Add to frontend `.env`:

```
VITE_UE5_ENABLED=false
VITE_UE5_SIGNALING_URL=ws://localhost:8888
```

---

## 3. Cross-Product Integration Architecture

### 3.1 Consistent Service Pattern

All four integrations follow this structure:

```
src/backend/app/
  core/
    integrations.py          # CircuitBreaker, BaseIntegrationClient, encryption helpers
  models/
    integration.py           # IntegrationConfig SQLAlchemy model
  schemas/
    integration.py           # Shared Pydantic: IntegrationConfigCreate/Update/Response
    opentrace.py             # OpenTrace-specific schemas
    openmesh.py              # OpenMesh-specific schemas
    openmind.py              # OpenMind-specific schemas
    openshield.py            # OpenShield-specific schemas
  services/
    opentrace_service.py     # OpenTraceService(BaseIntegrationClient)
    openmesh_service.py      # OpenMeshService(BaseIntegrationClient)
    openmind_service.py      # OpenMindService(BaseIntegrationClient)
    openshield_service.py    # OpenShieldService(BaseIntegrationClient)
  routers/
    integrations/
      __init__.py            # Include all sub-routers
      config.py              # CRUD for integration_configs
      opentrace.py           # OpenTrace proxy endpoints
      openmesh.py            # OpenMesh proxy endpoints
      openmind.py            # OpenMind proxy endpoints
      openshield.py          # OpenShield proxy endpoints
  tasks/
    integrations.py          # Celery tasks for periodic sync

src/frontend/src/
  api/
    integrations.ts          # Shared integration config API
    opentrace.ts             # OpenTrace API + TanStack Query hooks
    openmesh.ts              # OpenMesh API + hooks
    openmind.ts              # OpenMind API + hooks
    openshield.ts            # OpenShield API + hooks
  pages/
    TraceExplorerPage.tsx
    MeshTopologyPage.tsx
    KnowledgeGraphPage.tsx
    SecurityPage.tsx
  components/
    traces/
      TraceWaterfall.tsx
      TraceList.tsx
      SpanTooltip.tsx
    mesh/
      MeshGraph.tsx
      MeshStatsPanel.tsx
    knowledge/
      KnowledgeGraph.tsx
      EntityDetailPanel.tsx
    security/
      ComplianceDashboard.tsx
      ViolationsTimeline.tsx
      SecurityGradeCard.tsx
    integrations/
      IntegrationConfigForm.tsx
      IntegrationHealthBadge.tsx
```

### 3.2 Circuit Breaker Implementation

**File: `src/backend/app/core/integrations.py`**

```python
import time
import enum
import logging
from typing import TypeVar, Callable, Any
from functools import wraps
import httpx
from cryptography.fernet import Fernet
import hashlib
import base64

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(enum.Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerError(Exception):
    """Raised when circuit is open."""
    pass


class CircuitBreaker:
    """In-memory circuit breaker. States: CLOSED -> OPEN -> HALF_OPEN -> CLOSED.

    Args:
        failure_threshold: Consecutive failures before opening. Default 3.
        recovery_timeout: Seconds before transitioning from OPEN to HALF_OPEN. Default 60.
        success_threshold: Successes in HALF_OPEN before closing. Default 1.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
        success_threshold: int = 1,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: float = 0.0

    @property
    def is_available(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if time.monotonic() - self.last_failure_time >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                logger.info("Circuit %s: OPEN -> HALF_OPEN", self.name)
                return True
            return False
        # HALF_OPEN
        return True

    def record_success(self) -> None:
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                logger.info("Circuit %s: HALF_OPEN -> CLOSED", self.name)
        else:
            self.failure_count = 0

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.monotonic()
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            logger.warning("Circuit %s: HALF_OPEN -> OPEN", self.name)
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning("Circuit %s: CLOSED -> OPEN (failures=%d)", self.name, self.failure_count)

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        if not self.is_available:
            raise CircuitBreakerError(f"Circuit {self.name} is OPEN")
        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise


def _derive_fernet_key(secret: str) -> bytes:
    """Derive a Fernet-compatible 32-byte key from the app secret."""
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt an integration API key for storage."""
    f = Fernet(_derive_fernet_key(settings.SECRET_KEY))
    return f.encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored integration API key."""
    f = Fernet(_derive_fernet_key(settings.SECRET_KEY))
    return f.decrypt(encrypted_key.encode()).decode()


class BaseIntegrationClient:
    """Base HTTP client for cross-product integrations.

    Subclasses set `product_name`, `env_base_url_key`, `env_api_key_key`.
    """

    product_name: str = ""
    env_base_url_key: str = ""
    env_api_key_key: str = ""

    def __init__(self) -> None:
        self.circuit = CircuitBreaker(name=self.product_name)
        self._client = httpx.AsyncClient(timeout=10.0)

    async def _get_config(self, workspace_id: str, db=None) -> tuple[str, str]:
        """Resolve base_url and api_key from DB config or env vars.

        DB config takes precedence over env vars.
        """
        if db:
            from sqlalchemy import select
            from app.models.integration import IntegrationConfig
            config = await db.scalar(
                select(IntegrationConfig).where(
                    IntegrationConfig.workspace_id == workspace_id,
                    IntegrationConfig.product_name == self.product_name,
                    IntegrationConfig.enabled == True,
                )
            )
            if config:
                return config.base_url, decrypt_api_key(config.api_key_encrypted)

        base_url = getattr(settings, self.env_base_url_key, "")
        api_key = getattr(settings, self.env_api_key_key, "")
        return base_url, api_key

    async def _request(
        self, method: str, path: str, workspace_id: str, db=None, **kwargs
    ) -> dict:
        """Make an authenticated HTTP request through the circuit breaker."""
        base_url, api_key = await self._get_config(workspace_id, db)
        if not base_url:
            raise ValueError(f"{self.product_name} not configured for workspace {workspace_id}")

        headers = kwargs.pop("headers", {})
        headers["X-API-Key"] = api_key

        async def _do_request():
            resp = await self._client.request(
                method, f"{base_url}{path}", headers=headers, **kwargs
            )
            resp.raise_for_status()
            return resp.json()

        return await self.circuit.call(_do_request)
```

### 3.3 IntegrationConfig Model

**New file: `src/backend/app/models/integration.py`**

```python
from sqlalchemy import String, Boolean, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from app.core.database import Base
from app.core.utils import utcnow


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"
    __table_args__ = (
        Index("ix_integration_configs_workspace_product", "workspace_id", "product_name", unique=True),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(50), nullable=False)  # opentrace | openmesh | openmind | openshield
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    api_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    settings_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string for product-specific settings
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
```

### 3.4 Integration Schemas (Shared)

**New file: `src/backend/app/schemas/integration.py`**

```python
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime


class IntegrationConfigCreate(BaseModel):
    product_name: str  # opentrace | openmesh | openmind | openshield
    base_url: str
    api_key: str  # plain text; encrypted before storage
    enabled: bool = True
    settings: Optional[dict] = None


class IntegrationConfigUpdate(BaseModel):
    base_url: Optional[str] = None
    api_key: Optional[str] = None  # plain text; encrypted before storage
    enabled: Optional[bool] = None
    settings: Optional[dict] = None


class IntegrationConfigResponse(BaseModel):
    id: str
    workspace_id: str
    product_name: str
    base_url: str
    enabled: bool
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    # api_key is never returned

    model_config = {"from_attributes": True}


class IntegrationHealthResponse(BaseModel):
    product_name: str
    status: str  # "connected" | "disconnected" | "not_configured" | "circuit_open"
    latency_ms: Optional[float] = None
    error: Optional[str] = None
```

### 3.5 Integration Config Router

**New file: `src/backend/app/routers/integrations/config.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import encrypt_api_key
from app.models.integration import IntegrationConfig
from app.schemas.integration import (
    IntegrationConfigCreate, IntegrationConfigUpdate,
    IntegrationConfigResponse, IntegrationHealthResponse,
)
import orjson

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

ALLOWED_PRODUCTS = {"opentrace", "openmesh", "openmind", "openshield"}


@router.get("/config", response_model=list[IntegrationConfigResponse])
async def list_configs(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(IntegrationConfig).where(IntegrationConfig.workspace_id == workspace_id)
    )
    return result.scalars().all()


@router.put("/config/{product_name}", response_model=IntegrationConfigResponse)
async def upsert_config(
    product_name: str,
    body: IntegrationConfigCreate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    # Validate product name
    # Upsert: find existing or create
    # Encrypt api_key before storage
    ...


@router.get("/health", response_model=list[IntegrationHealthResponse])
async def check_health(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    # For each configured integration, ping the partner product
    # Return status per integration
    ...
```

### 3.6 Environment Variables for Integrations

Add to `Settings` class in `config.py`:

```python
# Integration defaults (can be overridden per-workspace in DB)
OPENTRACE_BASE_URL: str = ""
OPENTRACE_API_KEY: str = ""
OPENMESH_BASE_URL: str = ""
OPENMESH_API_KEY: str = ""
OPENMIND_BASE_URL: str = ""
OPENMIND_API_KEY: str = ""
OPENSHIELD_BASE_URL: str = ""
OPENSHIELD_API_KEY: str = ""
```

### 3.7 Celery Tasks for Integration Sync

**New file: `src/backend/app/tasks/integrations.py`**

```python
from app.core.celery_app import celery_app

@celery_app.task(name="app.tasks.sync_opentrace")
def sync_opentrace(workspace_id: str) -> None:
    """Periodic task: refresh OpenTrace trace cache for active agents."""
    ...

@celery_app.task(name="app.tasks.sync_openmesh")
def sync_openmesh(workspace_id: str) -> None:
    """Periodic task: refresh OpenMesh topology cache."""
    ...

@celery_app.task(name="app.tasks.sync_openmind")
def sync_openmind(workspace_id: str) -> None:
    """Periodic task: refresh OpenMind knowledge graph cache."""
    ...

@celery_app.task(name="app.tasks.sync_openshield")
def sync_openshield(workspace_id: str) -> None:
    """Periodic task: refresh OpenShield security posture cache."""
    ...

@celery_app.task(name="app.tasks.apply_xp_decay")
def apply_xp_decay() -> None:
    """Daily task (00:00 UTC): apply 1% XP decay to inactive agents."""
    ...
```

Add to celery beat schedule in `celery_app.py`:

```python
"sync-integrations": {
    "task": "app.tasks.sync_integrations_all",
    "schedule": 300.0,  # 5 minutes
},
"apply-xp-decay": {
    "task": "app.tasks.apply_xp_decay",
    "schedule": crontab(hour=0, minute=0),  # daily at 00:00 UTC
},
```

### 3.8 Redis Caching Strategy

| Integration | Cache Key Pattern | TTL | Invalidation |
|-------------|-------------------|-----|--------------|
| OpenTrace trace list | `opentrace:agent:{agent_id}:traces` | 30s | On new event for agent |
| OpenTrace trace detail | `opentrace:trace:{trace_id}` | 5min | None (immutable) |
| OpenMesh topology | `openmesh:workspace:{id}:topology` | 60s | On Celery sync |
| OpenMesh stats | `openmesh:workspace:{id}:stats` | 5min | On Celery sync |
| OpenMind graph | `openmind:workspace:{id}:graph` | 5min | On Celery sync |
| OpenMind entity | `openmind:entity:{id}` | 10min | None |
| OpenShield posture | `openshield:workspace:{id}:posture` | 2min | On Celery sync |
| OpenShield agent | `openshield:agent:{id}:posture` | 2min | On Celery sync |

---

## 4. OpenTrace Integration (OAV-302)

### 4.1 Service

**File: `src/backend/app/services/opentrace_service.py`**

```python
from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis
import orjson

class OpenTraceService(BaseIntegrationClient):
    product_name = "opentrace"
    env_base_url_key = "OPENTRACE_BASE_URL"
    env_api_key_key = "OPENTRACE_API_KEY"

    async def get_traces(self, workspace_id: str, agent_id: str, limit: int = 20, db=None) -> list[dict]:
        """Fetch traces for an agent. Cache in Redis for 30s."""
        redis = await get_redis()
        cache_key = f"opentrace:agent:{agent_id}:traces"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET", f"/api/traces?agent_id={agent_id}&limit={limit}",
            workspace_id=workspace_id, db=db,
        )
        await redis.setex(cache_key, 30, orjson.dumps(data))
        return data

    async def get_trace_detail(self, workspace_id: str, trace_id: str, db=None) -> dict:
        """Fetch full trace with spans. Cache for 5min."""
        redis = await get_redis()
        cache_key = f"opentrace:trace:{trace_id}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        data = await self._request(
            "GET", f"/api/traces/{trace_id}",
            workspace_id=workspace_id, db=db,
        )
        await redis.setex(cache_key, 300, orjson.dumps(data))
        return data

    async def search_traces(self, workspace_id: str, params: dict, db=None) -> list[dict]:
        """Search traces. Not cached (dynamic query)."""
        query = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
        return await self._request(
            "GET", f"/api/traces/search?{query}",
            workspace_id=workspace_id, db=db,
        )
```

### 4.2 Schemas

**File: `src/backend/app/schemas/opentrace.py`**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TraceView(BaseModel):
    trace_id: str
    root_service: str
    root_operation: str
    duration_ms: float
    span_count: int
    error_count: int
    started_at: datetime


class SpanView(BaseModel):
    span_id: str
    parent_span_id: Optional[str] = None
    service: str
    operation: str
    duration_ms: float
    status: str
    start_time: datetime
    end_time: datetime
    attributes: dict = {}


class TraceDetailView(BaseModel):
    trace_id: str
    spans: list[SpanView]
    duration_ms: float
    service_count: int


class TraceSearchParams(BaseModel):
    agent_id: Optional[str] = None
    service: Optional[str] = None
    min_duration_ms: Optional[float] = None
    error: Optional[bool] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    limit: int = 20
```

### 4.3 Router

**File: `src/backend/app/routers/integrations/opentrace.py`**

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import CircuitBreakerError
from app.services.opentrace_service import OpenTraceService
from app.schemas.opentrace import TraceView, TraceDetailView, TraceSearchParams

router = APIRouter(prefix="/api/integrations/opentrace", tags=["integrations", "opentrace"])
_service = OpenTraceService()


@router.get("/traces", response_model=list[TraceView])
async def list_traces(
    agent_id: str = Query(...),
    limit: int = Query(20, le=100),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await _service.get_traces(workspace_id, agent_id, limit, db)
    except CircuitBreakerError:
        raise HTTPException(503, "OpenTrace is temporarily unavailable")
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/traces/{trace_id}", response_model=TraceDetailView)
async def get_trace(
    trace_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await _service.get_trace_detail(workspace_id, trace_id, db)
    except CircuitBreakerError:
        raise HTTPException(503, "OpenTrace is temporarily unavailable")


@router.get("/search", response_model=list[TraceView])
async def search_traces(
    agent_id: str = Query(None),
    service: str = Query(None),
    min_duration_ms: float = Query(None),
    error: bool = Query(None),
    start: str = Query(None),
    end: str = Query(None),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        params = {
            "agent_id": agent_id, "service": service,
            "min_duration": min_duration_ms, "error": error,
            "start": start, "end": end,
        }
        return await _service.search_traces(workspace_id, params, db)
    except CircuitBreakerError:
        raise HTTPException(503, "OpenTrace is temporarily unavailable")
```

### 4.4 Frontend Components

**`src/frontend/src/api/opentrace.ts`**

```typescript
import { apiClient } from '../services/api';
import { useQuery } from '@tanstack/react-query';

export interface TraceView {
  trace_id: string;
  root_service: string;
  root_operation: string;
  duration_ms: number;
  span_count: number;
  error_count: number;
  started_at: string;
}

export interface SpanView {
  span_id: string;
  parent_span_id: string | null;
  service: string;
  operation: string;
  duration_ms: number;
  status: string;
  start_time: string;
  end_time: string;
  attributes: Record<string, unknown>;
}

export interface TraceDetail {
  trace_id: string;
  spans: SpanView[];
  duration_ms: number;
  service_count: number;
}

export function useAgentTraces(agentId: string | undefined) {
  return useQuery({
    queryKey: ['opentrace', 'traces', agentId],
    queryFn: () => apiClient.get<TraceView[]>(`/api/integrations/opentrace/traces?agent_id=${agentId}`).then(r => r.data),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useTraceDetail(traceId: string | undefined) {
  return useQuery({
    queryKey: ['opentrace', 'trace', traceId],
    queryFn: () => apiClient.get<TraceDetail>(`/api/integrations/opentrace/traces/${traceId}`).then(r => r.data),
    enabled: !!traceId,
    staleTime: 300_000,
  });
}

export function useTraceSearch(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['opentrace', 'search', params],
    queryFn: () => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v != null) query.set(k, String(v)); });
      return apiClient.get<TraceView[]>(`/api/integrations/opentrace/search?${query}`).then(r => r.data);
    },
    enabled: Object.values(params).some(v => v != null),
    staleTime: 10_000,
  });
}
```

**`src/frontend/src/components/traces/TraceWaterfall.tsx`**

The waterfall component renders spans as horizontal bars in a vertically stacked layout:
- Each span is a bar whose left offset = `(span.start_time - trace_start) / trace_duration * 100%` and width = `span.duration_ms / trace_duration * 100%`.
- Bars are colored by service name (consistent color from a hash function).
- Bars are indented by parent-child depth (computed via `parent_span_id` tree walk).
- Hover shows `SpanTooltip` with full span attributes.
- The component accepts `spans: SpanView[]` and `totalDuration: number` as props.
- Implementation uses plain `<div>` elements with Tailwind CSS (no additional charting library needed for waterfall).

**`src/frontend/src/pages/TraceExplorerPage.tsx`**

- Search form: time range picker, agent dropdown, service name input, min duration input, error toggle.
- Results: `TraceList` component showing matching traces.
- Detail: clicking a trace renders `TraceWaterfall` in a slide-out panel.
- "View in OpenTrace" button: constructs URL `${opentrace_base_url}/traces/${trace_id}` and opens in new tab. The base URL is fetched from `/api/integrations/config`.
- Fallback: if OpenTrace returns 503, show banner "OpenTrace connection unavailable. Showing locally ingested spans only." and fall back to querying the existing `/api/spans` endpoint.

---

## 5. OpenMesh Integration (OAV-303)

### 5.1 Service

**File: `src/backend/app/services/openmesh_service.py`**

```python
from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis
import orjson

class OpenMeshService(BaseIntegrationClient):
    product_name = "openmesh"
    env_base_url_key = "OPENMESH_BASE_URL"
    env_api_key_key = "OPENMESH_API_KEY"

    async def get_topology(self, workspace_id: str, db=None) -> dict:
        """Fetch mesh topology. Cache for 60s."""
        redis = await get_redis()
        cache_key = f"openmesh:workspace:{workspace_id}:topology"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request("GET", f"/api/mesh/topology?workspace_id={workspace_id}", workspace_id=workspace_id, db=db)
        await redis.setex(cache_key, 60, orjson.dumps(data))
        return data

    async def get_stats(self, workspace_id: str, period: str = "1h", db=None) -> dict:
        """Fetch mesh stats. Cache for 5min."""
        redis = await get_redis()
        cache_key = f"openmesh:workspace:{workspace_id}:stats:{period}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request("GET", f"/api/mesh/stats?workspace_id={workspace_id}&period={period}", workspace_id=workspace_id, db=db)
        await redis.setex(cache_key, 300, orjson.dumps(data))
        return data
```

### 5.2 Schemas

**File: `src/backend/app/schemas/openmesh.py`**

```python
from pydantic import BaseModel
from typing import Optional


class MeshNodeView(BaseModel):
    agent_id: str
    agent_name: str
    role: str  # producer | consumer | router
    status: str
    connected_peers: int
    messages_sent: int
    messages_received: int


class MeshEdgeView(BaseModel):
    source_agent_id: str
    target_agent_id: str
    protocol: str  # grpc | http | websocket
    message_count: int
    avg_latency_ms: float
    error_rate: float


class MeshTopologyView(BaseModel):
    nodes: list[MeshNodeView]
    edges: list[MeshEdgeView]


class MeshStatsView(BaseModel):
    total_agents: int
    total_connections: int
    total_messages: int
    avg_latency_ms: float
    error_rate: float
    period: str
```

### 5.3 Router

**File: `src/backend/app/routers/integrations/openmesh.py`**

Endpoints:
- `GET /api/integrations/openmesh/topology` -> `MeshTopologyView`
- `GET /api/integrations/openmesh/stats?period=1h` -> `MeshStatsView`

Same error handling pattern as OpenTrace (503 on circuit breaker, 404 on not configured).

### 5.4 Frontend

**`src/frontend/src/pages/MeshTopologyPage.tsx`**

- Uses ReactFlow with custom node and edge components.
- Nodes are `MeshAgentNode` (custom ReactFlow node): shows agent name, role badge, status dot, message counts.
- Edges use `animated: true` with `style.strokeWidth` proportional to `message_count / max_message_count * 5` (1-5px range).
- Edge animation speed reflects message volume (CSS animation-duration inversely proportional to count).
- Hover tooltips on nodes and edges per PRD AC-2 and AC-3.
- Agent click opens the existing AgentDetailPanel sidebar.
- Fallback: if OpenMesh 503, load topology from existing local endpoint `GET /api/agents` and the Sprint 2 relationship graph (computed by Celery), with banner "OpenMesh unavailable -- showing local topology."
- Real-time: subscribe to `workspace:{id}` WebSocket room and listen for `mesh.topology_changed` events (emitted by the Celery sync task when topology differs from cache).

---

## 6. OpenMind Integration (OAV-304)

### 6.1 Service

**File: `src/backend/app/services/openmind_service.py`**

```python
from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis
import orjson

class OpenMindService(BaseIntegrationClient):
    product_name = "openmind"
    env_base_url_key = "OPENMIND_BASE_URL"
    env_api_key_key = "OPENMIND_API_KEY"

    async def get_graph(self, workspace_id: str, limit: int = 200, offset: int = 0, db=None) -> dict:
        """Fetch knowledge graph. Cache for 5min."""
        redis = await get_redis()
        cache_key = f"openmind:workspace:{workspace_id}:graph:{limit}:{offset}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request(
            "GET", f"/api/graph?workspace_id={workspace_id}&limit={limit}&offset={offset}",
            workspace_id=workspace_id, db=db,
        )
        await redis.setex(cache_key, 300, orjson.dumps(data))
        return data

    async def get_entity(self, workspace_id: str, entity_id: str, db=None) -> dict:
        """Fetch entity detail. Cache for 10min."""
        redis = await get_redis()
        cache_key = f"openmind:entity:{entity_id}"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request("GET", f"/api/graph/entities/{entity_id}", workspace_id=workspace_id, db=db)
        await redis.setex(cache_key, 600, orjson.dumps(data))
        return data

    async def search_entities(self, workspace_id: str, query: str, db=None) -> list[dict]:
        """Search entities. Not cached."""
        return await self._request(
            "GET", f"/api/graph/search?q={query}&workspace_id={workspace_id}",
            workspace_id=workspace_id, db=db,
        )
```

### 6.2 Schemas

**File: `src/backend/app/schemas/openmind.py`**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class KnowledgeNodeView(BaseModel):
    entity_id: str
    name: str
    type: str  # concept | fact | agent_memory | embedding
    description: Optional[str] = None
    created_at: datetime
    relevance_score: float


class KnowledgeEdgeView(BaseModel):
    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    weight: float
    contributing_agents: list[str]


class KnowledgeGraphView(BaseModel):
    nodes: list[KnowledgeNodeView]
    edges: list[KnowledgeEdgeView]
    total_count: int  # total entities in graph (for pagination)


class EntityDetailView(BaseModel):
    entity_id: str
    name: str
    type: str
    description: Optional[str] = None
    created_at: datetime
    related_agents: list[str]
    related_entities: list[KnowledgeNodeView]  # top 5
```

### 6.3 Router

**File: `src/backend/app/routers/integrations/openmind.py`**

Endpoints:
- `GET /api/integrations/openmind/graph?limit=200&offset=0` -> `KnowledgeGraphView`
- `GET /api/integrations/openmind/entities/{entity_id}` -> `EntityDetailView`
- `GET /api/integrations/openmind/search?q=query` -> `list[KnowledgeNodeView]`

### 6.4 Frontend

**`src/frontend/src/pages/KnowledgeGraphPage.tsx`**

- Uses ReactFlow with a force-directed layout (custom layout algorithm, similar to the existing `forceLayout.ts` but with configurable iterations).
- Node types visually differentiated per PRD AC-2:
  - `concept`: blue circle node
  - `fact`: green rectangle node
  - `agent_memory`: purple diamond node
  - `embedding`: orange hexagon node
- Each custom node type is a separate ReactFlow `nodeTypes` component.
- Click on node -> `EntityDetailPanel` slide-out shows name, type, description, related agents, top 5 related entities.
- Search: debounced input (300ms) highlights matching nodes and dims others using ReactFlow's `fitView` + node style updates.
- Pagination: initial load is 200 nodes. "Load more" button appends the next 200 via `offset` parameter.
- Fallback: if OpenMind 503, show empty state "OpenMind connection unavailable. Knowledge graph requires OpenMind to be running."

---

## 7. OpenShield Integration (OAV-305)

### 7.1 Service

**File: `src/backend/app/services/openshield_service.py`**

```python
from app.core.integrations import BaseIntegrationClient
from app.core.redis_client import get_redis
import orjson

class OpenShieldService(BaseIntegrationClient):
    product_name = "openshield"
    env_base_url_key = "OPENSHIELD_BASE_URL"
    env_api_key_key = "OPENSHIELD_API_KEY"

    async def get_posture(self, workspace_id: str, db=None) -> dict:
        """Workspace security posture. Cache for 2min."""
        redis = await get_redis()
        cache_key = f"openshield:workspace:{workspace_id}:posture"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request("GET", f"/api/posture?workspace_id={workspace_id}", workspace_id=workspace_id, db=db)
        await redis.setex(cache_key, 120, orjson.dumps(data))
        return data

    async def get_agent_posture(self, workspace_id: str, agent_id: str, db=None) -> dict:
        """Per-agent security posture. Cache for 2min."""
        redis = await get_redis()
        cache_key = f"openshield:agent:{agent_id}:posture"
        cached = await redis.get(cache_key)
        if cached:
            return orjson.loads(cached)
        data = await self._request("GET", f"/api/posture/agents/{agent_id}", workspace_id=workspace_id, db=db)
        await redis.setex(cache_key, 120, orjson.dumps(data))
        return data

    async def get_violations(self, workspace_id: str, start: str = None, end: str = None, db=None) -> list[dict]:
        """Workspace violations. Not cached (dynamic query)."""
        params = f"workspace_id={workspace_id}"
        if start:
            params += f"&start={start}"
        if end:
            params += f"&end={end}"
        return await self._request("GET", f"/api/violations?{params}", workspace_id=workspace_id, db=db)

    async def get_agent_violations(self, workspace_id: str, agent_id: str, db=None) -> list[dict]:
        """Per-agent violations."""
        return await self._request("GET", f"/api/violations/agents/{agent_id}", workspace_id=workspace_id, db=db)
```

### 7.2 Schemas

**File: `src/backend/app/schemas/openshield.py`**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SecurityPostureView(BaseModel):
    workspace_id: str
    compliance_score: float  # 0-100
    pii_exposure_count: int
    violation_count: int
    threat_count: int
    updated_at: datetime


class AgentSecurityView(BaseModel):
    agent_id: str
    compliance_score: float
    grade: str  # A | B | C | D | F
    violation_count: int
    last_violation_at: Optional[datetime] = None


class ViolationView(BaseModel):
    violation_id: str
    agent_id: str
    policy_name: str
    severity: str  # critical | high | medium | low
    description: str
    occurred_at: datetime
    remediation: Optional[str] = None
```

### 7.3 Router

**File: `src/backend/app/routers/integrations/openshield.py`**

Endpoints:
- `GET /api/integrations/openshield/posture` -> `SecurityPostureView`
- `GET /api/integrations/openshield/agents/{agent_id}` -> `AgentSecurityView`
- `GET /api/integrations/openshield/violations?start=&end=` -> `list[ViolationView]`

### 7.4 Frontend

**`src/frontend/src/pages/SecurityPage.tsx`**

- Top: workspace compliance score (large circular gauge), PII count, violation count, threat count as stat cards.
- Middle: agent list with security grades. Each agent row shows name, grade badge (color-coded A=green through F=red), violation count.
- Click agent grade -> `SecurityDetailPanel` with score breakdown, recent violations, remediation actions.
- Bottom: `ViolationsTimeline` -- Recharts `LineChart` showing violation count per hour over last 24h. Uses `useQuery` to fetch violations with time range.
- Real-time: WebSocket events with `event_type: "security.violation"` trigger toast notification and refetch agent posture.
- Fallback: empty state with "OpenShield connection unavailable" message.

---

## 8. CLI Plugin Architecture (OAV-306)

### 8.1 Package Structure

```
src/cli/
  pyproject.toml
  oav_cli/
    __init__.py
    main.py              # Click group entry point
    client.py            # OAVClient: httpx + websockets
    config.py            # Config file management (~/.oav/config.toml)
    display.py           # Rich formatters (tables, panels)
    charts.py            # ASCII chart rendering (asciichartpy)
    commands/
      __init__.py
      status.py          # oav status [agent_id]
      stream.py          # oav stream [--agent] [--type]
      metrics.py         # oav metrics [--chart] [--agent]
      leaderboard.py     # oav leaderboard
      topology.py        # oav topology
      config_cmd.py      # oav config set/show
      health.py          # oav health
      control.py         # oav start/stop <agent_id>
```

### 8.2 `pyproject.toml`

```toml
[project]
name = "oav-cli"
version = "0.1.0"
description = "CLI plugin for OpenAgentVisualizer"
requires-python = ">=3.11"
dependencies = [
    "click>=8.1",
    "httpx>=0.27",
    "websockets>=12.0",
    "rich>=13.0",
    "asciichartpy>=1.5",
    "tomli>=2.0",
    "tomli-w>=1.0",
]

[project.scripts]
oav = "oav_cli.main:cli"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends._legacy:_Backend"
```

### 8.3 OAVClient

**File: `src/cli/oav_cli/client.py`**

```python
import httpx
import websockets
from typing import AsyncIterator
from oav_cli.config import load_config


class OAVClient:
    """HTTP + WebSocket client for the OAV backend."""

    def __init__(self):
        cfg = load_config()
        self.base_url = cfg.get("url", "http://localhost:8000")
        self.api_key = cfg.get("api_key", "")
        self._http = httpx.Client(
            base_url=self.base_url,
            headers={"X-API-Key": self.api_key, "Content-Type": "application/json"},
            timeout=10.0,
        )

    def get(self, path: str, params: dict = None) -> dict:
        resp = self._http.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    def post(self, path: str, json: dict = None) -> dict:
        resp = self._http.post(path, json=json)
        resp.raise_for_status()
        return resp.json()

    async def stream_events(self, workspace_id: str, agent_id: str = None) -> AsyncIterator[dict]:
        """Connect to WebSocket and yield events."""
        ws_url = self.base_url.replace("http", "ws") + f"/ws/live?workspace_id={workspace_id}"
        async with websockets.connect(ws_url, additional_headers={"X-API-Key": self.api_key}) as ws:
            # Subscribe to workspace room
            await ws.send(json.dumps({"action": "subscribe", "room": f"workspace:{workspace_id}"}))
            if agent_id:
                await ws.send(json.dumps({"action": "subscribe", "room": f"agent:{agent_id}"}))
            async for msg in ws:
                yield json.loads(msg)
```

**Note for BE expert:** The existing `/ws/live` endpoint authenticates via JWT `token` query param. For CLI (API key auth), add support for `X-API-Key` header authentication in the WebSocket endpoint as an alternative to JWT. Check for `api_key` query param first; if present, resolve workspace via `get_workspace_id_from_api_key`. This requires a small modification to `routers/websocket.py`.

### 8.4 Config File

**File: `src/cli/oav_cli/config.py`**

```python
import os
from pathlib import Path

CONFIG_DIR = Path.home() / ".oav"
CONFIG_FILE = CONFIG_DIR / "config.toml"


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    import tomli
    with open(CONFIG_FILE, "rb") as f:
        return tomli.load(f)


def save_config(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    import tomli_w
    with open(CONFIG_FILE, "wb") as f:
        tomli_w.dump(data, f)
```

### 8.5 Command Tree

```
oav (Click group)
  |-- status [agent_id]          GET /api/agents or GET /api/agents/{id}/stats
  |-- stream [--agent] [--type]  WS /ws/live (with room subscriptions)
  |-- start <agent_id>           PUT /api/agents/{id} body: {"status": "active"}
  |-- stop <agent_id>            PUT /api/agents/{id} body: {"status": "idle"}
  |-- metrics [--chart] [--agent]  GET /api/metrics/costs, /api/metrics/tokens
  |-- leaderboard                GET /api/gamification/leaderboard
  |-- topology                   GET /api/agents (build ASCII tree from relationships)
  |-- config set <key> <value>   Write to ~/.oav/config.toml
  |-- config show                Read ~/.oav/config.toml
  |-- health                     GET /api/health
```

### 8.6 Output Formatting

All commands use the `rich` library:
- `oav status` -> `rich.table.Table` with columns: Name, Status, Level, XP, Last Event.
- `oav stream` -> `rich.live.Live` display with scrolling event log.
- `oav metrics --chart` -> `asciichartpy.plot()` for token usage and cost over 24h.
- `oav leaderboard` -> `rich.table.Table` with Rank, Name, Level, XP, Achievements.
- `oav topology` -> `rich.tree.Tree` for ASCII agent hierarchy.
- `oav health` -> `rich.panel.Panel` with status indicators.

---

## 9. GitHub Actions CI Architecture (OAV-241)

### 9.1 Workflow File

**File: `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  workflow_dispatch:

jobs:
  backend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
          cache-dependency-path: src/backend/requirements.txt
      - run: pip install ruff
      - run: ruff check src/backend/

  backend-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
      - run: pip install -r src/backend/requirements.txt mypy
      - run: mypy src/backend/app/ --ignore-missing-imports

  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_USER: oav
          POSTGRES_PASSWORD: oav
          POSTGRES_DB: oav_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U oav"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7.2-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
      - run: pip install -r src/backend/requirements.txt pytest pytest-cov pytest-asyncio
      - run: pytest src/backend/ --cov=app --cov-report=xml --cov-report=html -v
        env:
          DATABASE_URL: postgresql+asyncpg://oav:oav@localhost:5432/oav_test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: htmlcov/

  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: src/frontend/package-lock.json
      - run: cd src/frontend && npm install
      - run: cd src/frontend && npx eslint src/

  frontend-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: src/frontend/package-lock.json
      - run: cd src/frontend && npm install
      - run: cd src/frontend && npx tsc --noEmit

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: src/frontend/package-lock.json
      - run: cd src/frontend && npm install
      - run: cd src/frontend && npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: src/frontend/coverage/

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build

  e2e-test:
    runs-on: ubuntu-latest
    needs: [docker-build]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
      - run: docker compose down
```

### 9.2 Job Dependency Graph

```
backend-lint ----+
backend-typecheck +---> (parallel, no deps)
backend-test ----+
frontend-lint ---+
frontend-typecheck
frontend-test ---+
                  \
                   +---> docker-build ---> e2e-test
```

Lint and typecheck jobs for backend and frontend all run in parallel. `backend-test` and `frontend-test` also run in parallel. `docker-build` waits for both test jobs to pass. `e2e-test` waits for `docker-build`.

### 9.3 Caching Strategy

- **pip cache:** `actions/setup-python` with `cache: "pip"` and `cache-dependency-path: src/backend/requirements.txt`
- **npm cache:** `actions/setup-node` with `cache: "npm"` and `cache-dependency-path: src/frontend/package-lock.json`. Note: if `package-lock.json` does not exist (per known fix: `npm install` not `npm ci`), cache key falls back to `package.json`. Frontend Expert should generate a `package-lock.json` for CI cache efficiency.
- **Docker layer cache:** Not explicitly cached in v1. If CI is slow, add `docker/build-push-action` with GitHub Actions cache backend in a follow-up.

---

## 10. Production Docker Architecture (OAV-242)

### 10.1 Backend Production Dockerfile

**File: `src/backend/Dockerfile.prod`**

```dockerfile
# Stage 1: Install dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Stage 2: Production runtime
FROM python:3.12-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && rm -rf /var/lib/apt/lists/* && \
    groupadd -r oav && useradd -r -g oav -d /app -s /sbin/nologin oav

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY app/ ./app/

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

USER oav

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", "--access-logfile", "-"]
```

Target image size: ~350MB (python:3.12-slim base ~150MB + venv ~200MB).

### 10.2 Frontend Production Dockerfile

**File: `src/frontend/Dockerfile.prod`**

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN npm run build

# Stage 3: Production runtime
FROM nginx:1.25-alpine AS production

RUN addgroup -S oav && adduser -S oav -G oav

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run as non-root
RUN chown -R oav:oav /usr/share/nginx/html && \
    chown -R oav:oav /var/cache/nginx && \
    chown -R oav:oav /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R oav:oav /var/run/nginx.pid

USER oav

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Target image size: ~50MB (nginx:alpine ~40MB + static files ~10MB).

### 10.3 Production Compose

**File: `docker-compose.prod.yml`**

```yaml
version: "3.9"
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      SEED_EMAIL: ${SEED_EMAIL}
      SEED_PASSWORD: ${SEED_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile.prod
    depends_on:
      - backend

  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./deploy/nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

---

## 11. Prometheus Metrics Architecture (OAV-243)

### 11.1 Metric Definitions

**File: `src/backend/app/core/metrics.py`**

```python
from prometheus_client import Counter, Histogram, Gauge

# HTTP metrics (auto-instrumented by prometheus-fastapi-instrumentator)
# These are configured in main.py via Instrumentator()

# Custom business metrics
oav_events_ingested_total = Counter(
    "oav_events_ingested_total",
    "Total events ingested via /api/events and /api/events/batch",
)

oav_websocket_connections_active = Gauge(
    "oav_websocket_connections_active",
    "Number of active WebSocket connections",
)

oav_agents_active = Gauge(
    "oav_agents_active",
    "Number of agents with status != idle",
)

oav_xp_awarded_total = Counter(
    "oav_xp_awarded_total",
    "Total XP awarded across all agents",
)

oav_celery_tasks_total = Counter(
    "oav_celery_tasks_total",
    "Total Celery tasks executed",
    labelnames=["task_name", "status"],
)

oav_celery_task_duration_seconds = Histogram(
    "oav_celery_task_duration_seconds",
    "Duration of Celery task execution",
    labelnames=["task_name"],
    buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0],
)
```

### 11.2 Instrumentator Setup

**Modification to `src/backend/app/main.py`:**

```python
from prometheus_fastapi_instrumentator import Instrumentator

# After app creation:
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/api/health"],
)
instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
```

The `/metrics` endpoint is excluded from JWT auth because it is registered directly by the instrumentator, not through the standard router with `get_workspace_id` dependency.

### 11.3 Metric Instrumentation Points

| Metric | Where to increment | File |
|--------|--------------------|------|
| `oav_events_ingested_total` | After successful event persistence | `routers/events.py` (both single and batch) |
| `oav_websocket_connections_active` | `.inc()` on connect, `.dec()` on disconnect | `services/websocket_manager.py` |
| `oav_agents_active` | Celery task or on agent status change | `routers/agents.py` or periodic task |
| `oav_xp_awarded_total` | After XP transaction commit | `services/gamification_service.py` |
| `oav_celery_tasks_total` | Celery task signal handlers (task_success, task_failure) | `core/celery_app.py` |
| `oav_celery_task_duration_seconds` | Celery task signal handlers | `core/celery_app.py` |

### 11.4 Backend Requirements Addition

Add to `requirements.txt`:

```
prometheus-client==0.21.0
prometheus-fastapi-instrumentator==7.0.0
```

### 11.5 Optional Monitoring Stack

**File: `docker-compose.monitoring.yml`**

```yaml
version: "3.9"
services:
  prometheus:
    image: prom/prometheus:v2.51.0
    volumes:
      - ./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:11.0.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - ./deploy/grafana/provisioning:/etc/grafana/provisioning:ro
    ports:
      - "3001:3000"
```

**Prometheus scrape config (`deploy/prometheus/prometheus.yml`):**

```yaml
scrape_configs:
  - job_name: "oav-backend"
    scrape_interval: 15s
    static_configs:
      - targets: ["backend:8000"]
    metrics_path: "/metrics"
```

---

## 12. E2E Test Architecture (OAV-235)

### 12.1 Project Structure

```
tests/
  e2e/
    playwright.config.ts
    fixtures/
      auth.ts              # Login fixture: authenticates and stores state
      api.ts               # API helper fixture for test data setup
    pages/
      LoginPage.ts         # Page object: login form interactions
      DashboardPage.ts     # Page object: dashboard assertions
      AgentDetailPage.ts   # Page object: agent detail tabs
      TopologyPage.ts      # Page object: ReactFlow graph
      LeaderboardPage.ts
      AnalyticsPage.ts
      AlertsPage.ts
      SessionsPage.ts
      SettingsPage.ts
      WorldPage.ts         # Page object: PixiJS canvas (limited — canvas interactions)
    specs/
      01-registration.spec.ts
      02-login.spec.ts
      03-agent-creation.spec.ts
      04-agent-detail.spec.ts
      05-realtime-event.spec.ts
      06-leaderboard.spec.ts
      07-analytics.spec.ts
      08-topology.spec.ts
      09-sessions.spec.ts
      10-alerts.spec.ts
      11-integration-config.spec.ts
      12-3d-fallback.spec.ts
```

### 12.2 Playwright Config

**File: `playwright.config.ts`** (project root)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  timeout: 30_000,
  retries: 1,
  workers: 1,  // Serial execution: tests share database state
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'docker compose up -d && sleep 5',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

### 12.3 Page Object Model

Each page object encapsulates selectors and actions:

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }

  async expectDashboardRedirect() {
    await this.page.waitForURL('**/dashboard');
  }
}
```

### 12.4 Test Data Seeding

Tests use the seeded default user (`kotsai@gmail.com` / `kots@123`). Agent creation is done via the API within test fixtures:

```typescript
// tests/e2e/fixtures/api.ts
import { APIRequestContext } from '@playwright/test';

export async function createTestAgent(api: APIRequestContext, token: string, name: string) {
  const resp = await api.post('/api/agents', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, role: 'test-agent', framework: 'custom' },
  });
  return resp.json();
}
```

### 12.5 Frontend `data-testid` Requirements

The Frontend Expert must add `data-testid` attributes to key interactive elements:
- Login form: `data-testid="email"`, `data-testid="password"`, `data-testid="submit"`
- Nav items: `data-testid="nav-{route}"` (e.g., `nav-dashboard`, `nav-topology`)
- Agent cards: `data-testid="agent-card-{id}"`
- Settings tabs: `data-testid="settings-tab-integrations"`

---

## 13. New API Endpoints

### 13.1 Full Endpoint List

| Method | Path | Auth | Request | Response | Feature |
|--------|------|------|---------|----------|---------|
| **UE5 Pixel Streaming** |
| WS | `/ws/ue5` | JWT or API Key | See section 2.3 | See section 2.3 | OAV-301 |
| **Integration Config** |
| GET | `/api/integrations/config` | JWT | - | `list[IntegrationConfigResponse]` | OAV-302-305 |
| PUT | `/api/integrations/config/{product}` | JWT | `IntegrationConfigCreate` | `IntegrationConfigResponse` | OAV-302-305 |
| GET | `/api/integrations/health` | JWT | - | `list[IntegrationHealthResponse]` | OAV-302-305 |
| **OpenTrace** |
| GET | `/api/integrations/opentrace/traces` | JWT | `?agent_id=&limit=` | `list[TraceView]` | OAV-302 |
| GET | `/api/integrations/opentrace/traces/{id}` | JWT | - | `TraceDetailView` | OAV-302 |
| GET | `/api/integrations/opentrace/search` | JWT | `?agent_id=&service=&min_duration_ms=&error=&start=&end=` | `list[TraceView]` | OAV-302 |
| **OpenMesh** |
| GET | `/api/integrations/openmesh/topology` | JWT | - | `MeshTopologyView` | OAV-303 |
| GET | `/api/integrations/openmesh/stats` | JWT | `?period=1h\|24h\|7d` | `MeshStatsView` | OAV-303 |
| **OpenMind** |
| GET | `/api/integrations/openmind/graph` | JWT | `?limit=200&offset=0` | `KnowledgeGraphView` | OAV-304 |
| GET | `/api/integrations/openmind/entities/{id}` | JWT | - | `EntityDetailView` | OAV-304 |
| GET | `/api/integrations/openmind/search` | JWT | `?q=` | `list[KnowledgeNodeView]` | OAV-304 |
| **OpenShield** |
| GET | `/api/integrations/openshield/posture` | JWT | - | `SecurityPostureView` | OAV-305 |
| GET | `/api/integrations/openshield/agents/{id}` | JWT | - | `AgentSecurityView` | OAV-305 |
| GET | `/api/integrations/openshield/violations` | JWT | `?start=&end=` | `list[ViolationView]` | OAV-305 |
| **Prometheus** |
| GET | `/metrics` | None | - | Prometheus exposition format | OAV-243 |

### 13.2 Health Endpoint Enhancement

Update the existing `GET /api/health` to include integration status:

```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "integrations": {
    "opentrace": "connected",
    "openmesh": "not_configured",
    "openmind": "circuit_open",
    "openshield": "disconnected"
  }
}
```

---

## 14. New Database Migrations

### 14.1 Migration: `integration_configs` Table

**Alembic migration file: `src/backend/alembic/versions/xxxx_add_integration_configs.py`**

```python
"""Add integration_configs table

Revision ID: sprint3_001
"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.create_table(
        "integration_configs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("product_name", sa.String(50), nullable=False),
        sa.Column("base_url", sa.String(500), nullable=False),
        sa.Column("api_key_encrypted", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default="true"),
        sa.Column("settings_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(
        "ix_integration_configs_workspace_product",
        "integration_configs",
        ["workspace_id", "product_name"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_integration_configs_workspace_product")
    op.drop_table("integration_configs")
```

### 14.2 No Other Schema Changes

All integration data (traces, topology, knowledge graph, security posture) is fetched from external products and cached in Redis. No additional database tables are required for integration data storage. The existing `spans` table continues to serve as local fallback for OpenTrace.

---

## 15. Implementation Sequencing

### Phase 1: Foundation (Days 1-3) -- Backend and Frontend in parallel

**Backend Expert (BE):**
1. `app/core/integrations.py` -- CircuitBreaker, BaseIntegrationClient, encryption helpers
2. `app/models/integration.py` -- IntegrationConfig model
3. Alembic migration for `integration_configs`
4. `app/schemas/integration.py` -- shared integration schemas
5. `app/routers/integrations/config.py` -- CRUD endpoints
6. `app/core/metrics.py` -- Prometheus metric definitions
7. Instrumentator setup in `main.py` + `/metrics` endpoint
8. Add `prometheus-client`, `prometheus-fastapi-instrumentator`, `cryptography`, `httpx` to `requirements.txt`
9. Update `config.py` with new environment variables for all integrations and UE5

**Frontend Expert (FE):**
1. Add new routes in `AppShell.tsx`: Trace Explorer, Mesh Topology, Knowledge Graph, Security, 3D View
2. Add new nav items for all new pages
3. Stub pages for all 5 new pages (loading state only)
4. `src/frontend/src/api/integrations.ts` -- shared integration config API client
5. `IntegrationConfigForm.tsx` component for Settings page Integrations tab
6. Add `data-testid` attributes to existing components (for E2E tests)
7. Install new npm deps: `@epicgames-ps/lib-pixelstreamingfrontend-ue5.5` (or latest)

### Phase 2: Integration Services (Days 3-7) -- BE and FE parallel per integration

**Backend Expert:**
1. `opentrace_service.py` + `schemas/opentrace.py` + `routers/integrations/opentrace.py`
2. `openmesh_service.py` + `schemas/openmesh.py` + `routers/integrations/openmesh.py`
3. `openmind_service.py` + `schemas/openmind.py` + `routers/integrations/openmind.py`
4. `openshield_service.py` + `schemas/openshield.py` + `routers/integrations/openshield.py`
5. `tasks/integrations.py` -- Celery sync tasks + XP decay task
6. Update `celery_app.py` beat schedule
7. Register all new routers in `main.py`
8. WebSocket endpoint update: support API key auth in `/ws/live` for CLI
9. `/ws/ue5` endpoint implementation

**Frontend Expert:**
1. `TraceExplorerPage.tsx` + `TraceWaterfall.tsx` + `TraceList.tsx` + `SpanTooltip.tsx`
2. `MeshTopologyPage.tsx` + `MeshGraph.tsx` + `MeshStatsPanel.tsx`
3. `KnowledgeGraphPage.tsx` + `KnowledgeGraph.tsx` + `EntityDetailPanel.tsx`
4. `SecurityPage.tsx` + `ComplianceDashboard.tsx` + `ViolationsTimeline.tsx`
5. UE5 components: `PixelStreamViewer.tsx`, `UE5CommandChannel.ts`, `World3DPage.tsx`

### Phase 3: CLI Plugin (Days 7-9) -- Can run parallel with Phase 2

**Backend Expert:**
1. `src/cli/` package setup: `pyproject.toml`, `oav_cli/__init__.py`
2. `client.py`, `config.py`, `display.py`, `charts.py`
3. All command modules: `status.py`, `stream.py`, `metrics.py`, `leaderboard.py`, `topology.py`, `config_cmd.py`, `health.py`, `control.py`
4. `main.py` -- Click group wiring

### Phase 4: DevOps (Days 9-11) -- Can run parallel with Phase 3

**Backend Expert:**
1. `Dockerfile.prod` (backend)
2. `docker-compose.prod.yml`
3. `docker-compose.ue5.yml`
4. `docker-compose.monitoring.yml` + Prometheus config + Grafana provisioning

**Frontend Expert:**
1. `Dockerfile.prod` (frontend)
2. Generate `package-lock.json` (for CI caching)

### Phase 5: E2E Tests + CI (Days 11-13)

**Frontend Expert (primary) + Backend Expert (CI):**
1. `playwright.config.ts`
2. Page objects (10 page files)
3. 12 test specs
4. `.github/workflows/ci.yml`

### Dependency Graph

```
Phase 1 (Foundation) ────────────────> Phase 2 (Integrations)
                                              |
                                              +---> Phase 3 (CLI, parallel)
                                              |
                                              +---> Phase 4 (DevOps, parallel)
                                                         |
                                                         v
                                                   Phase 5 (E2E + CI)
```

### Critical Path

The critical path is: Foundation -> Integration Services -> E2E Tests + CI. The CLI and DevOps phases can run in parallel with integration work.

### Risk Mitigations in Sequencing

1. **UE5 without GPU:** Frontend builds the fallback-first `World3DPage` in Phase 2. The PixelStreamViewer is a progressive enhancement. FE can test the fallback path without UE5 hardware.
2. **Partner products unavailable:** All integration services have circuit breakers. BE can test with mock HTTP responses (httpx responders or pytest fixtures). Each service is self-contained and can be developed/tested independently.
3. **CI before E2E:** The CI workflow is created in Phase 5 but references tests from earlier phases. Backend and frontend tests from Phase 1-2 are runnable locally throughout development.

---

## Appendix: New Backend Dependencies

Add to `src/backend/requirements.txt`:

```
httpx==0.27.0
cryptography==42.0.0
prometheus-client==0.21.0
prometheus-fastapi-instrumentator==7.0.0
```

## Appendix: New Frontend Dependencies

Add to `src/frontend/package.json`:

```json
{
  "@epicgames-ps/lib-pixelstreamingfrontend-ue5.5": "^0.1.0",
  "@tanstack/react-query": "^5.0.0"
}
```

Note: `@tanstack/react-query` may already be installed from Sprint 2. The Pixel Streaming frontend library version depends on the UE5 version used; verify compatibility.

## Appendix: Navigation Updates Summary

Add to `NAV_ITEMS` in `AppShell.tsx`:

```typescript
{ to: '/world3d',       icon: Box,         label: '3D View'        },
{ to: '/traces',        icon: Activity,    label: 'Traces'         },
{ to: '/mesh',          icon: GitBranch,   label: 'Mesh'           },
{ to: '/knowledge',     icon: Brain,       label: 'Knowledge'      },
{ to: '/security',      icon: Shield,      label: 'Security'       },
```

Add corresponding routes in `AppShell` `<Routes>`:

```typescript
<Route path="/world3d"       element={<World3DPage />} />
<Route path="/traces"        element={<TraceExplorerPage />} />
<Route path="/mesh"          element={<MeshTopologyPage />} />
<Route path="/knowledge"     element={<KnowledgeGraphPage />} />
<Route path="/security"      element={<SecurityPage />} />
```

Import icons from `lucide-react`: `Box`, `Activity`, `GitBranch`, `Brain`, `Shield`.
