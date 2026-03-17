# OpenAgentVisualizer — UI/UX Revamp + CLI Integration + 3D Viewer
## Design Specification

**Date:** 2026-03-17
**Version:** 1.0
**Status:** Approved
**Authors:** PM Agent, UX Agent, UI Agent, Design Agent, Motion Graphics Agent, Animation Agent, Real Engine Agent, Frontend Developer Agent
**Approach:** Incremental Layer Migration (Approach 2)
**Existing specs used as base:** `Product_Documents/02_UX_Designer/`, `Product_Documents/03_UI_Designer/`, `Product_Documents/05_Motion_Graphics/`, `Product_Documents/15_Unreal_Engine_Expert/`

---

## Table of Contents

1. [Overview & Scope](#1-overview--scope)
2. [Agent Pipeline & Execution Order](#2-agent-pipeline--execution-order)
3. [Sub-project A: Webapp UI/UX Revamp](#3-sub-project-a-webapp-uiux-revamp)
4. [Sub-project B: CLI Integration Layer](#4-sub-project-b-cli-integration-layer)
5. [Sub-project C: 3D/UE5 Viewer](#5-sub-project-c-3due5-viewer)
6. [File Structure](#6-file-structure)
7. [Testing Strategy](#7-testing-strategy)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Overview & Scope

### 1.1 Goal

Complete UI/UX revamp of the OpenAgentVisualizer webapp across three sequential sub-projects:

- **A. Webapp UI/UX Revamp** — Full React frontend redesign implementing the dual-personality design system (Premium SaaS Professional mode + Game HUD Gamified mode), Rive animations, GSAP transitions, new pages and components.
- **B. CLI Integration Layer** — Native integrations with Claude Code (MCP server), Codex CLI, Google Gemini CLI, and 12 open source AI frameworks (3 CLI + 12 SDK = 15 total integrations).
- **C. 3D/UE5 Viewer** — Three.js 2.5D browser upgrade (all tiers) + UE5 Pixel Streaming embed (Pro/Enterprise).

### 1.2 Execution Strategy

**Incremental Layer Migration:** The existing app remains running throughout. Each sub-project builds on the previous. No big-bang rewrite. Each agent owns a clear scope with well-defined interfaces.

**Sequence:** A → B → C. Sub-project B begins after A's design system and Settings page are complete. Sub-project C begins after B's integration tab is shipped.

### 1.3 Source of Truth

The `Product_Documents/` specs are the foundation. Each agent extends and elevates them — they do not contradict them. Any conflict between this spec and a Product_Documents spec resolves in favour of this spec (newer).

---

## 2. Agent Pipeline & Execution Order

### 2.1 Per-Sub-project Pipeline

Each sub-project runs the full pipeline in order:

```
PM [1.1] → UX [1.2] → UI [1.3] → Design [1.4] → Motion/Animation [1.5]
    ↓ Gate A
TL [2.1] → FE [2.2a] (parallel with BE if needed) → CR [2.3] → QA [2.4] → DevOps
```

### 2.2 Agent Roles and Tool Access

| Agent | Role | Subagent Type | Tools | Skills |
|---|---|---|---|---|
| PM | Requirements, priorities, acceptance criteria | `general-purpose` | Read, Write, WebSearch | — |
| UX Designer | User flows, IA, wireframes, onboarding | `general-purpose` | Read, Write, WebSearch | — |
| UI Designer | Design tokens, component specs, screen designs | `general-purpose` | Read, Write, WebSearch | — |
| Design Agent | Cross-agent consistency, design system, Storybook catalog | `general-purpose` | Read, Write, Glob, Grep | `superpowers:requesting-code-review` |
| Motion Graphics | Rive state machine specs, GSAP choreography, particle specs | `general-purpose` | Read, Write | — |
| Animation Agent | Implement Rive files, GSAP timelines, micro-interactions | `general-purpose` | Read, Write, Edit, Bash | `superpowers:test-driven-development` |
| Real Engine Agent | UE5 scene design, Pixel Streaming config, Three.js bridge | `general-purpose` | Read, Write, WebSearch | — |
| Frontend Developer | All implementation — React, TypeScript, Tailwind, tests | `general-purpose` | All tools | `superpowers:test-driven-development`, `superpowers:subagent-driven-development` |
| Code Reviewer | Review each implementation task | `superpowers:code-reviewer` | All tools | `superpowers:requesting-code-review` |
| QA Engineer | Test all pages, animations, CLI integrations | `general-purpose` | All tools | — |
| DevOps | Docker Compose rebuild, nginx, CI | `general-purpose` | Bash(\*), git(\*) | — |

### 2.3 Handoff Files

Every agent-to-agent transition produces a YAML handoff written to `OpenAgentVisualizer/agents/handoffs/revamp_<stage>.yml`.

---

## 3. Sub-project A: Webapp UI/UX Revamp

### 3.1 Visual System — Dual Personality

Two rendering modes. Same layout grid, same components, same data. Only visual expression changes.

#### Professional Mode (Vercel-style Premium SaaS)

| Token | Value | Usage |
|---|---|---|
| `--oav-bg` | `#0A0A0A` | Page background |
| `--oav-surface` | `#111111` | Cards, panels |
| `--oav-surface-2` | `#1A1A1A` | Nested surfaces |
| `--oav-border` | `rgba(255,255,255,0.08)` | Borders |
| `--oav-text` | `#FAFAFA` | Primary text |
| `--oav-muted` | `#71717A` | Secondary text |
| `--oav-accent` | `#6366F1` | Primary brand (indigo) |
| `--oav-accent-2` | `#FFFFFF` | High-contrast accent |
| `--oav-success` | `#22C55E` | Success states |
| `--oav-error` | `#EF4444` | Error states |
| `--oav-warning` | `#F59E0B` | Warning states |
| `--oav-glass-bg` | `rgba(255,255,255,0.03)` | Glass-morphism fill |
| `--oav-glass-border` | `rgba(255,255,255,0.06)` | Glass-morphism border |
| Animations | Subtle spring, 150-200ms | No particles, no sound |
| Avatar style | Geometric icon + tier badge | No Rive animation |

#### Gamified Mode (Game HUD / Esports)

| Token | Value | Usage |
|---|---|---|
| `--oav-bg` | `#0F1117` | Page background |
| `--oav-surface` | `#1A1D2E` | Cards with glow border |
| `--oav-surface-2` | `#242842` | Nested surfaces |
| `--oav-border` | `rgba(99,102,241,0.3)` | Glow borders |
| `--oav-text` | `#E2E8F0` | Primary text |
| `--oav-muted` | `#64748B` | Secondary text |
| `--oav-accent` | `#00FFB2` | Neon green primary |
| `--oav-accent-2` | `#6366F1` | Indigo secondary |
| `--oav-glow` | `rgba(0,255,178,0.15)` | Glow halo color |
| `--oav-hud-corner` | CSS clip-path corners | HUD panel corner cuts |
| Animations | Dramatic 300-500ms, particles, sound cues | Full Rive + GSAP |
| Avatar style | Rive-animated character, XP bar, nameplate | — |

#### Shared State Tokens (both modes)

| Token | Professional value | Gamified value | Usage |
|---|---|---|---|
| `--oav-focus` | `#6366F1` (2px solid ring) | `#00FFB2` (2px solid ring) | Keyboard focus ring on all interactive elements |
| `--oav-disabled` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.08)` | Disabled element background |
| `--oav-disabled-text` | `#3F3F46` | `#2D3150` | Disabled element text |
| `--oav-skeleton` | `#1C1C1C` (shimmer to `#2A2A2A`) | `#1E2236` (shimmer to `#2A2F4A`) | Loading skeleton shimmer |
| `--oav-selected` | `rgba(99,102,241,0.15)` | `rgba(0,255,178,0.12)` | Selected item background (list rows, nav items, canvas agents) |
| `--oav-hover` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.06)` | Hover overlay on interactive surfaces |

#### Mode Switching

- Single toggle in AppShell header and Settings → Preferences
- `data-mode="professional" | "gamified"` attribute on `<html>`
- All tokens defined under both `[data-mode=professional]` and `[data-mode=gamified]` selectors
- Preference stored in `localStorage` + user profile via `PATCH /api/users/me/preferences`
- Default: Gamified for Free/Pro/Team; Professional for Business/Enterprise

### 3.2 Typography System

| Use | Font | Weight | Size |
|---|---|---|---|
| Headings | Inter | 700 | 24-48px |
| Body | Inter | 400/500 | 13-15px |
| Labels | Inter | 500 | 11-12px |
| Code / traces | JetBrains Mono | 400 | 12-13px |
| HUD numbers (Gamified) | JetBrains Mono | 700 | varies |

Both fonts loaded via `@fontsource` packages (no Google Fonts CDN dependency).

### 3.3 Component Library — New Components

All new components live in `src/frontend/src/components/` with sub-directories by domain. Each component has a co-located `*.test.tsx` and a Storybook story `*.stories.tsx`.

#### Layout Components
- `GlassCard` — backdrop-blur card with `--oav-glass-bg` fill, mode-aware border
- `BentoGrid` — CSS grid layout helper for dashboard bento layout (12-col, variable row spans)
- `HUDPanel` — Gamified-mode panel with corner cuts (CSS `clip-path`) and glow border
- `SectionHeader` — Page section label with optional action slot. File: `components/layout/SectionHeader.tsx`

#### Navigation Components
- `AppShell` (rewrite) — collapsible sidebar (240px expanded / 64px icon-only), top bar with workspace switcher + mode toggle + notification bell
- `WorkspaceSwitcher` — dropdown showing all workspaces, create new, avatar initials
- `ModeToggle` — icon button toggling Professional/Gamified; animated morph between icon states
- `NotificationCenter` — slide-out panel from bell icon, grouped by severity, mark-all-read
- `CommandPalette` — Cmd+K overlay, fuzzy search across agents/pages/actions, keyboard navigation, recent items

#### Agent Components
- `AgentAvatarRive` (upgrade) — wraps Rive canvas, drives state machine from `AgentStatus` prop
- `AgentCard` (upgrade) — mode-aware: geometric in Professional, Rive + glow in Gamified
- `AgentDetailPanel` (upgrade) — tabbed: Overview / Traces / Cost / XP History

#### Metrics Components
- `SparklineChart` — inline SVG sparkline for real-time metric streams (no Recharts dep)
- `AnimatedCounter` — number that counts up from 0 on mount (GSAP `countTo`)
- `CostHeatmap` — 7-day hourly cost grid (colored cells, tooltip on hover)
- `BentoMetricCard` — bento grid cell with metric value, sparkline, and delta badge

#### Gamification Components
- `XPProgressBar` (upgrade) — smoother fill animation, level name tooltip, milestone markers
- `LeaderboardTable` (upgrade) — animated rank changes (GSAP position swap), medal icons top 3
- `LevelUpToast` (upgrade) — full-screen particle burst + slide-up toast, Gamified only
- `BadgeGrid` — agent badge collection display, locked badges shown dimmed

#### Alert Components
- `AlertCard` (upgrade) — severity-glow border (red/yellow/blue), bulk checkbox, resolve button
- `AlertTimeline` — vertical timeline of alert events for an agent

#### Onboarding Components
- `OnboardingWizard` — 5-step modal: Create workspace → Copy API key → Install SDK → Connect first agent → See Sample Data
- `SampleDataBanner` — persistent banner shown when workspace has no real agents, "Using sample data" label + dismiss

#### CLI Integration Components
- `IntegrationCard` — settings card per CLI tool: status badge, install command, event count, test button
- `IntegrationStatusBadge` — pill: Connected (green) / Not configured (gray) / Error (red)
- `CLICommandBlock` — syntax-highlighted code block with one-click copy
- `PluginCard` — dedicated card for Claude Code and Codex CLI plugins: version badge, active/inactive state, list of exposed commands, update + remove actions

### 3.4 Page Redesigns

#### Login Page
- Centered card, animated OAV logo (Rive loop), email/password fields
- GitHub OAuth button + Google OAuth button (UI-only for MVP, wired in V2)
- "Continue with API key" secondary link
- Background: subtle animated gradient mesh (CSS `@keyframes`, no JS)

#### Onboarding Flow (new)
- Triggers on first login when workspace has zero real agents
- `OnboardingWizard` 5-step modal (not full-page, so canvas is visible behind it)
- Step 5 activates Sample Data Mode — populates store with 5 fake agents, they animate on canvas
- Can be dismissed and re-triggered from Help menu

#### AppShell + Navigation
- Left sidebar: logo, nav items (Virtual World, Dashboard, Alerts, Replay, Settings), workspace switcher at bottom, user avatar + mode toggle at very bottom
- Top bar: page title, search icon (opens Cmd+K), notification bell, breadcrumb on nested pages
- Sidebar collapses to icon-only on viewports < 1280px, toggle button at top

#### Virtual World Canvas Page
- Mode bar at top: `[2D]` `[2.5D]` `[3D]` toggle buttons (3D = Pro/Enterprise badge if not subscribed)
- Mini-map in bottom-right corner (canvas thumbnail, click to pan)
- Zone labels floating above office areas (Meeting Room, Dev Corner, etc.)
- Agent count badge in top-left
- Selected agent panel slides in from right (existing `AgentDetailPanel`, upgraded)
- Camera controls: scroll to zoom, drag to pan, double-click agent to focus

#### Dashboard Page
- Bento-grid layout (12 columns, variable row heights)
- Top row: 4 `BentoMetricCard` — Total Agents, Active Now, Total Cost Today, Avg Latency
- Middle row: `CostHeatmap` (wide), `LeaderboardTable` (narrow)
- Bottom row: `SparklineChart` per top-3 agents, `AlertCard` list (latest 3)
- All numbers animate on load via `AnimatedCounter`
- Real-time: cards update via WebSocket events without full re-render

#### Alerts Page
- Filter bar: severity chips (Critical/Warning/Info), status chips (Active/Resolved), agent filter dropdown
- Alert list as `AlertCard` stack, bulk selection with floating action bar (resolve selected, export)
- Click alert → `AlertTimeline` slides in from right

#### Session Replay Page
- Timeline scrubber at bottom (full width), playback controls (play/pause/speed 0.5x/1x/2x/4x)
- Main area: agent event log scrolling in sync with playback
- Side panel: agent state at playback cursor (status, active tool, tokens used so far)
- Diff mode: highlight events that differ between two replay sessions

#### Settings Page
- Tabs: General / Workspace / Integrations / API Keys / Appearance / Danger Zone
- **Integrations tab** — grid of `IntegrationCard` for all CLI + SDK integrations
- **Appearance tab** — mode toggle (Professional/Gamified), canvas theme, font size preference
- **API Keys tab** — list keys, create key (name + expiry), revoke

#### Cmd+K Command Palette
- `Ctrl+K` / `Cmd+K` opens overlay from any page
- Groups: Pages, Agents (live), Actions (Go to replay, Export, etc.), Recent
- Keyboard: `↑↓` navigate, `Enter` activate, `Esc` close
- Fuzzy search with highlighted match characters

### 3.5 Animation System

#### Rive State Machines

Each agent avatar `.riv` file contains one state machine with these states:

```
idle → thinking → working → communicating → error → celebrate
  ↑___________________________|
```

State inputs:
- `status: string` — drives state transitions (values: `idle`, `working`, `thinking`, `communicating`, `error`, `celebrate`)
- `xpLevel: number` — controls avatar appearance tier (1-5 visual tiers)
- `isSelected: boolean` — triggers selection glow ring

**Breaking change from existing `AgentAvatarRive.ts`:** The current implementation uses a single numeric input `agentState` (index 0–4). The new spec requires three named inputs (`status`, `xpLevel`, `isSelected`). Migration path: update `AgentAvatarRive.ts` to use `StateMachineInput` by name via the Rive runtime API (`rive.stateMachineInputs('MainMachine').find(i => i.name === 'status')`). All existing `.riv` files must be re-exported with the new three-input state machine before the React component is updated. The `celebrate` state is triggered by XP level-up events from the WebSocket store, not from `AgentStatus` — it maps to a boolean trigger input `triggerCelebrate: boolean` (auto-resets after animation completes).

**Updated `AgentStatus` type:** Add `celebrate` as a transient overlay state: `type AgentStatus = 'idle' | 'working' | 'thinking' | 'communicating' | 'error'` remains unchanged in the API contract. `celebrate` is a client-side-only Rive state triggered by XP gain events.

File location: `src/frontend/public/avatars/<avatar_id>.riv`
Fallback: geometric SVG icon if Rive fails to load

#### GSAP Animations

| Animation | Trigger | Duration | Easing |
|---|---|---|---|
| Page transition (out) | Route change | 150ms | `power2.in` |
| Page transition (in) | Route mount | 200ms | `power2.out` |
| Card hover lift | `mouseenter` | 120ms | `power1.out` |
| Number count-up | Component mount | 800ms | `power2.out` |
| Sidebar collapse | Toggle click | 200ms | `power2.inOut` |
| Notification slide | Bell click | 250ms | `power3.out` |
| Cmd+K open | Keyboard shortcut | 150ms | `back.out(1.2)` |
| Alert card appear | New alert event | 300ms | `power2.out` |
| Leaderboard rank swap | XP update | 400ms | `power2.inOut` |

#### Particle Events (Gamified Mode Only)

| Event | Particle effect | Duration |
|---|---|---|
| Level-up | Gold confetti burst from agent sprite, full-screen overlay flash | 2000ms |
| XP gain | Small gold sparkles rise from agent | 600ms |
| Error state | Red pulse ring expands from agent, fades | 800ms |
| Agent handoff | Blue arc of particles travels between two agent positions | 500ms |
| Alert resolved | Green check particles scatter | 400ms |

Particle implementation by canvas mode:

| Canvas mode | Particle renderer | Notes |
|---|---|---|
| 2D (PixiJS) | PixiJS `ParticleContainer` on `WorldCanvas` | Full particle system, Gamified mode only |
| 2.5D (Three.js) | Three.js `Points` objects on `ThreeCanvas` | Equivalent particle events re-implemented using Three.js point sprites; `ThreeParticles.ts` utility class |
| 3D (UE5 Pixel Streaming) | UE5 Niagara via data channel | JSON event → UE5 triggers Niagara emitter |

UI-layer events (XP gain badge, level-up toast, alert resolved) use CSS `@keyframes` + `clip-path` regardless of canvas mode.

**`ThreeParticles.ts`** is added to `src/frontend/src/canvas/three/` (new file, listed in §6). It exposes the same event interface as the PixiJS particle system: `emitXPGain(position)`, `emitLevelUp(position)`, `emitError(position)`, `emitHandoff(from, to)`.

---

## 4. Sub-project B: CLI Integration Layer

### 4.1 Architecture

```
OAV Integration Hub
├── src/integrations/
│   ├── claude-code/
│   │   ├── mcp-server/          MCP server (Node.js, 15 tools)
│   │   ├── hooks/               Claude Code hooks (PreToolUse, PostToolUse, Stop)
│   │   └── plugin/              Claude Code plugin package (skills, statusline, hooks)
│   │       ├── plugin.yaml
│   │       ├── skills/          6 skill .md files
│   │       ├── hooks/           session-start.sh, session-stop.sh
│   │       └── statusline/      status.sh
│   ├── codex/
│   │   ├── adapter/             Codex CLI OTLP adapter
│   │   └── plugin/              Codex CLI plugin package (commands, middleware)
│   │       ├── plugin.json
│   │       ├── commands/        5 command .js files
│   │       └── middleware/      telemetry.js
│   ├── gemini-cli/
│   │   └── adapter/             Gemini CLI OTLP adapter
│   └── open-source/
│       ├── langchain/           OAVCallbackHandler
│       ├── langgraph/           OAVLangGraphTracer
│       ├── crewai/              OAVCrewObserver
│       ├── autogen/             OAVAutoGenLogger
│       ├── openai-agents/       OAVOpenAITracer
│       ├── anthropic/           OAVAnthropicTracer
│       ├── haystack/            OAVHaystackTracer
│       ├── llamaindex/          OAVLlamaIndexCallback
│       ├── semantic-kernel/     OAVSKPlugin
│       ├── dspy/                OAVDSPyLogger
│       ├── pydantic-ai/         OAVPydanticAITracer
│       └── smolagents/          OAVSmolagentsCallback
├── src/cli/
│   └── oav                      CLI tool: `oav install <integration>`
└── src/frontend/src/
    └── components/integrations/ IntegrationCard, IntegrationStatusBadge, CLICommandBlock, PluginCard
```

### 4.2 OAV CLI Tool

Single entry point for all integrations:

```bash
oav install claude-code     # installs MCP server + hooks into ~/.claude/settings.json
oav install codex           # patches ~/.codex/config.json
oav install gemini          # patches ~/.gemini/config.yaml
oav install langchain       # prints: pip install openagentvisualizer[langchain]
oav status                  # shows connection status for all installed integrations
oav test <integration>      # fires test event, shows it appear in OAV canvas
oav config set endpoint <url>
oav config set api-key <key>
```

Implemented as a Python Click CLI, distributed with the `openagentvisualizer` PyPI package.

### 4.3 Claude Code MCP Server

**Protocol:** Model Context Protocol (JSON-RPC over stdio)
**Runtime:** Node.js (TypeScript), installed to `~/.oav/mcp-server/`
**Config written to:** `~/.claude/settings.json` under `mcpServers`

**15 tools:**

| Tool | Description | Key params |
|---|---|---|
| `oav_list_agents` | List agents in workspace | `workspace_id`, `status?` |
| `oav_get_agent` | Get agent detail | `agent_id` |
| `oav_get_traces` | Fetch recent traces | `agent_id`, `limit?`, `since?` |
| `oav_get_alerts` | Fetch active alerts | `severity?`, `limit?` |
| `oav_get_metrics` | Cost + token summary | `period: day|week|month` |
| `oav_replay_session` | Start session replay | `session_id`, `speed?` |
| `oav_set_sampling` | Set sampling rate | `rate: 0.0-1.0`, `agent_id?` |
| `oav_get_leaderboard` | XP leaderboard | `limit?` |
| `oav_send_event` | Inject custom event | `agent_id`, `type`, `data` |
| `oav_get_topology` | Agent dependency graph | `workspace_id` |
| `oav_get_slo_status` | SLO breach status | `agent_id?` |
| `oav_get_prompt_versions` | Prompt A/B data | `prompt_name` |
| `oav_get_cost_breakdown` | Per-agent costs | `period`, `agent_id?` |
| `oav_get_audit_log` | Audit trail entries | `limit?`, `since?` |
| `oav_workspace_info` | Workspace metadata | — |

**Claude Code hooks** (written to `~/.claude/settings.json` under `hooks`):
```json
{
  "hooks": {
    "PreToolUse": [{"matcher": ".*", "hooks": [{"type": "command", "command": "oav-hook pre-tool"}]}],
    "PostToolUse": [{"matcher": ".*", "hooks": [{"type": "command", "command": "oav-hook post-tool"}]}],
    "Stop": [{"hooks": [{"type": "command", "command": "oav-hook stop"}]}]
  }
}
```

### 4.4 Codex CLI Adapter

- Wraps Codex CLI execution, captures tool call stdout via subprocess + pipe
- Converts to OAV OTLP spans, sends to `http://localhost:4318/v1/traces`
- Config key in `~/.codex/config.json`: `"oav_endpoint"`, `"oav_api_key"`
- Zero code changes required in user's Codex setup — adapter patches at CLI invocation

### 4.5 Gemini CLI Adapter

- Hooks into Gemini CLI tool execution lifecycle via config extension
- Sends OTLP HTTP spans to OAV gateway
- Config key in `~/.gemini/config.yaml`: `oav_endpoint`, `oav_api_key`
- `oav install gemini` patches the config file automatically

### 4.6 Open Source SDK Adapters

All adapters send events to OAV via the Python SDK's OTLP exporter. Authentication via `OAV_API_KEY` env var or explicit constructor param.

**12 SDK adapters (3 CLI + 12 SDK = 15 total integrations):**

| Platform | Adapter class | Install extra |
|---|---|---|
| LangChain | `OAVCallbackHandler` | `openagentvisualizer[langchain]` |
| LangGraph | `OAVLangGraphTracer` | `openagentvisualizer[langchain]` |
| CrewAI | `OAVCrewObserver` | `openagentvisualizer[crewai]` |
| AutoGen | `OAVAutoGenLogger` | `openagentvisualizer[autogen]` |
| OpenAI Agents SDK | `OAVOpenAITracer` | `openagentvisualizer[openai]` |
| Anthropic SDK | `OAVAnthropicTracer` | `openagentvisualizer[anthropic]` |
| Haystack | `OAVHaystackTracer` | `openagentvisualizer[haystack]` |
| LlamaIndex | `OAVLlamaIndexCallback` | `openagentvisualizer[llamaindex]` |
| Semantic Kernel | `OAVSKPlugin` | `openagentvisualizer[semantic-kernel]` |
| DSPy | `OAVDSPyLogger` | `openagentvisualizer[dspy]` |
| Pydantic AI | `OAVPydanticAITracer` | `openagentvisualizer[pydantic-ai]` |
| Smolagents (HuggingFace) | `OAVSmolagentsCallback` | `openagentvisualizer[smolagents]` |

```bash
pip install openagentvisualizer[all]   # installs all 12 SDK adapters
```

**Coming in V2 (post-MVP):** Google ADK (`OAVGoogleADKTracer`) and Agno/PhiData (`OAVAgnoTracer`).

Each adapter captures: agent/chain name, input/output tokens, latency, tool calls, errors, cost estimate.

### 4.8 Native CLI Plugins

Beyond hooks and MCP tools, OAV ships **installable plugins** for Claude Code and Codex CLI. The distinction:

| Layer | What it does | Who uses it |
|---|---|---|
| MCP Server | AI reasoning tools — Claude calls `oav_get_alerts` during a session | Claude (the model) |
| Hooks | Telemetry — captures every tool call and sends to OAV automatically | The system, transparent to user |
| **Plugin** | User-facing slash commands + skills inside the CLI — developer types `/oav` | The developer using the CLI |

#### 4.8.1 Claude Code Plugin

**Install:**
```bash
oav install claude-code-plugin
# writes to ~/.claude/plugins/oav/
```

**Plugin structure** (`~/.claude/plugins/oav/`):
```
plugin.yaml                  Plugin manifest — name, version, description, permissions
skills/
  oav-status.md              Skill: show workspace status in current session
  oav-agents.md              Skill: list + filter agents, open detail in browser
  oav-alerts.md              Skill: triage active alerts, bulk resolve
  oav-cost.md                Skill: cost breakdown for current session's agent
  oav-replay.md              Skill: open session replay for last N minutes
  oav-debug.md               Skill: fetch traces + loop detection for an agent
hooks/
  session-start.sh           On session start: register session in OAV, activate workspace
  session-stop.sh            On session end: close span, compute final cost, push summary
statusline/
  status.sh                  OAV status line segment: agent count + active alerts badge
```

**`plugin.yaml`:**
```yaml
name: oav
display_name: OpenAgentVisualizer
version: 1.0.0
description: Observe, debug, and optimize your AI agents directly from Claude Code
author: OpenAgentVisualizer
permissions:
  - network: [localhost]          # OAV backend API
  - env: [OAV_API_KEY, OAV_ENDPOINT]
  - read: [~/.oav/config.json]
skills:
  - skills/oav-status.md
  - skills/oav-agents.md
  - skills/oav-alerts.md
  - skills/oav-cost.md
  - skills/oav-replay.md
  - skills/oav-debug.md
hooks:
  SessionStart: hooks/session-start.sh
  Stop: hooks/session-stop.sh
statusline: statusline/status.sh
```

**Slash commands exposed** (invoked by the developer typing `/oav-*` in Claude Code):

| Command | Skill invoked | What it does |
|---|---|---|
| `/oav-status` | `oav-status` | Prints workspace health: agent count, active alerts, cost today, top agent by XP |
| `/oav-agents` | `oav-agents` | Lists all agents with status badges, opens selected agent in OAV browser tab |
| `/oav-alerts` | `oav-alerts` | Shows active alerts by severity, offers inline resolve with confirmation |
| `/oav-cost` | `oav-cost` | Prints cost breakdown for the current Claude Code session mapped to an OAV agent |
| `/oav-replay` | `oav-replay` | Opens session replay in browser for the last session or a named session ID |
| `/oav-debug <agent_id>` | `oav-debug` | Fetches traces + loop detector output for an agent, presents as structured report |

**Status line segment** (`statusline/status.sh`):
```
⬡ OAV  3 agents  ⚠ 1 alert  $0.04
```
Shows in Claude Code's bottom status bar. Refreshes every 30 seconds. Red tint on active Critical alerts.

**Plugin distribution:**
- Published to npm as `@openagentvisualizer/claude-code-plugin`
- `oav install claude-code-plugin` downloads via npm, symlinks to `~/.claude/plugins/oav/`
- Auto-updates via `oav update`

---

#### 4.8.2 Codex CLI Plugin

**Install:**
```bash
oav install codex-plugin
# writes to ~/.codex/plugins/oav/
```

**Plugin structure** (`~/.codex/plugins/oav/`):
```
plugin.json                  Codex plugin manifest
commands/
  oav-status.js              Command: /oav status
  oav-agents.js              Command: /oav agents
  oav-alerts.js              Command: /oav alerts
  oav-cost.js                Command: /oav cost
  oav-watch.js               Command: /oav watch  (live tail of agent events)
middleware/
  telemetry.js               Middleware: wraps all Codex tool calls with OAV spans
```

**`plugin.json`:**
```json
{
  "name": "oav",
  "displayName": "OpenAgentVisualizer",
  "version": "1.0.0",
  "description": "Observe your Codex sessions as OAV agent traces in real time",
  "entrypoint": "middleware/telemetry.js",
  "commands": {
    "oav": {
      "description": "OpenAgentVisualizer commands",
      "subcommands": {
        "status":  "commands/oav-status.js",
        "agents":  "commands/oav-agents.js",
        "alerts":  "commands/oav-alerts.js",
        "cost":    "commands/oav-cost.js",
        "watch":   "commands/oav-watch.js"
      }
    }
  },
  "env": ["OAV_API_KEY", "OAV_ENDPOINT"]
}
```

**Commands exposed** (typed as `/oav <subcommand>` inside Codex CLI):

| Command | What it does |
|---|---|
| `/oav status` | Workspace health summary: agents, alerts, cost today |
| `/oav agents` | Agent list with status; select agent to open detail in browser |
| `/oav alerts` | Active alerts sorted by severity; `resolve <id>` inline action |
| `/oav cost` | Token + cost breakdown for current Codex session |
| `/oav watch` | Live-tail of agent events in terminal (Server-Sent Events stream from OAV backend) |

**Middleware** (`telemetry.js`):
- Wraps every Codex tool execution in an OAV OTLP span
- Sends `PreToolUse` and `PostToolUse` events to `OAV_ENDPOINT/v1/traces`
- Zero user configuration beyond `OAV_API_KEY` — activated on plugin install

**Plugin distribution:**
- Published to npm as `@openagentvisualizer/codex-plugin`
- `oav install codex-plugin` downloads, runs `npm install`, registers in `~/.codex/plugins.json`

---

#### 4.8.3 Plugin Manager in Settings UI

The Settings → Integrations tab gains a **Plugins sub-section** above the adapter grid:

```
┌─────────────────────────────────────────────────────────┐
│ CLI Plugins                                             │
│                                                         │
│ ┌───────────────────┐  ┌───────────────────┐           │
│ │ Claude Code Plugin │  │  Codex Plugin      │           │
│ │ v1.0.0  ● Active  │  │  v1.0.0  ○ Not    │           │
│ │                   │  │    installed       │           │
│ │ /oav-status       │  │                   │           │
│ │ /oav-agents       │  │  oav install       │           │
│ │ /oav-alerts +3    │  │  codex-plugin      │           │
│ │                   │  │  [Copy]  [Install] │           │
│ │ [Update] [Remove] │  │                   │           │
│ └───────────────────┘  └───────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

New component: `PluginCard` — shows plugin version, active commands list, update/remove actions.

---

**Updated integration counts:** 3 CLI adapters + 2 CLI plugins + 12 SDK adapters = 17 total integrations. Settings → Integrations tab shows 17 cards (15 adapter cards + 2 plugin cards in dedicated Plugins section).

---

### 4.7 Settings → Integrations Tab UI

Grid of `IntegrationCard` components, one per integration (15 adapter cards: 3 CLI + 12 SDK). Each card shows:
- Integration name + icon
- `IntegrationStatusBadge` (Connected / Not configured / Error)
- Last event timestamp ("Last seen 2m ago" or "Never")
- 24h event count
- `CLICommandBlock` with install command (one-click copy)
- "Test connection" button → fires ping event → success/error toast

---

## 5. Sub-project C: 3D/UE5 Viewer

### 5.1 Strategy

Two layers, both additive:
1. **Three.js 2.5D** — replaces flat PixiJS grid for all users, ships in the React bundle
2. **UE5 Pixel Streaming** — Pro/Enterprise add-on, streamed via WebRTC from UE5 process

Virtual World page gets a 3-way mode toggle: `[2D PixiJS]` `[2.5D Three.js]` `[3D UE5]`

### 5.2 Three.js 2.5D Layer (All Tiers)

**Renderer:** Three.js r170+, WebGL2, `OrthographicCamera` at 45° isometric angle
**Scene contents:**
- Low-poly office floor, desk meshes per agent (instanced geometry)
- `DirectionalLight` intensity driven by `agent.tokens_per_second` (brighter = busier)
- `PointLight` at error agents (red, animated radius)
- Agent desk labels as `CSS2DRenderer` overlays (crisp text, no texture baking)
- Zone separator lines as `LineSegments`

**Interactivity:**
- `OrbitControls` (pan + zoom only, no free rotation — maintains isometric feel)
- `Raycaster` on click → selects agent, opens `AgentDetailPanel`
- Desk glow ring driven by agent status (Three.js `MeshStandardMaterial` emissive)

**Coordinate system:** The existing PixiJS canvas uses a 2:1 diamond isometric grid (`isoMath.ts`: tile 64px wide × 32px tall). Three.js uses a true 45° `OrthographicCamera`. Agent positions in `agentStore` (`AgentPosition.x`, `AgentPosition.y`) are in PixiJS grid coordinates. A `isoToThree(x, y)` adapter function must be written in `ThreeRenderer.ts` to convert: `threeX = (x - y) * 32; threeZ = (x + y) * 16;`. This adapter is the single point of coordinate translation — no other Three.js code references PixiJS coordinates directly.

**WebGL context management:** The browser limits active WebGL contexts (typically 8–16). PixiJS and Three.js each create their own context. The mode toggle must **mount/unmount** (not show/hide) the inactive renderer:
- Switching from 2D to 2.5D: `WorldCanvas` (PixiJS) is unmounted, `ThreeCanvas` is mounted. PixiJS `Application.destroy(true)` is called in cleanup.
- Switching back to 2D: `ThreeCanvas` unmounts (Three.js `WebGLRenderer.dispose()` called), `WorldCanvas` mounts fresh.
- `[3D UE5]` mode: both PixiJS and Three.js are unmounted; `PixelStreamingEmbed` iframe is mounted.
- `VirtualWorldPage` owns the mode state (`useState`), not the canvas components themselves.

**Data integration:** Same `agentStore` Zustand store as PixiJS canvas — Three.js scene subscribes to store changes and updates mesh positions/materials reactively via the `isoToThree` coordinate adapter.

**Files:**
```
src/frontend/src/canvas/three/
├── ThreeCanvas.tsx          React wrapper, canvas mount/unmount
├── ThreeRenderer.ts         Scene setup, render loop
├── AgentDesk.ts             Per-agent desk mesh + light + label
├── OfficeFloor.ts           Floor grid, zone separators
├── ThreeMiniMap.ts          Top-down thumbnail for mini-map
├── ThreeParticles.ts        Particle events (XP gain, level-up, error, handoff) via Three.js Points
└── __tests__/
    └── ThreeRenderer.test.ts
```

### 5.3 UE5 Pixel Streaming Layer (Pro/Enterprise)

**Delivery:** UE5 packaged build → runs locally or on cloud GPU instance → Pixel Streaming signalling server → WebRTC stream → React `<PixelStreamingEmbed>` component

**Architecture:**
```
React app
  └── <PixelStreamingEmbed>
        ├── WebRTC peer connection (Embedded Pixel Streaming JS lib)
        ├── Input forwarding (mouse/keyboard → UE5)
        └── Data channel (JSON agent state → UE5 Blueprint)

Signalling Server (Node.js, port 8888)
  └── Matches browser peer ↔ UE5 peer

UE5 Process
  ├── Pixel Streaming plugin
  ├── OAV Data Receiver (Blueprint + C++)
  │     └── WebSocket → OAV FastAPI /api/agents
  └── Scene
        ├── Agent desk meshes (Lumen lit)
        ├── Niagara particle arcs (agent handoffs)
        ├── MetaSound ambient (activity sonification)
        └── UMG monitor widgets (live metric charts)
```

**UE5 data-driven features:**

| OAV Event | UE5 Response |
|---|---|
| Agent `working` | Desk `PointLight` intensity +50%, keyboard MetaSound begins |
| Agent `error` | Red `PointLight` pulse, Niagara error ring, alarm MetaSound |
| Agent handoff | Niagara particle arc flies between two desk positions |
| Level-up | Niagara confetti burst (50k particles), celebration MetaSound |
| Token rate high | Lumen GI brightens agent zone |
| Agent idle | Desk light dims, idle animation plays |

**React component:**
```
src/frontend/src/components/canvas/
├── PixelStreamingEmbed.tsx     WebRTC wrapper, quality controls, fullscreen
├── PixelStreamingBridge.ts     JSON state → UE5 data channel encoder
└── __tests__/
    └── PixelStreamingEmbed.test.tsx
```

**Signalling server:**
```
src/pixel-streaming/
├── signalling-server/
│   ├── server.js              Epic's reference signalling server, OAV-configured
│   └── Dockerfile
└── docker-compose.override.yml  Adds signalling-server service (Pro/Enterprise only)
```

### 5.4 Tier Gating

```tsx
// In VirtualWorldPage.tsx
const { tier } = useWorkspace();
const canUse3D = tier === 'pro' || tier === 'enterprise';

<ModeToggle modes={[
  { id: '2d', label: '2D', always: true },
  { id: '2.5d', label: '2.5D', always: true },
  { id: '3d', label: '3D', locked: !canUse3D, lockedLabel: 'Pro' },
]} />
```

---

## 6. File Structure

### New/Modified Files — Sub-project A

```
src/frontend/
├── .storybook/                        NEW — Storybook config (main.ts, preview.ts)
│   ├── main.ts                        Vite builder, addons: a11y, interactions
│   └── preview.ts                     Import tokens.css, set dark background
└── src/
├── styles/
│   ├── tokens.css                     NEW — all CSS custom properties, both modes
│   │                                  Imported in: src/index.css (first line)
│   └── animations.css                 NEW — GSAP + CSS @keyframes utilities
│                                      Imported in: src/index.css (second line)
├── types/
│   ├── integration.ts                 NEW — IntegrationStatus, IntegrationConfig
│   ├── preferences.ts                 NEW — WorkspacePreferences, UserPreferences
│   ├── onboarding.ts                  NEW — OnboardingState, OnboardingStep
│   ├── notification.ts                NEW — NotificationItem, NotificationSeverity
│   └── command-palette.ts             NEW — CommandPaletteItem, CommandPaletteGroup
├── stores/
│   ├── modeStore.ts                   NEW — Professional/Gamified mode state + localStorage sync
│   ├── onboardingStore.ts             NEW — wizard completion state, sampleDataActive flag
│   └── notificationStore.ts          NEW — notification queue, mark-read actions
├── hooks/
│   ├── useWorkspace.ts                NEW — workspace metadata + tier, used for 3D gating
│   └── useMode.ts                     NEW — reads/writes modeStore, applies data-mode attr to <html>
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx               MODIFY — collapsible sidebar, mode toggle
│   │   ├── SectionHeader.tsx          NEW
│   │   ├── WorkspaceSwitcher.tsx      NEW
│   │   ├── ModeToggle.tsx             NEW
│   │   └── NotificationCenter.tsx    NEW
│   ├── common/
│   │   ├── GlassCard.tsx              NEW
│   │   ├── HUDPanel.tsx               NEW
│   │   ├── BentoGrid.tsx              NEW
│   │   ├── CommandPalette.tsx         NEW
│   │   ├── AnimatedCounter.tsx        NEW
│   │   └── SparklineChart.tsx         NEW
│   ├── agents/
│   │   ├── AgentAvatarRive.tsx        MODIFY — full Rive integration
│   │   ├── AgentCard.tsx              MODIFY — mode-aware design
│   │   └── AgentDetailPanel.tsx       MODIFY — tabbed layout
│   ├── metrics/
│   │   ├── CostHeatmap.tsx            NEW
│   │   └── BentoMetricCard.tsx        NEW
│   ├── gamification/
│   │   ├── XPProgressBar.tsx          MODIFY
│   │   ├── LeaderboardTable.tsx       MODIFY
│   │   ├── LevelUpToast.tsx           MODIFY
│   │   └── BadgeGrid.tsx              NEW
│   ├── alerts/
│   │   ├── AlertCard.tsx              MODIFY
│   │   └── AlertTimeline.tsx          NEW
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx       NEW
│   │   └── SampleDataBanner.tsx       NEW
│   └── integrations/
│       ├── IntegrationCard.tsx        NEW
│       ├── IntegrationStatusBadge.tsx NEW
│       ├── CLICommandBlock.tsx        NEW
│       └── PluginCard.tsx             NEW
├── pages/
│   ├── LoginPage.tsx                  MODIFY
│   ├── VirtualWorldPage.tsx           MODIFY — owns 2D/2.5D/3D mode state
│   ├── DashboardPage.tsx              MODIFY
│   ├── AlertsPage.tsx                 MODIFY
│   ├── ReplayPage.tsx                 MODIFY
│   └── SettingsPage.tsx               MODIFY
├── routes.tsx                         MODIFY — add mode param to VirtualWorld route if needed
├── canvas/
│   ├── WorldCanvas.tsx                MODIFY — Three.js mode support, mount/unmount strategy
│   └── three/                         NEW directory (§5.2)
└── public/
    └── avatars/                       NEW — .riv files per avatar_id
```

**Backend file added for integrations API:**
```
src/backend/app/
├── routers/integrations.py            NEW — GET /api/integrations, POST /api/integrations/test
└── routers/workspaces.py              NEW — GET /api/workspaces/me (used by useWorkspace hook)
```

### New/Modified Files — Sub-project B

```
src/
├── integrations/                      NEW directory (§4.1 full tree)
│   ├── claude-code/
│   │   ├── mcp-server/                MCP server (Node.js/TS, §4.3)
│   │   ├── hooks/                     PreToolUse/PostToolUse/Stop handlers
│   │   └── plugin/                    Claude Code plugin package (§4.8.1)
│   │       ├── plugin.yaml
│   │       ├── skills/                oav-status.md, oav-agents.md, oav-alerts.md,
│   │       │                          oav-cost.md, oav-replay.md, oav-debug.md
│   │       ├── hooks/                 session-start.sh, session-stop.sh
│   │       └── statusline/            status.sh
│   ├── codex/
│   │   ├── adapter/                   OTLP telemetry adapter
│   │   └── plugin/                    Codex CLI plugin package (§4.8.2)
│   │       ├── plugin.json
│   │       ├── commands/              oav-status.js, oav-agents.js, oav-alerts.js,
│   │       │                          oav-cost.js, oav-watch.js
│   │       └── middleware/            telemetry.js
│   ├── gemini-cli/adapter/
│   └── open-source/                   12 SDK adapter directories
├── cli/
│   ├── oav                            NEW — Python Click CLI entry point
│   ├── commands/
│   │   ├── install.py                 handles: claude-code, claude-code-plugin,
│   │   │                              codex, codex-plugin, gemini, langchain, ...
│   │   ├── update.py                  oav update <plugin>
│   │   ├── status.py
│   │   ├── test.py
│   │   └── config.py
│   └── hooks/
│       └── oav_hook.py               NEW — Claude Code hook handler
├── frontend/src/components/integrations/
│   ├── IntegrationCard.tsx            NEW
│   ├── IntegrationStatusBadge.tsx     NEW
│   ├── CLICommandBlock.tsx            NEW
│   └── PluginCard.tsx                 NEW
└── backend/app/routers/
    └── integrations.py               NEW — /api/integrations/* + /api/plugins/* endpoints
```

### New/Modified Files — Sub-project C

```
src/
├── frontend/src/components/canvas/   NEW files (§5.3)
├── pixel-streaming/                  NEW directory (§5.3)
└── frontend/src/canvas/three/        NEW directory (§5.2)
    ├── ThreeCanvas.tsx
    ├── ThreeRenderer.ts
    ├── AgentDesk.ts
    ├── OfficeFloor.ts
    ├── ThreeMiniMap.ts
    ├── ThreeParticles.ts
    └── __tests__/ThreeRenderer.test.ts
```

---

## 7. Testing Strategy

### Sub-project A
- **Unit tests:** All new/modified components have `*.test.tsx` (Vitest + Testing Library)
- **Animation tests:** GSAP timeline tests with `@gsap/test-utils`; Rive tests with mock canvas
- **Visual regression:** Playwright screenshot tests for each page in both modes
- **Accessibility:** `axe-core` via `@axe-core/react` in dev mode; all interactive elements keyboard-navigable

### Sub-project B
- **Unit tests:** Each adapter has `test_<adapter>.py` using pytest + mock OTLP server
- **Integration tests:** `oav install` CLI commands tested against temp config files
- **MCP server tests:** JSON-RPC tool call tests using MCP test client
- **E2E:** `oav test <integration>` fires real event to running OAV backend, verifies it appears in canvas

### Sub-project C
- **Three.js:** Render tests with `@react-three/test-renderer`
- **Pixel Streaming:** Unit tests for `PixelStreamingBridge` JSON encoding; WebRTC mocked in `PixelStreamingEmbed` tests
- **UE5:** Manual QA checklist (automated UE5 testing is out of scope for MVP)

---

## 8. Acceptance Criteria

### Sub-project A
- [ ] Mode toggle switches Professional ↔ Gamified with no page reload; `data-mode` attribute on `<html>` updates immediately
- [ ] All 6 standalone routed pages render correctly in both modes at 1280px, 1440px, 1920px (Playwright screenshot test per page per mode). Pages: Login, Virtual World, Dashboard, Alerts, Session Replay, Settings. Cmd+K and Onboarding are overlays tested separately.
- [ ] Cmd+K overlay appears within 2 animation frames of keypress (≤33ms); first result renders within 200ms of first keystroke (measured via `performance.now()` in Playwright)
- [ ] Rive avatar animations play for all 5 `AgentStatus` states (`idle`, `working`, `thinking`, `communicating`, `error`) on the canvas; `triggerCelebrate` input fires and completes without errors when XP threshold is crossed
- [ ] GSAP page transitions play on every route change with no layout shift (CLS = 0 in Playwright)
- [ ] Onboarding wizard: all 5 steps can advance with no blocking async operation taking >3 seconds each; Sample Data Mode populates 5 agents in `agentStore` by end of step 5; agents appear as animated sprites on canvas within 2 seconds of step 5 completion
- [ ] `SampleDataBanner` renders when `agentStore.agents` is empty; disappears when first real agent is registered; reappears on empty-workspace reload
- [ ] Level-up particle burst plays in Gamified mode within 500ms of XP threshold crossing event on WebSocket; Professional mode shows no particles on same event
- [ ] All new/modified components pass `axe-core` checks at page-level Playwright runs (scope: all 6 standalone routed pages in both modes: Login, Virtual World, Dashboard, Alerts, Session Replay, Settings)
- [ ] Lighthouse performance score ≥ 85 on Dashboard page (measured in Playwright with `--no-sandbox`)
- [ ] Session Replay scrubber renders timeline of all events for a given session; play/pause controls start/stop event progression; playback speed 0.5x/1x/2x/4x changes event timing proportionally; diff mode highlights events absent from comparison session

### Sub-project B
- [ ] `oav install claude-code` completes in <5 seconds, MCP server appears in Claude Code
- [ ] All 15 MCP tools return correct data from live OAV backend
- [ ] Claude Code hook events appear as agent events on OAV canvas within 2 seconds
- [ ] `oav install codex` and `oav install gemini` patch correct config files
- [ ] LangChain `OAVCallbackHandler` sends trace spans visible in OAV within 2 seconds
- [ ] All 12 open source SDK adapters have passing unit tests
- [ ] Settings → Integrations tab shows correct connection status for each integration
- [ ] `oav test <integration>` returns success for any configured integration
- [ ] `oav install claude-code-plugin` writes valid `plugin.yaml` + all skill/hook/statusline files to `~/.claude/plugins/oav/`; plugin appears in Claude Code without restart
- [ ] All 6 Claude Code plugin slash commands (`/oav-status`, `/oav-agents`, `/oav-alerts`, `/oav-cost`, `/oav-replay`, `/oav-debug`) return valid responses against a live OAV backend
- [ ] Claude Code status line segment shows agent count + alert badge and updates within 30 seconds
- [ ] `oav install codex-plugin` writes valid `plugin.json` + all command/middleware files to `~/.codex/plugins/oav/`; `/oav status` is available in Codex CLI immediately after install
- [ ] All 5 Codex plugin commands (`/oav status`, `/oav agents`, `/oav alerts`, `/oav cost`, `/oav watch`) return valid responses against a live OAV backend
- [ ] Codex plugin telemetry middleware sends OTLP spans for every tool call; spans appear in OAV canvas within 2 seconds
- [ ] Settings → Integrations Plugins section shows `PluginCard` for Claude Code and Codex with correct installed/not-installed state
- [ ] `PluginCard` update action calls `oav update <plugin>` and reflects new version within 5 seconds

### Sub-project C
- [ ] Three.js 2.5D mode renders all agents as desk meshes at ≥60fps on a reference machine (GTX 1070 / M1, Chrome, 100 agents); CI headless baseline is ≥30fps acceptable
- [ ] Switching 2D ↔ 2.5D ↔ 3D mode completes in <500ms; agent positions, selection state, and active alert count are identical before and after the switch (verified by comparing `agentStore` snapshots); inactive renderer is fully unmounted (WebGL context released) on switch
- [ ] `isoToThree` coordinate adapter correctly maps PixiJS grid positions to Three.js world positions (verified by unit test: grid (0,0)→Three (0,0,0), grid (1,0)→Three (32,0,16), grid (0,1)→Three (-32,0,16))
- [ ] `ThreeMiniMap` renders a top-down thumbnail of the full office; clicking a minimap region pans the main `OrthographicCamera` to that area within 300ms
- [ ] Agent desk `PointLight` intensity responds to `tokens_per_second` changes from `agentStore` within 1 render frame (≤16ms)
- [ ] `CSS2DRenderer` overlay for desk labels renders above Three.js canvas without z-index conflict with `AgentDetailPanel` slide-in
- [ ] `PixelStreamingEmbed` connects to local signalling server and renders UE5 stream within 5 seconds of mounting
- [ ] UE5 scene responds to level-up event with Niagara confetti burst within 500ms of receiving JSON on data channel
- [ ] Pro/Enterprise tier gate: `[3D]` button renders with lock icon and "Pro" badge for Free/Team tier; clicking opens upgrade prompt, does not mount `PixelStreamingEmbed`
