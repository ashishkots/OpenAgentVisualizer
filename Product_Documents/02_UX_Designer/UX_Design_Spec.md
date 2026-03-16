# OpenAgentVisualizer -- UX Design Specification

**Stage:** 2.1 -- UX Designer
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** UX Designer Agent
**Depends On:** PRD (Stage 1.1), Gamification System Design (Stage 1.2), Agent Integration Architecture (Stage 1.3)
**Feeds Into:** UI Designer (Stage 2.2), Frontend Expert (Stage 2.2a), Motion Graphics (Stage 1.4)

---

## Table of Contents

1. [UX Design Principles](#1-ux-design-principles)
2. [User Flows](#2-user-flows)
3. [Information Architecture](#3-information-architecture)
4. [Wireframes](#4-wireframes)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Responsive Design Strategy](#6-responsive-design-strategy)
7. [Accessibility (WCAG 2.2)](#7-accessibility-wcag-22)
8. [Error States & Empty States](#8-error-states--empty-states)
9. [Onboarding Design](#9-onboarding-design)
10. [Navigation Model](#10-navigation-model)

---

## 1. UX Design Principles

### 1.1 Core Philosophy

OpenAgentVisualizer occupies a unique position: it must feel like a **living workspace** where AI agents are persistent characters with identity and personality, while simultaneously delivering the **precision and speed** that engineers demand from observability tooling. The UX bridges two worlds -- the engaging spatial metaphor of a virtual environment and the data density of an APM dashboard. Neither world alone is sufficient. Together, they produce a product that every stakeholder on the team -- from the engineer debugging a loop to the CTO presenting AI ROI -- can use without translation.

### 1.2 Principle 1: Linear, Not Jira

Every interaction must feel focused, fast, and intentional. The product must reward keyboard-first usage, minimize modal dialogs, and never force users through multi-step wizards when a single action suffices. Cognitive load is the enemy. The virtual world canvas is the primary entry point, and all secondary views (dashboards, settings, replays) are reachable in two clicks or one keyboard shortcut. If a workflow requires more than three steps to reach a meaningful outcome, the design has failed.

**What this means in practice:**
- Navigation is flat (max 2 levels deep from any view)
- Settings are contextual (right-click or inline), not buried in a settings page
- Default views are pre-configured and useful immediately; custom configuration is optional
- Global search (Cmd+K) is the fastest way to reach any entity, page, or action

### 1.3 Principle 2: Five-Minute Time-to-First-Value (TTFV)

The onboarding experience must take a new user from sign-up to seeing their first agent animate on the canvas in under five minutes. This is a hard constraint, not a goal. Every onboarding step is measured against TTFV. If the user must leave the app (to read docs, configure YAML, set up Docker), TTFV is broken. The product provides a Sample Data Mode that pre-populates the canvas with simulated agents so users can explore the full UX before connecting their own SDK.

**What this means in practice:**
- Sign-up is email + password or one-click OAuth (GitHub/Google)
- Workspace creation is automatic on first login (no configuration)
- API key is generated and displayed immediately after workspace creation
- SDK integration code is copy-pasteable from the onboarding screen
- Sample Data Mode activates on empty workspaces, showing 5 simulated agents in various states

### 1.4 Principle 3: Agents Are Characters, Not Boxes

Every agent in the system is a persistent entity with a name, role, avatar, level, XP history, badge collection, and behavioral patterns. The UX treats agents the way a team management tool treats people: with identity, history, and context. Agents are never anonymous "Node 7" in a graph. They are "ResearchAgent (Level 12, Expert)" with a visual presence that evolves over time. This anthropomorphic design is deliberate -- it makes complex distributed systems comprehensible to non-engineers by leveraging the human instinct to understand behavior through characters.

**What this means in practice:**
- Agent avatars have idle animations (breathing, looking around) in the canvas
- Agent detail panels show biographical information (creation date, total tasks, career XP)
- State transitions are animated, not instantaneous (thinking, working, error states have distinct animations)
- Agents "celebrate" level-ups and badge unlocks with visible particle effects
- Agent names and levels are always visible, not hidden behind hover states

### 1.5 Principle 4: Professional Mode Toggle

Enterprise users may find gamification elements distracting or unprofessional. The Professional Mode toggle converts all gamified elements into their data-equivalent counterparts without changing the underlying data model. XP becomes "Performance Score," levels become "Tier," badges become "Certifications," the leaderboard becomes "Benchmark Ranking." The spatial canvas remains, but avatars become geometric icons, celebration animations become status updates, and the color palette shifts to a more muted, corporate-safe scheme. Professional Mode is a rendering decision, not a data decision -- all gamification data continues to compute in the background.

**What this means in practice:**
- A single toggle in the workspace settings switches between Gamified and Professional modes
- Professional Mode is the default for Business and Enterprise tiers
- Gamified Mode is the default for Free, Pro, and Team tiers
- The toggle is also accessible per-user (individual preference override)
- Both modes support identical keyboard shortcuts, navigation, and data access

### 1.6 Principle 5: Lean Back + Lean Forward

The product must support two distinct usage modes:

**Lean Back (monitoring):** The canvas is open on a second monitor or wall display. Agents animate in real time. The user glances at it periodically for ambient awareness -- "the team is working" or "something is red." No interaction required. The display must be useful at arm's length, with large status indicators, minimal text, and clear color coding.

**Lean Forward (debugging):** An agent has errored. The user clicks on it, opens the detail panel, drills into the trace timeline, inspects tool call arguments, and scrubs through the session replay to find the root cause. Every data point is one or two clicks away. Tables are sortable, filterable, and exportable. Time ranges are adjustable. The UX must feel like a precision instrument.

**What this means in practice:**
- The canvas auto-adjusts information density based on zoom level (zoomed out = status only, zoomed in = labels + metrics)
- Alert banners and error flashes are visible from across a room (high contrast, large icons)
- Detail panels provide full trace data with expandable JSON, copy-to-clipboard, and link-to-line
- Session replay has frame-accurate scrubbing and playback speed controls
- Cost data is always one click away from any agent entity

### 1.7 Principle 6: Progressive Disclosure

Every screen starts simple and reveals complexity on demand. The canvas shows agents with status colors. Hovering shows a tooltip with current task. Clicking opens a summary panel. Expanding the panel shows full metrics. Clicking "View Trace" opens the detailed timeline. The user controls the depth of information at every step. The product never front-loads complexity.

**What this means in practice:**
- Default views show 3-5 key metrics; "Show More" reveals the full set
- Tooltips are the first level of information (hover, no click required)
- Side panels are the second level (single click)
- Full-page views are the third level (navigation, rare)
- Settings and configuration are contextual, not global pages unless unavoidable

---

## 2. User Flows

### Flow 1: First-Time Onboarding (SDK Setup to First Agent Visible)

**Persona:** Alex Chen (AI Platform Engineer)
**Goal:** Go from sign-up to seeing the first agent appear on the canvas
**TTFV Target:** Under 5 minutes

```
Step 1: Landing Page
  User clicks "Get Started Free"
  → Redirect to sign-up form

Step 2: Sign Up
  User enters email + password OR clicks "Sign in with GitHub" / "Sign in with Google"
  → Account created, auto-login
  → Auto-generate default workspace "My Workspace"
  → Generate API key (oav_xxx...)

Step 3: Welcome Screen
  System detects empty workspace
  → Show two-path choice:
    [A] "Connect Your Agents" (primary CTA, highlighted)
    [B] "Explore with Sample Data" (secondary CTA)

Step 4A: Connect Your Agents
  → Display three-step integration panel:
    1. Install: `pip install openagentvisualizer` (copy button)
    2. Add 3 lines of code (copy button, framework auto-detection):
       ```python
       from openagentvisualizer import OAVTracer
       tracer = OAVTracer(api_key="oav_xxx...", workspace="my-workspace")
       tracer.auto_instrument()
       ```
    3. Run your agent pipeline
  → Show "Waiting for first event..." with animated spinner
  → On first event received: canvas transitions from empty to showing the agent
    Agent fades in with a "welcome" animation
    Confetti burst (subtle)
    Toast: "Your first agent is live! Click it to see details."

Step 4B: Explore with Sample Data
  → Activate Sample Data Mode
  → Canvas populates with 5 simulated agents (Research, Coder, Reviewer, Manager, Analyst)
  → Agents cycle through realistic states (idle, thinking, executing, handoff)
  → Banner at top: "You are viewing sample data. Connect your own agents to see real activity."
  → Guided tooltip tour begins (see Flow 1B below)

Step 5: Guided Tour (triggered on first agent appearance OR sample data activation)
  Tooltip 1: Points at agent avatar → "This is your agent. The color ring shows its current state."
  Tooltip 2: Points at agent name/level → "Agents earn XP for completed tasks. Watch them level up."
  Tooltip 3: Points at sidebar → "Click an agent to see its performance details."
  Tooltip 4: Points at activity feed → "Real-time events appear here."
  Tooltip 5: Points at Cmd+K hint → "Press Cmd+K to search anything."
  User can skip the tour at any time.

Step 6: First Interaction
  User clicks on an agent avatar on the canvas
  → Agent detail panel slides in from the right
  → Shows live metrics: tokens, cost, tasks, status
  → "Explore more" link at bottom of panel → navigates to full dashboard
```

**Success Criteria:** User sees a live agent (or sample agent) on the canvas within 5 minutes of clicking "Get Started."

---

### Flow 2: Virtual World Exploration (Pan, Zoom, Click Agents)

**Persona:** Priya Nair (Product Owner)
**Goal:** Navigate the virtual world canvas and understand what agents are doing

```
Step 1: Canvas Loaded
  User sees the virtual world canvas with agents arranged in spatial zones:
    - Research Wing (top-left)
    - Execution Floor (center)
    - Review Room (top-right)
    - Archive (bottom-right)
  Agents are positioned within their respective zones based on role

Step 2: Pan
  User drags the canvas (mouse click-drag, or trackpad two-finger swipe)
  → Canvas smoothly pans in the drag direction
  → Minimap in bottom-right corner shows current viewport position
  Keyboard: Arrow keys pan by 100px per press; hold Shift for 500px jumps

Step 3: Zoom
  User scrolls mouse wheel or pinches on trackpad
  → Canvas zooms in/out with the cursor as focal point
  Zoom levels:
    - Zoomed out (25-50%): Agents are dots with color status rings only
    - Default (100%): Agents show avatar, name, level badge, status ring
    - Zoomed in (150-200%): Agents show avatar, name, level, current task label, XP bar
    - Max zoom (300%): Agents show full detail including token counter and cost
  Keyboard: Plus/Minus keys zoom in/out; 0 resets to default zoom; F fits all agents

Step 4: Hover Agent
  User hovers mouse over an agent avatar
  → Tooltip appears (200ms delay to prevent flickering):
    Agent Name: "ResearchAgent"
    Level: "Level 12 - Expert I"
    Current State: "Executing: web_search"
    Current Task: "Research competitor pricing"
    Duration: "Running for 4.2s"
    Session Cost: "$0.12"
  → Agent avatar gets a subtle highlight glow

Step 5: Click Agent
  User clicks on an agent avatar
  → Agent avatar shows "selected" ring (blue outline)
  → Detail panel slides in from the right side (400px width)
  → Panel contains: metrics summary, current task, recent activity, quick actions
  → Canvas auto-pans to center the selected agent if near the viewport edge

Step 6: Observe Animated Activity
  While watching the canvas:
    - Agents in "Thinking" state pulse with a blue glow
    - Agents in "Executing" state show a green motion indicator
    - Agents in "Error" state flash red with a warning icon
    - Task handoffs render as animated particles moving along dashed lines between agents
    - New messages between agents render as speech bubble icons that animate and fade
    - XP earned shows as floating "+50 XP" text that rises and fades
    - Level-ups trigger a particle burst around the agent

Step 7: Deselect
  User clicks empty canvas area or presses Escape
  → Detail panel slides closed
  → Agent avatar returns to default (no selection ring)
```

---

### Flow 3: Task Assignment to Agent

**Persona:** Priya Nair (Product Owner)
**Goal:** Create a task and assign it to a specific agent via drag-and-drop

```
Step 1: Open Task Queue
  User clicks the "Tasks" icon in the left sidebar
  → Task queue panel opens (left side, 320px width)
  → Shows tabs: Pending | In Progress | Completed | Failed
  → "New Task" button at top

Step 2: Create Task
  User clicks "New Task"
  → Inline form expands within the task queue:
    Title: [text input, required]
    Description: [textarea, optional]
    Priority: [dropdown: Low / Medium / High / Critical]
    Deadline: [optional time picker]
  User fills in: "Research competitor pricing for Q2 report"
  Clicks "Create" or presses Cmd+Enter

Step 3: Task Created
  → Task card appears in "Pending" tab with:
    Title, priority badge (color-coded), creation timestamp
  → Task card has a drag handle icon on the left edge

Step 4: Drag Task to Agent
  User clicks and holds the task card drag handle
  → Task card detaches from the list and follows the cursor as a floating card
  → Canvas agents become "droppable targets": their avatars get a pulsing outline
  → Agents whose role matches the task type get a brighter highlight (suggested targets)
  → Hovering over an agent shows a tooltip: "Drop to assign to ResearchAgent"

Step 5: Drop on Agent
  User releases the task card over the target agent avatar
  → Assignment animation:
    Task card shrinks and flies into the agent avatar
    Agent avatar shows a "received" animation (brief flash + bounce)
    Agent state transitions from Idle to Initializing to Thinking
  → Task moves from "Pending" to "In Progress" tab
  → Activity feed entry: "ResearchAgent assigned task: Research competitor pricing"

Step 6: Monitor Execution
  → The agent begins working on the task
  → Canvas shows real-time status (thinking glow, tool call indicators)
  → Task card in the queue shows a progress indicator and elapsed time
  → On completion: task moves to "Completed" tab, agent earns XP (+50 XP animation)
  → On failure: task moves to "Failed" tab, agent shows error state, alert notification

Step 7: SDK-Reported Tasks (Automatic)
  Tasks assigned via the SDK (not UI) appear identically:
    → Task card auto-creates in "In Progress" tab
    → Agent on canvas shows the same status animations
    → No user action required; the canvas reflects SDK activity automatically
```

---

### Flow 4: Viewing Agent Performance Dashboard

**Persona:** Sarah Kim (Engineering Team Lead)
**Goal:** Review an agent's performance metrics and identify optimization opportunities

```
Step 1: Navigate to Dashboard
  Option A: Click "Dashboard" in the left sidebar navigation
  Option B: Click on an agent in the canvas, then click "View Full Dashboard" in the detail panel
  Option C: Press Cmd+K, type agent name, select "View Dashboard"

Step 2: Dashboard Overview Page
  → Top bar: Workspace-level summary metrics:
    Total Agents: 12    Active Now: 8    Session Cost: $4.72    Tasks Today: 147
  → Below: Grid of agent cards (3 per row on desktop), each showing:
    Agent avatar + name + level
    Status indicator (live)
    Key metrics: Tasks (47/52), Cost ($0.84), Avg Latency (2.3s), Quality (92%)
    Sparkline of token usage over last 24h
    XP bar with current level progress

Step 3: Select Agent
  User clicks on "ResearchAgent" card
  → Navigates to single-agent dashboard page

Step 4: Single Agent Dashboard
  → Header: Agent avatar (large), name, level, title ("Expert I"), XP bar, badge icons (3 most recent)
  → Tabs below header: Overview | Tasks | Traces | Cost | Achievements

  Tab: Overview (default)
    Left column (60%):
      Metrics grid (2x3):
        [Tasks Completed: 847] [Success Rate: 94.2%]
        [Tokens Used: 1.2M]   [Avg Cost/Task: $0.018]
        [Avg Latency: 2.1s]   [Error Count: 14]
      Trend chart: Line chart showing tasks/day over last 30 days
      Activity timeline: Last 20 events (task start, completion, error, handoff)
    Right column (40%):
      Current state: "Executing: web_search tool"
      Current task: "Research competitor pricing"
      Token budget meter: 45% consumed
      Streak indicator: "23 consecutive successes"
      Quick actions: [View Live on Canvas] [View Latest Trace] [Export Report]

  Tab: Tasks
    Sortable, filterable table:
    Columns: Task Name | Status | Duration | Tokens | Cost | Quality | Timestamp
    Filters: Status (all/success/failed/partial), date range, cost range
    Click row to expand inline trace summary

  Tab: Traces
    List of execution traces (session-level):
    Columns: Session ID | Start Time | Duration | Tasks | Total Cost | Status
    Click to open full trace timeline (waterfall view)

  Tab: Cost
    Cost breakdown:
      By model (GPT-4o: 60%, GPT-4o-mini: 35%, Claude-3.5: 5%)
      By task type (Research: 40%, Generation: 30%, Analysis: 30%)
      Daily cost trend chart (bar chart, last 30 days)
      Cost comparison vs. workspace average (bar chart)
    Budget status: $12.40 of $50.00 monthly allocation consumed

  Tab: Achievements
    Grid of badges:
      Earned badges with gold frames, dates earned, rarity tier
      Locked badges with grey silhouettes, progress indicators
      Progress toward next badge: "Centurion: 423/500 tasks completed (84%)"

Step 5: Compare Agents
  User clicks "Compare" button in the dashboard header
  → Opens agent comparison drawer:
    Select up to 4 agents from a dropdown
    Side-by-side metric comparison table
    Overlaid trend charts (cost, throughput, quality)
    Highlighted differences (green = better, red = worse)
```

---

### Flow 5: Investigating an Error/Alert

**Persona:** Alex Chen (AI Platform Engineer)
**Goal:** Respond to a loop detection alert and diagnose the root cause

```
Step 1: Alert Triggers
  System detects a loop: ResearchAgent has repeated the web_search tool call 6 times on the same query
  → Canvas: ResearchAgent avatar flashes red with a pulsing warning icon
  → Banner alert slides in at the top of the canvas:
    "[!] Loop Detected: ResearchAgent has repeated web_search 6 times"
    [Inspect] [Kill Agent] [Dismiss]
  → Notification sound plays (if not muted)
  → Activity feed entry: "ALERT: ResearchAgent loop detected (6 iterations)"
  → Browser tab title updates: "(!) OpenAgentVisualizer"

Step 2: Click Inspect
  User clicks [Inspect] on the banner or clicks the flashing agent avatar
  → Canvas auto-pans and zooms to center on the erroring agent
  → Detail panel opens with the "Error" tab pre-selected

Step 3: Error Detail Panel
  → Error summary:
    Type: "Loop Detected"
    Pattern: "web_search called 6x with identical query: 'competitor pricing SaaS 2026'"
    First Occurrence: "14:30:05 UTC"
    Latest Occurrence: "14:30:32 UTC"
    Tokens Consumed During Loop: 12,400
    Cost of Loop: "$0.093"
    Estimated Cost if Unchecked (next 10 min): "$1.86"
  → Timeline visualization:
    Waterfall of the last 10 events for this agent
    Repeated tool calls highlighted in red
    Time gaps between iterations shown
  → Root Cause Suggestions (AI-generated, plain English):
    "The agent received an ambiguous search result and is retrying with the same query.
     The web_search tool returned a 403 Forbidden error on the first result URL,
     causing the agent to retry the search instead of trying the next result."
  → Quick Actions:
    [Kill Agent] - Sends termination signal
    [Adjust Loop Threshold] - Opens inline threshold config
    [View Full Trace] - Opens trace timeline
    [Replay Session] - Opens session replay from 2 minutes before the loop

Step 4: View Full Trace
  User clicks [View Full Trace]
  → Navigates to trace timeline view
  → Waterfall diagram shows every span in the session:
    Each LLM call, tool call, and message as horizontal bars
    Looping spans are highlighted in red with a "loop" badge
    Token counts and costs annotated on each span
    Expandable detail for each span (request/response preview, headers, timing)

Step 5: Kill Agent (if needed)
  User clicks [Kill Agent]
  → Confirmation dialog: "Terminate ResearchAgent? This will stop the current session."
  → User confirms
  → SDK receives termination signal
  → Agent avatar on canvas plays "terminated" animation (fade out with ghost effect)
  → Alert banner updates: "ResearchAgent terminated. Loop cost: $0.093 (saved est. $1.77)"
  → Activity feed: "ResearchAgent terminated by user (loop detected)"

Step 6: Post-Mortem
  User clicks [Replay Session] to review what happened
  → Session replay opens from 2 minutes before the loop started
  → User can scrub through the timeline and watch the agent's decision-making process
  → Replay highlights the moment the loop began with a red marker on the timeline
```

---

### Flow 6: Replaying a Session

**Persona:** Sarah Kim (Engineering Team Lead)
**Goal:** Replay a previous agent session and share it with the team for post-mortem

```
Step 1: Navigate to Replays
  Option A: Click "Sessions" in the left sidebar, then click "Replay" on a session row
  Option B: From agent detail panel, click "View Sessions" and select a session
  Option C: Open a shared replay URL from Slack/email

Step 2: Sessions List
  → Table view:
    Columns: Session Name | Agents | Duration | Tasks | Cost | Status | Timestamp
    Filters: Date range, status (success/failed/mixed), agent name, cost range
    Sort by any column
  User clicks the play icon on "Market Research Run #42"

Step 3: Replay View
  → Canvas enters Replay Mode:
    Banner at top: "Replay: Market Research Run #42 -- March 15, 2026, 14:30 UTC"
    Timeline scrubber bar at bottom of canvas:
      [|<] [<<] [>] [>>] [>|]  -- rewind to start, step back, play/pause, step forward, jump to end
      Speed selector: [0.5x] [1x] [2x] [4x] [8x]
      Timeline bar showing session duration with event markers (green dots = tasks, red dots = errors)
      Current timestamp indicator
    Canvas shows the world state at the current replay timestamp
    Agents appear in their historical positions and states

Step 4: Playback
  User clicks Play
  → Agents animate through their recorded states:
    Thinking, executing, communicating, handoff animations all replay
    XP earned animations replay at the correct moments
    Task flow particles replay along connection lines
    Activity feed shows historical events in sync with the replay
  → Metrics panel (if open) shows historical values, not live data

Step 5: Scrubbing
  User clicks on a specific point in the timeline bar
  → Canvas instantly jumps to that timestamp
  → All agent positions, states, and metrics reflect that moment in time
  → User can drag the timeline scrubber to "fast forward" or "rewind" manually

Step 6: Annotate (V1 feature, stubbed in MVP)
  User can click on a moment in the timeline and add a text annotation:
    "This is where the loop started"
    Annotation appears as a pin on the timeline bar

Step 7: Share
  User clicks "Share" button in the replay toolbar
  → Dialog:
    Link type: [Public] [Team Only] [Private]
    "Copy Link" button
    Optional: Set expiration (7 days, 30 days, never)
  User copies the link and pastes it in Slack
  → Teammate clicks the link → opens the replay at the same timestamp
  → Viewer-role access: can watch and scrub but not annotate or delete
```

---

### Flow 7: Configuring Gamification Settings

**Persona:** Sarah Kim (Engineering Team Lead)
**Goal:** Customize gamification settings for the workspace, enable Professional Mode for certain users

```
Step 1: Open Workspace Settings
  User clicks the gear icon in the bottom-left of the sidebar
  → Settings page opens
  → Left nav: General | Members | API Keys | Gamification | Alerts | Billing

Step 2: Gamification Settings Page
  → Section: Display Mode
    [Radio] Gamified Mode (default) -- "Full animations, XP, badges, leaderboards, celebrations"
    [Radio] Professional Mode -- "Same data as benchmarks, performance scores, and certifications"
    [Checkbox] Allow individual members to override workspace default

  → Section: XP System
    [Toggle] Enable XP earning: ON
    [Toggle] Show XP animations on canvas: ON
    [Toggle] Show floating "+XP" numbers: ON
    [Number input] Notification frequency cap: 3 per session
    [Toggle] Enable XP decay for idle agents: ON
    [Number input] Grace period before decay: 7 days

  → Section: Leaderboard
    [Toggle] Enable workspace leaderboard: ON
    [Dropdown] Default ranking metric: Composite Score
    [Checkboxes] Visible leaderboard categories:
      [x] Efficiency  [x] Speed  [x] Quality  [x] Cost-Effectiveness  [x] Reliability
    [Toggle] Show rank change arrows: ON
    [Number input] Minimum tasks to appear on leaderboard: 20

  → Section: Achievements
    [Toggle] Enable achievement badges: ON
    [Toggle] Show badge unlock notifications: ON
    [Dropdown] Notification level: All / Rare+ / Epic+ / Legendary only
    [Toggle] Show locked achievement progress: ON

  → Section: Celebrations
    [Toggle] Enable level-up particle effects: ON
    [Toggle] Enable sound effects: OFF (workspace default)
    [Toggle] Enable full-screen legendary celebrations: ON

Step 3: Save Settings
  User adjusts desired settings and clicks "Save Changes"
  → Toast notification: "Gamification settings updated"
  → Changes take effect immediately for all workspace members
  → Members with individual overrides keep their personal preferences

Step 4: Set Per-User Override
  User navigates to Members tab
  → Clicks on a member row (e.g., "Marcus Rivera, CTO")
  → Per-user settings panel:
    [Dropdown] Display Mode Override: Professional Mode
    [Toggle] Receive celebration notifications: OFF
  → Saves: Marcus sees Professional Mode regardless of workspace default
```

---

### Flow 8: Team/Workspace Management

**Persona:** Sarah Kim (Engineering Team Lead)
**Goal:** Create a team workspace, invite members, and configure roles

```
Step 1: Create Workspace
  User clicks the workspace switcher dropdown in the top-left header
  → Shows existing workspaces + "Create New Workspace" button
  User clicks "Create New Workspace"
  → Dialog:
    Workspace Name: [text input] "AI Platform Team"
    Description: [textarea, optional] "Production agent monitoring for the platform team"
    [Create]

Step 2: Workspace Created
  → Redirects to the new workspace (empty canvas)
  → API key auto-generated and displayed in a one-time banner:
    "Your API key: oav_abc123... (copy it now; this is the only time it will be shown in full)"
    [Copy] [I've saved it]
  → Left sidebar shows the new workspace name

Step 3: Invite Members
  User navigates to Settings > Members
  → "Invite Members" button
  → Dialog:
    Email addresses: [text area, one per line or comma-separated]
    Role: [dropdown: Admin | Member | Viewer]
    Personalized message: [textarea, optional]
    [Send Invitations]
  → Invitations sent via email with a workspace join link
  → Pending invitations shown in the Members table with "Pending" status

Step 4: Manage Roles
  Members table:
    Columns: Name | Email | Role | Status | Last Active | Actions
    Actions dropdown per member: Change Role | Remove | View Activity
  User changes a member from "Member" to "Admin"
  → Toast: "Role updated. [member name] is now an Admin."

Step 5: Role Permissions Summary
  → Info panel below the members table:
    Owner: Full access, billing, delete workspace
    Admin: Manage members, manage API keys, configure settings, all data access
    Member: View canvas, view dashboard, create tasks, view replays
    Viewer: View canvas (read-only), view dashboard (read-only), view replays
  → Viewers cannot: create tasks, modify settings, kill agents, export data, manage API keys

Step 6: API Key Management
  User navigates to Settings > API Keys
  → Table: Key Name | Created | Last Used | Status | Actions
  → "Create API Key" button:
    Key Name: [text input] "Production Pipeline"
    [Generate]
    → Key displayed once: "oav_xyz789..." [Copy]
  → Actions: Rotate (generate new key, old one expires in 24h) | Revoke (immediate)

Step 7: Workspace Switching
  User clicks workspace switcher dropdown
  → Shows all workspaces they belong to with role indicator
  → Clicking a workspace switches the entire UI context (canvas, sidebar, settings)
  → Last-used workspace is remembered on login
```

---

### Flow 9: Cost Analysis Workflow

**Persona:** Marcus Rivera (CTO)
**Goal:** Understand AI spend across agents, identify cost optimization opportunities, report to the CFO

```
Step 1: Navigate to Costs
  User clicks "Costs" in the left sidebar
  → Cost dashboard page loads

Step 2: Cost Overview
  → Top bar: Period selector [Today | 7 Days | 30 Days | Custom Range]
  → Summary cards row:
    [Total Spend: $847.20] [Avg Daily: $28.24] [Budget Used: 56%] [Agents Active: 14]
  → Budget meter bar: Green at 56%, with markers at 50% (warning) and 80% (critical)

Step 3: Cost Breakdown by Agent
  → Sortable table:
    Columns: Agent Name | Level | Tasks | Total Cost | Avg Cost/Task | Model | % of Total
    Default sort: Total Cost descending
    Click column header to re-sort
    Click agent name to drill into agent cost detail page
  → Top 3 agents highlighted with a "highest spend" badge

Step 4: Cost by Model
  → Donut chart:
    Segments: GPT-4o (60%), GPT-4o-mini (25%), Claude 3.5 Sonnet (10%), Other (5%)
    Hover segment for exact dollar amount
  → Recommendation callout:
    "Switching ResearchAgent from GPT-4o to GPT-4o-mini could save $120/month
     based on its task profile (85% simple queries, 15% complex reasoning)."

Step 5: Cost Trend
  → Line chart: Daily cost over selected period
    Y-axis: Dollar amount
    X-axis: Date
    Separate lines per model (toggle-able)
    Budget line overlay (dashed horizontal line at $50/day)
    Anomaly markers: Red dots on days where spend exceeded 2x the 7-day average

Step 6: Export Report
  User clicks "Export" button
  → Options:
    Format: [CSV] [PDF] [JSON]
    Period: [matches current selection]
    Include: [x] Summary [x] Agent breakdown [x] Model breakdown [x] Trend data
  → File downloads immediately

Step 7: Set Cost Alert
  User clicks "Configure Alerts" from the cost dashboard
  → Redirects to Alerts > Cost Alerts section (see Flow 10)
```

---

### Flow 10: Setting Up Alerts and SLOs

**Persona:** Alex Chen (AI Platform Engineer)
**Goal:** Configure loop detection thresholds, cost alerts, and SLO targets

```
Step 1: Navigate to Alerts
  User clicks "Alerts" in the left sidebar
  → Alerts configuration page with tabs: Active Alerts | Alert Rules | SLOs | History

Step 2: View Active Alerts
  → Table of currently firing alerts:
    Columns: Severity | Type | Agent | Message | Started | Duration | Actions
    Severity icons: Critical (red), Warning (amber), Info (blue)
    Actions: [Acknowledge] [Investigate] [Dismiss]
  → Clicking "Investigate" opens the error detail flow (Flow 5)

Step 3: Create Alert Rule
  User clicks "Create Alert Rule"
  → Form:
    Alert Name: [text input] "High-Cost Loop Detection"
    Type: [dropdown]
      - Loop Detection (agent repeats same action N times)
      - Cost Threshold (agent or workspace exceeds $X)
      - Error Rate (agent error rate exceeds X%)
      - Latency (agent avg latency exceeds Xms)
      - Idle Agent (agent idle for more than X minutes)
      - Custom (define custom condition)

    Condition (for Loop Detection):
      Agent: [dropdown: All Agents / specific agent]
      Threshold: [number input] 5 repetitions
      Window: [number input] 60 seconds
      Severity: [dropdown] Critical

    Notifications:
      [Checkbox] Show banner on canvas: checked
      [Checkbox] Play sound alert: checked
      [Checkbox] Send to Slack webhook: unchecked [Configure Webhook]
      [Checkbox] Send to email: checked [kotsai@gmail.com]
      [Checkbox] Send to PagerDuty: unchecked [Configure]

    Actions:
      [Checkbox] Auto-kill agent on trigger: unchecked
      [Checkbox] Auto-pause workspace on trigger: unchecked

    [Save Alert Rule]

Step 4: Configure SLOs
  User clicks the "SLOs" tab
  → "Create SLO" button
  → Form:
    SLO Name: [text input] "Agent Success Rate"
    Metric: [dropdown]
      - Task Success Rate
      - Average Latency
      - Error Budget
      - Cost per Task
    Target: [number input] 95%
    Period: [dropdown] Rolling 7 days
    Agent Scope: [dropdown: All / Specific agents (multi-select)]
    Alert When:
      [Checkbox] Burning error budget too fast (projected miss in < 24h)
      [Checkbox] SLO violated

  → SLO card appears in the dashboard:
    SLO Name | Target | Current | Status (healthy/warning/violated) | Error Budget Remaining
    "Agent Success Rate" | 95% | 96.2% | Healthy | 68% remaining

Step 5: View Alert History
  User clicks "History" tab
  → Chronological table of all past alerts:
    Columns: Time | Type | Agent | Message | Duration | Resolution
    Filters: Date range, type, severity, agent
    Resolution: Acknowledged / Auto-Resolved / Dismissed / Escalated
  → Click any row to see full alert detail including investigation trail

Step 6: Webhook Configuration (for Slack)
  User clicks "Configure Webhook" next to Slack option
  → Dialog:
    Webhook URL: [text input] https://hooks.slack.com/services/...
    Channel: [text input] #ai-alerts
    Test: [Send Test Alert] → Posts a test message to the channel
    [Save]
```

---

### Flow 11: Quick Search and Command Palette (Cmd+K)

**Persona:** Alex Chen (AI Platform Engineer)
**Goal:** Rapidly navigate to any entity, page, or action without touching the mouse

```
Step 1: Activate
  User presses Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  → Command palette modal appears (centered, 600px wide, dark overlay background)
  → Search input auto-focused with blinking cursor
  → Recent searches shown below input (last 5)

Step 2: Search
  User types "research"
  → Results populate in real-time (debounced 150ms):
    Category: Agents
      ResearchAgent (Level 12, Active)
      ResearchAssistant (Level 5, Idle)
    Category: Tasks
      "Research competitor pricing" (In Progress)
      "Research market sizing" (Completed, March 14)
    Category: Sessions
      "Market Research Run #42" (March 15, $1.38)
    Category: Pages
      Settings > Alert Rules
    Category: Actions
      "Create new task"
      "Export cost report"

Step 3: Navigate
  User uses arrow keys to highlight "ResearchAgent"
  → Presses Enter
  → Command palette closes
  → Canvas auto-pans to the agent and opens its detail panel

  OR: User types "> " prefix for actions:
    "> kill" → shows "Kill Agent: [agent dropdown]"
    "> export" → shows "Export Cost Report", "Export Session Data"
    "> mode professional" → switches to Professional Mode
    "> zoom fit" → fits all agents in viewport
```

---

### Flow 12: Leaderboard Review

**Persona:** Sarah Kim (Engineering Team Lead)
**Goal:** Review team agent rankings and identify optimization opportunities

```
Step 1: Navigate to Leaderboard
  User clicks "Leaderboard" in the left sidebar
  → Leaderboard page loads

Step 2: View Rankings
  → Period selector: [Today] [7 Days] [30 Days] [All Time]
  → Tab bar: [Composite] [Efficiency] [Speed] [Quality] [Cost] [Reliability]
  → Ranking table:
    Rank | Change | Agent Avatar | Agent Name | Level | Score | Key Metric | Trend
    #1   | --     | [avatar]     | CoderAgent | Lv.18 | 94.2  | 0.012 $/task | [sparkline up]
    #2   | +2     | [avatar]     | ResearchAgent | Lv.12 | 91.8 | 1.8s avg | [sparkline up]
    #3   | -1     | [avatar]     | ReviewAgent | Lv.15  | 89.5  | 97.3% quality | [sparkline flat]
    ...
  → Rank change column: green up arrows, red down arrows, grey dash for no change

Step 3: Agent Comparison
  User selects two agents (checkboxes on left of each row)
  → "Compare Selected" button appears
  → Click: Opens side-by-side comparison panel (see Flow 4, Step 5)

Step 4: Professional Mode View
  If Professional Mode is active:
    Page title: "Performance Benchmarks" instead of "Leaderboard"
    Rank column: "Tier" (1st percentile = "Elite", top 10% = "Advanced", etc.)
    No gamified language; all data is identical
    Badges shown as "Certifications"
    XP shown as "Performance Score"
```

---

## 3. Information Architecture

### 3.1 Complete Sitemap

```
OpenAgentVisualizer
├── / (Dashboard / Canvas View -- main entry point)
│   ├── Canvas (default: virtual world view)
│   │   ├── Agent tooltips (hover)
│   │   ├── Agent detail panel (click, slides from right)
│   │   ├── Task queue panel (click Tasks icon, slides from left)
│   │   ├── Activity feed panel (click Feed icon, slides from left)
│   │   └── Alert banner overlay (triggered by system)
│   └── Minimap (bottom-right overlay)
│
├── /dashboard
│   ├── Overview (workspace-level summary cards + agent grid)
│   └── /dashboard/agent/:agentId
│       ├── Overview tab (default)
│       ├── Tasks tab
│       ├── Traces tab
│       ├── Cost tab
│       └── Achievements tab
│
├── /sessions
│   ├── Sessions list (table with filters)
│   └── /sessions/:sessionId/replay
│       └── Replay view (canvas + timeline + controls)
│
├── /leaderboard
│   ├── Composite ranking (default tab)
│   ├── Efficiency ranking
│   ├── Speed ranking
│   ├── Quality ranking
│   ├── Cost-effectiveness ranking
│   └── Reliability ranking
│
├── /costs
│   ├── Overview (summary + budget meter)
│   ├── By Agent (sortable table)
│   ├── By Model (donut chart + table)
│   └── Trend (line chart)
│
├── /alerts
│   ├── Active (currently firing)
│   ├── Rules (alert rule configuration)
│   ├── SLOs (SLO definitions and status)
│   └── History (past alerts)
│
├── /settings
│   ├── General (workspace name, description, Professional Mode toggle)
│   ├── Members (invite, roles, per-user overrides)
│   ├── API Keys (create, rotate, revoke)
│   ├── Gamification (XP, leaderboard, achievements, celebrations config)
│   ├── Alerts (default notification channels, webhook config)
│   ├── Integrations (SDK setup guides, webhook endpoints)
│   └── Billing (plan, usage, invoices)
│
├── /profile
│   ├── Account (name, email, password, avatar)
│   ├── Preferences (theme, notification preferences, keyboard shortcut customization)
│   ├── Workspaces (list of workspaces user belongs to)
│   └── Achievements (personal badges)
│
├── /auth
│   ├── /auth/login
│   ├── /auth/signup
│   ├── /auth/forgot-password
│   └── /auth/oauth/callback
│
└── /onboarding
    ├── Welcome (workspace creation + path choice)
    └── SDK Setup (integration guide)
```

### 3.2 Navigation Model

```
+-------+-------------------------------------------------------------------+
| LOGO  |  [Workspace Name v]        [Search: Cmd+K]     [?] [Bell] [Av]  |
+-------+-------------------------------------------------------------------+
|       |                                                                   |
| SIDE  |                                                                   |
| BAR   |                  MAIN CONTENT AREA                                |
|       |                                                                   |
| [W]   |  (Canvas, Dashboard, Sessions, Leaderboard, Costs,               |
| [D]   |   Alerts, Settings -- based on current route)                     |
| [S]   |                                                                   |
| [L]   |                                                                   |
| [C]   |                                                                   |
| [A]   |                                                                   |
|       |                                                                   |
|-------+                                                                   |
| [G]   |                                                                   |
| [P]   |                                                                   |
+-------+-------------------------------------------------------------------+

Sidebar Icons (top to bottom):
  [W] World (Canvas) -- /
  [D] Dashboard -- /dashboard
  [S] Sessions -- /sessions
  [L] Leaderboard -- /leaderboard
  [C] Costs -- /costs
  [A] Alerts -- /alerts (badge count for active alerts)
  ----separator----
  [G] Settings (gear) -- /settings
  [P] Profile (avatar) -- /profile
```

**Primary Navigation:** Collapsed icon sidebar (56px wide) on the left. Icons with tooltips on hover. Expands to full sidebar (240px) on hover or user preference. Active page highlighted with accent color background on icon.

**Secondary Navigation:** Tabs within pages (Dashboard tabs, Alert tabs, Leaderboard metric tabs). Breadcrumbs for drill-down pages (Dashboard > ResearchAgent > Traces).

**Breadcrumbs:** Shown below the header on all pages except the canvas view. Format: `Home / Dashboard / ResearchAgent / Tasks`. Each segment is clickable.

### 3.3 URL Structure

| Page | URL | Notes |
|------|-----|-------|
| Canvas (main) | `/` | Default landing page |
| Dashboard overview | `/dashboard` | |
| Agent detail | `/dashboard/agent/:agentId` | Tab parameter: `?tab=tasks` |
| Sessions list | `/sessions` | Filter params: `?status=failed&from=2026-03-01` |
| Session replay | `/sessions/:sessionId/replay` | Timestamp param: `?t=145` (seconds) |
| Leaderboard | `/leaderboard` | Tab param: `?metric=efficiency&period=7d` |
| Costs | `/costs` | Period param: `?period=30d` |
| Alerts | `/alerts` | Tab param: `?tab=rules` |
| Settings | `/settings/:section` | e.g., `/settings/gamification` |
| Profile | `/profile` | |
| Login | `/auth/login` | |
| Sign up | `/auth/signup` | |
| Shared replay | `/share/:shareId` | Public or restricted link |

---

## 4. Wireframes

### 4.1 Main Virtual World View (Canvas + Sidebar + Header)

```
+-------+-------------------------------------------------------------------+
| OAV   |  [My Workspace v]     [___Search (Cmd+K)___]   [?] [3] [@]      |
| LOGO  |                                                                   |
+-------+-------------------------------------------------------------------+
|       |                                                                   |
|  [W]  |   +-------------------------------------------------------+     |
|  ----  |   |                                                       |     |
|  [D]  |   |   RESEARCH WING              REVIEW ROOM              |     |
|  [S]  |   |                                                        |     |
|  [L]  |   |     (@)ResearchAgent          (@)ReviewAgent           |     |
|  [C]  |   |      Lv.12 Expert              Lv.15 Senior            |     |
|  [A]  |   |      [thinking...]             [idle]                  |     |
|       |   |                                                        |     |
|  ---- |   |   - - - - - - - - - - - - - - - - - - - - - - - -     |     |
|  [G]  |   |                                                        |     |
|  [P]  |   |   EXECUTION FLOOR                                     |     |
|       |   |                                                        |     |
|       |   |     (@)CoderAgent     (@)AnalystAgent                  |     |
|       |   |      Lv.18 Senior      Lv.8 Specialist                 |     |
|       |   |      [executing]       [waiting...]                    |     |
|       |   |                                                        |     |
|       |   |            ---->>task handoff>>----> (@)QAAgent        |     |
|       |   |                                       Lv.6 Practitioner|     |
|       |   |                                       [idle]           |     |
|       |   |                                                        |     |
|       |   |   ARCHIVE                                              |     |
|       |   |     (dimmed inactive agents)                           |     |
|       |   |                                                  [map] |     |
|       |   +-------------------------------------------------------+     |
|       |                                                                   |
|       |   [|< << > >> >|]  [1x v]  [====|==========-------] 14:30:25    |
|       |   ^ replay controls (only visible during replay mode)            |
+-------+-------------------------------------------------------------------+
|  Activity Feed (collapsed bar, click to expand):                         |
|  "ResearchAgent completed 'Market analysis' +75 XP | CoderAgent err..." |
+--------------------------------------------------------------------------+

Legend:
  (@) = Agent avatar with status ring color
  [map] = Minimap thumbnail showing viewport position
  [3] = Notification bell with unread count badge
  [@] = User avatar/profile menu
  [?] = Help menu
```

### 4.2 Agent Detail Panel (Sliding Panel from Right)

```
When user clicks on ResearchAgent, a panel slides in from the right:

+-------+--------------------------------------+----------------------------+
| SIDE  |          CANVAS (dimmed)             |    AGENT DETAIL PANEL      |
| BAR   |                                      |    (400px width)           |
|       |                                      |                            |
|       |                                      |  [X close]                 |
|       |                                      |                            |
|       |                                      |  (@) ResearchAgent         |
|       |                                      |  Level 12 -- Expert I      |
|       |                                      |  [====......] 3,362 XP     |
|       |                                      |  Badges: [B1] [B2] [B3]   |
|       |                                      |                            |
|       |                                      |  Status: THINKING          |
|       |                                      |  Task: Research competitor  |
|       |                                      |         pricing            |
|       |                                      |  Duration: 4.2s            |
|       |                                      |                            |
|       |                                      |  --- METRICS ---           |
|       |                                      |  Tasks: 47/52 (90.4%)      |
|       |                                      |  Tokens: 124,500           |
|       |                                      |  Cost: $0.94               |
|       |                                      |  Avg Latency: 2.1s         |
|       |                                      |  Streak: 23 successes      |
|       |                                      |                            |
|       |                                      |  --- RECENT ACTIVITY ---   |
|       |                                      |  14:30:05 Task started     |
|       |                                      |  14:30:07 Thinking...      |
|       |                                      |  14:30:09 web_search call  |
|       |                                      |  14:30:12 Result received  |
|       |                                      |                            |
|       |                                      |  [View Full Dashboard]     |
|       |                                      |  [View Trace] [Replay]     |
|       |                                      |  [Kill Agent]              |
|       |                                      |                            |
+-------+--------------------------------------+----------------------------+
```

### 4.3 Dashboard Page (Metrics Grid)

```
+-------+-------------------------------------------------------------------+
| SIDE  |  Breadcrumb: Home / Dashboard                                     |
| BAR   |                                                                   |
|       |  Period: [Today] [7d] [30d] [Custom]                             |
|       |                                                                   |
|       |  +----------+ +----------+ +----------+ +----------+             |
|       |  | AGENTS   | | ACTIVE   | | COST     | | TASKS    |             |
|       |  | 12       | | 8        | | $4.72    | | 147      |             |
|       |  | total    | | right now| | today    | | today    |             |
|       |  +----------+ +----------+ +----------+ +----------+             |
|       |                                                                   |
|       |  AGENT GRID:                                                      |
|       |  +-------------------+ +-------------------+ +------------------+ |
|       |  | (@) ResearchAgent | | (@) CoderAgent    | | (@) ReviewAgent  | |
|       |  | Lv.12 Expert I    | | Lv.18 Senior III  | | Lv.15 Senior I   | |
|       |  | Status: Thinking  | | Status: Executing | | Status: Idle     | |
|       |  | Tasks: 47/52 90%  | | Tasks: 83/89 93%  | | Tasks: 34/35 97% | |
|       |  | Cost: $0.94       | | Cost: $1.20       | | Cost: $0.45      | |
|       |  | Latency: 2.1s     | | Latency: 1.8s     | | Latency: 3.4s    | |
|       |  | [==........] XP   | | [=========.] XP   | | [======...] XP   | |
|       |  | [sparkline~~~~~~] | | [sparkline~~~~~~] | | [sparkline~~~~]  | |
|       |  +-------------------+ +-------------------+ +------------------+ |
|       |                                                                   |
|       |  +-------------------+ +-------------------+ +------------------+ |
|       |  | (@) AnalystAgent  | | (@) QAAgent       | | (@) ManagerAgent | |
|       |  | ...               | | ...               | | ...              | |
|       |  +-------------------+ +-------------------+ +------------------+ |
|       |                                                                   |
+-------+-------------------------------------------------------------------+
```

### 4.4 Traces/Sessions List

```
+-------+-------------------------------------------------------------------+
| SIDE  |  Breadcrumb: Home / Sessions                                      |
| BAR   |                                                                   |
|       |  Filters: [Status v] [Agent v] [Date Range v] [Cost Range v]     |
|       |  Search: [________________________]                               |
|       |                                                                   |
|       |  +---------------------------------------------------------------+|
|       |  | > | Session Name          | Agents | Dur    | Tasks | Cost   ||
|       |  |---|---------------------- |--------|--------|-------|--------||
|       |  | > | Market Research #42   | 3      | 4m 5s  | 12    | $1.38  ||
|       |  |   | Mar 15, 14:30 UTC     |        |        | 11/12 | [succ] ||
|       |  |---|---------------------- |--------|--------|-------|--------||
|       |  | > | Code Review Pipeline  | 5      | 8m 12s | 24    | $3.47  ||
|       |  |   | Mar 15, 10:15 UTC     |        |        | 22/24 | [warn] ||
|       |  |---|---------------------- |--------|--------|-------|--------||
|       |  | > | Data Extraction Batch | 2      | 1m 30s | 8     | $0.42  ||
|       |  |   | Mar 14, 22:00 UTC     |        |        | 8/8   | [succ] ||
|       |  |---|---------------------- |--------|--------|-------|--------||
|       |  | > | Incident Analysis     | 4      | 12m 8s | 31    | $5.80  ||
|       |  |   | Mar 14, 16:45 UTC     |        |        | 28/31 | [fail] ||
|       |  +---------------------------------------------------------------+|
|       |                                                                   |
|       |  Legend: [succ] = all tasks succeeded                             |
|       |          [warn] = some tasks failed                               |
|       |          [fail] = session ended in error                          |
|       |                                                                   |
|       |  [>] Click row to expand: shows trace waterfall inline            |
|       |  [Play icon] appears on hover to open replay                      |
|       |  [Share icon] appears on hover to copy shareable link             |
|       |                                                                   |
|       |  Pagination: [< Prev] Page 1 of 24 [Next >]                      |
+-------+-------------------------------------------------------------------+
```

### 4.5 Alert Configuration

```
+-------+-------------------------------------------------------------------+
| SIDE  |  Breadcrumb: Home / Alerts                                        |
| BAR   |                                                                   |
|       |  Tabs: [Active (3)] [Rules (7)] [SLOs (2)] [History]             |
|       |                                                                   |
|       |  === ACTIVE ALERTS TAB ===                                        |
|       |                                                                   |
|       |  +---------------------------------------------------------------+|
|       |  | [!] CRITICAL  Loop Detected: ResearchAgent                    ||
|       |  |     web_search repeated 8x in 45s | Cost: $0.14              ||
|       |  |     Started: 14:30:05 UTC (2 min ago)                         ||
|       |  |     [Acknowledge] [Investigate] [Kill Agent] [Dismiss]        ||
|       |  +---------------------------------------------------------------+|
|       |  | [!] WARNING   Cost Threshold: CoderAgent                      ||
|       |  |     Session cost $26.40 exceeds $25 threshold                 ||
|       |  |     Started: 14:28:00 UTC (4 min ago)                         ||
|       |  |     [Acknowledge] [Investigate] [Dismiss]                     ||
|       |  +---------------------------------------------------------------+|
|       |  | [i] INFO      Idle Agent: QAAgent                             ||
|       |  |     No activity for 30 minutes                                ||
|       |  |     [Dismiss]                                                  ||
|       |  +---------------------------------------------------------------+|
|       |                                                                   |
|       |  === RULES TAB ===                                                |
|       |                                                                   |
|       |  [+ Create Alert Rule]                                            |
|       |                                                                   |
|       |  +---------------------------------------------------------------+|
|       |  | Name             | Type       | Scope      | Status | Actions ||
|       |  |------------------|------------|------------|--------|---------|+
|       |  | Loop Detection   | Loop       | All Agents | Active | [E][D] ||
|       |  | High Cost Alert  | Cost       | All Agents | Active | [E][D] ||
|       |  | Error Rate SLA   | Error Rate | Production | Active | [E][D] ||
|       |  | Idle Warning     | Idle       | All Agents | Active | [E][D] ||
|       |  +---------------------------------------------------------------+|
|       |                                                                   |
|       |  [E] = Edit  [D] = Disable/Delete                                |
+-------+-------------------------------------------------------------------+
```

### 4.6 Settings Pages

```
+-------+-------------------------------------------------------------------+
| SIDE  |  Breadcrumb: Home / Settings / Gamification                       |
| BAR   |                                                                   |
|       |  Settings Nav:                                                     |
|       |  [General] [Members] [API Keys] [Gamification*] [Alerts]         |
|       |  [Integrations] [Billing]                                         |
|       |                                                                   |
|       |  === GAMIFICATION SETTINGS ===                                    |
|       |                                                                   |
|       |  DISPLAY MODE                                                     |
|       |  ( ) Gamified Mode                                                |
|       |      Full animations, XP, badges, leaderboards                    |
|       |  (*) Professional Mode                                            |
|       |      Benchmarks, performance scores, certifications               |
|       |  [x] Allow individual members to override                         |
|       |                                                                   |
|       |  -------                                                          |
|       |                                                                   |
|       |  XP SYSTEM                                                        |
|       |  Enable XP earning:          [ON ]                                |
|       |  Show XP animations:         [ON ]                                |
|       |  Show floating +XP numbers:  [ON ]                                |
|       |  Notification cap/session:   [3  ]                                |
|       |  Enable XP decay:            [ON ]                                |
|       |  Decay grace period:         [7  ] days                           |
|       |                                                                   |
|       |  -------                                                          |
|       |                                                                   |
|       |  LEADERBOARD                                                      |
|       |  Enable leaderboard:         [ON ]                                |
|       |  Default metric:             [Composite Score v]                  |
|       |  Min tasks to rank:          [20 ]                                |
|       |  Show rank changes:          [ON ]                                |
|       |                                                                   |
|       |  -------                                                          |
|       |                                                                   |
|       |  CELEBRATIONS                                                     |
|       |  Level-up effects:           [ON ]                                |
|       |  Sound effects:              [OFF]                                |
|       |  Full-screen legendary:      [ON ]                                |
|       |                                                                   |
|       |  [Save Changes]                                                   |
+-------+-------------------------------------------------------------------+
```

### 4.7 Leaderboard View

```
+-------+-------------------------------------------------------------------+
| SIDE  |  Breadcrumb: Home / Leaderboard                                   |
| BAR   |                                                                   |
|       |  Period: [Today] [7 Days*] [30 Days] [All Time]                  |
|       |                                                                   |
|       |  Tabs: [Composite*] [Efficiency] [Speed] [Quality] [Cost] [Rel] |
|       |                                                                   |
|       |  TOP 3 PODIUM:                                                    |
|       |  +-------------------+-----------------------------+-------------+|
|       |  |                   |         #1                  |             ||
|       |  |       #2          |    (@) CoderAgent           |    #3       ||
|       |  | (@) ResearchAgent |    Lv.18 Senior III         | (@) Review  ||
|       |  | Lv.12 Expert I    |    Score: 94.2              | Lv.15       ||
|       |  | Score: 91.8       |    "Machine" badge          | Score: 89.5 ||
|       |  +-------------------+-----------------------------+-------------+|
|       |                                                                   |
|       |  FULL RANKINGS:                                                   |
|       |  +---------------------------------------------------------------+|
|       |  | [x] | Rank | Chg | Agent            | Lv | Score | Trend    ||
|       |  |-----|------|-----|------------------|-----|-------|----------|+
|       |  | [ ] | #1   | --  | CoderAgent       | 18  | 94.2  | [up~~~] ||
|       |  | [ ] | #2   | +2  | ResearchAgent    | 12  | 91.8  | [up~~~] ||
|       |  | [ ] | #3   | -1  | ReviewAgent      | 15  | 89.5  | [flat~] ||
|       |  | [ ] | #4   | -1  | AnalystAgent     | 8   | 85.1  | [down~] ||
|       |  | [ ] | #5   | NEW | ManagerAgent     | 6   | 82.7  | [new~~] ||
|       |  | [ ] | #6   | --  | QAAgent          | 6   | 79.3  | [flat~] ||
|       |  +---------------------------------------------------------------+|
|       |                                                                   |
|       |  [x] = checkbox for compare  [Compare Selected (2)]              |
|       |                                                                   |
+-------+-------------------------------------------------------------------+
```

---

## 5. Interaction Patterns

### 5.1 Canvas Interactions

| Interaction | Input | Behavior |
|---|---|---|
| **Pan** | Mouse click+drag on empty canvas | Smooth scroll in drag direction |
| **Pan** | Arrow keys | Move viewport 100px per key press |
| **Pan** | Shift + Arrow keys | Move viewport 500px per key press |
| **Zoom in** | Mouse scroll up / Trackpad pinch out / + key | Zoom toward cursor focal point |
| **Zoom out** | Mouse scroll down / Trackpad pinch in / - key | Zoom away from cursor focal point |
| **Zoom to fit** | F key / Double-click empty canvas | Fit all agents in viewport with padding |
| **Reset zoom** | 0 key | Reset to 100% zoom, center viewport |
| **Select agent** | Left-click agent avatar | Open detail panel, show selection ring |
| **Deselect** | Click empty canvas / Escape key | Close detail panel, remove selection |
| **Hover tooltip** | Mouse hover over agent (200ms delay) | Show status tooltip |
| **Drag task** | Click+drag from task queue onto agent | Assign task with drop animation |
| **Right-click agent** | Right-click agent avatar | Context menu (see 5.3) |
| **Multi-select** | Shift+click agents | Select multiple agents (group actions) |
| **Box select** | Ctrl+click+drag on canvas | Draw selection rectangle around agents |

### 5.2 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Escape` | Close current panel/modal/overlay |
| `1` | Navigate to Canvas (World) |
| `2` | Navigate to Dashboard |
| `3` | Navigate to Sessions |
| `4` | Navigate to Leaderboard |
| `5` | Navigate to Costs |
| `6` | Navigate to Alerts |
| `F` | Fit all agents in viewport |
| `0` | Reset zoom to 100% |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `Arrow keys` | Pan canvas |
| `Shift + Arrow keys` | Fast pan canvas |
| `Tab` | Cycle focus between agents on canvas |
| `Enter` | Open detail panel for focused agent |
| `Space` | Play/pause session replay (when in replay mode) |
| `[` | Slow down replay (0.5x decrement) |
| `]` | Speed up replay (2x increment) |
| `Cmd+E` / `Ctrl+E` | Export current view data |
| `Cmd+Shift+P` | Toggle Professional Mode |
| `?` | Show keyboard shortcut reference overlay |
| `M` | Toggle audio mute |
| `N` | Toggle notification panel |

### 5.3 Right-Click Context Menus

**Right-click on Agent Avatar:**
```
+---------------------------+
| View Dashboard       Cmd+D|
| View Latest Trace         |
| Replay Last Session       |
| ----------------------    |
| Assign Task...            |
| Compare With...           |
| ----------------------    |
| Copy Agent ID             |
| Copy API Config           |
| ----------------------    |
| Kill Agent           Cmd+K|
+---------------------------+
```

**Right-click on Empty Canvas:**
```
+---------------------------+
| Fit All Agents         F  |
| Reset Zoom             0  |
| ----------------------    |
| Toggle Grid Overlay       |
| Toggle Zone Labels        |
| ----------------------    |
| Canvas Settings...        |
| Screenshot Canvas         |
+---------------------------+
```

**Right-click on Session Row (Sessions Page):**
```
+---------------------------+
| Open Replay               |
| View Trace Timeline       |
| ----------------------    |
| Share Replay Link...      |
| Export Session Data       |
| ----------------------    |
| Delete Session            |
+---------------------------+
```

### 5.4 Drag-and-Drop Task Assignment

1. **Initiation:** User clicks and holds the drag handle on a task card in the task queue panel. After 150ms hold, the card "lifts" with a subtle shadow elevation and attaches to the cursor.

2. **During drag:** The canvas enters "drop target mode":
   - All agent avatars show a pulsing outline indicating they accept drops
   - Agents whose role matches the task type have a brighter, highlighted outline (recommended targets)
   - A dashed line connects the cursor to the nearest eligible agent
   - The task card is rendered as a semi-transparent overlay following the cursor

3. **Hover over agent:** When the task card hovers over an agent avatar:
   - Agent avatar scales up slightly (105%)
   - Tooltip shows: "Assign to ResearchAgent"
   - Outline color changes to green (ready to drop)

4. **Drop:** User releases the mouse:
   - Task card animates (shrinks, rotates slightly, flies into the agent)
   - Agent shows a "received" bounce animation
   - Status ring transitions from idle to thinking
   - Toast confirmation: "Task assigned to ResearchAgent"

5. **Cancel:** User drags back to the task queue or presses Escape:
   - Task card animates back to its original position in the queue
   - Drop target mode deactivates

### 5.5 Search and Filter Patterns

**Global Search (Cmd+K):**
- Results are categorized: Agents, Tasks, Sessions, Pages, Actions
- Results update as the user types (150ms debounce)
- Arrow keys navigate results; Enter selects; Escape closes
- Recent searches are persisted per user (last 5)
- The ">" prefix switches to action/command mode

**Table Filters (Sessions, Tasks, Alerts, Costs):**
- Filter bar above every table with dropdown selectors
- Active filters shown as removable pills/tags
- "Clear All Filters" link appears when any filter is active
- URL query parameters encode filter state (shareable/bookmarkable)
- Filters persist per-session (not across browser tabs)

**Agent Filter on Canvas:**
- A filter bar above the canvas allows filtering agents by: role, status, level range, team
- Filtered-out agents are dimmed (20% opacity) but not hidden, to maintain spatial context
- Filter count badge: "Showing 5 of 12 agents"

### 5.6 Notification Behavior

**Notification Priority Levels:**

| Level | Visual | Sound | Persistence |
|---|---|---|---|
| **Critical** | Full-width banner, red, at top of canvas. Requires manual dismissal or action. Browser tab title prefix `(!)`. | Alert tone (if enabled) | Until dismissed or resolved |
| **Warning** | Toast notification, amber, top-right. Auto-dismisses after 8 seconds. | Subtle chime (if enabled) | 8 seconds, then to notification panel |
| **Info** | Toast notification, blue, top-right. Auto-dismisses after 5 seconds. | None | 5 seconds, then to notification panel |
| **Success** | Toast notification, green, top-right. Auto-dismisses after 3 seconds. | None | 3 seconds |
| **Celebration** | Particle burst on canvas + toast with badge/level info. | Celebration sound (if enabled) | 3 seconds (particles), toast 5 seconds |

**Notification Panel (Bell Icon):**
- Shows all notifications from the current session
- Grouped by time: "Just Now", "Earlier Today", "Yesterday"
- Unread count badge on the bell icon
- "Mark All Read" link at top
- Click notification to navigate to the relevant entity

**Frequency Caps:**
- Maximum 3 celebration notifications per session (gamification)
- Maximum 1 notification per agent per alert rule per 5-minute window (prevents spam)
- Users can set "Focus Mode" which silences all non-critical notifications

---

## 6. Responsive Design Strategy

### 6.1 Design Philosophy: Desktop-First

OpenAgentVisualizer is a desktop-first web application. The primary use case -- monitoring a canvas of animated agents while debugging trace data -- requires a large viewport, precise mouse interactions, and keyboard shortcuts. The responsive strategy prioritizes desktop excellence and provides functional but reduced experiences on smaller screens.

### 6.2 Breakpoints

| Breakpoint | Width | Target Device | Strategy |
|---|---|---|---|
| **Desktop XL** | >= 1440px | Large monitors, wall displays | Full layout: sidebar + canvas + panels side-by-side |
| **Desktop** | 1024-1439px | Standard laptops | Full layout: sidebar collapses to icons, panels overlay |
| **Tablet** | 768-1023px | iPad landscape | Reduced layout: no canvas, dashboard-only mode |
| **Mobile** | < 768px | Phones | Read-only mode: alert notifications, basic metrics, no canvas |

### 6.3 Desktop XL (>= 1440px)

- Full expanded sidebar (240px) with text labels
- Canvas occupies remaining width
- Detail panels open as side panels (don't overlay canvas)
- Dashboard shows 3 agent cards per row
- Tables show all columns without horizontal scroll

### 6.4 Desktop (1024-1439px)

- Sidebar collapses to icon-only mode (56px) by default; expands on hover
- Canvas occupies full remaining width
- Detail panels overlay the canvas (slide in from right, semi-transparent backdrop on canvas)
- Dashboard shows 2 agent cards per row
- Tables may hide 1-2 lower-priority columns

### 6.5 Tablet (768-1023px)

- No canvas rendering (Pixi.js canvas is too interaction-intensive for touch)
- Dashboard view becomes the default landing page
- Agent list is a vertical card list (1 per row)
- Sessions, leaderboard, costs, and alerts are fully functional
- Navigation moves to a bottom tab bar (5 primary destinations)
- Settings accessible via hamburger menu
- Touch-friendly: all tap targets are minimum 44x44px

### 6.6 Mobile (< 768px)

- **Read-only monitoring mode only**
- Shows: Active alerts (critical only), key metrics (cost, active agents, error count), latest activity feed entries
- No canvas, no replay, no drag-and-drop
- Single-column layout
- Bottom tab bar with 3 tabs: Alerts, Metrics, Feed
- Primary CTA: "Open on Desktop for Full Experience"
- Push notifications for critical alerts (if browser supports)

### 6.7 Wall Display Mode

- Activated via URL parameter: `?display=wall` or via Settings > Display > Wall Mode
- Canvas is full-screen, no sidebar, no header
- Agent avatars are 2x size, labels are 3x size
- Status colors are maximum saturation for visibility at distance
- No hover tooltips (no mouse expected); all info is visible on-screen
- Alert banners are full-width, large font, high contrast
- Auto-rotates through views: Canvas (60s) -> Leaderboard (30s) -> Cost Summary (30s)
- Clock and workspace name displayed in top-left corner

---

## 7. Accessibility (WCAG 2.2)

### 7.1 Color Contrast

All text and interactive elements meet WCAG 2.2 AA contrast requirements:

| Element | Foreground | Background | Ratio | Requirement |
|---|---|---|---|---|
| Body text | `#E5E7EB` (grey-200) | `#0F1117` (dark bg) | 13.5:1 | AA (4.5:1) |
| Secondary text | `#9CA3AF` (grey-400) | `#0F1117` | 7.2:1 | AA (4.5:1) |
| Success status | `#22C55E` (green) | `#0F1117` | 5.4:1 | AA (4.5:1) |
| Warning status | `#F59E0B` (amber) | `#0F1117` | 8.1:1 | AA (4.5:1) |
| Error status | `#EF4444` (red) | `#0F1117` | 5.1:1 | AA (4.5:1) |
| Working status | `#3B82F6` (blue) | `#0F1117` | 5.0:1 | AA (4.5:1) |
| Idle status | `#6B7280` (grey-500) | `#0F1117` | 4.6:1 | AA (4.5:1) |
| Interactive link | `#60A5FA` (blue-400) | `#0F1117` | 7.4:1 | AA (4.5:1) |

### 7.2 Color-Blind Modes

Agent status relies on more than color alone. Each status has a distinct:
- **Color** (primary indicator)
- **Icon** (secondary indicator, always visible)
- **Animation pattern** (tertiary indicator)
- **Label text** (quaternary indicator, visible at sufficient zoom)

| Status | Color | Icon | Animation | Label |
|---|---|---|---|---|
| Idle | Grey | Pause icon | Slow pulse | "Idle" |
| Thinking | Blue | Brain icon | Orbiting dots | "Thinking" |
| Executing | Green | Gear icon | Spinning motion | "Executing" |
| Waiting | Amber | Clock icon | Blinking | "Waiting" |
| Error | Red | Warning triangle | Shake + flash | "Error" |
| Communicating | Purple | Speech bubble | Wave animation | "Communicating" |
| Complete | Teal | Checkmark | Glow fade | "Complete" |

Color-blind accessible palettes available in Settings > Preferences > Accessibility:
- **Deuteranopia (red-green):** Replaces green with blue-green (#06B6D4) and red with orange (#F97316)
- **Protanopia (red-green):** Same as deuteranopia palette
- **Tritanopia (blue-yellow):** Replaces blue with magenta (#D946EF) and yellow with light orange (#FB923C)

### 7.3 Keyboard Navigation

Every interactive element in the application is reachable and operable via keyboard alone:

- **Tab order:** Follows visual layout order: sidebar icons -> header elements -> main content area
- **Focus indicators:** Visible focus ring (2px solid `#60A5FA`, 2px offset) on all focusable elements. Focus ring is never suppressed.
- **Canvas keyboard navigation:**
  - Tab cycles through agents in spatial order (top-to-bottom, left-to-right)
  - Enter opens the detail panel for the focused agent
  - Arrow keys pan the canvas
  - Escape closes any open panel
- **Skip links:** Hidden "Skip to main content" and "Skip to navigation" links appear on Tab from the page top
- **Modal trap:** When a modal dialog is open, Tab is trapped within the modal. Escape closes the modal.
- **Landmark roles:** `<nav>`, `<main>`, `<aside>`, `<header>`, and `<footer>` ARIA landmarks on every page

### 7.4 Screen Reader Support

- All images and icons have descriptive `alt` text or `aria-label`
- Canvas agents are represented in the accessibility tree as a list of items:
  ```
  <div role="application" aria-label="Agent virtual world canvas">
    <div role="list" aria-label="Agents">
      <div role="listitem" aria-label="ResearchAgent, Level 12, Status: Thinking, Task: Research competitor pricing">
      </div>
    </div>
  </div>
  ```
- Live regions (`aria-live="polite"`) announce:
  - Agent status changes: "ResearchAgent is now executing"
  - Alert triggers: "Critical alert: Loop detected on ResearchAgent"
  - XP earned: "ResearchAgent earned 75 XP"
  - Task completions: "Task 'Market analysis' completed successfully"
- Notifications use `role="alert"` for critical alerts and `role="status"` for info/success messages
- Tables use proper `<th>` headers with `scope` attributes
- Forms use `<label>` elements linked to inputs via `for`/`id`

### 7.5 Reduced Motion

When the user has `prefers-reduced-motion: reduce` enabled in their OS settings:

- All canvas animations are replaced with instant state changes (no transitions)
- Particle effects (celebrations, XP bursts) are disabled
- Floating "+XP" text appears statically for 2 seconds and disappears (no rise-and-fade)
- Task handoff particles are replaced with static dashed lines
- Agent status changes are shown as instant color swaps, not animated transitions
- Loading spinners are replaced with static "Loading..." text
- Replay playback still works but without smooth interpolation between states (frame-by-frame)
- All transitions in the UI chrome (panel slide-in, page transitions) are instant

This preference can also be manually set in Settings > Preferences > Accessibility > Reduce Motion, independent of OS settings.

### 7.6 Text Scaling

- All text uses `rem` units based on a 16px root font size
- The application respects browser zoom up to 200% without layout breakage
- At 200% zoom, the sidebar auto-collapses to icon mode, and panels switch to overlay mode
- No text is rendered as images (all text is real DOM text or SVG text elements)
- Canvas agent labels use a minimum font size of 12px at default zoom, scaling with canvas zoom level

### 7.7 Focus Management

- When a panel opens (agent detail, task queue), focus moves to the panel heading
- When a panel closes, focus returns to the element that triggered it (e.g., the agent avatar on canvas)
- When a modal opens, focus moves to the first interactive element in the modal
- When a modal closes, focus returns to the trigger element
- Error messages in forms move focus to the first invalid field

---

## 8. Error States & Empty States

### 8.1 No Agents Connected (Empty Workspace)

```
+-------------------------------------------------------------------+
|                                                                     |
|                    +--------------------------+                     |
|                    |   [illustration: empty    |                     |
|                    |    workspace with ghost   |                     |
|                    |    agent outlines]        |                     |
|                    +--------------------------+                     |
|                                                                     |
|              Your workspace is waiting for agents.                  |
|                                                                     |
|    Connect your first agent in 3 lines of Python:                  |
|                                                                     |
|    +------------------------------------------------------+        |
|    | from openagentvisualizer import OAVTracer             |        |
|    | tracer = OAVTracer(api_key="oav_xxx...",              |        |
|    |                    workspace="my-workspace")          |        |
|    | tracer.auto_instrument()                              |        |
|    +------------------------------------------------------+        |
|                           [Copy Code]                               |
|                                                                     |
|    Or: [Explore with Sample Data]                                   |
|                                                                     |
|    Need help? [Read the Integration Guide] [Join Discord]          |
|                                                                     |
+-------------------------------------------------------------------+
```

### 8.2 API Error / Server Unreachable

```
+-------------------------------------------------------------------+
|  [!] Connection Lost                                    [Retry]    |
|      Unable to reach the OpenAgentVisualizer server.               |
|      Your data is safe. Agents will continue to buffer events      |
|      locally until the connection is restored.                     |
|      Last successful sync: 2 minutes ago.                          |
+-------------------------------------------------------------------+
```

- Banner appears at the top of the page (persistent, does not auto-dismiss)
- Canvas continues to show the last known state (agents freeze in their last position)
- "Retry" button triggers immediate reconnection attempt
- Auto-retry every 10 seconds with exponential backoff (10s, 20s, 40s, max 60s)
- When reconnected: banner transitions to green "Connection Restored" for 3 seconds, then dismisses

### 8.3 Loading States

**Canvas Loading:**
```
+-------------------------------------------------------------------+
|                                                                     |
|                   [animated logo pulse]                             |
|                                                                     |
|                Loading your workspace...                            |
|                                                                     |
|                [progress bar: =====------]                          |
|                Loading agents (4 of 12)                             |
|                                                                     |
+-------------------------------------------------------------------+
```

**Table Loading (Skeleton):**
```
+---------------------------------------------------------------+
| [grey bar ████████████]  | [████]  | [████████] | [████]      |
| [grey bar ██████████]    | [████]  | [██████]   | [████]      |
| [grey bar ████████████]  | [████]  | [████████] | [████]      |
+---------------------------------------------------------------+
```

Tables show skeleton rows (grey animated shimmer blocks) while loading. The skeleton matches the expected row layout to prevent layout shift.

**Chart Loading:**
```
+-----------------------------------------------+
|                                                 |
|         [circular spinner]                      |
|         Loading cost data...                    |
|                                                 |
+-----------------------------------------------+
```

**Agent Detail Panel Loading:**
- Header (avatar, name, level) loads immediately from cached data
- Metrics section shows skeleton placeholders
- Activity timeline shows 3 skeleton rows
- After loading: skeleton fades and real data fades in (150ms transition)

### 8.4 Zero Data States

**Dashboard with agents connected but no tasks completed yet:**
```
+-------------------------------------------------------------------+
|   Agents: 3       Active: 0        Cost: $0.00       Tasks: 0     |
|                                                                     |
|   Your agents are connected but haven't completed any tasks yet.   |
|   Assign a task or trigger your agent pipeline to see data.        |
|                                                                     |
|   [Assign a Task]  [View Sample Dashboard]                         |
+-------------------------------------------------------------------+
```

**Leaderboard with insufficient data:**
```
+-------------------------------------------------------------------+
|   The leaderboard needs more data to rank agents fairly.           |
|                                                                     |
|   Minimum 20 completed tasks per agent required.                   |
|                                                                     |
|   Progress:                                                         |
|   ResearchAgent:  [========------] 16/20 tasks                     |
|   CoderAgent:     [====----------] 8/20 tasks                      |
|   ReviewAgent:    [==------------] 4/20 tasks                      |
|                                                                     |
|   Keep running your agents -- the leaderboard will activate soon.  |
+-------------------------------------------------------------------+
```

**Sessions list with no replays:**
```
+-------------------------------------------------------------------+
|                                                                     |
|   [illustration: empty timeline]                                    |
|                                                                     |
|   No sessions recorded yet.                                         |
|                                                                     |
|   Sessions are automatically recorded when your agents run.        |
|   Trigger an agent pipeline to see your first session here.        |
|                                                                     |
|   [View Integration Guide]                                          |
+-------------------------------------------------------------------+
```

**Alert history with no past alerts:**
```
+-------------------------------------------------------------------+
|                                                                     |
|   [illustration: shield with checkmark]                             |
|                                                                     |
|   No alerts have fired. Everything is running smoothly.             |
|                                                                     |
|   Your alert rules are configured and monitoring.                  |
|   You'll see alert history here when rules trigger.                |
+-------------------------------------------------------------------+
```

### 8.5 Error Recovering States

**SDK event ingestion failure:**
- Activity feed entry (yellow): "Event ingestion delayed: 3 events buffered locally"
- No user-facing interruption -- SDK handles retry transparently
- If buffer exceeds 100MB: activity feed entry (amber): "Event buffer full. Oldest events will be dropped."

**WebSocket disconnection during live monitoring:**
- Canvas agents show a "stale" indicator (grey dashed overlay on status ring)
- Banner: "Real-time updates paused. Reconnecting..."
- On reconnection: all agents update to current state, stale indicators clear, banner dismisses

**Session replay data corrupted or incomplete:**
```
+-------------------------------------------------------------------+
|   [!] This replay has gaps in the recorded data.                    |
|                                                                     |
|   Missing data from 14:31:00 to 14:31:45 (45 seconds).            |
|   The replay will skip this period.                                |
|                                                                     |
|   [Play Anyway]  [View Raw Events Instead]                         |
+-------------------------------------------------------------------+
```

---

## 9. Onboarding Design

### 9.1 Progressive Disclosure Strategy

Onboarding is layered to match user intent and experience level:

**Layer 1: Immediate Value (0-2 minutes)**
- Sign up -> see the canvas (with sample data or real agents)
- No configuration, no settings, no choices beyond "connect agents" or "explore sample data"
- The user's first impression is the animated virtual world, not a settings form

**Layer 2: Guided Tour (2-5 minutes)**
- 5 tooltip steps highlighting core UI elements (see Flow 1, Step 5)
- Each tooltip has a "Next" button and a "Skip Tour" link
- Tour is non-blocking: user can interact with the UI at any step
- Tour progress is saved -- if the user leaves and returns, the tour resumes where they left off
- Tour can be re-triggered from Help > Restart Guided Tour

**Layer 3: Feature Discovery (5-30 minutes)**
- Contextual tooltips appear the first time a user encounters a feature:
  - First time viewing the dashboard: "This is your agent performance overview. Click any agent card for details."
  - First time a loop alert fires: "Loop detected! Click Inspect to investigate."
  - First time visiting the leaderboard: "Agents need 20+ completed tasks to appear on the leaderboard."
- These tooltips are dismissible and marked as "seen" per user

**Layer 4: Advanced Features (discovered over days/weeks)**
- Keyboard shortcut hints appear subtly next to actions for the first week:
  - "Tip: Press Cmd+K to search anything" (shown 3 times, then hidden)
  - "Tip: Press F to fit all agents in view"
- Achievement system naturally guides users to discover features:
  - "Pioneer" badge for first agent → encourages SDK setup
  - "Team Player" badge for handoffs → encourages multi-agent setups
  - "Loop Catcher" badge for responding to alerts → encourages alert monitoring

### 9.2 Sample Data Mode

When a workspace has no connected agents, Sample Data Mode provides a fully functional preview of the product:

**Simulated Agents (5):**
1. ResearchAgent (Level 8, Specialist) -- cycles through thinking and executing states
2. CoderAgent (Level 12, Expert) -- generates code, calls tools
3. ReviewAgent (Level 6, Practitioner) -- reviews and sends messages
4. ManagerAgent (Level 15, Senior) -- orchestrates and assigns tasks
5. AnalystAgent (Level 3, Junior) -- processes data, occasionally errors

**Simulated Behavior:**
- Agents cycle through realistic states on a loop (30-second cycle)
- Task handoffs animate between agents every 10 seconds
- XP earned animations appear every 15 seconds
- One agent errors every 60 seconds (triggers alert flow preview)
- Cost accumulates at a realistic rate ($0.01/second)
- Session replay is available for a pre-recorded 5-minute demo session

**Visual Distinction:**
- Persistent banner: "Sample Data Mode -- Connect your agents to see real activity"
- Agent avatars have a subtle "demo" watermark overlay
- All metric values have a small "(sample)" label
- The "Connect Agents" button is prominently displayed in the banner

**Exit Criteria:**
- When the first real agent event is received, Sample Data Mode automatically deactivates
- Simulated agents fade out; real agents fade in
- Toast: "Real agent detected! Sample data has been replaced."
- Banner updates: "Your workspace is live!"

### 9.3 Tooltips Design

**Tooltip Types:**

1. **Hover tooltips** (standard): Appear on hover after 200ms delay. Contain 1-3 lines of text. Positioned above or beside the trigger element. Dismiss on mouse leave.

2. **Onboarding tooltips** (guided tour): Appear automatically in sequence. Have a dark background with white text and a pointing arrow to the target element. Contain title, description, and "Next" / "Skip" buttons. The target element is highlighted with a spotlight overlay (rest of the page dimmed).

3. **Feature discovery tooltips** (contextual): Appear once on first encounter. Yellow/gold background to distinguish from standard tooltips. Contain a brief tip and a "Got it" dismiss button. Once dismissed, never appear again for that user.

4. **Keyboard shortcut hints** (transient): Small, subtle labels that appear next to action buttons during the first week. Show the keyboard shortcut equivalent: "Cmd+K" next to the search bar. Fade after 3 seconds, stop appearing after shown 3 times.

### 9.4 Guided Tour Steps (Detail)

| Step | Target Element | Title | Description |
|---|---|---|---|
| 1 | Agent avatar on canvas | Meet Your Agents | Each circle represents an AI agent in your workspace. The colored ring shows its current state: green for working, blue for thinking, red for errors. |
| 2 | Agent name + level label | Agents Level Up | Agents earn XP for completing tasks efficiently. Watch them grow from Intern to Legend as they work. |
| 3 | Detail panel (if open) or sidebar | Deep Dive Anytime | Click any agent to see its performance: tokens used, cost, tasks completed, and more. |
| 4 | Activity feed area | Live Activity | Every agent action appears here in plain English. Errors are highlighted in red so you never miss an issue. |
| 5 | Search bar / Cmd+K hint | Find Anything Fast | Press Cmd+K to search for agents, tasks, sessions, or run commands. This is your fastest navigation tool. |

---

## 10. Navigation Model

### 10.1 Primary Navigation (Sidebar)

The sidebar is the primary navigation element, present on every page:

**Collapsed state (56px, default on desktop 1024-1439px):**
- Icon-only, with tooltip on hover showing the page name
- Active page has a highlighted background (accent color, 8px border-radius)
- Notification badge (number) on the Alerts icon when alerts are active

**Expanded state (240px, default on desktop >= 1440px):**
- Icon + text label for each navigation item
- Active page has highlighted background + bold text
- Workspace name and plan badge at the top
- Collapsible sections are not used -- the nav is flat (7 items total)

**Navigation Items (in order):**

| Icon | Label | URL | Description |
|---|---|---|---|
| Globe/World | World | `/` | Virtual world canvas (main view) |
| Grid | Dashboard | `/dashboard` | Agent performance overview |
| Film | Sessions | `/sessions` | Session list and replays |
| Trophy | Leaderboard | `/leaderboard` | Agent rankings |
| Dollar | Costs | `/costs` | Cost analysis |
| Bell | Alerts | `/alerts` | Alerts and SLOs |
| --- separator --- | | | |
| Gear | Settings | `/settings` | Workspace configuration |
| Avatar | Profile | `/profile` | User account |

### 10.2 Secondary Navigation

**Page-level tabs:** Used on pages with multiple sub-views. Tabs are rendered as a horizontal bar below the page header. The active tab has an underline indicator.

Pages with tabs:
- Dashboard > Agent Detail: Overview | Tasks | Traces | Cost | Achievements
- Alerts: Active | Rules | SLOs | History
- Settings: General | Members | API Keys | Gamification | Alerts | Integrations | Billing

**Table column sorting:** Column headers are clickable to sort. Active sort column shows an arrow icon (ascending/descending). Clicking the same column toggles sort direction.

### 10.3 Breadcrumbs

Breadcrumbs appear below the header on all pages except the Canvas (which is the root view):

```
Home / Dashboard / ResearchAgent / Tasks
```

- Each segment is a clickable link
- "Home" always links to `/` (Canvas)
- The last segment is the current page (not clickable, bold text)
- Breadcrumbs are generated from the URL path, with entity names resolved from the data layer (e.g., agent ID in URL is displayed as agent name in breadcrumb)

### 10.4 Quick Search (Cmd+K)

The command palette is the power-user's primary navigation tool. It provides:

**Entity search:** Type an agent name, task title, or session ID to find it instantly.

**Page navigation:** Type a page name ("leaderboard", "settings", "costs") to navigate.

**Action execution:** Prefix with ">" to access actions:
- `> create task` -- Opens task creation form
- `> export costs` -- Exports cost report for current period
- `> toggle professional mode` -- Switches display mode
- `> kill [agent name]` -- Opens kill confirmation for the named agent
- `> zoom fit` -- Fits all agents in canvas viewport
- `> wall mode` -- Activates wall display mode

**Result ranking:** Results are ranked by:
1. Exact name match (highest)
2. Recent interactions (user's last 5 accessed entities)
3. Fuzzy match score
4. Entity type relevance (agents > tasks > sessions > pages)

### 10.5 Header Bar

The header bar is fixed at the top of every page:

```
[OAV Logo] [Workspace Dropdown v] ............... [Search Cmd+K] [?] [Bell (3)] [User Avatar v]
```

- **Logo:** Clicking navigates to `/` (Canvas)
- **Workspace Dropdown:** Shows current workspace name and plan badge. Dropdown lists all workspaces + "Create New Workspace"
- **Search:** Clicking activates the Cmd+K command palette
- **Help (?):** Dropdown with: Documentation, Keyboard Shortcuts, Restart Tour, API Reference, Discord Community, What's New
- **Bell:** Opens notification panel. Badge shows unread count. If 0 unread, no badge.
- **User Avatar:** Dropdown with: Profile, Preferences, Switch Workspace, Sign Out

### 10.6 Contextual Navigation

In addition to the global navigation model, the product uses contextual navigation to minimize clicks:

- **Canvas -> Agent detail:** Click agent avatar on canvas
- **Agent detail -> Dashboard:** "View Full Dashboard" link in the detail panel
- **Agent detail -> Trace:** "View Latest Trace" link in the detail panel
- **Alert banner -> Error detail:** "Inspect" button on the alert banner
- **Activity feed -> Agent:** Click any agent name in the feed to select it on canvas
- **Leaderboard -> Agent dashboard:** Click any agent name in the leaderboard
- **Cost table -> Agent cost detail:** Click any agent name in the cost breakdown

These cross-links mean users rarely need to use the sidebar for in-session navigation. The sidebar is for mode switching (Canvas -> Dashboard -> Costs); contextual links handle drill-down.

---

## Appendix A: Design Decision Log

| Decision | Rationale | Alternative Considered |
|---|---|---|
| Icon sidebar (collapsed by default) | Maximizes canvas area; Linear-style minimalism | Full text sidebar (too wide for canvas-first product) |
| Right-side detail panel | Canvas interaction continues; user's eye naturally flows left-to-right from agent to detail | Modal overlay (blocks canvas), bottom panel (too short for detailed metrics) |
| No mobile canvas | Pixi.js WebGL canvas requires precise mouse interaction; touch-based pan/zoom degrades UX below usability threshold | Simplified touch canvas (rejected: too much engineering effort for marginal value) |
| Cmd+K as primary power-user nav | Proven by Linear, Slack, Raycast, VS Code; fastest possible navigation for keyboard-first users | Hierarchical menu system (rejected: too many clicks) |
| Sample Data Mode for empty workspaces | Removes the "blank canvas" problem that kills first-session retention in dashboard products | Tutorial video (rejected: passive, not interactive), documentation link (rejected: sends user out of the app) |
| Professional Mode as toggle, not separate product | Same codebase, same data model, reduced maintenance cost; enterprise users can still optionally enable gamification | Separate enterprise SKU (rejected: fractures the product) |
| Tooltip-based onboarding (not wizard) | Non-blocking; user can interact at any step; proven by Notion, Linear, Figma onboarding patterns | Step-by-step wizard (rejected: blocks user from exploring) |
| Alert banners on canvas (not just notification panel) | Critical alerts must be visible during lean-back monitoring; a wall display user will not check a notification panel | Desktop push notifications only (rejected: not visible on shared displays) |
| Agents as list items in accessibility tree | Canvas is inherently visual; screen reader users need a structured representation of agent data | Completely separate text-based view (rejected: maintenance burden, risks feature parity) |
| Dark theme default | Matches developer tool conventions (VS Code, GitHub, Linear dark mode); reduces eye strain for monitoring use case; enables vivid status colors | Light theme default (rejected: status colors less vivid, less dev-tool feel) |

---

## Appendix B: Handoff to UI Designer

The UI Designer (Stage 2.2) should use this specification to produce:

1. **Design tokens:** Color palette, typography scale, spacing system, border radius, shadow system -- based on the dark theme described here with semantic colors for agent states.
2. **Component library:** Button variants, input fields, dropdowns, tables, cards, tooltips, toasts, modals, panels, tabs, badges -- all using the design tokens.
3. **High-fidelity mockups:** For each wireframe in Section 4, produce pixel-perfect mockups in the chosen design tool.
4. **Agent avatar designs:** Visual designs for agent avatars at each level tier (Intern through Legend), including status ring colors, badge overlays, and level indicators.
5. **Animation specifications:** Timing curves, durations, and keyframes for all transitions described in this document (panel slide-in, agent state changes, XP floating text, celebration particles).
6. **Professional Mode variants:** For every gamified screen, a Professional Mode equivalent showing the same data without gamification language or celebration animations.
7. **Dark and light theme definitions:** While dark is the default, a light theme should be defined for users who prefer it.

---

*Document produced by UX Designer Agent -- Stage 2.1*
*Date: March 16, 2026*
*Status: Complete -- Ready for Gate B handoff to UI Designer and Frontend Expert*
