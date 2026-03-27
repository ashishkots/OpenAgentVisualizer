# OpenAgentVisualizer Sprint 3 — UI Design System Extension

**Product:** OpenAgentVisualizer — Gamified Virtual World for AI Agent Management
**Sprint:** 3 (3D Viewer, Cross-Product Integrations, CLI Plugin, DevOps)
**Author:** UI Designer (Stage 1.3)
**Date:** 2026-03-27
**Status:** COMPLETE
**Inputs:** Sprint 3 UX Wireframes, Sprint 3 PRD, Sprint 3 Architecture, Sprint 2 UI Design System, Sprint 3 UX Handoff (sprint3-stage-1.2-ux-to-ui.yml)

---

## Table of Contents

1. [New Color Tokens](#1-new-color-tokens)
2. [Component Visual Specs](#2-component-visual-specs)
3. [Animation Specs](#3-animation-specs)
4. [Icon Assignments](#4-icon-assignments)
5. [Tailwind Config Extension](#5-tailwind-config-extension)
6. [Responsive Adaptations](#6-responsive-adaptations)

---

## Conventions and Continuity Notes

All Sprint 2 tokens, typography, spacing, border-radius, shadow, and z-index values remain **unchanged**. Sprint 3 tokens are strictly additive. When the spec below says "same pattern as Sprint 2 X", it means: use the identical Tailwind classes documented in the Sprint 2 UI Design System without modification.

The base surface color for all Sprint 3 panels is `oav-surface` (`#1e2433`) unless explicitly noted as `oav-surface-elevated` (`#232d3f`). The elevated surface is reserved for panels that float over canvas content (Span Detail, Entity Detail, Agent Security Detail, 3D sidebar) where a slightly lighter surface helps distinguish the overlay from the backdrop.

---

## 1. New Color Tokens

### 1.1 Sprint 3 Primary Tokens

The UX wireframes specify corrected hex values after contrast review. The table below documents the **authoritative hex** values for this design system. One divergence from the UX draft: `oav-trace` is specified in the UX doc as `#f472b6` (pink-400), which achieves 5.2:1 on `oav-surface`. This document adopts that value. The PRD listed `#a78bfa` at one point in brainstorming notes — that value is **not used**. Use `#f472b6` for `oav-trace` everywhere.

| Token | Hex | Tailwind Class | PixiJS Integer | Role |
|-------|-----|----------------|---------------|------|
| `oav-trace` | `#f472b6` | `text-oav-trace` / `bg-oav-trace` | `0xf472b6` | Trace waterfall span bars, trace accent in navigation |
| `oav-mesh` | `#34d399` | `text-oav-mesh` / `bg-oav-mesh` | `0x34d399` | Mesh topology edges, node role badge, mesh status dots |
| `oav-knowledge` | `#60a5fa` | `text-oav-knowledge` / `bg-oav-knowledge` | `0x60a5fa` | Knowledge graph concept nodes, entity search highlight |
| `oav-shield` | `#fb923c` | `text-oav-shield` / `bg-oav-shield` | `0xfb923c` | Security grade D badge, embedding entity type, High-severity violations |
| `oav-3d` | `#818cf8` | `text-oav-3d` / `bg-oav-3d` | `0x818cf8` | 3D viewer status bar, 2D/3D toggle active state, UE5 ping indicator |
| `oav-surface-elevated` | `#232d3f` | `bg-oav-surface-elevated` | N/A | Slide-in panels over canvas, controls-guide overlay |

**Contrast enforcement rules:**
- `oav-knowledge` (`#60a5fa`) on `oav-surface` (`#1e2433`) = 4.8:1. Use for large/bold text and decorative elements only. For body text inside panels, use `text-oav-text` and apply `oav-knowledge` only to icons or borders.
- `oav-3d` (`#818cf8`) on `oav-surface` = 4.5:1. Apply only as `font-semibold text-sm` minimum, or for graphical/decorative purposes.
- All others meet WCAG 2.1 AA for normal-weight body text on `oav-surface`.

### 1.2 Entity Type Color System (Knowledge Graph)

Four distinct entity types each have a shape, fill, border color, and icon. These tokens compose using Tailwind opacity modifiers.

| Entity Type | Shape | Fill Class | Border Class | Icon (lucide-react) | Icon Size |
|-------------|-------|-----------|-------------|---------------------|-----------|
| Concept | Circle (48px diameter) | `bg-oav-knowledge/20` | `border-2 border-oav-knowledge` | `Lightbulb` | 16px |
| Fact | Rounded rectangle (80×40px) | `bg-oav-success/20` | `border-2 border-oav-success rounded-lg` | `CheckCircle2` | 16px |
| Agent Memory | Diamond (56px rotated square) | `bg-oav-purple/20` | `border-2 border-oav-purple` | `Brain` | 16px |
| Embedding | Hexagon (48px, SVG clip-path) | `bg-oav-shield/20` | `border-2 border-oav-shield` | `Hexagon` | 16px |

All four entity types display the entity name truncated at 20 characters: `text-xs font-medium text-oav-text`.

**Hexagon clip-path for Embedding nodes (inline SVG approach):**
```css
.knowledge-node-hexagon {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  width: 48px;
  height: 48px;
}
```

### 1.3 Security Grade Color System

Security grades map to the existing Sprint 2 semantic color tokens. No new hex values are introduced for grades — only compositional classes.

| Grade | Score Range | Background Class | Text Class | Badge Border | Gauge Arc Color |
|-------|-------------|-----------------|------------|-------------|-----------------|
| A | 90–100 | `bg-oav-success/20` | `text-oav-success` | `border-oav-success/40` | `#22c55e` |
| B | 80–89 | `bg-oav-knowledge/20` | `text-oav-knowledge` | `border-oav-knowledge/40` | `#60a5fa` |
| C | 70–79 | `bg-oav-warning/20` | `text-oav-warning` | `border-oav-warning/40` | `#f59e0b` |
| D | 60–69 | `bg-oav-shield/20` | `text-oav-shield` | `border-oav-shield/40` | `#fb923c` |
| F | 0–59 | `bg-oav-error/20` | `text-oav-error` | `border-oav-error/40` | `#ef4444` |

The gauge arc uses a CSS conic-gradient or SVG stroke-dasharray. The arc color is derived from the table above based on the live score value. Arc animates via GSAP on score change (see Section 3.6).

### 1.4 Integration Status Colors

| Status | Color Token | Hex | Dot Class | Label Class | Icon |
|--------|-------------|-----|-----------|-------------|------|
| Connected | `oav-success` | `#22c55e` | `bg-oav-success` | `text-oav-success` | `Circle` (filled, lucide) |
| Degraded | `oav-warning` | `#f59e0b` | `bg-oav-warning` | `text-oav-warning` | `CircleDashed` (lucide) |
| Disconnected | `oav-error` | `#ef4444` | `bg-oav-error` | `text-oav-error` | `CircleX` (lucide) |
| Not Configured | `oav-muted` | `#94a3b8` | `bg-oav-muted/40` with dashed border | `text-oav-muted` | `CircleDot` (lucide) |

The "Not Configured" dot is rendered as: `w-2 h-2 rounded-full border border-dashed border-oav-muted` (no solid fill, dashed border conveys absence of configuration).

---

## 2. Component Visual Specs

All components follow the Sprint 2 convention: states are **default, hover, active/selected, disabled, loading**, plus component-specific states. Focus-visible ring: `focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg` on all interactive elements.

---

### 2.1 3D Viewer Chrome (UE5StreamContainer)

**Purpose:** Full-viewport container for the UE5 Pixel Streaming WebRTC feed on `/world3d`.

**Dimensions:** `w-full h-full` relative to the main content area (sidebar excluded). `position: relative` to anchor overlays.

#### 2.1.1 WebRTC Video Container

```
<div class="relative w-full h-full bg-black overflow-hidden">
  <video
    class="w-full h-full object-contain"
    autoplay muted playsinline
  />
</div>
```

- `bg-black`: letterbox for aspect-ratio mismatches
- `object-contain`: prevents distortion, shows black bars if needed
- `autoplay muted playsinline`: required for browser autoplay policy compliance

#### 2.1.2 Loading Overlay

Shown while WebRTC negotiation is in progress (state: `connecting`).

```
<div class="absolute inset-0 flex flex-col items-center justify-center
            bg-oav-bg/95 backdrop-blur-sm z-30">
  <!-- Spinner ring -->
  <div class="w-12 h-12 rounded-full border-4 border-oav-border
              border-t-oav-3d animate-spin mb-4" />
  <!-- Status text -->
  <p class="text-sm font-medium text-oav-text mb-1">
    Connecting to 3D server...
  </p>
  <!-- Step indicator — updates via JS -->
  <p class="text-xs text-oav-muted" id="ue5-connect-step">
    Establishing WebRTC session
  </p>
  <!-- Progress bar -->
  <div class="mt-4 w-48 h-1 bg-oav-border rounded-full overflow-hidden">
    <div class="h-full bg-oav-3d rounded-full transition-all duration-500 ease-out"
         id="ue5-progress-bar" style="width: 0%" />
  </div>
</div>
```

Progress stages and bar widths (updated via JS during connection):
- "Establishing WebRTC session" → 20%
- "Exchanging SDP..." → 45%
- "ICE negotiation..." → 70%
- "Starting video stream..." → 90%
- Complete: overlay dismissed via GSAP fade-out (see Section 3.1)

**Spinner color:** `border-t-oav-3d` (`#818cf8`) on `border-oav-border` (`#2d3748`) base.

#### 2.1.3 Reconnecting Overlay

Shown on mid-session connection drop (state: `reconnecting`). The last video frame remains visible underneath — this overlay does not use `bg-oav-bg` but a semi-transparent blur.

```
<div class="absolute inset-0 flex flex-col items-center justify-center
            bg-oav-bg/70 backdrop-blur-md z-30">
  <div class="bg-oav-surface-elevated border border-oav-border rounded-xl p-6
              flex flex-col items-center gap-4 shadow-xl max-w-xs w-full mx-4">
    <div class="w-10 h-10 rounded-full border-4 border-oav-border
                border-t-oav-warning animate-spin" />
    <div class="text-center">
      <p class="text-sm font-semibold text-oav-text">
        Reconnecting to 3D server...
      </p>
      <p class="text-xs text-oav-muted mt-1" id="ue5-retry-text">
        Retrying in 8s... (attempt 1 of 5)
      </p>
    </div>
    <button class="text-sm text-oav-accent hover:underline focus-visible:ring-2
                   focus-visible:ring-oav-accent rounded">
      Switch to 2D view
    </button>
  </div>
</div>
```

#### 2.1.4 Fallback Banner (UE5 Unavailable)

Shown at the top of the viewport when UE5 is unavailable and the system has fallen back to the 2D PixiJS canvas. The 2D canvas renders below as normal.

```
<div class="relative z-30 mx-4 mt-4 mb-0"
     role="status" aria-live="polite">
  <div class="flex items-start gap-3 bg-oav-3d/10 border border-oav-3d/30
              rounded-xl px-4 py-3 text-sm">
    <!-- Info icon -->
    <Info class="w-4 h-4 text-oav-3d shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <span class="text-oav-text">
        3D viewer unavailable — showing 2D view.
      </span>
      <a href="/settings?tab=integrations"
         class="ml-2 text-oav-3d hover:underline font-medium text-xs">
        Configure 3D →
      </a>
    </div>
    <button aria-label="Dismiss"
            class="text-oav-muted hover:text-oav-text transition-colors shrink-0 p-0.5
                   focus-visible:ring-2 focus-visible:ring-oav-accent rounded">
      <X class="w-4 h-4" />
    </button>
  </div>
</div>
```

**States:**
- Default: as above, visible
- Dismissed: remove from DOM via GSAP fade-out + slide-up (100ms, see Section 3.1)

**Dismissal persistence:** Store `oav_fallback_banner_dismissed` in `sessionStorage` (not `localStorage` — banner reappears on next page load to maintain awareness).

#### 2.1.5 Controls Guide Overlay (First Visit)

Shown centered in the viewport on first visit to `/world3d`. Dismissed via "Got it!" button. State stored in `localStorage.setItem('oav_3d_guide_shown', 'true')`.

```
<div class="absolute inset-0 flex items-center justify-center z-40
            bg-oav-bg/50 backdrop-blur-sm">
  <div class="bg-oav-surface-elevated border border-oav-border rounded-xl p-6
              shadow-xl max-w-xs w-full mx-4">
    <h2 class="text-sm font-semibold text-oav-text mb-4">3D Controls</h2>
    <dl class="space-y-2 text-xs">
      <div class="flex gap-3">
        <dt class="font-mono text-oav-3d w-16 shrink-0">WASD</dt>
        <dd class="text-oav-muted">Move camera</dd>
      </div>
      <div class="flex gap-3">
        <dt class="font-mono text-oav-3d w-16 shrink-0">Mouse</dt>
        <dd class="text-oav-muted">Look around</dd>
      </div>
      <div class="flex gap-3">
        <dt class="font-mono text-oav-3d w-16 shrink-0">Scroll</dt>
        <dd class="text-oav-muted">Zoom in / out</dd>
      </div>
      <div class="flex gap-3">
        <dt class="font-mono text-oav-3d w-16 shrink-0">Click</dt>
        <dd class="text-oav-muted">Select agent</dd>
      </div>
      <div class="flex gap-3">
        <dt class="font-mono text-oav-3d w-16 shrink-0">Esc</dt>
        <dd class="text-oav-muted">Deselect</dd>
      </div>
    </dl>
    <button class="mt-5 w-full bg-oav-accent text-white rounded-lg py-2 text-sm
                   font-medium hover:bg-oav-accent/90 transition-colors
                   focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2
                   focus-visible:ring-offset-oav-surface-elevated">
      Got it!
    </button>
  </div>
</div>
```

#### 2.1.6 Stream Status Bar (Bottom Overlay)

Persistent status bar pinned to the bottom of the 3D viewport, visible when the stream is active.

```
<div class="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-4
            bg-oav-surface/80 backdrop-blur-sm border border-oav-border
            rounded-xl px-4 py-2 text-xs text-oav-muted">
  <!-- Camera mode -->
  <select class="bg-transparent text-oav-text text-xs font-medium
                 border-none outline-none cursor-pointer appearance-none
                 hover:text-oav-accent transition-colors">
    <option>Free Camera</option>
    <option>Overview</option>
    <option>Follow Agent</option>
  </select>
  <!-- Separator -->
  <span class="w-px h-3 bg-oav-border" />
  <!-- Agent count -->
  <span class="flex items-center gap-1">
    <Users class="w-3 h-3" />
    <span id="ue5-agent-count" class="text-oav-text font-semibold tabular-nums">0</span>
    <span>agents</span>
  </span>
  <!-- FPS -->
  <span class="flex items-center gap-1">
    <span>FPS:</span>
    <span id="ue5-fps" class="text-oav-text font-semibold tabular-nums">—</span>
  </span>
  <!-- Ping -->
  <span class="flex items-center gap-1 ml-auto">
    <span>Ping:</span>
    <span id="ue5-ping" class="text-oav-text font-semibold tabular-nums">—</span>
    <span>ms</span>
  </span>
</div>
```

**FPS color coding:**
- ≥ 28fps: `text-oav-success`
- 15–27fps: `text-oav-warning`
- < 15fps: `text-oav-error`

**Ping color coding:**
- ≤ 100ms: `text-oav-success`
- 101–250ms: `text-oav-warning`
- > 250ms: `text-oav-error`

Apply via JS class swap on the respective `<span>` elements.

#### 2.1.7 2D/3D Toggle

Positioned `absolute top-4 right-4 z-30`. Reuses the segmented button pattern from the Sprint 2 leaderboard period selector.

```
<div class="inline-flex rounded-lg overflow-hidden border border-oav-border
            bg-oav-surface">
  <a href="/world"
     class="px-3 py-1.5 text-xs font-medium transition-colors
            [INACTIVE: text-oav-muted hover:text-oav-text]
            [ACTIVE:   bg-oav-accent text-white]">
    2D
  </a>
  <a href="/world3d"
     class="px-3 py-1.5 text-xs font-medium transition-colors
            [INACTIVE: text-oav-muted hover:text-oav-text]
            [ACTIVE:   bg-oav-accent text-white]">
    3D
  </a>
</div>
```

Implemented as React Router `<Link>` components. Active state determined by current route: `/world` activates "2D", `/world3d` activates "3D". The `bg-oav-accent text-white` segment has no hover state (already active). The inactive segment uses `text-oav-muted hover:text-oav-text`.

---

### 2.2 TraceWaterfall

**Purpose:** Interactive waterfall diagram showing trace spans with timing bars. Used inline-expanded within the TraceExplorer trace list and on the Agent Detail Traces tab.

**Container:** `bg-oav-bg rounded-lg border border-oav-border/50 overflow-x-auto`

#### 2.2.1 Time Axis Ruler

```
<div class="relative h-6 border-b border-oav-border mb-1 flex items-end
            text-[10px] text-oav-muted font-mono select-none">
  <!-- Tick marks rendered by JS at calculated intervals -->
  <!-- Each tick: absolute positioned, border-l border-oav-border/50 h-2 -->
  <!-- Labels: absolute positioned below ticks -->
</div>
```

Ruler spans the full trace duration. Tick interval: auto-calculated to produce 5–8 ticks (e.g. for a 500ms trace: ticks at 0, 100, 200, 300, 400, 500ms). Label format: `{N}ms`.

#### 2.2.2 Span Row Structure

Each span occupies one row. Rows are sorted by span start time, with child spans indented beneath their parent.

```
<div class="flex items-center py-1 pr-4 hover:bg-oav-surface-hover cursor-pointer
            transition-colors duration-100 group"
     style="padding-left: calc(8px + {depth} * 24px)">

  <!-- Service + operation label — fixed 180px width, truncated -->
  <div class="w-[180px] shrink-0 mr-3">
    <span class="text-xs font-mono text-oav-muted truncate block leading-tight">
      {service}
    </span>
    <span class="text-xs font-medium text-oav-text truncate block leading-tight">
      {operation}
    </span>
  </div>

  <!-- Bar track — fills remaining width -->
  <div class="flex-1 relative h-6">
    <!-- Bar: positioned by left% and width% based on start_time/duration vs trace total -->
    <div class="absolute h-6 rounded-sm flex items-center overflow-hidden
                {bar-color-class} group-hover:brightness-110 transition-all duration-150"
         style="left: {startPercent}%; width: {widthPercent}%">
      <!-- Duration label inside bar if wide enough (>60px), else outside -->
    </div>
  </div>

  <!-- Duration label — right-aligned, fixed 60px -->
  <div class="w-[60px] shrink-0 text-right text-xs text-oav-muted font-mono tabular-nums ml-2">
    {duration_ms}ms
  </div>
</div>
```

**Minimum bar width:** 3px (`min-w-[3px]`). Bars narrower than 3px still render so no span is invisible.

**Bar color classes by span type/status:**

| Condition | Bar Class | Usage |
|-----------|-----------|-------|
| Default (OK status) | `bg-oav-trace` | All healthy spans |
| Error span (status = ERROR) | `bg-oav-error` | Span has error status |
| Slow span (duration > 2× avg span duration in trace) | `bg-oav-warning` | Performance outliers |
| Root span | `bg-gradient-to-r from-oav-trace to-oav-trace/60` | The root/entry span |
| DB/storage service | `bg-oav-purple` | Spans from DB services (detected by service name contains "db", "pg", "redis", "cache") |
| LLM service | `bg-oav-knowledge` | Spans from LLM services (service name contains "llm", "openai", "claude", "gpt") |

**Depth indentation:** `padding-left: calc(8px + {depth} * 24px)`. Maximum visual depth: 8 (beyond which nesting is capped at `ml-[200px]`). A vertical guide line connects parent to children:
```css
/* Applied to non-root span rows */
.waterfall-span-child::before {
  content: '';
  position: absolute;
  left: calc(8px + ({depth} - 1) * 24px + 8px);
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: rgba(45, 55, 72, 0.6); /* oav-border at 60% */
}
```

**Clickable behavior:** Clicking any span row opens the SlideInPanel (Section 2.9) with span detail. The clicked row gets `bg-oav-surface-active` highlight that persists until the panel is closed.

#### 2.2.3 Waterfall Expand/Collapse Row (in TraceList)

The expand trigger row in the trace list table:

```
<tr class="cursor-pointer hover:bg-oav-surface-hover transition-colors"
    onclick="toggleWaterfall(traceId)">
  <!-- expand chevron -->
  <td class="w-8 pl-3">
    <ChevronDown class="w-4 h-4 text-oav-muted transition-transform duration-200
                        {expanded ? 'rotate-180' : 'rotate-0'}" />
  </td>
  <td class="text-xs font-mono text-oav-accent truncate max-w-[120px]">
    {trace_id_short}...
  </td>
  <td class="text-xs text-oav-muted">{root_service}</td>
  <td class="text-xs text-oav-text">{root_operation}</td>
  <td class="text-xs text-oav-text tabular-nums text-right">{duration_ms}ms</td>
  <td class="text-xs text-oav-muted tabular-nums text-right">{span_count}</td>
  <td>
    <!-- Error indicator -->
    {error_count > 0 && (
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                   bg-oav-error/20 text-oav-error text-xs font-medium">
        <AlertCircle class="w-3 h-3" />
        {error_count}
      </span>
    )}
  </td>
</tr>
<!-- Expanded waterfall row — spans all columns -->
<tr class={expanded ? '' : 'hidden'}>
  <td colspan="7" class="p-0 border-t border-oav-border/50">
    <div class="px-4 py-3 bg-oav-bg/60">
      <!-- TraceWaterfall component renders here -->
    </div>
  </td>
</tr>
```

**Error row styling:** When `error_count > 0`, the trace row gets `border-l-2 border-l-oav-error` on the `<tr>` (applied via `class="border-l-2 border-l-oav-error"`).

---

### 2.3 TraceExplorer (Page-Level Component)

**Purpose:** Search interface + trace list + waterfall view on `/traces`.

#### 2.3.1 Search Bar

```
<div class="bg-oav-surface border border-oav-border rounded-xl p-4">
  <div class="flex flex-wrap items-end gap-3">

    <!-- Time range: segmented buttons -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-oav-muted">Time Range</label>
      <div class="inline-flex rounded-lg overflow-hidden border border-oav-border bg-oav-bg">
        {['Last 1h', 'Last 24h', 'Last 7d', 'Custom'].map(opt =>
          <button class="px-3 py-1.5 text-xs font-medium transition-colors
                         {active: 'bg-oav-accent text-white'}
                         {inactive: 'text-oav-muted hover:text-oav-text'}" />
        )}
      </div>
    </div>

    <!-- Agent filter dropdown -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-oav-muted">Agent</label>
      <select class="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5
                     text-xs text-oav-text h-[30px] min-w-[120px]
                     focus:border-oav-accent focus:ring-1 focus:ring-oav-accent
                     focus:outline-none">
        <option>All agents</option>
      </select>
    </div>

    <!-- Service filter dropdown -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-oav-muted">Service</label>
      <select class="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5
                     text-xs text-oav-text h-[30px] min-w-[120px]
                     focus:border-oav-accent focus:ring-1 focus:ring-oav-accent
                     focus:outline-none">
        <option>All services</option>
      </select>
    </div>

    <!-- Min duration input -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-oav-muted">Min Duration</label>
      <div class="relative">
        <input type="number" min="0" placeholder="0"
               class="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5
                      text-xs text-oav-text w-20 h-[30px] tabular-nums
                      focus:border-oav-accent focus:ring-1 focus:ring-oav-accent
                      focus:outline-none pr-7" />
        <span class="absolute right-2 top-1/2 -translate-y-1/2
                     text-xs text-oav-muted pointer-events-none">ms</span>
      </div>
    </div>

    <!-- Errors only checkbox -->
    <div class="flex items-center gap-2 pb-0.5">
      <input type="checkbox" id="errors-only"
             class="w-4 h-4 rounded border-oav-border bg-oav-bg
                    accent-oav-error cursor-pointer" />
      <label for="errors-only" class="text-xs text-oav-muted cursor-pointer
                                       hover:text-oav-text transition-colors">
        Errors only
      </label>
    </div>

    <!-- Search button -->
    <button class="bg-oav-accent text-white rounded-lg px-4 py-1.5 text-sm
                   font-medium hover:bg-oav-accent/90 transition-colors
                   focus-visible:ring-2 focus-visible:ring-oav-accent
                   focus-visible:ring-offset-2 focus-visible:ring-offset-oav-surface
                   disabled:opacity-50 disabled:cursor-not-allowed h-[30px]">
      Search
    </button>

  </div>
</div>
```

#### 2.3.2 Integration Status Bar

```
<div class="bg-oav-surface/50 border border-oav-border rounded-lg
            px-4 py-2 text-xs flex items-center gap-2">
  <span class="w-2 h-2 rounded-full {status === 'connected' ? 'bg-oav-success' : 'bg-oav-error'}" />
  <span class="text-oav-muted">OpenTrace:</span>
  <span class="{status === 'connected' ? 'text-oav-success' : 'text-oav-error'} font-medium">
    {status === 'connected' ? 'Connected' : 'Disconnected'}
  </span>
  {status === 'connected' &&
    <span class="text-oav-muted ml-auto">Last sync: {lastSync}</span>
  }
</div>
```

#### 2.3.3 Trace List Table

```
<div class="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
  <!-- Header -->
  <table class="w-full">
    <thead>
      <tr class="bg-oav-bg/50 border-b border-oav-border">
        <th class="w-8" /> <!-- expand column -->
        <th class="text-left text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Trace ID</th>
        <th class="text-left text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Root Service</th>
        <th class="text-left text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Operation</th>
        <th class="text-right text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Duration</th>
        <th class="text-right text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Spans</th>
        <th class="text-left text-xs text-oav-muted uppercase tracking-wider
                   font-medium px-3 py-2">Status</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-oav-border/50">
      <!-- rows as described in 2.2.3 -->
    </tbody>
  </table>
  <!-- Pagination -->
  <div class="border-t border-oav-border px-4 py-2 flex items-center justify-between
              text-xs text-oav-muted">
    <span>Showing 1–20 of {total}</span>
    <div class="flex gap-1">
      <button class="px-2 py-1 rounded-md hover:bg-oav-surface-hover
                     disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
      <button class="px-2 py-1 rounded-md hover:bg-oav-surface-hover
                     disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
    </div>
  </div>
</div>
```

#### 2.3.4 Fallback Banner (OpenTrace Unreachable)

```
<div class="bg-oav-warning/10 border border-oav-warning/30 rounded-xl p-4
            flex items-start gap-3 text-sm"
     role="alert">
  <AlertTriangle class="w-4 h-4 text-oav-warning shrink-0 mt-0.5" />
  <div>
    <p class="text-oav-text font-medium">OpenTrace connection unavailable.</p>
    <p class="text-oav-muted text-xs mt-0.5">
      Showing locally ingested spans only.
    </p>
    <a href="/settings?tab=integrations"
       class="text-oav-warning text-xs hover:underline mt-1 inline-block">
      Configure OpenTrace →
    </a>
  </div>
</div>
```

---

### 2.4 MeshTopologyNode (ReactFlow Custom Node)

**Purpose:** Custom ReactFlow node for the `/mesh` page. Extends the Sprint 2 `TopologyNode` (Section 4.14 of Sprint 2 design system) with mesh-specific additions.

**Dimensions:** 160×96px (16px taller than Sprint 2's 80px to accommodate the mesh role badge).

**Full structure:**

```
<div class="bg-oav-surface border border-oav-border rounded-xl px-3 py-2
            flex items-center gap-2 w-40
            transition-all duration-200
            {selected: 'border-oav-accent ring-2 ring-oav-accent/30'}
            {hover: 'border-oav-accent/60 bg-oav-surface-hover'}
            {disconnected: 'opacity-40 border-dashed'}">

  <!-- Avatar -->
  <div class="relative shrink-0">
    <AgentAvatar size="small" level={agent.level} />
    <!-- Status dot -->
    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                 border-2 border-oav-surface {statusBgClass}" />
  </div>

  <!-- Info -->
  <div class="flex-1 min-w-0">
    <p class="text-xs font-semibold text-oav-text truncate">{agent.name}</p>
    <p class="text-[10px] text-oav-muted">
      Lv {agent.level} · {levelTitle}
    </p>
    <!-- Mesh role badge — Sprint 3 addition -->
    <span class="inline-block mt-0.5 text-[10px] px-1.5 py-0 rounded-full
                 bg-oav-mesh/20 text-oav-mesh font-medium leading-5">
      {meshRole}  {/* Producer | Consumer | Router */}
    </span>
  </div>

  <!-- Disconnected overlay badge -->
  {isDisconnected &&
    <span class="absolute -top-1.5 left-1/2 -translate-x-1/2
                 text-[9px] px-1.5 py-0 rounded-full
                 bg-oav-error/20 text-oav-error font-medium border border-oav-error/30">
      Disconnected
    </span>
  }
</div>
```

**ReactFlow handle style (all handles):**
```
.react-flow__handle {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  border: 2px solid #2d3748; /* oav-border */
  background: #1e2433;       /* oav-surface */
}
.react-flow__handle.connected {
  border-color: #3b82f6;     /* oav-accent */
}
```

**Node states:**

| State | Additional classes |
|-------|-------------------|
| Default | base classes above |
| Hover | `border-oav-accent/60 bg-oav-surface-hover` |
| Selected | `border-oav-accent ring-2 ring-oav-accent/30` |
| Pulse (live update) | GSAP ring flash — see Section 3.3 |
| Disconnected | `opacity-40` + `border-dashed border-oav-border` on wrapper |
| New (entering) | GSAP fade+scale in — see Section 3.3 |

**Mesh Role badge colors:**

| Role | Background | Text |
|------|-----------|------|
| Producer | `bg-oav-mesh/20` | `text-oav-mesh` |
| Consumer | `bg-oav-knowledge/20` | `text-oav-knowledge` |
| Router | `bg-oav-3d/20` | `text-oav-3d` |

**Edge encoding (ReactFlow custom edges):**

| Message rate | Stroke width | Dash pattern | Dash animation speed |
|-------------|-------------|-------------|---------------------|
| < 10 msg/hr | `strokeWidth: 1` | None | None |
| 10–100 msg/hr | `strokeWidth: 2` | None | None |
| 100–1000 msg/hr | `strokeWidth: 3` | None | None |
| > 1000 msg/hr | `strokeWidth: 4` | None | None |

Edge colors (override per health status):
- Healthy: `stroke: #34d399` (oav-mesh)
- High latency (avg > 500ms): `stroke: #f59e0b` (oav-warning)
- High error rate (> 5%): `stroke: #ef4444` (oav-error)

Edge hover tooltip: Popover `bg-oav-surface border border-oav-border rounded-md shadow-lg px-3 py-2 text-xs z-[70]`. Fields: Protocol, Messages/hr, Avg Latency, Error Rate — each as `text-oav-muted` label + `text-oav-text font-medium` value.

---

### 2.5 KnowledgeGraphNode (ReactFlow Custom Node)

**Purpose:** Custom ReactFlow node for the `/knowledge` page. Four distinct visual shapes per entity type.

Each node type shares a common React component with shape determined by a `type` prop. All nodes are clickable and open the Entity Detail panel.

**Common node wrapper classes:**
```
relative flex items-center justify-center cursor-pointer
transition-all duration-300 ease-in-out
{default: 'opacity-100 scale-100'}
{search-match: 'opacity-100 scale-[1.05] [border brightened — use brightness-125 filter]'}
{search-no-match: 'opacity-20 scale-100'}
{selected: 'ring-2 ring-oav-accent/50 ring-offset-1 ring-offset-oav-bg'}
```

**Concept node (circle, 48×48px):**
```
<div class="w-12 h-12 rounded-full bg-oav-knowledge/20 border-2 border-oav-knowledge
            flex flex-col items-center justify-center gap-0.5">
  <Lightbulb class="w-4 h-4 text-oav-knowledge" />
  <span class="text-[9px] font-medium text-oav-text leading-tight
               max-w-[44px] truncate text-center block"
        style="max-width: 44px">
    {name_truncated_20}
  </span>
</div>
```

**Fact node (rounded rectangle, 80×40px):**
```
<div class="w-20 h-10 rounded-lg bg-oav-success/20 border-2 border-oav-success
            flex flex-col items-center justify-center gap-0.5 px-1">
  <CheckCircle2 class="w-4 h-4 text-oav-success" />
  <span class="text-[9px] font-medium text-oav-text leading-tight
               w-full truncate text-center block">
    {name_truncated_20}
  </span>
</div>
```

**Agent Memory node (diamond, 56×56px via CSS rotate):**
```
<div class="relative w-14 h-14 flex items-center justify-center">
  <!-- Rotated square creating diamond shape -->
  <div class="absolute w-10 h-10 bg-oav-purple/20 border-2 border-oav-purple
              rotate-45 rounded-sm" />
  <!-- Content — counter-rotated to stay upright -->
  <div class="relative z-10 flex flex-col items-center gap-0.5 -rotate-0">
    <Brain class="w-4 h-4 text-oav-purple" />
    <span class="text-[9px] font-medium text-oav-text leading-tight
                 max-w-[44px] truncate text-center block">
      {name_truncated_20}
    </span>
  </div>
</div>
```

**Embedding node (hexagon, 48×48px via SVG clip-path):**
```
<div class="w-12 h-12 flex items-center justify-center
            bg-oav-shield/20 border-2 border-oav-shield"
     style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)">
  <div class="flex flex-col items-center gap-0.5">
    <Hexagon class="w-4 h-4 text-oav-shield" />
    <span class="text-[9px] font-medium text-oav-text leading-tight
                 max-w-[40px] truncate text-center block">
      {name_truncated_20}
    </span>
  </div>
</div>
```

**Note on Tailwind border with clip-path:** The `border-2` class is not reliably visible when `clip-path` clips the element. Use an SVG-based implementation for the hexagon border in production, or use a box-shadow approach: `box-shadow: 0 0 0 2px #fb923c` (the `oav-shield` hex value), which clip-path does not clip.

**Relationship edges (Knowledge Graph):**
```css
.react-flow__edge-path {
  stroke: #94a3b8;  /* oav-muted */
  stroke-width: 1;
}
.react-flow__edge:hover .react-flow__edge-path {
  stroke-width: 2;
}
.react-flow__edge-text {
  font-size: 10px;
  fill: #94a3b8;
}
.react-flow__edge:hover .react-flow__edge-text {
  fill: #e2e8f0; /* oav-text */
}
```

---

### 2.6 SecurityGauge (GaugeChart)

**Purpose:** Semi-circular arc gauge displaying the workspace compliance score (0–100). Used in the Security Dashboard's compliance score card.

**Dimensions:** `max-w-xs mx-auto` (max 288px wide). Height auto. The SVG gauge renders at `viewBox="0 0 200 120"` (wider than tall for the semicircle).

**SVG structure:**
```jsx
<div class="bg-oav-surface border border-oav-border rounded-xl p-6
            flex flex-col items-center gap-3">
  <svg viewBox="0 0 200 120" class="w-full max-w-[240px]" aria-hidden="true">
    <!-- Background arc (full semicircle) -->
    <path
      d="M 20,100 A 80,80 0 0,1 180,100"
      fill="none"
      stroke="#2d3748"  /* oav-border */
      stroke-width="14"
      stroke-linecap="round"
    />
    <!-- Score arc (partial, animated) -->
    <path
      d="M 20,100 A 80,80 0 0,1 180,100"
      fill="none"
      stroke="{gradeArcColor}"  /* color from grade color table */
      stroke-width="14"
      stroke-linecap="round"
      stroke-dasharray="251.3"  /* π × 80 = half-circumference */
      stroke-dashoffset="{251.3 * (1 - score/100)}"
      class="transition-all duration-[1200ms] ease-out"
      id="gauge-arc"
    />
    <!-- Needle (optional, tick mark) -->
    <!-- Score text — centered in arc -->
    <text x="100" y="88" text-anchor="middle"
          class="text-4xl font-bold" font-size="32"
          fill="#e2e8f0">{score}</text>
    <!-- Grade letter -->
    <text x="100" y="108" text-anchor="middle"
          font-size="14" font-weight="600"
          fill="{gradeTextColor}">{grade}</text>
  </svg>

  <!-- Grade scale legend below gauge -->
  <div class="flex gap-1 text-[10px] w-full justify-between px-2">
    <span class="text-oav-error">F</span>
    <span class="text-oav-shield">D</span>
    <span class="text-oav-warning">C</span>
    <span class="text-oav-knowledge">B</span>
    <span class="text-oav-success">A</span>
  </div>

  <p class="text-xs text-oav-muted">Last updated: {lastUpdated}</p>
</div>
```

**Gauge arc color gradient (optional enhancement):** For a more polished look, define a linearGradient in the SVG defs from `#ef4444` (0%) through `#f59e0b` (50%) to `#22c55e` (100%), and reference it as the stroke. The solid grade color is the simpler fallback.

**GSAP score animation:** On mount and on score change, GSAP tweens `stroke-dashoffset` — see Section 3.5.

---

### 2.7 SecurityTable (AgentSecurityTable)

**Purpose:** Tabular display of per-agent security grades in the Security Dashboard.

**Container:** `bg-oav-surface border border-oav-border rounded-xl overflow-hidden`

**Table structure:**
```
<table class="w-full">
  <thead>
    <tr class="bg-oav-bg/50 border-b border-oav-border">
      <th class="text-left text-xs text-oav-muted uppercase tracking-wider
                 font-medium px-4 py-2.5">Agent</th>
      <th class="text-center text-xs text-oav-muted uppercase tracking-wider
                 font-medium px-4 py-2.5 w-16">Grade</th>
      <th class="text-right text-xs text-oav-muted uppercase tracking-wider
                 font-medium px-4 py-2.5 w-24">Score</th>
      <th class="text-right text-xs text-oav-muted uppercase tracking-wider
                 font-medium px-4 py-2.5 w-24">Violations</th>
      <th class="text-right text-xs text-oav-muted uppercase tracking-wider
                 font-medium px-4 py-2.5 w-28 hidden md:table-cell">Last Violation</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-oav-border/50">
    <tr class="hover:bg-oav-surface-hover cursor-pointer transition-colors duration-100
               {grade === 'F' ? 'border-l-2 border-l-oav-error' : ''}
               {grade === 'D' ? 'border-l-2 border-l-oav-shield' : ''}">
      <!-- Agent name + avatar -->
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <AgentAvatar size="small" level={agent.level} />
          <span class="text-sm font-medium text-oav-text">{agent.name}</span>
        </div>
      </td>
      <!-- Grade badge -->
      <td class="px-4 py-3 text-center">
        <GradeBadge grade={grade} />
      </td>
      <!-- Score with inline bar -->
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-2">
          <div class="w-16 h-1.5 bg-oav-bg rounded-full overflow-hidden hidden sm:block">
            <div class="h-full rounded-full {gradeColorClass}"
                 style="width: {score}%" />
          </div>
          <span class="text-sm tabular-nums text-oav-text font-medium">{score}</span>
        </div>
      </td>
      <!-- Violations count -->
      <td class="px-4 py-3 text-right">
        <span class="{violations > 0 ? 'text-oav-error font-semibold' : 'text-oav-muted'}
                     text-sm tabular-nums">
          {violations}
        </span>
      </td>
      <!-- Last violation time -->
      <td class="px-4 py-3 text-right text-xs text-oav-muted tabular-nums
                 hidden md:table-cell">
        {lastViolation || '—'}
      </td>
    </tr>
  </tbody>
</table>
```

Score bar fill color uses `{gradeColorClass}`:
- Grade A: `bg-oav-success`
- Grade B: `bg-oav-knowledge`
- Grade C: `bg-oav-warning`
- Grade D: `bg-oav-shield`
- Grade F: `bg-oav-error`

---

### 2.8 GradeBadge

**Purpose:** Circular letter-grade badge used in the SecurityTable grade column and Security Detail panel. Reusable standalone component.

**Sizes:**

| Variant | Diameter | Text size | Usage |
|---------|----------|-----------|-------|
| `sm` | 24×24px (`w-6 h-6`) | `text-xs` | Table cell, compact lists |
| `md` | 32×32px (`w-8 h-8`) | `text-sm` | Summary stat cards |
| `lg` | 48×48px (`w-12 h-12`) | `text-lg` | Detail panel header |

**Structure (medium variant):**
```
<div class="w-8 h-8 rounded-full flex items-center justify-center
            font-bold border
            {bg-class} {text-class} {border-class}">
  {grade}  {/* A | B | C | D | F */}
</div>
```

State classes by grade (from Section 1.3):
- A: `bg-oav-success/20 text-oav-success border-oav-success/40`
- B: `bg-oav-knowledge/20 text-oav-knowledge border-oav-knowledge/40`
- C: `bg-oav-warning/20 text-oav-warning border-oav-warning/40`
- D: `bg-oav-shield/20 text-oav-shield border-oav-shield/40`
- F: `bg-oav-error/20 text-oav-error border-oav-error/40`

**Grade transition animation:** When a score change causes a grade letter to change (e.g. D → C), GSAP cross-fades the badge: scale 1.0→1.2→1.0 over 400ms, with color transitioning from old grade colors to new grade colors via GSAP. See Section 3.5.

---

### 2.9 ViolationTimeline

**Purpose:** Recharts `LineChart` showing violation count per hour over the last 24 hours. Placed at the bottom of the Security Dashboard.

**Container:** `bg-oav-surface border border-oav-border rounded-xl p-4`

**Chart configuration (Recharts):**
```jsx
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={hourlyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="#2d3748"   /* oav-border */
      vertical={false}
    />
    <XAxis
      dataKey="hour"
      tick={{ fill: '#94a3b8', fontSize: 10 }}  /* oav-muted */
      tickLine={false}
      axisLine={{ stroke: '#2d3748' }}
      tickFormatter={(h) => `${h}:00`}
    />
    <YAxis
      tick={{ fill: '#94a3b8', fontSize: 10 }}
      tickLine={false}
      axisLine={false}
      width={28}
      allowDecimals={false}
    />
    <Tooltip
      contentStyle={{
        background: '#1e2433',    /* oav-surface */
        border: '1px solid #2d3748',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#e2e8f0',
      }}
      formatter={(value) => [`${value} violations`, '']}
      labelFormatter={(h) => `${h}:00`}
    />
    <Line
      type="monotone"
      dataKey="violations"
      stroke="#ef4444"            /* oav-error */
      strokeWidth={2}
      dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
      activeDot={{ r: 5, fill: '#ef4444', stroke: '#1e2433', strokeWidth: 2 }}
    />
  </LineChart>
</ResponsiveContainer>
```

**Severity-colored dots enhancement:** When individual data points have a `maxSeverity` field, color each dot:
- `critical`: `fill: '#ef4444'` (oav-error)
- `high`: `fill: '#fb923c'` (oav-shield)
- `medium`: `fill: '#f59e0b'` (oav-warning)
- `low`: `fill: '#94a3b8'` (oav-muted)

Implement via a custom `<Dot>` shape component passed to Recharts `Line.dot`.

---

### 2.10 IntegrationConfigCard

**Purpose:** Per-product configuration card in `/settings?tab=integrations`. One card per integration (OpenTrace, OpenMesh, OpenMind, OpenShield).

**Container:** `bg-oav-surface border border-oav-border rounded-xl p-5 space-y-4`

**Full structure:**
```
<div class="bg-oav-surface border border-oav-border rounded-xl p-5 space-y-4">

  <!-- Header row: icon + product name + enable toggle -->
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-oav-bg border border-oav-border
                flex items-center justify-center shrink-0">
      {ProductIcon} {/* 18px, colored per product (see Section 4.1) */}
    </div>
    <div class="flex-1">
      <p class="text-sm font-semibold text-oav-text">{productName}</p>
      <IntegrationStatusBadge status={currentStatus} />
    </div>
    <!-- Toggle switch -->
    <button role="switch" aria-checked={enabled}
            class="relative w-11 h-6 rounded-full transition-colors duration-200
                   focus-visible:ring-2 focus-visible:ring-oav-accent
                   {enabled ? 'bg-oav-accent' : 'bg-oav-border'}">
      <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow
                   transition-transform duration-200
                   {enabled ? 'translate-x-5' : 'translate-x-0.5'}" />
    </button>
  </div>

  <!-- Divider -->
  <div class="border-t border-oav-border/50" />

  <!-- Base URL input -->
  <div class="space-y-1.5">
    <label class="text-xs text-oav-muted font-medium">Base URL</label>
    <input type="url" placeholder="http://opentrace:8000/api"
           class="w-full bg-oav-bg border border-oav-border rounded-lg
                  px-3 py-2 text-sm font-mono text-oav-text
                  placeholder:text-oav-muted/50
                  focus:border-oav-accent focus:ring-1 focus:ring-oav-accent
                  focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed" />
    <!-- Inline error message — shown on test failure -->
    {urlError &&
      <p class="text-xs text-oav-error mt-1">{urlError}</p>
    }
  </div>

  <!-- API Key input with eye toggle -->
  <div class="space-y-1.5">
    <label class="text-xs text-oav-muted font-medium">API Key</label>
    <div class="relative">
      <input type={showKey ? 'text' : 'password'}
             placeholder="sk-••••••••••••"
             autocomplete="off"
             class="w-full bg-oav-bg border border-oav-border rounded-lg
                    px-3 py-2 text-sm font-mono text-oav-text pr-10
                    placeholder:text-oav-muted/50
                    focus:border-oav-accent focus:ring-1 focus:ring-oav-accent
                    focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed" />
      <button onclick="toggleShowKey"
              class="absolute right-2 top-1/2 -translate-y-1/2
                     text-oav-muted hover:text-oav-text transition-colors p-1
                     focus-visible:ring-2 focus-visible:ring-oav-accent rounded">
        {showKey ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
      </button>
    </div>
  </div>

  <!-- Action buttons row -->
  <div class="flex items-center gap-3 pt-1">
    <!-- Test Connection button -->
    <button class="flex items-center gap-2 bg-oav-surface border border-oav-border
                   rounded-lg px-4 py-2 text-sm text-oav-text
                   hover:bg-oav-surface-hover transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:ring-2 focus-visible:ring-oav-accent
                   min-w-[120px]">
      {testing
        ? <><Loader2 class="w-4 h-4 animate-spin" /> Testing...</>
        : <><Plug class="w-4 h-4" /> Test Connection</>
      }
    </button>
    <!-- Save button -->
    <button class="bg-oav-accent text-white rounded-lg px-4 py-2 text-sm font-medium
                   hover:bg-oav-accent/90 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:ring-2 focus-visible:ring-oav-accent
                   focus-visible:ring-offset-2 focus-visible:ring-offset-oav-surface"
            disabled={!isDirty}>
      Save
    </button>
  </div>

</div>
```

**Test Connection button states:**

| State | Classes | Content |
|-------|---------|---------|
| Default | `bg-oav-surface border-oav-border text-oav-text hover:bg-oav-surface-hover` | `<Plug /> Test Connection` |
| Testing | `opacity-70 cursor-not-allowed` | `<Loader2 animate-spin /> Testing...` |
| Success | `border-oav-success/40 text-oav-success bg-oav-success/10` (auto-reverts after 3s) | `<CheckCircle2 /> Connected` |
| Failure | `border-oav-error/40 text-oav-error bg-oav-error/10` (persists until retry) | `<XCircle /> Failed` |

**Save button:** Disabled (`opacity-50 cursor-not-allowed pointer-events-none`) when `isDirty === false`. Enabled as soon as any input value differs from the saved state.

---

### 2.11 IntegrationStatusBadge

**Purpose:** Compact inline badge showing integration connection status. Used in IntegrationConfigCard headers and Trace/Mesh/Security status bars.

**Sizes:** Single size. `inline-flex items-center gap-1.5 text-xs font-medium`

**Structure:**
```
<span class="inline-flex items-center gap-1.5 text-xs font-medium">
  <StatusDot status={status} />  {/* see below */}
  <span class={textColorClass}>{labelText}</span>
  {lastCheck && <span class="text-oav-muted">({lastCheck})</span>}
</span>
```

**StatusDot per status:**

| Status | Dot element | Animation |
|--------|-------------|-----------|
| Connected | `<span class="w-2 h-2 rounded-full bg-oav-success" />` | None (static) |
| Degraded | `<span class="w-2 h-2 rounded-full bg-oav-warning animate-pulse" />` | CSS `animate-pulse` |
| Disconnected | `<span class="w-2 h-2 rounded-full bg-oav-error" />` | None |
| Not Configured | `<span class="w-2 h-2 rounded-full border border-dashed border-oav-muted" />` | None |

**Full label + color per status:**

| Status | Label | Text class |
|--------|-------|-----------|
| Connected | "Connected" | `text-oav-success` |
| Degraded | "Degraded" | `text-oav-warning` |
| Disconnected | "Disconnected" | `text-oav-error` |
| Not Configured | "Not Configured" | `text-oav-muted` |

---

### 2.12 SlideInPanel

**Purpose:** Right-side slide-in detail panel used for Span Detail (Traces), Entity Detail (Knowledge), Agent Security Detail (Security), and Agent Detail Sidebar (3D World). Unified component with slot-based content.

**Dimensions:** 360px wide for Span/Entity/Security Detail. 320px wide for 3D Agent Sidebar. Use `w-[360px]` and `w-80` respectively.

**Z-index:** `z-[45]` (same as Sprint 2 topology detail panel).

**Full structure:**
```
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/30 z-[44] backdrop-blur-[1px]"
     onclick="closePanel"
     aria-hidden="true" />

<!-- Panel -->
<div class="fixed top-0 right-0 h-full w-[360px] z-[45]
            bg-oav-surface-elevated border-l border-oav-border shadow-2xl
            flex flex-col overflow-hidden
            translate-x-0 transition-transform duration-300 ease-out
            {closed: 'translate-x-full'}"
     role="dialog"
     aria-modal="true"
     aria-label="{panelTitle}">

  <!-- Panel header -->
  <div class="flex items-center justify-between px-5 py-4
              border-b border-oav-border shrink-0">
    <h2 class="text-sm font-semibold text-oav-text truncate pr-2">
      {panelTitle}
    </h2>
    <button onclick="closePanel"
            aria-label="Close panel"
            class="text-oav-muted hover:text-oav-text transition-colors p-1
                   focus-visible:ring-2 focus-visible:ring-oav-accent rounded
                   shrink-0">
      <X class="w-4 h-4" />
    </button>
  </div>

  <!-- Scrollable content area -->
  <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
    {/* slot: panel-specific content */}
  </div>

</div>
```

**Animation:** GSAP controls the open/close (see Section 3.7). The `translate-x-full` / `translate-x-0` classes are toggled by GSAP rather than CSS class toggle, to allow motion-safe overrides.

**Backdrop:** `bg-black/30` — lighter than the Sprint 2 modal backdrop (`bg-black/50`) because the panel doesn't require full focus lock; the user can still interact with the page behind.

**Panel variants by content type:**

| Variant | Width | Surface | Key content sections |
|---------|-------|---------|---------------------|
| SpanDetail | `w-[360px]` | `oav-surface-elevated` | Span metadata table, attributes KV, "View in OpenTrace" link |
| EntityDetail | `w-[360px]` | `oav-surface-elevated` | Entity type badge, description, created date, relevance score, related agents row, related entities list |
| SecurityDetail | `w-[360px]` | `oav-surface-elevated` | GradeBadge (lg), score breakdown bars (3), violations list |
| AgentSidebar3D | `w-80` | `oav-surface-elevated` | AgentAvatar (lg), StatusBadge, LevelDisplay, XPBar, quick stats, View Profile link, Focus Camera button |

**Span Detail panel content spec:**
```
<!-- Span header -->
<div class="flex items-start gap-3 pb-4 border-b border-oav-border">
  <div class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 {spanColorClass}" />
  <div>
    <p class="text-sm font-semibold text-oav-text">{service}/{operation}</p>
    <p class="text-xs text-oav-muted mt-0.5">{duration_ms}ms · {status}</p>
  </div>
</div>

<!-- Metadata table -->
<dl class="space-y-2 text-xs">
  <div class="flex gap-2">
    <dt class="text-oav-muted w-24 shrink-0">Trace ID</dt>
    <dd class="font-mono text-oav-text break-all">{trace_id}</dd>
  </div>
  <div class="flex gap-2">
    <dt class="text-oav-muted w-24 shrink-0">Span ID</dt>
    <dd class="font-mono text-oav-text">{span_id}</dd>
  </div>
  <div class="flex gap-2">
    <dt class="text-oav-muted w-24 shrink-0">Parent</dt>
    <dd class="font-mono text-oav-text">{parent_span_id || '—'}</dd>
  </div>
  <div class="flex gap-2">
    <dt class="text-oav-muted w-24 shrink-0">Service</dt>
    <dd class="text-oav-text">{service}</dd>
  </div>
  <div class="flex gap-2">
    <dt class="text-oav-muted w-24 shrink-0">Status</dt>
    <dd class="{status === 'ERROR' ? 'text-oav-error' : 'text-oav-success'} font-medium">
      {status}
    </dd>
  </div>
</dl>

<!-- Attributes section -->
<div>
  <h3 class="text-xs text-oav-muted uppercase tracking-wider font-medium mb-2">
    Attributes
  </h3>
  <div class="bg-oav-bg rounded-lg p-3 space-y-1">
    {attributes.map(([key, value]) => (
      <div class="flex gap-2 text-xs">
        <span class="text-oav-accent font-mono shrink-0">{key}:</span>
        <span class="text-oav-success font-mono break-all">{value}</span>
      </div>
    ))}
  </div>
</div>

<!-- External link -->
<a href="{OPENTRACE_BASE_URL}/traces/{trace_id}"
   target="_blank" rel="noopener noreferrer"
   class="inline-flex items-center gap-1.5 text-sm text-oav-accent hover:underline">
  View in OpenTrace
  <ExternalLink class="w-3 h-3" />
</a>
```

---

### 2.13 FallbackBanner (Generic)

**Purpose:** Reusable warning/info banner for integration unavailability. Used at the top of Trace Explorer, Mesh Topology, and Knowledge Graph when the partner product is unreachable.

The `FallbackBanner` used in the 3D viewer (Section 2.1.4) uses a `bg-oav-3d/10 border-oav-3d/30` color scheme. The generic integration fallback uses `oav-warning` as the accent:

```
<div class="flex items-start gap-3 bg-oav-warning/10 border border-oav-warning/30
            rounded-xl px-4 py-3 text-sm"
     role="alert">
  <AlertTriangle class="w-4 h-4 text-oav-warning shrink-0 mt-0.5" />
  <div class="flex-1">
    <p class="text-oav-text font-medium">{productName} connection unavailable.</p>
    <p class="text-oav-muted text-xs mt-0.5">{fallbackDescription}</p>
    <a href="/settings?tab=integrations"
       class="text-oav-warning text-xs hover:underline mt-1 inline-block font-medium">
      Configure {productName} →
    </a>
  </div>
</div>
```

For the Knowledge Graph empty state (no local fallback), the banner variant becomes a full centered empty state:
```
<div class="flex flex-col items-center justify-center h-64 text-center gap-3">
  <BookOpen class="w-12 h-12 text-oav-muted" />
  <p class="text-sm font-medium text-oav-text">OpenMind connection unavailable.</p>
  <p class="text-xs text-oav-muted max-w-xs">
    Knowledge graph requires OpenMind to be running.
  </p>
  <a href="/settings?tab=integrations"
     class="text-oav-accent text-sm hover:underline">
    Configure OpenMind →
  </a>
</div>
```

---

### 2.14 CLIOutputPreview (Optional / Sprint 3 Bonus)

**Purpose:** Visual treatment for terminal output blocks in the CLI plugin documentation or any in-app CLI log viewer. Styled to match the `rich` Python library's visual conventions.

**Container:**
```
<div class="bg-[#0f1117] border border-oav-border rounded-xl overflow-hidden
            font-mono text-xs">
  <!-- Terminal chrome bar -->
  <div class="flex items-center gap-2 bg-[#1e2433] border-b border-oav-border
              px-4 py-2">
    <!-- Traffic light dots -->
    <span class="w-3 h-3 rounded-full bg-oav-error/60" />
    <span class="w-3 h-3 rounded-full bg-oav-warning/60" />
    <span class="w-3 h-3 rounded-full bg-oav-success/60" />
    <span class="text-oav-muted text-[10px] ml-2 select-none">
      oav-cli
    </span>
  </div>
  <!-- Output body -->
  <div class="p-4 space-y-0.5 leading-5">
    {/* Token-colored output lines */}
  </div>
</div>
```

**Token color conventions (matching `rich` defaults adapted to OAV palette):**

| Token type | Color class | Hex |
|-----------|------------|-----|
| Command prompt (`$`) | `text-oav-success` | `#22c55e` |
| Command text | `text-oav-text` | `#e2e8f0` |
| String values | `text-oav-xp` | `#06b6d4` (cyan) |
| Integer / numeric values | `text-oav-purple` | `#a855f7` |
| Boolean `true` | `text-oav-success` | `#22c55e` |
| Boolean `false` / errors | `text-oav-error` | `#ef4444` |
| Key names in tables | `text-oav-accent` | `#3b82f6` |
| Timestamps / metadata | `text-oav-muted` | `#94a3b8` |
| Panel borders (ASCII box) | `text-oav-border` | `#2d3748` |
| Warning text | `text-oav-warning` | `#f59e0b` |
| Table header text | `text-oav-gold font-semibold` | `#eab308` |

---

## 3. Animation Specs

All GSAP animations must be guarded with the prefers-reduced-motion check from Sprint 2 (Section 5.8 of Sprint 2 design system). All timings below assume `prefersReducedMotion === false`. When true, apply final state instantly via `gsap.set()`.

---

### 3.1 3D Viewer Connection Sequence

**Trigger:** User navigates to `/world3d` and `UE5_ENABLED=true`.

```javascript
// Phase 1: Loading overlay entrance (instant, already visible on mount)

// Phase 2: Progress bar animation as connection progresses
// Called by WebRTC state machine at each stage
function advanceUE5Progress(stagePct: number, stepLabel: string) {
  gsap.to('#ue5-progress-bar', {
    width: `${stagePct}%`,
    duration: 0.4,
    ease: 'power2.out',
  });
  document.getElementById('ue5-connect-step').textContent = stepLabel;
}

// Phase 3: Loading overlay dismiss on stream ready
function dismissUE5LoadingOverlay(overlayEl: HTMLElement) {
  gsap.to(overlayEl, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => overlayEl.remove(),
  });
}

// FallbackBanner entrance (when UE5 unavailable)
function showFallbackBanner(bannerEl: HTMLElement) {
  gsap.from(bannerEl, {
    y: -12,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  });
}

// FallbackBanner dismiss
function dismissFallbackBanner(bannerEl: HTMLElement) {
  gsap.to(bannerEl, {
    y: -12,
    opacity: 0,
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => bannerEl.remove(),
  });
}
```

**Reduced motion:** `advanceUE5Progress` sets width instantly (no tween). Overlay removed with `opacity: 0` instantly. Banner appears/disappears instantly.

---

### 3.2 Trace Waterfall Expand (Accordion)

**Trigger:** User clicks the expand chevron on a trace row.

```javascript
function expandTraceWaterfall(waterfallEl: HTMLElement, chevronEl: HTMLElement) {
  // Record natural height
  const naturalHeight = waterfallEl.scrollHeight;

  // Set initial collapsed state
  gsap.set(waterfallEl, { height: 0, opacity: 0, overflow: 'hidden' });

  // Animate open
  gsap.timeline()
    .to(waterfallEl, {
      height: naturalHeight,
      duration: 0.25,
      ease: 'power2.out',
    })
    .to(waterfallEl, {
      opacity: 1,
      duration: 0.15,
      ease: 'power2.out',
    }, 0.1)
    .set(waterfallEl, { height: 'auto', overflow: 'visible' });

  // Rotate chevron
  gsap.to(chevronEl, {
    rotation: 180,
    duration: 0.2,
    ease: 'power2.out',
  });
}

function collapseTraceWaterfall(waterfallEl: HTMLElement, chevronEl: HTMLElement) {
  gsap.timeline()
    .to(waterfallEl, {
      opacity: 0,
      duration: 0.1,
      ease: 'power2.in',
    })
    .to(waterfallEl, {
      height: 0,
      duration: 0.2,
      ease: 'power2.in',
    }, 0.05)
    .set(waterfallEl, { display: 'none' });

  gsap.to(chevronEl, {
    rotation: 0,
    duration: 0.2,
    ease: 'power2.out',
  });
}
```

**Reduced motion:** Set height to `auto` and opacity to `1` instantly on expand. Set `display: none` instantly on collapse. Chevron rotation instant.

---

### 3.3 Mesh Topology Live Updates

**Node pulse on update (edge_updated or node_stats_changed event):**
```javascript
function pulseNode(nodeEl: HTMLElement) {
  gsap.timeline()
    .to(nodeEl, {
      boxShadow: '0 0 0 4px rgba(52, 211, 153, 0.5)',  /* oav-mesh glow */
      duration: 0.15,
      ease: 'power2.out',
    })
    .to(nodeEl, {
      boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)',
      duration: 0.45,
      ease: 'power2.out',
    });
}
```

**Edge flash on message burst:**
```javascript
function flashEdge(edgePathEl: SVGPathElement) {
  gsap.timeline()
    .to(edgePathEl, { opacity: 1.0, duration: 0.05 })
    .to(edgePathEl, { opacity: 0.6, duration: 0.25, ease: 'power2.out' });
}
```

**New node entrance (node_added event):**
```javascript
function enterNode(nodeEl: HTMLElement) {
  gsap.from(nodeEl, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: 'back.out(1.4)',
  });
}
```

**Node disconnection (node_removed / status=disconnected event):**
```javascript
function disconnectNode(nodeEl: HTMLElement) {
  gsap.to(nodeEl, {
    opacity: 0.4,
    duration: 0.3,
    ease: 'power2.out',
  });
  // CSS class swap for dashed border happens synchronously
  nodeEl.classList.add('border-dashed');
  nodeEl.classList.remove('border-solid');
}
```

**Reduced motion:** All GSAP durations set to 0. Node state changes apply instantly.

---

### 3.4 Knowledge Graph Search Highlight

**Trigger:** 300ms debounce after user types in search box.

```javascript
function highlightSearchResults(
  allNodeEls: HTMLElement[],
  matchingIds: Set<string>,
) {
  allNodeEls.forEach((nodeEl) => {
    const isMatch = matchingIds.has(nodeEl.dataset.entityId);
    gsap.to(nodeEl, {
      opacity: isMatch ? 1.0 : 0.2,
      scale: isMatch ? 1.05 : 1.0,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
}

// Matching node border brightening (CSS filter approach)
// Add to matching node's wrapper: filter: brightness(1.25)
// Applied via GSAP:
gsap.to(matchingNodeEl, {
  filter: 'brightness(1.25)',
  duration: 0.3,
  ease: 'power2.out',
});

// Clear search (on input blur or clear button)
function clearSearchHighlight(allNodeEls: HTMLElement[]) {
  gsap.to(allNodeEls, {
    opacity: 1.0,
    scale: 1.0,
    filter: 'brightness(1)',
    duration: 0.3,
    ease: 'power2.out',
    stagger: 0.01,
  });
}
```

**Knowledge graph pan/zoom to entity (on related entity click):**
```javascript
// Uses ReactFlow's fitView with specific node ID
// GSAP coordinates the panel content update after pan completes
function panToEntity(entityId: string, reactFlowInstance: ReactFlowInstance) {
  reactFlowInstance.fitView({
    nodes: [{ id: entityId }],
    duration: 500,
    padding: 0.3,
  });
  // Panel update happens immediately (no animation delay needed)
}
```

**Reduced motion:** All GSAP set to instant. ReactFlow fitView `duration: 0`.

---

### 3.5 Security Score Change

**Trigger:** New compliance data arrives from OpenShield (polling every 30s).

**Gauge arc animation:**
```javascript
function animateGauge(gaugeArcEl: SVGPathElement, newScore: number) {
  const totalDasharray = 251.3; // π × 80
  const targetOffset = totalDasharray * (1 - newScore / 100);

  gsap.to(gaugeArcEl, {
    strokeDashoffset: targetOffset,
    duration: 1.2,
    ease: 'power2.out',
  });

  // Also animate the score text counter
  const counter = { value: previousScore };
  gsap.to(counter, {
    value: newScore,
    duration: 1.0,
    ease: 'power2.out',
    onUpdate: () => {
      scoreTextEl.textContent = Math.round(counter.value).toString();
    },
  });
}
```

**Grade badge color transition on grade change (e.g. D→C):**
```javascript
function transitionGradeBadge(badgeEl: HTMLElement, newGrade: string) {
  const tl = gsap.timeline();
  tl.to(badgeEl, {
    scale: 1.2,
    duration: 0.2,
    ease: 'power2.out',
  })
  .call(() => {
    // Swap classes at peak scale
    badgeEl.className = getGradeBadgeClasses(newGrade);
    badgeEl.textContent = newGrade;
  })
  .to(badgeEl, {
    scale: 1.0,
    duration: 0.2,
    ease: 'power2.in',
  });
}
```

**Violation toast notification** (real-time new violation):
```javascript
// Same GSAP params as AchievementToast from Sprint 2 Section 5.7
gsap.from(violationToastEl, {
  y: 20,
  scale: 0.9,
  opacity: 0,
  duration: 0.35,
  ease: 'back.out(1.5)',
});
```

**Reduced motion:** Gauge arc and counter update instantly. Grade badge swaps class without scale animation. Toast appears instantly.

---

### 3.6 Integration Status Change

**Trigger:** Polling result changes status (Connected → Disconnected, etc.) or user saves new config.

```javascript
function transitionIntegrationStatus(
  dotEl: HTMLElement,
  labelEl: HTMLElement,
  newStatus: 'connected' | 'degraded' | 'disconnected' | 'not-configured',
) {
  const colors: Record<string, string> = {
    connected:      '#22c55e',
    degraded:       '#f59e0b',
    disconnected:   '#ef4444',
    'not-configured': '#94a3b8',
  };

  gsap.timeline()
    // Cross-fade dot color
    .to(dotEl, { opacity: 0, duration: 0.15 })
    .call(() => {
      dotEl.style.backgroundColor = colors[newStatus];
      // Swap dot classes for dashed border on not-configured
      applyStatusDotClasses(dotEl, newStatus);
      labelEl.textContent = getStatusLabel(newStatus);
      labelEl.className = getStatusLabelClass(newStatus);
    })
    .to(dotEl, { opacity: 1, duration: 0.2, ease: 'power2.out' });
}
```

The icon swap (Circle → CircleX, etc.) is handled by a React conditional render triggered by the status state update. No explicit GSAP needed for icon since React re-renders the element, and the new icon can use `animate-fade-in-up` from the existing Sprint 2 keyframe.

**Reduced motion:** Color and label update instantly. No tween.

---

### 3.7 Slide-In Panel

**Trigger:** User clicks a trace row span bar, a ReactFlow node, or a security table row.

```javascript
function openSlideInPanel(panelEl: HTMLElement, backdropEl: HTMLElement) {
  // Ensure panel starts off-screen before animating
  gsap.set(panelEl, { x: '100%' });
  gsap.set(backdropEl, { opacity: 0, display: 'block' });

  gsap.timeline()
    .to(backdropEl, {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out',
    })
    .to(panelEl, {
      x: '0%',
      duration: 0.3,
      ease: 'power2.out',
    }, 0.05);
}

function closeSlideInPanel(panelEl: HTMLElement, backdropEl: HTMLElement) {
  gsap.timeline()
    .to(panelEl, {
      x: '100%',
      duration: 0.25,
      ease: 'power2.in',
    })
    .to(backdropEl, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        backdropEl.style.display = 'none';
      },
    }, 0.05);
}
```

**Panel content update (clicking a different span/node while panel is open):**
```javascript
function updatePanelContent(
  panelEl: HTMLElement,
  contentEl: HTMLElement,
  newContent: () => void,
) {
  gsap.timeline()
    .to(contentEl, { opacity: 0, duration: 0.1, ease: 'power2.in' })
    .call(newContent)  // update React state / render new content
    .to(contentEl, { opacity: 1, duration: 0.15, ease: 'power2.out' });
}
```

**Reduced motion:** Panel appears at `x: 0%` instantly. Backdrop appears instantly. Close: both disappear instantly.

---

## 4. Icon Assignments

All icons from `lucide-react` (v0.x as used in Sprint 2). Sizes follow the Sprint 2 convention: `w-4 h-4` (16px) for inline/nav icons, `w-5 h-5` (20px) for section headers, `w-6 h-6` (24px) for empty state/hero icons.

### 4.1 Integration Product Icons

| Product | Icon | Color when active |
|---------|------|------------------|
| OpenTrace | `Activity` | `text-oav-trace` |
| OpenMesh | `Share2` | `text-oav-mesh` |
| OpenMind / Knowledge Graph | `BookOpen` | `text-oav-knowledge` |
| OpenShield / Security | `Shield` | `text-oav-shield` |

These icons appear in: IntegrationConfigCard headers, sidebar navigation sub-items, Integration status bar chips, and empty state illustrations.

**IntegrationConfigCard icon container:** `w-9 h-9 rounded-lg bg-oav-bg border border-oav-border flex items-center justify-center`. Icon inside: 18px (`w-[18px] h-[18px]`) in the product's active color.

### 4.2 Navigation Icons (New Sidebar Entries)

| Nav Item | Icon | Collapsed sidebar tooltip |
|----------|------|--------------------------|
| World 3D | `Box` | "3D World" |
| Integrations group | `Puzzle` | "Integrations" |
| Traces sub-item | `Activity` | "Trace Explorer" |
| Mesh sub-item | `Share2` | "Mesh Topology" |
| Knowledge sub-item | `BookOpen` | "Knowledge Graph" |
| Security sub-item | `Shield` | "Security" |

**World 3D nav item badge:** When on desktop, show a small "Desktop" chip: `text-[9px] px-1 py-0 rounded bg-oav-3d/20 text-oav-3d font-medium` rendered inline after the label text. On mobile, this nav item is hidden (redirect logic in router).

**Integrations group collapsed flyout:** When the sidebar is in the `w-16` collapsed state, the `Puzzle` icon shows a flyout on hover — a `bg-oav-surface border border-oav-border rounded-xl shadow-lg p-2 ml-2 min-w-[160px]` popover with the 4 sub-items listed vertically.

**Integrations group expand/collapse chevron (expanded sidebar):**
```
<ChevronDown class="w-4 h-4 text-oav-muted transition-transform duration-200
                    {open ? 'rotate-180' : ''}" />
```

### 4.3 Entity Type Icons (Knowledge Graph Nodes)

| Entity Type | Icon | Color |
|-------------|------|-------|
| Concept | `Lightbulb` | `text-oav-knowledge` |
| Fact | `CheckCircle2` | `text-oav-success` |
| Agent Memory | `Brain` | `text-oav-purple` |
| Embedding | `Hexagon` | `text-oav-shield` |

These icons appear inside the node shapes (Section 2.5) and in the legend bar at the top of the Knowledge Graph page.

**Entity type legend bar (inside search/legend overlay):**
```
<div class="flex items-center gap-4 flex-wrap">
  {[
    { type: 'Concept',      Icon: Lightbulb,    color: 'text-oav-knowledge', bg: 'bg-oav-knowledge/10', label: 'Concept' },
    { type: 'Fact',         Icon: CheckCircle2, color: 'text-oav-success',   bg: 'bg-oav-success/10',   label: 'Fact' },
    { type: 'Agent Memory', Icon: Brain,        color: 'text-oav-purple',    bg: 'bg-oav-purple/10',    label: 'Memory' },
    { type: 'Embedding',    Icon: Hexagon,      color: 'text-oav-shield',    bg: 'bg-oav-shield/10',    label: 'Embedding' },
  ].map(({ Icon, color, bg, label }) => (
    <span class="inline-flex items-center gap-1.5 text-xs text-oav-muted">
      <span class={`w-4 h-4 rounded flex items-center justify-center ${bg}`}>
        <Icon class={`w-3 h-3 ${color}`} />
      </span>
      {label}
    </span>
  ))}
</div>
```

### 4.4 Grade Icons (Security)

Security grade badges use letter text, not icons. However, for the overall compliance score card on the Security Dashboard summary row, a contextual icon is shown:

| Score range | Icon | Color |
|-------------|------|-------|
| 90–100 (A) | `ShieldCheck` | `text-oav-success` |
| 80–89 (B) | `ShieldCheck` | `text-oav-knowledge` |
| 70–79 (C) | `Shield` | `text-oav-warning` |
| 60–69 (D) | `ShieldAlert` | `text-oav-shield` |
| 0–59 (F) | `ShieldX` | `text-oav-error` |

Used in the summary stat card header for the compliance score card only.

### 4.5 Connection Status Icons

Used in IntegrationStatusBadge and IntegrationConfigCard status line:

| Status | Icon | Size |
|--------|------|------|
| Connected | `Circle` (filled via CSS fill) | `w-2 h-2` |
| Degraded | `CircleDashed` | `w-2 h-2` |
| Disconnected | `CircleX` | `w-2 h-2` |
| Not Configured | `CircleDot` | `w-2 h-2` |

For the 2px dot versions (no icon, just colored circle), use `<span>` with background class as specified in Section 2.11. The lucide icons are used in the larger IntegrationStatusBadge contexts (e.g., inside the IntegrationConfigCard header where there is more space).

### 4.6 3D Viewer Icons

| Purpose | Icon | Color |
|---------|------|-------|
| 3D viewer active / sidebar "World 3D" | `Box` | `text-oav-3d` |
| Camera controls overlay info | `Mouse` | `text-oav-muted` |
| Focus Camera button | `Focus` | `text-oav-text` |
| FPS / stream status | `Video` | `text-oav-muted` |
| Ping / latency | `Wifi` | `text-oav-muted` |

---

## 5. Tailwind Config Extension

The following block contains all Sprint 3 additions to `tailwind.config.js`. Add to the `theme.extend` section alongside the existing Sprint 2 tokens. Do not remove or modify any Sprint 2 entries.

```javascript
// ADD to theme.extend.colors (alongside existing Sprint 2 colors):
colors: {
  // ... existing Sprint 2 colors unchanged ...

  // Sprint 3 new color tokens
  'oav-trace':            '#f472b6',
  'oav-mesh':             '#34d399',
  'oav-knowledge':        '#60a5fa',
  'oav-shield':           '#fb923c',
  'oav-3d':               '#818cf8',
  'oav-surface-elevated': '#232d3f',
},

// ADD to theme.extend.keyframes (alongside existing Sprint 2 keyframes):
keyframes: {
  // ... existing Sprint 2 keyframes unchanged ...

  // 3D viewer: loading overlay fade-out
  'ue5-overlay-out': {
    from: { opacity: '1' },
    to:   { opacity: '0', pointerEvents: 'none' },
  },

  // Fallback banner: slide down + fade in
  'banner-enter': {
    from: { opacity: '0', transform: 'translateY(-12px)' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },

  // Waterfall: span bar entrance (staggered per span)
  'span-bar-enter': {
    from: { opacity: '0', transform: 'scaleX(0)', transformOrigin: 'left center' },
    to:   { opacity: '1', transform: 'scaleX(1)', transformOrigin: 'left center' },
  },

  // Mesh: node entrance
  'mesh-node-enter': {
    from: { opacity: '0', transform: 'scale(0.8)' },
    to:   { opacity: '1', transform: 'scale(1)' },
  },

  // Mesh: node pulse glow (ring flash on update)
  'mesh-node-pulse': {
    '0%':   { boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)' },
    '25%':  { boxShadow: '0 0 0 4px rgba(52, 211, 153, 0.5)' },
    '100%': { boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)' },
  },

  // Knowledge graph: search dim (non-matching nodes)
  'kg-node-dim': {
    from: { opacity: '1' },
    to:   { opacity: '0.2' },
  },

  // Security gauge arc fill (CSS fallback when GSAP unavailable)
  'gauge-fill': {
    from: { strokeDashoffset: '251.3' },
    to:   { strokeDashoffset: 'var(--gauge-offset, 125.65)' },
  },

  // Grade badge: pop on grade change
  'grade-pop': {
    '0%':   { transform: 'scale(1)' },
    '50%':  { transform: 'scale(1.2)' },
    '100%': { transform: 'scale(1)' },
  },

  // Slide-in panel: from right
  'panel-slide-in': {
    from: { transform: 'translateX(100%)' },
    to:   { transform: 'translateX(0%)' },
  },

  // Slide-in panel: exit to right
  'panel-slide-out': {
    from: { transform: 'translateX(0%)' },
    to:   { transform: 'translateX(100%)' },
  },

  // Integration status change: dot crossfade
  'status-dot-fade': {
    '0%':   { opacity: '1' },
    '40%':  { opacity: '0' },
    '60%':  { opacity: '0' },
    '100%': { opacity: '1' },
  },

  // Violation toast entrance (same as alert-prepend but starts from bottom)
  'violation-toast-in': {
    from: { opacity: '0', transform: 'translateY(16px) scale(0.92)' },
    to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
  },

  // Score counter roll-up (CSS fallback for GSAP count animation)
  'counter-roll': {
    from: { transform: 'translateY(4px)', opacity: '0' },
    to:   { transform: 'translateY(0)', opacity: '1' },
  },
},

// ADD to theme.extend.animation (alongside existing Sprint 2 animations):
animation: {
  // ... existing Sprint 2 animations unchanged ...

  'ue5-overlay-out':   'ue5-overlay-out 0.5s ease-out forwards',
  'banner-enter':      'banner-enter 0.3s ease-out forwards',
  'span-bar-enter':    'span-bar-enter 0.25s ease-out forwards',
  'mesh-node-enter':   'mesh-node-enter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
  'mesh-node-pulse':   'mesh-node-pulse 0.6s ease-out forwards',
  'kg-node-dim':       'kg-node-dim 0.3s ease-in-out forwards',
  'grade-pop':         'grade-pop 0.4s ease-in-out forwards',
  'panel-slide-in':    'panel-slide-in 0.3s ease-out forwards',
  'panel-slide-out':   'panel-slide-out 0.25s ease-in forwards',
  'status-dot-fade':   'status-dot-fade 0.35s ease-in-out forwards',
  'violation-toast-in':'violation-toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
  'counter-roll':      'counter-roll 0.2s ease-out forwards',
},

// ADD to theme.extend.boxShadow (alongside existing Sprint 2 shadows):
boxShadow: {
  // ... existing Sprint 2 box shadows unchanged ...

  'glow-mesh':       '0 0 12px rgba(52, 211, 153, 0.4)',
  'glow-mesh-ring':  '0 0 0 4px rgba(52, 211, 153, 0.35)',
  'glow-trace':      '0 0 10px rgba(244, 114, 182, 0.35)',
  'glow-knowledge':  '0 0 10px rgba(96, 165, 250, 0.35)',
  'glow-3d':         '0 0 12px rgba(129, 140, 248, 0.4)',
  'panel-left':      '-4px 0 24px rgba(0, 0, 0, 0.4)',
},
```

**Complete updated `tailwind.config.js` structure** (showing the full file with Sprint 3 additions merged in):

```javascript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core tokens (Sprint 1)
        'oav-bg':               '#0f1117',
        'oav-surface':          '#1e2433',
        'oav-border':           '#2d3748',
        'oav-text':             '#e2e8f0',
        'oav-muted':            '#94a3b8',
        'oav-accent':           '#3b82f6',
        'oav-success':          '#22c55e',
        'oav-warning':          '#f59e0b',
        'oav-error':            '#ef4444',
        'oav-purple':           '#a855f7',
        // Sprint 2 additions
        'oav-gold':             '#eab308',
        'oav-xp':               '#06b6d4',
        'oav-surface-hover':    '#283040',
        'oav-surface-active':   '#2a3650',
        // Sprint 3 additions
        'oav-trace':            '#f472b6',
        'oav-mesh':             '#34d399',
        'oav-knowledge':        '#60a5fa',
        'oav-shield':           '#fb923c',
        'oav-3d':               '#818cf8',
        'oav-surface-elevated': '#232d3f',
      },
      keyframes: {
        // Sprint 2 keyframes (unchanged)
        'xp-gain':        { '0%': { opacity: '1', transform: 'translateY(0px) scale(1)' }, '60%': { opacity: '1', transform: 'translateY(-20px) scale(1.1)' }, '100%': { opacity: '0', transform: 'translateY(-40px) scale(0.9)' } },
        'level-pulse':    { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
        'badge-glow':     { '0%, 100%': { boxShadow: '0 0 0 0 transparent' }, '50%': { boxShadow: '0 0 12px 4px rgba(234, 179, 8, 0.25)' } },
        'shimmer':        { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'alert-prepend':  { from: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }, to: { backgroundColor: 'transparent' } },
        'edge-fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'status-ping':    { '0%': { transform: 'scale(1)', opacity: '1' }, '70%': { transform: 'scale(2)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '0' } },
        'toast-in':       { from: { opacity: '0', transform: 'translateY(12px) scale(0.92)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'confetti-fall':  { from: { transform: 'translateY(0) rotate(0deg)', opacity: '1' }, to: { transform: 'translateY(60px) rotate(180deg)', opacity: '0' } },
        'rank-highlight': { from: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }, to: { backgroundColor: 'transparent' } },
        'xp-flash':       { '0%': { opacity: '1', transform: 'translateY(0px)' }, '100%': { opacity: '0', transform: 'translateY(-8px)' } },
        'badge-slide-in': { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'screen-flash':   { '0%': { opacity: '0.3' }, '100%': { opacity: '0' } },
        'fade-in-up':     { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        // Sprint 3 keyframes
        'ue5-overlay-out':    { from: { opacity: '1' }, to: { opacity: '0', pointerEvents: 'none' } },
        'banner-enter':       { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'span-bar-enter':     { from: { opacity: '0', transform: 'scaleX(0)', transformOrigin: 'left center' }, to: { opacity: '1', transform: 'scaleX(1)', transformOrigin: 'left center' } },
        'mesh-node-enter':    { from: { opacity: '0', transform: 'scale(0.8)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'mesh-node-pulse':    { '0%': { boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)' }, '25%': { boxShadow: '0 0 0 4px rgba(52, 211, 153, 0.5)' }, '100%': { boxShadow: '0 0 0 0px rgba(52, 211, 153, 0)' } },
        'kg-node-dim':        { from: { opacity: '1' }, to: { opacity: '0.2' } },
        'gauge-fill':         { from: { strokeDashoffset: '251.3' }, to: { strokeDashoffset: 'var(--gauge-offset, 125.65)' } },
        'grade-pop':          { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
        'panel-slide-in':     { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0%)' } },
        'panel-slide-out':    { from: { transform: 'translateX(0%)' }, to: { transform: 'translateX(100%)' } },
        'status-dot-fade':    { '0%': { opacity: '1' }, '40%': { opacity: '0' }, '60%': { opacity: '0' }, '100%': { opacity: '1' } },
        'violation-toast-in': { from: { opacity: '0', transform: 'translateY(16px) scale(0.92)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'counter-roll':       { from: { transform: 'translateY(4px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        // Sprint 2 animations (unchanged)
        'xp-gain':        'xp-gain 1.5s ease-out forwards',
        'level-pulse':    'level-pulse 1.5s ease-in-out infinite',
        'badge-glow':     'badge-glow 500ms ease-in-out',
        'shimmer':        'shimmer 2s linear infinite',
        'alert-prepend':  'alert-prepend 2s ease-out forwards',
        'edge-fade-in':   'edge-fade-in 300ms ease-out',
        'status-ping':    'status-ping 1.2s ease-out infinite',
        'toast-in':       'toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'confetti-fall':  'confetti-fall 2s ease-in forwards',
        'rank-highlight': 'rank-highlight 1500ms ease-out forwards',
        'xp-flash':       'xp-flash 1.5s ease-out forwards',
        'badge-slide-in': 'badge-slide-in 0.4s ease-out forwards',
        'screen-flash':   'screen-flash 500ms ease-out forwards',
        'fade-in-up':     'fade-in-up 0.3s ease-out forwards',
        // Sprint 3 animations
        'ue5-overlay-out':    'ue5-overlay-out 0.5s ease-out forwards',
        'banner-enter':       'banner-enter 0.3s ease-out forwards',
        'span-bar-enter':     'span-bar-enter 0.25s ease-out forwards',
        'mesh-node-enter':    'mesh-node-enter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'mesh-node-pulse':    'mesh-node-pulse 0.6s ease-out forwards',
        'kg-node-dim':        'kg-node-dim 0.3s ease-in-out forwards',
        'grade-pop':          'grade-pop 0.4s ease-in-out forwards',
        'panel-slide-in':     'panel-slide-in 0.3s ease-out forwards',
        'panel-slide-out':    'panel-slide-out 0.25s ease-in forwards',
        'status-dot-fade':    'status-dot-fade 0.35s ease-in-out forwards',
        'violation-toast-in': 'violation-toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'counter-roll':       'counter-roll 0.2s ease-out forwards',
      },
      zIndex: {
        '44': '44',   // SlideInPanel backdrop (Sprint 3)
        '45': '45',   // Detail panels (Sprint 2, carried forward)
        '60': '60',
        '70': '70',
        '80': '80',
      },
      boxShadow: {
        // Sprint 2 shadows (unchanged)
        'glow-gold-sm':  '0 0 12px rgba(234, 179, 8, 0.376)',
        'glow-gold-md':  '0 0 16px rgba(234, 179, 8, 0.502)',
        'glow-gold-lg':  '0 0 24px rgba(234, 179, 8, 0.627)',
        'glow-accent':   '0 0 12px rgba(59, 130, 246, 0.4)',
        'glow-error':    '0 0 12px rgba(239, 68, 68, 0.4)',
        // Sprint 3 shadows
        'glow-mesh':       '0 0 12px rgba(52, 211, 153, 0.4)',
        'glow-mesh-ring':  '0 0 0 4px rgba(52, 211, 153, 0.35)',
        'glow-trace':      '0 0 10px rgba(244, 114, 182, 0.35)',
        'glow-knowledge':  '0 0 10px rgba(96, 165, 250, 0.35)',
        'glow-3d':         '0 0 12px rgba(129, 140, 248, 0.4)',
        'panel-left':      '-4px 0 24px rgba(0, 0, 0, 0.4)',
      },
      transitionDuration: {
        '700':  '700ms',
        '1500': '1500ms',
        '1200': '1200ms',   // Sprint 3: gauge arc animation
        '300':  '300ms',    // explicitly registered for knowledge graph transitions
      },
    },
  },
  plugins: [],
};
```

---

## 6. Responsive Adaptations

Sprint 3 follows the Sprint 2 mobile-first philosophy. All new pages are primarily designed for desktop (1280px+). Mobile and tablet adaptations are specified below.

### 6.1 3D World View (`/world3d`)

**Desktop (≥ 1024px):** Full implementation as specified.

**Tablet (768–1023px):** Display the 3D viewer but reduce the Agent Detail sidebar to overlay mode (`fixed inset-y-0 right-0 w-full max-w-[360px]`) rather than inline push. Status bar text is slightly smaller (`text-[10px]`).

**Mobile (< 768px):** Auto-redirect to `/world` (2D canvas). The redirect is handled in the router:
```javascript
// In /world3d route component:
if (isMobile) { navigate('/world', { replace: true }); return null; }
```
The 3D nav item in the mobile bottom tab bar "More" menu shows a "(Desktop only)" suffix in `text-oav-muted`.

### 6.2 Trace Explorer (`/traces`)

**Desktop:** Full two-column layout (search + list, 8-column waterfall table).

**Tablet (768–1023px):**
- Search bar: `flex-col` stack instead of `flex-wrap`. Filter dropdowns go full-width.
- Trace list table: Hide "Spans" and "Root Service" columns (`hidden sm:table-cell`). Show only: Trace ID, Operation, Duration, Status.
- Span detail panel: `fixed inset-y-0 right-0 w-full max-w-[360px]` overlay.

**Mobile (< 768px):**
- Search bar collapses to a single "Filter" button that opens a bottom sheet with all filters.
- Trace list renders as cards instead of a table:
  ```
  <div class="bg-oav-surface border border-oav-border rounded-lg p-3 space-y-1">
    <div class="flex justify-between">
      <span class="font-mono text-xs text-oav-accent truncate">{trace_id_short}...</span>
      <span class="text-xs text-oav-muted tabular-nums">{duration_ms}ms</span>
    </div>
    <p class="text-xs text-oav-text">{root_operation}</p>
    <div class="flex items-center gap-2">
      <span class="text-[10px] text-oav-muted">{root_service}</span>
      {error && <span class="text-[10px] text-oav-error">● Error</span>}
    </div>
  </div>
  ```
- Waterfall diagram: Horizontal scroll within a `overflow-x-auto` wrapper. Minimum readable width: 480px.
- Span detail panel: Bottom sheet (slides up from bottom, `h-[70vh]`).

### 6.3 Mesh Topology (`/mesh`)

**Desktop:** Full ReactFlow viewport with stats bar overlay and side panel.

**Tablet (768–1023px):**
- Stats bar: `flex-wrap gap-2` — stats wrap to 2 rows if needed.
- Node detail panel: Full overlay mode.
- Graph controls toolbar: Reduce to essential buttons (no period selector dropdown, replaced by a compact button group).

**Mobile (< 768px):**
- Stats bar: Show only Agent count + Connection count. Other stats behind a "More stats" expand button.
- ReactFlow graph: Touch-enabled pan and pinch-zoom (ReactFlow supports this natively).
- Node tap → full-screen panel rather than side panel.
- Edge hover tooltip: Not available on mobile (edge stats accessible via a long-press or tap-on-edge gesture that opens a bottom sheet with the same data).

### 6.4 Knowledge Graph (`/knowledge`)

**Desktop:** Full ReactFlow viewport with search overlay.

**Tablet (768–1023px):**
- Search overlay: Slightly narrower. Type filter becomes a compact dropdown instead of inline toggle buttons.
- Entity detail panel: Full overlay mode.

**Mobile (< 768px):**
- Search bar: `w-full` input, type filter hidden (replaced by filter button).
- Graph: Touch pan/zoom. Nodes at reduced size (`scale(0.85)`) for higher density.
- Entity detail: Bottom sheet (`h-[65vh]`).
- "Load More" button: Placed below graph in a sticky bottom bar: `fixed bottom-16 left-0 right-0 flex justify-center pb-2`.

### 6.5 Security Dashboard (`/security`)

**Desktop:** 4-column summary stat row, gauge + table + timeline layout.

**Tablet (768–1023px):**
- Summary stats: `grid-cols-2 gap-4` (2 per row).
- Gauge: `max-w-[200px]` (slightly smaller).
- Agent security table: Hide "Last Violation" column.
- Violations timeline: `h-48` (shorter).

**Mobile (< 768px):**
- Summary stats: `grid-cols-2 gap-3` (stack in 2 cols).
- Gauge: `max-w-[180px] mx-auto`.
- Security table: Simplified — show only Agent, Grade, Score. Tap row for detail bottom sheet.
- Violations timeline: `h-40`.
- Security detail panel: Bottom sheet (`h-[75vh]`).

### 6.6 Settings — Integrations Tab (`/settings?tab=integrations`)

**Desktop:** `max-w-2xl mx-auto`, cards at full width.

**Tablet (768–1023px):** Same as desktop. `max-w-xl`.

**Mobile (< 768px):**
- Tab bar: Scrollable horizontal tabs if they overflow (`overflow-x-auto flex-nowrap`).
- Integration config cards: Full width. Action button row (`flex-col gap-2`) — Test and Save buttons stack vertically.
- Toggle switch: Minimum `min-w-[44px] min-h-[44px]` tap target (toggle is `w-11 h-6`, so padded with `p-1` on the button wrapper).

### 6.7 Sidebar Integrations Group

**Collapsed sidebar (w-16):**
- Integrations group: Single `Puzzle` icon at `w-5 h-5`.
- On hover/focus: Flyout popover appears to the right, using `left-full ml-2 z-[70]`.
- Flyout: `bg-oav-surface border border-oav-border rounded-xl shadow-xl p-2 min-w-[168px]`.
- Each sub-item in flyout: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-oav-surface-hover cursor-pointer`.

**Expanded sidebar (w-56):**
- Integrations section header row: `flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-oav-surface-hover rounded-lg`.
- Sub-items: Indented by `pl-9` (`padding-left: 36px`). Same height and hover as other nav items.
- Chevron rotation: `rotate-180` when expanded, `rotate-0` when collapsed. CSS `transition-transform duration-200`.
- Default open state: `true` when any `/traces`, `/mesh`, `/knowledge`, or `/security` route is active.

**Mobile bottom tab "More" sheet:**
- Integrations appear as a flat list (no sub-group nesting) within the More sheet, labeled:
  - "Trace Explorer"
  - "Mesh Topology"
  - "Knowledge Graph"
  - "Security"
- Each with its respective product icon at `w-5 h-5` in product accent color.

---

## Appendix A: PixiJS Integer Equivalents for Sprint 3 Canvas Tokens

For any Sprint 3 color that may be used in PixiJS canvas contexts (e.g., if mesh or knowledge visualization migrates to canvas in a future sprint, or if trace colors are used for PixiJS-rendered spans):

| Token | Hex | PixiJS `0x` Integer |
|-------|-----|---------------------|
| `oav-trace` | `#f472b6` | `0xf472b6` |
| `oav-mesh` | `#34d399` | `0x34d399` |
| `oav-knowledge` | `#60a5fa` | `0x60a5fa` |
| `oav-shield` | `#fb923c` | `0xfb923c` |
| `oav-3d` | `#818cf8` | `0x818cf8` |

`oav-surface-elevated` (`#232d3f`) is not used in PixiJS canvas (it is a DOM surface color only).

---

## Appendix B: Component File Path Map

| Component | File Path |
|-----------|-----------|
| UE5StreamContainer | `src/frontend/src/components/viewer3d/UE5StreamContainer.tsx` |
| LoadingOverlay (3D) | `src/frontend/src/components/viewer3d/LoadingOverlay.tsx` |
| ReconnectingOverlay | `src/frontend/src/components/viewer3d/ReconnectingOverlay.tsx` |
| FallbackBanner | `src/frontend/src/components/viewer3d/FallbackBanner.tsx` |
| ControlsGuide | `src/frontend/src/components/viewer3d/ControlsGuide.tsx` |
| StreamStatusBar | `src/frontend/src/components/viewer3d/StreamStatusBar.tsx` |
| ViewModeToggle | `src/frontend/src/components/viewer3d/ViewModeToggle.tsx` |
| TraceWaterfall | `src/frontend/src/components/traces/TraceWaterfall.tsx` |
| TraceList | `src/frontend/src/components/traces/TraceList.tsx` |
| TraceSearchBar | `src/frontend/src/components/traces/TraceSearchBar.tsx` |
| SpanDetailPanel (SlideInPanel variant) | `src/frontend/src/components/traces/SpanDetailPanel.tsx` |
| MeshTopologyNode | `src/frontend/src/components/mesh/MeshTopologyNode.tsx` |
| MeshStatsBar | `src/frontend/src/components/mesh/MeshStatsBar.tsx` |
| KnowledgeGraphNode | `src/frontend/src/components/knowledge/KnowledgeGraphNode.tsx` |
| EntityDetailPanel (SlideInPanel variant) | `src/frontend/src/components/knowledge/EntityDetailPanel.tsx` |
| KnowledgeLegend | `src/frontend/src/components/knowledge/KnowledgeLegend.tsx` |
| SecurityGauge / GaugeChart | `src/frontend/src/components/security/GaugeChart.tsx` |
| SecurityTable | `src/frontend/src/components/security/SecurityTable.tsx` |
| GradeBadge | `src/frontend/src/components/security/GradeBadge.tsx` |
| ViolationTimeline | `src/frontend/src/components/security/ViolationTimeline.tsx` |
| SecurityDetailPanel (SlideInPanel variant) | `src/frontend/src/components/security/SecurityDetailPanel.tsx` |
| IntegrationConfigCard | `src/frontend/src/components/settings/IntegrationConfigCard.tsx` |
| IntegrationStatusBadge | `src/frontend/src/components/settings/IntegrationStatusBadge.tsx` |
| SlideInPanel (base) | `src/frontend/src/components/ui/SlideInPanel.tsx` |
| FallbackBanner (generic integration) | `src/frontend/src/components/ui/IntegrationFallbackBanner.tsx` |
| CLIOutputPreview | `src/frontend/src/components/ui/CLIOutputPreview.tsx` |
| ThreeDWorldPage | `src/frontend/src/pages/ThreeDWorldPage.tsx` |
| TraceExplorerPage | `src/frontend/src/pages/TraceExplorerPage.tsx` |
| MeshTopologyPage | `src/frontend/src/pages/MeshTopologyPage.tsx` |
| KnowledgeGraphPage | `src/frontend/src/pages/KnowledgeGraphPage.tsx` |
| SecurityDashboardPage | `src/frontend/src/pages/SecurityDashboardPage.tsx` |
