# OpenAgentVisualizer -- Visualization Specification

**Stage:** 2.2 -- Visualization Expert
**Date:** March 16, 2026
**Status:** Complete
**Author:** Visualization Expert Agent
**Depends On:** PRD (Stage 1.1), Gamification System Design (Stage 1.2), Agent Integration Architecture (Stage 1.3)
**Feeds Into:** Frontend Expert (2.2a), Backend Expert (2.2b), Code Reviewer (2.3), QA Engineer (2.4)

---

## Table of Contents

1. [Visualization Philosophy](#1-visualization-philosophy)
2. [Virtual World Design](#2-virtual-world-design)
3. [Agent Avatar Design](#3-agent-avatar-design)
4. [Data Visualization Patterns](#4-data-visualization-patterns)
5. [Dashboard Chart Specifications](#5-dashboard-chart-specifications)
6. [Topology Visualization](#6-topology-visualization)
7. [Color System for Data](#7-color-system-for-data)
8. [Real-Time Animation Specs](#8-real-time-animation-specs)
9. [Minimap and Navigation](#9-minimap-and-navigation)
10. [Scalability Visualization](#10-scalability-visualization)

---

## 1. Visualization Philosophy

### 1.1 Core Premise: Agents Are Living Entities

Every visualization decision in OpenAgentVisualizer begins from a single premise: AI agents are not boxes in a flowchart. They are persistent entities with identity, history, behavior, and personality. The visualization layer must make the user feel they are observing a living workspace -- not reading a dashboard.

This means:

- **Agents breathe.** Even idle agents have a subtle animation loop -- a gentle pulse, a slow blink, a slight sway. A static screen is a dead screen.
- **Actions have physics.** Messages between agents travel through space as particles. Task assignments drop onto agents with a gentle bounce. Errors produce visible shockwaves.
- **State is visible at a glance.** An experienced user should be able to assess the health of 20 agents in under 3 seconds by scanning colors, motion patterns, and spatial arrangement -- without reading a single number.
- **Data is spatial, not tabular.** The default view is the virtual world. Charts and tables exist one click away, but the primary interface encodes data through position, color, size, motion, and proximity.

### 1.2 Design Principles

**Principle 1: Information Density Through Visual Encoding**
Every visual property of an agent avatar encodes real data. Color encodes health state. Size encodes recent activity level. Position encodes functional zone. Animation speed encodes workload intensity. Glow color encodes level tier. Badge encodes rank. No visual property is decorative; all are informative.

**Principle 2: Progressive Disclosure Through Zoom**
At zoom level 1x (furthest out), the user sees the entire world as a miniature map -- agents are colored dots, zones are labeled regions. At 3x, agents become recognizable avatars with name labels and status rings. At 5x, sparkline metrics appear beside each agent. At 10x (maximum), the user sees a single agent with full detail panel, animation subtleties, and real-time metric streams. Information reveals itself as the user moves closer, never overwhelming at any distance.

**Principle 3: Ambient Awareness, Not Alert Fatigue**
The world view provides passive, ambient awareness of system health. A glance tells the user "things are working" (sunny, agents moving, green tones) or "something is wrong" (storm clouds, red flashes, shaking agents). Explicit alerts (banners, sounds) are reserved for critical events only: loop detection, cost threshold breach, agent termination. The background environment communicates system state continuously without demanding attention.

**Principle 4: Dual-Mode Rendering**
Per the Gamification System Design, every visual element has two rendering modes:
- **Gamified Mode** (default for Free/Team tiers): Animated avatars, particle effects, XP pop-ups, celebration animations, weather effects, day/night cycle.
- **Professional Mode** (default for Business/Enterprise tiers): Clean geometric icons, muted color palette, no particle effects, data labels instead of XP pop-ups, neutral lighting. Same spatial layout, same data encoding, different aesthetic.

Both modes share the same rendering pipeline. The mode toggle swaps asset sets and animation intensity parameters, not the underlying layout or data binding.

**Principle 5: Performance is a Feature**
A visualization that stutters at 30 agents is useless. The rendering pipeline must sustain 60fps with 50 agents at full fidelity, 30fps with 200 agents at reduced fidelity, and remain interactive with 500+ agents using aggressive LOD. Frame drops are bugs, not tradeoffs.

### 1.3 Technology Stack Alignment

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| World canvas | PixiJS 8 (WebGL2) via `@pixi/react` | 60fps with 1000+ sprites; mature; React integration |
| Agent state machines | XState v5 actors | Formal state guarantees; inspect API feeds renderer directly |
| Agent animations | Rive (`.riv` state machines) | Interactive state-driven animations; tiny runtime (~50KB); designer-friendly |
| Dashboard transitions | GSAP 3 | Precise timeline control; morphSVG; ScrollTrigger |
| Simple charts | Recharts | React-native; declarative; sufficient for sparklines, bars, areas |
| Complex charts | Apache ECharts | Treemaps, violin plots, candlestick, heatmaps; WebGL mode for large datasets |
| Topology graphs | React Flow (< 200 nodes) / Cytoscape.js (200+ nodes) | React Flow for standard pipeline views; Cytoscape for large mesh topology |
| Particle effects | PixiJS particle container | Native WebGL particles; batched rendering; GPU-accelerated |
| UI chrome | React 18 + Tailwind CSS | Standard React DOM layer overlaying the canvas |

---

## 2. Virtual World Design

### 2.1 World Layout: The Agent Office

The virtual world uses an **isometric office metaphor** -- a top-down, slightly angled (30-degree isometric) view of a stylized workspace. The office is divided into functional zones that map to agent roles and pipeline stages. This metaphor was chosen because:

1. Office layouts are universally understood -- no learning curve for spatial semantics.
2. Zones naturally encode agent function (research agents in the library, coding agents at desks).
3. The metaphor supports visual storytelling (agents walking between rooms = handoffs).

#### Zone Map

```
+------------------------------------------------------------------+
|                                                                  |
|   +------------------+    +------------------+                   |
|   |                  |    |                  |                   |
|   |   LOBBY          |    |   MEETING ROOMS  |                   |
|   |   (Registration) |    |   (Collaboration)|                   |
|   |   New agents     |    |   Multi-agent    |                   |
|   |   appear here    |    |   conversations  |                   |
|   +------------------+    +------------------+                   |
|                                                                  |
|   +------------------+    +------------------+    +----------+   |
|   |                  |    |                  |    |          |   |
|   |   LIBRARY        |    |   OPEN FLOOR     |    | REVIEW   |   |
|   |   (Research)     |    |   (Execution)    |    | ROOM     |   |
|   |   Research agents|    |   Coding, gen,   |    | (QA)     |   |
|   |   RAG, retrieval |    |   tool-use agents|    | Code     |   |
|   |   memory access  |    |   Active work    |    | review   |   |
|   +------------------+    +------------------+    +----------+   |
|                                                                  |
|   +------------------+    +------------------+    +----------+   |
|   |                  |    |                  |    |          |   |
|   |   BREAK ROOM     |    |   MANAGER OFFICE |    | SERVER   |   |
|   |   (Idle/Complete)|    |   (Orchestration)|    | ROOM     |   |
|   |   Idle agents    |    |   Manager/planner|    | (Infra)  |   |
|   |   rest here      |    |   agents         |    | System   |   |
|   |                  |    |   Dashboards     |    | health   |   |
|   +------------------+    +------------------+    +----------+   |
|                                                                  |
|   +------------------------------------------------------+       |
|   |                                                      |       |
|   |   ARCHIVE / TROPHY ROOM                              |       |
|   |   Completed sessions, achievement wall, leaderboard  |       |
|   |                                                      |       |
|   +------------------------------------------------------+       |
|                                                                  |
+------------------------------------------------------------------+
```

#### Zone Definitions

| Zone | Purpose | Agents Found Here | Visual Theme |
|------|---------|-------------------|--------------|
| **Lobby** | Registration and onboarding | Newly registered agents; agents in `initializing` state | Welcome desk, entry doors, arrival animation |
| **Library** | Research and retrieval | Agents with role=researcher, agents executing `memory.accessed` or `web_search` tools | Bookshelves, reading lamps, floating documents |
| **Open Floor** | Active task execution | Agents in `executing` or `thinking` states performing code generation, content generation, tool calls | Desks with monitors, keyboards, active work surfaces |
| **Meeting Rooms** | Multi-agent collaboration | Agents in `communicating` state; agents involved in active handoff chains | Round tables, whiteboards, speech bubbles |
| **Review Room** | Quality assurance | Agents performing code review, validation, or testing tasks | Inspection stations, magnifying glass motifs, checkmark/X overlays |
| **Manager Office** | Orchestration and planning | Manager/planner role agents; agents with `pipeline orchestration` task type | Big desk, wall of dashboards, hierarchical chart |
| **Break Room** | Idle and completed agents | Agents in `idle` or `complete` states | Couches, coffee machine, relaxed posture |
| **Server Room** | System infrastructure | System health indicators, background process visualization | Rack servers, blinking LEDs, cable trays |
| **Archive / Trophy Room** | Historical data and achievements | Completed sessions, achievement wall, all-time leaderboard | Trophy cases, framed certificates, timeline wall |

#### Zone Assignment Logic

Agents are assigned to zones based on their current state and role. When an agent transitions state, it animates (walks) from its current zone to the new zone over 0.8-1.2 seconds using eased interpolation.

```
function getZone(agent):
    if agent.state == "initializing":
        return LOBBY
    if agent.state == "idle":
        return BREAK_ROOM
    if agent.state == "complete":
        return BREAK_ROOM
    if agent.state == "terminated":
        return null  // fade out in place
    if agent.state == "communicating":
        return MEETING_ROOMS
    if agent.state == "waiting":
        return MEETING_ROOMS  // waiting near collaborators
    if agent.state == "error" or agent.state == "recovering":
        return current_zone  // stay in place, visual overlay changes
    if agent.role == "researcher" and agent.state == "thinking":
        return LIBRARY
    if agent.role == "manager" or agent.role == "planner":
        return MANAGER_OFFICE
    if agent.role == "reviewer" or agent.role == "qa":
        return REVIEW_ROOM
    // Default for thinking/executing agents
    return OPEN_FLOOR
```

### 2.2 Grid System and Spatial Organization

#### World Dimensions

The world canvas is a logical space of **4000 x 3000 pixels** at 1x zoom. This provides sufficient room for all zones with comfortable spacing.

| Property | Value |
|----------|-------|
| Logical world width | 4000px |
| Logical world height | 3000px |
| Grid cell size | 64px x 64px |
| Grid columns | 62 |
| Grid rows | 46 |
| Agent avatar footprint | 48px x 48px (at 1x zoom) |
| Minimum spacing between agents | 16px (1 grid cell gap) |
| Zone padding | 32px internal |
| Zone border width | 2px |
| Zone label font size | 14px (scales with zoom) |

#### Spatial Positioning Algorithm

Within each zone, agents are positioned using a **force-directed micro-layout** that prevents overlap while keeping agents loosely clustered:

1. Each zone has a center point and a bounding rectangle.
2. When an agent enters a zone, it is assigned a position near the center.
3. A spring-force simulation runs per-zone to spread agents apart (minimum 16px gap) while keeping them within zone bounds.
4. The simulation runs for a maximum of 50 iterations or until positions converge (delta < 1px).
5. Agents already in the zone are treated as fixed points; only the entering agent moves.
6. When a zone is full (agent count exceeds zone capacity), the zone boundary expands by 20% and all agents re-layout.

#### Zone Capacities

| Zone | Base Capacity | Expansion Limit |
|------|--------------|-----------------|
| Lobby | 10 | 20 |
| Library | 15 | 40 |
| Open Floor | 30 | 80 |
| Meeting Rooms | 12 | 30 |
| Review Room | 8 | 20 |
| Manager Office | 6 | 15 |
| Break Room | 20 | 50 |
| Server Room | N/A (no agents) | N/A |
| Archive | N/A (display only) | N/A |

### 2.3 Camera System

#### Controls

| Control | Input | Behavior |
|---------|-------|----------|
| Pan | Mouse drag (middle button or right button) | Moves viewport; momentum-based with friction (decelerates over 300ms) |
| Pan | Arrow keys | 100px per keypress at current zoom level; hold for continuous pan |
| Pan | Two-finger trackpad drag | Native trackpad panning |
| Zoom in | Scroll wheel up / Pinch out / `+` key | Zoom toward cursor position (focal zoom) |
| Zoom out | Scroll wheel down / Pinch in / `-` key | Zoom away from cursor position |
| Reset view | `Home` key or "Fit All" button | Animate to fit all agents in viewport (0.5s ease-out) |
| Focus agent | Double-click agent / search result click | Animate to center agent at 5x zoom (0.4s ease-out) |

#### Zoom Levels

| Zoom Level | Scale | Visible Detail | Performance Target |
|------------|-------|----------------|-------------------|
| **1x** (min) | Entire world fits in viewport | Agents are 12px colored dots with zone labels. No names, no metrics. | 60fps / 500 agents |
| **2x** | Half the world visible | Agents are 24px circles with color ring. Zone names visible. | 60fps / 300 agents |
| **3x** | Quarter of world visible | Agent avatars recognizable (48px). Name labels appear. Status ring with state color. Level badge number. | 60fps / 150 agents |
| **5x** | Single zone fills viewport | Full agent detail: avatar + name + status ring + level badge + current task label. Sparkline metrics appear below avatar (token burn, cost). Activity bubbles visible. | 60fps / 50 agents |
| **7x** | Partial zone | Agent avatar at 168px. Full animation detail (facial expressions, tool icons, thought bubbles). Connection lines to other agents visible with message particles. XP bar visible. | 60fps / 20 agents |
| **10x** (max) | Single agent fills center | Highest fidelity: full avatar animation, real-time metric panel integrated beside avatar, token-by-token cost counter, current task detail, mini-timeline of recent events. | 60fps / 5 agents |

Zoom transitions use `ease-in-out-cubic` interpolation over 200ms. Zoom snaps to the nearest 0.5x increment when the user releases the scroll wheel (with 100ms debounce).

#### Viewport Culling

Only agents within the current viewport (plus a 200px margin for smooth scrolling) are rendered at full fidelity. Agents outside the viewport are:
- Removed from the PixiJS display list entirely (not just hidden).
- Their XState actors continue running and receiving events.
- When they re-enter the viewport, they are re-added with their current state applied instantly (no animation replay).

### 2.4 Day/Night Cycle

The world environment shifts between day and night based on aggregate agent activity levels, creating an ambient awareness cue for overall system load.

#### Cycle Rules

```
activity_ratio = active_agents / total_agents
// active = thinking + executing + communicating (not idle, not waiting, not error)

if activity_ratio >= 0.7:
    time_of_day = "midday"        // Bright, warm lighting
elif activity_ratio >= 0.4:
    time_of_day = "afternoon"     // Slightly dimmer, golden hour
elif activity_ratio >= 0.2:
    time_of_day = "dusk"          // Cool lighting, longer shadows
elif activity_ratio >= 0.05:
    time_of_day = "night"         // Dark, desk lamps on, monitors glowing
else:
    time_of_day = "deep_night"    // Very dark, minimal ambient light, sleeping office
```

#### Visual Properties Per Time

| Time | Background Color | Ambient Light | Agent Glow Intensity | Window Color | Shadow Length |
|------|-----------------|---------------|---------------------|--------------|-------------|
| Midday | `#1a1f2e` | 100% | 100% | `#87CEEB` (sky blue) | Short (10px) |
| Afternoon | `#161b28` | 80% | 90% | `#FFD700` (golden) | Medium (20px) |
| Dusk | `#121722` | 60% | 75% | `#FF8C00` (sunset) | Long (30px) |
| Night | `#0d111c` | 40% | 60%, lamps on | `#191970` (midnight) | None; pool lights |
| Deep Night | `#080c15` | 20% | 40%, monitors only | `#000033` | None |

Transitions between times animate over 3 seconds using linear interpolation of all color values.

### 2.5 Weather Effects

Weather effects are tied to system health metrics, providing an instant ambient signal of overall system status.

#### Weather Rules

```
error_rate = errors_last_5min / total_events_last_5min
avg_latency_ratio = avg_latency / target_latency  // >1 means over target

if error_rate < 0.01 and avg_latency_ratio < 1.0:
    weather = "sunny"
elif error_rate < 0.05 and avg_latency_ratio < 1.5:
    weather = "partly_cloudy"
elif error_rate < 0.10 or avg_latency_ratio < 2.0:
    weather = "overcast"
elif error_rate < 0.20 or avg_latency_ratio < 3.0:
    weather = "rain"
else:
    weather = "storm"
```

#### Weather Visual Effects

| Weather | Background Effect | Particle System | Sound (Optional) | Meaning |
|---------|------------------|----------------|-----------------|---------|
| **Sunny** | Clear background; soft radial gradient from center | Occasional floating light motes (warm gold, 0.2 opacity) | None | All systems healthy |
| **Partly Cloudy** | 2-3 semi-transparent cloud sprites drifting slowly across top | None | None | Minor issues detected |
| **Overcast** | Full cloud layer across top 15% of viewport; dimmed ambient light by 10% | None | None | Elevated error rate or latency |
| **Rain** | Cloud layer + rain particle system: vertical blue-grey streaks (200 particles, 0.3 opacity, 2px wide, fall speed 300px/s) | Rain particles in a PixiJS ParticleContainer | Soft rain ambient (muted by default) | Significant errors or latency |
| **Storm** | Dark cloud layer + rain + lightning flashes (white screen flash, 50ms, every 5-10s random) | Rain particles (500 count, higher opacity 0.5) + lightning bolt sprites | Thunder rumble (muted by default) | Critical system health |

Weather transitions animate over 5 seconds. Clouds fade in/out; rain particles spawn/despawn gradually.

#### Performance Budget: Weather

| Effect | Max Particles | GPU Cost | CPU Cost |
|--------|--------------|----------|----------|
| Light motes (sunny) | 30 | Negligible | Negligible |
| Rain (normal) | 200 | ~0.5ms/frame | ~0.3ms/frame |
| Rain (storm) | 500 | ~1.2ms/frame | ~0.7ms/frame |
| Lightning flash | 0 particles (screen overlay) | ~0.1ms | ~0.05ms |
| Clouds | 5 sprites max | ~0.1ms | Negligible |

Weather effects are disabled when `navigator.hardwareConcurrency < 4` or when the user enables "Reduced Motion" in accessibility settings.

---

## 3. Agent Avatar Design

### 3.1 Avatar Anatomy

Each agent avatar is a composite sprite assembled from layered components rendered in PixiJS. The layering order (back to front) is:

```
Layer 0: Shadow (ellipse, 0.2 opacity, below avatar)
Layer 1: Status Ring (colored circle/ring around avatar body)
Layer 2: Body (the core avatar shape -- a rounded character silhouette)
Layer 3: Face (expressive eyes and mouth -- simple, icon-style)
Layer 4: Activity Bubble (thought bubble, speech bubble, tool icon -- above head)
Layer 5: Level Badge (small circular badge, bottom-right of avatar)
Layer 6: XP Bar (thin bar below avatar, shows progress to next level)
Layer 7: Name Label (text, centered below XP bar)
Layer 8: Metric Sparklines (visible at zoom >= 5x, below name label)
Layer 9: Floating Notifications (+XP, alerts -- pop up and fade)
```

#### Avatar Dimensions

| Component | Size at 1x | Size at 5x | Size at 10x |
|-----------|-----------|-----------|------------|
| Full avatar (bounding box) | 48x48px | 120x120px | 240x240px |
| Body | 32x32px | 80x80px | 160x160px |
| Face area | 16x16px | 40x40px | 80x80px |
| Status ring | 40x40px (ring) | 100x100px | 200x200px |
| Level badge | 12x12px | 30x30px | 60x60px |
| Activity bubble | 20x20px | 50x50px | 100x100px |
| Name label | 10px font | 14px font | 18px font |
| XP bar | 36x3px | 90x6px | 180x8px |

### 3.2 Agent States: Visual Representation

The agent lifecycle state machine defines 10 states. Each state has a distinct visual treatment applied to the avatar.

#### State 1: Idle

- **Status ring color:** `#6B7280` (grey-400)
- **Body animation:** Gentle breathing -- body scales between 1.0 and 1.02 over 3 seconds, ease-in-out sine loop
- **Face:** Neutral expression, eyes open, occasional slow blink (every 5-8 seconds, random)
- **Activity bubble:** None
- **Additional effects:** Subtle shadow pulse synced with breathing
- **Rive state:** `idle_breathing`

#### State 2: Initializing

- **Status ring color:** `#60A5FA` (blue-400) with clockwise rotation animation (1 revolution per 2 seconds)
- **Body animation:** Stretching/waking up -- body scales from 0.95 to 1.0 over 0.5 seconds, then settles
- **Face:** Eyes widening, alert expression
- **Activity bubble:** Loading spinner icon (three dots cycling)
- **Additional effects:** Expanding glow ring from center (single pulse, 0.8 seconds)
- **Rive state:** `initializing`

#### State 3: Thinking

- **Status ring color:** `#818CF8` (indigo-400) with pulsing glow (opacity 0.6 to 1.0, 1.5s cycle)
- **Body animation:** Slight head tilt, body still, chin-touch pose
- **Face:** Eyebrows raised, eyes looking upward, contemplative expression
- **Activity bubble:** Thought bubble with animated ellipsis (...) cycling
- **Additional effects:** 3-5 small particles orbiting the avatar (blue-violet, 0.4 opacity, 2-second orbit)
- **Rive state:** `thinking_loop`

#### State 4: Executing

- **Status ring color:** `#34D399` (emerald-400) with steady glow
- **Body animation:** Active working motion -- hands moving (typing metaphor), body slightly leaning forward
- **Face:** Focused expression, eyes forward, slight smile
- **Activity bubble:** Tool icon (wrench for generic tool, code brackets `</>` for code generation, magnifying glass for search, pencil for content generation)
- **Additional effects:** Small sparks emitting from hands (2-3 per second, gold, fade over 0.5s)
- **Rive state:** `executing_<tool_category>` (one per tool category)

#### State 5: Communicating

- **Status ring color:** `#60A5FA` (blue-400) steady
- **Body animation:** Speaking pose -- slight body bounce, gesticulating
- **Face:** Mouth open/close animation cycling (3 frames, 0.3s per frame)
- **Activity bubble:** Speech bubble with message type icon (envelope for direct message, handshake for handoff, broadcast icon for broadcast)
- **Additional effects:** Message particles fly from this agent to the target agent (see Section 4.2 for particle spec)
- **Rive state:** `communicating`

#### State 6: Waiting

- **Status ring color:** `#FBBF24` (amber-400) with dashed ring (animated dash rotation)
- **Body animation:** Arms crossed, slight foot tap (body shift left-right, 2px, 1s cycle)
- **Face:** Slightly bored/patient expression, eyes looking sideways
- **Activity bubble:** Hourglass icon with sand animation (rotating every 3s)
- **Additional effects:** Glow dimmed to 60% of normal intensity
- **Rive state:** `waiting_idle`

#### State 7: Error

- **Status ring color:** `#EF4444` (red-500) with rapid pulse (0.3s on, 0.3s dim, repeating)
- **Body animation:** Shake animation -- horizontal oscillation, 4px amplitude, 100ms per cycle, 5 cycles then pause 1s, repeat
- **Face:** Distressed expression, X-eyes or wide alarmed eyes
- **Activity bubble:** Warning triangle icon (`!`) with red background
- **Additional effects:** Red shockwave ring expanding outward (once on error onset, 48px to 96px, 0.5s, fade to 0)
- **Rive state:** `error_alarm`

#### State 8: Recovering

- **Status ring color:** `#F59E0B` (amber-500) with upward-sweeping fill animation (like a progress bar going clockwise)
- **Body animation:** Determined pose, slightly hunched forward, retry motion
- **Face:** Concentrated expression, gritted teeth, eyes narrowed
- **Activity bubble:** Circular retry arrow icon, spinning
- **Additional effects:** Healing particle effect -- green sparkles rising from base (5 per second, upward drift, fade over 1s)
- **Rive state:** `recovering`

#### State 9: Complete

- **Status ring color:** `#22C55E` (green-500) solid, bright glow
- **Body animation:** Victory pose -- arms raised, brief jump (4px vertical, 0.3s), settle into relaxed stance
- **Face:** Big smile, eyes curved happy
- **Activity bubble:** Checkmark icon with starburst
- **Additional effects:** Confetti particle burst (20 particles, multi-color, 1s duration, gravity-affected fall). XP counter floats upward: "+{amount} XP" in gold text, rises 40px and fades over 1.5s.
- **Rive state:** `complete_celebration` (plays once, then transitions to `idle_breathing`)

#### State 10: Terminated

- **Status ring color:** `#374151` (grey-700), no glow
- **Body animation:** Fade to 30% opacity over 1 second. Slight downward drift (5px over 1s).
- **Face:** Eyes closed, neutral/sleeping
- **Activity bubble:** None
- **Additional effects:** Ghost trail effect -- 3 afterimages at 10%, 20%, 30% opacity trailing the fade direction. After fade completes, avatar remains as a 15% opacity ghost for 10 seconds, then is removed from the display.
- **Rive state:** `terminated_fadeout` (plays once)

#### State 11: Leveling Up (Transient)

This is not a state machine state but a transient visual event triggered when an agent crosses a level threshold.

- **Duration:** 3 seconds
- **Body animation:** Avatar grows to 1.3x scale, golden glow expands, body spins 360 degrees (1 revolution)
- **Particle effect:** 40-particle starburst in the agent's tier color (bronze/silver/gold/platinum/diamond). Particles radiate outward in a circle, decelerate, and fade over 2 seconds.
- **Level badge:** Old level number counts up to new level number (animated digit roll). Badge color transitions if tier changed.
- **Sound cue:** Level-up chime (optional, respects mute)
- **Banner:** Workspace-wide notification banner: "[Agent Name] leveled up to Level [N]: [Title]!" -- displays for 5 seconds
- **Rive state:** `level_up` (plays once, then returns to current state animation)

#### State 12: Overloaded (Derived)

Derived visual state applied when an agent's token usage exceeds 80% of its context window. Not a state machine state -- it is a visual modifier layered on top of the current state.

- **Status ring modifier:** Add an inner orange ring (2px) inside the normal status ring
- **Body animation modifier:** Current animation speed increased by 50% (agent appears to work frenetically)
- **Activity bubble modifier:** Add a small flame icon to the corner of the activity bubble
- **Additional effects:** Heat haze shimmer effect around avatar (sine wave distortion, 1px amplitude, applied to avatar container)

#### State 13: Sleeping (Derived)

Derived visual state for agents that have been idle for more than 5 minutes.

- **Status ring modifier:** Ring fades to 20% opacity
- **Body animation:** Breathing animation slowed to 6-second cycle (half normal speed). Body rotates -5 degrees (leaning/slumped).
- **Face modifier:** Eyes fully closed, "Zzz" text floats above in a slow sine wave
- **Activity bubble:** Small "Zzz" speech bubble
- **Additional effects:** Ambient glow reduced to 30%

### 3.3 Avatar Customization

Agents can be customized by the user to make them visually distinct and personally meaningful.

#### Customization Options

| Category | Options | Storage |
|----------|---------|---------|
| **Base Color** | 12 preset colors + hex color picker | `agent.display.color` |
| **Shape** | Circle (default), Rounded Square, Hexagon, Diamond, Star | `agent.display.shape` |
| **Hat/Accessory** | None, Hard Hat, Crown, Wizard Hat, Headphones, Antennae, Halo, Chef Hat, Detective Hat, Viking Helmet | `agent.display.accessory` |
| **Border Style** | Solid, Dashed, Dotted, Double, Glow | `agent.display.border_style` |
| **Name Color** | Match agent color (default), custom hex | `agent.display.name_color` |
| **Theme** | Default, Pixel Art, Minimalist, Neon, Corporate | `agent.display.theme` |
| **Custom Icon** | Upload a 64x64 PNG/SVG to replace the default face | `agent.display.custom_icon_url` |

#### Preset Color Palette

| Name | Hex | Use Case |
|------|-----|----------|
| Ocean | `#3B82F6` | Default for research agents |
| Emerald | `#10B981` | Default for execution agents |
| Violet | `#8B5CF6` | Default for planning agents |
| Rose | `#F43F5E` | Default for review agents |
| Amber | `#F59E0B` | Default for manager agents |
| Cyan | `#06B6D4` | Default for communication agents |
| Lime | `#84CC16` | Default for tool-use agents |
| Fuchsia | `#D946EF` | Default for creative agents |
| Slate | `#64748B` | Neutral / unassigned |
| Orange | `#F97316` | High-priority agents |
| Teal | `#14B8A6` | Monitoring agents |
| Indigo | `#6366F1` | Custom / user preference |

### 3.4 Size and Scale Encoding

Agent avatar size is modulated by activity level to create a visual hierarchy where more active/important agents are more prominent.

```
base_size = 48px  // at 1x zoom

activity_score = (
    0.4 * (tasks_last_hour / max_tasks_last_hour_any_agent) +
    0.3 * (tokens_last_hour / max_tokens_last_hour_any_agent) +
    0.2 * (messages_last_hour / max_messages_last_hour_any_agent) +
    0.1 * (level / 50)
)

scale_factor = 0.8 + (0.4 * activity_score)  // range: 0.8 to 1.2

rendered_size = base_size * scale_factor * zoom_level
```

This means the most active agent is 50% larger than the least active agent, creating a natural visual hierarchy without explicit labels.

---

## 4. Data Visualization Patterns

### 4.1 Real-Time Metrics Sparklines

Sparklines appear below each agent avatar at zoom level 5x and above. They show 60-second trailing windows of key metrics.

#### Sparkline Specifications

| Metric | Chart Type | Width | Height | Color | Update Interval |
|--------|-----------|-------|--------|-------|----------------|
| Token burn rate | Area sparkline (filled) | 80px | 20px | `#818CF8` (indigo, fill 0.3 opacity) | 2 seconds |
| Cost accumulation | Line sparkline | 80px | 20px | `#F59E0B` (amber) | 5 seconds |
| Latency | Line sparkline | 80px | 20px | `#60A5FA` (blue) | 2 seconds |

#### Sparkline Rendering Rules

- Data points: 30 points per sparkline (one per 2 seconds for 60-second window).
- Line width: 1.5px.
- No axes, no labels, no gridlines -- pure shape encoding.
- Tooltip on hover shows the exact value at the cursor position.
- Sparklines use PixiJS Graphics (not DOM) for performance when rendered on the canvas.
- At zoom < 5x, sparklines are hidden (not rendered, not just invisible).
- New data points animate in from the right; old points scroll left and drop off.
- If a metric value exceeds a warning threshold, the sparkline line turns `#EF4444` (red) for that segment.

### 4.2 Agent-to-Agent Communication Lines

When agents communicate (send messages, perform handoffs), animated particle lines connect them visually.

#### Connection Line Specification

| Property | Value |
|----------|-------|
| Line style | Dashed line, 2px wide, dash pattern 8px on / 4px off |
| Line color | `#60A5FA` (blue-400) at 0.5 opacity |
| Line path | Bezier curve with one control point offset perpendicular to the midpoint (creates an arc) |
| Arc height | 30px above the straight-line midpoint |

#### Particle Flow Specification

When a message is actively being sent, particles flow along the connection line from sender to receiver.

| Property | Value |
|----------|-------|
| Particle count | 5 particles per active message |
| Particle shape | Circle, 3px radius |
| Particle color | `#818CF8` (indigo) for messages, `#F59E0B` (amber) for handoffs, `#EF4444` (red) for error reports |
| Particle speed | 200px/second along the bezier path |
| Particle spacing | Evenly distributed along the path |
| Trail effect | Each particle leaves a fading trail (3 afterimages at 80%, 50%, 20% opacity) |
| Particle glow | 1px blur, same color at 0.6 opacity |
| Duration | Particles flow for the duration of the message event (typically 0.5-2 seconds) |
| Completion effect | When the last particle reaches the receiver, a small absorption pulse (expanding ring, 12px, 0.3s fade) appears on the receiver avatar |

#### Connection Persistence

- **Active connections** (message currently in flight): Full opacity line + flowing particles.
- **Recent connections** (message completed within last 10 seconds): Line at 0.3 opacity, no particles.
- **Historical connections** (user toggled "show all connections"): Line at 0.15 opacity, dotted.
- **No connection history**: No line rendered.

### 4.3 Task Progress Indicators

Tasks assigned to agents display progress indicators on or near the agent avatar.

#### Circular Progress Ring

Displayed as a second ring outside the status ring when an agent has an active task with a known duration or step count.

| Property | Value |
|----------|-------|
| Ring radius | Status ring radius + 6px |
| Ring width | 3px |
| Background color | `#374151` (grey-700) at 0.3 opacity |
| Fill color | `#22C55E` (green) for normal progress, `#F59E0B` (amber) if overdue, `#EF4444` (red) if far overdue |
| Fill animation | Smooth clockwise fill, interpolated per frame |
| Completion effect | Flash green, brief scale to 1.1x, settle back |
| Overdue threshold | Fill turns amber when elapsed time exceeds 1.5x expected duration |
| Critical threshold | Fill turns red when elapsed time exceeds 3x expected duration |

#### Task Status Bar (Zoom 7x+)

At high zoom, a horizontal progress bar appears below the sparklines.

| Property | Value |
|----------|-------|
| Width | 100px |
| Height | 6px |
| Corner radius | 3px |
| Background | `#1F2937` |
| Fill | Gradient from left (current state color) to right (next state color) |
| Label | Task name in 10px font above the bar |

### 4.4 Error Visualization

Errors demand immediate visual attention. The error visualization system uses multiple channels to ensure errors are noticed regardless of zoom level.

#### Per-Agent Error Effects

| Effect | Description | Duration |
|--------|-------------|----------|
| Red pulse | Status ring flashes between `#EF4444` (red) and `#991B1B` (dark red) at 3Hz | Until error is acknowledged or state changes |
| Shake | Avatar shakes horizontally: 4px amplitude, 100ms per oscillation, 5 oscillations | 0.5 seconds, repeats every 3 seconds while in error state |
| Warning icon | Orange/red triangle with `!` appears as activity bubble | Persistent while in error state |
| Shockwave | Red ring expands from avatar center (48px to 120px, 0.5s, fade to 0) | Plays once on error onset |
| Red particle burst | 10 red particles emit outward from avatar center, gravity-affected fall | Plays once on error onset, 1.5s duration |

#### Zone-Level Error Indicators

When more than 30% of agents in a zone are in error state:
- Zone border color changes to `#EF4444` (red), pulsing.
- Zone background tint shifts to `rgba(239, 68, 68, 0.05)`.
- Zone label gains a red dot indicator.

#### World-Level Error Indicators

When total error rate exceeds 10%:
- Weather shifts to "storm" (see Section 2.5).
- Top-of-screen alert banner appears with error count and "View Errors" button.
- Minimap highlights error agents as red dots regardless of zoom.

### 4.5 Cost Burn Rate Visualization

Cost is visualized using a flame intensity metaphor -- the more an agent is spending, the more intense its "burn" visual.

#### Flame Intensity Levels

```
burn_rate = cost_last_60s / 60  // dollars per second

if burn_rate == 0:
    flame_level = "none"
elif burn_rate < 0.001:       // < $0.06/min
    flame_level = "ember"
elif burn_rate < 0.005:       // < $0.30/min
    flame_level = "low"
elif burn_rate < 0.02:        // < $1.20/min
    flame_level = "medium"
elif burn_rate < 0.10:        // < $6.00/min
    flame_level = "high"
else:
    flame_level = "inferno"   // >= $6.00/min (extremely expensive operations)
```

#### Flame Visual Treatment

| Level | Visual | Particle Count | Color |
|-------|--------|---------------|-------|
| None | No flame indicator | 0 | N/A |
| Ember | Tiny orange dot above avatar, slow pulse | 0 | `#FB923C` |
| Low | Small flame sprite (8px), gentle flicker | 2 embers rising | `#F97316` |
| Medium | Medium flame sprite (16px), active flicker | 5 embers rising | `#EA580C` |
| High | Large flame sprite (24px), rapid flicker, heat shimmer | 10 embers + smoke wisps | `#DC2626` |
| Inferno | Full flame engulfing avatar top (32px), intense flicker, strong heat distortion | 20 embers + dense smoke | `#991B1B` with `#FCD34D` core |

Flame sprites are rendered using animated PixiJS sprites (4-frame flame animation loop, 100ms per frame). Ember particles rise upward with slight horizontal drift, fade over 0.8 seconds.

### 4.6 Token Usage as Energy Bar

Each agent has a token "energy bar" that shows context window consumption as a percentage.

#### Energy Bar Specification

| Property | Value |
|----------|-------|
| Position | Directly below the agent avatar, above the XP bar |
| Width | Same as avatar width |
| Height | 4px (at 1x zoom) |
| Background | `#1F2937` |
| Fill (0-50%) | `#22C55E` (green) -- plenty of context remaining |
| Fill (50-75%) | `#F59E0B` (amber) -- context window getting full |
| Fill (75-90%) | `#F97316` (orange) -- approaching limit |
| Fill (90-100%) | `#EF4444` (red) pulsing -- critical |
| Label | Percentage text appears on hover (e.g., "67% context used") |
| Visibility | Zoom >= 3x |

When the energy bar reaches 90%, the agent's status ring gains an additional inner red dash animation to draw attention to the context window constraint.

---

## 5. Dashboard Chart Specifications

Dashboard charts appear in the right-side panel when viewing agent details, team summaries, or the dedicated analytics view. All charts support light and dark themes.

### 5.1 Token Usage Over Time -- Area Chart

**Library:** Recharts (simple, React-native)

| Property | Value |
|----------|-------|
| Chart type | Stacked area chart |
| X axis | Time (5-minute intervals for last hour, hourly for last 24h, daily for last 30d) |
| Y axis | Token count |
| Areas | Input tokens (`#818CF8`, indigo), Output tokens (`#34D399`, emerald), Cache tokens (`#60A5FA`, blue) |
| Fill opacity | 0.3 |
| Stroke width | 2px |
| Tooltip | Shows exact counts and cost for the hovered interval |
| Annotations | Red vertical line at cost alert timestamps |
| Interaction | Click interval to drill into that time window |
| Responsive | Width fills panel; height 200px minimum, 300px maximum |
| Animation | Smooth transition on data update (300ms ease-out) |

### 5.2 Cost Breakdown by Agent -- Treemap

**Library:** Apache ECharts (treemap support, drill-down)

| Property | Value |
|----------|-------|
| Chart type | Treemap |
| Data hierarchy | Level 1: Agent groups/teams; Level 2: Individual agents |
| Size encoding | Total cost in USD |
| Color encoding | Cost efficiency (cost per successful task) -- green = efficient, red = expensive |
| Color scale | `#22C55E` (best efficiency) through `#F59E0B` to `#EF4444` (worst efficiency) |
| Labels | Agent name + dollar amount (e.g., "ResearchBot\n$4.20") |
| Interaction | Click to drill into agent's cost breakdown by task; right-click to zoom out |
| Tooltip | Agent name, total cost, tasks completed, cost per task, token count |
| Responsive | Width fills panel; height 300px |
| Animation | Morph transition on data update (500ms) |

### 5.3 Task Completion Rate -- Bar Chart with Targets

**Library:** Recharts

| Property | Value |
|----------|-------|
| Chart type | Grouped bar chart |
| X axis | Agent name (sorted by completion rate descending) |
| Y axis | Percentage (0-100%) |
| Bars | Success rate (`#22C55E`), Partial success rate (`#F59E0B`), Failure rate (`#EF4444`) |
| Target line | Horizontal reference line at the team target (default 90%), dashed, `#6B7280` |
| Bar width | 20px per bar, 4px gap between bars in a group |
| Tooltip | Agent name, success/partial/failure counts, total tasks |
| Interaction | Click bar to filter to that agent's task list |
| Responsive | Width fills panel; height 250px; horizontal scroll if > 15 agents |
| Animation | Bars grow from 0 on initial render (400ms staggered by 50ms per bar) |

### 5.4 Quality Score Distribution -- Violin Plot

**Library:** Apache ECharts (custom series)

| Property | Value |
|----------|-------|
| Chart type | Violin plot (kernel density estimation) |
| X axis | Agent name |
| Y axis | Quality score (0.0 to 1.0) |
| Violin fill | Gradient: `#818CF8` (indigo, 0.3 opacity) |
| Violin stroke | `#6366F1` (indigo, 1px) |
| Median marker | White dot, 4px |
| Quartile range | Thick bar (4px wide) showing Q1-Q3 |
| Outlier markers | Red dots for scores below 0.5 |
| Tooltip | Min, Q1, Median, Q3, Max, Mean, StdDev |
| KDE bandwidth | 0.05 (tunable) |
| Responsive | Width fills panel; height 300px |

### 5.5 Agent Activity Heatmap -- Calendar View

**Library:** Apache ECharts (calendar heatmap)

| Property | Value |
|----------|-------|
| Chart type | Calendar heatmap (GitHub contribution graph style) |
| X axis | Weeks |
| Y axis | Days of week (Mon-Sun) |
| Cell size | 12px x 12px, 2px gap |
| Color scale | 5 levels: `#1F2937` (no activity), `#065F46` (low), `#059669` (medium), `#10B981` (high), `#34D399` (very high) |
| Value encoding | Total tasks completed per day |
| Tooltip | Date, task count, total cost, total tokens, success rate |
| Time range | Last 90 days (default), selectable: 30d, 90d, 180d, 365d |
| Responsive | Width fills panel; height auto (based on weeks displayed) |
| Interaction | Click day cell to filter all charts to that day |

### 5.6 Response Time Percentiles -- Candlestick Chart

**Library:** Apache ECharts (candlestick series)

| Property | Value |
|----------|-------|
| Chart type | Candlestick (OHLC adapted for percentiles) |
| X axis | Time intervals (15-minute buckets) |
| Y axis | Response time (milliseconds) |
| Candle body | P25 to P75 range |
| Candle wick (lower) | P5 (or min) |
| Candle wick (upper) | P95 (or max) |
| Median line | Horizontal line inside body at P50 |
| Color (below target) | `#22C55E` (green body, green wick) |
| Color (above target) | `#EF4444` (red body, red wick) |
| Target line | Horizontal reference at SLA target (e.g., 2000ms), dashed grey |
| Tooltip | P5, P25, P50, P75, P95, count, mean |
| Responsive | Width fills panel; height 250px |

### 5.7 Error Rate by Agent -- Bubble Chart

**Library:** Apache ECharts (scatter series with size encoding)

| Property | Value |
|----------|-------|
| Chart type | Bubble scatter plot |
| X axis | Total tasks attempted |
| Y axis | Error rate (percentage) |
| Bubble size | Total cost (larger = more expensive) |
| Bubble color | Agent base color (from customization palette) |
| Bubble border | 2px white border for readability |
| Tooltip | Agent name, error rate, task count, cost, error types breakdown |
| Reference line | Horizontal line at acceptable error rate threshold (default 5%), dashed red |
| Quadrant labels | Top-right = "Expensive & Error-Prone" (red tint), Bottom-left = "Efficient & Reliable" (green tint) |
| Responsive | Width fills panel; height 300px |
| Animation | Bubbles appear with scale-up animation (200ms, ease-out) |

### 5.8 Library Selection Rules

| Condition | Library | Rationale |
|-----------|---------|-----------|
| Chart type is line, area, bar, pie | Recharts | React-native, simple API, sufficient for standard charts |
| Chart type is treemap, heatmap, candlestick, violin, radar, sankey | Apache ECharts | Advanced chart types, WebGL rendering mode, drill-down support |
| Chart has > 10,000 data points | Apache ECharts (WebGL mode) | Canvas/WebGL rendering handles large datasets without DOM explosion |
| Chart is a sparkline on the canvas | PixiJS Graphics | Must render within the WebGL canvas, not in DOM |
| Chart is a topology/graph | React Flow or Cytoscape.js | See Section 6 |

---

## 6. Topology Visualization

### 6.1 Agent Communication Graph

The topology view shows agents as nodes and their communication relationships as edges, providing a graph-based perspective of the agent network.

#### Technology Selection

| Agent Count | Library | Rationale |
|------------|---------|-----------|
| 1-200 | React Flow | React-native, accessible, built-in controls, minimap plugin, familiar to frontend devs |
| 200-2000 | Cytoscape.js | Canvas-based, handles large graphs efficiently, advanced layout algorithms |
| 2000+ | Sigma.js (future) | WebGL graph rendering, handles 10K+ nodes (V2 scope) |

#### Node Design (React Flow)

| Property | Value |
|----------|-------|
| Node shape | Rounded rectangle (120px x 80px) |
| Node content | Avatar icon (32x32), agent name (12px, bold), current state label (10px), level badge |
| Node border | 2px, color matches agent state (same colors as status ring) |
| Node background | `#1F2937` (dark) / `#F9FAFB` (light mode) |
| Node shadow | 4px blur, 0 offset, `rgba(0,0,0,0.3)` |
| Selected node | Border increases to 3px, glow effect (8px blur in state color) |
| Error node | Red pulsing border, warning icon overlay |

#### Edge Design (React Flow)

| Property | Value |
|----------|-------|
| Edge type | Bezier curve (default), Straight (user toggle), Step (for hierarchical layouts) |
| Edge width | 1.5px base; scales to 3px based on message volume (more messages = thicker) |
| Edge color | `#4B5563` (grey-600) default; `#60A5FA` (blue) when active message in flight |
| Edge label | Message count badge (small circle with number, appears at edge midpoint) |
| Animated edge | Dashed line animation (flow direction from sender to receiver) when message active |
| Arrow | Arrowhead at target end, 8px size |

#### Layout Algorithms

| Layout | When Used | Configuration |
|--------|----------|---------------|
| **Force-directed** (default) | General view, organic arrangement | `d3-force` with charge=-300, link distance=200, collision radius=60 |
| **Hierarchical** | Manager-subordinate relationships | Top-to-bottom, 150px vertical spacing, left-right ordering by activity |
| **Circular** | Peer-to-peer equal agents | Radius = 200 + (agent_count * 20), sorted by activity clockwise |
| **Grid** | Large agent counts (50+) | Auto-sized grid, 160px cell spacing |

Users can switch layouts via a dropdown. Manual dragging pins a node in place (breaking it out of automatic layout). A "Reset Layout" button re-runs the algorithm.

### 6.2 Handoff Chain Visualization

Handoff chains are sequential agent-to-agent task transfers that form the backbone of multi-agent pipelines.

#### Chain Rendering

- Handoff chains are rendered as a highlighted subgraph within the topology view.
- The chain path is drawn as a thick line (4px) in `#F59E0B` (amber) with animated flow particles (same spec as Section 4.2 but amber-colored).
- Each node in the chain shows a step number badge (1, 2, 3...) in the top-left corner.
- The chain start node has a "play" triangle icon overlay; the chain end node has a "flag" icon.
- Chain duration is displayed along the path (e.g., "3.2s" between nodes).
- Token and cost accumulation is shown at each hop (e.g., "+1,200 tokens, +$0.09").

#### Chain Timeline View

Below the graph, a horizontal timeline bar shows the handoff chain as a Gantt-like visualization:

| Property | Value |
|----------|-------|
| Bar height | 24px per agent |
| Bar color | Agent's base color |
| Bar width | Proportional to time spent at that agent |
| Gap between bars | 2px (represents transfer latency) |
| Labels | Agent name inside bar, duration above |
| Hover | Shows full details: tokens, cost, task name, status |
| Timeline axis | Milliseconds from chain start |

### 6.3 Loop Detection Highlighting

Loop detection is the highest-priority visualization feature (based on the $47,000 incident case study in the PRD).

#### Visual Treatment of Detected Loops

When the backend detects a loop (via Tarjan's Strongly Connected Components algorithm or repetition-count threshold):

1. **Red cycle highlight:** The edges forming the loop are redrawn in `#EF4444` (red), 4px width, with rapid animated dash flow (twice the speed of normal message flow).

2. **Node pulse:** All nodes in the loop cycle gain a synchronized red pulse animation (0.5s on, 0.5s dim).

3. **Loop badge:** A red circular badge with the iteration count appears at the center of the loop cycle (e.g., "Loop: 7x").

4. **Cost counter:** A red floating counter shows the cumulative cost of the loop iterations (e.g., "$12.40 wasted"), updating in real-time.

5. **Alert banner:** Top-of-screen banner: "Loop detected: [Agent A] -> [Agent B] -> [Agent A] — {N} iterations, ${cost} spent. [Kill Loop] [Ignore]"

6. **Minimap highlight:** The loop area is highlighted with a red circle on the minimap regardless of current viewport position.

7. **Sound cue:** Urgent warning tone (if audio is enabled). Distinct from other notification sounds.

#### Loop Visualization States

| Loop State | Visual |
|-----------|--------|
| Suspected (3-4 iterations) | Yellow dashed cycle line, amber badges |
| Confirmed (5+ iterations, default threshold) | Red solid cycle line, red badges, alert banner |
| Critical (10+ iterations or >$50 cost) | Red cycle with shockwave pulses, full-screen red border flash (once), kill recommendation prominent |
| Killed | Loop edges turn grey, nodes show "terminated" state, cost counter freezes with "STOPPED" label |

### 6.4 Force-Directed Layout with Manual Pinning

The default topology layout uses D3-force simulation with manual override capability.

#### Force Parameters

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-300))
    .force("link", d3.forceLink(edges).distance(200).strength(0.5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(60))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .alphaDecay(0.02)
    .velocityDecay(0.3);
```

#### Pinning Behavior

- When a user drags a node and releases it, the node becomes "pinned" (fixed position).
- Pinned nodes display a small pin icon in the top-right corner.
- Pinned nodes are excluded from the force simulation (their position is fixed).
- Double-clicking a pinned node unpins it, allowing the simulation to reposition it.
- A "Clear All Pins" button resets all node positions and re-runs the simulation.
- Pinned positions persist in local storage per workspace.

---

## 7. Color System for Data

### 7.1 Semantic Color Palette

All data visualization colors are drawn from a controlled semantic palette that ensures consistency across every chart, avatar, badge, and indicator.

#### Primary Semantic Colors

| Semantic | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| **Success** | `#16A34A` | `#22C55E` | Task completion, healthy metrics, positive trends |
| **Warning** | `#D97706` | `#F59E0B` | Elevated latency, approaching thresholds, caution |
| **Error** | `#DC2626` | `#EF4444` | Failures, loops, critical alerts, cost overruns |
| **Info** | `#2563EB` | `#3B82F6` | Active work, communication, general information |
| **Neutral** | `#4B5563` | `#6B7280` | Idle states, disabled elements, backgrounds |
| **Accent** | `#7C3AED` | `#8B5CF6` | Thinking state, XP/gamification, special events |

#### Extended Data Palette (for multi-series charts)

When displaying 2-8 data series on the same chart, use these colors in order:

| Series | Dark Mode | Light Mode |
|--------|-----------|-----------|
| 1 | `#818CF8` (indigo) | `#6366F1` |
| 2 | `#34D399` (emerald) | `#10B981` |
| 3 | `#FBBF24` (amber) | `#D97706` |
| 4 | `#F472B6` (pink) | `#EC4899` |
| 5 | `#60A5FA` (blue) | `#3B82F6` |
| 6 | `#A78BFA` (violet) | `#8B5CF6` |
| 7 | `#FB923C` (orange) | `#EA580C` |
| 8 | `#2DD4BF` (teal) | `#14B8A6` |

For more than 8 series, repeat the palette with reduced opacity (0.7) for the second set.

### 7.2 Agent Type Color Coding

Each agent role is assigned a default color for visual consistency across views.

| Agent Role | Color | Hex (Dark Mode) | Rationale |
|-----------|-------|-----------------|-----------|
| Researcher | Ocean Blue | `#3B82F6` | Knowledge/discovery association |
| Coder | Emerald Green | `#10B981` | Code/terminal association |
| Reviewer | Rose Red | `#F43F5E` | Critical inspection association |
| Manager | Amber | `#F59E0B` | Authority/coordination association |
| Planner | Violet | `#8B5CF6` | Strategy/thinking association |
| Writer | Fuchsia | `#D946EF` | Creativity association |
| Tool User | Lime | `#84CC16` | Utility/tooling association |
| Communicator | Cyan | `#06B6D4` | Connection/networking association |
| Custom | Slate | `#64748B` | Neutral default for unrecognized roles |

### 7.3 Status Color Mapping

| Agent State | Ring Color | Glow Color | Background Tint |
|------------|-----------|-----------|----------------|
| Idle | `#6B7280` | None | None |
| Initializing | `#60A5FA` | `#60A5FA` at 0.2 | `rgba(96,165,250,0.05)` |
| Thinking | `#818CF8` | `#818CF8` at 0.3 | `rgba(129,140,248,0.05)` |
| Executing | `#34D399` | `#34D399` at 0.3 | `rgba(52,211,153,0.05)` |
| Communicating | `#60A5FA` | `#60A5FA` at 0.2 | `rgba(96,165,250,0.05)` |
| Waiting | `#FBBF24` | `#FBBF24` at 0.2 | `rgba(251,191,36,0.05)` |
| Error | `#EF4444` | `#EF4444` at 0.4 | `rgba(239,68,68,0.08)` |
| Recovering | `#F59E0B` | `#F59E0B` at 0.3 | `rgba(245,158,11,0.05)` |
| Complete | `#22C55E` | `#22C55E` at 0.3 | `rgba(34,197,94,0.05)` |
| Terminated | `#374151` | None | `rgba(55,65,81,0.05)` |

### 7.4 Accessibility-Safe Color Combinations

All color pairs used for foreground/background or adjacent chart elements meet WCAG 2.1 AA contrast requirements (minimum 4.5:1 for text, 3:1 for UI components).

#### Validated Combinations (Dark Mode -- background `#0F1117`)

| Foreground | Hex | Contrast Ratio | Pass? |
|-----------|-----|---------------|-------|
| Success text | `#22C55E` | 7.8:1 | AA + AAA |
| Warning text | `#F59E0B` | 8.2:1 | AA + AAA |
| Error text | `#EF4444` | 5.5:1 | AA |
| Info text | `#3B82F6` | 4.9:1 | AA |
| Neutral text | `#9CA3AF` | 5.6:1 | AA |
| Accent text | `#A78BFA` | 5.2:1 | AA |
| Primary text | `#F9FAFB` | 17.4:1 | AA + AAA |
| Secondary text | `#D1D5DB` | 12.1:1 | AA + AAA |

#### Color-Blind Safe Alternatives

For users with color vision deficiency (deuteranopia, protanopia, tritanopia), the system provides an accessible mode activated via settings:

| Standard Color | Deuteranopia Alternative | Additional Cue |
|---------------|------------------------|----------------|
| Green (success) | Blue (`#3B82F6`) | Checkmark icon |
| Red (error) | Orange (`#F97316`) + pattern fill | X icon + striped pattern |
| Amber (warning) | Purple (`#8B5CF6`) | Triangle icon |
| Blue (info) | Cyan (`#06B6D4`) | Circle icon |

In accessible mode, every color-encoded element gains a secondary encoding (icon, pattern, or shape) to ensure information is never conveyed by color alone.

### 7.5 Dark Mode and Light Mode Palettes

#### Dark Mode (Default)

| Element | Color |
|---------|-------|
| World background | `#0F1117` |
| Zone background | `#1A1F2E` |
| Zone border | `#2D3348` |
| Panel background | `#111827` |
| Panel border | `#1F2937` |
| Card background | `#1F2937` |
| Primary text | `#F9FAFB` |
| Secondary text | `#9CA3AF` |
| Muted text | `#6B7280` |
| Divider | `#374151` |

#### Light Mode

| Element | Color |
|---------|-------|
| World background | `#F3F4F6` |
| Zone background | `#FFFFFF` |
| Zone border | `#E5E7EB` |
| Panel background | `#FFFFFF` |
| Panel border | `#E5E7EB` |
| Card background | `#F9FAFB` |
| Primary text | `#111827` |
| Secondary text | `#4B5563` |
| Muted text | `#9CA3AF` |
| Divider | `#E5E7EB` |

Light mode reduces particle effect opacity by 30% and disables glow effects to maintain readability on bright backgrounds.

---

## 8. Real-Time Animation Specs

### 8.1 Frame Rate Targets

| Component | Target FPS | Minimum Acceptable | Measurement |
|-----------|-----------|-------------------|-------------|
| World canvas (PixiJS) | 60 fps | 45 fps | `requestAnimationFrame` delta tracking |
| Agent avatar animations (Rive) | 60 fps | 45 fps | Rive runtime performance metrics |
| Particle effects | 60 fps | 30 fps | PixiJS particle container stats |
| Dashboard charts (Recharts/ECharts) | 30 fps (during transitions) | 15 fps | ECharts `renderTime` callback |
| Topology graph (React Flow) | 30 fps (during layout simulation) | 20 fps | React Flow performance monitor |
| UI chrome (React DOM) | 60 fps | 30 fps | React DevTools profiler |

If the world canvas drops below 45fps for more than 2 consecutive seconds, the LOD system automatically activates (see Section 10).

### 8.2 Particle Effects for Data Flow

Particle effects are the primary visual tool for showing data movement between agents.

#### Message Particle System

| Property | Value |
|----------|-------|
| Container | PixiJS ParticleContainer (batch rendering, GPU-accelerated) |
| Max active particles (world total) | 500 |
| Particle texture | 4x4px circle, pre-rendered to sprite sheet |
| Particle lifetime | 0.5-2.0 seconds (based on distance between agents) |
| Particle speed | 200-400px/s (based on message size: larger messages = slower, more particles) |
| Particle trail | 3 afterimage copies at 80%, 50%, 20% opacity, each 4px behind |
| Spawn rate | 5 particles per active message per second |
| Color | Matches message type (blue=message, amber=handoff, red=error, green=completion) |
| Blend mode | Additive (particles brighten where they overlap) |
| Collision | None (particles pass through everything) |
| Path | Follow the bezier curve of the connection line (see Section 4.2) |

#### XP Reward Particles

| Property | Value |
|----------|-------|
| Trigger | Task completion event |
| Count | 8-15 particles per event |
| Shape | Small stars (4-pointed, 6px) |
| Color | Gold (`#FCD34D`) with white (`#FFFFFF`) core |
| Behavior | Burst radially from avatar center, decelerate, float upward with slight drift, fade over 1.5 seconds |
| Text | "+{XP} XP" in 14px bold gold text, floats upward 60px over 2 seconds, fades out |
| Blend mode | Additive |

#### Celebration Particles (Level Up / Achievement)

| Property | Value |
|----------|-------|
| Trigger | Level-up or achievement unlock |
| Count | 40 particles |
| Shape | Mixed: stars, circles, diamonds (randomly selected per particle) |
| Colors | Tier colors: Bronze (`#CD7F32`), Silver (`#C0C0C0`), Gold (`#FFD700`), Platinum (`#E5E4E2`), Diamond (`#B9F2FF`) |
| Behavior | Burst upward in a fountain pattern, gravity-affected (fall back down after 1s), bounce once at avatar Y position, fade on second descent |
| Duration | 3 seconds total |
| Sound | Level-up chime (mutable) |

### 8.3 Smooth Interpolation for Metric Changes

When metric values update (token count, cost, task count), the displayed value interpolates smoothly to the new value rather than jumping.

#### Interpolation Rules

| Metric Type | Interpolation | Duration | Easing |
|-------------|--------------|----------|--------|
| Counter (tokens, tasks) | Linear count-up from old to new value | 500ms | `ease-out` |
| Percentage (progress, rates) | Smooth bar fill | 300ms | `ease-in-out` |
| Currency (cost) | Digit-by-digit roll (like an odometer) | 400ms | `ease-out` |
| Chart data point | Position interpolation on Y axis | 300ms | `ease-out-cubic` |
| Position (agent movement) | Bezier path interpolation | 800-1200ms | `ease-in-out-cubic` |

#### Rules for Preventing Visual Jank

1. **Batch updates:** Metric updates from WebSocket events are batched per animation frame (16.67ms). Multiple updates to the same metric within one frame are coalesced; only the final value is animated to.
2. **Debounce rapid changes:** If a metric updates more than 10 times per second, display the latest value without individual animations (snap to latest).
3. **Skip interpolation for large jumps:** If a counter jumps by more than 10x its current value (e.g., token count goes from 100 to 50,000), snap immediately with a brief flash highlight instead of counting up.

### 8.4 Transition Animations for State Changes

When an agent changes state (e.g., Idle to Thinking), the avatar animation transitions smoothly.

#### State Transition Sequence

1. **Exit animation** (200ms): Current state animation plays its exit sequence (defined in Rive). For Idle, this is the avatar "standing up straight." For Error, the shake stops.
2. **Cross-fade** (150ms): Old animation blends to 0% opacity while new animation blends to 100% opacity.
3. **Entry animation** (200ms): New state animation plays its entry sequence. For Thinking, the thought bubble appears. For Executing, the tool icon materializes.
4. **Status ring transition** (300ms): Ring color cross-fades from old state color to new state color.
5. **Zone movement** (800-1200ms): If the state change triggers a zone reassignment, the agent walks from the old zone to the new zone. Movement follows a bezier path (not a straight line) to avoid crossing through zone walls.

Total transition time: 350ms (in-place) to 1550ms (with zone movement).

### 8.5 Performance Budget Per Visual Element

Every visual element has a strict per-frame CPU and GPU budget. The total budget is 16.67ms per frame (for 60fps).

| Element | CPU Budget | GPU Budget | Max Instances |
|---------|-----------|-----------|---------------|
| Agent avatar (full fidelity) | 0.1ms | 0.2ms | 50 |
| Agent avatar (LOD 1 -- simplified) | 0.02ms | 0.05ms | 200 |
| Agent avatar (LOD 2 -- dot) | 0.005ms | 0.01ms | 2000 |
| Particle (single) | 0.002ms | 0.005ms | 500 |
| Connection line (static) | 0.01ms | 0.02ms | 100 |
| Connection line (animated) | 0.03ms | 0.05ms | 30 |
| Sparkline (per agent) | 0.05ms | 0.1ms | 20 |
| Weather particles | 0.001ms each | 0.003ms each | 500 |
| Zone background | 0.02ms | 0.05ms | 9 |
| Minimap | 0.5ms | 0.3ms | 1 |

**Total budget at 50 agents (full fidelity):**
- CPU: 50 * 0.1 + 200 * 0.002 + 20 * 0.05 + 0.5 = ~7.4ms (within 16.67ms)
- GPU: 50 * 0.2 + 200 * 0.005 + 20 * 0.1 + 0.3 = ~13.3ms (within 16.67ms)

This leaves headroom for DOM rendering, React reconciliation, and JavaScript event processing.

---

## 9. Minimap and Navigation

### 9.1 Minimap Design

The minimap is a small, always-visible overview of the entire virtual world, rendered in the bottom-right corner of the viewport.

#### Minimap Specifications

| Property | Value |
|----------|-------|
| Position | Bottom-right corner, 16px margin from edges |
| Size | 200px x 150px (maintains world aspect ratio 4:3) |
| Background | `#0F1117` at 0.9 opacity (semi-transparent) |
| Border | 1px `#374151`, rounded corners 4px |
| Agent representation | Colored dots (3px radius), color matches agent state |
| Zone boundaries | 1px lines in `#2D3348` |
| Viewport indicator | White rectangle outline showing the current viewport area, 1px stroke |
| Interaction | Click anywhere on minimap to jump viewport to that location |
| Drag | Drag the viewport rectangle to pan the main view |
| Toggle | `M` key or minimap icon button to show/hide |
| Z-index | Above all canvas content, below modal dialogs |

#### Minimap Rendering

The minimap is rendered as a separate PixiJS `RenderTexture` that is updated every 500ms (not every frame) for performance. Agent positions are read from the world state and scaled down proportionally.

```
minimap_scale = minimap_width / world_width  // 200 / 4000 = 0.05
agent_minimap_x = agent.world_x * minimap_scale
agent_minimap_y = agent.world_y * minimap_scale
```

#### Error Agents on Minimap

Agents in error state are rendered as larger dots (5px radius) with a red pulsing animation on the minimap, ensuring they are visible regardless of the current viewport position. This is critical for the loop detection use case -- a user zoomed in on one area must see errors elsewhere.

### 9.2 Fog of War for Collapsed Regions

When the world contains more zones than can be comfortably displayed (future feature: custom zones, multi-floor offices), collapsed regions are shown with a "fog of war" effect.

#### Fog Specification

| Property | Value |
|----------|-------|
| Fog color | `#0F1117` at 0.7 opacity |
| Fog edge | 20px gradient from opaque to transparent (soft edge) |
| Fog pattern | Subtle noise texture (Perlin noise, 0.02 opacity) for visual depth |
| Collapsed zone label | Zone name + agent count badge visible through fog (e.g., "Library (8 agents)") |
| Expand interaction | Click collapsed zone to expand/zoom into it |
| Minimap treatment | Fogged zones appear as grey areas on the minimap; agent dots still visible through fog |

### 9.3 Quick-Jump to Agent Locations

Users can jump to any agent instantly using the search bar or agent list.

#### Search Bar (`/` or `Cmd+K`)

| Feature | Behavior |
|---------|----------|
| Trigger | Press `/` or `Cmd+K` to open search |
| Input | Type agent name, role, or state |
| Autocomplete | Fuzzy match against all agent names and roles; results update as user types |
| Result list | Shows agent name, role, current state, zone, level |
| Selection | Click or Enter jumps to selected agent: viewport animates to center on agent at 5x zoom over 0.4s |
| State filter | Type `state:error` to find all error agents; `state:thinking` for thinking agents |
| Keyboard | Arrow keys navigate results; Escape closes search |

#### Agent List Sidebar

The left sidebar contains a scrollable list of all agents, grouped by zone or role (user-togglable).

| Feature | Behavior |
|---------|----------|
| Agent row | Avatar mini-icon (16px), name, state dot (colored circle, 8px), level badge |
| Click | Viewport animates to center on clicked agent at 5x zoom |
| Double-click | Opens agent detail panel |
| Sort options | By name, by state, by level, by cost, by activity |
| Filter options | By zone, by role, by state, by level range |
| Error highlight | Agents in error/critical state are pinned to top of list with red background tint |

### 9.4 Bookmarked Views

Users can save named viewport positions for quick access.

#### Bookmark Specification

| Property | Value |
|----------|-------|
| Storage | Local storage per workspace, synced to server for persistence |
| Data per bookmark | Name (string), viewport X, viewport Y, zoom level, timestamp, optional filter state |
| Max bookmarks | 20 per workspace |
| Create | Click "Bookmark" icon in toolbar, enter name, saves current view |
| Access | Dropdown menu in toolbar shows all bookmarks; click to animate to that view |
| Keyboard | `1-9` keys jump to bookmarks 1-9 (configurable) |
| Default bookmarks | "Overview" (fit all, 1x), "Errors" (fit all error agents), "Active" (fit all executing/thinking agents) |

---

## 10. Scalability Visualization

### 10.1 Agent Count Scaling Strategy

The visualization must remain usable from 1 agent to 500+ agents. The strategy is a combination of Level-of-Detail (LOD), clustering, semantic zoom, and progressive loading.

#### Scale Tiers

| Agent Count | Strategy | Visual Treatment |
|-------------|---------|-----------------|
| 1-10 | Full fidelity | All agents at maximum visual detail at all zoom levels. No LOD reduction. |
| 11-50 | Standard | Full fidelity at zoom >= 3x. Simplified avatars (no sparklines, smaller labels) at zoom < 3x. |
| 51-100 | LOD active | Full fidelity only for agents in viewport at zoom >= 5x. All others use LOD 1 (simplified icon + name). Out-of-viewport agents rendered as dots on minimap only. |
| 101-200 | Clustering + LOD | Agents in the same zone auto-cluster when zoom < 3x. Cluster shows zone name + count badge + aggregate health color. Expanding a cluster (zoom in or click) reveals individual agents. |
| 201-500 | Heavy clustering | Zones collapse to cluster badges at zoom < 2x. Force-directed layout disabled (too many nodes); grid layout used instead. Individual agents only visible at zoom >= 5x within a focused zone. |
| 500+ | Summary mode | World view shows only zone clusters with aggregate metrics. Full agent detail requires selecting a zone and drilling in. Topology view switches to Cytoscape.js with WebGL rendering. Consider pagination or virtual scrolling for agent lists. |

### 10.2 Clustering and Grouping Strategies

#### Zone-Based Clustering

When agent count exceeds 100 and zoom is < 3x, agents within each zone are collapsed into a cluster badge.

**Cluster Badge Design:**

| Property | Value |
|----------|-------|
| Shape | Rounded rectangle, 120px x 60px |
| Background | Zone color at 0.8 opacity |
| Content | Zone icon (24px), zone name (12px bold), agent count (20px, large), health indicator bar |
| Health indicator | Horizontal bar showing proportions: green (healthy), amber (warning), red (error) |
| Interaction | Click to zoom into zone, revealing individual agents |
| Animation | Cluster breathes (subtle scale 1.0-1.02) if agents are active; static if all idle |

#### Role-Based Grouping

Users can toggle grouping by role instead of zone. In this mode, agents are clustered by their role (researcher, coder, reviewer, etc.) regardless of their zone.

- Each role group has its own cluster badge using the role color.
- Hovering a role cluster shows a tooltip with the role name, agent count, aggregate metrics (total tokens, total cost, average success rate).

#### Automatic Clustering Algorithm

```
function shouldCluster(zone, zoomLevel, agentCount):
    if agentCount <= 50:
        return false  // never cluster at low counts
    if zoomLevel >= 3:
        return false  // never cluster when zoomed in
    if zone.agentCount > 20 and zoomLevel < 2:
        return true
    if zone.agentCount > 10 and zoomLevel < 1.5:
        return true
    return false
```

### 10.3 Level-of-Detail (LOD) System

Each agent avatar has three LOD levels. The active LOD is determined by a combination of distance from viewport center and total agent count.

#### LOD Level Definitions

**LOD 0 -- Full Fidelity:**
- All 9 avatar layers rendered (shadow through floating notifications)
- Rive state machine running with full animation
- Sparkline metrics visible (at appropriate zoom)
- Particle effects active
- Status ring with glow
- Performance cost: ~0.3ms CPU + GPU per agent per frame

**LOD 1 -- Simplified:**
- 4 layers rendered: shadow, body (static sprite, no Rive animation), status ring (solid color, no pulse), name label
- No sparklines, no activity bubble, no particles
- Status ring color still updates with state changes
- Static body sprite with a subtle opacity pulse instead of breathing animation
- Performance cost: ~0.07ms CPU + GPU per agent per frame

**LOD 2 -- Dot:**
- 1 layer: colored circle (6px radius), color matches current state
- No name, no animations, no details
- Tooltip on hover shows agent name and state
- Performance cost: ~0.015ms CPU + GPU per agent per frame

#### LOD Assignment Logic

```
function getLOD(agent, viewport, totalAgentCount):
    distanceFromViewportCenter = distance(agent.position, viewport.center)
    viewportDiagonal = sqrt(viewport.width^2 + viewport.height^2)

    if totalAgentCount <= 50:
        // Small world: everything at max detail in viewport
        if isInViewport(agent, viewport):
            return LOD_0
        else:
            return LOD_2  // not visible, dot on minimap

    if isInViewport(agent, viewport):
        if viewport.zoom >= 5:
            return LOD_0
        elif viewport.zoom >= 3:
            if distanceFromViewportCenter < viewportDiagonal * 0.3:
                return LOD_0
            else:
                return LOD_1
        else:
            return LOD_1
    else:
        return LOD_2  // outside viewport
```

### 10.4 Semantic Zoom

Semantic zoom means that the type of information shown changes with zoom level, not just the size. This is the key insight for handling scale: zooming out does not just make things smaller -- it changes what is displayed.

#### Semantic Zoom Levels

| Zoom Range | What Is Shown | What Is Hidden | Aggregate Data Shown |
|-----------|---------------|---------------|---------------------|
| **1x-1.5x** (World Overview) | Zone rectangles with cluster badges. Each badge shows zone name, agent count, health bar. Weather effects visible. Day/night cycle. Minimap hidden (redundant at this zoom). | Individual agents. Connection lines. Sparklines. Agent names. | Total agents, total cost, overall error rate, aggregate health |
| **1.5x-3x** (Zone Level) | Zones with individual agent dots (LOD 2). Zone labels. Connection lines between zones (aggregate, showing total message count). | Agent details. Sparklines. Activity bubbles. Particle effects. | Per-zone: agent count, zone cost, zone error rate, busiest agent name |
| **3x-5x** (Agent Level) | Individual agent avatars (LOD 1 or LOD 0 for central agents). Name labels. Status rings. Level badges. Connection lines between agents. | Sparklines (unless zoom >= 5x). Detailed activity bubbles. Facial expressions. | Per-agent: name, state, level, current task name |
| **5x-7x** (Detail Level) | Full agent detail (LOD 0). Sparklines. Activity bubbles with icons. Connection lines with message particles. Task progress rings. Energy bars. | Agents outside viewport. | Per-agent: full metrics (tokens, cost, tasks, quality) |
| **7x-10x** (Inspection Level) | Maximum fidelity. Facial expressions. Tool icons. Real-time metric counters. Mini-timeline of recent events. Full Rive animation detail. | Everything outside the focused area. | Full per-agent dashboard-level detail inline |

#### Transition Behavior

When the user zooms across a semantic boundary (e.g., from 2.8x to 3.2x), the transition is animated:
- Elements appearing fade in from 0% to 100% opacity over 200ms.
- Elements disappearing fade out from 100% to 0% over 200ms.
- Cluster badges morph into individual agent dots (cluster badge splits into N dots that fly to their positions over 400ms).
- Individual agents merge into cluster badges (dots converge toward cluster center over 400ms, badge fades in).

---

## Appendix A: Technology Version Pinning

| Technology | Minimum Version | Notes |
|-----------|----------------|-------|
| PixiJS | 8.0.0 | WebGL2 required; `@pixi/react` for React integration |
| Rive | 2.x | Rive runtime for web; state machine support required |
| GSAP | 3.12+ | ScrollTrigger, MorphSVG plugins |
| Recharts | 2.12+ | Responsive containers, custom tooltips |
| Apache ECharts | 5.5+ | WebGL rendering mode, treemap, calendar |
| React Flow | 12.x | Custom nodes, minimap, controls |
| Cytoscape.js | 3.28+ | Cola layout, cose-bilkent layout |
| XState | 5.x | Actor model, inspect API |
| D3-force | 3.x | Force simulation for topology layout |

## Appendix B: Asset Requirements for Motion Designers

The following Rive files must be created by the motion graphics team:

| File | States Required | Priority |
|------|----------------|----------|
| `agent_avatar.riv` | idle_breathing, initializing, thinking_loop, executing_code, executing_search, executing_write, communicating, waiting_idle, error_alarm, recovering, complete_celebration, terminated_fadeout, level_up, sleeping | P0 |
| `weather_effects.riv` | sunny_motes, cloud_drift, rain_fall, storm_lightning | P1 |
| `particle_templates.riv` | xp_star, confetti_piece, message_dot, ember, spark | P0 |
| `ui_transitions.riv` | panel_slide_in, panel_slide_out, modal_appear, toast_pop | P1 |
| `badge_animations.riv` | badge_unlock, tier_upgrade, badge_shine | P1 |

Each Rive file must include named state machine inputs for triggering transitions programmatically.

## Appendix C: Performance Monitoring

The following metrics must be tracked in production to validate visualization performance:

| Metric | Collection Method | Alert Threshold |
|--------|------------------|----------------|
| Canvas FPS | `requestAnimationFrame` delta, reported to analytics every 10s | < 30fps for > 5 consecutive seconds |
| Particle count | PixiJS ParticleContainer `children.length`, sampled every 1s | > 500 active particles |
| Memory usage | `performance.memory.usedJSHeapSize`, sampled every 30s | > 512MB |
| Rive animation count | Active Rive instances count, sampled every 5s | > 100 simultaneous instances |
| WebSocket message rate | Counter per second | > 500 messages/s (trigger client-side throttling) |
| DOM node count | `document.querySelectorAll('*').length`, sampled every 30s | > 5000 nodes |
| React re-renders (detail panel) | React DevTools profiler equivalent, custom hook | > 30 re-renders/s for any component |

---

*End of Visualization Specification*
