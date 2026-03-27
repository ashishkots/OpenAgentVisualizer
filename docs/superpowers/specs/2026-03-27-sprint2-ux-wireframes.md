# OpenAgentVisualizer Sprint 2 -- UX Wireframes & Interaction Design

**Product:** OpenAgentVisualizer -- Gamified Virtual World for AI Agent Management
**Sprint:** 2 (2D/3D Visualization and Frontend Dashboard)
**Author:** UX Designer (Stage 1.2)
**Date:** 2026-03-27
**Status:** COMPLETE
**Inputs:** Sprint 2 PRD (2026-03-27-sprint2-prd.md), PM Handoff (stage-1.1-pm-to-ux-tl.yml)

---

## Table of Contents

1. [Design System Tokens](#1-design-system-tokens)
2. [Responsive Breakpoints & Grid System](#2-responsive-breakpoints--grid-system)
3. [Information Architecture & Site Map](#3-information-architecture--site-map)
4. [Navigation Structure](#4-navigation-structure)
5. [Page Wireframes](#5-page-wireframes)
6. [Interaction Flows](#6-interaction-flows)
7. [Component Hierarchy](#7-component-hierarchy)
8. [State Management Map](#8-state-management-map)
9. [Gamification UX Patterns](#9-gamification-ux-patterns)
10. [Accessibility Specification](#10-accessibility-specification)
11. [Component Naming Conventions](#11-component-naming-conventions)
12. [Open Question Decisions](#12-open-question-decisions)

---

## 1. Design System Tokens

### 1.1 Color Palette (existing, from `tailwind.config.js` and `colorTokens.ts`)

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `oav-bg` | `#0f1117` | `bg-oav-bg` | Page background, deep canvas background |
| `oav-surface` | `#1e2433` | `bg-oav-surface` | Card backgrounds, panels, sidebar |
| `oav-border` | `#2d3748` | `border-oav-border` | Card borders, dividers, input borders |
| `oav-text` | `#e2e8f0` | `text-oav-text` | Primary text, headings |
| `oav-muted` | `#94a3b8` | `text-oav-muted` | Secondary text, labels, timestamps |
| `oav-accent` | `#3b82f6` | `bg-oav-accent` / `text-oav-accent` | Primary actions, active links, selection highlight |
| `oav-success` | `#22c55e` | `text-oav-success` | Active status, resolved, positive trends |
| `oav-warning` | `#f59e0b` | `text-oav-warning` | Warning severity, waiting state, amber ring |
| `oav-error` | `#ef4444` | `text-oav-error` | Error state, critical alerts, destructive actions |
| `oav-purple` | `#a855f7` | `text-oav-purple` | Specialist level ring, thinking state |

#### 1.1.1 New Color Tokens Needed for Sprint 2

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `oav-gold` | `#eab308` | `text-oav-gold` / `bg-oav-gold` | Gold ring (level 5+), champion highlight, crown icon |
| `oav-xp` | `#06b6d4` | `text-oav-xp` | XP text, floating XP animations, XP bar fill |
| `oav-surface-hover` | `#283040` | `bg-oav-surface-hover` | Hover state for cards, table rows |
| `oav-surface-active` | `#2a3650` | `bg-oav-surface-active` | Active/selected card, pressed button |

These must be added to `tailwind.config.js` and `colorTokens.ts`.

### 1.2 Typography Scale

All text uses the system font stack via Tailwind defaults. Specific scale used in this product:

| Level | Tailwind Class | Size | Weight | Usage |
|-------|---------------|------|--------|-------|
| Page title | `text-xl font-bold` | 20px | 700 | Page headings (h1) |
| Section title | `text-lg font-semibold` | 18px | 600 | Section headings (h2) |
| Card title | `text-sm font-medium` | 14px | 500 | Agent name, card headers |
| Body | `text-sm` | 14px | 400 | Paragraph text, descriptions |
| Label | `text-xs text-oav-muted` | 12px | 400 | Metadata, timestamps, labels |
| Mono | `text-xs font-mono` | 12px | 400 | Event data, JSON, IDs |
| Stat large | `text-2xl font-bold` | 24px | 700 | Summary stat numbers |
| Stat label | `text-xs text-oav-muted` | 12px | 400 | Summary stat labels |

### 1.3 Spacing Scale

Uses Tailwind default spacing scale. Key recurring values:

| Context | Class | Value |
|---------|-------|-------|
| Page padding | `p-6` | 24px |
| Card padding | `p-4` | 16px |
| Section gap | `space-y-6` | 24px |
| Card inner gap | `space-y-4` | 16px |
| Inline gap | `gap-3` | 12px |
| Tight gap | `gap-2` | 8px |
| Sidebar width (collapsed) | `w-16` | 64px |
| Sidebar width (expanded, Sprint 2) | `w-56` | 224px |
| Detail panel width | `w-80` | 320px |

### 1.4 Border Radius

| Context | Class | Value |
|---------|-------|-------|
| Cards, panels | `rounded-xl` | 12px |
| Buttons, inputs | `rounded-lg` | 8px |
| Badges, pills | `rounded-full` | 9999px |
| Progress bars | `rounded-full` | 9999px |

### 1.5 Shadow Scale

| Context | Class | Usage |
|---------|-------|-------|
| Floating panels | `shadow-xl` | Detail panel, modals, toasts |
| Dropdown menus | `shadow-lg` | Dropdowns, popovers |
| Tooltip | `shadow-md` | Agent tooltip on canvas |

### 1.6 Level Ring Colors (PixiJS Canvas)

Per PRD Section 3.2, these hex values are used in PixiJS as integer color values:

| Level | Title | Ring Color (hex) | PixiJS Int | Ring Visual |
|-------|-------|-----------------|------------|-------------|
| 1 | Novice | `#94a3b8` | `0x94a3b8` | Gray ring |
| 2 | Apprentice | `#3b82f6` | `0x3b82f6` | Blue ring |
| 3 | Operative | `#22c55e` | `0x22c55e` | Green ring |
| 4 | Specialist | `#a855f7` | `0xa855f7` | Purple ring |
| 5 | Expert | `#eab308` | `0xeab308` | Gold ring |
| 6 | Master | `#eab308` | `0xeab308` | Gold ring + particle trail |
| 7 | Grandmaster | `#eab308` | `0xeab308` | Gold ring + particle trail + crown |
| 8 | Legend | `#eab308` | `0xeab308` | Animated aura + crown + sprite tint |
| 9 | Mythic | `#eab308` | `0xeab308` | Full avatar transformation |
| 10 | Transcendent | `#eab308` | `0xeab308` | Custom particle system |

NOTE: The existing `xpLevels.ts` has 5 levels with different thresholds and names than the PRD specifies. Sprint 2 must update this file to match the PRD's 10-level system with the formula `required_xp(level) = round(500 * (level - 1) ^ 1.8)`.

### 1.7 Agent State Colors (Canvas + Dashboard)

Per PRD OAV-202, agent states differ from current codebase. The PRD defines five FSM states:

| State | Tint Color | Canvas Effect | Dashboard Badge Class |
|-------|-----------|---------------|----------------------|
| `idle` | Gray `#94a3b8` | Slow breathing animation (scale 1.0-1.02, 2s loop) | `bg-oav-muted` |
| `active` | Green `#22c55e` | Bright glow + faster pulse | `bg-oav-success` |
| `waiting` | Amber `#f59e0b` | Clock icon overlay | `bg-oav-warning` |
| `error` | Red `#ef4444` | Shake animation (x +/- 3px, 300ms) | `bg-oav-error` |
| `complete` | Blue `#3b82f6` | Checkmark icon overlay | `bg-oav-accent` |

NOTE: Current `agent.ts` type defines `AgentStatus = 'idle' | 'working' | 'thinking' | 'communicating' | 'error'`. The PRD redefines this as `'idle' | 'active' | 'waiting' | 'error' | 'complete'`. Sprint 2 must update the type and all references.

---

## 2. Responsive Breakpoints & Grid System

### 2.1 Breakpoints

| Name | Min Width | Tailwind Prefix | Typical Device |
|------|-----------|-----------------|----------------|
| Mobile | 0px | (default) | Phone (375px viewport) |
| Tablet | 768px | `md:` | iPad portrait |
| Desktop | 1024px | `lg:` | Laptop |
| Wide | 1440px | `xl:` | External monitor |
| Ultra | 1920px | `2xl:` | Large display |

### 2.2 Layout Grid

Desktop (1440px+) uses a 12-column grid with 24px gutters:

```
| Column | Width |
| 1 col  | ~95px |
| 4 col  | ~410px |
| 6 col  | ~620px |
| 8 col  | ~830px |
| 12 col | 1248px (1440 - sidebar - gutters) |
```

Tailwind implementation uses `grid grid-cols-12 gap-6` on desktop pages. Canvas pages are full-bleed (no grid).

### 2.3 Layout Modes by Page

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Dashboard | Single column, stacked | 2-col agent grid, stacked charts | 4-col agent grid, side-by-side charts |
| Agent Canvas | Full viewport, touch gestures | Full viewport, touch gestures | Full viewport, mouse pan/zoom |
| Topology | Full viewport | Full viewport | Full viewport, side detail panel |
| Agent Detail | Single column, stacked tabs | 2-column layout | 3-column: profile / timeline / sidebar |
| Leaderboard | Single column, compact rows | Table with all columns | Table with trend chart column |
| Analytics | Stacked charts | 2-col chart grid | 3-col chart grid |
| Alerts | Single column | Single column, wider | Table layout |
| Sessions | Single column | Single column | Split: session list + detail |
| Settings | Single column | Single column, max-w-2xl centered | Single column, max-w-2xl centered |

---

## 3. Information Architecture & Site Map

### 3.1 Site Map

```
[Login Page] (/login)
    |
    v
[App Shell] (authenticated)
    |
    +-- [Dashboard] (/dashboard) -- LANDING PAGE after login
    |       +-- Agent Grid (card links to Agent Detail)
    |       +-- Summary Stats (4 cards)
    |       +-- Cost Chart (Recharts)
    |       +-- Token Chart (Recharts)
    |       +-- Mini Leaderboard (top 5, links to full Leaderboard)
    |
    +-- [Agent Canvas] (/world) -- VIRTUAL WORLD
    |       +-- PixiJS 2D Canvas (pannable, zoomable)
    |       +-- Agent Tooltip (on click)
    |       +-- Agent Detail Panel (slide-in, on double-click or via route)
    |       +-- Filter Bar (status filter, search)
    |       +-- Minimap (bottom-right corner)
    |       +-- Connection Status Indicator
    |
    +-- [Topology Graph] (/topology) -- NEW PAGE
    |       +-- ReactFlow Graph (nodes = agents, edges = relationships)
    |       +-- Node Click Detail Panel (slide-in)
    |       +-- Edge Click Popover
    |       +-- Layout Controls (auto-layout, zoom-to-fit)
    |       +-- Legend (edge types)
    |
    +-- [Agent Detail] (/agents/:agentId) -- NEW FULL PAGE (was just panel)
    |       +-- Profile Header (name, status, level, XP bar)
    |       +-- Tab Navigation:
    |       |   +-- [Events] -- Event timeline (last 100)
    |       |   +-- [State Machine] -- Visual FSM diagram
    |       |   +-- [Achievements] -- Earned + locked badges
    |       |   +-- [Sessions] -- Session history table
    |       |   +-- [XP History] -- XP transaction log
    |       +-- Cost Sparkline (sidebar)
    |       +-- Live Update Indicator
    |
    +-- [Leaderboard] (/leaderboard) -- NEW PAGE
    |       +-- Period Selector (daily, weekly, monthly, all-time)
    |       +-- Category Selector (xp, tasks, cost_efficiency, streaks)
    |       +-- Ranked Agent List (virtual scrolled)
    |       +-- Champion Highlight (top agent)
    |       +-- Agent Row Click -> Agent Detail
    |
    +-- [Analytics] (/analytics) -- NEW PAGE
    |       +-- Time Range Selector (24h, 7d, 30d, custom)
    |       +-- Agent Filter Dropdown
    |       +-- Cost Over Time (line chart)
    |       +-- Token Usage (stacked area chart)
    |       +-- Latency Distribution (histogram)
    |       +-- Request Count (bar chart)
    |       +-- Cost Per Agent (horizontal bar chart)
    |       +-- Export CSV Button
    |
    +-- [Alerts] (/alerts) -- ENHANCED
    |       +-- Critical Alert Banner (top)
    |       +-- Filter Bar (severity, resolved status)
    |       +-- Alert Table (sortable columns)
    |       +-- Bulk Actions (resolve selected)
    |       +-- Real-time Alert Prepend
    |
    +-- [Sessions] (/sessions) -- ENHANCED from /replay
    |       +-- Session List (left panel on desktop)
    |       +-- Session Detail (right panel):
    |       |   +-- Event Timeline (chronological)
    |       |   +-- Playback Controls (play, pause, speed)
    |       |   +-- Timeline Scrubber
    |       |   +-- Event Detail Panel (JSON viewer)
    |       +-- Optional Canvas Sync Toggle
    |
    +-- [Settings] (/settings) -- ENHANCED
            +-- Workspace Section (name, slug, dates)
            +-- API Keys Section (list, create, revoke)
            +-- Appearance Section (future)
```

### 3.2 Navigation Priority (sidebar order)

1. Dashboard (home icon) -- most used, landing page
2. Agent Canvas (globe/world icon) -- core feature, virtual world
3. Topology (network icon) -- structural view
4. Leaderboard (trophy icon) -- gamification engagement
5. Analytics (chart icon) -- data insights
6. Alerts (bell icon) -- operational awareness
7. Sessions (play icon) -- debugging/replay
8. Settings (gear icon) -- low frequency, bottom of sidebar

---

## 4. Navigation Structure

### 4.1 Sidebar Redesign

The current sidebar is a minimal 64px-wide column with text labels. Sprint 2 redesigns it to:

#### Collapsed State (default, `w-16` / 64px)
- Icon-only navigation with tooltip on hover
- Each nav item: 40x40px icon button, centered
- Active page: left blue border (3px `bg-oav-accent`), icon color `text-oav-accent`
- Inactive: icon color `text-oav-muted`, hover `text-oav-text`
- Top: App logo/icon (link to dashboard)
- Bottom: User avatar (link to settings), logout button

#### Expanded State (on hover or toggle, `w-56` / 224px)
- Icons + text labels visible
- Transition: `transition-all duration-200 ease-in-out`
- On mobile/tablet: sidebar is hidden, replaced by bottom tab bar

#### Mobile Bottom Tab Bar
- 5 primary items: Dashboard, World, Topology, Leaderboard, More
- "More" opens a slide-up menu with: Analytics, Alerts, Sessions, Settings
- Height: 64px, fixed bottom
- Active item: `text-oav-accent` with filled icon variant

### 4.2 Breadcrumb (Desktop Only)

Shown at the top of content area for nested pages:

```
Dashboard > Agent Detail > [Agent Name]
Sessions > Session #abc123
```

Tailwind: `text-xs text-oav-muted` with `text-oav-accent` for clickable segments.

### 4.3 URL Structure

| Page | URL Pattern | Params |
|------|-------------|--------|
| Login | `/login` | -- |
| Dashboard | `/dashboard` | -- |
| Agent Canvas | `/world` | -- |
| Topology | `/topology` | -- |
| Agent Detail | `/agents/:agentId` | `agentId` (UUID) |
| Leaderboard | `/leaderboard` | `?period=&category=` (query params) |
| Analytics | `/analytics` | `?range=&agent=` (query params) |
| Alerts | `/alerts` | `?severity=&status=` (query params) |
| Sessions | `/sessions` | -- |
| Session Detail | `/sessions/:sessionId` | `sessionId` (UUID) |
| Settings | `/settings` | -- |

---

## 5. Page Wireframes

### 5.1 Dashboard Page (`/dashboard`) -- OAV-211

```
+------------------------------------------------------------------+
| [Sidebar]  |  CONTENT AREA                                       |
|  64px      |                                                      |
|            |  [Breadcrumb: Dashboard]                              |
|            |                                                      |
|            |  +-- Summary Stats Row (4 cards, equal width) ------+|
|            |  | [Total     ] [Active    ] [Total XP   ] [Total   ]||
|            |  | [Agents    ] [Now       ] [Earned     ] [Cost    ]||
|            |  | [  24      ] [  8  .    ] [  45,200   ] [ $127   ]||
|            |  | [          ] [green dot ] [            ] [        ]||
|            |  +--------------------------------------------------+|
|            |                                                      |
|            |  +-- Agent Grid (12-col grid) ----------------------+|
|            |  | [AgentCard] [AgentCard] [AgentCard] [AgentCard]   ||
|            |  | [AgentCard] [AgentCard] [AgentCard] [AgentCard]   ||
|            |  | [AgentCard] [AgentCard] [AgentCard] [AgentCard]   ||
|            |  | ... (scrollable, 4 cols desktop, 2 tablet, 1 mob) ||
|            |  +--------------------------------------------------+|
|            |                                                      |
|            |  +-- Charts Row (2 charts side by side) ------------+|
|            |  | [Cost Over Time - Line Chart  ] [Token Usage -   ]||
|            |  | [  Recharts, 30 days          ] [ Stacked Area   ]||
|            |  | [  Hover tooltip               ] [ Prompt/Compl. ]||
|            |  +--------------------------------------------------+|
|            |                                                      |
|            |  +-- Mini Leaderboard (right-aligned on desktop) ---+|
|            |  | Top 5 Agents by XP                               ||
|            |  | #1 AgentName [LvBadge] [XPBar] 12,500 XP         ||
|            |  | #2 ...                                            ||
|            |  | #3 ...                                            ||
|            |  | #4 ...                                            ||
|            |  | #5 ...                                            ||
|            |  | [View Full Leaderboard ->]                        ||
|            |  +--------------------------------------------------+|
+------------------------------------------------------------------+
```

#### Layout Details

- **Summary Stats Row**: `grid grid-cols-2 md:grid-cols-4 gap-4`
  - Each card: `bg-oav-surface border border-oav-border rounded-xl p-4`
  - Stat value: `text-2xl font-bold text-oav-text`
  - Stat label: `text-xs text-oav-muted`
  - "Active Now" card has a pulsing green dot (`animate-pulse bg-oav-success`)

- **Agent Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
  - Reuses existing `AgentCard` component, enhanced with:
    - Last active timestamp
    - Level number badge (colored ring around avatar)
    - Click navigates to `/agents/:agentId` (not panel, full page)
  - Real-time WebSocket updates: agent card status badge animates on change

- **Charts Row**: `grid grid-cols-1 lg:grid-cols-2 gap-6`
  - Each chart: `bg-oav-surface border border-oav-border rounded-xl p-4`
  - Chart height: 240px (`h-60`)
  - Recharts `ResponsiveContainer` fills parent width

- **Mini Leaderboard**: `bg-oav-surface border border-oav-border rounded-xl p-4`
  - Desktop: appears as a card in a `grid grid-cols-1 lg:grid-cols-3 gap-6` row, spanning 1 column
  - Charts span 2 columns in the same row
  - "View Full Leaderboard" link: `text-oav-accent text-sm hover:underline`

#### Responsive Behavior

- **Mobile (375px)**: Single column. Stats = 2x2 grid. Agent grid = 1 column. Charts stacked. Leaderboard below charts.
- **Tablet (768px)**: Stats = 4 columns. Agent grid = 2 columns. Charts stacked. Leaderboard below.
- **Desktop (1024px+)**: Stats = 4 columns. Agent grid = 4 columns. Charts + mini leaderboard in 3-col row (2+1).

---

### 5.2 Agent Canvas Page (`/world`) -- OAV-201, OAV-202, OAV-204, OAV-205, OAV-206

```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT CANVAS                                 |
|           |                                                       |
|           |  [Filter Bar - top overlay, semi-transparent]         |
|           |  | [Search...] [Status: All v] [Level: All v]  |     |
|           |                                                       |
|           |  +------ PixiJS Canvas (fills viewport) ----------+  |
|           |  |                                                 |  |
|           |  |    [Agent]    [Agent]         [Agent]           |  |
|           |  |      |          |               |               |  |
|           |  |    [Agent]----[Agent]          [Agent]          |  |
|           |  |                  |                               |  |
|           |  |    [Agent]     [Agent]    [Agent]               |  |
|           |  |                                                 |  |
|           |  |   (Force-directed layout, pannable, zoomable)   |  |
|           |  |                                                 |  |
|           |  +--+----------------------------------------------+  |
|           |     |                                                 |
|           |     | [Minimap]   [Zoom +/-] [Fit] [Connection: OK]  |
|           |     | 120x80px    bottom-right controls              |
|           |                                                       |
+------------------------------------------------------------------+
```

When an agent is clicked (single-click), a tooltip appears:

```
+-- Agent Tooltip (floating, attached to avatar) --+
| [Avatar Icon] AgentName                          |
| Level 5 - Expert           Status: Active        |
| XP: 7,250 / 12,000   [=======---]               |
| Current Task: "Process customer data"             |
| [3 achievement badges]  [+2 more]                |
+--------------------------------------------------+
```

When an agent is double-clicked, the full-page Agent Detail opens at `/agents/:agentId`.

#### Filter Bar

- Position: Fixed top overlay on the canvas, `z-30`
- Background: `bg-oav-bg/80 backdrop-blur-sm`
- Layout: `flex items-center gap-3 px-4 py-2`
- Search: `bg-oav-surface border border-oav-border rounded-lg px-3 py-1.5 text-sm w-64`
- Dropdowns: Same styling, `w-40`
- Filters apply client-side: hide/show sprites in PixiJS by toggling `visible` property

#### Canvas Controls (bottom-right overlay)

- Position: Fixed bottom-right, `z-30`
- Background: `bg-oav-surface/90 backdrop-blur-sm border border-oav-border rounded-xl p-2`
- Zoom buttons: `+` and `-`, 32x32px, `rounded-lg bg-oav-bg`
- Fit button: "Fit" text, resets zoom to show all agents
- Connection indicator: Green dot + "Live" or red dot + "Reconnecting..."

#### Minimap (bottom-left overlay)

- Size: 160x100px on desktop, hidden on mobile
- Background: `bg-oav-surface/80 border border-oav-border rounded-lg`
- Shows all agents as tiny dots, current viewport as a white rectangle
- Click on minimap pans the main canvas

#### Keyboard Navigation (Accessibility)

- `Tab`: Cycle through agent sprites in document order (force-directed layout serialized to a list)
- `Enter`: Open agent tooltip (same as single-click)
- `Escape`: Close tooltip
- `Shift+Enter`: Navigate to agent detail (same as double-click)
- Arrow keys: Pan canvas (when canvas is focused, not on an agent)
- `+` / `-`: Zoom in/out
- `0`: Reset zoom to 1x

#### Responsive Behavior

- **Mobile**: Filter bar collapses to icon button that opens a bottom sheet with filters. Minimap hidden. Zoom controls remain. Pinch-to-zoom and drag-to-pan via touch.
- **Tablet**: Same as desktop but minimap is smaller (120x80px).
- **Desktop**: Full layout as wireframed.

---

### 5.3 Topology Graph Page (`/topology`) -- OAV-203

```
+------------------------------------------------------------------+
| [Sidebar] | FULL VIEWPORT GRAPH                                  |
|           |                                                       |
|           |  [Legend Bar - top overlay]                           |
|           |  | [--- delegates] [- - - shared session] [=> data] |
|           |                                                       |
|           |  +-- ReactFlow Canvas (fills viewport) -----------+  |
|           |  |                                                 |  |
|           |  |    (Node)----->(Node)                           |  |
|           |  |      |        / |                               |  |
|           |  |      v      /   v                               |  |
|           |  |    (Node)<-   (Node)---->(Node)                 |  |
|           |  |                            |                    |  |
|           |  |    (Node)- - - - -(Node)   |                    |  |
|           |  |                            v                    |  |
|           |  |                          (Node)                 |  |
|           |  +------+------------------------------------------+  |
|           |         |                                             |
|           |         | [Auto Layout] [Zoom Fit] [Zoom +/-]        |
|           |                                                       |
|           |  +-- Detail Panel (right side, 320px, when open) --+ |
|           |  | [Close X]                                        | |
|           |  | Agent: ProcessorBot                              | |
|           |  | Level: 5 (Expert)  Status: Active                | |
|           |  | XP: 7,250  Tasks: 342  Cost: $45.20             | |
|           |  | Connected Agents: 4                              | |
|           |  | [View Full Profile ->]                           | |
|           |  +--------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### ReactFlow Node Design

Each node renders as a custom React component inside ReactFlow:

```
+-- Agent Node (custom ReactFlow node) ----+
| [Level Ring] [Avatar] [Status Dot]       |
|          Agent Name                       |
|          Lv 5 - Expert                    |
+------------------------------------------+
```

- Node size: 160x80px
- Background: `bg-oav-surface border border-oav-border rounded-xl`
- Selected node: `border-oav-accent ring-2 ring-oav-accent/30`

#### Edge Styles

| Relationship Type | Style | Color | Arrow |
|------------------|-------|-------|-------|
| `delegates_to` | Solid, 2px | `#3b82f6` (accent) | Directed arrow at target |
| `shared_session` | Dashed, 1px | `#94a3b8` (muted) | No arrow (bidirectional) |
| `data_flow` | Solid, 2px | `#a855f7` (purple) | Directed arrow at target |

#### Edge Popover (on edge click)

```
+-- Edge Popover (floating) -----------+
| Relationship: delegates_to           |
| Event Count: 47                      |
| First Interaction: 2026-03-15 09:00  |
| Last Interaction: 2026-03-27 14:30   |
+--------------------------------------+
```

- Background: `bg-oav-surface border border-oav-border rounded-lg shadow-lg p-3`
- Anchored to the midpoint of the clicked edge

#### Controls Bar (bottom-center)

- "Auto Layout": Re-runs the dagre/elkjs layout algorithm
- "Zoom Fit": Fits all nodes in viewport
- "Zoom +/-": Standard ReactFlow zoom controls

#### Responsive Behavior

- **Mobile**: Full viewport graph. Detail panel opens as bottom sheet (half screen height). Legend hidden behind info button.
- **Tablet**: Full viewport. Detail panel slides in from right, 280px wide.
- **Desktop**: Detail panel 320px, pushes graph left.

---

### 5.4 Agent Detail Page (`/agents/:agentId`) -- OAV-212

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | [Breadcrumb: Dashboard > Agent Detail > ProcessorBot] |
|           |                                                       |
|           | +-- Profile Header (full width) --------------------+ |
|           | | [Avatar]  ProcessorBot           [Status: Active]  | |
|           | | [Lv Ring] Role: Data Processor   [green badge]     | |
|           | |           Framework: LangChain                     | |
|           | |                                                    | |
|           | | Level 5 - Expert   XP: 7,250 / 12,000             | |
|           | | [======================-------]                     | |
|           | |                                                    | |
|           | | Tokens: 1.2M   Cost: $45.20   Created: Mar 10     | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Tab Bar -----------------------------------------+ |
|           | | [Events] [State Machine] [Achievements]            | |
|           | | [Sessions] [XP History]                            | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Tab Content (varies by tab) ---------------------+ |
|           | |                                                    | |
|           | | (See sub-wireframes below)                         | |
|           | |                                                    | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Sidebar Panel (desktop only, 280px) ------------+ |
|           | | Cost Sparkline (7-day, Recharts)                   | |
|           | | Quick Stats:                                       | |
|           | |   Tasks Completed: 342                             | |
|           | |   Error Rate: 2.1%                                 | |
|           | |   Avg Latency: 1.2s                                | |
|           | |   Current Streak: 8                                | |
|           | | Live Update Indicator:                              | |
|           | |   [green dot] Receiving live events                 | |
|           | +----------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### Tab: Events

```
+-- Event Timeline ------------------------------------------------+
| [Filter: All Types v]  [Search events...]                        |
|                                                                   |
| 14:32:15  [task_completed] Processed batch #47                   |
|           +100 XP awarded                                         |
|                                                                   |
| 14:31:02  [state_change] idle -> active                          |
|                                                                   |
| 14:30:45  [xp_awarded] +25 XP (first_event_of_day)              |
|                                                                   |
| 14:28:10  [task_started] Processing batch #47                    |
|                                                                   |
| ... (virtual scrolled, last 100 events)                          |
+------------------------------------------------------------------+
```

- Each event row: `flex items-start gap-3 py-2 border-b border-oav-border`
- Timestamp: `text-xs font-mono text-oav-muted w-20 shrink-0`
- Event type badge: `text-xs px-2 py-0.5 rounded-full bg-oav-bg text-oav-accent`
- Description: `text-sm text-oav-text`
- New events prepend with a brief highlight: `bg-oav-accent/10` fading to transparent over 2s

#### Tab: State Machine

```
+-- FSM Diagram ---------------------------------------------------+
|                                                                   |
|    [idle] ---ACTIVATE---> [active] ---COMPLETE---> [complete]    |
|      ^                      |   ^                      |          |
|      |                      |   |                      |          |
|    RESET                  ERROR  RESUME              RESET        |
|      |                      |   |                      |          |
|      +---[complete]   [error]   [waiting]<---WAIT------+          |
|                                                                   |
|  Current State: [ACTIVE] (highlighted green)                     |
|                                                                   |
|  Recent Transitions:                                              |
|  14:31:02  idle -> active     (ACTIVATE)                          |
|  14:28:10  complete -> idle   (RESET)                             |
|  14:25:33  active -> complete (COMPLETE)                          |
|  ... (last 10)                                                    |
+------------------------------------------------------------------+
```

- FSM rendered as an SVG or HTML diagram (not PixiJS -- this is a dashboard component)
- States: Rounded rectangles with colored borders matching state colors
- Current state: Filled background with state color, bold label
- Transitions: Lines with arrow heads, labeled with event name
- Transition history: Table below the diagram

#### Tab: Achievements

```
+-- Achievements --------------------------------------------------+
|                                                                   |
| EARNED (3)                                                        |
| [Footprint] First Steps    Unlocked Mar 11, 2026    +50 XP      |
| [Shield]    Centurion      Unlocked Mar 20, 2026    +500 XP     |
| [Lightning] Speed Demon    Unlocked Mar 25, 2026    +300 XP     |
|                                                                   |
| LOCKED (7)                                                        |
| [Coin-gray]    Penny Pincher    32/50 tasks under median cost    |
| [Anvil-gray]   Iron Will        7/10 error recoveries           |
| [Clock-gray]   Marathon Runner  18/24 hours session time         |
| [Handshake-gray] Team Player    3/5 relationship edges          |
| [Star-gray]    Perfect Streak   Best: 6/10 consecutive          |
| [Moon-gray]    Night Owl        12/50 night tasks               |
| [Flag-gray]    Trailblazer      Reach Level 5 first (not first) |
+------------------------------------------------------------------+
```

- Earned badges: Full color icon, name, unlock date, XP bonus
- Locked badges: Grayed-out icon, name, progress bar showing current/target
- Layout: `grid grid-cols-1 md:grid-cols-2 gap-3`
- Each badge card: `bg-oav-surface border border-oav-border rounded-lg p-3 flex items-center gap-3`
- Locked: `opacity-60`

#### Tab: Sessions

```
+-- Sessions Table ------------------------------------------------+
| Session ID    | Start Time      | End Time        | Duration | Status    |
|---------------|-----------------|-----------------|----------|-----------|
| ses_abc123    | Mar 27 14:00    | Mar 27 14:32   | 32m      | Completed |
| ses_def456    | Mar 27 10:15    | Mar 27 10:45   | 30m      | Completed |
| ses_ghi789    | Mar 26 22:00    | Mar 26 23:10   | 1h 10m   | Error     |
| ... (last 20)                                                            |
+--------------------------------------------------------------------------+
```

- Table: `w-full text-sm`
- Header: `text-xs text-oav-muted uppercase tracking-wider`
- Rows: `hover:bg-oav-surface-hover cursor-pointer`
- Click row: Navigate to `/sessions/:sessionId`
- Status column: Colored badge (green for completed, red for error)

#### Tab: XP History

```
+-- XP Transactions -----------------------------------------------+
| Time            | Amount  | Reason                                |
|-----------------|---------|---------------------------------------|
| Mar 27 14:32    | +100    | task_completed                        |
| Mar 27 14:30    | +25     | first_event_of_day                    |
| Mar 27 14:25    | +150    | task_completed_fast                   |
| Mar 27 14:20    | +300    | streak_3 bonus                        |
| ... (last 50, virtual scrolled)                                   |
+-------------------------------------------------------------------+
```

- Amount column: Green text (`text-oav-success`) for positive
- Reason column: `text-oav-muted`, maps to human-readable label

#### Responsive Behavior

- **Mobile**: Profile header stacks vertically. Tab bar scrolls horizontally. Sidebar panel moves below tab content. Single-column layouts for all tabs.
- **Tablet**: Profile header in 2 columns (avatar+name left, stats right). Tab content full width. Sidebar panel below.
- **Desktop**: 3-column layout. Profile header full width (span all 3 cols). Tab content spans cols 1-2 (8 of 12 grid cols). Sidebar panel is col 3 (4 of 12 grid cols).

---

### 5.5 Leaderboard Page (`/leaderboard`) -- OAV-213

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | Leaderboard                                           |
|           |                                                       |
|           | +-- Controls Row -----------------------------------+ |
|           | | Period: [Daily v] [Weekly] [Monthly] [All Time]    | |
|           | | Category: [XP v] [Tasks] [Cost Eff.] [Streaks]    | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Champion Card (top agent, special treatment) ---+ |
|           | | [Crown Icon]                                       | |
|           | | [Large Avatar] [Level Ring]                        | |
|           | | AgentName - Level 7 Grandmaster                    | |
|           | | 42,500 XP  |  8 Achievements  |  Trend: +3        | |
|           | | [Gold background, border-oav-gold]                 | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Ranked List ------------------------------------+ |
|           | | #2  [Avatar] AgentName  Lv5 Expert  12,500 XP  ^3 | |
|           | | #3  [Avatar] AgentName  Lv4 Spec.   11,200 XP  -1 | |
|           | | #4  [Avatar] AgentName  Lv4 Spec.    9,800 XP  =  | |
|           | | #5  [Avatar] AgentName  Lv3 Oper.    8,400 XP  ^1 | |
|           | | ...                                                 | |
|           | | (virtual scrolled for 50+ agents)                  | |
|           | +----------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### Controls Row

- Period selector: Segmented button group (toggle buttons)
  - Tailwind: `flex rounded-lg overflow-hidden border border-oav-border`
  - Active: `bg-oav-accent text-white`
  - Inactive: `bg-oav-surface text-oav-muted hover:text-oav-text`
- Category selector: Same pattern, second row on mobile
- Layout: `flex flex-col md:flex-row md:items-center md:justify-between gap-3`

#### Champion Card

- Background: `bg-gradient-to-r from-oav-gold/20 to-transparent border border-oav-gold/40 rounded-xl p-6`
- Crown icon: SVG, 24x24, `text-oav-gold`
- Avatar: 64x64px with level ring
- Name: `text-lg font-bold text-oav-text`
- Label: "Champion" badge `bg-oav-gold/20 text-oav-gold text-xs px-2 py-0.5 rounded-full`

#### Ranked Agent Rows

- Each row: `flex items-center gap-4 px-4 py-3 border-b border-oav-border hover:bg-oav-surface-hover cursor-pointer`
- Rank: `text-lg font-bold text-oav-muted w-10`
- Avatar: 36x36px with level ring miniature
- Name + level: `text-sm font-medium text-oav-text` / `text-xs text-oav-muted`
- XP: `text-sm font-bold text-oav-text`
- Achievement count: `text-xs text-oav-muted`
- Trend arrow:
  - Up: `text-oav-success` with up-arrow icon
  - Down: `text-oav-error` with down-arrow icon
  - Same: `text-oav-muted` with dash icon
- Click row: Navigate to `/agents/:agentId`

#### Rank Animation

When a rank change event arrives via WebSocket:
1. The affected row slides to its new position (GSAP `y` tween, 400ms, ease-out)
2. A brief highlight appears (`bg-oav-accent/10` for 1.5s, then fades)
3. Trend arrow updates

#### Virtual Scrolling

- For lists exceeding 20 items, use `@tanstack/react-virtual` (or equivalent)
- Only render visible rows + 5 above/below for smooth scrolling
- Total list height calculated from entry count

#### Responsive Behavior

- **Mobile**: Controls stack vertically. Champion card full width, compact. List rows hide achievement count column.
- **Tablet**: Controls in one row. Champion card full width. Full row details.
- **Desktop**: Controls in one row. Champion card centered, max-width 640px. Full table layout.

---

### 5.6 Analytics Page (`/analytics`) -- OAV-214

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | Analytics                                             |
|           |                                                       |
|           | +-- Filter Row -------------------------------------+ |
|           | | Time: [24h] [7d] [30d] [Custom...]                 | |
|           | | Agent: [All Agents v]        [Export CSV]           | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Chart Grid (responsive) ------------------------+ |
|           | | [Cost Over Time      ] [Token Usage             ]  | |
|           | | [Line chart, 30 days ] [Stacked area, prompt/comp] | |
|           | | [h-60                ] [h-60                      ] | |
|           | +----------------------------------------------------+ |
|           | | [Latency Distribution] [Request Count Over Time  ]  | |
|           | | [Histogram/bar       ] [Bar chart                ] | |
|           | | [h-60                ] [h-60                      ] | |
|           | +----------------------------------------------------+ |
|           | | [Cost Per Agent                                   ]  | |
|           | | [Horizontal bar chart, full width                 ] | |
|           | | [h-80                                              ] | |
|           | +----------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### Filter Row

- Time range: Segmented button group (same as leaderboard period selector)
- "Custom" opens a date range picker (popover with two date inputs)
- Agent dropdown: `select` with all workspace agents + "All Agents" option
- Export CSV button: `bg-oav-surface border border-oav-border rounded-lg px-3 py-1.5 text-sm text-oav-text hover:bg-oav-surface-hover`
- Layout: `flex flex-wrap items-center gap-3`

#### Chart Cards

- Each chart: `bg-oav-surface border border-oav-border rounded-xl p-4`
- Chart title: `text-sm font-medium text-oav-muted mb-3`
- Recharts `ResponsiveContainer` fills card
- Tooltip: Custom styled to match theme (dark bg, white text)
- Grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`
  - Cost per Agent chart spans full width below the grid

#### Recharts Theming

All Recharts components share these color tokens:
- Grid: `stroke="#2d3748"` (oav-border)
- Axis labels: `fill="#94a3b8"` (oav-muted), `fontSize={12}`
- Tooltip bg: `backgroundColor="#1e2433"` (oav-surface)
- Line/Area colors: `#3b82f6` (accent), `#a855f7` (purple), `#22c55e` (success)
- Cursor: `stroke="#94a3b8"`

#### Responsive Behavior

- **Mobile**: All charts stacked in single column. Filter row wraps.
- **Tablet**: 2-column chart grid.
- **Desktop (1440px+)**: 2 columns for paired charts, full-width for cost per agent.

---

### 5.7 Alerts Page (`/alerts`) -- OAV-215

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | Alerts                                                |
|           |                                                       |
|           | +-- Critical Banner (if any unresolved critical) ---+ |
|           | | [!] 2 critical alerts require attention   [View]   | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Filter & Action Bar ----------------------------+ |
|           | | Severity: [All v] Status: [Unresolved v]           | |
|           | | [Resolve Selected (3)]                              | |
|           | +----------------------------------------------------+ |
|           |                                                       |
|           | +-- Alert Table ------------------------------------+ |
|           | | [x] Sev  | Title          | Agent    | Time    | St||
|           | | [x] [!!] | High latency   | Bot-A    | 14:32   | * ||
|           | | [ ] [!]  | Cost spike     | Bot-B    | 14:20   | * ||
|           | | [ ] [i]  | New session    | Bot-C    | 14:15   | v ||
|           | | ... (all alerts, paginated or virtual scrolled)    | |
|           | +----------------------------------------------------+ |
+------------------------------------------------------------------+
```

#### Filter Bar

- Severity dropdown: Options: All, Critical, Warning, Info
- Status dropdown: Options: All, Unresolved, Resolved
- Bulk resolve button: Appears when 1+ checkboxes selected, `bg-oav-accent text-white rounded-lg px-4 py-1.5 text-sm`
- Layout: `flex flex-wrap items-center gap-3`

#### Alert Table

- Table: `w-full text-sm`
- Checkbox column: `w-10`, `<input type="checkbox">`
- Severity column: `w-12`, icon only
  - Critical: Red circle with `!` (`text-oav-error`)
  - Warning: Amber triangle (`text-oav-warning`)
  - Info: Blue info circle (`text-oav-accent`)
- Title: `text-oav-text font-medium`
- Agent: `text-oav-muted`, link to agent detail
- Time: `text-xs text-oav-muted`
- Status: Green check (resolved) or red dot (unresolved)
- Resolve action: On unresolved rows, "Resolve" button appears on hover

#### Real-time Update

- New alert from WebSocket: Prepends to table with `bg-oav-accent/10` highlight that fades over 2s via CSS transition
- Sound: No audible notification (can be added in settings as Sprint 3 enhancement)

#### Responsive Behavior

- **Mobile**: Table replaced with card-based list (each alert as a card). No checkboxes, resolve per-card.
- **Tablet**: Table with horizontal scroll if needed.
- **Desktop**: Full table layout.

---

### 5.8 Sessions Page (`/sessions`) -- OAV-216

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA                                         |
|           |                                                       |
|           | Sessions                                              |
|           |                                                       |
|           | +-- Session List ----+ +-- Session Detail -----------+|
|           | | (280px, scrollable) | | (fills remaining width)    ||
|           | |                     | |                             ||
|           | | [ses_abc123]        | | Session: ses_abc123         ||
|           | |  Bot-A, 32m, Done  | | Agent: ProcessorBot         ||
|           | |                     | | Duration: 32 minutes        ||
|           | | [ses_def456]  <--   | |                             ||
|           | |  Bot-B, 30m, Done   | | +-- Playback Controls ----+||
|           | |                     | | | [|<] [>] [||] [Speed: 1x]|||
|           | | [ses_ghi789]        | | | [=====O----------] 14:15 |||
|           | |  Bot-A, 1h10m, Err  | | +--------------------------+||
|           | |                     | |                             ||
|           | | ...                 | | +-- Event Timeline --------+||
|           | |                     | | | 14:00:01 [state_change]  |||
|           | |                     | | |   idle -> active          |||
|           | |                     | | | 14:00:05 [task_started]  |||
|           | |                     | | |   Batch #47               |||
|           | |                     | | | 14:15:30 [task_completed]|||
|           | |                     | | |   +100 XP                 |||
|           | |                     | | | ...                       |||
|           | |                     | | +--------------------------+||
|           | |                     | |                             ||
|           | |                     | | [Canvas Sync: OFF toggle]  ||
|           | +---------------------+ +----------------------------+|
+------------------------------------------------------------------+
```

#### Session List (left panel)

- Width: 280px on desktop, full width on mobile (session list is top, detail below)
- Each session card: `px-4 py-3 border-b border-oav-border cursor-pointer hover:bg-oav-surface-hover`
- Selected: `bg-oav-surface-active border-l-2 border-oav-accent`
- Shows: Session ID (truncated), agent name, duration, status badge

#### Playback Controls

- Background: `bg-oav-surface border border-oav-border rounded-xl p-4`
- Buttons: Skip to start (`|<`), Play/Pause (`>` / `||`), speed selector
- Speed: `0.5x`, `1x`, `2x`, `5x` -- select dropdown
- Timeline scrubber: HTML range input, `accent-oav-accent`, full width
- Current position indicator: `text-xs text-oav-muted`

#### Event Timeline

- Each event: Same design as Agent Detail Events tab
- Clicking an event opens a detail panel (overlay or below):
  - Full JSON payload with syntax highlighting
  - Background: `bg-oav-bg rounded-lg p-3 text-xs font-mono`
  - Syntax highlight: keys in `text-oav-accent`, strings in `text-oav-success`, numbers in `text-oav-purple`

#### Canvas Sync Toggle

- Toggle switch at bottom of session detail
- When ON: The PixiJS canvas (if open in another tab or split view) replays the agent's state transitions in sync with the timeline
- Default: OFF (per open question #4 decision -- separate timeline view with optional canvas sync)
- Label: `text-sm text-oav-muted`

#### Responsive Behavior

- **Mobile**: Session list and session detail are separate views. Tap session in list, detail fills screen with back button.
- **Tablet**: Session list as collapsible drawer (left), detail fills remaining.
- **Desktop**: Split view as wireframed.

---

### 5.9 Settings Page (`/settings`) -- OAV-217

```
+------------------------------------------------------------------+
| [Sidebar] | CONTENT AREA (centered, max-w-2xl)                   |
|           |                                                       |
|           | Settings                                              |
|           |                                                       |
|           | +-- Workspace Section ----------------------------+   |
|           | | Workspace Name: [My Workspace          ] [Save]  |   |
|           | | Slug: my-workspace                                |   |
|           | | Created: March 10, 2026                           |   |
|           | | Members: 3 (admin-only info)                      |   |
|           | +------------------------------------------------+   |
|           |                                                       |
|           | +-- API Keys Section -----------------------------+   |
|           | | [+ Create API Key]                                |   |
|           | |                                                    |   |
|           | | Name        | Key Prefix | Created     | Status  |   |
|           | | Production  | oav_sk_... | Mar 15      | Active  |   |
|           | |                                      [Revoke]     |   |
|           | | Development | oav_sk_... | Mar 10      | Revoked |   |
|           | |                                                    |   |
|           | +------------------------------------------------+   |
|           |                                                       |
|           | +-- Create Key Modal (overlay) -------------------+   |
|           | | Create API Key                                   |   |
|           | | Name: [________________]                          |   |
|           | | [Cancel] [Create]                                 |   |
|           | |                                                    |   |
|           | | (After creation:)                                  |   |
|           | | Your API Key (copy now, shown once):              |   |
|           | | [oav_sk_abc123...xyz789] [Copy]                   |   |
|           | | [!] This key will not be shown again.             |   |
|           | | [Done]                                             |   |
|           | +------------------------------------------------+   |
+------------------------------------------------------------------+
```

#### Workspace Section

- Editable name field: `bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-oav-text`
- Save button: `bg-oav-accent text-white rounded-lg px-4 py-1.5 text-sm`
- Read-only fields: `text-oav-muted text-sm`
- Admin check: Non-admin users see fields as read-only with tooltip "Admin access required" on hover

#### API Keys Table

- Standard table with `text-sm`
- Key prefix: `font-mono text-oav-muted`
- Status: Green "Active" badge or gray "Revoked" badge
- Revoke button: `text-oav-error text-xs hover:underline`
- Revoke confirmation: Inline confirmation "Are you sure? [Yes, Revoke] [Cancel]"

#### Create Key Modal

- Overlay: `fixed inset-0 bg-black/50 flex items-center justify-center z-50`
- Modal: `bg-oav-surface border border-oav-border rounded-xl p-6 w-full max-w-md`
- After creation: Key displayed in `bg-oav-bg rounded-lg p-3 font-mono text-sm break-all`
- Copy button: Copies to clipboard, shows "Copied!" for 2s
- Warning: `text-oav-warning text-xs`

#### Responsive Behavior

- **Mobile/Tablet/Desktop**: Same single-column centered layout, `max-w-2xl mx-auto`. Works at all sizes.

---

## 6. Interaction Flows

### 6.1 Agent Canvas Navigation

**Pan (mouse/touch):**
1. User clicks and holds on empty canvas space (not on an agent)
2. Cursor changes to grabbing hand
3. User drags -- canvas viewport pans in drag direction
4. On release, canvas stays at new position (no inertia in Sprint 2)
5. Touch: Two-finger drag pans

**Zoom (mouse wheel / pinch):**
1. User scrolls mouse wheel (or pinches on touch)
2. Canvas zooms toward cursor position (zoom center = cursor)
3. Zoom range: 0.25x to 4x (clamped)
4. Zoom level indicator updates in bottom-right controls
5. Keyboard: `+` and `-` keys zoom in/out, centered on viewport

**Select agent (single-click):**
1. User clicks on an agent avatar sprite
2. Agent sprite gets selection ring (2px `oav-accent` outline, pulsing)
3. Tooltip appears anchored above the sprite
4. Other agents dim slightly (opacity 0.7)
5. Click on empty space or press `Escape` to deselect

**Inspect agent (double-click):**
1. User double-clicks an agent avatar
2. Navigation: `router.push(/agents/${agentId})`
3. Full Agent Detail page opens

**Filter agents:**
1. User opens filter bar (always visible on desktop, toggle on mobile)
2. User types in search field -- filters agents by name (substring match)
3. User selects status from dropdown -- hides non-matching agents (PixiJS `sprite.visible = false`)
4. User selects level range -- same behavior
5. Canvas does not re-layout; hidden agents simply become invisible
6. Filter chip appears below filter bar showing active filters with `x` to clear each

### 6.2 Real-Time Update Flow

```
Backend Event Ingestion
    |
    v
WebSocket Server (Redis Pub/Sub)
    |
    v
WebSocket Client (useWebSocket hook)
    |
    +---> Zustand Agent Store (upsertAgent / setAgentStatus)
    |         |
    |         +---> PixiJS Canvas (WorldRenderer.syncAgents)
    |         |         - Update sprite tint, ring, status dot
    |         |         - Trigger GSAP animation if state changed
    |         |
    |         +---> Dashboard AgentCard (React re-render)
    |         +---> Agent Detail Page (React re-render)
    |
    +---> Zustand Gamification Store (NEW)
    |         |
    |         +---> XP awarded: floating "+N XP" animation on canvas
    |         +---> Level up: GSAP scale pulse + particle burst + toast
    |         +---> Achievement unlock: badge slide-in animation
    |         +---> Rank change: leaderboard row animation
    |
    +---> Zustand Alert Store (addAlert)
    |         +---> Alert page prepend
    |         +---> Alert badge count in sidebar
    |
    +---> Zustand Metrics Store (updateLiveMetrics)
              +---> Dashboard chart live delta
```

**Batching:** When multiple events arrive within the same animation frame (< 16.67ms), they are batched:
1. WebSocket `onmessage` pushes events to a buffer array
2. `requestAnimationFrame` drains the buffer once per frame
3. Zustand updates are batched via `set()` with merged state
4. PixiJS re-renders once per frame via its Ticker

**Reconnection Flow:**
1. WebSocket `onclose` fires
2. UI shows "Reconnecting..." indicator (red dot in connection status)
3. Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
4. On reconnect: Client sends `{"action": "subscribe", "room": "workspace:{id}"}`
5. Client requests full state sync: `GET /api/agents/?workspace_id={id}`
6. Zustand store replaces agent list
7. UI shows "Connected" (green dot)

### 6.3 Topology Graph Interaction

**Node click:**
1. User clicks a node (agent) in the ReactFlow graph
2. Node gets selection styling: blue border ring
3. Detail panel slides in from the right (320px, 300ms slide animation)
4. Panel shows agent summary: name, level, status, XP, task count, cost
5. "View Full Profile" link navigates to Agent Detail page

**Edge hover:**
1. User hovers over an edge
2. Edge increases width from 2px to 4px and brightens
3. Edge label becomes visible (normally hidden to reduce clutter)

**Edge click:**
1. User clicks an edge
2. Popover appears at the midpoint of the edge
3. Shows: relationship type, event count, first/last interaction timestamps
4. Click elsewhere or press Escape to dismiss

**Live update:**
1. New relationship data arrives via WebSocket
2. ReactFlow nodes and edges update incrementally (no full re-render)
3. New edges animate in: opacity 0 to 1 over 300ms
4. Removed edges animate out: opacity 1 to 0 over 300ms

### 6.4 Session Replay Interaction

**Select session:**
1. User clicks a session in the session list (left panel)
2. Session detail loads in the right panel
3. Event timeline populates with all events for that session
4. Playback controls become active
5. Timeline scrubber shows the full time range of the session

**Play/Pause:**
1. User clicks Play button
2. Events play back sequentially at the selected speed
3. Current event is highlighted in the timeline (blue left border)
4. Timeline scrubber thumb advances
5. If Canvas Sync is ON, the agent avatar transitions through states on the PixiJS canvas
6. Click Pause to stop playback; resume from current position

**Timeline scrubbing:**
1. User drags the timeline scrubber thumb
2. Playback jumps to the nearest event at that timestamp
3. Timeline scrolls to show the current event
4. If playing, playback continues from the new position

**Speed adjustment:**
1. User selects speed from dropdown: 0.5x, 1x, 2x, 5x
2. Playback interval adjusts: `(event_time_delta / speed)`
3. Display updates: "Playing at 2x"

**Event detail inspection:**
1. User clicks an event row in the timeline
2. Event detail panel expands below the event row (accordion-style)
3. Full JSON payload displayed with syntax highlighting
4. Click again to collapse

### 6.5 Leaderboard Interaction

**Period toggle:**
1. User clicks a period button (Daily, Weekly, Monthly, All-Time)
2. Active button gets accent background
3. Leaderboard re-fetches: `GET /api/gamification/leaderboard?period=weekly`
4. List re-renders with new rankings
5. If ranks changed from previous view, rows animate to new positions

**Category switch:**
1. User clicks a category button (XP, Tasks, Cost Efficiency, Streaks)
2. List re-fetches with `?category=cost_efficiency`
3. Column header updates to show the sorted metric
4. Smooth crossfade: old list fades out (100ms), new list fades in (200ms)

**Agent drill-down:**
1. User clicks any agent row
2. Navigation: `router.push(/agents/${agentId})`

**Real-time rank update:**
1. WebSocket delivers `rank_change` event
2. Affected row slides up or down to new position (GSAP, 400ms)
3. Trend arrow updates (green up / red down)
4. Brief highlight on the moved row

### 6.6 Alert Lifecycle

**New alert arrives (WebSocket):**
1. Alert event arrives via WebSocket
2. Alert prepends to the list with highlight animation (`bg-oav-accent/10` fading over 2s)
3. Sidebar alert badge count increments (red badge with number)
4. If critical: Critical banner appears/updates at top of alert page

**Acknowledge (view):**
1. User sees the alert in the list (implicit acknowledgment)
2. No explicit acknowledge action in Sprint 2 (deferred)

**Resolve single:**
1. User clicks "Resolve" button on an alert row
2. API call: `PUT /api/alerts/{id}` with `resolved: true`
3. Row updates: status changes to green "Resolved" badge
4. Button changes from "Resolve" to "Resolved" (disabled)
5. If it was the last critical alert, critical banner dismisses

**Resolve bulk:**
1. User selects multiple alerts via checkboxes
2. "Resolve Selected (N)" button appears in the action bar
3. User clicks button
4. API call: batch resolve
5. All selected rows update to resolved
6. Checkboxes clear, button disappears

---

## 7. Component Hierarchy

### 7.1 App Shell (updated)

```
App
+-- LoginPage                          (route: /login)
+-- AppShell                           (authenticated wrapper)
    +-- Sidebar
    |   +-- SidebarLogo
    |   +-- SidebarNavItem (x9)        (one per page)
    |   +-- SidebarAlertBadge          (unresolved alert count)
    |   +-- SidebarUserMenu
    |       +-- UserAvatar
    |       +-- LogoutButton
    +-- MobileTabBar (mobile only)
    |   +-- TabBarItem (x5)
    |   +-- MoreMenu
    +-- Breadcrumb
    +-- ConnectionStatusIndicator       (WebSocket status)
    +-- <Outlet>                        (React Router, renders active page)
    +-- NotificationLayer (z-50)
        +-- LevelUpToast (0-N)
        +-- AchievementToast (0-N)
        +-- XPFloatingText (0-N)
```

### 7.2 Dashboard Page

```
DashboardPage
+-- SummaryStatsRow
|   +-- StatCard (x4)
|       - "Total Agents"
|       - "Active Now" (with PulsingDot)
|       - "Total XP Earned"
|       - "Total Cost"
+-- AgentGrid
|   +-- AgentCard (x N)
|       +-- AgentStatusDot
|       +-- LevelBadge
|       +-- XPProgressBar
|       +-- LastActiveLabel
+-- ChartsRow
|   +-- ChartCard (wrapper)
|   |   +-- CostLineChart (Recharts)
|   +-- ChartCard (wrapper)
|       +-- TokenAreaChart (Recharts)
+-- MiniLeaderboard
    +-- LeaderboardRow (x5)
    +-- ViewFullLeaderboardLink
```

### 7.3 Agent Canvas Page

```
VirtualWorldPage
+-- CanvasFilterBar
|   +-- SearchInput
|   +-- StatusFilterDropdown
|   +-- LevelFilterDropdown
|   +-- ActiveFilterChips
+-- WorldCanvas (PixiJS)
|   +-- (PixiJS scene graph -- not React components)
|       WorldRenderer
|       +-- IsoGrid
|       +-- AgentSprite (x N)
|       |   +-- AgentBody (Graphics)
|       |   +-- LevelRing (Graphics)
|       |   +-- StatusDot (Graphics)
|       |   +-- NameLabel (Text)
|       |   +-- AchievementBadges (Container, max 3 + overflow)
|       +-- ParticleLayer (for level-up effects)
+-- AgentTooltip (React overlay, positioned via PixiJS coords)
|   +-- TooltipAvatar
|   +-- TooltipStats
|   +-- TooltipAchievements
+-- CanvasControls (bottom-right overlay)
|   +-- ZoomInButton
|   +-- ZoomOutButton
|   +-- FitButton
|   +-- ConnectionStatus
+-- Minimap (bottom-left overlay)
```

### 7.4 Topology Graph Page

```
TopologyPage
+-- TopologyLegend
+-- ReactFlowCanvas
|   +-- AgentNode (custom ReactFlow node, x N)
|   |   +-- NodeAvatar
|   |   +-- NodeLevelBadge
|   |   +-- NodeStatusDot
|   |   +-- NodeLabel
|   +-- RelationshipEdge (custom ReactFlow edge, x M)
|   +-- EdgePopover (conditional)
|       +-- PopoverRelationshipType
|       +-- PopoverEventCount
|       +-- PopoverTimestamps
+-- TopologyControls (bottom-center)
|   +-- AutoLayoutButton
|   +-- ZoomFitButton
|   +-- ZoomControls
+-- AgentDetailPanel (right side, conditional)
    +-- PanelHeader (name, close button)
    +-- PanelAgentStats
    +-- ViewProfileLink
```

### 7.5 Agent Detail Page

```
AgentDetailPage
+-- Breadcrumb
+-- AgentProfileHeader
|   +-- AgentAvatar (large, with LevelRing)
|   +-- AgentStatusBadge
|   +-- AgentInfoBlock (name, role, framework)
|   +-- LevelDisplay (level number, title, XP bar)
|   +-- AgentMetrics (tokens, cost, created date)
+-- TabNavigation
|   +-- TabButton (x5: Events, State Machine, Achievements, Sessions, XP History)
+-- TabContent (switches by active tab)
|   +-- EventsTab
|   |   +-- EventFilterBar
|   |   +-- EventTimeline
|   |       +-- EventTimelineItem (x N, virtual scrolled)
|   |           +-- EventTimestamp
|   |           +-- EventTypeBadge
|   |           +-- EventDescription
|   +-- StateMachineTab
|   |   +-- FSMDiagram (SVG/HTML, 5 states + transitions)
|   |   +-- CurrentStateHighlight
|   |   +-- TransitionHistory (last 10)
|   +-- AchievementsTab
|   |   +-- EarnedAchievementsList
|   |   |   +-- AchievementCard (earned variant, x N)
|   |   +-- LockedAchievementsList
|   |       +-- AchievementCard (locked variant, x N)
|   |           +-- AchievementProgressBar
|   +-- SessionsTab
|   |   +-- SessionsTable
|   |       +-- SessionRow (x N)
|   +-- XPHistoryTab
|       +-- XPTransactionTable
|           +-- XPTransactionRow (x N)
+-- AgentSidebar (desktop only)
    +-- CostSparkline (Recharts)
    +-- QuickStatsBlock
    +-- LiveUpdateIndicator
```

### 7.6 Leaderboard Page

```
LeaderboardPage
+-- LeaderboardControls
|   +-- PeriodSelector (segmented buttons)
|   +-- CategorySelector (segmented buttons)
+-- ChampionCard (top-ranked agent)
|   +-- CrownIcon
|   +-- ChampionAvatar (large, with LevelRing)
|   +-- ChampionStats
+-- RankedAgentList (virtual scrolled)
    +-- LeaderboardRow (x N)
        +-- RankNumber
        +-- AgentAvatar (small, with LevelRing)
        +-- AgentNameLevel
        +-- XPDisplay
        +-- AchievementCount
        +-- TrendArrow
```

### 7.7 Analytics Page

```
AnalyticsPage
+-- AnalyticsFilterBar
|   +-- TimeRangeSelector (segmented buttons)
|   +-- CustomDateRangePicker (conditional popover)
|   +-- AgentFilterDropdown
|   +-- ExportCSVButton
+-- ChartGrid
    +-- ChartCard ("Cost Over Time")
    |   +-- CostLineChart (Recharts)
    +-- ChartCard ("Token Usage")
    |   +-- TokenAreaChart (Recharts)
    +-- ChartCard ("Latency Distribution")
    |   +-- LatencyHistogram (Recharts)
    +-- ChartCard ("Request Count")
    |   +-- RequestBarChart (Recharts)
    +-- ChartCard ("Cost Per Agent", full-width)
        +-- CostPerAgentHorizontalBar (Recharts)
```

### 7.8 Alerts Page

```
AlertsPage
+-- CriticalAlertBanner (conditional)
+-- AlertFilterBar
|   +-- SeverityFilterDropdown
|   +-- StatusFilterDropdown
|   +-- BulkResolveButton (conditional)
+-- AlertTable
    +-- AlertTableHeader
    +-- AlertTableRow (x N)
        +-- AlertCheckbox
        +-- AlertSeverityIcon
        +-- AlertTitle
        +-- AlertAgentLink
        +-- AlertTimestamp
        +-- AlertStatusBadge
        +-- AlertResolveButton (conditional)
```

### 7.9 Sessions Page

```
SessionsPage
+-- SessionList (left panel)
|   +-- SessionListItem (x N)
|       +-- SessionAgentName
|       +-- SessionDuration
|       +-- SessionStatusBadge
+-- SessionDetail (right panel)
    +-- SessionHeader (ID, agent, duration)
    +-- PlaybackControls
    |   +-- SkipToStartButton
    |   +-- PlayPauseButton
    |   +-- SpeedSelector
    |   +-- TimelineScrubber
    |   +-- PositionIndicator
    +-- SessionEventTimeline
    |   +-- SessionEventItem (x N)
    |       +-- EventTimestamp
    |       +-- EventTypeBadge
    |       +-- EventSummary
    |       +-- EventDetailAccordion (expandable, JSON viewer)
    +-- CanvasSyncToggle
```

### 7.10 Settings Page

```
SettingsPage
+-- WorkspaceSection
|   +-- WorkspaceNameInput
|   +-- WorkspaceSaveButton
|   +-- WorkspaceReadOnlyInfo (slug, created date, member count)
+-- APIKeysSection
    +-- CreateAPIKeyButton
    +-- APIKeyTable
    |   +-- APIKeyRow (x N)
    |       +-- KeyName
    |       +-- KeyPrefix (masked)
    |       +-- KeyCreatedDate
    |       +-- KeyStatusBadge
    |       +-- RevokeButton (with inline confirmation)
    +-- CreateKeyModal (overlay, conditional)
        +-- KeyNameInput
        +-- CreateButton / CancelButton
        +-- NewKeyDisplay (after creation)
            +-- KeyValue (mono, selectable)
            +-- CopyButton
            +-- WarningMessage
```

---

## 8. State Management Map

### 8.1 Zustand Store Architecture

Sprint 2 requires expanding the existing 4 stores and adding 2 new stores.

#### Store: `useAgentStore` (existing, enhanced)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `agents` | `Record<string, Agent>` | All agents in workspace, keyed by ID | DashboardPage, AgentGrid, WorldCanvas, TopologyPage, LeaderboardPage |
| `positions` | `Record<string, AgentPosition>` | Agent canvas positions | WorldCanvas |
| `upsertAgent(agent)` | action | Add or update an agent | WebSocket handler |
| `setAgentStatus(id, status)` | action | Update agent state | WebSocket handler |
| `setAgentPosition(pos)` | action | Update canvas position | WorldCanvas (force layout) |
| `removeAgent(id)` | action | **NEW** Remove agent from store | WebSocket handler (agent deleted) |
| `reset()` | action | Clear all agents | Logout |

#### Store: `useUIStore` (existing, enhanced)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `selectedAgentId` | `string | null` | Currently selected agent (canvas or topology) | AgentTooltip, AgentDetailPanel, TopologyPage |
| `isPanelOpen` | `boolean` | Whether the slide-in detail panel is open | AppShell |
| `zoomLevel` | `number` | Canvas zoom level | WorldCanvas, CanvasControls |
| `sidebarExpanded` | `boolean` | **NEW** Whether sidebar is in expanded mode | Sidebar |
| `activeTab` | `string` | **NEW** Active tab on Agent Detail page | AgentDetailPage tabs |
| `canvasFilters` | `CanvasFilters` | **NEW** Active canvas filters (search, status, level) | CanvasFilterBar, WorldCanvas |
| `selectAgent(id)` | action | Select an agent | Canvas click, topology click |
| `setZoom(level)` | action | Set zoom level (clamped 0.25--4.0) | Canvas controls |
| `setSidebarExpanded(expanded)` | action | **NEW** Toggle sidebar | Sidebar toggle |
| `setActiveTab(tab)` | action | **NEW** Switch agent detail tab | Tab buttons |
| `setCanvasFilters(filters)` | action | **NEW** Update canvas filters | Filter bar |

#### Store: `useMetricsStore` (existing, no changes)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `costSummary` | `CostSummary | null` | Cost summary from API | DashboardPage |
| `liveCostDelta` | `number` | Accumulated live cost changes | DashboardPage |
| `liveTokenDelta` | `number` | Accumulated live token changes | DashboardPage |

#### Store: `useAlertStore` (existing, enhanced)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `alerts` | `AlertType[]` | All alerts | AlertsPage, Sidebar badge |
| `selectedAlertIds` | `Set<string>` | **NEW** Checked alerts for bulk action | AlertsPage |
| `addAlert(alert)` | action | Prepend new alert | WebSocket handler |
| `resolveAlert(id)` | action | Mark alert resolved | AlertsPage resolve button |
| `setAlerts(alerts)` | action | Replace all alerts | Initial fetch |
| `toggleSelectAlert(id)` | action | **NEW** Toggle checkbox selection | AlertsPage checkboxes |
| `clearSelection()` | action | **NEW** Clear all selections | After bulk resolve |
| `unresolved count` | derived | Count of `!resolved` alerts | Sidebar badge |

#### Store: `useGamificationStore` (NEW)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `leaderboard` | `LeaderboardEntry[]` | Current leaderboard data | LeaderboardPage, MiniLeaderboard |
| `leaderboardPeriod` | `string` | Active period filter | LeaderboardPage |
| `leaderboardCategory` | `string` | Active category filter | LeaderboardPage |
| `achievements` | `Record<string, Achievement[]>` | Achievements by agent ID | AgentDetailPage Achievements tab |
| `achievementDefinitions` | `AchievementDef[]` | All 10 achievement definitions | AgentDetailPage locked badges |
| `pendingToasts` | `GamificationToast[]` | Queue of level-up and achievement toasts | NotificationLayer |
| `setLeaderboard(entries)` | action | Replace leaderboard data | API fetch |
| `setPeriod(period)` | action | Change period filter | LeaderboardPage |
| `setCategory(category)` | action | Change category filter | LeaderboardPage |
| `setAchievements(agentId, list)` | action | Set agent achievements | API fetch |
| `setDefinitions(defs)` | action | Set achievement definitions | API fetch (once) |
| `enqueueToast(toast)` | action | Add toast to queue | WebSocket handler |
| `dequeueToast()` | action | Remove first toast | NotificationLayer (after display) |
| `updateRank(agentId, newRank)` | action | Animate rank change | WebSocket handler |

#### Store: `useSessionStore` (NEW)

| Field | Type | Description | Subscribers |
|-------|------|-------------|------------|
| `sessions` | `Session[]` | Session list | SessionsPage list |
| `selectedSessionId` | `string | null` | Currently selected session | SessionsPage detail |
| `replayState` | `ReplayState` | Playback state (playing, paused, speed, cursor) | PlaybackControls, EventTimeline |
| `replayEvents` | `ReplayEvent[]` | Events for current session replay | SessionEventTimeline |
| `canvasSyncEnabled` | `boolean` | Whether canvas sync is active | CanvasSyncToggle, WorldCanvas |
| `setSessions(list)` | action | Set session list | API fetch |
| `selectSession(id)` | action | Select session, triggers event fetch | Session list click |
| `play()` | action | Start playback | PlayPauseButton |
| `pause()` | action | Pause playback | PlayPauseButton |
| `seek(index)` | action | Jump to event index | TimelineScrubber |
| `setSpeed(speed)` | action | Change playback speed | SpeedSelector |
| `toggleCanvasSync()` | action | Toggle canvas sync | CanvasSyncToggle |

### 8.2 Data Flow Summary

```
API (REST)
    |
    +--> React Query cache (useQuery)
    |       |
    |       +--> Page components (read)
    |
    +--> Zustand stores (for data that needs cross-component sharing)

WebSocket
    |
    +--> useWebSocket hook
            |
            +--> useAgentStore (agents, status)
            +--> useAlertStore (new alerts)
            +--> useMetricsStore (live deltas)
            +--> useGamificationStore (XP, level-up, achievements, rank changes)
```

**When to use React Query vs. Zustand:**
- **React Query**: API data that maps 1:1 with a REST endpoint (sessions list, analytics data, agent detail). Handles caching, refetching, stale data.
- **Zustand**: Cross-component shared state that is mutated by WebSocket events (agents, alerts, gamification). Also UI state (selected agent, zoom, filters).

---

## 9. Gamification UX Patterns

### 9.1 XP Gain Animation

**Location:** On the PixiJS canvas, anchored to the agent's avatar position.

**Trigger:** WebSocket event `xp_awarded` with `{agent_id, xp_delta, reason}`.

**Animation sequence (GSAP timeline):**
1. `+{xp_delta} XP` text appears at the avatar's position (PixiJS Text object)
2. Text color: `#06b6d4` (oav-xp)
3. GSAP tween: `y` from avatar_y to avatar_y - 40px over 1000ms, ease: `power2.out`
4. GSAP tween: `alpha` from 1 to 0 over the last 300ms
5. Text is removed from the scene graph after animation completes

**Dashboard echo:** On the DashboardPage and Agent Detail page, a subtle "+N XP" flash appears next to the agent's XP bar (CSS animation, `@keyframes flash-xp { from { opacity: 1; } to { opacity: 0; } }`, 1.5s).

**Multiple XP events in quick succession:** If 3+ XP events arrive for the same agent within 500ms, batch them into a single floating text showing the total (e.g., "+275 XP").

### 9.2 Level-Up Celebration Flow

**Trigger:** WebSocket event `level_up` with `{agent_id, agent_name, old_level, new_level, new_level_name}`.

**Canvas animation (GSAP timeline, total 2.5s):**
1. **Scale pulse** (0-600ms): Avatar scales 1.0 -> 1.3 -> 1.0 via GSAP, ease: `elastic.out(1, 0.5)`
2. **Particle burst** (0-800ms): 20 particles (small circles) radiate outward from avatar center in a circle pattern, each with random velocity and fade-out. Colors: gold (`#eab308`) particles.
3. **Ring color change** (200-600ms): Level ring transitions from old color to new color, GSAP tween on `tint` property
4. **Floating level text** (400-1500ms): "Level {N}!" text appears above avatar, floats up 30px and fades, color: `#eab308` (gold)

**Rive enhancement (if .riv available):** Replace steps 1-2 with a Rive animation (`level_up_celebration.riv`) playing for 2 seconds centered on the avatar. If no .riv file, GSAP fallback plays as described above.

**Toast notification:**
1. `LevelUpToast` component appears in the bottom-right of the screen (NotificationLayer)
2. Entry animation: slide up + scale from 0.8 to 1.0 + fade in, 400ms, `back.out(1.7)` ease
3. Content: "Level Up! {agent_name} reached Level {N} -- {level_title}"
4. Auto-dismiss after 3 seconds (fade out 300ms)
5. If multiple level-ups arrive, queue them (show one at a time, 3s each)

**For Level 10 (Transcendent) only:**
- Additional: Full-screen particle overlay (100 particles, 3s duration)
- Screen flash: White overlay at opacity 0.3, fading over 500ms
- Toast is larger and gold-bordered

### 9.3 Achievement Unlock Notification Pattern

**Trigger:** WebSocket event `achievement_unlocked` with `{agent_id, achievement_id, achievement_name, xp_bonus}`.

**Canvas animation (GSAP timeline, total 1.5s):**
1. Badge icon appears below the avatar (in the achievement badge row)
2. Badge slides in from bottom: `y` from avatar_y + 20 to avatar_y + badge_offset, 300ms, ease: `back.out(1.2)`
3. Badge glows: `alpha` pulse 1.0 -> 0.6 -> 1.0, 500ms
4. Badge settles into position

**Rive enhancement (if .riv available):** `achievement_unlock.riv` plays at the badge position for 1.5s. Badge appears after Rive animation completes.

**Toast notification:**
1. `AchievementToast` component in NotificationLayer
2. Content: Achievement icon + "Achievement Unlocked! {name}" + "+{xp_bonus} XP bonus"
3. Background: `bg-oav-surface border border-oav-gold/40`
4. Entry/exit: Same as LevelUpToast
5. Auto-dismiss: 4 seconds

**If achievement badge row is full (3 visible):**
- Oldest visible badge shifts left
- New badge takes the rightmost position
- "+N" overflow counter updates

### 9.4 Leaderboard Update Animations

**Row position change:**
1. When a rank change event arrives, identify the affected row
2. GSAP tween: Row slides from old `y` position to new `y` position over 400ms, ease: `power2.inOut`
3. Other rows that are displaced shift accordingly
4. Brief highlight: `bg-oav-accent/10` on the moved row, fading over 1.5s

**Trend arrow update:**
- Arrow appears with a small scale-in animation (0 -> 1, 200ms)
- Green up-arrow: `text-oav-success`, Lucide `ArrowUp` icon
- Red down-arrow: `text-oav-error`, Lucide `ArrowDown` icon
- Neutral: `text-oav-muted`, Lucide `Minus` icon

**New champion:**
- If the #1 position changes, the Champion Card crossfades: old champion fades out (200ms), new champion fades in (300ms)
- Brief confetti-like effect around the Champion Card (CSS animation, gold dots falling, 2s)

### 9.5 Agent Avatar Visual Progression by Level

The agent avatar in the PixiJS canvas evolves visually as the agent levels up. Each level adds visual elements:

| Level | Ring | Particles | Icons | Sprite Effect | Avatar Size |
|-------|------|-----------|-------|--------------|-------------|
| 1 (Novice) | Gray, thin (1px) | None | None | None | 28x28 (base) |
| 2 (Apprentice) | Blue, thin (1px) | None | None | None | 28x28 |
| 3 (Operative) | Green, medium (2px) | None | None | None | 30x30 |
| 4 (Specialist) | Purple, medium (2px) | None | None | None | 30x30 |
| 5 (Expert) | Gold, thick (3px) | None | None | None | 32x32 |
| 6 (Master) | Gold, thick (3px) | Trailing particles (3) | None | None | 32x32 |
| 7 (Grandmaster) | Gold, thick (3px) | Trailing particles (3) | Crown above name | None | 34x34 |
| 8 (Legend) | Gold, animated glow | Trailing particles (5) | Crown above name | Color tint shift (slow hue rotation) | 36x36 |
| 9 (Mythic) | Gold, animated glow | Particle aura (ring of 8 orbiting dots) | Crown above name | Full sprite transformation (different shape) | 38x38 |
| 10 (Transcendent) | Gold, animated glow + pulse | Custom particle system (16 particles in complex pattern) | Crown + star | Full transformation + screen glow | 40x40 |

**Trailing particles:** Small circles (2px radius) that follow the avatar with a delay, fading as they trail. GSAP timeline on the particle container, looping.

**Crown icon:** Small crown SVG/sprite (12x12px) rendered above the name label. Gold color (`#eab308`).

**Animated glow (level 8+):** A semi-transparent circle behind the avatar that pulses in radius (30px to 40px) and opacity (0.2 to 0.4), 2s loop. Color: gold.

---

## 10. Accessibility Specification

### 10.1 WCAG 2.1 AA Compliance Targets

Per PRD Section 7.2, all dashboard pages must meet WCAG 2.1 AA. The canvas has additional keyboard requirements.

### 10.2 Color Contrast Verification

| Foreground | Background | Contrast Ratio | Passes AA? | Usage |
|-----------|-----------|---------------|------------|-------|
| `#e2e8f0` (oav-text) | `#0f1117` (oav-bg) | 13.3:1 | Yes (text) | Primary text on page bg |
| `#e2e8f0` (oav-text) | `#1e2433` (oav-surface) | 9.5:1 | Yes (text) | Primary text on cards |
| `#94a3b8` (oav-muted) | `#0f1117` (oav-bg) | 6.4:1 | Yes (text) | Muted text on page bg |
| `#94a3b8` (oav-muted) | `#1e2433` (oav-surface) | 4.6:1 | Yes (text, just passes 4.5:1) | Muted text on cards |
| `#3b82f6` (oav-accent) | `#0f1117` (oav-bg) | 4.7:1 | Yes (large text, graphical 3:1) | Links, icons on page bg |
| `#3b82f6` (oav-accent) | `#1e2433` (oav-surface) | 3.4:1 | Borderline (graphical 3:1 yes) | Links on cards |
| `#22c55e` (oav-success) | `#1e2433` (oav-surface) | 5.3:1 | Yes | Success badge on cards |
| `#ef4444` (oav-error) | `#1e2433` (oav-surface) | 4.1:1 | Yes (large text, graphical) | Error badge on cards |
| `#f59e0b` (oav-warning) | `#1e2433` (oav-surface) | 5.9:1 | Yes | Warning badge on cards |
| `#eab308` (oav-gold) | `#1e2433` (oav-surface) | 5.7:1 | Yes | Gold elements on cards |

**Action needed:** `oav-accent` on `oav-surface` is 3.4:1, which passes for graphical elements (3:1) but not for body text (4.5:1). For accent text on surface cards, use underline or bold to meet the "large text" threshold, or use the `oav-text` color with accent underline decoration.

### 10.3 Keyboard Navigation

#### Dashboard, Leaderboard, Analytics, Alerts, Sessions, Settings:
- `Tab` / `Shift+Tab`: Move focus between interactive elements in document order
- `Enter` / `Space`: Activate buttons, links, checkboxes
- `Escape`: Close modals, popovers, dropdowns
- Arrow keys: Navigate within segmented button groups, dropdown options
- All focusable elements have visible focus ring: `focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg`

#### Agent Canvas (PixiJS):
- Canvas container has `tabIndex={0}` and `role="application"` with `aria-label="Agent virtual world canvas"`
- `Tab`: Cycles through agent sprites (focus ring rendered via PixiJS Graphics on the focused agent)
- `Enter`: Opens agent tooltip (equivalent to single-click)
- `Shift+Enter`: Navigates to agent detail page (equivalent to double-click)
- `Escape`: Closes tooltip, returns focus to canvas container
- Arrow keys (when canvas focused, not on agent): Pan canvas 50px per press
- `+` / `-`: Zoom in/out by 0.25x
- `0`: Reset zoom to 1x

#### Topology Graph (ReactFlow):
- ReactFlow has built-in keyboard navigation for nodes
- `Tab`: Cycles through nodes
- `Enter`: Opens node detail panel
- `Escape`: Closes detail panel or popover

### 10.4 Screen Reader Announcements

- **Agent state change:** `aria-live="polite"` region announces: "Agent {name} state changed to {state}"
- **New alert:** `aria-live="assertive"` region announces: "New {severity} alert: {message}"
- **Level up:** `aria-live="polite"` announces: "Agent {name} reached level {N}, {title}"
- **Achievement unlock:** `aria-live="polite"` announces: "Agent {name} earned achievement: {name}"
- **WebSocket status:** `aria-live="polite"` announces: "Connection lost, reconnecting..." and "Connection restored"

Implementation: A hidden `<div>` in the NotificationLayer with `role="status"` and `aria-live` that receives text updates.

### 10.5 Motion Sensitivity

- Respect `prefers-reduced-motion` media query
- When reduced motion is preferred:
  - GSAP animations are instant (duration 0)
  - PixiJS particle effects are disabled
  - Rive animations are replaced with static final frames
  - CSS transitions use `duration-0`
- Tailwind class: `motion-reduce:transition-none motion-reduce:animate-none`

---

## 11. Component Naming Conventions

### 11.1 File Naming

All React components use PascalCase filenames matching the component name:

| Directory | Pattern | Example |
|-----------|---------|---------|
| `src/pages/` | `{PageName}Page.tsx` | `DashboardPage.tsx`, `LeaderboardPage.tsx` |
| `src/components/{domain}/` | `{ComponentName}.tsx` | `AgentCard.tsx`, `LeaderboardRow.tsx` |
| `src/components/common/` | `{ComponentName}.tsx` | `LoadingSpinner.tsx`, `EmptyState.tsx` |
| `src/components/layout/` | `{ComponentName}.tsx` | `AppShell.tsx`, `Sidebar.tsx` |
| `src/stores/` | `{name}Store.ts` | `agentStore.ts`, `gamificationStore.ts` |
| `src/hooks/` | `use{Name}.ts` | `useWebSocket.ts`, `useAgents.ts` |
| `src/types/` | `{domain}.ts` | `agent.ts`, `gamification.ts` |
| `src/lib/` | `{descriptiveName}.ts` | `xpLevels.ts`, `formatters.ts` |
| `src/canvas/` | Class-based, PascalCase | `AgentSprite.ts`, `WorldRenderer.ts` |

### 11.2 New Component Directory Structure

Sprint 2 adds these component directories:

```
src/frontend/src/
+-- components/
|   +-- agents/           (existing)
|   |   +-- AgentCard.tsx
|   |   +-- AgentDetailPanel.tsx
|   |   +-- AgentProfileHeader.tsx       (NEW)
|   |   +-- AgentStatusBadge.tsx         (NEW)
|   |   +-- AgentAvatar.tsx              (NEW)
|   +-- alerts/            (existing)
|   |   +-- AlertList.tsx
|   |   +-- AlertBanner.tsx
|   |   +-- AlertTable.tsx               (NEW)
|   |   +-- AlertFilterBar.tsx           (NEW)
|   +-- analytics/         (NEW)
|   |   +-- CostLineChart.tsx
|   |   +-- TokenAreaChart.tsx
|   |   +-- LatencyHistogram.tsx
|   |   +-- RequestBarChart.tsx
|   |   +-- CostPerAgentChart.tsx
|   |   +-- AnalyticsFilterBar.tsx
|   |   +-- TimeRangeSelector.tsx
|   +-- canvas/             (NEW -- React overlay components for canvas page)
|   |   +-- CanvasFilterBar.tsx
|   |   +-- CanvasControls.tsx
|   |   +-- AgentTooltip.tsx
|   |   +-- Minimap.tsx
|   +-- common/             (existing)
|   |   +-- EmptyState.tsx
|   |   +-- ErrorBoundary.tsx
|   |   +-- LoadingSpinner.tsx
|   |   +-- ChartCard.tsx               (NEW)
|   |   +-- StatCard.tsx                (NEW)
|   |   +-- SegmentedButtonGroup.tsx    (NEW)
|   |   +-- Breadcrumb.tsx             (NEW)
|   |   +-- Modal.tsx                  (NEW)
|   |   +-- Popover.tsx               (NEW)
|   +-- gamification/       (existing)
|   |   +-- XPProgressBar.tsx
|   |   +-- LeaderboardTable.tsx
|   |   +-- LevelUpToast.tsx
|   |   +-- AchievementToast.tsx        (NEW)
|   |   +-- AchievementCard.tsx         (NEW)
|   |   +-- ChampionCard.tsx            (NEW)
|   |   +-- LeaderboardRow.tsx          (NEW)
|   |   +-- TrendArrow.tsx             (NEW)
|   |   +-- LevelBadge.tsx             (NEW)
|   +-- layout/             (existing)
|   |   +-- AppShell.tsx
|   |   +-- Sidebar.tsx                 (NEW -- extracted from AppShell)
|   |   +-- SidebarNavItem.tsx          (NEW)
|   |   +-- MobileTabBar.tsx            (NEW)
|   |   +-- ConnectionStatusIndicator.tsx (NEW)
|   |   +-- NotificationLayer.tsx       (NEW)
|   +-- metrics/             (existing)
|   |   +-- TokenUsageBar.tsx
|   |   +-- CostSummaryCard.tsx
|   |   +-- CostChart.tsx
|   +-- sessions/            (NEW)
|   |   +-- SessionList.tsx
|   |   +-- SessionListItem.tsx
|   |   +-- PlaybackControls.tsx
|   |   +-- SessionEventTimeline.tsx
|   |   +-- SessionEventItem.tsx
|   |   +-- EventDetailAccordion.tsx
|   |   +-- CanvasSyncToggle.tsx
|   +-- settings/            (NEW)
|   |   +-- WorkspaceSection.tsx
|   |   +-- APIKeysSection.tsx
|   |   +-- APIKeyRow.tsx
|   |   +-- CreateKeyModal.tsx
|   +-- topology/            (NEW)
|       +-- AgentNode.tsx
|       +-- RelationshipEdge.tsx
|       +-- EdgePopover.tsx
|       +-- TopologyLegend.tsx
|       +-- TopologyControls.tsx
+-- pages/
|   +-- LoginPage.tsx        (existing)
|   +-- DashboardPage.tsx    (existing, enhanced)
|   +-- VirtualWorldPage.tsx (existing, enhanced)
|   +-- AlertsPage.tsx       (existing, enhanced)
|   +-- ReplayPage.tsx       (renamed to SessionsPage.tsx)
|   +-- SettingsPage.tsx     (existing, enhanced)
|   +-- AgentDetailPage.tsx  (NEW)
|   +-- LeaderboardPage.tsx  (NEW)
|   +-- AnalyticsPage.tsx    (NEW)
|   +-- TopologyPage.tsx     (NEW)
```

### 11.3 Prop Naming Conventions

- Event handlers: `on{Event}` (e.g., `onClick`, `onResolve`, `onSpeedChange`)
- Boolean flags: `is{State}` or `has{Feature}` (e.g., `isLoading`, `isPlaying`, `hasAchievements`)
- Data props: Noun or noun phrase (e.g., `agent`, `entries`, `alerts`, `events`)
- Render customization: `render{Element}` or `{element}Component` (rarely needed)
- Child component slots: `children` (React default)

---

## 12. Open Question Decisions

### Question 4: Session Replay Canvas Sync

**Decision:** Separate timeline view with optional canvas sync (toggle).

**Rationale:** The session replay is primarily a debugging and inspection tool. Forcing canvas sync would require the user to have the canvas open simultaneously, which is complex and confusing. Instead:
- The Sessions page has its own event timeline as the primary view
- A "Canvas Sync" toggle (default OFF) is available
- When ON, if the user navigates to `/world`, the canvas reflects the replayed agent's state transitions
- This is achieved via the `useSessionStore.canvasSyncEnabled` flag + dispatching synthetic events to the agent store during replay

### Question 1: Rive .riv Assets

**UX Decision:** Design all interactions to work with GSAP animations as the baseline. Rive animations are a progressive enhancement layer. The UI Designer (Stage 1.3) should determine whether to create .riv assets or defer to Sprint 3. All wireframes in this document describe GSAP animations. If Rive is available, it replaces the GSAP animation at the same trigger point with the same duration constraints.

### Additional UX Decisions

1. **Dashboard is the landing page** (not the Virtual World). Rationale: Dashboard provides the best overview for returning users. The Virtual World is one click away. Login redirects to `/dashboard` (change from current `/world` redirect in LoginPage).

2. **Agent Detail is a full page** (not just a slide-in panel). Rationale: The detail page has 5 tabs of content, far too much for a 280px panel. The existing `AgentDetailPanel` is retained for the canvas single-click tooltip use case.

3. **AgentStatus type update.** The current status enum (`idle | working | thinking | communicating | error`) must be updated to match the PRD's FSM states (`idle | active | waiting | error | complete`). This is a breaking change that affects the type file, agent store, agent card, agent sprite, and WebSocket handler.

4. **XP level system update.** The current 5-level system in `xpLevels.ts` must be replaced with the PRD's 10-level system. This affects XPProgressBar, LevelBadge, canvas ring colors, and the LeaderboardTable.

5. **Sidebar extracted from AppShell.** The current AppShell monolithically includes the sidebar. Sprint 2 extracts it into a separate `Sidebar` component with expand/collapse behavior and the new navigation items.

6. **ReplayPage renamed to SessionsPage.** The URL changes from `/replay` to `/sessions` and the component from `ReplayPage` to `SessionsPage` to match the PRD naming.

---

## Appendix A: New TypeScript Types Needed

```typescript
// types/agent.ts -- UPDATE
export type AgentStatus = 'idle' | 'active' | 'waiting' | 'error' | 'complete';

// types/gamification.ts -- ADD
export interface Achievement {
  id: string;
  agent_id: string;
  achievement_id: string;  // ACH-001 through ACH-010
  achievement_name: string;
  xp_bonus: number;
  unlocked_at: string;
}

export interface AchievementDefinition {
  id: string;           // ACH-001 through ACH-010
  name: string;
  description: string;
  condition_summary: string;
  xp_bonus: number;
  icon: string;         // icon identifier
}

export interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  total_xp: number;
  level: number;
  achievement_count: number;  // ADD
  trend: 'up' | 'down' | 'same';  // ADD
  trend_delta: number;  // ADD (positions moved)
  rank: number;  // ADD
}

// types/session.ts -- NEW
export interface Session {
  id: string;
  workspace_id: string;
  agent_id: string;
  agent_name: string;
  name: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  status: 'active' | 'completed' | 'error';
  event_count: number;
}

export interface ReplayEvent {
  id: string;
  agent_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  timestamp: string;
  sequence_number: number;
}

export interface ReplayState {
  isPlaying: boolean;
  speed: number;          // 0.5, 1, 2, 5
  cursorIndex: number;
  totalEvents: number;
}

// types/topology.ts -- NEW
export interface TopologyNode {
  id: string;
  agent_id: string;
  agent_name: string;
  level: number;
  status: AgentStatus;
  xp_total: number;
}

export interface TopologyEdge {
  id: string;
  source: string;       // agent_id
  target: string;       // agent_id
  type: 'delegates_to' | 'shared_session' | 'data_flow';
  weight: number;
  first_interaction: string;
  last_interaction: string;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

// types/analytics.ts -- NEW
export interface MetricDataPoint {
  timestamp: string;
  value: number;
  agent_id?: string;
  agent_name?: string;
}

export interface AggregatedMetrics {
  hour: string;
  agent_id: string;
  total_tokens: number;
  total_cost_usd: number;
  request_count: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

// ui store types
export interface CanvasFilters {
  search: string;
  status: AgentStatus | 'all';
  levelMin: number;
  levelMax: number;
}

export interface GamificationToast {
  id: string;
  type: 'level_up' | 'achievement';
  agentName: string;
  // level_up fields
  newLevel?: number;
  newLevelName?: string;
  // achievement fields
  achievementName?: string;
  achievementIcon?: string;
  xpBonus?: number;
}
```

---

## Appendix B: Route Configuration Update

The AppShell route configuration must be updated from:

```
/world       -> VirtualWorldPage
/dashboard   -> DashboardPage
/alerts      -> AlertsPage
/replay      -> ReplayPage
/*           -> Navigate to /world
```

To:

```
/dashboard         -> DashboardPage       (landing)
/world             -> VirtualWorldPage
/topology          -> TopologyPage
/agents/:agentId   -> AgentDetailPage
/leaderboard       -> LeaderboardPage
/analytics         -> AnalyticsPage
/alerts            -> AlertsPage
/sessions          -> SessionsPage
/sessions/:id      -> SessionsPage (with selected session)
/settings          -> SettingsPage
/*                 -> Navigate to /dashboard
```

The default redirect changes from `/world` to `/dashboard`.

---

## Appendix C: WebSocket Event Types (Frontend Handling)

The `useWebSocket` hook must be extended to handle these event types:

| Event Type | Payload | Action |
|-----------|---------|--------|
| `agent.state.changed` | `{agent_id, status}` | `agentStore.setAgentStatus` + XState transition + canvas animation |
| `agent.registered` | `{agent}` | `agentStore.upsertAgent` |
| `agent.removed` | `{agent_id}` | `agentStore.removeAgent` |
| `alert.created` | `{alert}` | `alertStore.addAlert` |
| `agent.llm.*` | `{cost_delta, tokens_delta}` | `metricsStore.updateLiveMetrics` |
| `xp_awarded` | `{agent_id, xp_delta, reason}` | `gamificationStore` + canvas floating text |
| `level_up` | `{agent_id, agent_name, old_level, new_level, new_level_name}` | `gamificationStore.enqueueToast` + canvas animation |
| `achievement_unlocked` | `{agent_id, achievement_id, achievement_name, xp_bonus}` | `gamificationStore.enqueueToast` + canvas badge animation |
| `rank_change` | `{agent_id, old_rank, new_rank}` | `gamificationStore.updateRank` + leaderboard animation |
| `relationship_updated` | `{nodes, edges}` | Topology graph incremental update |

---

*End of UX Wireframes & Interaction Design Document*
