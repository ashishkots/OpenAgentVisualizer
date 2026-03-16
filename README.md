# OpenAgentVisualizer

**Gamified Virtual World for AI Agent Management**

Watch your AI agents work in real-time. Assign tasks, track performance, manage costs, and gamify productivity — all in an animated virtual workspace.

![Status](https://img.shields.io/badge/status-pre--development-blue)
![License](https://img.shields.io/badge/license-FSL--MIT-green)

---

## What is OpenAgentVisualizer?

OpenAgentVisualizer is a real-time, animated virtual workspace that visualizes AI agent teams as characters operating in a 2D spatial environment. Each agent appears as a distinct entity with its own avatar, status indicators, XP level, and activity animations.

Unlike existing observability tools that show agents as boxes in a flowchart or lines in a log file, OpenAgentVisualizer treats agents as **persistent characters with identity, history, and personality**.

### The Problem

- **57%** of companies have AI agents in production, **49.3%** run 10+ agents
- Enterprise monthly AI spend averages **$85,521** (up 36% YoY)
- **57%** still use spreadsheets to track AI costs
- Every existing AI observability tool is a text-based trace viewer built for backend engineers reading JSON
- There is no product that makes watching agents work satisfying or comprehensible to a non-engineer

### The Solution

Connect any agent framework in **3 lines of code** and instantly see every agent as an animated character with real-time status, cost tracking, performance XP, and loop detection.

```python
from openagentvisualizer import OAVTracer

tracer = OAVTracer(api_key="oav_...")

@tracer.agent(name="ResearchBot", role="researcher")
def my_agent(task):
    # Your agent code — zero changes needed
    return result
```

---

## Key Features

### Virtual World View
- Isometric 2D office environment with animated agent avatars
- Real-time status updates (idle, working, thinking, communicating, error)
- Agent-to-agent communication visualized as particle flows
- Semantic zoom: zoom out for overview, zoom in for details
- Weather effects tied to system health (sunny = healthy, storm = critical)

### Gamification Engine
- **XP & Leveling** — Agents earn XP for task completion, quality, efficiency
- **38+ Achievements** — Badges for milestones across productivity, quality, reliability
- **Leaderboards** — Daily/weekly/monthly rankings with anti-gaming measures
- **Quests** — Daily challenges and epic multi-day missions
- **Virtual Economy** — Earn coins, customize avatars and office spaces
- **Professional Mode** — Toggle off gamification for enterprise dashboards

### Observability & Analytics
- Per-agent token usage, cost tracking, and quality scores
- Loop detection with automatic alerts (prevents $47K runaway incidents)
- Session replay — rewind and watch exactly what happened
- Topology view — see agent communication graphs and handoff chains
- SLO management with automated alerting

### Multi-Framework Support
- LangChain / LangGraph
- CrewAI
- AutoGen
- OpenAI Assistants API & Agents SDK
- Anthropic Claude
- Ollama / HuggingFace / vLLM
- Custom HTTP agents (webhook + polling)
- OpenTelemetry GenAI Semantic Conventions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Rendering** | PixiJS v8 (WebGL + WebGPU) |
| **Animation** | Rive State Machines (60fps, 10-15x smaller than Lottie) |
| **State Management** | XState v5 (agent FSM) + Zustand (UI state) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Charts** | Recharts (simple) + Apache ECharts (complex/10M+ points) |
| **Graph Viz** | React Flow → Cytoscape.js at scale |
| **Transitions** | GSAP |
| **Backend** | FastAPI, Python 3.12, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 + TimescaleDB |
| **Cache/Pubsub** | Redis 7.2 (Streams + Pub/Sub) |
| **Real-time** | WebSocket + SSE |
| **Task Queue** | Celery |
| **Auth** | JWT + OAuth2 (Google, GitHub) |
| **Infrastructure** | Docker, Nginx, GitHub Actions |
| **Audio** | Tone.js (muted by default) |

---

## Architecture

```
Agent Frameworks (LangChain, CrewAI, AutoGen, OpenAI, Anthropic, Custom)
        │
        ▼
   OAV SDK (Python / Node.js / REST)
        │
   OTLP gRPC:4317 / HTTP:4318
        │
        ▼
┌─────────────────────────────────┐
│       NGINX Reverse Proxy       │
├─────────┬───────────┬───────────┤
│ FastAPI │ WebSocket │   OTLP    │
│ REST API│  Server   │  Gateway  │
├─────────┴───────────┴───────────┤
│     Redis (Streams + Pub/Sub)    │
├──────────┬──────────┬───────────┤
│ Persist  │ Aggreg.  │  Celery   │
│ Writer   │ Engine   │  Workers  │
├──────────┴──────────┴───────────┤
│  PostgreSQL 16 + TimescaleDB    │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│   React + PixiJS Virtual World   │
│   Rive Animations + GSAP        │
│   Recharts / ECharts Dashboards  │
└─────────────────────────────────┘
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Canvas FPS | 60fps with 50 agents |
| Event ingestion | 100K events/sec |
| Concurrent agents | 10K per workspace |
| WebSocket connections | 50K simultaneous |
| Event-to-render latency | < 500ms (p99) |
| SDK overhead | < 1ms per event |
| Time-to-first-value | < 5 minutes |

---

## Pricing

| Tier | Price | Agents | Events/mo | Features |
|------|-------|--------|-----------|----------|
| **Free** | $0 | 3 | 100K | Virtual world, basic metrics, 24hr retention |
| **Pro** | $99/mo | 25 | 5M | Gamification, alerts, 30-day retention, session replay |
| **Team** | $199/mo | 100 | 25M | RBAC, team features, 90-day retention, cost analytics |
| **Business** | $499/mo | 500 | 100M | SSO/SAML, audit trail, 1yr retention, SLO management |
| **Enterprise** | Custom | Unlimited | Unlimited | Self-hosted, custom SLA, dedicated support |

---

## Project Structure

```
OpenAgentVisualizer/
├── OpenAgentVisualizer_Research.md          # Market research (1,830 lines)
├── Product_Documents/
│   ├── PIPELINE.md                          # 6-wave development pipeline
│   ├── 01_Product_Manager/                  # PRD, features, user stories
│   ├── 02_UX_Designer/                      # Wireframes, user flows, IA
│   ├── 03_UI_Designer/                      # Component library, design tokens
│   ├── 04_Gamification_Expert/              # XP system, achievements, economy
│   ├── 05_Motion_Graphics/                  # Rive state machines, animations
│   ├── 06_Infographics/                     # Dashboard layouts, KPI cards
│   ├── 07_Visualization_Expert/             # Virtual world design, data viz
│   ├── 08_Solution_Architect/               # System architecture, DB schema
│   ├── 09_Agentic_AI_Architect/             # Agent integration, SDK design
│   ├── 10_Frontend_Expert/                  # React + PixiJS implementation
│   ├── 11_Backend_Expert/                   # FastAPI + DB implementation
│   ├── 12_Fullstack_Expert/                 # SDK, Docker, CI/CD
│   ├── 13_QA_Expert/                        # Test strategy, 1500+ test cases
│   ├── 14_Design_System/                    # Unified design system spec
│   └── agents/handoffs/                     # Inter-agent handoff YAMLs
└── README.md
```

---

## Development Pipeline

The project was designed through a **6-wave, 14-agent pipeline**:

| Wave | Agents | Focus |
|------|--------|-------|
| **1** | Product Manager, Gamification Expert, Agentic AI Architect | Requirements & Integration Design |
| **2** | UX Designer, Visualization Expert, Motion Graphics | UX, Data Viz, Animation |
| **3** | UI Designer, Infographics, Design System | Visual Design & Component Library |
| **4** | Solution Architect | System Architecture & API Contracts |
| **5** | Frontend Expert, Backend Expert, Fullstack Expert | Implementation Plans & SDKs |
| **6** | QA Expert | Test Strategy & CI/CD |

Each wave's agents ran in parallel, with gate criteria ensuring quality before the next wave started.

---

## Compliance & Accessibility

- **WCAG 2.2 AA** — Full keyboard navigation, screen reader support, color-blind modes, reduced motion
- **EU AI Act Article 72** — Audit trail for all agent decisions
- **SOC 2** — Encryption at rest (AES-256) and in transit (TLS 1.3)
- **HIPAA-ready** — PII detection and masking in event pipeline

---

## Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **MVP** | 8 weeks | Virtual world, agent avatars, task assignment, basic metrics, XP/leveling, Python SDK |
| **V1** | +3 months | Achievements, Node.js SDK, RBAC, cost attribution, alert webhooks, agent comparison |
| **V2** | +6 months | LLM-as-Judge quality scoring, enterprise SSO, AI postmortem generator, agent marketplace |

---

## License

[Functional Source License (FSL)](https://fsl.software/) — converts to MIT after 2 years.

---

## Contributing

OpenAgentVisualizer is currently in the design and planning phase. Implementation will begin following the development pipeline outlined in `Product_Documents/PIPELINE.md`.

---

Built with the Open* Suite | [ashishkots](https://github.com/ashishkots)
