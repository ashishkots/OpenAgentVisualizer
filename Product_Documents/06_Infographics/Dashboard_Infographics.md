# OpenAgentVisualizer -- Dashboard Infographics Specification

**Stage:** 3.2 -- Infographics Agent
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Infographics Agent
**Depends On:** PRD (Stage 1.1), UX Design Spec (Stage 2.1), Visualization Spec (Stage 2.2), Animation Spec (Stage 2.3), Gamification System Design (Stage 1.2)
**Feeds Into:** Frontend Expert (2.2a), Backend Expert (2.2b), Code Reviewer (2.3), QA Engineer (2.4)

---

## Table of Contents

1. [Dashboard Design Philosophy](#1-dashboard-design-philosophy)
2. [Dashboard Layout Patterns](#2-dashboard-layout-patterns)
3. [KPI Card Designs](#3-kpi-card-designs)
4. [Chart Specifications](#4-chart-specifications)
5. [Infographic Compositions](#5-infographic-compositions)
6. [Data Table Patterns](#6-data-table-patterns)
7. [Real-Time Update Patterns](#7-real-time-update-patterns)
8. [Color Encoding Standards](#8-color-encoding-standards)
9. [Typography in Data Viz](#9-typography-in-data-viz)
10. [Print and Export Design](#10-print-and-export-design)

---

## 1. Dashboard Design Philosophy

### 1.1 Data-Ink Ratio

Edward Tufte's data-ink ratio principle governs every pixel in OpenAgentVisualizer dashboards: maximize the share of ink used to present data; minimize the share used for non-data decoration. In concrete terms:

- **No gratuitous borders.** Cards are separated by 16px gaps and subtle background color differences, not heavy outlines. If a border is present, it encodes data (e.g., a red left-border on a KPI card signals threshold breach).
- **No chartjunk.** No 3D effects on charts, no gradient fills that distort area perception, no shadow effects on data bars. Fill opacity is used sparingly (0.2-0.4) to maintain readability without visual noise.
- **Grid lines are guides, not decorations.** Horizontal grid lines in charts use `#1F2937` at 0.3 opacity (dark mode) or `#E5E7EB` at 0.4 opacity (light mode). Vertical grid lines are omitted unless the chart requires precise time-axis reading.
- **Labels earn their place.** Every label, annotation, and legend must pass the question: "If I remove this, does the user lose information?" If no, remove it. Axis labels appear only when the data range is ambiguous. Legend entries appear inline (colored text in the title) rather than as separate legend boxes when there are 3 or fewer series.
- **Target ratio: 0.85+.** At least 85% of non-whitespace pixels in any chart or card should represent actual data. The remaining 15% covers axes, labels, and interaction affordances.

### 1.2 Progressive Disclosure

Dashboards operate on a three-level information hierarchy:

**Level 1 -- Glance (0-3 seconds):** The user sees KPI cards at the top of any dashboard. Each card shows a single number, a trend indicator (arrow or sparkline), and a status color. The user can assess system health without reading any text beyond the metric name.

**Level 2 -- Scan (3-15 seconds):** Below the KPI row, 2-3 primary charts show trends and distributions. These charts are pre-configured to the most useful view for the dashboard context. The user scans chart shapes -- rising lines mean growth, flat lines mean stability, spikes mean anomalies. No interaction required.

**Level 3 -- Explore (15+ seconds):** The user clicks into a chart, filters by agent or time range, expands a data table, or drills down into a treemap node. This level reveals the full analytical depth. Every explore-level interaction is reversible (back button, clear filter, reset zoom).

**Implementation Rules:**
- Level 1 content loads within 200ms of page render (SSR or pre-fetched).
- Level 2 charts load within 500ms. Skeleton loaders (animated pulse bars matching chart dimensions) display while data fetches.
- Level 3 data loads on demand when the user initiates a drill-down action. Loading state is shown inline, not as a full-page spinner.
- No dashboard page requires scrolling to reach Level 1 content. KPI cards are always above the fold at 1280x720 minimum viewport.

### 1.3 Glanceable Metrics

A metric is "glanceable" when the user can extract its meaning from peripheral vision or a sub-second focused glance. Glanceability requires:

- **Large numbers.** KPI primary values use 28px font (minimum) in bold weight. At 1920x1080, the primary value of a KPI card is readable from 1.5 meters away.
- **Color-coded status.** Every KPI card has a status color band (left border or background tint) that encodes good/warning/critical state. A scan of the card row reveals overall health by color pattern alone.
- **Directional indicators.** Trend arrows (up/down/flat) adjacent to the primary value show the direction of change at a glance. Green up-arrow = good trend, red up-arrow on cost = bad trend. The arrow direction combined with semantic color resolves meaning without reading the trend percentage.
- **Sparklines as context.** A 7-day trailing sparkline beneath the primary value provides historical context without requiring a separate chart. The sparkline shape (rising, falling, spiky, flat) is perceptible at a glance.

### 1.4 Dashboard Consistency Rules

Every dashboard in OpenAgentVisualizer follows these structural rules:

| Rule | Specification |
|------|--------------|
| Grid system | 12-column grid, 16px gutter, 24px outer padding |
| Card height options | Small (120px), Medium (200px), Large (320px), XL (480px) |
| KPI card row | Always first row; 4 cards on desktop, 2x2 on tablet, 1-column on mobile |
| Chart row | Below KPI row; 2 charts side by side on desktop, stacked on tablet/mobile |
| Activity feed | Right sidebar (320px) on desktop; bottom panel on tablet/mobile |
| Time range selector | Top-right corner of every dashboard; applies to all charts simultaneously |
| Refresh indicator | Subtle pulse dot in header showing last data update timestamp |
| Empty state | Illustrated placeholder with "Connect agents to see data" CTA when no data |

### 1.5 Responsive Breakpoints

| Breakpoint | Width | Layout Adaptation |
|-----------|-------|------------------|
| Desktop XL | >= 1536px | 4 KPI cards + 2 charts per row + sidebar |
| Desktop | >= 1280px | 4 KPI cards + 2 charts per row + sidebar collapses to icon rail |
| Tablet | >= 768px | 2 KPI cards per row + 1 chart per row + sidebar hidden (toggle) |
| Mobile | < 768px | 1 KPI card per row + 1 chart per row + no sidebar (bottom sheet) |

---

## 2. Dashboard Layout Patterns

### 2.1 Overview Dashboard (Executive Summary)

**Purpose:** Provide a 30-second health assessment of the entire agent workspace. This is the default landing view after login for users with the Manager or Executive role.

**Target Persona:** Sarah Kim (Engineering Manager), Marcus Rivera (Technical Executive)

**Layout (Desktop 1536px+):**

```
+----------------------------------------------------------------------+
|  [Logo] OpenAgentVisualizer    [Search Cmd+K]  [Time: Last 24h v]   |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------+  +------------+  +------------+  +------------+      |
|  | Total      |  | Tasks      |  | Total Cost |  | Error Rate |      |
|  | Agents: 24 |  | Today: 847 |  | $142.30    |  | 2.1%       |      |
|  | +12% /\    |  | ||||||||   |  | $$$ 67%    |  | __ OK __   |      |
|  +------------+  +------------+  +------------+  +------------+      |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Token Usage Over Time          |  | Cost Breakdown by Agent    |  |
|  | [Stacked Area Chart]           |  | [Treemap]                  |  |
|  |                                |  |                            |  |
|  | Input ===  Output ===          |  | ResearchBot  CoderBot      |  |
|  |    /\                          |  |   $42.10      $38.70       |  |
|  |   /  \    ___/                 |  |                            |  |
|  |  /    \__/                     |  | ReviewBot   ManagerBot     |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Recent Activity Feed                                           |  |
|  | 14:32:01  ResearchBot completed task "Market Analysis"   [OK]  |  |
|  | 14:31:58  CoderBot started task "API Integration"        [...]  |  |
|  | 14:31:45  ManagerBot assigned 3 tasks                    [->]  |  |
|  | 14:31:30  ReviewBot flagged quality issue in PR #42      [!]   |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

**Component Inventory:**

| Component | Position | Size | Data Source |
|-----------|----------|------|-------------|
| KPI: Total Agents Active | Row 1, Col 1-3 | Small (120px) | `GET /api/v1/agents/stats` |
| KPI: Tasks Completed Today | Row 1, Col 4-6 | Small (120px) | `GET /api/v1/tasks/stats?period=today` |
| KPI: Total Cost | Row 1, Col 7-9 | Small (120px) | `GET /api/v1/costs/summary?period=today` |
| KPI: Error Rate | Row 1, Col 10-12 | Small (120px) | `GET /api/v1/metrics/error-rate?period=today` |
| Chart: Token Usage Over Time | Row 2, Col 1-6 | Large (320px) | `GET /api/v1/metrics/tokens?interval=5m&period=24h` |
| Chart: Cost Breakdown Treemap | Row 2, Col 7-12 | Large (320px) | `GET /api/v1/costs/breakdown?group_by=agent` |
| Activity Feed | Row 3, Col 1-12 | Medium (200px) | SSE `/api/v1/events/stream` |

**Auto-Refresh:** KPI cards refresh every 10 seconds. Charts refresh every 30 seconds. Activity feed is real-time via SSE.

---

### 2.2 Agent Performance Dashboard (Per-Agent Deep Dive)

**Purpose:** Show the complete performance profile of a single agent. Accessed by clicking an agent avatar on the canvas or selecting an agent from the global agent list.

**Target Persona:** Alex Chen (AI Platform Engineer)

**Layout:**

```
+----------------------------------------------------------------------+
| [< Back to Overview]  Agent: ResearchBot  Level 12 (Expert)  [...]   |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------------+  +------------------------------------------+  |
|  |                  |  |                                          |  |
|  |   [Avatar]       |  |  +--------+ +--------+ +--------+      |  |
|  |   ResearchBot    |  |  |Tasks   | |Quality | |Avg     |      |  |
|  |   Lv 12 Expert   |  |  |Today:63| |Score:  | |Latency:|      |  |
|  |   XP: 4,820      |  |  | +8%    | |0.92    | |1.2s    |      |  |
|  |   Uptime: 99.7%  |  |  +--------+ +--------+ +--------+      |  |
|  |   Status: Active  |  |                                          |  |
|  |                  |  |  +--------+ +--------+ +--------+      |  |
|  |  [Badges]        |  |  |Tokens  | |Cost    | |Errors  |      |  |
|  |  [*] [*] [*]     |  |  |Today:  | |Today:  | |Today:  |      |  |
|  |                  |  |  |142.3K  | |$6.42   | |3       |      |  |
|  +------------------+  |  +--------+ +--------+ +--------+      |  |
|                         +------------------------------------------+  |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Token Usage (This Agent)       |  | Quality Score Distribution |  |
|  | [Stacked Area - 24h]           |  | [Violin Plot]              |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Task Completion Funnel         |  | Response Time Percentiles  |  |
|  | [Funnel: Assigned->Done/Fail]  |  | [Candlestick P50-P99]     |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Task History Table                              [Export CSV]    |  |
|  | ID | Task Name | Status | Duration | Tokens | Cost | Quality  |  |
|  | -- | --------- | ------ | -------- | ------ | ---- | -------  |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

**Component Inventory:**

| Component | Position | Size |
|-----------|----------|------|
| Agent Identity Card | Left sidebar, fixed | 280px wide |
| KPI Row (6 mini-cards) | Right of identity, row 1 | 3x2 grid, each 100px tall |
| Chart: Token Usage (single agent) | Row 2, Left | Large (320px) |
| Chart: Quality Score Violin | Row 2, Right | Large (320px) |
| Chart: Task Completion Funnel | Row 3, Left | Medium (200px) |
| Chart: Response Time Percentiles | Row 3, Right | Medium (200px) |
| Data Table: Task History | Row 4, Full width | Variable height, paginated |

---

### 2.3 Cost Analytics Dashboard

**Purpose:** Provide comprehensive cost visibility with budget tracking, burn rate analysis, and cost optimization opportunities. This dashboard answers the question: "Where is our AI budget going?"

**Target Persona:** Sarah Kim (Engineering Manager), Marcus Rivera (Technical Executive)

**Layout:**

```
+----------------------------------------------------------------------+
| Cost Analytics     [Period: This Month v]  [Budget: $5,000]          |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------+  +------------+  +------------+  +------------+      |
|  | Total Spend|  | Burn Rate  |  | Cost       |  | Budget     |      |
|  | $2,847.30  |  | $94.91/day |  | Savings    |  | Remaining  |      |
|  | +18% MoM   |  | [=====>]   |  | $412.60    |  | $2,152.70  |      |
|  |  /\/\      |  | On track   |  | vs baseline|  | 43% left   |      |
|  +------------+  +------------+  +------------+  +------------+      |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Cost Projection                |  | Cost Breakdown Treemap     |  |
|  | [Line: Actual vs Projected     |  | [Agent -> Task -> Model]   |  |
|  |  vs Budget]                    |  |                            |  |
|  |                                |  |                            |  |
|  | --- Actual                     |  |                            |  |
|  | ... Projected                  |  |                            |  |
|  | === Budget                     |  |                            |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Cost by Model Provider         |  | Top Cost Agents            |  |
|  | [Donut Chart]                  |  | [Horizontal Bar]           |  |
|  |    GPT-4o: 42%                 |  | 1. ResearchBot   $842      |  |
|  |    Claude: 31%                 |  | 2. CoderBot      $687      |  |
|  |    Gemini: 18%                 |  | 3. ReviewBot     $421      |  |
|  |    Other:  9%                  |  | 4. WriterBot     $312      |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Cost Optimization Opportunities                                 |  |
|  | [!] ResearchBot uses GPT-4o for simple lookups. Switch to       |  |
|  |     GPT-4o-mini for 75% savings (~$210/mo).                     |  |
|  | [!] CoderBot retries average 3.2x. Reduce retry threshold for   |  |
|  |     ~$180/mo savings.                                           |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

**Component Inventory:**

| Component | Data Source |
|-----------|-------------|
| KPI: Total Spend | `GET /api/v1/costs/summary` |
| KPI: Burn Rate | `GET /api/v1/costs/burn-rate` |
| KPI: Cost Savings | `GET /api/v1/costs/savings?vs=baseline` |
| KPI: Budget Remaining | `GET /api/v1/costs/budget-status` |
| Chart: Cost Projection | `GET /api/v1/costs/projection?days=30` |
| Chart: Cost Breakdown Treemap | `GET /api/v1/costs/breakdown?group_by=agent,task,model` |
| Chart: Cost by Model (Donut) | `GET /api/v1/costs/breakdown?group_by=model` |
| Chart: Top Cost Agents (Bar) | `GET /api/v1/costs/breakdown?group_by=agent&sort=desc&limit=10` |
| Cost Optimization Panel | `GET /api/v1/insights/cost-optimization` |

---

### 2.4 Quality Metrics Dashboard

**Purpose:** Show quality-of-output metrics across agents, including error rates, quality scores, SLO compliance, and anomaly trends.

**Target Persona:** Alex Chen (AI Platform Engineer), Jordan Walsh (DevOps/SRE)

**Layout:**

```
+----------------------------------------------------------------------+
| Quality Metrics     [Period: Last 7 Days v]  [SLO Target: 95%]      |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------+  +------------+  +------------+  +------------+      |
|  | Avg Quality|  | Error Rate |  | SLO        |  | Loop       |      |
|  | Score      |  |            |  | Compliance |  | Incidents  |      |
|  | 0.89       |  | 3.2%       |  | 97.1%      |  | 4          |      |
|  | [dist]     |  | [!! > 3%]  |  | [====> OK] |  | 2 crit     |      |
|  +------------+  +------------+  +------------+  +------------+      |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Quality Score by Agent         |  | Error Classification       |  |
|  | [Violin Plot]                  |  | [Pie Chart]                |  |
|  |  Res  Code  Rev  Mgr  Wrt     |  |  Timeout: 35%              |  |
|  |  |||  |||  |||  |||  |||      |  |  Rate Limit: 22%           |  |
|  |  |||  | |  |||  | |  | |      |  |  Loop: 18%                 |  |
|  |  | |  | |  | |  | |  | |      |  |  Hallucination: 15%        |  |
|  +--------------------------------+  |  Other: 10%               |  |
|                                      +----------------------------+  |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Error Rate Over Time           |  | SLO Burn-Down              |  |
|  | [Line Chart - 7 day]           |  | [Area: budget vs consumed] |  |
|  |     __                         |  |  ____                      |  |
|  |    /  \    /\                  |  | /    \___                  |  |
|  |   /    \__/  \___             |  |                            |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Recent Error Log                                [View All]     |  |
|  | Time | Agent | Error Type | Severity | Message | Action        |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

---

### 2.5 Team Comparison Dashboard

**Purpose:** Gamified leaderboard and side-by-side team metrics comparison. Makes agent optimization a competitive, visible sport.

**Target Persona:** Sarah Kim (Engineering Manager), Alex Chen (AI Platform Engineer)

**Layout:**

```
+----------------------------------------------------------------------+
| Team Performance   [Period: This Week v]  [Mode: Gamified v]         |
+----------------------------------------------------------------------+
|                                                                      |
|  +----------------------------------+  +--------------------------+  |
|  | LEADERBOARD                      |  | Team XP Progress         |  |
|  |                                  |  | [Cumulative XP Chart]    |  |
|  | #1 [*] ResearchBot  Lv14  4820  |  |                          |  |
|  |        Efficiency: 0.94          |  |   /--                    |  |
|  |                                  |  |  /                       |  |
|  | #2 [*] CoderBot     Lv12  4210  |  | /                        |  |
|  |        Efficiency: 0.91          |  |                          |  |
|  |                                  |  +--------------------------+  |
|  | #3 [*] ReviewBot    Lv11  3890  |  |                             |
|  |        Efficiency: 0.88          |  +--------------------------+  |
|  |                                  |  | Recent Achievements      |  |
|  | #4 [*] ManagerBot   Lv10  3540  |  | [*] Centurion - CoderBot |  |
|  |        Efficiency: 0.85          |  | [*] Zero Error - RevBot  |  |
|  |                                  |  | [*] Speed Demon - ResBot |  |
|  | #5 [*] WriterBot    Lv8   2870  |  +--------------------------+  |
|  |        Efficiency: 0.82          |                                |
|  +----------------------------------+                                |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Agent Comparison Radar Charts (Top 4)                          |  |
|  |                                                                 |  |
|  |  ResearchBot      CoderBot       ReviewBot      ManagerBot     |  |
|  |  Speed: 92        Speed: 88      Speed: 76      Speed: 81     |  |
|  |  Quality: 94      Quality: 87    Quality: 96    Quality: 83   |  |
|  |  Cost: 78         Cost: 82       Cost: 91       Cost: 74      |  |
|  |  Reliability: 96  Reliability:91 Reliability:98 Reliability:88 |  |
|  |  Volume: 85       Volume: 93     Volume: 68     Volume: 72    |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Side-by-Side Metrics Comparison Table                          |  |
|  | Metric       | ResBot | CodBot | RevBot | MgrBot | WrtBot    |  |
|  | Tasks/Day    |   63   |   78   |   42   |   31   |   55      |  |
|  | Avg Cost/Task|  $0.42 |  $0.38 |  $0.51 |  $0.67 |  $0.29   |  |
|  | Error Rate   |  1.2%  |  2.8%  |  0.5%  |  3.1%  |  1.8%    |  |
|  | Avg Latency  |  1.2s  |  2.1s  |  1.8s  |  0.9s  |  1.5s    |  |
|  | Quality Score|  0.94  |  0.87  |  0.96  |  0.83  |  0.88    |  |
|  | XP Total     |  4820  |  4210  |  3890  |  3540  |  2870    |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

---

### 2.6 Real-Time Monitoring Dashboard

**Purpose:** Live operational view showing what is happening right now. Designed for wall-mount displays and lean-back monitoring.

**Target Persona:** Jordan Walsh (DevOps/SRE), Sarah Kim (Engineering Manager)

**Layout:**

```
+----------------------------------------------------------------------+
| LIVE MONITORING    [Auto-refresh: 5s]  [Status: ALL SYSTEMS OK]     |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------+  +------------+  +------------+  +------------+      |
|  | Active     |  | Tasks in   |  | Active     |  | Token      |      |
|  | Agents     |  | Progress   |  | Sessions   |  | Burn Rate  |      |
|  | 18 / 24    |  | 12         |  | 7          |  | 42K/min    |      |
|  | [counter]  |  | ~2.1m wait |  | [realtime] |  | [flame]    |      |
|  +------------+  +------------+  +------------+  +------------+      |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Agent Status Grid              |  | Live Activity Feed         |  |
|  | (Real-time agent tiles)        |  | (Streaming events)         |  |
|  |                                |  |                            |  |
|  | [Res] [Cod] [Rev] [Mgr]       |  | 14:32:01 Task complete     |  |
|  | [Wrt] [Ana] [Pln] [Tst]       |  | 14:32:00 Tool called       |  |
|  | [S1]  [S2]  [S3]  [S4]        |  | 14:31:59 Handoff A->B      |  |
|  | [S5]  [S6]  [S7]  [S8]        |  | 14:31:58 Error: timeout    |  |
|  | [S9]  [S10] [--]  [--]        |  | 14:31:57 Agent connected   |  |
|  |                                |  |                            |  |
|  | Legend: Green=Active Blue=Work |  | [Pause] [Filter] [Clear]  |  |
|  | Amber=Wait Red=Error Grey=Idle |  |                            |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
|  +--------------------------------+  +----------------------------+  |
|  | Response Time (Rolling 5min)   |  | Token Usage (Rolling 5min) |  |
|  | [Line Chart - P50/P95/P99]     |  | [Stacked Area - Live]      |  |
|  |                                |  |                            |  |
|  | P99  ----                      |  |     ____                   |  |
|  | P95  ----                      |  |    /    \___               |  |
|  | P50  ----                      |  |   /         \__            |  |
|  +--------------------------------+  +----------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

**Agent Status Grid Tile Spec:**

Each tile is 64px x 64px and shows:
- Agent avatar (32x32 at center)
- Status color border (3px)
- Agent name (8px font, truncated, below avatar)
- Current state icon overlay (top-right corner, 12x12)
- Pulse animation if agent is executing
- Red shake animation if agent is in error state
- Grey desaturation if agent is idle > 5 minutes

**Real-Time Behavior:**
- Agent tiles update state via WebSocket push
- New agent connections animate in with a scale-up entrance (0 to 1 over 300ms)
- Disconnected agents fade to 30% opacity over 2 seconds, then move to "offline" section
- The entire dashboard is optimized for 60fps rendering with up to 100 agent tiles

---

## 3. KPI Card Designs

### 3.1 Card Anatomy

Every KPI card shares a consistent structure:

```
+--------------------------------------------+
|  [Status Color Band - 4px left border]     |
|                                            |
|  Metric Label              [Icon 16x16]    |
|                                            |
|  PRIMARY VALUE              [Trend Arrow]  |
|  28px bold                  [+12.3%]       |
|                                            |
|  [Sparkline - 7 day trailing]              |
|  [Sublabel / secondary context]            |
|                                            |
+--------------------------------------------+
```

**Dimensions:**
- Width: fluid (fills grid column, minimum 240px)
- Height: 120px (small), 160px (medium with sublabel)
- Padding: 16px all sides
- Border radius: 8px
- Background: `#1A1F2E` (dark mode) / `#FFFFFF` (light mode)
- Left border: 4px, color encodes status (green/amber/red/blue/grey)

**States:**
- **Normal:** Left border is `#22C55E` (green) or `#3B82F6` (blue informational)
- **Warning:** Left border is `#F59E0B` (amber), background tint `rgba(245,158,11,0.05)`
- **Critical:** Left border is `#EF4444` (red), background tint `rgba(239,68,68,0.05)`, subtle pulse animation on the border (opacity 0.6 to 1.0, 1.5s cycle)
- **Loading:** Skeleton shimmer animation in place of value and sparkline
- **Stale:** Timestamp indicator turns amber, tooltip: "Data last updated 2 minutes ago"

### 3.2 KPI Card Catalog (15 Cards)

---

#### Card 1: Total Agents Active

| Property | Value |
|----------|-------|
| Label | "Active Agents" |
| Primary Value | Integer count (e.g., "24") |
| Format | Raw integer, no abbreviation |
| Icon | `Users` icon (Lucide) |
| Trend | Percentage change vs. previous period, with directional arrow |
| Trend Color | Green if up (more agents = healthy), Grey if flat, Amber if down |
| Left Border | `#3B82F6` (blue, informational) |
| Sparkline | 7-day daily active agent count |
| Sublabel | "{active} / {total} registered" |
| Threshold | Warning if active < 50% of registered; Critical if active < 20% |
| Tooltip | "Number of agents that sent at least one event in the selected time period" |
| API | `GET /api/v1/agents/stats` -> `active_count`, `total_count` |

---

#### Card 2: Tasks Completed Today

| Property | Value |
|----------|-------|
| Label | "Tasks Completed" |
| Primary Value | Integer (e.g., "847") |
| Format | Comma-separated thousands (e.g., "1,247") |
| Icon | `CheckCircle` icon (Lucide) |
| Trend | Percentage change vs. same time yesterday |
| Trend Color | Green if up, Grey if flat, Red if down |
| Left Border | `#22C55E` (green) |
| Sparkline | Hourly task completion count for current day (up to 24 data points) |
| Sublabel | "{completed} completed / {failed} failed / {in_progress} in progress" |
| Threshold | None (informational) |
| Tooltip | "Total tasks that reached 'completed' state today. Failed tasks counted separately." |
| API | `GET /api/v1/tasks/stats?period=today` -> `completed`, `failed`, `in_progress` |

---

#### Card 3: Total Token Usage

| Property | Value |
|----------|-------|
| Label | "Token Usage" |
| Primary Value | Abbreviated number (e.g., "1.4M") |
| Format | Smart abbreviation: <10K raw, 10K-999K as "142.3K", 1M+ as "1.4M" |
| Icon | `Zap` icon (Lucide) |
| Trend | Percentage change vs. previous period |
| Trend Color | Amber if up > 20% (cost implication), Green if down, Grey if stable |
| Left Border | `#818CF8` (indigo, accent) |
| Budget Ring | Circular progress ring (24px diameter) to the right of the value showing percentage of daily token budget consumed. Ring fill color: green (0-60%), amber (60-85%), red (85-100%) |
| Sparkline | Hourly token consumption for current day |
| Sublabel | "Input: {input_tokens} / Output: {output_tokens}" |
| Threshold | Warning at 80% of daily budget, Critical at 95% |
| Tooltip | "Total tokens consumed across all agents. Budget ring shows daily allocation usage." |
| API | `GET /api/v1/metrics/tokens?period=today` -> `total`, `input`, `output`, `budget_pct` |

---

#### Card 4: Total Cost

| Property | Value |
|----------|-------|
| Label | "Total Cost" |
| Primary Value | USD currency (e.g., "$142.30") |
| Format | Dollar sign, comma-separated, 2 decimal places. If > $10,000: "$12.4K" |
| Icon | `DollarSign` icon (Lucide) |
| Trend | Percentage change vs. same period previous cycle |
| Trend Color | Red if up > 10% (cost increase is bad), Green if down, Grey if stable |
| Left Border | Dynamic: green if under budget pace, amber if 80-100% of budget pace, red if over budget |
| Burn Rate Indicator | Small text below trend: "Burn: ${rate}/hr" with flame icon (1-5 flame levels based on intensity, see Visualization Spec Section 4.5) |
| Sparkline | Daily cost for last 7 days |
| Sublabel | "Budget: ${budget} ({pct}% used)" |
| Threshold | Warning at 80% of period budget, Critical at 100% |
| Tooltip | "Cumulative cost across all agents for the selected period, calculated from per-model token pricing." |
| API | `GET /api/v1/costs/summary` -> `total`, `budget`, `budget_pct`, `burn_rate` |

---

#### Card 5: Average Quality Score

| Property | Value |
|----------|-------|
| Label | "Avg Quality Score" |
| Primary Value | Decimal (e.g., "0.89") |
| Format | 2 decimal places, always between 0.00 and 1.00 |
| Icon | `Star` icon (Lucide) |
| Trend | Change vs. previous period (e.g., "+0.03") |
| Trend Color | Green if up, Red if down, Grey if stable |
| Left Border | Dynamic: green if >= 0.85, amber if 0.70-0.84, red if < 0.70 |
| Distribution Mini-Chart | Tiny histogram (5 bars, 40px wide, 16px tall) showing score distribution across agents. Bars represent buckets: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0 |
| Sparkline | Daily average quality score for last 7 days |
| Sublabel | "Range: {min} - {max} across {agent_count} agents" |
| Threshold | Warning if < 0.80, Critical if < 0.60 |
| Tooltip | "Weighted average quality score across all agents. Quality is measured by task success rate, output evaluation score, and error-free completion ratio." |
| API | `GET /api/v1/metrics/quality?period=today` -> `avg`, `min`, `max`, `distribution` |

---

#### Card 6: Error Rate

| Property | Value |
|----------|-------|
| Label | "Error Rate" |
| Primary Value | Percentage (e.g., "2.1%") |
| Format | 1 decimal place with % suffix |
| Icon | `AlertTriangle` icon (Lucide) |
| Trend | Change vs. previous period (e.g., "-0.3%") |
| Trend Color | Green if down (fewer errors = good), Red if up, Grey if stable |
| Left Border | Dynamic: green if < 2%, amber if 2-5%, red if > 5% |
| Threshold Indicator | Horizontal bar (60px wide) showing current error rate position against the configurable threshold. Marker dot on the bar. Bar gradient: green -> amber -> red |
| Sparkline | Hourly error rate for last 24 hours |
| Sublabel | "Threshold: {threshold}% | {error_count} errors / {total_events} events" |
| Threshold | Warning at configurable threshold (default 3%), Critical at 2x threshold |
| Tooltip | "Percentage of agent events that resulted in an error state. Includes: timeouts, rate limits, loops, hallucination flags, and unhandled exceptions." |
| API | `GET /api/v1/metrics/error-rate?period=today` -> `rate`, `count`, `total`, `threshold` |

---

#### Card 7: Average Response Time

| Property | Value |
|----------|-------|
| Label | "Avg Response Time" |
| Primary Value | Duration (e.g., "1.2s") |
| Format | Milliseconds if < 1000: "847ms". Seconds with 1 decimal if >= 1000: "1.2s". Minutes if >= 60s: "1.3m" |
| Icon | `Clock` icon (Lucide) |
| Trend | Change vs. previous period |
| Trend Color | Green if down (faster = good), Red if up, Grey if stable |
| Left Border | Dynamic: green if < SLA, amber if 80-100% SLA, red if > SLA |
| Percentile Bands | Three thin horizontal lines (30px wide) showing P50, P90, P99 values with labels. Lines color-coded: P50 green, P90 amber, P99 red |
| Sparkline | Hourly average response time for last 24 hours |
| Sublabel | "P50: {p50} | P90: {p90} | P99: {p99}" |
| Threshold | Warning if P90 > SLA target, Critical if P50 > SLA target |
| Tooltip | "Average time from task assignment to task completion across all agents. Percentile breakdown shows distribution of response times." |
| API | `GET /api/v1/metrics/latency?period=today` -> `avg`, `p50`, `p90`, `p99`, `sla_target` |

---

#### Card 8: Active Sessions

| Property | Value |
|----------|-------|
| Label | "Active Sessions" |
| Primary Value | Integer with real-time counter animation |
| Format | Raw integer. On value change, the old number rolls out (upward) and new number rolls in (from below) over 300ms with `ease-out-cubic` |
| Icon | `Radio` icon (Lucide), with a pulsing green dot when > 0 sessions |
| Trend | None (real-time value, no comparison) |
| Trend Color | N/A |
| Left Border | `#22C55E` (green) when > 0, `#6B7280` (grey) when 0 |
| Real-Time Counter | The primary value updates via WebSocket. Each update triggers the digit-roll animation. A subtle pulse effect (scale 1.0 to 1.05 over 200ms) accompanies each change |
| Sparkline | Rolling 1-hour session count (per-minute granularity) |
| Sublabel | "Peak today: {peak} at {peak_time}" |
| Threshold | No threshold (informational) |
| Tooltip | "Number of agent execution sessions currently active. A session starts when an agent begins a task pipeline and ends when all tasks complete or fail." |
| API | WebSocket `/ws/sessions/count` -> real-time push |

---

#### Card 9: XP Earned Today (Gamified)

| Property | Value |
|----------|-------|
| Label | "XP Earned Today" (Gamified Mode) / "Performance Points Today" (Professional Mode) |
| Primary Value | Integer with animated count-up on load (0 to current value over 1.5s, `ease-out-expo`) |
| Format | Comma-separated thousands (e.g., "12,450") |
| Icon | `Trophy` icon (Lucide), gold color `#F59E0B` |
| Trend | Change vs. yesterday same time |
| Trend Color | Green if up, Grey if flat, Amber if down |
| Left Border | `#F59E0B` (amber/gold, gamification accent) |
| Animation Trigger | When new XP is earned during the current session, the card briefly flashes with a gold shimmer effect (0.5s), the primary value animates up by the delta amount, and a "+{amount} XP" floater rises and fades from the card (same as the canvas XP pop-up) |
| Sparkline | Hourly XP accumulation for current day |
| Sublabel | "Top earner: {agent_name} (+{agent_xp} XP)" |
| Threshold | None (gamification, always positive) |
| Tooltip | "Total experience points earned by all agents today. XP is awarded for task completion, efficiency bonuses, streak bonuses, and achievements." |
| API | `GET /api/v1/gamification/xp?period=today` -> `total`, `top_agent`, `hourly` |

---

#### Card 10: Achievements Unlocked

| Property | Value |
|----------|-------|
| Label | "Achievements" (Gamified) / "Milestones" (Professional) |
| Primary Value | Integer count of achievements unlocked in selected period |
| Format | Raw integer |
| Icon | `Award` icon (Lucide) |
| Trend | Count vs. previous period |
| Trend Color | Green if up, Grey if flat or down |
| Left Border | `#8B5CF6` (violet, achievement accent) |
| Recent Badge Preview | Row of 3 most recent badge icons (16x16 each) below the primary value. Badges use the rarity color system: grey (Common), green (Uncommon), blue (Rare), purple (Epic), gold (Legendary). Clicking a badge opens the badge detail modal |
| Sparkline | None (replaced by badge preview row) |
| Sublabel | "{total_unlocked} / {total_available} total badges" |
| Threshold | None (gamification) |
| Tooltip | "Number of achievement badges unlocked across all agents during the selected period. Badges reward milestones like '100 tasks completed' or '0 errors in 24h'." |
| API | `GET /api/v1/gamification/achievements?period=today` -> `count`, `recent`, `total_unlocked`, `total_available` |

---

#### Card 11: Cost Savings

| Property | Value |
|----------|-------|
| Label | "Cost Savings" |
| Primary Value | USD currency (e.g., "$412.60") |
| Format | Dollar sign, comma-separated, 2 decimal places |
| Icon | `PiggyBank` icon (Lucide) |
| Trend | Change vs. previous period |
| Trend Color | Green if up (more savings = good), Amber if down |
| Left Border | `#22C55E` (green, savings are positive) |
| Baseline Comparison | Small text: "vs {baseline_name} baseline" with a percentage: "(-34% from baseline)" |
| Sparkline | Daily savings for last 7 days |
| Sublabel | "Savings from: model optimization ({pct1}%), reduced retries ({pct2}%), loop prevention ({pct3}%)" |
| Threshold | None (informational, always encouraging) |
| Tooltip | "Estimated cost savings compared to the configured baseline. Baseline can be the first week of operation, a fixed reference cost, or an industry benchmark." |
| API | `GET /api/v1/costs/savings` -> `total`, `breakdown`, `baseline_name` |

---

#### Card 12: Uptime Percentage

| Property | Value |
|----------|-------|
| Label | "Uptime" |
| Primary Value | Percentage (e.g., "99.7%") |
| Format | 1 decimal place with % suffix. At 100.0%, show as "100%" (no decimal) |
| Icon | `Shield` icon (Lucide) |
| Trend | Change vs. previous period |
| Trend Color | Green if up or stable at target, Red if down below SLO |
| Left Border | Dynamic: green if >= SLO target, amber if within 0.5% of SLO, red if below SLO |
| SLO Indicator | Circular gauge (24px) showing uptime vs SLO target. Arc fill: green when meeting SLO, red when below. SLO target marked as a notch on the arc |
| Sparkline | Daily uptime for last 30 days |
| Sublabel | "SLO: {slo_target}% | Downtime: {downtime_minutes}m this period" |
| Threshold | Warning at SLO - 0.5%, Critical at SLO breach |
| Tooltip | "Percentage of time that at least one agent in the workspace was operational and processing events. Downtime = zero active agents." |
| API | `GET /api/v1/metrics/uptime?period=30d` -> `pct`, `slo_target`, `downtime_minutes` |

---

#### Card 13: Tasks in Queue

| Property | Value |
|----------|-------|
| Label | "Tasks in Queue" |
| Primary Value | Integer (e.g., "37") |
| Format | Raw integer. Pulses red if > queue capacity threshold |
| Icon | `Layers` icon (Lucide) |
| Trend | Change in last 5 minutes ("+12" or "-5") |
| Trend Color | Amber if growing (queue backup), Green if shrinking, Grey if stable |
| Left Border | Dynamic: green if < 50% capacity, amber if 50-80%, red if > 80% |
| Wait Time Estimate | Below primary value: "Est. wait: ~{minutes}m" calculated from (queue_size / throughput_per_minute) |
| Sparkline | Per-minute queue depth for last hour |
| Sublabel | "Throughput: {tasks_per_min}/min | Capacity: {queue_size}/{max_capacity}" |
| Threshold | Warning at 70% capacity, Critical at 90% |
| Tooltip | "Number of tasks currently queued and waiting for an available agent. Wait time is estimated from current throughput rate." |
| API | `GET /api/v1/tasks/queue` -> `depth`, `throughput_per_min`, `max_capacity`, `est_wait` |

---

#### Card 14: Agent Utilization Percentage

| Property | Value |
|----------|-------|
| Label | "Agent Utilization" |
| Primary Value | Percentage (e.g., "73%") |
| Format | Integer percentage (no decimals) with % suffix |
| Icon | `Activity` icon (Lucide) |
| Trend | Change vs. previous period |
| Trend Color | Green if stable 60-85% (healthy range), Amber if < 40% (underutilized) or > 90% (overloaded), Red if > 95% |
| Left Border | Dynamic: green if 50-85%, amber if 30-49% or 86-95%, red if < 30% or > 95% |
| Capacity Indicator | Horizontal bar (80px) with filled portion representing utilization. Bar color matches left border logic. Capacity surplus/deficit text: "+{n} agents available" or "at capacity" |
| Sparkline | Hourly utilization for last 24 hours |
| Sublabel | "{active_agents} active / {total_agents} total | {idle_agents} idle" |
| Threshold | Warning outside 40-90% range, Critical outside 20-95% range |
| Tooltip | "Percentage of registered agents currently executing tasks or in non-idle states. Healthy utilization is 60-85%. Below 40% suggests over-provisioning. Above 90% suggests capacity constraints." |
| API | `GET /api/v1/agents/utilization` -> `pct`, `active`, `total`, `idle` |

---

#### Card 15: Loop Incidents

| Property | Value |
|----------|-------|
| Label | "Loop Incidents" |
| Primary Value | Integer (e.g., "4") |
| Format | Raw integer. "0" displayed in green with checkmark |
| Icon | `RefreshCw` icon (Lucide), red when > 0 |
| Trend | Change vs. previous period |
| Trend Color | Green if down or zero, Red if up |
| Left Border | Dynamic: green if 0, amber if 1-2, red if >= 3 |
| Severity Breakdown | Three small colored dots below the value: green dot with count (suspected), amber dot with count (confirmed), red dot with count (critical). Example: "0 suspected | 2 confirmed | 2 critical" |
| Sparkline | Daily loop incident count for last 7 days |
| Sublabel | "Cost wasted: ${wasted_cost} | Last: {last_incident_time}" |
| Threshold | Warning at 1 confirmed loop, Critical at 3 or any critical-severity loop |
| Tooltip | "Number of loop incidents detected in the selected period. Loops occur when agents repeat the same action pattern beyond the configured threshold. Severity: Suspected (3-4 iterations), Confirmed (5+ iterations), Critical (10+ iterations or >$50 wasted)." |
| API | `GET /api/v1/alerts/loops?period=today` -> `count`, `suspected`, `confirmed`, `critical`, `wasted_cost` |

---

## 4. Chart Specifications

### 4.1 Token Usage Over Time (Stacked Area Chart)

**Library:** Recharts

**Purpose:** Show token consumption patterns over time, broken down by type (input/output/cache) or by agent or by model.

| Property | Specification |
|----------|--------------|
| Chart type | Stacked area chart |
| X axis | Time. Granularity adapts: 5-minute intervals (last hour), hourly (last 24h), daily (last 30d), weekly (last 90d) |
| Y axis | Token count (integer). Axis label: "Tokens". Grid lines at auto-computed intervals |
| Default stacking | By token type: Input (`#818CF8` indigo), Output (`#34D399` emerald), Cache/System (`#60A5FA` blue) |
| Alt stacking 1 | By agent: Uses extended data palette colors (Series 1-8) |
| Alt stacking 2 | By model: GPT-4o (`#818CF8`), Claude (`#34D399`), Gemini (`#FBBF24`), GPT-4o-mini (`#F472B6`), Other (`#60A5FA`) |
| Fill opacity | 0.25 for area fill, 1.0 for stroke |
| Stroke width | 2px |
| Tooltip | On hover, vertical crosshair appears. Tooltip box shows: timestamp, each series name + value + percentage of total, total for that time bucket |
| Annotations | Red dashed vertical line at each cost alert or loop incident timestamp. Hover on annotation shows alert detail |
| Interaction - Click | Click any time bucket to set it as the time range filter for all charts on the dashboard |
| Interaction - Brush | Drag-select a time range to zoom into that range. "Reset Zoom" button appears after zoom |
| Interaction - Legend | Click a legend item to toggle that series on/off. Double-click to isolate that series |
| Responsive | Width: 100% of container. Height: min 200px, max 320px, default 280px. On mobile: height reduces to 180px |
| Animation | On initial load, areas animate upward from X axis over 600ms with `ease-out-cubic`. On data update, smooth transition of existing points over 300ms |
| Empty State | Flat zero-line with dashed style and centered text: "No token data for this period" |
| Data Format | `{ timestamp: ISO8601, input_tokens: number, output_tokens: number, cache_tokens: number }[]` |

**Recharts Component Structure:**
```tsx
<ResponsiveContainer width="100%" height={280}>
  <AreaChart data={tokenData}>
    <defs>
      <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818CF8" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#818CF8" stopOpacity={0.05} />
      </linearGradient>
      {/* Similar for output and cache */}
    </defs>
    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
    <YAxis tickFormatter={abbreviateNumber} />
    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" strokeOpacity={0.3} />
    <Tooltip content={<CustomTokenTooltip />} />
    <Area type="monotone" dataKey="input_tokens" stackId="1"
          stroke="#818CF8" fill="url(#inputGrad)" strokeWidth={2} />
    <Area type="monotone" dataKey="output_tokens" stackId="1"
          stroke="#34D399" fill="url(#outputGrad)" strokeWidth={2} />
    <Area type="monotone" dataKey="cache_tokens" stackId="1"
          stroke="#60A5FA" fill="url(#cacheGrad)" strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>
```

---

### 4.2 Cost Breakdown Treemap

**Library:** Apache ECharts

**Purpose:** Hierarchical cost attribution showing where money is being spent, with drill-down from agent group to individual agent to task to model.

| Property | Specification |
|----------|--------------|
| Chart type | Treemap |
| Data hierarchy | Level 1: Agent group/team. Level 2: Individual agent. Level 3: Task category. Level 4: Model used |
| Size encoding | Total cost in USD (area proportional to spend) |
| Color encoding | Cost efficiency (cost per successful task). Scale: `#22C55E` (most efficient) -> `#F59E0B` (median) -> `#EF4444` (least efficient) |
| Label format | Agent name on first line, dollar amount on second line. Example: "ResearchBot\n$42.10" |
| Label visibility | Labels show when node area > 2000px^2. Below that, labels appear on hover only |
| Interaction - Click | Click a node to drill into its children. Breadcrumb trail appears at top: "All > Team Alpha > ResearchBot > Summarize Tasks" |
| Interaction - Right-click | Context menu: "Drill Down", "Zoom to Parent", "View Agent Detail", "Copy Cost Data" |
| Interaction - Hover | Tooltip: Agent name, total cost, tasks completed, cost per task, total tokens, model breakdown |
| Responsive | Width: 100% of container. Height: 320px. On mobile: 240px with simplified labels |
| Animation | Initial render: tiles morph from a single rectangle to the treemap layout over 500ms. Data update: smooth morph transition of tile sizes over 500ms |
| Border | Each tile has 2px gap (acts as visual separator). Top-level group tiles have 4px gap |
| Empty State | Single grey tile with text: "No cost data available" |
| Data Format | `{ name: string, value: number, costPerTask: number, children?: TreemapNode[] }` |

**ECharts Configuration:**
```javascript
{
  series: [{
    type: 'treemap',
    data: costData,
    leafDepth: 2,
    roam: false,
    nodeClick: 'zoomToNode',
    breadcrumb: {
      show: true,
      top: 0,
      itemStyle: { color: '#1A1F2E', borderColor: '#374151' },
      textStyle: { color: '#D1D5DB', fontSize: 12 }
    },
    levels: [
      { itemStyle: { borderWidth: 4, borderColor: '#0F1117', gapWidth: 4 },
        upperLabel: { show: true, height: 24, color: '#F9FAFB' } },
      { itemStyle: { borderWidth: 2, borderColor: '#1F2937', gapWidth: 2 },
        upperLabel: { show: true, height: 20, color: '#D1D5DB' } },
      { itemStyle: { borderWidth: 1, gapWidth: 1 }, colorSaturation: [0.3, 0.8] }
    ],
    label: { show: true, formatter: '{b}\n{c}', color: '#F9FAFB', fontSize: 11 },
    visualMap: {
      type: 'continuous', min: 0, max: maxCostPerTask,
      inRange: { color: ['#22C55E', '#F59E0B', '#EF4444'] }
    }
  }]
}
```

---

### 4.3 Task Completion Funnel

**Library:** Recharts (custom funnel using stacked horizontal bars)

**Purpose:** Show the pipeline from task assignment through to completion or failure, revealing where tasks drop off.

| Property | Specification |
|----------|--------------|
| Chart type | Horizontal funnel (rendered as stacked horizontal bars with decreasing widths) |
| Stages | Assigned -> Started -> Executing -> Completed OR Failed |
| Bar colors | Assigned: `#60A5FA` (blue). Started: `#818CF8` (indigo). Executing: `#34D399` (emerald). Completed: `#22C55E` (green). Failed: `#EF4444` (red) |
| Bar height | 36px per stage, 8px gap between bars |
| Value display | Count and percentage of previous stage. Example: "Started: 812 (95.9% of Assigned)" |
| Interaction - Hover | Tooltip shows count, percentage, avg duration at this stage, drop-off count |
| Interaction - Click | Click a stage to filter the task table to tasks currently at that stage |
| Responsive | Width: 100% of container. Height: auto (36px * stages + gaps). On mobile: labels move above bars |
| Animation | Bars animate from left to right on initial render (400ms staggered by 100ms per stage) |
| Failure Branch | At the "Executing" stage, a branch line goes downward to a "Failed" bar. The failed bar is red and shows failed count with error type breakdown on hover |
| Conversion Rate | Large text below the funnel: "Overall Completion Rate: {pct}%" |
| Data Format | `{ stage: string, count: number, pct_of_previous: number, avg_duration_ms: number }[]` |

---

### 4.4 Quality Score Violin Plot

**Library:** Apache ECharts (custom series using scatter + custom shapes)

**Purpose:** Show the distribution of quality scores per agent, revealing not just the average but the full shape of quality output.

| Property | Specification |
|----------|--------------|
| Chart type | Violin plot (kernel density estimation rendered as mirrored area shapes) |
| X axis | Agent name (categorical) |
| Y axis | Quality score (0.0 to 1.0) |
| Violin fill | `#818CF8` (indigo) at 0.25 opacity |
| Violin stroke | `#6366F1` (indigo, 600) at 1.5px |
| Median marker | White circle, 5px radius, centered on median |
| Interquartile range | Thick vertical bar (6px wide), dark indigo `#4338CA`, from Q1 to Q3 |
| Outlier markers | Red circles (`#EF4444`, 4px) for any individual score below 0.5 |
| Reference line | Horizontal dashed line at the team quality target (default 0.85), grey `#6B7280` |
| KDE bandwidth | 0.05 (Gaussian kernel). Adjustable via slider in chart settings |
| Tooltip | On hover over violin: Agent name, Min, Q1, Median, Mean, Q3, Max, Std Dev, Sample Size |
| Responsive | Width: 100% of container. Height: 320px. Horizontal scroll if > 8 agents |
| Animation | Violins grow from center line outward over 500ms |
| Sort options | Sort agents by: median (default), mean, min, max, standard deviation |
| Data Format | `{ agent: string, scores: number[], stats: { min, q1, median, mean, q3, max, std } }[]` |

---

### 4.5 Agent Activity Heatmap (Hour x Day-of-Week)

**Library:** Apache ECharts (calendar/heatmap series)

**Purpose:** Reveal temporal patterns in agent activity. When are agents busiest? When do errors cluster?

| Property | Specification |
|----------|--------------|
| Chart type | Grid heatmap (7 rows x 24 columns) |
| X axis | Hour of day (0-23, labeled as "12am", "1am", ..., "11pm") |
| Y axis | Day of week (Monday through Sunday) |
| Cell size | 28px x 28px, 2px gap |
| Color scale (sequential) | 6 levels: `#0F1117` (zero), `#1E3A5F` (low), `#1D6FA5` (medium-low), `#3B82F6` (medium), `#60A5FA` (medium-high), `#93C5FD` (high) |
| Value encoding | Default: task count per hour-day cell. Toggle options: token usage, cost, error count |
| Tooltip | "Monday, 2:00 PM - 3:00 PM: 47 tasks, 12,340 tokens, $1.82, 2 errors" |
| Interaction - Click | Click a cell to set the dashboard time filter to that hour-of-day on that day-of-week (shows all matching historical data) |
| Responsive | Width: auto (28px * 24 + gaps = ~720px). Horizontal scroll on smaller viewports. Height: auto (28px * 7 + gaps = ~210px) |
| Animation | Cells fade in sequentially from top-left to bottom-right over 600ms |
| Legend | Color gradient bar below the heatmap showing min to max values with 5 labeled stops |
| Data Format | `{ day: 0-6, hour: 0-23, value: number }[]` |

---

### 4.6 Response Time Percentile Chart

**Library:** Apache ECharts (candlestick series adapted for percentile display)

**Purpose:** Show the full distribution of response times over time, not just averages. P50, P90, P95, P99 tell a more complete story than mean.

| Property | Specification |
|----------|--------------|
| Chart type | Candlestick-style percentile chart |
| X axis | Time (15-minute buckets for last 6h, hourly for last 24h, daily for last 7d) |
| Y axis | Response time (milliseconds). Log scale toggle available |
| Candle body | P25 to P75 range (interquartile range) |
| Candle wick (lower) | Extends to P5 |
| Candle wick (upper) | Extends to P95 |
| P50 marker | Horizontal line inside body at median, 2px, white |
| P99 marker | Small dot above upper wick, red `#EF4444` |
| Color - Within SLA | Body: `#22C55E` at 0.6 opacity. Wick: `#22C55E` at 0.4 |
| Color - Exceeding SLA | Body: `#EF4444` at 0.6 opacity. Wick: `#EF4444` at 0.4 |
| SLA reference line | Horizontal dashed line at SLA target (e.g., 2000ms), `#6B7280`, labeled |
| Tooltip | P5, P25, P50, P75, P95, P99, Mean, Request Count for the hovered bucket |
| Interaction | Click bucket to show individual request scatter plot for that time window |
| Responsive | Width: 100%. Height: 280px. On mobile: simplified to line chart of P50 only |
| Animation | Candles grow from center point outward over 400ms staggered |
| Data Format | `{ timestamp: ISO8601, p5: number, p25: number, p50: number, p75: number, p95: number, p99: number, mean: number, count: number }[]` |

---

### 4.7 Error Classification Pie Chart

**Library:** Recharts (PieChart)

**Purpose:** Break down errors by type to identify the dominant failure mode and prioritize fixes.

| Property | Specification |
|----------|--------------|
| Chart type | Donut chart (pie with inner radius) |
| Inner radius | 60% of outer radius (creates donut hole) |
| Center label | Total error count in large text (24px bold), "errors" in small text (10px) below |
| Slices | Timeout (`#EF4444`), Rate Limit (`#F59E0B`), Loop Detected (`#F97316`), Hallucination (`#D946EF`), Context Overflow (`#8B5CF6`), Unhandled Exception (`#6B7280`) |
| Slice labels | Percentage inside the slice if angle > 30deg. Name outside with leader line if angle > 15deg. Hidden if angle < 15deg (appears on hover) |
| Stroke | 2px `#0F1117` between slices |
| Interaction - Hover | Slice expands outward by 8px. Tooltip: error type, count, percentage, trend vs previous period |
| Interaction - Click | Click slice to filter the error log table to that error type |
| Responsive | Width and height: 280px x 280px on desktop, 200px x 200px on mobile |
| Animation | Slices animate from 0 degrees clockwise, each slice grows its arc over 400ms |
| Empty State | Full grey donut with "0 errors" in center and checkmark icon |
| Data Format | `{ type: string, count: number, pct: number, trend: number }[]` |

---

### 4.8 Agent Comparison Radar Chart

**Library:** Recharts (RadarChart)

**Purpose:** Multi-dimensional comparison of agents across 5 key performance dimensions. Makes trade-offs visible at a glance.

| Property | Specification |
|----------|--------------|
| Chart type | Radar (spider) chart |
| Dimensions (5 axes) | Speed (tasks/hour), Quality (avg quality score), Cost Efficiency (1 / cost per task, normalized), Reliability (1 - error rate), Volume (total tasks, normalized) |
| Normalization | All dimensions normalized to 0-100 scale. 100 = best in current workspace. 0 = worst |
| Grid | Pentagon grid with 5 concentric levels (20, 40, 60, 80, 100). Grid lines: `#1F2937` at 0.3 opacity |
| Agent overlay | Up to 4 agents overlaid simultaneously. Each agent uses a different color from the extended palette |
| Fill | Each agent's polygon filled at 0.15 opacity of its color |
| Stroke | 2px per agent's polygon line |
| Point markers | 6px circles at each axis intersection |
| Legend | Color-coded agent names below chart. Click to toggle visibility |
| Tooltip | On hover over a point: Agent name, dimension name, raw value, normalized value, rank among all agents |
| Interaction | Click "Add Agent" to include another agent in the comparison (up to 4). Click "Remove" on legend to remove |
| Responsive | Width and height: 360px x 360px on desktop, 280px x 280px on mobile |
| Animation | Polygon morphs from center point to final shape over 500ms. When adding/removing agents, existing polygons smoothly re-draw |
| Data Format | `{ agent: string, color: string, speed: number, quality: number, cost: number, reliability: number, volume: number }[]` |

---

### 4.9 Cost Projection Line Chart

**Library:** Recharts (LineChart)

**Purpose:** Compare actual cumulative cost against projected spend and budget limit. Answers: "Are we going to blow our budget this month?"

| Property | Specification |
|----------|--------------|
| Chart type | Multi-line chart with area fill |
| X axis | Day of month (1-31) |
| Y axis | Cumulative cost in USD |
| Line 1 - Actual | Solid line, `#3B82F6` (blue), 2.5px, area fill below at 0.1 opacity |
| Line 2 - Projected | Dashed line (`8px dash, 4px gap`), `#818CF8` (indigo), 2px. Extends from last actual data point to end of month using linear regression of last 7 days |
| Line 3 - Budget | Horizontal solid line at budget amount, `#EF4444` (red) at 0.5 opacity, with label "Budget: ${amount}" |
| Line 4 - Ideal pace | Dotted diagonal from (Day 1, $0) to (Day 31, budget), `#6B7280` (grey) at 0.3 opacity |
| Danger zone | If projected line crosses budget line, the area between projected and budget is filled with `rgba(239,68,68,0.1)` and a warning annotation appears at the intersection point: "Projected overspend: ${excess} by month end" |
| Tooltip | On hover: Day, Actual cost (if past), Projected cost, Budget, Pace (ahead/behind by ${amount}) |
| Interaction | Click "Adjust Projection" to change projection method (linear, exponential, 7-day rolling) |
| Responsive | Width: 100%. Height: 280px. On mobile: 200px |
| Animation | Actual line draws from left to right over 800ms. Projected line fades in after actual completes |
| Data Format | `{ day: number, actual: number | null, projected: number | null, budget: number, ideal_pace: number }[]` |

---

### 4.10 Cumulative XP Chart (Gamified)

**Library:** Recharts (AreaChart)

**Purpose:** Show gamified progress over time. The XP curve should feel motivating -- a rising line that celebrates growth.

| Property | Specification |
|----------|--------------|
| Chart type | Area chart with milestone markers |
| X axis | Date (daily for last 30 days, hourly for last 24 hours toggle) |
| Y axis | Cumulative XP (integer) |
| Area fill | Gradient from `#F59E0B` (gold, top) at 0.3 opacity to transparent at bottom |
| Stroke | 2.5px, `#F59E0B` (gold) |
| Level markers | Horizontal dashed lines at each level threshold. Label on right: "Level {N}" |
| Milestone markers | Diamond-shaped markers on the curve at each achievement unlock. Color matches achievement rarity. Hover shows achievement name and description |
| Multi-agent mode | Toggle to show multiple agents as separate lines (each in their agent color) |
| Tooltip | On hover: Date, XP total, XP earned that period, Level at that point, Achievements unlocked |
| Interaction | Click a milestone marker to open the achievement detail modal |
| Responsive | Width: 100%. Height: 280px |
| Animation | Line draws from left to right over 1000ms with `ease-out-cubic`. Milestone markers pop in with a scale-up (0 to 1 over 200ms) as the line reaches them |
| Professional Mode | Label changes to "Performance Score". Gold color changes to `#3B82F6` (blue). "Level" changes to "Tier". Milestones labeled as "Certifications" |
| Data Format | `{ date: ISO8601, cumulative_xp: number, xp_earned: number, level: number, achievements: { name: string, rarity: string }[] }[]` |

---

### 4.11 Communication Volume Bar Chart

**Library:** Recharts (BarChart)

**Purpose:** Show which agents communicate most and the balance between messages sent and received. Identifies communication bottlenecks and hot-spots.

| Property | Specification |
|----------|--------------|
| Chart type | Grouped bar chart (vertical) |
| X axis | Agent name, sorted by total message volume descending |
| Y axis | Message count |
| Bar groups | Sent (`#60A5FA` blue), Received (`#34D399` emerald) |
| Bar width | 16px per bar, 4px gap between sent/received in a group, 24px gap between agent groups |
| Net indicator | Small arrow above each group: up-arrow (net sender, more sent than received), down-arrow (net receiver, more received), circle (balanced within 10%) |
| Tooltip | Agent name, Messages Sent, Messages Received, Net (sent - received), Unique conversation partners |
| Interaction - Hover | Highlight bars. Show connection lines to other agents who communicated with this agent (as faded lines) |
| Interaction - Click | Navigate to the topology view filtered to this agent's communication graph |
| Responsive | Width: 100%. Height: 260px. Horizontal scroll if > 12 agents |
| Animation | Bars grow from 0 height on initial render, staggered by 50ms per agent group |
| Data Format | `{ agent: string, sent: number, received: number }[]` |

---

### 4.12 Model Usage Distribution (Donut Chart)

**Library:** Recharts (PieChart)

**Purpose:** Show which LLM providers and models are being used across the workspace. Helps identify model dependency and optimization opportunities.

| Property | Specification |
|----------|--------------|
| Chart type | Donut chart with nested rings |
| Outer ring | Model-level breakdown (e.g., GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, Gemini 1.5 Pro) |
| Inner ring | Provider-level aggregation (OpenAI, Anthropic, Google, Other) |
| Provider colors | OpenAI: `#818CF8` (indigo), Anthropic: `#34D399` (emerald), Google: `#FBBF24` (amber), Azure: `#60A5FA` (blue), Other: `#6B7280` (grey) |
| Model colors | Lighter/darker variations of provider color for individual models within the provider |
| Inner radius (outer ring) | 65% of chart radius |
| Inner radius (inner ring) | 35% of chart radius. Outer radius of inner ring: 60% of chart radius |
| Center label | Total model calls in large text, "API calls" in small text below |
| Slice labels | Percentage + model name for outer ring slices > 10%. Provider name for inner ring |
| Tooltip | Model name, Provider, Call count, Token count, Cost, Avg latency |
| Interaction | Click outer ring slice to filter dashboard to that model. Click inner ring slice to filter to that provider |
| Responsive | 300px x 300px desktop, 220px x 220px mobile |
| Animation | Rings animate clockwise from 12 o'clock over 600ms. Inner ring starts 200ms after outer ring |
| Data Format | `{ provider: string, models: { name: string, calls: number, tokens: number, cost: number }[] }[]` |

---

### 4.13 Library Selection Quick Reference

| Chart | Library | Rationale |
|-------|---------|-----------|
| Token Usage Over Time (stacked area) | Recharts | Standard area chart, React-native, simple data binding |
| Cost Breakdown Treemap | Apache ECharts | Treemap with drill-down not available in Recharts |
| Task Completion Funnel | Recharts | Custom horizontal bars; standard bar chart primitives |
| Quality Score Violin | Apache ECharts | Custom series required for KDE rendering |
| Activity Heatmap | Apache ECharts | Calendar heatmap with custom cells |
| Response Time Percentiles | Apache ECharts | Candlestick series adaptation |
| Error Classification Pie | Recharts | Standard donut/pie with interactions |
| Agent Comparison Radar | Recharts | Built-in RadarChart component |
| Cost Projection | Recharts | Multi-line with area fill, standard |
| Cumulative XP | Recharts | Area chart with custom markers |
| Communication Volume | Recharts | Grouped bar chart, standard |
| Model Usage Distribution | Recharts | Nested donut, standard pie variant |

**Rule:** Use Recharts for any chart that can be expressed with standard line/area/bar/pie primitives. Use Apache ECharts when the chart type requires canvas-level rendering (treemap, heatmap, violin, candlestick) or when the dataset exceeds 10,000 data points (ECharts WebGL mode).

---

## 5. Infographic Compositions

### 5.1 Agent Health Report (Single-Page Printable Summary)

**Purpose:** A one-page, printable summary of the entire workspace's agent health. Designed for weekly team meetings, stakeholder updates, and executive briefings.

**Dimensions:** A4 portrait (210mm x 297mm) at 300 DPI for print. 1240px x 1754px for screen render.

**Layout:**

```
+------------------------------------------------------+
|                                                      |
|  [OAV Logo]  AGENT HEALTH REPORT    [Date Range]    |
|  ________________________________________________    |
|                                                      |
|  EXECUTIVE SUMMARY                                   |
|  "24 agents processed 4,821 tasks this week with     |
|   a 96.8% success rate. Total cost: $847.30,         |
|   15% below budget. 2 loop incidents detected        |
|   and resolved."                                     |
|  ________________________________________________    |
|                                                      |
|  KEY METRICS (4 KPI cards in a row)                  |
|  [Tasks: 4,821] [Cost: $847] [Errors: 3.2%] [Up:99%]|
|  ________________________________________________    |
|                                                      |
|  TOP PERFORMERS          NEEDS ATTENTION             |
|  1. ResearchBot (0.94)   1. WriterBot (0.72, +errs)  |
|  2. ReviewBot (0.91)     2. PlannerBot (timeout 3x)  |
|  3. CoderBot (0.88)                                  |
|  ________________________________________________    |
|                                                      |
|  COST TREND (7-day sparkline bar chart)              |
|  Mon $92 | Tue $128 | Wed $134 | Thu $115 | ...     |
|  ________________________________________________    |
|                                                      |
|  ERROR BREAKDOWN        AGENT UTILIZATION            |
|  [Mini Donut]           [Horizontal Stacked Bar]     |
|  Timeout: 42%           Active: 75%                  |
|  RateLimit: 28%         Idle: 18%                    |
|  Loop: 18%              Error: 4%                    |
|  Other: 12%             Offline: 3%                  |
|  ________________________________________________    |
|                                                      |
|  RECOMMENDATIONS                                     |
|  * Switch WriterBot to GPT-4o-mini for simple tasks  |
|  * Investigate PlannerBot timeouts (3 this week)     |
|  * Consider adding capacity: queue wait avg 4.2min   |
|  ________________________________________________    |
|                                                      |
|  Generated by OpenAgentVisualizer | oav.io           |
|                                                      |
+------------------------------------------------------+
```

**Generation Rules:**
- Report auto-generates weekly (configurable: daily, weekly, monthly)
- Executive summary is AI-generated natural language from the metrics data
- "Top Performers" ranked by composite efficiency score (quality * completion_rate / cost_per_task)
- "Needs Attention" identifies agents with declining trends or threshold breaches
- Recommendations are rule-based: model downgrade suggestions, retry reduction, capacity alerts
- Color palette switches to print-safe mode (see Section 10)
- All charts render as static images (SVG or PNG) for PDF embedding

---

### 5.2 Weekly Digest (Email-Friendly Summary Infographic)

**Purpose:** A visually appealing email summary sent to workspace administrators weekly. Must render correctly in major email clients (Gmail, Outlook, Apple Mail).

**Dimensions:** 600px wide (email standard), variable height. Inline CSS only (no external stylesheets for email compatibility).

**Layout:**

```
+--------------------------------------------------+
|  [OAV Logo]   Weekly Agent Digest                 |
|  Week of March 9-15, 2026                         |
+--------------------------------------------------+
|                                                    |
|  YOUR WEEK AT A GLANCE                            |
|  +-----------+ +-----------+ +-----------+        |
|  | 4,821     | | $847.30   | | 96.8%     |        |
|  | Tasks     | | Total Cost| | Success   |        |
|  | +12% ^^   | | -15% vv   | | +1.2% ^^  |        |
|  +-----------+ +-----------+ +-----------+        |
|                                                    |
|  HIGHLIGHT OF THE WEEK                            |
|  [Achievement Badge Icon]                          |
|  ResearchBot earned "Centurion" badge              |
|  (1,000 tasks completed!)                          |
|                                                    |
|  COST SAVINGS THIS WEEK: $142.60                  |
|  [Green bar chart showing daily savings]           |
|                                                    |
|  TOP 3 AGENTS BY EFFICIENCY                       |
|  #1 ResearchBot  [==========] 0.94               |
|  #2 ReviewBot    [=========]  0.91               |
|  #3 CoderBot     [========]   0.88               |
|                                                    |
|  ALERTS THIS WEEK                                 |
|  [!] 2 loop incidents (resolved)                  |
|  [!] WriterBot error rate up 40%                  |
|  [i] 3 agents hit 80% context window              |
|                                                    |
|  [View Full Dashboard -->]                        |
|                                                    |
|  ------------------------------------------------ |
|  OpenAgentVisualizer | Unsubscribe | Settings     |
+--------------------------------------------------+
```

**Email Rendering Rules:**
- All images are pre-rendered as PNG and hosted on CDN (no SVG in email)
- Charts are rendered server-side as static images (600px wide)
- Fonts: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- Colors: High contrast for light email backgrounds. Use dark text on white/light grey
- Progress bars rendered as HTML tables with colored cells (email-safe)
- All links include UTM parameters for tracking engagement
- Alt text on all images for accessibility
- Inline CSS only, tables for layout (email client compatibility)

---

### 5.3 Cost Optimization Report

**Purpose:** Highlight specific actionable savings opportunities with estimated dollar impact. Designed for monthly review by Engineering Managers and Finance teams.

**Layout:**

```
+------------------------------------------------------+
|  COST OPTIMIZATION REPORT                            |
|  Period: March 2026 | Workspace: Production          |
+------------------------------------------------------+
|                                                      |
|  SAVINGS SUMMARY                                     |
|  +----------------------------------------------+    |
|  | Identified Savings: $1,240/mo                 |    |
|  | Already Captured:   $412/mo                   |    |
|  | Remaining Opportunity: $828/mo                |    |
|  +----------------------------------------------+    |
|                                                      |
|  OPPORTUNITY #1: Model Downgrade         ~$520/mo    |
|  Agent: ResearchBot                                  |
|  Current: GPT-4o ($0.03/1K input)                    |
|  Recommended: GPT-4o-mini ($0.00015/1K input)        |
|  Impact: 87% of ResearchBot tasks are simple lookups |
|          that achieve identical quality on mini.      |
|  Evidence: [Mini bar chart comparing quality scores   |
|            GPT-4o vs GPT-4o-mini on ResearchBot tasks]|
|  Action: [Apply Recommendation] button               |
|                                                      |
|  OPPORTUNITY #2: Retry Reduction          ~$180/mo   |
|  Agent: CoderBot                                     |
|  Current: 3.2 avg retries per task                   |
|  Recommended: Improve prompt to reduce to 1.5 retries|
|  Impact: Each retry costs ~$0.12 avg. 3200 tasks/mo  |
|          * 1.7 saved retries * $0.12 = $652 saved    |
|  Evidence: [Histogram of retry counts per task]       |
|  Action: [View Prompt Optimization Suggestions]       |
|                                                      |
|  OPPORTUNITY #3: Loop Prevention          ~$128/mo   |
|  Agents: WriterBot, PlannerBot                       |
|  Current: 4 loop incidents/week, avg $32 wasted each |
|  Recommended: Reduce loop threshold from 5 to 3      |
|  Evidence: [Cost-per-loop scatter plot]               |
|  Action: [Update Loop Threshold]                     |
|                                                      |
|  COST TREND PROJECTION                               |
|  [Cost Projection Chart - current vs optimized path] |
|  Current trajectory: $3,420/mo                       |
|  Optimized trajectory: $2,180/mo                     |
|                                                      |
+------------------------------------------------------+
```

---

### 5.4 Team Performance Scorecard (Gamified)

**Purpose:** Gamified team comparison view designed for display on team dashboards, shared screens, and weekly standup presentations.

**Layout:**

```
+------------------------------------------------------+
|  TEAM PERFORMANCE SCORECARD                          |
|  This Week | [Gamified Mode v]                       |
+------------------------------------------------------+
|                                                      |
|  TEAM CHAMPION: ResearchBot                          |
|  [Large Avatar with Crown] Level 14 | XP: 4,820     |
|  "Most Efficient Agent" | Efficiency Score: 0.94     |
|  [Confetti animation on first load]                  |
|                                                      |
|  +---------+---------+---------+---------+---------+ |
|  |   #1    |   #2    |   #3    |   #4    |   #5    | |
|  | [Avtr]  | [Avtr]  | [Avtr]  | [Avtr]  | [Avtr]  | |
|  | ResBo   | CodBot  | RevBot  | MgrBot  | WrtBot  | |
|  | Lv14    | Lv12    | Lv11    | Lv10    | Lv8     | |
|  | 0.94    | 0.91    | 0.88    | 0.85    | 0.82    | |
|  | [*****] | [****-] | [****-] | [***--] | [***--] | |
|  +---------+---------+---------+---------+---------+ |
|                                                      |
|  WEEKLY HIGHLIGHTS                                   |
|  [Badge] ResearchBot: "Centurion" (1000 tasks)      |
|  [Badge] ReviewBot: "Zero Error" (100 tasks, 0 err) |
|  [XP]    CoderBot earned 1,420 XP this week (+22%)  |
|  [Arrow] WriterBot moved up 2 positions              |
|                                                      |
|  RADAR COMPARISON (Top 3)                            |
|  [Radar chart overlaying ResBot, CodBot, RevBot]     |
|  Speed | Quality | Cost | Reliability | Volume       |
|                                                      |
|  AWARDS                                              |
|  Fastest: CoderBot (avg 0.8s/task)                   |
|  Cheapest: WriterBot ($0.29/task)                    |
|  Most Reliable: ReviewBot (0.5% error rate)          |
|  Most Prolific: CoderBot (542 tasks)                 |
|                                                      |
+------------------------------------------------------+
```

**Professional Mode Variant:**
- "TEAM CHAMPION" becomes "TOP PERFORMER"
- Avatar replaced with agent icon (geometric)
- Star ratings replaced with numerical scores
- "XP" replaced with "Performance Points"
- "Badges" replaced with "Certifications"
- "Awards" replaced with "Category Leaders"
- No confetti animation; replaced with subtle highlight border

---

## 6. Data Table Patterns

### 6.1 Base Table Component

All data tables in OpenAgentVisualizer share a common component with consistent behavior.

**Visual Specification:**

| Property | Value |
|----------|-------|
| Header background | `#1A1F2E` (dark mode) / `#F3F4F6` (light mode) |
| Header text | `#D1D5DB`, 12px, font-weight 600, uppercase |
| Row background (even) | `#0F1117` (dark mode) / `#FFFFFF` (light mode) |
| Row background (odd) | `#141820` (dark mode) / `#F9FAFB` (light mode) |
| Row hover | `#1F2937` (dark mode) / `#EFF6FF` (light mode) |
| Row selected | `#1E3A5F` (dark mode) / `#DBEAFE` (light mode) |
| Cell padding | 12px horizontal, 8px vertical |
| Row height | 40px default, 56px with expanded content |
| Border | Bottom border per row: 1px `#1F2937` (dark) / `#E5E7EB` (light) |
| Font | 13px, `#F9FAFB` (dark) / `#111827` (light), monospace for numbers |
| Sticky header | Header row sticks to top on vertical scroll |
| Min column width | 80px |
| Max table height | 480px before vertical scroll activates |

### 6.2 Sorting

- Click column header to sort ascending. Click again for descending. Click third time to clear sort.
- Sort indicator: Up-arrow (ascending) or down-arrow (descending) appears next to header text.
- Multi-column sort: Hold Shift + click to add secondary sort columns. Badge shows sort priority (1, 2, 3).
- Default sort: most recent first (descending timestamp) for event tables; highest value first for metric tables.
- Sort animation: rows slide to new positions over 200ms with `ease-out-cubic`.

### 6.3 Filtering

- Each column header has a filter icon (funnel) that opens a dropdown filter.
- Filter types:
  - Text columns: Search input with debounced filtering (300ms). Supports regex toggle.
  - Numeric columns: Range slider or min/max input fields.
  - Enum columns (Status, Error Type): Checkbox list of all unique values.
  - Date columns: Date range picker with presets (Today, Yesterday, Last 7d, Last 30d, Custom).
- Active filters shown as pills above the table: "[Status: Error] [Agent: ResearchBot] [x Clear All]"
- Filter count badge on the filter icon when any filter is active.
- Filters persist per-session in URL query parameters (enables shareable filtered views).

### 6.4 Row Expansion

- Rows with expandable detail show a chevron icon (`>`) in the first column.
- Click the chevron or the row to expand. The expanded area slides down below the row over 200ms.
- Expanded content area: full-width panel below the row, 16px padding, slightly darker background (`#0A0D14`).
- Expanded content can contain: JSON viewer (collapsible tree), mini-charts (sparklines), action buttons, error stack traces.
- Only one row can be expanded at a time (accordion behavior). Expanding a new row collapses the previous one.
- Keyboard: Enter key expands/collapses the focused row.

### 6.5 Column Customization

- "Columns" button in the table header opens a column picker dropdown.
- Checkbox list of all available columns. Drag-and-drop to reorder.
- Column widths are resizable by dragging the column border.
- Column visibility preferences saved to localStorage per table ID.
- Reset option: "Restore Default Columns" button in the dropdown.

### 6.6 Export Functionality

- Export button in the table header with dropdown: CSV, PDF, JSON.
- **CSV export:** Includes all rows (not just visible page). Respects active filters. Comma-delimited with quoted strings. Header row included. UTF-8 BOM for Excel compatibility.
- **PDF export:** Generates a formatted PDF with the table data. Includes table title, filter summary, and timestamp. Uses the print color palette (see Section 10). Maximum 100 rows per page.
- **JSON export:** Raw data array with all fields (including hidden columns).
- Export respects column ordering and visibility from the column customizer.
- Export triggers a browser download. Filename format: `{table_name}_{date_range}_{timestamp}.{ext}`

### 6.7 Pagination vs Infinite Scroll

| Context | Pattern | Rationale |
|---------|---------|-----------|
| Task history table | Pagination (25, 50, 100 per page) | Users need to navigate to specific time ranges; infinite scroll loses positional context |
| Activity feed | Infinite scroll with virtualization | Real-time streaming data; no natural page boundary |
| Agent list | Pagination (25 per page) | Users compare agents within a page; position matters |
| Error log | Pagination (50 per page) | Users need to reference specific error entries by page/row |
| Audit trail | Pagination (100 per page) | Compliance requirement: must be exportable page by page |

**Pagination Component:**
- Page numbers: show current page, first, last, and 2 neighbors. Example: [1] ... [4] [5] **[6]** [7] [8] ... [42]
- "Per page" dropdown: [25 | 50 | 100]
- Total record count displayed: "Showing 126-150 of 4,821 records"
- Keyboard navigation: Left/Right arrows for prev/next page

---

## 7. Real-Time Update Patterns

### 7.1 Chart Data Update Strategy

Real-time data updates must feel smooth and intentional, not jarring. Each chart type has a specific update strategy.

| Chart Type | Update Method | Interval | Animation |
|-----------|--------------|----------|-----------|
| Area/Line charts | Append new point, shift window left | 5-10 seconds | New point slides in from right edge over 300ms. Old point slides off left edge |
| Bar charts | Replace bar heights | 10-30 seconds | Bars morph to new height over 400ms with `ease-in-out-cubic` |
| Treemap | Replace all tile sizes | 30-60 seconds | Tiles morph smoothly to new sizes over 500ms |
| Pie/Donut | Replace all slice angles | 30-60 seconds | Slices smoothly rotate/resize to new proportions over 400ms |
| Heatmap | Replace affected cells | 60 seconds | Affected cells crossfade to new color over 300ms |
| Radar | Replace all axis values | 30 seconds | Polygon morphs to new shape over 400ms |
| KPI cards | Replace primary value | 5-10 seconds (or WebSocket push) | Digit roll animation for numbers (old digit scrolls up, new digit appears from below, 200ms) |

### 7.2 Animation for New Data Points

When a new data point arrives for a time-series chart:

1. **Slide-in:** The new data point appears at the right edge of the chart at y=0, then rises to its actual y-position over 300ms.
2. **Window shift:** All existing data points shift left by one interval width over the same 300ms. The leftmost point that exits the visible window fades out over 150ms.
3. **Line redraw:** The line/area path smoothly redraws to incorporate the new point. This uses SVG path morphing (Recharts handles this natively with `isAnimationActive`).
4. **Highlight pulse:** The new data point marker briefly pulses (scale 1.0 to 1.3 to 1.0 over 300ms) in the series color to draw attention.

**When multiple points arrive simultaneously** (e.g., reconnection after a brief disconnect):
- Batch all points and animate the entire window shift as a single motion over 600ms.
- Do not play individual pulse animations for each point; instead, flash a subtle highlight on the entire new data region.

### 7.3 Stale Data Indicators

Data can become stale due to network disconnection, backend latency, or agent offline states.

| Stale Duration | Indicator | Visual Treatment |
|---------------|-----------|------------------|
| 0-30 seconds | Fresh | Normal display; green pulse dot in refresh indicator |
| 30-60 seconds | Slightly stale | Refresh indicator dot turns amber |
| 60-120 seconds | Stale | Amber banner above chart: "Data last updated {N}s ago. Reconnecting..." |
| 120+ seconds | Very stale | Red banner above chart: "Connection lost. Data may be outdated." Chart overlay with 10% grey tint. Retry button visible |

**Implementation:**
- Each chart component tracks its last successful data fetch timestamp.
- A `<StaleIndicator lastUpdated={timestamp} />` wrapper component renders the appropriate indicator.
- On reconnection, data fetches immediately, banners dismiss, and charts animate to the new state.

### 7.4 Auto-Refresh Intervals

| Dashboard | Default Interval | Configurable Range | WebSocket Alternative |
|-----------|-----------------|-------------------|----------------------|
| Overview | 15 seconds | 5s - 60s | KPI cards via WebSocket; charts on interval |
| Agent Performance | 10 seconds | 5s - 30s | Agent detail panel via WebSocket |
| Cost Analytics | 30 seconds | 15s - 120s | Cost counter via WebSocket |
| Quality Metrics | 30 seconds | 15s - 120s | Error count via WebSocket |
| Team Comparison | 60 seconds | 30s - 300s | Leaderboard via WebSocket |
| Real-Time Monitoring | 5 seconds | 2s - 15s | All components via WebSocket |

**User Controls:**
- Global refresh rate selector in dashboard header (dropdown: "Auto: 15s", "Auto: 30s", "Auto: 60s", "Manual")
- Manual refresh button (circular arrow icon) triggers immediate refresh of all charts
- Pause button freezes all auto-refresh (for presentations or screenshots)
- When the browser tab is inactive, refresh rate drops to 60 seconds minimum (saves bandwidth)

---

## 8. Color Encoding Standards

### 8.1 Quantitative Color Scales

#### Sequential Scale (Low to High)

Used when data has a single dimension from low to high (e.g., activity count, cost amount).

**Blue sequential (default for neutral metrics):**
```
0%   -> #0F1117 (near black, zero/no data)
20%  -> #1E3A5F (very dark blue)
40%  -> #1D6FA5 (dark blue)
60%  -> #3B82F6 (medium blue)
80%  -> #60A5FA (light blue)
100% -> #93C5FD (very light blue)
```

**Green sequential (for positive metrics: tasks, uptime, quality):**
```
0%   -> #0F1117
20%  -> #064E3B
40%  -> #059669
60%  -> #10B981
80%  -> #34D399
100% -> #6EE7B7
```

**Amber sequential (for cost/spend metrics):**
```
0%   -> #0F1117
20%  -> #78350F
40%  -> #B45309
60%  -> #D97706
80%  -> #F59E0B
100% -> #FCD34D
```

#### Diverging Scale (Bad to Neutral to Good)

Used when data has a meaningful center point (e.g., error rate vs target, cost vs budget).

**Red-Grey-Green diverging:**
```
-100% (bad)  -> #EF4444 (red)
-50%         -> #F97316 (orange)
0% (neutral) -> #6B7280 (grey)
+50%         -> #34D399 (emerald)
+100% (good) -> #22C55E (green)
```

**Interpolation method:** Linear interpolation in OKLCH color space for perceptually uniform transitions. The midpoint grey ensures that color-blind users can distinguish the two halves.

### 8.2 Categorical Color Assignments

When distinguishing between unordered categories (agents, models, error types), use the extended data palette in fixed assignment order:

| Category Position | Color Name | Hex (Dark Mode) | Hex (Light Mode) |
|------------------|-----------|-----------------|-----------------|
| 1 | Indigo | `#818CF8` | `#6366F1` |
| 2 | Emerald | `#34D399` | `#10B981` |
| 3 | Amber | `#FBBF24` | `#D97706` |
| 4 | Pink | `#F472B6` | `#EC4899` |
| 5 | Blue | `#60A5FA` | `#3B82F6` |
| 6 | Violet | `#A78BFA` | `#8B5CF6` |
| 7 | Orange | `#FB923C` | `#EA580C` |
| 8 | Teal | `#2DD4BF` | `#14B8A6` |

**Rules:**
- Categories always receive the same color within a single view. If ResearchBot is color 1 (Indigo) in the treemap, it is Indigo in the bar chart, Indigo in the radar chart, and Indigo in the table row highlight.
- Color assignments are deterministic: sorted alphabetically by category name, then assigned in palette order. This ensures consistent coloring across sessions.
- For more than 8 categories, repeat the palette with hatching patterns (diagonal lines, dots, crosshatch) to maintain distinguishability. Pattern overlay at 0.15 opacity.

### 8.3 Alert Threshold Colors

All threshold-based coloring follows a three-tier system:

| Tier | Semantic | Color (Dark Mode) | Color (Light Mode) | Usage |
|------|----------|-------------------|-------------------|-------|
| Healthy / OK | Below warning threshold | `#22C55E` | `#16A34A` | Everything within normal parameters |
| Warning | Between warning and critical threshold | `#F59E0B` | `#D97706` | Approaching limits, needs attention soon |
| Critical | Above critical threshold | `#EF4444` | `#DC2626` | Immediate action required, SLO breach, budget exceeded |
| Info | No threshold (informational) | `#3B82F6` | `#2563EB` | Neutral metrics without good/bad semantics |
| Inactive | No data or disabled | `#6B7280` | `#4B5563` | Agent offline, metric not tracked, disabled feature |

**Threshold Application Rules:**
- Thresholds are configurable per metric via workspace settings.
- Default thresholds are pre-configured based on industry benchmarks.
- Color transitions are immediate (no animation between threshold states) for clarity.
- The threshold color is applied to: KPI card left border, KPI card background tint, chart reference lines, chart data point colors, table row highlights.

### 8.4 Accessibility-Safe Palettes

All chart color palettes are tested against three color vision deficiency types:

**Deuteranopia-safe palette (red-green color blindness):**

| Standard | Deuteranopia Alternative |
|----------|------------------------|
| Green `#22C55E` | Blue `#3B82F6` |
| Red `#EF4444` | Orange `#F97316` |
| Amber `#F59E0B` | Violet `#8B5CF6` |

**Additional cues (always present, not just in accessible mode):**
- Success: checkmark icon + solid line style
- Warning: triangle icon + dashed line style
- Error: X icon + dotted line style + pattern fill (diagonal stripes at 30deg, 2px wide, 4px gap)
- Info: circle icon + solid line style

**Contrast requirements:**
- All text on chart backgrounds meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Adjacent chart colors have a minimum APCA contrast of 30 between each other
- Focus indicators use a 3px outline in `#FFFFFF` with 2px offset for keyboard navigation
- All chart interactions are accessible via keyboard (Tab to focus, Enter to interact, Escape to dismiss)

**Accessible mode activation:**
- Toggle in Settings > Accessibility > "Use accessible chart colors"
- Respects `prefers-reduced-motion` OS setting (disables animations, uses instant transitions)
- Respects `prefers-contrast: high` (increases border widths, text contrast)

---

## 9. Typography in Data Viz

### 9.1 Number Formatting

All numeric values in dashboards follow a consistent formatting system:

| Value Type | Format Rule | Examples |
|-----------|------------|---------|
| Integer < 1,000 | Raw number, no abbreviation | 42, 847, 999 |
| Integer 1,000-999,999 | Comma-separated thousands | 1,234 / 42,847 / 999,999 |
| Integer >= 1,000,000 | Abbreviated with suffix | 1.2M / 42.8M / 1.0B |
| Decimal (quality score) | 2 decimal places, always show both | 0.89 / 0.05 / 1.00 |
| Currency | Dollar sign, comma-separated, 2 decimals. >= $10K abbreviated | $0.42 / $142.30 / $12.4K |
| Percentage | 1 decimal place with % suffix. At 100% or 0%: no decimal | 2.1% / 99.7% / 100% / 0% |
| Duration < 1s | Milliseconds with "ms" suffix | 142ms / 847ms |
| Duration 1-60s | Seconds with 1 decimal and "s" suffix | 1.2s / 42.8s |
| Duration > 60s | Minutes with 1 decimal and "m" suffix | 1.3m / 42.8m |
| Duration > 60m | Hours with 1 decimal and "h" suffix | 1.2h / 24.0h |
| Token count < 10K | Raw integer, comma-separated | 1,234 / 8,472 |
| Token count >= 10K | Abbreviated with suffix | 12.3K / 142.8K / 1.4M |
| Date (chart axis) | Contextual: "14:30" (intraday), "Mar 12" (multi-day), "W12" (multi-week) |
| Timestamp (tooltip) | Full: "Mar 12, 2026, 14:32:01 UTC" |

**Locale handling:** Number formatting respects the user's browser locale for decimal separators and date formats. Default: en-US. Configurable in workspace settings.

**Negative numbers:** Preceded by minus sign. Red color for financial negatives. Parentheses format `($42.30)` available as a workspace setting for finance teams.

### 9.2 Label Placement Rules

**Chart Axis Labels:**
- X-axis labels: centered below tick marks. Rotate 45 degrees if labels overlap. Hide every other label if still overlapping.
- Y-axis labels: right-aligned, positioned to the left of the axis line. Use abbreviated format (K, M, B).
- Axis titles: positioned outside the chart area. X-axis title centered below labels. Y-axis title rotated 90 degrees, centered to the left of labels.
- Font: 11px, `#9CA3AF` (grey-400 dark mode) / `#6B7280` (grey-500 light mode).

**Data Labels (on charts):**
- Displayed when there are <= 12 data points. Hidden for dense charts.
- Position: above data point for line/area, centered inside bar for bar charts, outside slice for pie.
- Font: 10px, color matches series color for line/area. `#F9FAFB` for bar chart labels. `#F9FAFB` for pie labels.
- Collision avoidance: if two labels overlap, offset the upper one by 16px. If still overlapping, hide the lower-priority label.

**KPI Card Labels:**
- Metric name: 12px, `#9CA3AF`, uppercase, top of card.
- Primary value: 28px, `#F9FAFB`, bold, center-left of card.
- Trend value: 12px, trend color (green/red/grey), adjacent to primary value.
- Sublabel: 11px, `#6B7280`, bottom of card.

### 9.3 Annotation Styles

Annotations are added to charts to highlight notable events (alerts, deployments, threshold breaches).

| Annotation Type | Visual | Trigger |
|----------------|--------|---------|
| Alert marker | Red dashed vertical line spanning chart height. Red circle marker (6px) at the data point. Label above chart: "{alert_type}: {description}" | Cost alert, loop detection, SLO breach |
| Threshold line | Horizontal dashed line at the threshold value. Label at right end: "Target: {value}" | SLA target, error rate limit, budget line |
| Period marker | Shaded vertical band spanning a time range. Light grey fill at 0.05 opacity | Deployment window, maintenance period, incident duration |
| Text annotation | Arrow pointing to specific data point with text box. Box: `#1A1F2E` background, 1px `#374151` border, 11px text | Manual user annotation, AI insight annotation |

**Annotation interaction:**
- Hover annotation to see full description in tooltip.
- Click annotation to navigate to the related alert/event detail.
- Annotations can be created by users: right-click chart -> "Add Annotation" -> enter text.

### 9.4 Font Stack

| Context | Font Family | Fallback |
|---------|-----------|---------|
| UI text (labels, navigation) | Inter | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Numeric values (KPIs, chart data) | JetBrains Mono | `'SF Mono', 'Cascadia Code', 'Fira Code', monospace` |
| Chart axis labels | Inter | Same as UI text |
| Annotations | Inter | Same as UI text |

**Font sizes in data visualization:**

| Element | Size | Weight |
|---------|------|--------|
| KPI primary value | 28px | 700 (bold) |
| KPI trend percentage | 12px | 500 (medium) |
| KPI label | 12px | 600 (semi-bold), uppercase |
| Chart title | 14px | 600 |
| Axis label | 11px | 400 |
| Axis title | 11px | 500 |
| Data label | 10px | 400 |
| Tooltip title | 12px | 600 |
| Tooltip value | 12px | 400, monospace |
| Legend item | 11px | 400 |
| Table header | 12px | 600, uppercase |
| Table cell | 13px | 400 |
| Annotation text | 11px | 400 |

---

## 10. Print and Export Design

### 10.1 PDF Export Layout

PDF exports generate formatted documents suitable for printing, email attachment, and archival. Every dashboard has a "Export PDF" button in the header.

**Page Setup:**
- Page size: A4 (210mm x 297mm) default. US Letter (8.5" x 11") as option.
- Margins: 20mm all sides.
- Header: OAV logo (left), Dashboard title (center), Date range (right), Page number (right).
- Footer: "Generated by OpenAgentVisualizer | {workspace_name} | {export_timestamp}"

**Content Rendering:**
- Charts are rendered as high-resolution PNG or SVG (300 DPI for print quality).
- Tables paginate naturally across pages. Table headers repeat on each page.
- KPI cards render as a horizontal strip with values and trend indicators (no animations).
- Colors switch to the print-safe palette (see Section 10.3).

**PDF Generation Technology:**
- Client-side: `html2canvas` + `jsPDF` for simple exports.
- Server-side: Puppeteer headless Chrome rendering for high-fidelity exports (async, generates in background, downloads when ready).
- Chart images: ECharts `getDataURL()` for ECharts charts. Recharts rendered via `recharts-to-png`.

### 10.2 Screenshot-Friendly Views

A "Presentation Mode" optimizes the dashboard for screen capture and display on external monitors.

**Presentation Mode behavior:**
- Toggle via keyboard shortcut `Shift+P` or button in header.
- Hides all navigation chrome (sidebar, header nav links, settings icons).
- Expands charts to fill the viewport.
- Increases font sizes by 25% for readability on large displays or projectors.
- Pauses auto-refresh (prevents chart jumping during screenshot).
- Shows a subtle "Press Esc to exit" hint in the corner (fades after 3 seconds).
- Time range and filters still visible but moved to a minimal overlay bar.

**Screenshot button:**
- Captures the current viewport as a PNG image.
- Filename: `oav_{dashboard_name}_{date}.png`
- Resolution: 2x device pixel ratio for retina quality.
- Includes a small OAV watermark in the bottom-right corner (free tier only; paid tiers: no watermark).

### 10.3 Dark Mode to Light Mode for Printing

Printed documents and PDF exports must use a light background for legibility and ink conservation. The color palette automatically transforms:

| Element | Dark Mode (Screen) | Light Mode (Print) |
|---------|-------------------|-------------------|
| Page background | `#0F1117` | `#FFFFFF` |
| Card background | `#1A1F2E` | `#F9FAFB` |
| Primary text | `#F9FAFB` | `#111827` |
| Secondary text | `#D1D5DB` | `#374151` |
| Muted text | `#9CA3AF` | `#6B7280` |
| Chart grid lines | `#1F2937` at 0.3 | `#E5E7EB` at 0.4 |
| Success color | `#22C55E` | `#16A34A` |
| Warning color | `#F59E0B` | `#B45309` |
| Error color | `#EF4444` | `#DC2626` |
| Info color | `#3B82F6` | `#2563EB` |
| Table border | `#1F2937` | `#D1D5DB` |
| Table header bg | `#1A1F2E` | `#E5E7EB` |

**Transformation rules:**
- All chart fill opacities increase by 0.1 in print mode (compensates for white background reducing visual contrast).
- Border widths increase by 0.5px in print mode.
- Sparklines render with a 1px border instead of relying on background contrast.
- Gradient backgrounds are replaced with solid colors for printer compatibility.

### 10.4 Export Data Formats

| Format | Use Case | Configuration |
|--------|---------|--------------|
| **PDF** | Formatted reports for stakeholders and compliance | High-fidelity with charts as images. Pagination. Headers/footers. Light mode palette. A4 or Letter size |
| **CSV** | Data analysis in spreadsheets | All rows, respects filters. UTF-8 BOM for Excel. Comma delimiter (configurable: tab, semicolon). Header row included |
| **JSON** | Programmatic consumption | Raw data array. Includes metadata: `{ export_date, filters, total_rows, data: [...] }` |
| **PNG** | Screenshots for sharing | Current viewport at 2x resolution. Includes title and date range. Optional watermark |
| **SVG** | High-quality chart embedding in documents | Individual chart export. Vector graphics, scales to any resolution. Includes embedded fonts |

**Export Permissions:**
- Free tier: CSV and PNG only.
- Pro tier: CSV, PNG, PDF.
- Team tier and above: CSV, PNG, PDF, JSON, SVG.
- Audit trail: all exports are logged with user, timestamp, format, and filter parameters.

---

## Appendix A: Chart Component Props Reference

For frontend implementation, each chart component accepts standardized props:

```typescript
interface BaseChartProps {
  data: any[];
  width?: number | string;        // default: "100%"
  height?: number;                 // default: varies by chart type
  loading?: boolean;               // shows skeleton loader
  error?: string;                  // shows error state with message
  empty?: boolean;                 // shows empty state with CTA
  timeRange?: TimeRange;           // synced from dashboard-level selector
  theme?: "dark" | "light";       // auto-detected from system/user preference
  onDataPointClick?: (point: DataPoint) => void;
  onBrushSelect?: (range: [Date, Date]) => void;
  exportEnabled?: boolean;         // shows export button on chart header
  annotations?: Annotation[];      // alert markers, threshold lines
  animationEnabled?: boolean;      // respects prefers-reduced-motion
  refreshInterval?: number;        // milliseconds, 0 = manual only
  staleThreshold?: number;         // seconds before stale indicator shows
}

interface KPICardProps {
  label: string;
  value: number | string;
  format: "integer" | "currency" | "percentage" | "duration" | "decimal";
  trend?: { value: number; direction: "up" | "down" | "flat" };
  trendSemantics?: "higher-is-better" | "lower-is-better" | "neutral";
  sparkline?: number[];            // 7-30 data points for trailing sparkline
  threshold?: { warning: number; critical: number };
  icon?: LucideIcon;
  status?: "healthy" | "warning" | "critical" | "info" | "inactive";
  loading?: boolean;
  onClick?: () => void;
  sublabel?: string;
  secondaryIndicator?: React.ReactNode;  // budget ring, percentile bands, etc.
}
```

---

## Appendix B: Dashboard API Endpoints

All dashboards fetch data from the following REST API endpoints (details in Backend API Contract):

| Endpoint | Method | Description | Used By |
|----------|--------|------------|---------|
| `/api/v1/agents/stats` | GET | Agent count, active/idle/error breakdown | Overview, Monitoring |
| `/api/v1/agents/utilization` | GET | Utilization percentage and capacity | Overview, Monitoring |
| `/api/v1/tasks/stats` | GET | Task counts by status for period | Overview, Agent Detail |
| `/api/v1/tasks/queue` | GET | Queue depth, throughput, wait estimate | Monitoring |
| `/api/v1/metrics/tokens` | GET | Token usage over time | Overview, Agent Detail |
| `/api/v1/metrics/error-rate` | GET | Error rate with breakdown | Quality |
| `/api/v1/metrics/latency` | GET | Response time percentiles | Quality, Agent Detail |
| `/api/v1/metrics/quality` | GET | Quality score statistics | Quality, Agent Detail |
| `/api/v1/metrics/uptime` | GET | Uptime percentage and downtime | Overview |
| `/api/v1/costs/summary` | GET | Total cost, budget, burn rate | Overview, Cost |
| `/api/v1/costs/breakdown` | GET | Cost by agent/model/task hierarchy | Cost |
| `/api/v1/costs/projection` | GET | Projected cost to end of period | Cost |
| `/api/v1/costs/savings` | GET | Cost savings vs baseline | Cost |
| `/api/v1/costs/burn-rate` | GET | Current burn rate with trend | Cost, Monitoring |
| `/api/v1/alerts/loops` | GET | Loop incident count and details | Quality, Overview |
| `/api/v1/gamification/xp` | GET | XP earned, top agents, history | Team, Agent Detail |
| `/api/v1/gamification/achievements` | GET | Achievement counts and recent unlocks | Team, Agent Detail |
| `/api/v1/gamification/leaderboard` | GET | Ranked agent list by metric | Team |
| `/api/v1/insights/cost-optimization` | GET | Actionable savings opportunities | Cost |
| `/api/v1/events/stream` | SSE | Real-time event stream | Activity Feed |
| `/ws/sessions/count` | WebSocket | Real-time session counter | Monitoring |
| `/ws/agent-states` | WebSocket | Real-time agent state updates | Monitoring |
