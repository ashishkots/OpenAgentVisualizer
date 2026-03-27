# OpenAgentVisualizer Sprint 3 -- UX Wireframes & Interaction Design

**Product:** OpenAgentVisualizer -- Gamified Virtual World for AI Agent Management
**Sprint:** 3 (3D Viewer, Cross-Product Integrations, CLI Plugin, DevOps)
**Author:** UX Designer (Stage 1.2)
**Date:** 2026-03-27
**Status:** COMPLETE
**Inputs:** Sprint 3 PRD (2026-03-27-sprint3-prd.md), PM Handoff (sprint3-stage-1.1-pm-to-ux-tl.yml), Sprint 2 UX Wireframes, Sprint 2 UI Design System

---

## Table of Contents

1. [Design System Token Extensions](#1-design-system-token-extensions)
2. [Updated Information Architecture](#2-updated-information-architecture)
3. [Navigation Updates](#3-navigation-updates)
4. [Page Wireframes](#4-page-wireframes)
5. [Interaction Flows](#5-interaction-flows)
6. [Component Hierarchy](#6-component-hierarchy)
7. [State Management Updates](#7-state-management-updates)
8. [CLI Output Patterns](#8-cli-output-patterns)
9. [Responsive Behavior](#9-responsive-behavior)
10. [Accessibility Specification](#10-accessibility-specification)
11. [E2E Test User Journeys](#11-e2e-test-user-journeys)
12. [Component Naming Conventions](#12-component-naming-conventions)

---

## 1. Design System Token Extensions

Sprint 3 extends the existing Sprint 2 token set. All Sprint 2 tokens remain unchanged. New tokens are additive.

### 1.1 New Color Tokens

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `oav-trace` | `#f472b6` | `text-oav-trace` / `bg-oav-trace` | Trace waterfall span bars, trace-related accents |
| `oav-mesh` | `#34d399` | `text-oav-mesh` / `bg-oav-mesh` | Mesh topology edges, mesh node highlights |
| `oav-knowledge` | `#60a5fa` | `text-oav-knowledge` / `bg-oav-knowledge` | Knowledge graph concept nodes, entity highlights |
| `oav-shield` | `#fb923c` | `text-oav-shield` / `bg-oav-shield` | Security grade badges, compliance score accent |
| `oav-3d` | `#818cf8` | `text-oav-3d` / `bg-oav-3d` | 3D viewer accent, UE5 status indicators |
| `oav-surface-elevated` | `#232d3f` | `bg-oav-surface-elevated` | Slide-in detail panels, elevated overlays over canvas |

### 1.2 Contrast Verification for New Tokens

| Foreground | Background | Ratio | Body Text | Graphical |
|-----------|-----------|-------|-----------|-----------|
| `#f472b6` on `#1e2433` | 5.2:1 | Pass | Pass |
| `#34d399` on `#1e2433` | 5.8:1 | Pass | Pass |
| `#60a5fa` on `#1e2433` | 4.8:1 | Pass (large) | Pass |
| `#fb923c` on `#1e2433` | 5.4:1 | Pass | Pass |
| `#818cf8` on `#1e2433` | 4.5:1 | Pass (large/bold) | Pass |
| `#e2e8f0` on `#232d3f` | 8.7:1 | Pass | Pass |

**Rule:** `oav-knowledge` and `oav-3d` on `oav-surface` pass for large/bold text and graphical elements. For body text on surface cards, use `font-semibold` or pair with `text-oav-text` and use the color token for decorative elements only.

### 1.3 Entity Type Shape-Color System (Knowledge Graph)

| Entity Type | Shape | Fill Color | Border Color | Icon |
|-------------|-------|-----------|-------------|------|
| Concept | Circle | `bg-oav-knowledge/20` | `border-oav-knowledge` | Lightbulb |
| Fact | Rounded Rectangle | `bg-oav-success/20` | `border-oav-success` | CheckCircle |
| Agent Memory | Diamond | `bg-oav-purple/20` | `border-oav-purple` | Brain |
| Embedding | Hexagon | `bg-oav-shield/20` | `border-oav-shield` | Hexagon |

### 1.4 Security Grade Color System

| Grade | Color Token | Badge Class | Meaning |
|-------|-----------|-------------|---------|
| A | `oav-success` | `bg-oav-success/20 text-oav-success` | Excellent compliance (90-100) |
| B | `oav-knowledge` | `bg-oav-knowledge/20 text-oav-knowledge` | Good compliance (80-89) |
| C | `oav-warning` | `bg-oav-warning/20 text-oav-warning` | Adequate compliance (70-79) |
| D | `oav-shield` | `bg-oav-shield/20 text-oav-shield` | Poor compliance (60-69) |
| F | `oav-error` | `bg-oav-error/20 text-oav-error` | Failing compliance (0-59) |

### 1.5 Integration Status Indicator Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Connected | `oav-success` | Circle filled | Integration healthy |
| Degraded | `oav-warning` | Circle half | Circuit breaker half-open |
| Disconnected | `oav-error` | Circle outline | Integration unreachable |
| Not Configured | `oav-muted` | Circle dashed | No config saved |

---

## 2. Updated Information Architecture

### 2.1 Site Map (Sprint 3 additions highlighted)

```
[Login Page] (/login)
    |
    v
[App Shell] (authenticated)
    |
    +-- [Dashboard] (/dashboard) -- LANDING PAGE (existing)
    |
    +-- [Agent Canvas 2D] (/world) -- EXISTING (Sprint 2)
    |
    +-- [3D World View] (/world3d) -- NEW (OAV-301)
    |       +-- WebRTC Pixel Streaming embed
    |       +-- 2D/3D Toggle (switches to /world)
    |       +-- Camera Controls overlay (WASD info, mouse info)
    |       +-- Agent Selection (click in 3D, shows sidebar)
    |       +-- Connection Status (WebRTC state)
    |       +-- Loading / Fallback states
    |
    +-- [Topology Graph] (/topology) -- EXISTING (Sprint 2)
    |
    +-- Integrations Hub -- NEW
    |   |
    |   +-- [Trace Explorer] (/traces) -- NEW (OAV-302)
    |   |       +-- Search bar (time range, agent, service, duration, error)
    |   |       +-- Trace List (sortable, paginated)
    |   |       +-- Trace Waterfall Diagram (expandable)
    |   |       +-- Span Detail Panel (slide-in right)
    |   |
    |   +-- [Mesh Topology] (/mesh) -- NEW (OAV-303)
    |   |       +-- ReactFlow mesh graph (enhanced from existing topology)
    |   |       +-- Node Detail Panel (agent info + mesh role)
    |   |       +-- Edge Stats Tooltip (message count, latency, protocol)
    |   |       +-- Live Update Indicators (pulse on change)
    |   |       +-- Mesh Stats Summary bar
    |   |
    |   +-- [Knowledge Graph] (/knowledge) -- NEW (OAV-304)
    |   |       +-- Force-directed ReactFlow graph
    |   |       +-- Search bar (entity name, debounced 300ms)
    |   |       +-- Entity Detail Panel (slide-in right)
    |   |       +-- Entity Type Legend
    |   |       +-- Load More control (pagination for 200+ entities)
    |   |
    |   +-- [Security Dashboard] (/security) -- NEW (OAV-305)
    |           +-- Compliance Score Card (0-100, gauge)
    |           +-- Summary Stats (PII count, violations, threats)
    |           +-- Agent Security Table (grade per agent)
    |           +-- Violations Timeline (Recharts line chart, 24h)
    |           +-- Agent Security Detail Panel (slide-in)
    |
    +-- [Agent Detail] (/agents/:agentId) -- EXISTING, ENHANCED
    |       +-- New Tab: [Traces] -- Shows agent-specific trace list (OAV-302)
    |
    +-- [Leaderboard] (/leaderboard) -- EXISTING
    +-- [Analytics] (/analytics) -- EXISTING
    +-- [Alerts] (/alerts) -- EXISTING
    +-- [Sessions] (/sessions) -- EXISTING
    |
    +-- [Settings] (/settings) -- EXISTING, ENHANCED
            +-- [Workspace] tab -- EXISTING
            +-- [API Keys] tab -- EXISTING
            +-- [Integrations] tab -- NEW (Sprint 3)
            |       +-- Integration Config Card (x4: OpenTrace, OpenMesh, OpenMind, OpenShield)
            |       +-- Test Connection button per card
            |       +-- Status indicator per card
            |       +-- XP Decay toggle (workspace-level)
            +-- [Appearance] tab -- DEFERRED
```

### 2.2 New URL Routes

| Page | URL | Params | Notes |
|------|-----|--------|-------|
| 3D World View | `/world3d` | -- | Desktop only (auto-redirect to /world on mobile) |
| Trace Explorer | `/traces` | `?agent=&service=&min_duration=&error=&start=&end=` | Query params for search |
| Mesh Topology | `/mesh` | -- | -- |
| Knowledge Graph | `/knowledge` | `?search=` | Query param for search |
| Security Dashboard | `/security` | -- | -- |
| Settings (Integrations) | `/settings?tab=integrations` | `tab` query param | Tab within existing page |

### 2.3 Navigation Priority (updated sidebar order)

Sprint 3 adds five new entries. To prevent sidebar overload, integrations are grouped under a collapsible "Integrations" section.

1. Dashboard (LayoutDashboard icon) -- existing
2. World 2D (Globe icon) -- existing
3. World 3D (Box icon) -- new, desktop only indicator
4. Topology (Network icon) -- existing
5. **Integrations** (Puzzle icon) -- NEW, collapsible group
   - Traces (Activity icon)
   - Mesh (Share2 icon)
   - Knowledge (BookOpen icon)
   - Security (Shield icon)
6. Leaderboard (Trophy icon) -- existing
7. Analytics (BarChart2 icon) -- existing
8. Alerts (Bell icon) -- existing
9. Sessions (Play icon) -- existing
10. Settings (Settings icon) -- existing, bottom of sidebar

---

## 3. Navigation Updates

### 3.1 Sidebar Extension

The existing `NAV_ITEMS` array in AppShell gains a grouped "Integrations" section. When the sidebar is collapsed (64px), the integrations group shows a single Puzzle icon. Hovering reveals a flyout menu with sub-items. When expanded (224px), the group shows with an expand/collapse chevron.

**Collapsed sidebar -- Integrations flyout:**
```
+------+
| [=O] | <-- Puzzle icon for Integrations
+------+
         +-- Flyout (on hover/focus) --------+
         | [Activity] Traces                  |
         | [Share2]   Mesh                    |
         | [BookOpen] Knowledge               |
         | [Shield]   Security                |
         +------------------------------------+
```

**Expanded sidebar -- Integrations group:**
```
+-- Integrations [v] --+
|   Traces              |
|   Mesh                |
|   Knowledge           |
|   Security            |
+-----------------------+
```

The group is collapsible. Default state: expanded if any integration page is active, collapsed otherwise.

### 3.2 Desktop: 2D/3D Toggle in Canvas Pages

Both `/world` and `/world3d` pages show a persistent toggle button in the top-right corner:

```
+-- View Mode Toggle --+
| [2D] [3D]            |
+-----------------------+
```

- Segmented button: same styling as leaderboard period selector
- Active segment: `bg-oav-accent text-white`
- Inactive segment: `bg-oav-surface text-oav-muted`
- Clicking switches routes without page reload (preserves selected agent)
- On `/world`: 2D is active
- On `/world3d`: 3D is active

### 3.3 Mobile Bottom Tab Bar

Mobile bottom tab bar remains 5 items. The "More" approach from Sprint 2 continues -- integrations pages are accessible via the "More" slide-up menu. No changes to the bottom tab bar items.

### 3.4 Settings Page Tab Navigation

The Settings page transitions from a single-section layout to a tabbed layout:

```
+-- Settings Tab Bar ---------------------+
| [Workspace] [API Keys] [Integrations]  |
+-----------------------------------------+
```

- Same segmented button styling as leaderboard period selector
- Tab state stored in URL query param: `?tab=workspace` (default), `?tab=keys`, `?tab=integrations`
- Content area switches based on active tab

---

## 4. Page Wireframes

### 4.1 3D World View Page (`/world3d`) -- OAV-301

```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT 3D STREAM                              |
|           |                                                       |
|           |  [Breadcrumb: Dashboard > 3D World]   [2D | *3D*]    |
|           |                                                       |
|           |  +-- WebRTC Video Stream (fills viewport) ---------+  |
|           |  |                                                 |  |
|           |  |    (Unreal Engine 5 Pixel Streaming video)      |  |
|           |  |                                                 |  |
|           |  |    3D agents rendered as avatars in              |  |
|           |  |    navigable virtual environment                 |  |
|           |  |                                                 |  |
|           |  |    Click agent -> sidebar opens                 |  |
|           |  |    WASD / mouse -> camera navigation             |  |
|           |  |                                                 |  |
|           |  +------+------------------------------------------+  |
|           |         |                                             |
|           |  [Camera: Free v]  [Agents: 24] [FPS: 30] [Ping: 45ms]
|           |                                                       |
|           |  +-- Agent Detail Sidebar (320px, when open) ------+  |
|           |  | [Close X]                                        |  |
|           |  | [Avatar] AgentName    [Status: Active]           |  |
|           |  | Level 5 - Expert     XP: 7,250 / 12,000         |  |
|           |  | [======================-------]                   |  |
|           |  | Tasks: 342  Cost: $45.20                         |  |
|           |  | [View Full Profile ->]                           |  |
|           |  | [Focus Camera on Agent]                          |  |
|           |  +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

**Loading State:**
```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT                                        |
|           |                                                       |
|           |  +-- Loading Overlay ---------------------------------+
|           |  |                                                    |
|           |  |   [Connecting to 3D server...]                    |
|           |  |   [Spinner]                                       |
|           |  |   [Progress bar: WebRTC negotiation]              |
|           |  |                                                    |
|           |  +----------------------------------------------------+
+------------------------------------------------------------------+
```

**Fallback State (UE5 unavailable):**
```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT                                        |
|           |                                                       |
|           |  +-- Info Banner (top, dismissible) ----------------+  |
|           |  | [i] 3D viewer unavailable -- showing 2D view.    |  |
|           |  |     [Configure 3D ->]              [Dismiss X]   |  |
|           |  +--------------------------------------------------+  |
|           |                                                       |
|           |  (2D PixiJS Canvas renders below -- same as /world)   |
|           |                                                       |
+------------------------------------------------------------------+
```

**Reconnecting State (mid-session drop):**
```
+------------------------------------------------------------------+
| [Sidebar] | VIEWPORT (last frame frozen)                          |
|           |                                                       |
|           |  +-- Reconnecting Overlay (center) -----------------+  |
|           |  |   [Spinner]                                       |  |
|           |  |   "Reconnecting to 3D server..."                  |  |
|           |  |   "Retrying in 8s... (attempt 3/5)"               |  |
|           |  |   [Switch to 2D view]                             |  |
|           |  +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Video container**: `position: relative; width: 100%; height: 100%`
  - WebRTC `<video>` element or `<iframe>` fills container
  - `object-fit: contain` to prevent distortion
  - Black letterbox if aspect ratio mismatches

- **Camera mode selector** (bottom-left overlay): Dropdown with options:
  - "Free Camera" -- standard FPS controls
  - "Overview" -- bird's-eye view of all agents
  - "Follow Agent" -- locks camera to selected agent

- **Status bar** (bottom overlay): `bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl p-2 text-xs text-oav-muted`
  - Camera mode indicator
  - Agent count
  - Stream FPS
  - Connection latency (ping)

- **Agent detail sidebar**: Reuses the same design pattern as the Sprint 2 Topology detail panel (320px, slides from right, `z-[45]`)

- **2D/3D toggle**: `absolute top-4 right-4 z-30`

#### Controls Guide (first visit only)

On first visit to `/world3d`, show a translucent overlay with control hints:
```
+-- Controls Guide (dismissible) ---------+
|  WASD      - Move camera                |
|  Mouse     - Look around                |
|  Scroll    - Zoom in/out                |
|  Click     - Select agent               |
|  Esc       - Deselect                   |
|                                         |
|  [Got it!]                              |
+------------------------------------------+
```
- Shown once, persisted via `localStorage.setItem('oav_3d_guide_shown', 'true')`
- Background: `bg-oav-bg/90 backdrop-blur-sm rounded-xl p-6 text-sm`

---

### 4.2 Trace Explorer Page (`/traces`) -- OAV-302

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | [Breadcrumb: Dashboard > Trace Explorer]               |
|           |                                                       |
|           | Trace Explorer                                        |
|           |                                                       |
|           | +-- Search Bar ------------------------------------+  |
|           | | [Time: Last 1h v] [Agent: All v] [Service: All v] |  |
|           | | [Min Duration: ___ms] [Errors Only: [ ]]          |  |
|           | | [Search]                                           |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Integration Status Bar -------------------------+  |
|           | | OpenTrace: [*] Connected  |  Last sync: 14:32      |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Trace List ------------------------------------+  |
|           | | Trace ID      | Root Service | Operation     | Dur |  |
|           | |---------------|-------------|---------------|------|  |
|           | | abc123...     | agent-svc   | process_task  | 142ms|  |
|           | |   [v Expand waterfall]                              |  |
|           | |                                                      |  |
|           | | +-- Waterfall Diagram (expanded) ----------------+ |  |
|           | | |  [agent-svc/process_task  ======          142ms] | |  |
|           | | |    [llm-svc/completion      ====          98ms] | |  |
|           | | |    [db-svc/query               ==         23ms] | |  |
|           | | |    [cache-svc/lookup        =             5ms]  | |  |
|           | | +------------------------------------------------+ |  |
|           | |                                                      |  |
|           | | def456...     | router-svc  | route_msg     | 87ms |  |
|           | | ghi789...     | agent-svc   | handle_event  | 234ms|  |
|           | |   [Error icon, red tint on row]                     |  |
|           | | ... (paginated, 20 per page)                        |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Span Detail Panel (right, 360px, when open) ---+  |
|           | | [Close X]                                         |  |
|           | | Span: llm-svc/completion                          |  |
|           | | Trace ID: abc123-def456-...                        |  |
|           | | Span ID: span_789...                               |  |
|           | | Parent: span_123...                                |  |
|           | | Duration: 98ms                                     |  |
|           | | Status: OK                                         |  |
|           | | Service: llm-svc                                   |  |
|           | |                                                    |  |
|           | | Attributes:                                        |  |
|           | |   model: gpt-4                                    |  |
|           | |   tokens: 1,240                                   |  |
|           | |   temperature: 0.7                                |  |
|           | |   ... (up to 10 custom attributes)                |  |
|           | |                                                    |  |
|           | | [View in OpenTrace ->]                             |  |
|           | +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Search bar**: `bg-oav-surface border border-oav-border rounded-xl p-4`
  - Time range: Segmented buttons (`Last 1h`, `Last 24h`, `Last 7d`, `Custom`)
  - Agent filter: Dropdown populated from agent store
  - Service filter: Dropdown populated from trace data (distinct services)
  - Min duration: Number input with `ms` suffix label
  - Errors only: Checkbox toggle
  - Search button: `bg-oav-accent text-white rounded-lg px-4 py-2 text-sm`
  - Layout: `flex flex-wrap items-end gap-3`

- **Integration status bar**: `bg-oav-surface/50 border border-oav-border rounded-lg px-4 py-2 text-xs flex items-center gap-2`
  - Green dot + "Connected" or Red dot + "Disconnected"
  - Last sync timestamp

- **Trace list**: `bg-oav-surface border border-oav-border rounded-xl overflow-hidden`
  - Table header: `text-xs text-oav-muted uppercase tracking-wider bg-oav-bg/50 px-4 py-2`
  - Rows: `px-4 py-3 border-b border-oav-border hover:bg-oav-surface-hover cursor-pointer`
  - Error rows: `border-l-2 border-l-oav-error`
  - Expand chevron: Rotates 90 degrees on expand (GSAP or CSS transition, 200ms)

- **Waterfall diagram**: Inline-expanded below the trace row
  - Full width within the trace list card
  - Each span bar: Horizontal bar, positioned by start time relative to trace start
  - Bar color: `bg-oav-trace` (default), `bg-oav-error` (error spans), `bg-oav-warning` (slow spans > 2x avg)
  - Bar height: `h-6` with `rounded-sm`
  - Service + operation label: `text-xs font-mono` inside or beside bar
  - Duration label: `text-xs text-oav-muted` right-aligned
  - Time axis: Top ruler showing 0ms to trace total duration
  - Nesting: Indented by `ml-6` per depth level
  - Click a span bar: Opens Span Detail Panel

- **Span detail panel**: Same slide-in pattern as topology detail panel
  - Width: 360px (slightly wider than 320 to accommodate attribute table)
  - `bg-oav-surface-elevated border-l border-oav-border shadow-xl`
  - Attributes rendered as key-value table: `text-xs font-mono`
  - "View in OpenTrace" link: `text-oav-accent text-sm hover:underline`, opens new tab

#### Fallback State (OpenTrace unreachable)

```
+-- Fallback Banner (top of page) --------+
| [!] OpenTrace connection unavailable.    |
|     Showing locally ingested spans only. |
|     [Configure OpenTrace ->]             |
+------------------------------------------+
```
- Banner: `bg-oav-warning/10 border border-oav-warning/30 rounded-xl p-4 text-sm text-oav-warning`
- Below banner: Simplified span list from local OTLP data (no waterfall, just a flat event list)

---

### 4.3 Mesh Topology Page (`/mesh`) -- OAV-303

```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT MESH GRAPH                             |
|           |                                                       |
|           | [Breadcrumb: Dashboard > Mesh Topology]                |
|           |                                                       |
|           | +-- Mesh Stats Bar (top overlay) -------------------+  |
|           | | Agents: 24 | Connections: 47 | Msg/min: 1,240    |  |
|           | | Avg Latency: 12ms | Error Rate: 0.3%              |  |
|           | | OpenMesh: [*] Connected                             |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           |  +-- ReactFlow Mesh Graph (fills viewport) --------+  |
|           |  |                                                 |  |
|           |  |    (Agent)----thick---->(Agent)                  |  |
|           |  |      |                    |                      |  |
|           |  |    thin               medium                     |  |
|           |  |      |                    |                      |  |
|           |  |    (Agent)<---dashed---(Agent)---->(Agent)       |  |
|           |  |                          |                       |  |
|           |  |    [Live pulse]       [New node entry animation] |  |
|           |  |                                                 |  |
|           |  +------+------------------------------------------+  |
|           |         |                                             |
|           |  [Auto Layout] [Zoom Fit] [Zoom +/-] [Period: 1h v]  |
|           |                                                       |
|           |  +-- Node Detail Panel (right, 320px, when open) -+  |
|           |  | [Close X]                                       |  |
|           |  | Agent: ProcessorBot                             |  |
|           |  | Mesh Role: Router                               |  |
|           |  | Status: Active  Level: 5 Expert                 |  |
|           |  | Connected Peers: 6                              |  |
|           |  | Messages Sent: 2,340 (last hour)                |  |
|           |  | Messages Received: 1,890 (last hour)            |  |
|           |  | [View Full Profile ->]                          |  |
|           |  +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Mesh stats bar**: `absolute top-4 left-4 right-4 z-30 bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl px-4 py-2 text-xs flex flex-wrap items-center gap-4`
  - Each stat: `flex items-center gap-1.5`
  - Stat label: `text-oav-muted`
  - Stat value: `text-oav-text font-semibold tabular-nums`
  - Integration status: Same dot + label pattern

- **Mesh graph**: Full viewport ReactFlow, same foundation as Sprint 2 Topology page
  - **Nodes**: Custom ReactFlow nodes, same 160x80px agent node design from Sprint 2, with additions:
    - Mesh role badge below status badge: `text-xs px-2 py-0.5 rounded-full bg-oav-mesh/20 text-oav-mesh`
    - Roles: "Producer", "Consumer", "Router" (from OpenMesh data)
  - **Edges**: Visually encode message flow:
    - Thickness: 1px (< 10 msg/hr), 2px (10-100), 3px (100-1000), 4px (> 1000)
    - Animation speed: Faster dash animation for higher message rates
    - Color: `oav-mesh` for healthy, `oav-warning` for high-latency edges, `oav-error` for high-error edges
  - **Live update indicators**: When a node or edge updates via WebSocket:
    - Node: Brief glow pulse (ring flash `oav-mesh`, 600ms, similar to Sprint 2 agent status change)
    - Edge: Brief brightness increase (opacity 0.5 to 1.0, 300ms)
    - New node: Fade in from opacity 0 to 1 over 500ms, scale from 0.8 to 1.0
    - Disconnected node: Opacity drops to 0.4, dashed border, "Disconnected" badge overlaid

- **Edge hover tooltip**: Same popover pattern as Sprint 2 topology edge
  ```
  +-- Edge Tooltip (floating) ---------------+
  | Protocol: gRPC                           |
  | Messages/hr: 1,240                       |
  | Avg Latency: 12ms                        |
  | Error Rate: 0.3%                         |
  +-------------------------------------------+
  ```

- **Period selector** in controls bar: Dropdown (`1h`, `24h`, `7d`) -- determines the time window for stats on edges and nodes

#### Fallback State (OpenMesh unreachable)

```
+-- Fallback Banner (top) --------------------+
| [!] OpenMesh unavailable -- showing local   |
|     topology. [Configure OpenMesh ->]        |
+----------------------------------------------+
```
- Falls back to Sprint 2 topology graph data (from `/api/agents/graph`)
- Same ReactFlow rendering, minus mesh-specific annotations (role, message rates)

---

### 4.4 Knowledge Graph Page (`/knowledge`) -- OAV-304

```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT KNOWLEDGE GRAPH                        |
|           |                                                       |
|           | [Breadcrumb: Dashboard > Knowledge Graph]              |
|           |                                                       |
|           | +-- Search & Legend Bar (top overlay) ---------------+  |
|           | | [Search entities...        ] [Type: All v]         |  |
|           | | [*] Concept  [*] Fact  [*] Memory  [*] Embedding  |  |
|           | | Showing 184 of 1,247 entities   [Load More]        |  |
|           | | OpenMind: [*] Connected                             |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           |  +-- ReactFlow Force Graph (fills viewport) -------+  |
|           |  |                                                 |  |
|           |  |    (Concept)---related_to--->(Concept)          |  |
|           |  |        |                        |               |  |
|           |  |    derived_from              used_by             |  |
|           |  |        |                        |               |  |
|           |  |    [Fact]     (Memory)<----(Embedding)          |  |
|           |  |                                                 |  |
|           |  |    Different shapes per entity type:            |  |
|           |  |    O = Concept, [] = Fact, <> = Memory, hex     |  |
|           |  |                                                 |  |
|           |  +------+------------------------------------------+  |
|           |         |                                             |
|           |  [Reset Layout] [Zoom Fit] [Zoom +/-]                |
|           |                                                       |
|           |  +-- Entity Detail Panel (right, 360px, when open) +  |
|           |  | [Close X]                                        |  |
|           |  | Entity: Machine Learning                         |  |
|           |  | Type: Concept                                    |  |
|           |  | Description: A subset of AI that enables         |  |
|           |  |   systems to learn from data...                  |  |
|           |  | Created: Mar 15, 2026                            |  |
|           |  | Relevance: 0.94                                  |  |
|           |  |                                                   |  |
|           |  | Related Agents:                                   |  |
|           |  | [Avatar] ResearchBot  [Avatar] AnalyzerBot        |  |
|           |  |                                                   |  |
|           |  | Top Related Entities:                             |  |
|           |  | [O] Neural Networks (related_to, 0.89)           |  |
|           |  | [O] Deep Learning (derived_from, 0.92)           |  |
|           |  | [[]] Backpropagation (instance_of, 0.78)         |  |
|           |  | [<>] Agent Training (used_by, 0.71)              |  |
|           |  | [hex] embed_ml_001 (has_embedding, 0.95)         |  |
|           |  +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Search bar**: `absolute top-4 left-4 right-4 z-30 bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl px-4 py-3`
  - Search input: `bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5 text-sm w-72`
  - Debounced at 300ms
  - Type filter: Dropdown or toggle buttons for entity types
  - Entity type legend: Inline colored badges showing the 4 entity types with their shape + color
  - Entity count: `text-xs text-oav-muted`
  - "Load More" button: `text-oav-accent text-sm hover:underline` (shown when total > displayed)

- **Knowledge graph nodes**: Custom ReactFlow nodes with distinct shapes:
  - **Concept (circle)**: 48px diameter circle, `bg-oav-knowledge/20 border-2 border-oav-knowledge`
  - **Fact (rectangle)**: 80x40px rectangle, `bg-oav-success/20 border-2 border-oav-success rounded-lg`
  - **Agent Memory (diamond)**: 56px rotated square (CSS `rotate-45`), `bg-oav-purple/20 border-2 border-oav-purple`
  - **Embedding (hexagon)**: 48px hexagon (SVG clipped), `bg-oav-shield/20 border-2 border-oav-shield`
  - All nodes show entity name truncated to 20 chars: `text-xs font-medium text-oav-text`

- **Search highlighting**: When search is active:
  - Matching nodes: Full opacity, scale 1.1, border brightens
  - Non-matching nodes: `opacity-20`
  - Transition: 300ms ease-in-out

- **Relationship edges**: Labeled with relationship type
  - `text-[10px] text-oav-muted` on edge midpoint
  - Color: `#94a3b8` (muted gray, all relationship types)
  - Hover: Edge thickens from 1px to 2px, label becomes `text-oav-text`

- **Entity detail panel**: 360px, slide-in from right
  - Related agents: Row of `AgentAvatar` components (small, 36x36) with name labels
  - Related entities: List with entity type icon + name + relationship type + weight
  - Click a related entity: Graph pans/zooms to that entity, detail panel updates

#### Empty State (OpenMind unreachable)

```
+-- Empty State (centered) ---------------+
|   [BookOpen icon, 48px, oav-muted]      |
|                                          |
|   OpenMind connection unavailable.       |
|   Knowledge graph requires OpenMind      |
|   to be running.                         |
|                                          |
|   [Configure OpenMind ->]                |
+------------------------------------------+
```
- No local fallback for knowledge graph data
- EmptyState component with `text-oav-muted text-sm text-center`

---

### 4.5 Security Dashboard Page (`/security`) -- OAV-305

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | [Breadcrumb: Dashboard > Security]                     |
|           |                                                       |
|           | Security Dashboard                                    |
|           |                                                       |
|           | +-- Summary Stats Row (4 cards) --------------------+  |
|           | | [Compliance ] [PII         ] [Violations ] [Threats] |
|           | | [Score      ] [Exposures   ] [Count      ] [Count  ] |
|           | | [   87/100  ] [   3        ] [   12       ] [   1   ] |
|           | | [Grade: B   ] [last 24h    ] [last 24h    ] [active ] |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Compliance Score Gauge (centered, large) ------+  |
|           | |                                                    |  |
|           | |          .-"""""""-.                                |  |
|           | |        /    87     \                                |  |
|           | |       |   Grade B   |                              |  |
|           | |        \           /                                |  |
|           | |          '-------'                                  |  |
|           | |                                                    |  |
|           | | Last updated: Mar 27, 2026 14:32                   |  |
|           | | OpenShield: [*] Connected                           |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Agent Security Table ---------------------------+  |
|           | | Agent         | Grade | Score | Violations | Last  |  |
|           | |---------------|-------|-------|------------|-------|  |
|           | | ProcessorBot  | [A]   | 95    | 0          | --    |  |
|           | | AnalyzerBot   | [B]   | 84    | 2          | 14:20 |  |
|           | | CollectorBot  | [D]   | 63    | 7          | 13:45 |  |
|           | | RouterBot     | [C]   | 72    | 4          | 14:01 |  |
|           | | ...                                                |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Violations Timeline (Recharts, 24h) -----------+  |
|           | | [Line chart: violations per hour over 24h]         |  |
|           | | [Y: count, X: hour, color: oav-error line]         |  |
|           | | [Tooltip: "2pm: 3 violations"]                     |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Agent Security Detail (slide-in, when clicked) -+  |
|           | | [Close X]                                          |  |
|           | | Agent: CollectorBot                                |  |
|           | | Grade: D  Score: 63/100                            |  |
|           | |                                                    |  |
|           | | Score Breakdown:                                   |  |
|           | |   Data Privacy:    72/100  [========--]             |  |
|           | |   Policy Compliance: 58/100  [=====---]            |  |
|           | |   Access Control:   61/100  [======--]             |  |
|           | |                                                    |  |
|           | | Recent Violations:                                 |  |
|           | | 14:20  PII detected in output      [High]         |  |
|           | |        Remediation: Add PII filter                 |  |
|           | | 13:45  Unauthorized data access     [Critical]     |  |
|           | |        Remediation: Restrict scope                  |  |
|           | | ... (last 10)                                      |  |
|           | |                                                    |  |
|           | | [View Full Profile ->]                             |  |
|           | +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Summary stats row**: `grid grid-cols-2 md:grid-cols-4 gap-4`
  - Same card styling as Dashboard summary stats
  - Compliance score card: Large number (`text-2xl font-bold`) with grade badge
  - Grade badge: Circular, 32x32px, colored per grade color system (Section 1.4)

- **Compliance score gauge**: `bg-oav-surface border border-oav-border rounded-xl p-6`
  - Rendered as an SVG semicircular gauge (Recharts RadialBarChart or custom SVG)
  - Score number: `text-4xl font-bold text-oav-text` centered
  - Grade letter: `text-lg font-semibold` below score, colored per grade
  - Arc color: Gradient from `oav-error` (0) through `oav-warning` (50) to `oav-success` (100)
  - Gauge width: `max-w-xs mx-auto`

- **Agent security table**: Same table styling as Sprint 2 alert table
  - Grade column: Circular badge with grade letter, colored per grade system
  - Score column: `tabular-nums text-sm`
  - Violations column: Red number if > 0, muted if 0
  - Last violation column: Relative time or "--" if none
  - Click row: Opens Agent Security Detail panel
  - Table: `bg-oav-surface border border-oav-border rounded-xl overflow-hidden`

- **Violations timeline**: `bg-oav-surface border border-oav-border rounded-xl p-4`
  - Recharts `LineChart` with `ResponsiveContainer`
  - Line color: `oav-error`
  - X-axis: Hours (last 24h)
  - Y-axis: Violation count
  - Same Recharts theming as Sprint 2 analytics charts
  - Chart height: `h-60`

- **Agent security detail panel**: 360px slide-in from right, `z-[45]`
  - Score breakdown: 3 horizontal progress bars, same styling as XPBar but with grade colors
  - Violations list: Each violation as a row with timestamp, description, severity badge, and remediation text
  - Severity badges: "Critical" = `bg-oav-error/20 text-oav-error`, "High" = `bg-oav-shield/20 text-oav-shield`, "Medium" = `bg-oav-warning/20 text-oav-warning`, "Low" = `bg-oav-muted/20 text-oav-muted`

#### Empty State (OpenShield unreachable)

Same pattern as Knowledge Graph empty state:
- Shield icon, 48px, muted
- "OpenShield connection unavailable. Security posture data requires OpenShield to be running."
- "Configure OpenShield ->" link

#### Real-time Updates

- New violation arrives via WebSocket/polling:
  - Toast notification: `bg-oav-surface border border-oav-error/40 rounded-xl p-4 shadow-xl`
  - Content: "[!] Policy Violation: {description} -- Agent: {name}"
  - Auto-dismiss: 5 seconds
  - Violations timeline chart updates (append data point)
  - Agent grade re-calculates and badge color transitions

---

### 4.6 Settings Page -- Integrations Tab (`/settings?tab=integrations`) -- OAV-306 Config

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA (centered, max-w-2xl)                   |
|           |                                                       |
|           | Settings                                              |
|           |                                                       |
|           | +-- Tab Bar ----------------------------------------+  |
|           | | [Workspace] [API Keys] [*Integrations*]           |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Integration Config Card: OpenTrace -------------+  |
|           | | [Activity icon]  OpenTrace                [*] On  |  |
|           | |                                                    |  |
|           | | Base URL:                                          |  |
|           | | [http://opentrace:8000/api         ]               |  |
|           | |                                                    |  |
|           | | API Key:                                           |  |
|           | | [********************************** ] [Eye icon]   |  |
|           | |                                                    |  |
|           | | Status: [*] Connected (last check: 14:30)          |  |
|           | |                                                    |  |
|           | | [Test Connection]  [Save]                          |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Integration Config Card: OpenMesh --------------+  |
|           | | [Share2 icon]   OpenMesh               [ ] Off    |  |
|           | | ...same structure...                                |  |
|           | | Status: [o] Not Configured                          |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Integration Config Card: OpenMind --------------+  |
|           | | [BookOpen icon]  OpenMind              [ ] Off     |  |
|           | | ...same structure...                                |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Integration Config Card: OpenShield -------------+  |
|           | | [Shield icon]   OpenShield              [ ] Off    |  |
|           | | ...same structure...                                |  |
|           | +--------------------------------------------------+  |
|           |                                                       |
|           | +-- Gamification Settings --------------------------+  |
|           | | XP Decay                                           |  |
|           | | Enable daily XP decay (1% per day of inactivity)  |  |
|           | | [Toggle: OFF]                                      |  |
|           | | [i] Agents that are inactive for 24+ hours lose    |  |
|           | |     1% of total XP per day. Cannot lose more       |  |
|           | |     than one level. Disabled by default.            |  |
|           | +--------------------------------------------------+  |
+------------------------------------------------------------------+
```

#### Layout Details

- **Tab bar**: `flex gap-1 bg-oav-bg rounded-lg p-1 border border-oav-border mb-6`
  - Each tab: `px-4 py-2 rounded-lg text-sm font-medium transition-colors`
  - Active: `bg-oav-accent text-white`
  - Inactive: `text-oav-muted hover:text-oav-text`

- **Integration config cards**: `bg-oav-surface border border-oav-border rounded-xl p-5 space-y-4`
  - Header row: Icon + product name + enabled/disabled toggle switch
  - Toggle switch: 44x24px, WCAG compliant tap target
    - On: `bg-oav-accent` knob position right
    - Off: `bg-oav-border` knob position left
  - Base URL input: `bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm font-mono text-oav-text w-full`
  - API Key input: `type="password"` with eye toggle to reveal
    - Same pattern as existing API key display in Sprint 2
  - Status indicator: Dot + text using Integration Status Indicator colors (Section 1.5)
  - "Test Connection" button: `bg-oav-surface border border-oav-border rounded-lg px-4 py-2 text-sm text-oav-text hover:bg-oav-surface-hover`
    - On click: Shows spinner for up to 5 seconds
    - Success: Changes status to green "Connected" with toast "Connection successful"
    - Failure: Changes status to red "Connection failed" with error message below input
  - "Save" button: `bg-oav-accent text-white rounded-lg px-4 py-2 text-sm`
    - Disabled until inputs are dirty (changed from saved state)
  - Card gap: `space-y-6` between cards

- **XP Decay section**: `bg-oav-surface border border-oav-border rounded-xl p-5`
  - Toggle + label row
  - Info text: `text-xs text-oav-muted`
  - Info icon: `[i]` in a small circle, `text-oav-muted`

#### Test Connection Flow

1. User enters Base URL and API Key
2. User clicks "Test Connection"
3. Button shows spinner + "Testing..."
4. Backend calls `GET /api/integrations/health` for the specific product
5. Success: Green status, toast "OpenTrace connected successfully"
6. Failure: Red status, inline error: "Connection failed: {error message}"
7. Timeout (5s): Red status, inline error: "Connection timed out"

---

### 4.7 Agent Detail Page -- Traces Tab (enhancement to existing)

The existing Agent Detail page (`/agents/:agentId`) gains a sixth tab: "Traces".

```
+-- Tab Bar (updated) ----------------------------------------+
| [Events] [State Machine] [Achievements] [Sessions]          |
| [XP History] [*Traces*]                                      |
+--------------------------------------------------------------+
```

**Traces Tab Content:**
```
+-- Agent Traces --------------------------------------------------+
| Last 20 traces from OpenTrace for this agent                      |
|                                                                   |
| Trace ID      | Operation           | Duration | Spans | Status  |
|---------------|--------------------|---------:|------:|---------|
| abc123...     | process_task        |    142ms |     4 | OK      |
| def456...     | handle_event        |    234ms |     6 | Error   |
| ghi789...     | route_message       |     87ms |     3 | OK      |
| ... (20 traces, scrollable)                                       |
|                                                                   |
| [View in Trace Explorer ->]                                       |
+-------------------------------------------------------------------+
```

- When OpenTrace is not configured or unreachable, show inline banner: "Configure OpenTrace in Settings to view distributed traces."
- Click a trace row: Navigates to `/traces?trace_id={id}` (Trace Explorer with that trace pre-selected)
- "View in Trace Explorer" link: Navigates to `/traces?agent={agentId}` with agent pre-filtered

---

## 5. Interaction Flows

### 5.1 3D Viewer Load Flow

```
User navigates to /world3d
    |
    v
Check UE5_ENABLED (env var / config)
    |
    +-- UE5_ENABLED=false --> Immediately show fallback 2D + banner
    |
    +-- UE5_ENABLED=true
         |
         v
    Show loading overlay: "Connecting to 3D server..."
         |
         v
    Attempt WebRTC signaling connection (timeout: 3s)
         |
         +-- Timeout / Error --> Show fallback 2D + banner
         |
         +-- SDP exchange successful
              |
              v
         ICE candidate negotiation
              |
              +-- ICE failed (STUN/TURN) --> Fallback 2D + banner
              |
              +-- ICE success
                   |
                   v
              Video stream starts rendering
                   |
                   v
              Open /ws/ue5 WebSocket for command channel
                   |
                   v
              Send sync_agents with current agent state
                   |
                   v
              Receive scene_ready from UE5
                   |
                   v
              Loading overlay dismissed
              3D view is interactive
```

**Mid-session disconnection:**
```
WebRTC connection drops
    |
    v
Show reconnecting overlay with spinner
    |
    v
Retry WebRTC signaling (exponential backoff: 2s, 4s, 8s)
    |
    +-- Reconnection within 10s --> Resume 3D stream
    |
    +-- Reconnection fails after 10s --> Fallback to 2D + banner
         |
         v
    Preserve selected agent across fallback
```

### 5.2 Trace Exploration Flow

```
User navigates to /traces
    |
    v
Page loads, fetches initial trace list (last 1h, no filters)
    |
    v
Trace list renders with 20 most recent traces
    |
    v
User adjusts search filters (time range, agent, service, duration, errors)
    |
    v
User clicks [Search]
    |
    v
API call: GET /api/integrations/opentrace/search?{params}
    |
    v
Trace list refreshes with filtered results
    |
    v
User clicks a trace row expand chevron [v]
    |
    v
Inline waterfall diagram expands below the row
    |
    v
Waterfall shows all spans with timing bars, nesting, duration labels
    |
    v
User clicks a specific span bar in the waterfall
    |
    v
Span Detail Panel slides in from right (360px)
    |
    v
Panel shows: span attributes, trace_id, span_id, parent, duration, status
    |
    v
User clicks "View in OpenTrace" link
    |
    v
New browser tab opens with deep link to OpenTrace UI: {OPENTRACE_BASE_URL}/traces/{trace_id}
```

### 5.3 Integration Configuration Flow

```
User navigates to /settings?tab=integrations
    |
    v
Integration config cards load (4 cards, one per product)
    |
    v
Each card shows current status from last health check
    |
    v
User fills in Base URL and API Key for OpenTrace
    |
    v
User clicks [Test Connection]
    |
    v
Button shows spinner + "Testing..."
    |
    v
Backend: GET /api/integrations/health?product=opentrace
    |
    +-- Success (200, healthy: true)
    |       |
    |       v
    |   Status updates to green "Connected"
    |   Toast: "OpenTrace connected successfully"
    |
    +-- Failure (connection refused / 401 / timeout)
            |
            v
        Status updates to red "Connection failed"
        Inline error message below URL field: "Error: {reason}"
    |
    v
User clicks [Save]
    |
    v
PUT /api/integrations/config/opentrace with { base_url, api_key, enabled }
    |
    v
Success: Status badge persists in sidebar integration sub-items
Failure: Error toast "Failed to save configuration"
```

### 5.4 Cross-Navigation: Agent Selection in 3D

```
User is on /world3d (3D viewer active)
    |
    v
User clicks an agent avatar in the 3D scene
    |
    v
UE5 sends agent_clicked event via /ws/ue5: { agent_id: "abc123" }
    |
    v
Backend relays event to web app
    |
    v
Web app receives event, sets selectedAgentId in useUIStore
    |
    v
Agent Detail Sidebar slides in from right (same as topology click)
    |
    v
Sidebar shows agent summary with "View Full Profile" link
    |
    v
User clicks "View Full Profile"
    |
    v
Router navigates to /agents/abc123 (Agent Detail page)
    |
    v
3D viewer unmounts, full Agent Detail page loads
```

### 5.5 Mesh Topology Live Update Flow

```
User is on /mesh page
    |
    v
WebSocket subscription to /ws/mesh/events (via OpenMesh)
    |
    v
New agent joins mesh (event: node_added)
    |
    v
ReactFlow graph adds new node:
    - Node appears with fade-in animation (opacity 0->1, 500ms)
    - Scale entrance (0.8->1.0, 300ms, ease: back.out)
    - Brief glow pulse on node border
    |
    v
Agent disconnects (event: node_removed)
    |
    v
Node visual updates:
    - Opacity drops to 0.4
    - Border becomes dashed
    - "Disconnected" badge overlays
    - Connected edges become dashed + dimmed
    |
    v
Message rate change (event: edge_updated)
    |
    v
Edge thickness animates to new value (transition: 300ms)
Edge dash animation speed adjusts
```

### 5.6 Knowledge Graph Search Flow

```
User is on /knowledge page
    |
    v
User types in search box: "machine learning"
    |
    v
300ms debounce timer starts
    |
    v
Timer fires: API call GET /api/integrations/openmind/search?q=machine+learning
    |
    v
Response: list of matching entity IDs
    |
    v
Graph visual update:
    - Matching nodes: full opacity, slight scale-up (1.0->1.05)
    - Non-matching nodes: opacity drops to 0.2
    - Matching edges: full opacity
    - Non-matching edges: opacity drops to 0.1
    - Transition: all 300ms ease-in-out
    |
    v
User clicks a highlighted node
    |
    v
Entity Detail Panel slides in from right
    |
    v
Panel shows entity details, related agents, related entities
    |
    v
User clicks a related entity in the panel
    |
    v
Graph pans/zooms to center on clicked entity (GSAP, 500ms)
Panel updates to show new entity details
Search clears (all nodes return to full opacity)
```

---

## 6. Component Hierarchy

### 6.1 3D World View Page

```
ThreeDWorldPage
+-- Breadcrumb
+-- ViewModeToggle (2D/3D segmented switch)
+-- UE5StreamContainer
|   +-- WebRTCVideoElement (or iframe)
|   +-- LoadingOverlay (conditional: connecting)
|   |   +-- LoadingSpinner
|   |   +-- ConnectionProgress
|   +-- ReconnectingOverlay (conditional: reconnecting)
|   |   +-- Spinner
|   |   +-- RetryCounter
|   |   +-- SwitchTo2DButton
|   +-- FallbackBanner (conditional: UE5 unavailable)
|   |   +-- InfoIcon
|   |   +-- BannerText
|   |   +-- ConfigureLink
|   |   +-- DismissButton
|   +-- ControlsGuide (conditional: first visit)
+-- CameraModePicker (bottom-left overlay)
+-- StreamStatusBar (bottom overlay)
|   +-- CameraModeLabel
|   +-- AgentCountLabel
|   +-- FPSLabel
|   +-- PingLabel
+-- AgentDetailSidebar (right side, conditional)
    +-- SidebarHeader (name, close button)
    +-- AgentAvatar (with LevelRing)
    +-- AgentStatusBadge
    +-- LevelDisplay + XPBar
    +-- QuickStats (tasks, cost)
    +-- ViewProfileLink
    +-- FocusCameraButton
```

### 6.2 Trace Explorer Page

```
TraceExplorerPage
+-- Breadcrumb
+-- TraceSearchBar
|   +-- TimeRangeSelector (segmented buttons)
|   +-- AgentFilterDropdown
|   +-- ServiceFilterDropdown
|   +-- MinDurationInput
|   +-- ErrorsOnlyCheckbox
|   +-- SearchButton
+-- IntegrationStatusBar
+-- FallbackBanner (conditional: OpenTrace unreachable)
+-- TraceList
|   +-- TraceListHeader (sortable columns)
|   +-- TraceListRow (x N)
|       +-- TraceIdCell (truncated, mono)
|       +-- RootServiceCell
|       +-- OperationCell
|       +-- DurationCell
|       +-- SpanCountCell
|       +-- StatusCell
|       +-- ExpandChevron
|       +-- TraceWaterfall (conditional: expanded)
|           +-- WaterfallTimeAxis
|           +-- WaterfallSpanBar (x N, nested)
|               +-- SpanServiceLabel
|               +-- SpanBar (colored, positioned)
|               +-- SpanDurationLabel
+-- TraceListPagination
+-- SpanDetailPanel (right side, conditional)
    +-- PanelHeader (close button)
    +-- SpanSummary (service, operation, duration, status)
    +-- SpanIdentifiers (trace_id, span_id, parent_span_id)
    +-- SpanAttributeTable
    |   +-- AttributeRow (x N, key-value, mono)
    +-- ViewInOpenTraceLink
```

### 6.3 Mesh Topology Page

```
MeshTopologyPage
+-- Breadcrumb
+-- MeshStatsBar (top overlay)
|   +-- StatItem (x5: agents, connections, msg/min, latency, error rate)
|   +-- IntegrationStatusDot
+-- FallbackBanner (conditional: OpenMesh unreachable)
+-- ReactFlowMeshCanvas
|   +-- MeshAgentNode (custom ReactFlow node, x N)
|   |   +-- NodeAvatar (reused from TopologyNode)
|   |   +-- NodeLevelBadge
|   |   +-- NodeStatusDot
|   |   +-- NodeLabel
|   |   +-- MeshRoleBadge (Producer/Consumer/Router)
|   |   +-- DisconnectedOverlay (conditional)
|   +-- MeshEdge (custom ReactFlow edge, x M)
|   |   +-- AnimatedDashEdge (thickness + speed varies)
|   +-- MeshEdgeTooltip (conditional: hover)
|       +-- ProtocolLabel
|       +-- MessageCountStat
|       +-- LatencyStat
|       +-- ErrorRateStat
+-- MeshControls (bottom-center)
|   +-- AutoLayoutButton
|   +-- ZoomFitButton
|   +-- ZoomControls
|   +-- PeriodSelector (1h/24h/7d dropdown)
+-- MeshNodeDetailPanel (right side, conditional)
    +-- PanelHeader (name, close, mesh role)
    +-- AgentAvatar + StatusBadge
    +-- MeshStats (connected peers, messages sent/received)
    +-- ViewProfileLink
```

### 6.4 Knowledge Graph Page

```
KnowledgeGraphPage
+-- Breadcrumb
+-- KnowledgeSearchBar (top overlay)
|   +-- SearchInput (debounced)
|   +-- EntityTypeFilter (dropdown or toggle buttons)
|   +-- EntityTypeLegend (inline colored badges)
|   +-- EntityCountLabel
|   +-- LoadMoreButton (conditional)
|   +-- IntegrationStatusDot
+-- EmptyState (conditional: OpenMind unreachable)
+-- ReactFlowKnowledgeCanvas
|   +-- ConceptNode (custom: circle)
|   +-- FactNode (custom: rectangle)
|   +-- MemoryNode (custom: diamond)
|   +-- EmbeddingNode (custom: hexagon)
|   +-- RelationshipEdge (labeled)
|   +-- EdgeTooltip (conditional: hover)
|       +-- RelationshipType
|       +-- Weight
|       +-- ContributingAgents
+-- KnowledgeControls (bottom-center)
|   +-- ResetLayoutButton
|   +-- ZoomFitButton
|   +-- ZoomControls
+-- EntityDetailPanel (right side, conditional)
    +-- PanelHeader (entity name, type badge, close)
    +-- EntityDescription
    +-- EntityMetadata (created date, relevance score)
    +-- RelatedAgentsList
    |   +-- AgentAvatar (x N, small)
    +-- RelatedEntitiesList
        +-- RelatedEntityRow (x 5)
            +-- EntityTypeIcon
            +-- EntityName
            +-- RelationshipType
            +-- Weight
```

### 6.5 Security Dashboard Page

```
SecurityDashboardPage
+-- Breadcrumb
+-- EmptyState (conditional: OpenShield unreachable)
+-- SecuritySummaryStats
|   +-- StatCard (x4: compliance, PII, violations, threats)
+-- ComplianceGauge
|   +-- SVGGauge (semicircular)
|   +-- ScoreNumber
|   +-- GradeBadge
|   +-- LastUpdatedLabel
|   +-- IntegrationStatusDot
+-- AgentSecurityTable
|   +-- TableHeader (sortable: agent, grade, score, violations, last)
|   +-- AgentSecurityRow (x N)
|       +-- AgentNameCell (avatar + name)
|       +-- GradeBadge (circular, colored)
|       +-- ScoreCell (tabular-nums)
|       +-- ViolationCountCell
|       +-- LastViolationCell (relative time)
+-- ViolationsTimeline
|   +-- RechartsLineChart
+-- AgentSecurityDetailPanel (right side, conditional)
    +-- PanelHeader (agent name, grade, close)
    +-- ScoreBreakdown
    |   +-- BreakdownBar (x3: privacy, compliance, access)
    +-- RecentViolationsList
    |   +-- ViolationRow (x N)
    |       +-- ViolationTimestamp
    |       +-- ViolationDescription
    |       +-- SeverityBadge
    |       +-- RemediationText
    +-- ViewProfileLink
```

### 6.6 Settings Page (Updated)

```
SettingsPage (updated)
+-- Breadcrumb
+-- SettingsTabBar
|   +-- TabButton ("Workspace")
|   +-- TabButton ("API Keys")
|   +-- TabButton ("Integrations")
+-- TabContent (switches by active tab)
    +-- WorkspaceTab (existing, unchanged)
    +-- APIKeysTab (existing, unchanged)
    +-- IntegrationsTab (NEW)
        +-- IntegrationConfigCard (x4)
        |   +-- CardHeader (icon, product name, enabled toggle)
        |   +-- BaseURLInput
        |   +-- APIKeyInput (password + eye toggle)
        |   +-- StatusIndicator (dot + label + last check time)
        |   +-- TestConnectionButton
        |   +-- SaveButton
        +-- GamificationSettings
            +-- XPDecayToggle
            +-- XPDecayDescription
```

### 6.7 Shared / Reusable Components (New)

```
New shared components for Sprint 3:

components/common/
+-- IntegrationStatusBadge.tsx    -- Dot + label for integration status
+-- SlideInPanel.tsx              -- Reusable right-side panel (320px/360px)
+-- FallbackBanner.tsx            -- Integration unavailable banner
+-- ToggleSwitch.tsx              -- Accessible toggle switch (44px tap target)
+-- SegmentedButtonGroup.tsx      -- Reusable segmented buttons (tab bars, filters)

components/ui/
+-- GradeBadge.tsx                -- Circular grade badge (A-F, colored)
+-- GaugeChart.tsx                -- Semicircular compliance gauge (SVG)
```

---

## 7. State Management Updates

### 7.1 New Store: `useIntegrationStore`

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `configs` | `Record<string, IntegrationConfig>` | Integration configs keyed by product name | SettingsPage, Sidebar status dots |
| `statuses` | `Record<string, IntegrationStatus>` | Connection status per product | All integration pages, Sidebar |
| `setConfig(product, config)` | action | Save config for a product | Settings Integrations tab |
| `setStatus(product, status)` | action | Update connection status | Health check, test connection |
| `isConnected(product)` | derived | Boolean check | Integration pages |

**Types:**
```typescript
interface IntegrationConfig {
  product_name: 'opentrace' | 'openmesh' | 'openmind' | 'openshield';
  base_url: string;
  api_key: string;
  enabled: boolean;
  updated_at: string;
}

type IntegrationStatus = 'connected' | 'degraded' | 'disconnected' | 'not_configured';
```

### 7.2 New Store: `useTraceStore`

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `traces` | `TraceView[]` | Current trace list | TraceExplorerPage |
| `selectedTraceId` | `string | null` | Currently expanded trace | TraceWaterfall |
| `selectedSpanId` | `string | null` | Currently selected span | SpanDetailPanel |
| `searchFilters` | `TraceSearchFilters` | Active search filters | TraceSearchBar |
| `setTraces(list)` | action | Replace trace list | API fetch |
| `selectTrace(id)` | action | Expand trace waterfall | Trace row click |
| `selectSpan(id)` | action | Open span detail | Span bar click |
| `setSearchFilters(filters)` | action | Update search | Search bar |
| `clearSelection()` | action | Close panels | Escape key |

### 7.3 New Store: `useMeshStore`

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `topology` | `MeshTopology | null` | Current mesh topology (nodes + edges) | MeshTopologyPage |
| `selectedNodeId` | `string | null` | Selected mesh node | MeshNodeDetailPanel |
| `meshStats` | `MeshStats | null` | Aggregate mesh statistics | MeshStatsBar |
| `period` | `'1h' | '24h' | '7d'` | Stats time window | PeriodSelector |
| `setTopology(topo)` | action | Replace topology data | API fetch, WebSocket |
| `selectNode(id)` | action | Open node detail | Node click |
| `updateNode(node)` | action | Update single node | WebSocket event |
| `updateEdge(edge)` | action | Update single edge | WebSocket event |
| `addNode(node)` | action | Add new node | WebSocket node_added |
| `removeNode(id)` | action | Mark node disconnected | WebSocket node_removed |
| `setStats(stats)` | action | Update mesh stats | API fetch |
| `setPeriod(p)` | action | Change time window | PeriodSelector |

### 7.4 New Store: `useKnowledgeStore`

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `entities` | `KnowledgeNodeView[]` | Visible graph entities | KnowledgeGraphPage |
| `totalCount` | `number` | Total entities available | EntityCountLabel |
| `selectedEntityId` | `string | null` | Selected entity | EntityDetailPanel |
| `searchQuery` | `string` | Current search text | SearchInput |
| `matchingIds` | `Set<string>` | Entity IDs matching search | Graph highlighting |
| `setEntities(list, total)` | action | Replace entity list | API fetch |
| `appendEntities(list)` | action | Load more entities | Load More button |
| `selectEntity(id)` | action | Open entity detail | Node click |
| `setSearchQuery(q)` | action | Update search, trigger API | SearchInput |
| `setMatchingIds(ids)` | action | Update highlights | Search response |
| `clearSearch()` | action | Reset search | Clear button, entity panel click |

### 7.5 New Store: `useSecurityStore`

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `posture` | `SecurityPostureView | null` | Workspace posture summary | SecurityDashboardPage |
| `agentPostures` | `AgentSecurityView[]` | Per-agent security data | AgentSecurityTable |
| `selectedAgentId` | `string | null` | Agent for detail panel | AgentSecurityDetailPanel |
| `violations` | `ViolationView[]` | Violations timeline data | ViolationsTimeline |
| `setPosture(posture)` | action | Update workspace posture | API fetch |
| `setAgentPostures(list)` | action | Update agent list | API fetch |
| `selectAgent(id)` | action | Open agent security detail | Table row click |
| `setViolations(list)` | action | Update violation timeline | API fetch |
| `addViolation(v)` | action | Prepend new violation | WebSocket/polling |

### 7.6 Existing Store Extensions

#### `useUIStore` (enhanced)

New fields:

| Field | Type | Description |
|-------|------|-------------|
| `settingsTab` | `'workspace' | 'keys' | 'integrations'` | Active Settings tab |
| `viewMode` | `'2d' | '3d'` | Active world view mode |
| `integrationsGroupExpanded` | `boolean` | Sidebar integrations group state |
| `setSettingsTab(tab)` | action | Switch settings tab |
| `setViewMode(mode)` | action | Switch 2D/3D |
| `toggleIntegrationsGroup()` | action | Expand/collapse sidebar group |

#### `useAgentStore` (enhanced)

New field:

| Field | Type | Description |
|-------|------|-------------|
| `agentTraces` | `Record<string, TraceView[]>` | Cached agent traces for Agent Detail Traces tab |
| `setAgentTraces(agentId, traces)` | action | Cache agent traces |

### 7.7 Data Flow Summary (Sprint 3 additions)

```
Integration APIs (REST via OAV backend proxy)
    |
    +--> React Query cache (useQuery with staleTime per integration)
    |       |
    |       +--> Integration page components
    |
    +--> Zustand integration stores (for cross-component state)

OpenMesh WebSocket (/ws/mesh/events)
    |
    +--> useMeshStore (topology updates, node add/remove)

UE5 WebSocket (/ws/ue5)
    |
    +--> UE5StreamContainer (camera events, agent clicks)
    +--> useUIStore (selectedAgentId on agent_clicked)
    +--> useAgentStore (state sync)

Existing WebSocket (/ws/live)
    |
    +--> (unchanged from Sprint 2)
    +--> useSecurityStore (violation events, if relayed)
```

---

## 8. CLI Output Patterns

The CLI plugin (`oav-cli`) renders output via the `rich` Python library. These patterns define the UX of terminal interactions.

### 8.1 Agent Status List (`oav status`)

```
$ oav status

  OpenAgentVisualizer -- Agent Status
  Workspace: My Workspace (ws_abc123)
  Connected: http://localhost:8000
  ___________________________________________________________

  Name             Status    Level    XP          Last Event
  ---------------  --------  -------  ----------  ----------------
  ProcessorBot     Active    Lv 5     7,250 XP    2 min ago
  AnalyzerBot      Idle      Lv 3     3,100 XP    15 min ago
  CollectorBot     Error     Lv 2     1,800 XP    1 min ago
  RouterBot        Active    Lv 4     5,400 XP    just now
  SummarizeBot     Complete  Lv 1       450 XP    1 hour ago
  ___________________________________________________________

  5 agents  |  2 active  |  1 error  |  Total XP: 18,000
```

**Formatting rules:**
- Table rendered with `rich.table.Table` with `box=rich.box.SIMPLE`
- Status column: Color-coded text -- Active=green, Idle=dim, Error=red, Waiting=yellow, Complete=blue
- Level column: `Lv N` format
- XP column: Comma-formatted, right-aligned
- Footer: Summary stats with pipe separators
- Header: Product name, workspace, connection URL

### 8.2 Detailed Agent Status (`oav status <agent_id>`)

```
$ oav status agt_abc123

  ProcessorBot
  =============================================
  Status:      Active
  Level:       5 (Expert)
  XP:          7,250 / 12,000 [============------] 60%
  Framework:   LangChain
  Role:        Data Processor
  Created:     Mar 10, 2026
  Last Event:  task_completed (2 min ago)

  Tokens:      1,247,320 (prompt: 847K, completion: 400K)
  Cost:        $45.20
  Error Rate:  2.1%
  Tasks:       342 completed, 3 errors

  Achievements: 3 earned
    * First Steps (50 XP)
    * Centurion (500 XP)
    * Speed Demon (300 XP)

  Recent Events (last 5):
    14:32:15  task_completed   Processed batch #47
    14:31:02  state_change     idle -> active
    14:30:45  xp_awarded       +25 XP (first_event_of_day)
    14:28:10  task_started     Processing batch #47
    14:25:33  state_change     active -> complete
```

**Formatting rules:**
- Name as heading with `rich.panel.Panel` border
- XP bar: ASCII progress bar `[====------]` with percentage
- Status: Color-coded (same as table)
- Events: Timestamp in `text-dim`, event type in colored brackets, description

### 8.3 Real-Time Event Stream (`oav stream`)

```
$ oav stream

  Live Event Stream -- Ctrl+C to stop
  Workspace: My Workspace
  ___________________________________________________________

  14:32:15  ProcessorBot    task_completed   Processed batch #47
  14:32:16  ProcessorBot    xp_awarded       +100 XP
  14:32:17  AnalyzerBot     state_change     idle -> active
  14:32:18  CollectorBot    error            Connection timeout to data source
  14:32:20  RouterBot       task_started     Routing message batch
  14:32:21  ProcessorBot    level_up         Level 5 -> Level 6 (Master)
  ...

  (new events scroll up, auto-scrolling)
```

**Formatting rules:**
- `rich.live.Live` display for auto-updating terminal output
- Timestamp: Dim/gray
- Agent name: Bold, consistent column width (padded to 16 chars)
- Event type: Colored by category -- task events=blue, state changes=yellow, XP=cyan, errors=red, level-ups=gold
- Description: Default text color
- Error events: Entire row highlighted with red background tint
- Level-up events: Entire row highlighted with gold accent
- Filter indicator: When `--agent` or `--type` is used, show filter banner above stream

### 8.4 Metrics Dashboard (`oav metrics --chart`)

```
$ oav metrics --chart

  Workspace Metrics -- Last 24 Hours
  ___________________________________________________________

  Token Usage (hourly):
                   *
            *     * *          *
     *     * *   *   *    *   * *
    * *   *   * *     *  * * *   *     *
   *   * *     *       **     *   *   * *
  *     *                          * *   *
  '-----+-----+-----+-----+-----+-----+--> Hours
  -24h  -20h  -16h  -12h  -8h   -4h   now

  Peak: 145K tokens/hr at -8h
  Average: 78K tokens/hr
  Total: 1.87M tokens

  Cost (hourly):
  $2.50 |          *
  $2.00 |     *   * *
  $1.50 |    * * *   *    *
  $1.00 |   *   *     *  * *
  $0.50 |  *            *
  $0.00 +'------+------+------+-> Hours
        -24h    -12h    -6h    now

  Total Cost: $34.20
  Avg Cost/Agent: $6.84
```

**Formatting rules:**
- Charts rendered with `asciichartpy.plot()` -- simple ASCII line charts
- Title above each chart
- Summary stats below each chart
- Y-axis: Auto-scaled with labels
- X-axis: Time labels
- Peak marker indicated

### 8.5 Connection Status (`oav health`)

```
$ oav health

  OpenAgentVisualizer Health Check
  URL: http://localhost:8000
  ___________________________________________________________

  Backend API:    [OK]  v1.3.0 (response: 24ms)
  WebSocket:      [OK]  Connected (latency: 12ms)
  Database:       [OK]  PostgreSQL 15.4 (connections: 8/100)
  Redis:          [OK]  Redis 7.2 (used memory: 45MB)
  Celery:         [OK]  4 workers active

  Integrations:
    OpenTrace:    [OK]  Connected (http://opentrace:8000)
    OpenMesh:     [--]  Not configured
    OpenMind:     [!!]  Connection failed (timeout after 5s)
    OpenShield:   [--]  Not configured
  ___________________________________________________________

  Overall: HEALTHY (4/5 core services OK, 1/4 integrations OK)
```

**Formatting rules:**
- `[OK]` in green, `[!!]` in red, `[--]` in dim/gray
- Version and latency info in parentheses
- Integration section: Shows all 4 products with status
- Overall summary: HEALTHY if all core services OK, DEGRADED if integrations have issues, UNHEALTHY if core services down

### 8.6 Leaderboard (`oav leaderboard`)

```
$ oav leaderboard

  Agent Leaderboard -- All Time
  ___________________________________________________________

  Rank  Agent            Level          XP         Achievements
  ----  ---------------  -----------    ---------  ------------
   #1   ProcessorBot     Lv 5 Expert    7,250 XP   3
   #2   RouterBot        Lv 4 Spec.     5,400 XP   2
   #3   AnalyzerBot      Lv 3 Oper.     3,100 XP   2
   #4   CollectorBot     Lv 2 Appr.     1,800 XP   1
   #5   SummarizeBot     Lv 1 Novice      450 XP   0
  ___________________________________________________________

  Champion: ProcessorBot (7,250 XP)
```

### 8.7 Topology ASCII Tree (`oav topology`)

```
$ oav topology

  Agent Topology
  ___________________________________________________________

  ProcessorBot (Active, Lv 5)
  +-- delegates_to --> RouterBot (Active, Lv 4)
  |   +-- delegates_to --> CollectorBot (Error, Lv 2)
  |   +-- data_flow --> AnalyzerBot (Idle, Lv 3)
  +-- shared_session --> AnalyzerBot (Idle, Lv 3)
      +-- data_flow --> SummarizeBot (Complete, Lv 1)
```

**Formatting rules:**
- Tree rendered with `rich.tree.Tree`
- Agent: Name + status (colored) + level
- Relationship type as edge label

---

## 9. Responsive Behavior

### 9.1 3D World View (`/world3d`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (< 768px) | **Not available.** Route redirects to `/world` (2D canvas) automatically. The 2D/3D toggle is hidden on mobile. |
| Tablet (768-1023px) | **Not available.** Same redirect to `/world`. Pixel Streaming requires a desktop browser for keyboard/mouse controls. |
| Desktop (1024px+) | Full 3D viewer experience. Agent detail sidebar is 320px, pushes stream left. Camera controls overlay visible. |
| Wide (1440px+) | Wider stream area. Status bar has more breathing room. |

### 9.2 Trace Explorer (`/traces`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Search bar stacks vertically. Trace list as cards instead of table. Waterfall diagram horizontally scrollable. Span detail panel opens as bottom sheet (half height). |
| Tablet | Search bar wraps to 2 rows. Table layout. Span detail as bottom sheet. |
| Desktop | Full layout as wireframed. Span detail panel slides from right (360px). |

### 9.3 Mesh Topology (`/mesh`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Full viewport graph. Stats bar collapses to 2 key stats + expandable. Node detail panel as bottom sheet. |
| Tablet | Full viewport. Stats bar full. Node detail panel as bottom sheet. |
| Desktop | Full layout. Node detail panel slides from right (320px). |

### 9.4 Knowledge Graph (`/knowledge`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Full viewport graph. Search bar collapses to icon that opens overlay. Entity detail panel as full-screen overlay. |
| Tablet | Full viewport. Search bar full width. Entity detail as bottom sheet. |
| Desktop | Full layout. Entity detail panel slides from right (360px). |

### 9.5 Security Dashboard (`/security`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Single column. Stats = 2x2 grid. Gauge full width. Agent table as cards. Violations chart full width. Agent detail as full-screen overlay. |
| Tablet | Stats = 4 columns. Gauge centered. Table layout. Agent detail as bottom sheet. |
| Desktop | Full layout. Agent detail panel slides from right (360px). |

### 9.6 Settings Integrations Tab

| Breakpoint | Behavior |
|-----------|----------|
| Mobile/Tablet/Desktop | Same single-column centered layout (`max-w-2xl mx-auto`). Cards stack vertically. Tab bar scrolls horizontally on very narrow screens. |

---

## 10. Accessibility Specification

### 10.1 WCAG 2.1 AA Compliance (Sprint 3 Additions)

All Sprint 2 accessibility patterns carry forward. Sprint 3 adds the following requirements.

### 10.2 3D Viewer Accessibility

- The WebRTC video element has `role="img"` with `aria-label="3D virtual world view showing {N} AI agent avatars"`
- The video element is NOT interactive via assistive technology -- all interaction happens through the overlay controls
- Agent detail sidebar, camera mode selector, and view mode toggle are all standard focusable elements
- Keyboard users who cannot use WASD controls: "Overview" camera mode (bird's-eye) is the default, which does not require keyboard camera navigation
- Fallback to 2D view is automatically announced: `aria-live="polite"` region says "3D viewer unavailable. Showing 2D canvas view."
- Controls Guide dismissal: `Escape` key closes it, focus returns to the stream container

### 10.3 Integration Page Keyboard Navigation

All integration pages follow the same pattern:

- `Tab` / `Shift+Tab`: Move between interactive elements
- `Enter` / `Space`: Activate buttons, expand trace waterfall, open entity detail
- `Escape`: Close detail panels, dismiss tooltips
- Arrow keys within ReactFlow: Built-in node navigation
- All slide-in panels: Focus trapped within panel when open. Close button receives initial focus. `Escape` closes and returns focus to triggering element.

### 10.4 Screen Reader Announcements (New)

| Event | Live Region | Announcement |
|-------|-------------|-------------|
| Integration connection test success | `aria-live="polite"` | "{Product} connection test successful" |
| Integration connection test failure | `aria-live="assertive"` | "{Product} connection test failed: {reason}" |
| Trace waterfall expanded | `aria-live="polite"` | "Trace {id} expanded. {N} spans shown." |
| Span selected | `aria-live="polite"` | "Span detail: {service}/{operation}, {duration}ms" |
| Mesh node added | `aria-live="polite"` | "New agent {name} joined mesh topology" |
| Mesh node disconnected | `aria-live="polite"` | "Agent {name} disconnected from mesh" |
| Knowledge entity selected | `aria-live="polite"` | "Entity: {name}, type: {type}" |
| Security violation received | `aria-live="assertive"` | "Security violation: {description} for agent {name}" |
| 3D fallback activated | `aria-live="polite"` | "3D viewer unavailable. Showing 2D canvas view." |
| View mode switched | `aria-live="polite"` | "Switched to {2D/3D} world view" |

### 10.5 Focus Management for Panels

All slide-in detail panels (Span Detail, Mesh Node, Entity Detail, Agent Security) follow a consistent focus pattern:

1. Panel opens: Focus moves to the panel's close button
2. Tab cycling: Trapped within panel contents
3. Escape: Closes panel, returns focus to the element that opened it (trace row, graph node, table row)
4. Implementation: `useRef` for trigger element, `inert` attribute on background content when panel is open

### 10.6 Motion Sensitivity (Sprint 3 additions)

When `prefers-reduced-motion` is active:
- Mesh topology live pulse animations: Disabled (nodes update instantly without glow)
- Knowledge graph search highlight transitions: Instant (no 300ms fade)
- Trace waterfall expand/collapse: Instant (no chevron rotation animation)
- 3D viewer: Unaffected (Pixel Streaming is a video stream, not CSS animation)
- Security gauge animation: Instant fill (no animated sweep)

---

## 11. E2E Test User Journeys

These define the key user flows that Playwright E2E tests should cover for Sprint 3.

### 11.1 3D Viewer Fallback Journey

1. Navigate to `/world3d` with no UE5 server running
2. Wait for 3-second timeout
3. Verify fallback banner appears: "3D viewer unavailable"
4. Verify 2D PixiJS canvas renders below the banner
5. Verify 2D/3D toggle shows 3D as active
6. Click 2D in the toggle
7. Verify navigation to `/world`

### 11.2 Integration Configuration Journey

1. Login and navigate to `/settings?tab=integrations`
2. Verify 4 integration config cards visible
3. Enter OpenTrace Base URL and API Key
4. Click "Test Connection"
5. Verify spinner appears
6. Verify connection result status updates
7. Click "Save"
8. Verify config is persisted (refresh page, values still present)

### 11.3 Trace Explorer Journey

1. Login, configure OpenTrace (or mock), navigate to `/traces`
2. Verify trace list loads with results
3. Adjust time range to "Last 24h"
4. Click Search
5. Click expand chevron on a trace
6. Verify waterfall diagram renders with span bars
7. Click a span bar
8. Verify Span Detail Panel opens with attributes
9. Click "View in OpenTrace" link
10. Verify new tab opens

### 11.4 Security Dashboard Journey

1. Login, configure OpenShield (or mock), navigate to `/security`
2. Verify compliance score gauge renders
3. Verify summary stats show (compliance, PII, violations, threats)
4. Verify agent security table shows agents with grades
5. Click an agent row
6. Verify Agent Security Detail Panel opens with score breakdown and violations

### 11.5 Cross-Navigation Journey

1. Login, navigate to `/world` (2D canvas)
2. Click the 3D toggle (expect fallback if no UE5 server)
3. Navigate to `/traces` from sidebar
4. Navigate to `/mesh` from sidebar
5. Navigate to `/knowledge` from sidebar
6. Navigate to `/security` from sidebar
7. Verify all pages load without errors
8. Navigate to an agent detail page, verify Traces tab exists

### 11.6 Mesh Topology Live Update Journey

1. Login, configure OpenMesh (or mock), navigate to `/mesh`
2. Verify mesh graph renders with agent nodes
3. Hover over an edge, verify tooltip appears with stats
4. Click a node, verify detail panel opens with mesh role
5. Simulate a node_added WebSocket event
6. Verify new node appears with animation

### 11.7 Knowledge Graph Search Journey

1. Login, configure OpenMind (or mock), navigate to `/knowledge`
2. Verify graph renders with entity nodes
3. Type "machine learning" in search box
4. Wait 300ms debounce
5. Verify matching nodes are highlighted, others dimmed
6. Click a highlighted node
7. Verify Entity Detail Panel opens
8. Click a related entity in the panel
9. Verify graph pans to new entity

---

## 12. Component Naming Conventions

### 12.1 New File Structure (Sprint 3 additions)

```
src/frontend/src/
+-- pages/
|   +-- ThreeDWorldPage.tsx             (NEW -- /world3d)
|   +-- TraceExplorerPage.tsx           (NEW -- /traces)
|   +-- MeshTopologyPage.tsx            (NEW -- /mesh)
|   +-- KnowledgeGraphPage.tsx          (NEW -- /knowledge)
|   +-- SecurityDashboardPage.tsx       (NEW -- /security)
|
+-- components/
|   +-- ue5/                            (NEW directory)
|   |   +-- UE5StreamContainer.tsx
|   |   +-- LoadingOverlay.tsx
|   |   +-- ReconnectingOverlay.tsx
|   |   +-- FallbackBanner.tsx
|   |   +-- CameraModePicker.tsx
|   |   +-- StreamStatusBar.tsx
|   |   +-- ControlsGuide.tsx
|   |
|   +-- traces/                         (NEW directory)
|   |   +-- TraceSearchBar.tsx
|   |   +-- TraceList.tsx
|   |   +-- TraceWaterfall.tsx
|   |   +-- WaterfallSpanBar.tsx
|   |   +-- SpanDetailPanel.tsx
|   |
|   +-- mesh/                           (NEW directory)
|   |   +-- MeshGraph.tsx
|   |   +-- MeshAgentNode.tsx
|   |   +-- MeshEdge.tsx
|   |   +-- MeshEdgeTooltip.tsx
|   |   +-- MeshStatsBar.tsx
|   |   +-- MeshNodeDetailPanel.tsx
|   |
|   +-- knowledge/                      (NEW directory)
|   |   +-- KnowledgeGraph.tsx
|   |   +-- ConceptNode.tsx
|   |   +-- FactNode.tsx
|   |   +-- MemoryNode.tsx
|   |   +-- EmbeddingNode.tsx
|   |   +-- KnowledgeSearchBar.tsx
|   |   +-- EntityDetailPanel.tsx
|   |   +-- EntityTypeLegend.tsx
|   |
|   +-- security/                       (NEW directory)
|   |   +-- ComplianceGauge.tsx
|   |   +-- SecuritySummaryStats.tsx
|   |   +-- AgentSecurityTable.tsx
|   |   +-- AgentSecurityRow.tsx
|   |   +-- ViolationsTimeline.tsx
|   |   +-- AgentSecurityDetailPanel.tsx
|   |   +-- GradeBadge.tsx
|   |
|   +-- settings/                       (NEW directory)
|   |   +-- SettingsTabBar.tsx
|   |   +-- IntegrationsTab.tsx
|   |   +-- IntegrationConfigCard.tsx
|   |   +-- XPDecayToggle.tsx
|   |
|   +-- common/                         (EXISTING, new additions)
|   |   +-- IntegrationStatusBadge.tsx  (NEW)
|   |   +-- SlideInPanel.tsx            (NEW)
|   |   +-- FallbackBanner.tsx          (NEW)
|   |   +-- ToggleSwitch.tsx            (NEW)
|   |   +-- SegmentedButtonGroup.tsx    (NEW)
|   |
|   +-- ui/                             (EXISTING, new addition)
|       +-- ViewModeToggle.tsx          (NEW)
|
+-- stores/
|   +-- integrationStore.ts            (NEW)
|   +-- traceStore.ts                  (NEW)
|   +-- meshStore.ts                   (NEW)
|   +-- knowledgeStore.ts              (NEW)
|   +-- securityStore.ts               (NEW)
|
+-- api/
|   +-- opentrace.ts                   (NEW)
|   +-- openmesh.ts                    (NEW)
|   +-- openmind.ts                    (NEW)
|   +-- openshield.ts                  (NEW)
|   +-- integrations.ts               (NEW -- config CRUD)
|
+-- hooks/
|   +-- useUE5Stream.ts               (NEW -- WebRTC connection management)
|   +-- useIntegrationHealth.ts       (NEW -- health check polling)
|   +-- useMeshWebSocket.ts           (NEW -- OpenMesh WS subscription)
|
+-- types/
    +-- integration.ts                 (NEW)
    +-- trace.ts                       (NEW)
    +-- mesh.ts                        (NEW)
    +-- knowledge.ts                   (NEW)
    +-- security.ts                    (NEW)
    +-- ue5.ts                         (NEW)
```

### 12.2 Naming Rules (same as Sprint 2, extended)

| Directory | Pattern | Example |
|-----------|---------|---------|
| `src/pages/` | `{PageName}Page.tsx` | `TraceExplorerPage.tsx` |
| `src/components/{domain}/` | `{ComponentName}.tsx` | `TraceWaterfall.tsx` |
| `src/stores/` | `{domain}Store.ts` | `traceStore.ts` |
| `src/hooks/` | `use{Name}.ts` | `useUE5Stream.ts` |
| `src/api/` | `{product}.ts` | `opentrace.ts` |
| `src/types/` | `{domain}.ts` | `trace.ts` |

---

## 13. Open Question Decisions

### Q1: Should integration pages be grouped or top-level?

**Decision:** Grouped under a collapsible "Integrations" section in the sidebar. This prevents the sidebar from becoming too long (9 items in Sprint 2, would be 13 without grouping). The group collapses to a single Puzzle icon when no integration page is active.

### Q2: Should the 3D viewer be a separate page or a tab on the existing World page?

**Decision:** Separate page (`/world3d`). The 2D PixiJS canvas and UE5 Pixel Streaming are fundamentally different rendering technologies. Trying to mount both on the same page adds complexity. The 2D/3D toggle provides seamless switching between the two routes. The selected agent is preserved across the switch via `useUIStore.selectedAgentId`.

### Q3: Should the Traces tab in Agent Detail show full waterfall or just a list?

**Decision:** Just a list (trace ID, operation, duration, status). The Agent Detail Traces tab is a quick overview. Users who need the full waterfall can click through to the Trace Explorer page. This keeps the Agent Detail page lightweight.

### Q4: Should the Settings page use tabs or sections?

**Decision:** Tabs. Sprint 2's Settings page had 2 sections on one scrollable page. With the addition of Integrations (4 config cards + XP decay), the page becomes too long to scroll. Tabs keep each section focused and maintain the `max-w-2xl` centered layout.

### Q5: How should the sidebar handle 13+ nav items?

**Decision:** Collapsible "Integrations" group. See Section 3.1 for details. This keeps the sidebar at 10 visual slots (same count as Sprint 2 plus one group entry), preventing scrolling.
