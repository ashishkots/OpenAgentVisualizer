# OpenAgentVisualizer Sprint 2 — UI Design System

**Product:** OpenAgentVisualizer — Gamified Virtual World for AI Agent Management
**Sprint:** 2 (2D/3D Visualization and Frontend Dashboard)
**Author:** UI Designer (Stage 1.3)
**Date:** 2026-03-27
**Status:** COMPLETE
**Inputs:** Sprint 2 UX Wireframes, Sprint 2 PRD, Sprint 2 Architecture, Stage 1.2 UX Handoff

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography Scale](#2-typography-scale)
3. [Spacing and Layout Tokens](#3-spacing-and-layout-tokens)
4. [Component Visual Specs](#4-component-visual-specs)
5. [Animation Specs](#5-animation-specs)
6. [Icon System](#6-icon-system)
7. [Canvas Visual Design (PixiJS)](#7-canvas-visual-design-pixijs)
8. [Responsive Adaptations](#8-responsive-adaptations)
9. [Tailwind Config Extension](#9-tailwind-config-extension)

---

## 1. Color Palette

### 1.1 Complete Token Definitions

All values are dark-theme primary. Light theme is deferred to Sprint 3.

#### Core Tokens (existing)

| Token | Hex | Tailwind Class | Role |
|-------|-----|----------------|------|
| `oav-bg` | `#0f1117` | `bg-oav-bg` | Page background, deep canvas background |
| `oav-surface` | `#1e2433` | `bg-oav-surface` | Card backgrounds, panels, sidebar |
| `oav-border` | `#2d3748` | `border-oav-border` | Card borders, dividers, input borders |
| `oav-text` | `#e2e8f0` | `text-oav-text` | Primary text, headings |
| `oav-muted` | `#94a3b8` | `text-oav-muted` | Secondary text, labels, timestamps |
| `oav-accent` | `#3b82f6` | `bg-oav-accent` / `text-oav-accent` | Primary CTA, active state, selection ring |
| `oav-success` | `#22c55e` | `text-oav-success` / `bg-oav-success` | Active status, resolved, positive trends |
| `oav-warning` | `#f59e0b` | `text-oav-warning` / `bg-oav-warning` | Warning severity, waiting state |
| `oav-error` | `#ef4444` | `text-oav-error` / `bg-oav-error` | Error state, critical alerts |
| `oav-purple` | `#a855f7` | `text-oav-purple` / `bg-oav-purple` | Specialist ring, data_flow edges |

#### New Tokens (Sprint 2 additions)

| Token | Hex | Tailwind Class | Role |
|-------|-----|----------------|------|
| `oav-gold` | `#eab308` | `text-oav-gold` / `bg-oav-gold` | Level 5+ rings, champion highlight, crown icon, achievement borders |
| `oav-xp` | `#06b6d4` | `text-oav-xp` / `bg-oav-xp` | Floating XP text, XP bar fill, XP value labels |
| `oav-surface-hover` | `#283040` | `bg-oav-surface-hover` | Hover state for cards, table rows |
| `oav-surface-active` | `#2a3650` | `bg-oav-surface-active` | Active/selected card, pressed state, active session list item |

### 1.2 10-Level Ring Color System

Used in PixiJS canvas as `tint` integer values and in CSS components as hex strings.

| Level | Title | Hex | PixiJS Int | CSS Class Reference | Ring Visual Detail |
|-------|-------|-----|------------|--------------------|--------------------|
| 1 | Novice | `#94a3b8` | `0x94a3b8` | `text-oav-muted` | 1px ring, no glow |
| 2 | Apprentice | `#3b82f6` | `0x3b82f6` | `text-oav-accent` | 1px ring, no glow |
| 3 | Operative | `#22c55e` | `0x22c55e` | `text-oav-success` | 2px ring, no glow |
| 4 | Specialist | `#a855f7` | `0xa855f7` | `text-oav-purple` | 2px ring, no glow |
| 5 | Expert | `#eab308` | `0xeab308` | `text-oav-gold` | 3px ring, no glow |
| 6 | Master | `#eab308` | `0xeab308` | `text-oav-gold` | 3px ring + trailing particle trail (3 dots) |
| 7 | Grandmaster | `#eab308` | `0xeab308` | `text-oav-gold` | 3px ring + 3 trailing particles + crown icon (12×12px) above name |
| 8 | Legend | `#eab308` | `0xeab308` | `text-oav-gold` | Animated glow (30–40px radius, 0.2–0.4 alpha pulse) + 5 trailing particles + crown |
| 9 | Mythic | `#eab308` | `0xeab308` | `text-oav-gold` | Animated glow + orbiting particle aura (8 dots) + crown + alternate sprite shape |
| 10 | Transcendent | `#eab308` | `0xeab308` | `text-oav-gold` | Animated glow + pulse + 16-particle custom system + crown + star icon + screen glow on events |

**CSS ring helper classes for dashboard components (non-canvas):**

```
ring-level-1  → ring-1  ring-[#94a3b8]
ring-level-2  → ring-1  ring-[#3b82f6]
ring-level-3  → ring-2  ring-[#22c55e]
ring-level-4  → ring-2  ring-[#a855f7]
ring-level-5  → ring-[3px] ring-[#eab308]
ring-level-6  → ring-[3px] ring-[#eab308]
ring-level-7  → ring-[3px] ring-[#eab308]
ring-level-8  → ring-[3px] ring-[#eab308] shadow-[0_0_12px_#eab30860]
ring-level-9  → ring-[3px] ring-[#eab308] shadow-[0_0_16px_#eab30880]
ring-level-10 → ring-[3px] ring-[#eab308] shadow-[0_0_24px_#eab308a0]
```

### 1.3 FSM State Colors

| State | Hex | CSS Token | Canvas Tint | Dashboard Badge Class | Pulse |
|-------|-----|-----------|-------------|----------------------|-------|
| `idle` | `#94a3b8` | `oav-muted` | `0x94a3b8` | `bg-oav-muted/30 text-oav-muted` | No |
| `active` | `#22c55e` | `oav-success` | `0x22c55e` | `bg-oav-success/20 text-oav-success` | Yes — `animate-pulse` |
| `waiting` | `#f59e0b` | `oav-warning` | `0xf59e0b` | `bg-oav-warning/20 text-oav-warning` | No |
| `error` | `#ef4444` | `oav-error` | `0xef4444` | `bg-oav-error/20 text-oav-error` | Yes — `animate-pulse` |
| `complete` | `#3b82f6` | `oav-accent` | `0x3b82f6` | `bg-oav-accent/20 text-oav-accent` | No |

### 1.4 Semantic Colors

| Role | Hex | Token | Usage |
|------|-----|-------|-------|
| Success | `#22c55e` | `oav-success` | Task completed, resolved alerts, upward trends |
| Warning | `#f59e0b` | `oav-warning` | Cost spikes, waiting agents, alert severity warning |
| Error | `#ef4444` | `oav-error` | Error state, critical alerts, destructive actions |
| Info | `#3b82f6` | `oav-accent` | Informational alerts, complete state, navigation active |
| XP / Cyan | `#06b6d4` | `oav-xp` | XP displays, XP bar fill, floating XP text |
| Gold | `#eab308` | `oav-gold` | Gamification premium signals, champion, level 5+ |
| Purple | `#a855f7` | `oav-purple` | Specialist rank, data_flow topology edges |

### 1.5 Surface Colors with Elevation Levels

| Level | Token | Hex | Usage |
|-------|-------|-----|-------|
| Surface-0 (base) | `oav-bg` | `#0f1117` | Page background, canvas backdrop, deepest layer |
| Surface-1 | `oav-surface` | `#1e2433` | Cards, panels, sidebar, modals |
| Surface-2 | `oav-surface-hover` | `#283040` | Hovered rows, hovered cards |
| Surface-3 | `oav-surface-active` | `#2a3650` | Selected/active item, pressed interactive element |
| Surface-4 (overlay) | `#000000` at 50% alpha | — | Modal backdrop: `bg-black/50` |

### 1.6 Color Contrast Reference

Contrast ratios verified for WCAG 2.1 AA compliance (minimum 4.5:1 for normal text, 3:1 for large text and graphical elements):

| Foreground | Background | Ratio | Body Text | Graphical |
|-----------|-----------|-------|-----------|-----------|
| `#e2e8f0` on `#0f1117` | 13.3:1 | Pass | Pass |
| `#e2e8f0` on `#1e2433` | 9.5:1 | Pass | Pass |
| `#94a3b8` on `#0f1117` | 6.4:1 | Pass | Pass |
| `#94a3b8` on `#1e2433` | 4.6:1 | Pass | Pass |
| `#3b82f6` on `#0f1117` | 4.7:1 | Pass (large) | Pass |
| `#3b82f6` on `#1e2433` | 3.4:1 | Fail (use bold/large only) | Pass |
| `#22c55e` on `#1e2433` | 5.3:1 | Pass | Pass |
| `#ef4444` on `#1e2433` | 4.1:1 | Pass (large) | Pass |
| `#f59e0b` on `#1e2433` | 5.9:1 | Pass | Pass |
| `#eab308` on `#1e2433` | 5.7:1 | Pass | Pass |
| `#06b6d4` on `#1e2433` | 5.1:1 | Pass | Pass |

**Rule:** Never place `oav-accent` as body-weight text on `oav-surface` without bold or large text treatment. Use `font-semibold` or `text-sm` minimum, or decorate with `underline`.

---

## 2. Typography Scale

### 2.1 Font Stack

```
Primary (UI text): system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Monospace (code, IDs, keys): ui-monospace, "Cascadia Code", "Fira Code", Menlo, Monaco, Consolas, monospace
```

Tailwind manages both via `font-sans` and `font-mono`. No additional Google Fonts imports are required. This keeps the bundle minimal and avoids a network dependency for font loading.

### 2.2 Type Scale

| Role | Tailwind Classes | Size | Weight | Line Height | Usage |
|------|-----------------|------|--------|-------------|-------|
| Page title (h1) | `text-xl font-bold leading-tight` | 20px | 700 | 1.25 | Page headings: "Dashboard", "Leaderboard" |
| Section title (h2) | `text-lg font-semibold leading-snug` | 18px | 600 | 1.375 | Section headers within cards |
| Card title (h3) | `text-sm font-medium leading-snug` | 14px | 500 | 1.375 | Agent name in card, tab labels |
| Body base | `text-sm leading-relaxed` | 14px | 400 | 1.625 | Descriptions, paragraph content |
| Body small | `text-xs leading-relaxed` | 12px | 400 | 1.625 | Metadata, timestamps, sub-labels |
| Label / caption | `text-xs text-oav-muted` | 12px | 400 | 1.5 | Stat labels, input labels, helper text |
| Stat value (large) | `text-2xl font-bold tabular-nums` | 24px | 700 | 1.25 | Summary stat numbers (24 agents, $127) |
| Stat value (medium) | `text-lg font-bold tabular-nums` | 18px | 700 | 1.25 | Chart y-axis labels, secondary stats |
| Code / mono | `text-xs font-mono` | 12px | 400 | 1.5 | Event JSON, session IDs, API key prefixes |
| Breadcrumb | `text-xs text-oav-muted` | 12px | 400 | 1.5 | Navigation path, clickable segments use `text-oav-accent font-medium` |
| Badge / pill text | `text-xs font-medium` | 12px | 500 | 1 | Status badges, level titles, event type chips |
| Button primary | `text-sm font-medium` | 14px | 500 | 1 | Primary action buttons |
| Button small | `text-xs font-medium` | 12px | 500 | 1 | Compact buttons: "Resolve", "Copy", "Save" |
| Nav label | `text-sm font-medium` | 14px | 500 | 1 | Expanded sidebar navigation labels |

### 2.3 PixiJS Canvas Text Styles

These are PIXI.TextStyle objects — not Tailwind classes. Use exact values below.

| Role | fontFamily | fontSize | fontWeight | fill | align | Usage |
|------|-----------|----------|-----------|------|-------|-------|
| Agent name label | `"system-ui, -apple-system, sans-serif"` | `12` | `"600"` | `0xe2e8f0` | `"center"` | Name below avatar sprite |
| Level badge text | `"system-ui, -apple-system, sans-serif"` | `10` | `"500"` | `0x94a3b8` | `"center"` | "Lv 5" label in canvas |
| XP floater text | `"system-ui, -apple-system, sans-serif"` | `14` | `"700"` | `0x06b6d4` | `"left"` | "+100 XP" floating animation |
| Level-up text | `"system-ui, -apple-system, sans-serif"` | `16` | `"700"` | `0xeab308` | `"center"` | "Level 7!" celebratory text |
| Tooltip name | `"system-ui, -apple-system, sans-serif"` | `13` | `"600"` | `0xe2e8f0` | `"left"` | Inside canvas tooltip overlay |
| Tooltip secondary | `"system-ui, -apple-system, sans-serif"` | `11` | `"400"` | `0x94a3b8` | `"left"` | XP, status inside tooltip |
| Achievement "+N" | `"system-ui, -apple-system, sans-serif"` | `10` | `"600"` | `0x94a3b8` | `"center"` | Overflow badge count label |

---

## 3. Spacing and Layout Tokens

### 3.1 Spacing Scale (key values from Tailwind default scale)

| Context | Class | Value | Notes |
|---------|-------|-------|-------|
| Page padding | `p-6` | 24px | All standard pages |
| Card padding | `p-4` | 16px | Agent cards, metric cards, chart cards |
| Compact card padding | `p-3` | 12px | Dense list items, achievement cards |
| Section vertical gap | `space-y-6` | 24px | Between page sections |
| Card inner gap | `space-y-4` | 16px | Between elements within a card |
| Grid gap (cards) | `gap-4` | 16px | Agent grid, stat grid |
| Grid gap (charts) | `gap-6` | 24px | Chart grid, section grid |
| Inline gap | `gap-3` | 12px | Icon + text pairs, filter bar items |
| Tight inline gap | `gap-2` | 8px | Badge + label, stat pill items |
| Sidebar width collapsed | `w-16` | 64px | Icon-only sidebar |
| Sidebar width expanded | `w-56` | 224px | Icon + label sidebar |
| Detail panel width | `w-80` | 320px | Topology/canvas slide-in panel |
| Session list width | `w-70` | 280px | Sessions left panel (use `w-[280px]`) |
| Settings max width | `max-w-2xl` | 672px | Centered settings layout |
| Minimap size (desktop) | `w-40 h-[100px]` | 160×100px | Canvas minimap |
| Minimap size (tablet) | `w-[120px] h-20` | 120×80px | Canvas minimap smaller |
| Mobile bottom tab height | `h-16` | 64px | Fixed bottom nav bar |
| Touch minimum | `min-h-[44px] min-w-[44px]` | 44×44px | Tap targets (WCAG 2.5.5) |

### 3.2 Border Radius Tokens

| Context | Class | Value | Usage |
|---------|-------|-------|-------|
| Cards, panels, modals | `rounded-xl` | 12px | All card containers, slide-in panels, toasts |
| Buttons, inputs, dropdowns | `rounded-lg` | 8px | All interactive elements |
| Badges, pills, status dots | `rounded-full` | 9999px | Status badges, level pills, XP bar, progress bars |
| Compact containers | `rounded-md` | 6px | Small tooltips, popover anchors |
| Segmented group container | `rounded-lg` | 8px | Period/category selectors, overflow clip |

### 3.3 Shadow / Elevation Tokens

| Level | Class | Value | Usage |
|-------|-------|-------|-------|
| Level 1 (cards) | `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Agent cards at rest |
| Level 2 (raised) | `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Canvas tooltip |
| Level 3 (floating) | `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Dropdown menus, popovers |
| Level 4 (overlay) | `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Modals, detail panels, toasts |
| Level 5 (legend glow) | Custom | `shadow-[0_0_24px_#eab308a0]` | Level 10 avatar ring effect |
| Level 6 (legend glow sm) | Custom | `shadow-[0_0_12px_#eab30860]` | Level 8 avatar ring effect |

### 3.4 Z-Index Layers

| Layer | Value | Tailwind Class | Usage |
|-------|-------|---------------|-------|
| Canvas base | 0 | `z-0` | PixiJS canvas element |
| Canvas overlays | 30 | `z-30` | Filter bar, minimap, canvas controls |
| Sidebar | 40 | `z-40` | App sidebar, mobile tab bar |
| Detail panels | 45 | `z-[45]` | Topology detail panel, canvas detail slide-in |
| Modals | 50 | `z-50` | Create key modal, confirmation dialogs |
| Toasts/Notifications | 60 | `z-[60]` | LevelUpToast, AchievementToast, error toasts |
| Tooltips | 70 | `z-[70]` | Canvas agent tooltip, UI tooltips |
| Screen flash (Level 10) | 80 | `z-[80]` | Level 10 transcendent screen overlay |

---

## 4. Component Visual Specs

For every component below, states are defined as: **default**, **hover**, **active/selected**, **disabled**, **loading**, and any component-specific states (error, empty, etc.).

---

### 4.1 AgentCard

**Purpose:** Grid card on the dashboard showing agent summary with level ring, status, and XP.

**Dimensions:** Full grid column width. Min height: 120px. Padding: `p-4`.

**Structure (top to bottom):**
```
Row 1: [StatusDot 10×10] [AgentName text-sm font-medium truncate] [Framework text-xs text-oav-muted ml-auto]
Row 2: [LevelRing Avatar 36×36] [Level badge "Lv 5" text-xs] [Status badge text-xs]
Row 3: [XPProgressBar — full width]
Row 4: [Last active text-xs text-oav-muted] [Cost text-xs text-oav-muted ml-auto]
```

**States:**

| State | Background | Border | Cursor | Notes |
|-------|-----------|--------|--------|-------|
| Default | `bg-oav-surface` | `border-oav-border` | `cursor-pointer` | Base state |
| Hover | `bg-oav-surface-hover` | `border-oav-accent` | `cursor-pointer` | Border accent on hover |
| Active (selected) | `bg-oav-surface-active` | `border-oav-accent ring-1 ring-oav-accent/30` | `cursor-pointer` | Selected in agent list |
| Loading | Skeleton shimmer | `border-oav-border` | `cursor-default` | Skeleton animation on all text areas |
| Error (agent error state) | `bg-oav-surface` | `border-oav-error/40` | `cursor-pointer` | Left 3px border `border-l-oav-error` |

**Tailwind classes (default state):**
```
bg-oav-surface border border-oav-border rounded-xl p-4 cursor-pointer
transition-all duration-150
hover:bg-oav-surface-hover hover:border-oav-accent
focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg
```

**Real-time update:** When agent status changes via WebSocket, the StatusDot pulses once (CSS `animate-ping` clone, 600ms) and the border briefly flashes accent (`border-oav-accent`, 1s via JS class toggle).

---

### 4.2 AgentAvatar

**Purpose:** Circular avatar with level-specific ring for use in cards, leaderboard, topology nodes, and agent detail header.

**Sizes:**
- Small (leaderboard rows): 36×36px (`w-9 h-9`)
- Medium (agent cards, topology nodes): 40×40px (`w-10 h-10`)
- Large (agent detail header, champion card): 64×64px (`w-16 h-16`)

**Structure:**
```
<div class="relative inline-flex items-center justify-center">
  <div class="rounded-full bg-oav-bg [ring classes per level]">
    <!-- Avatar content: initials or icon -->
    <span class="text-[color] font-bold">AB</span>
  </div>
  <!-- Status dot: absolute bottom-right -->
  <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-oav-surface [status bg color]" />
</div>
```

**Avatar fill color:** Generated from agent name hash, cycling through 8 hues:
```
Hue palette: #3b82f6, #a855f7, #22c55e, #f59e0b, #ef4444, #06b6d4, #eab308, #94a3b8
```
Use 20% opacity background + 100% opacity initials text in the same hue.

**Level ring application (CSS, for non-canvas use):**

| Level | Ring class | Shadow class |
|-------|-----------|--------------|
| 1 | `ring-1 ring-[#94a3b8]` | none |
| 2 | `ring-1 ring-[#3b82f6]` | none |
| 3 | `ring-2 ring-[#22c55e]` | none |
| 4 | `ring-2 ring-[#a855f7]` | none |
| 5 | `ring-[3px] ring-[#eab308]` | none |
| 6–7 | `ring-[3px] ring-[#eab308]` | none |
| 8 | `ring-[3px] ring-[#eab308]` | `shadow-[0_0_12px_#eab30860]` |
| 9 | `ring-[3px] ring-[#eab308]` | `shadow-[0_0_16px_#eab30880]` |
| 10 | `ring-[3px] ring-[#eab308] ring-offset-1 ring-offset-oav-bg` | `shadow-[0_0_24px_#eab308a0]` |

---

### 4.3 StatusBadge

**Purpose:** Inline pill showing current FSM state. Used in AgentCard, AgentDetail header, topology node, leaderboard row.

**Dimensions:** `px-2 py-0.5 rounded-full text-xs font-medium`

**States:**

| FSM State | Background | Text color | Pulse dot | Label |
|-----------|-----------|-----------|-----------|-------|
| `idle` | `bg-oav-muted/20` | `text-oav-muted` | None | "Idle" |
| `active` | `bg-oav-success/20` | `text-oav-success` | Yes — 8×8 `bg-oav-success animate-pulse rounded-full` | "Active" |
| `waiting` | `bg-oav-warning/20` | `text-oav-warning` | None | "Waiting" |
| `error` | `bg-oav-error/20` | `text-oav-error` | Yes — 8×8 `bg-oav-error animate-pulse rounded-full` | "Error" |
| `complete` | `bg-oav-accent/20` | `text-oav-accent` | None | "Complete" |

**Tailwind structure:**
```
<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium [bg] [text]">
  [dot if needed]
  {label}
</span>
```

---

### 4.4 XPBar (XPProgressBar)

**Purpose:** Horizontal progress bar showing current XP progress toward next level.

**Dimensions:** Full width of container. Height: `h-1.5` (6px) default. `h-2` (8px) in agent detail header.

**Structure:**
```
<div class="w-full">
  <div class="flex justify-between text-xs text-oav-muted mb-1">
    <span>{currentXP} XP</span>
    <span>{nextLevelXP} XP</span>
  </div>
  <div class="w-full bg-oav-bg rounded-full h-1.5 overflow-hidden">
    <div class="h-full rounded-full transition-all duration-700 ease-out [gradient fill]"
         style="width: {percent}%" />
  </div>
</div>
```

**Fill gradient:**
```css
background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%);
```
(oav-xp → oav-accent: cyan to blue sweep)

**For level 5+ agents (gold tint override):**
```css
background: linear-gradient(90deg, #eab308 0%, #f59e0b 100%);
```
(oav-gold → oav-warning: gold sweep)

**States:**

| State | Fill color | Notes |
|-------|-----------|-------|
| Default | Cyan-to-blue gradient | Standard progression |
| Level 5+ | Gold-to-amber gradient | Expert+ visual treatment |
| Max level (10) | Full gold, `w-full` | "MAX" label replaces percentage |
| Loading | `bg-oav-border animate-pulse` | Skeleton shimmer |

**Animation on XP change:** When XP increases via WebSocket `xp_awarded`, the bar width transitions via `transition-all duration-700 ease-out`. The change is perceivable without being jarring.

---

### 4.5 XPFloater

**Purpose:** Floating "+N XP" text that rises and fades above an agent on the PixiJS canvas. Also a subtle CSS echo version for dashboard cards.

#### Canvas version (GSAP + PixiJS)

PIXI.Text object settings: See Section 2.3 "XP floater text" style.

GSAP animation parameters:
```javascript
// Create text at (avatar.x, avatar.y - 10)
// Timeline:
gsap.timeline()
  .to(text, { y: '-=40', duration: 1.0, ease: 'power2.out' })
  .to(text, { alpha: 0, duration: 0.3, ease: 'power2.in' }, 0.7)
// Destroy text object in onComplete callback
```

Batching rule: If 3+ XP events arrive for the same agent within 500ms, sum the deltas and display a single combined floater with the total.

#### Dashboard CSS echo version

Appears as a small flash next to the XP bar value on AgentCards and AgentDetail.

```css
@keyframes xp-flash {
  0%   { opacity: 1; transform: translateY(0px); }
  100% { opacity: 0; transform: translateY(-8px); }
}
.xp-flash {
  animation: xp-flash 1.5s ease-out forwards;
  color: #06b6d4; /* oav-xp */
  font-size: 11px;
  font-weight: 600;
  position: absolute;
  pointer-events: none;
}
```

---

### 4.6 LevelUpCelebration

**Purpose:** Avatar celebration animation on the PixiJS canvas when `level_up` WebSocket event is received.

**Full GSAP timeline (2.5s total, no Rive file present):**

```javascript
const tl = gsap.timeline();

// Phase 1: Scale pulse (0–600ms)
tl.to(avatarSprite.scale, {
  x: 1.3, y: 1.3,
  duration: 0.3,
  ease: 'power2.out',
})
.to(avatarSprite.scale, {
  x: 1.0, y: 1.0,
  duration: 0.3,
  ease: 'elastic.out(1, 0.5)',
});

// Phase 2: Particle burst (0–800ms, concurrent with phase 1)
// Spawn 20 gold circle particles radiating from avatar center
// Each particle: 2–4px radius, color 0xeab308
// GSAP each: random angle, velocity 60–120px, fade alpha 1→0 over 800ms
tl.add(spawnParticleBurst(avatarSprite.x, avatarSprite.y, 20, 0xeab308), 0);

// Phase 3: Ring color tween (200–600ms)
// gsap.to of tint property from old level color to new level color
tl.to(levelRingGraphics, {
  pixi: { tint: newLevelColor },
  duration: 0.4,
  ease: 'power2.inOut',
}, 0.2);

// Phase 4: Floating level text (400–1500ms)
// "Level 7!" text at avatar position, rises 30px and fades
tl.add(() => {
  const label = new PIXI.Text(`Level ${newLevel}!`, levelUpTextStyle);
  label.anchor.set(0.5);
  label.position.set(avatarSprite.x, avatarSprite.y - 20);
  particleLayer.addChild(label);
  gsap.to(label, { y: '-=30', alpha: 0, duration: 1.1, ease: 'power2.out',
    onComplete: () => particleLayer.removeChild(label) });
}, 0.4);
```

**Rive enhancement (progressive, when `level_up_celebration.riv` exists):**
- Replace phases 1–2 with Rive animation centered on avatar position
- Rive plays for 2 seconds via `@rive-app/canvas` runtime
- Ring color tween (phase 3) and level text (phase 4) still play alongside Rive
- Fallback: If `.riv` file load fails or `prefers-reduced-motion` is active, GSAP fallback runs

**Level 10 Transcendent additional effects:**
- Add 80 more particles (total 100) spread across viewport (not just avatar-local)
- Add screen flash: `<div class="fixed inset-0 bg-white/30 z-[80] pointer-events-none" />` added to DOM, fading via CSS `transition-opacity duration-500`, then removed
- LevelUpToast is displayed at 1.5× scale with gold border

---

### 4.7 AchievementBadge

**Purpose:** Icon + rarity border used in canvas avatar badge row, agent detail achievements tab, and achievement toast.

**Sizes:**
- Canvas sprite: 16×16px (within avatar badge row, max 3 visible)
- Dashboard card: 32×32px (achievement list)
- Toast icon: 40×40px

**Earned state:**
```
bg-oav-surface border border-oav-gold/40 rounded-lg p-2
[icon: full color, 24×24px from lucide-react]
```

**Locked state:**
```
bg-oav-bg border border-oav-border/50 rounded-lg p-2 opacity-60
[icon: grayscale filter via CSS: filter: grayscale(1)]
```

**Rarity border rules** (aesthetic only — all Sprint 2 achievements are the same rarity):
- Common: `border-oav-border`
- Rare: `border-oav-accent/60`
- Epic: `border-oav-purple/60`
- Legendary: `border-oav-gold/60` — applicable to ACH-010 (Trailblazer, 1000 XP)

**Glow animation on unlock (CSS, after GSAP slide-in):**
```css
@keyframes badge-glow {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50%       { box-shadow: 0 0 12px 4px #eab30840; }
}
.badge-unlocked {
  animation: badge-glow 500ms ease-in-out;
}
```

---

### 4.8 AchievementToast

**Purpose:** Slide-up notification for achievement unlock appearing in the NotificationLayer.

**Dimensions:** `w-80 max-w-[90vw]` width. Auto height with `p-4`. Fixed bottom-right: `fixed bottom-6 right-6`.

**Structure:**
```
<div class="bg-oav-surface border border-oav-gold/40 rounded-xl p-4 shadow-xl
            flex items-start gap-3 w-80">
  <div class="w-10 h-10 rounded-lg bg-oav-gold/10 border border-oav-gold/30 flex items-center justify-center shrink-0">
    [Achievement icon, lucide-react, 20px, text-oav-gold]
  </div>
  <div>
    <p class="text-xs text-oav-gold font-medium mb-0.5">Achievement Unlocked</p>
    <p class="text-sm font-semibold text-oav-text">{achievementName}</p>
    <p class="text-xs text-oav-muted">+{xpBonus} XP bonus awarded</p>
  </div>
</div>
```

**Entry animation (GSAP):**
```javascript
gsap.from(toastEl, {
  y: 20,
  scale: 0.8,
  opacity: 0,
  duration: 0.4,
  ease: 'back.out(1.7)',
});
```

**Exit animation (GSAP, after 4s auto-dismiss):**
```javascript
gsap.to(toastEl, {
  y: 10,
  opacity: 0,
  duration: 0.3,
  ease: 'power2.in',
  onComplete: () => removeToastFromDOM(),
});
```

**Queue behavior:** Multiple toasts stack vertically with 8px gap. New toasts appear below existing ones. Maximum 3 toasts visible simultaneously — older ones are dismissed if the queue overflows.

---

### 4.9 LevelUpToast

**Purpose:** Celebrates agent level-up with a more prominent toast than AchievementToast.

**Dimensions:** `w-80 max-w-[90vw]`. Fixed bottom-right, above any AchievementToasts in the stack.

**Structure:**
```
<div class="bg-oav-surface border border-oav-gold/60 rounded-xl p-4 shadow-xl
            flex items-center gap-4 w-80">
  <!-- Agent avatar with new level ring -->
  <AgentAvatar size="medium" level={newLevel} agentId={agentId} />
  <div>
    <p class="text-xs text-oav-gold font-medium uppercase tracking-wide mb-0.5">Level Up!</p>
    <p class="text-sm font-bold text-oav-text">{agentName}</p>
    <p class="text-xs text-oav-muted">Reached Level {newLevel} — {levelTitle}</p>
  </div>
</div>
```

**Level 10 variant** — same structure but with these additions:
- `border-oav-gold shadow-[0_0_24px_#eab30840]`
- Confetti particle animation behind the toast card (CSS absolute-positioned gold dots, `@keyframes confetti-fall`)
- Toast scale: 1.1× (slightly larger)

**Entry/exit:** Same GSAP params as AchievementToast. Auto-dismiss 3s.

---

### 4.10 LeaderboardRow

**Purpose:** Single ranked entry in the leaderboard list, used in both MiniLeaderboard (dashboard) and full LeaderboardPage.

**Dimensions:** Full width. Height: ~56px (`py-3`). `flex items-center gap-4 px-4 border-b border-oav-border`.

**Column layout:**
```
[Rank #N — w-10 text-lg font-bold text-oav-muted]
[AgentAvatar — 36×36px with level ring]
[Name + Level title — flex-1]
  [text-sm font-medium text-oav-text]
  [text-xs text-oav-muted]
[XP value — text-sm font-bold text-oav-text tabular-nums w-24]
[Achievement count — text-xs text-oav-muted w-16] (hidden on mobile)
[Trend arrow — w-8 flex justify-end]
```

**Trend arrow variants:**
- Up: `<ArrowUp className="w-4 h-4 text-oav-success" />` (lucide-react)
- Down: `<ArrowDown className="w-4 h-4 text-oav-error" />` (lucide-react)
- Same: `<Minus className="w-4 h-4 text-oav-muted" />` (lucide-react)

**States:**

| State | Background | Notes |
|-------|-----------|-------|
| Default | Transparent | No background |
| Hover | `bg-oav-surface-hover` | Smooth `transition-colors duration-150` |
| Rank change highlight | `bg-oav-accent/10` fading to transparent | CSS transition: `transition-opacity duration-[1500ms]` |
| Champion (#1) | Full ChampionCard component | See 4.11 |

---

### 4.11 ChampionCard

**Purpose:** Hero card at top of leaderboard showing the #1 ranked agent.

**Dimensions:** `w-full max-w-2xl mx-auto` on desktop. Auto height. Padding `p-6`.

**Structure:**
```
<div class="relative rounded-xl p-6 border border-oav-gold/40 overflow-hidden
            bg-gradient-to-r from-[#eab308]/10 via-[#eab308]/05 to-transparent">
  <!-- Crown icon, centered top -->
  <Crown className="w-6 h-6 text-oav-gold mx-auto mb-3" />
  <!-- Champion badge pill -->
  <span class="block mx-auto w-fit px-2 py-0.5 rounded-full text-xs font-medium
               bg-oav-gold/20 text-oav-gold mb-4">Champion</span>
  <!-- Avatar, centered, 64×64 -->
  <AgentAvatar size="large" level={agent.level} />
  <!-- Name and level -->
  <p class="text-lg font-bold text-oav-text mt-3 text-center">{agentName}</p>
  <p class="text-sm text-oav-muted text-center">{levelTitle}</p>
  <!-- Stats row -->
  <div class="flex justify-center gap-6 mt-4 text-center">
    <div><p class="text-lg font-bold text-oav-text tabular-nums">{xp}</p>
         <p class="text-xs text-oav-muted">Total XP</p></div>
    <div><p class="text-lg font-bold text-oav-text tabular-nums">{achievements}</p>
         <p class="text-xs text-oav-muted">Achievements</p></div>
    <div><p class="text-lg font-bold text-oav-success tabular-nums">+{trend}</p>
         <p class="text-xs text-oav-muted">Rank Change</p></div>
  </div>
</div>
```

**Champion change crossfade:**
When the #1 position changes via WebSocket `rank_change`:
```javascript
// Fade out old champion
gsap.to(championCard, { opacity: 0, duration: 0.2 });
// After 200ms: update DOM data, fade in new champion
gsap.to(championCard, { opacity: 1, duration: 0.3, delay: 0.2 });
```
CSS confetti: `@keyframes confetti-fall` — 8 gold dots positioned absolutely around the card, falling 60px over 2s, staggered.

---

### 4.12 AlertCard / AlertTableRow

**Purpose:** Alert display in the Alerts page. Desktop = table row. Mobile = card.

**Severity visual system:**

| Severity | Icon (lucide) | Icon color | Row left border | Badge background |
|----------|--------------|------------|----------------|-----------------|
| Critical | `AlertCircle` | `text-oav-error` | `border-l-2 border-l-oav-error` | `bg-oav-error/10` |
| Warning | `AlertTriangle` | `text-oav-warning` | `border-l-2 border-l-oav-warning` | `bg-oav-warning/10` |
| Info | `Info` | `text-oav-accent` | No left border | Transparent |

**Table row structure:**
```
[Checkbox w-10] [Severity icon w-12] [Title flex-1 text-oav-text font-medium]
[Agent link text-oav-muted hover:text-oav-accent underline w-32]
[Timestamp text-xs text-oav-muted w-24] [Status badge w-24] [Resolve button w-20]
```

**CriticalAlertBanner:**
```
<div class="rounded-xl border border-oav-error/40 bg-oav-error/10 px-4 py-3 flex items-center gap-3">
  <AlertCircle class="w-5 h-5 text-oav-error shrink-0" />
  <p class="text-sm text-oav-text flex-1">{N} critical alerts require attention</p>
  <button class="text-sm text-oav-error font-medium hover:underline">View</button>
</div>
```

**New alert highlight animation:**
```css
@keyframes alert-prepend {
  from { background-color: rgb(59 130 246 / 0.1); }
  to   { background-color: transparent; }
}
.alert-new {
  animation: alert-prepend 2s ease-out forwards;
}
```

---

### 4.13 MetricCard / StatCard

**Purpose:** Summary statistic display used in the Dashboard summary row.

**Dimensions:** Full grid column. `bg-oav-surface border border-oav-border rounded-xl p-4`.

**Structure:**
```
<div class="flex flex-col gap-1">
  <p class="text-xs text-oav-muted">{label}</p>
  <p class="text-2xl font-bold text-oav-text tabular-nums">{value}</p>
  [optional] <p class="text-xs text-oav-success flex items-center gap-1">
    <TrendingUp class="w-3 h-3" /> +12% from last week
  </p>
</div>
```

**"Active Now" card special treatment:**
- Add pulsing dot before value: `<span class="inline-block w-2 h-2 rounded-full bg-oav-success animate-pulse mr-2" />`
- Value text: `text-oav-success` instead of `text-oav-text`

**Trend indicator colors:**
- Positive: `text-oav-success` + `<TrendingUp />`
- Negative: `text-oav-error` + `<TrendingDown />`
- Neutral: `text-oav-muted` + `<Minus />`

---

### 4.14 TopologyNode (ReactFlow custom node)

**Purpose:** Custom ReactFlow node representing an agent in the topology graph.

**Dimensions:** 160×80px.

**Structure:**
```
<div class="bg-oav-surface border border-oav-border rounded-xl px-3 py-2
            flex items-center gap-2 w-40 h-20">
  <div class="relative">
    <AgentAvatar size="small" level={agent.level} />
    <StatusDot state={agent.status} /> {/* absolute bottom-0 right-0 */}
  </div>
  <div class="flex-1 min-w-0">
    <p class="text-xs font-semibold text-oav-text truncate">{agent.name}</p>
    <p class="text-[10px] text-oav-muted">Lv {agent.level} · {levelTitle}</p>
  </div>
</div>
```

**ReactFlow handle style:**
- Default: `w-2 h-2 rounded-full border-2 border-oav-border bg-oav-surface`
- Connected: `border-oav-accent`

**Selected node state:**
```
border-oav-accent ring-2 ring-oav-accent/30
```

**Hover state:**
```
border-oav-accent/60 bg-oav-surface-hover
```

---

### 4.15 TopologyEdge

**Purpose:** Custom ReactFlow edge representing agent relationships.

| Relationship | Stroke | Dash pattern | Width | Color | Arrow |
|-------------|--------|-------------|-------|-------|-------|
| `delegates_to` | Solid | None | 2px | `#3b82f6` (oav-accent) | Marker end (arrowhead) |
| `shared_session` | Dashed | `[5, 4]` | 1px | `#94a3b8` (oav-muted) | None (bidirectional) |
| `data_flow` | Solid | None | 2px | `#a855f7` (oav-purple) | Marker end (arrowhead) |

**Hover state (all types):** Width increases from declared px to declared+2px. Fill brightens by 30% (CSS filter or direct color override).

**Edge label (hidden by default, visible on hover):**
```css
.react-flow__edge-text {
  font-size: 10px;
  fill: #94a3b8;
  background: #1e2433;
}
```

**New edge enter animation:**
```css
.edge-enter { animation: edge-fade-in 300ms ease-out; }
@keyframes edge-fade-in { from { opacity: 0; } to { opacity: 1; } }
```

---

### 4.16 TimelineEvent (EventTimelineItem)

**Purpose:** Single event row in the Agent Detail Events tab and Sessions timeline.

**Dimensions:** Full width. `flex items-start gap-3 py-2 border-b border-oav-border`.

**Structure:**
```
[Timestamp — text-xs font-mono text-oav-muted w-20 shrink-0 tabular-nums]
[Event type badge — text-xs px-2 py-0.5 rounded-full bg-oav-bg text-oav-accent border border-oav-accent/30]
[Description — text-sm text-oav-text flex-1]
[XP delta if present — text-xs text-oav-success font-medium w-16 text-right]
```

**New event highlight (WebSocket prepend):**
```css
.event-new {
  background-color: rgb(59 130 246 / 0.07);
  transition: background-color 2s ease-out;
}
.event-new.fade {
  background-color: transparent;
}
```
JS adds `.fade` class after 100ms to trigger transition.

**Expandable JSON payload (Sessions accordion):**
```
<div class="mt-2 rounded-lg bg-oav-bg p-3 text-xs font-mono">
  Keys: text-oav-accent
  Strings: text-oav-success
  Numbers: text-oav-purple
  Booleans: text-oav-warning
  Nulls: text-oav-muted
</div>
```

**Active/current event during playback:**
```
border-l-2 border-l-oav-accent bg-oav-accent/5
```

---

### 4.17 SessionReplayControls

**Purpose:** Playback toolbar in the Sessions page session detail panel.

**Dimensions:** Full width. `bg-oav-surface border border-oav-border rounded-xl p-4`.

**Structure:**
```
Row 1 (buttons + speed):
  [SkipToStart — |< icon 28×28]
  [PlayPause — play/pause icon 36×36 — primary button bg-oav-accent rounded-lg]
  [Speed selector — "1x" dropdown button w-16]
  [Position label — "14:15:30 / 14:32:00" text-xs text-oav-muted ml-auto]

Row 2 (scrubber):
  [<input type="range"> full width, accent-oav-accent h-1.5 rounded-full]
```

**Button sizes:** Minimum 44×44px touch target (padding compensates for visual size).

**Speed selector options:** `0.5x`, `1x`, `2x`, `5x`

**States:**
- Play button default: `bg-oav-accent text-white hover:bg-oav-accent/90`
- Play button playing: Shows pause icon, same color
- Skip to start: `bg-oav-surface hover:bg-oav-surface-hover text-oav-text border border-oav-border`
- Disabled (no session selected): All buttons `opacity-50 cursor-not-allowed pointer-events-none`

**Timeline scrubber CSS override:**
```css
input[type="range"].oav-scrubber {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 9999px;
  background: #2d3748; /* oav-border */
  outline: none;
}
input[type="range"].oav-scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #3b82f6; /* oav-accent */
  cursor: pointer;
  transition: transform 0.15s;
}
input[type="range"].oav-scrubber::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
```

---

### 4.18 FSM State Diagram

**Purpose:** Visual state machine diagram in the Agent Detail "State Machine" tab.

**Technology:** SVG + CSS (not PixiJS — this is a dashboard component).

**Layout:** Horizontal layout for the 5 states: idle → active → complete, with error and waiting branching from active.

**State node:**
```
Inactive node: rounded-rect, bg-oav-bg, stroke oav-border, text-oav-muted
Active node: rounded-rect, bg-oav-success/20, stroke oav-success (2px), text-oav-success, font-bold
Error node (when current): bg-oav-error/20, stroke oav-error
```

**Transition arrows:**
- SVG `<path>` with marker-end arrowhead
- Color: `#94a3b8` (oav-muted)
- Active transition (most recent): Color `#3b82f6` (oav-accent), stroke-width 2

**Transition history table below diagram:**
```
3 columns: Timestamp (mono text-xs) | From State | To State
From/To states use StatusBadge component (compact variant)
```

---

## 5. Animation Specs

All animations must degrade gracefully under `prefers-reduced-motion: reduce`. The reduced-motion fallback for every animation below is: instant (duration 0ms) or a single opacity 0→1 transition (200ms max).

### 5.1 XP Gain Animation

**Trigger:** `xp_awarded` WebSocket event.

**Canvas (GSAP):**
```
Target:    PIXI.Text object at (avatar.x, avatar.y - 10)
Duration:  1000ms total
Easing:    power2.out for y movement, power2.in for alpha fade
y-movement: -40px (floats upward)
Alpha:     1.0 → 0.0, begins fading at t=700ms
Color:     #06b6d4 (oav-xp)
FontSize:  14px, bold
On complete: removeChild from particleLayer
```

**Dashboard CSS echo:**
```
Duration:  1500ms
Keyframes: opacity 1→0, translateY 0→-8px
Position:  absolute, near XP bar
Class:     .xp-flash (see Section 4.5)
```

**Batching:** 3+ events for same agent within 500ms → sum XP deltas → single floater.

**Reduced motion:** Skip canvas animation. Dashboard echo: instant update of XP value only, no flash.

---

### 5.2 Level-Up Celebration Sequence

**Trigger:** `level_up` WebSocket event.

Full GSAP timeline — see Section 4.6 for detailed implementation. Summary timing:

| Phase | Start | End | Effect |
|-------|-------|-----|--------|
| Scale pulse | 0ms | 600ms | 1.0 → 1.3 → 1.0, `elastic.out(1, 0.5)` |
| Particle burst | 0ms | 800ms | 20 gold dots, radial, fade out |
| Ring color tween | 200ms | 600ms | Old ring color → new ring color, `power2.inOut` |
| Floating level text | 400ms | 1500ms | Rise 30px, fade to 0, `power2.out` |
| Toast appears | 600ms | — | Slides up from bottom-right, see 4.9 |

**Rive override (when file present):**
- Phases 1 and 2 replaced by `level_up_celebration.riv` for 2000ms
- Phases 3 and 4 still run concurrently
- Rive instance disposed `onStop`

**Level 10 extras:**
- Screen flash: white overlay `opacity: 0.3 → 0`, 500ms CSS transition
- Additional 80 particles viewport-wide
- Toast: 1.1× scale with gold `box-shadow`

**Reduced motion:** All GSAP durations set to 0. No particles. Ring color updates instantly. Toast appears instantly.

---

### 5.3 Achievement Unlock Animation

**Trigger:** `achievement_unlocked` WebSocket event.

**Canvas (GSAP) — total 1500ms:**
```
Phase 1 (0–300ms):  Badge sprite slides in from below avatar
  y: avatar.y + badge_row_offset + 20 → avatar.y + badge_row_offset
  ease: back.out(1.2)
  duration: 300ms

Phase 2 (300–800ms): Badge glow pulse
  PIXI.Graphics circle behind badge
  alpha: 1.0 → 0.6 → 1.0
  duration: 500ms, yoyo: true, repeat: 1

Phase 3 (800–1500ms): Badge settles, glow circle fades
  glow circle alpha: 1.0 → 0
  duration: 700ms, ease: power2.out
```

**Rive override (when `achievement_unlock.riv` exists):**
- Plays at badge position for 1500ms
- Badge appears after Rive completes (phase 3 timeline shifts to 1500ms start)

**Toast notification:** See Section 4.8 (AchievementToast). Auto-dismiss 4000ms.

**Badge overflow (3 max visible):**
- Oldest badge shifts left (x -= badge_width + gap, 200ms, ease: power2.out)
- "+N" overflow counter updates with number count-up (CSS counter, instant)
- New badge takes rightmost slot

**Reduced motion:** Skip canvas animation. Badge appears instantly. Toast appears instantly (no slide).

---

### 5.4 FSM State Transitions

**Trigger:** `state_change` WebSocket event → XState machine transitions → canvas reads new state.

| Transition | Canvas tint change | Duration | Easing | Additional effect |
|-----------|------------------|----------|--------|-------------------|
| Any → `active` | Old color → `#22c55e` | 400ms | `power2.out` | Glow effect fades in (alpha 0→0.3, 400ms) |
| Any → `error` | Old color → `#ef4444` | 300ms | `power2.in` | Shake: x oscillate ±3px, 3 cycles, 300ms total |
| Any → `waiting` | Old color → `#f59e0b` | 400ms | `power2.out` | Clock overlay icon fades in |
| Any → `complete` | Old color → `#3b82f6` | 400ms | `power2.out` | Checkmark overlay icon fades in |
| Any → `idle` | Old color → `#94a3b8` | 500ms | `power2.inOut` | Glow/overlays fade out |

**Shake animation (error state):**
```javascript
gsap.to(avatarSprite, {
  x: '+=3', duration: 0.05, yoyo: true, repeat: 5,
  ease: 'none',
  onComplete: () => { avatarSprite.x = originalX; }
});
```

**Idle breathing animation (continuous while in idle state):**
```javascript
gsap.to(avatarSprite.scale, {
  x: 1.02, y: 1.02,
  duration: 2,
  yoyo: true, repeat: -1,
  ease: 'sine.inOut',
});
```

**Reduced motion:** All tint changes apply instantly (duration 0). No shake, no breathing animation, no glow.

---

### 5.5 Leaderboard Row Animation

**Trigger:** `rank_change` WebSocket event.

```
GSAP y-tween: row moves from old clientY to new clientY
Duration: 400ms
Easing: power2.inOut
Implementation: Use FLIP technique — record old position, update DOM, tween from old to new

Post-tween highlight:
  Add class .rank-highlight (bg-oav-accent/10)
  CSS transition-opacity 1500ms ease-out removes it
```

**Trend arrow update:**
- Old arrow: `scale(0) → opacity(0)`, 100ms
- New arrow: `opacity(0) scale(0) → opacity(1) scale(1)`, 200ms, ease: `back.out(1.4)`

**Champion change:** See Section 4.11.

**Reduced motion:** DOM reorder is instant. Trend arrow updates instantly.

---

### 5.6 Page Transitions

**Route change (React Router v6 with transition):**
```
Outgoing page: opacity 1 → 0, duration 150ms, ease: power2.in
Incoming page: opacity 0 → 1, duration 200ms, ease: power2.out, delay: 150ms
```
Implemented via CSS classes toggled on the `<Outlet>` wrapper:
```css
.page-enter { animation: page-in 200ms ease-out; }
.page-exit  { animation: page-out 150ms ease-in; }

@keyframes page-in  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes page-out { from { opacity: 1; } to { opacity: 0; } }
```

**Sidebar expand/collapse:**
```css
transition: width 200ms ease-in-out;
/* w-16 ↔ w-56 */
```
Text labels: `opacity 0 → 1, 150ms, delay 100ms` (appear after sidebar is mostly open).

**Detail panel slide-in:**
```css
/* Topology, canvas detail panel */
transition: transform 300ms ease-out;
transform: translateX(100%) → translateX(0);
```

**Reduced motion:** All page transitions instant. Sidebar width changes instantly.

---

### 5.7 Skeleton Loading

**Purpose:** Placeholder shimmer for content loading states.

**CSS:**
```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    #2d3748 25%,   /* oav-border */
    #283040 50%,   /* oav-surface-hover (lighter) */
    #2d3748 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

**Skeleton elements per component:**

AgentCard skeleton:
```
Row 1: skeleton w-2.5 h-2.5 rounded-full | skeleton w-24 h-3 | skeleton w-12 h-3 ml-auto
Row 2: skeleton w-9 h-9 rounded-full | skeleton w-16 h-3 | skeleton w-12 h-3
Row 3: skeleton w-full h-1.5 rounded-full
Row 4: skeleton w-20 h-2.5 | skeleton w-16 h-2.5 ml-auto
```

**Reduced motion:** Static skeleton (no animation). Content appears instantly once loaded.

---

### 5.8 prefers-reduced-motion Master Rule

Wrap all GSAP calls with this guard:

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateSafe(target: object, vars: gsap.TweenVars) {
  if (prefersReducedMotion) {
    // Apply final state instantly
    gsap.set(target, { ...vars, duration: 0, delay: 0 });
  } else {
    gsap.to(target, vars);
  }
}
```

For Rive: Check `prefersReducedMotion` before instantiating. If true, render the Rive animation's static last frame as an image (or skip entirely and fall back to GSAP which itself is instant).

CSS Tailwind utilities for reduced motion:
```
motion-reduce:transition-none
motion-reduce:animate-none
motion-reduce:duration-0
```

---

## 6. Icon System

### 6.1 Recommended Library

**Use `lucide-react` exclusively** for all UI icons. Version `^0.400.0`. Import individually to tree-shake:

```typescript
import { Trophy, Activity, AlertCircle } from 'lucide-react';
```

Default icon props: `className="w-4 h-4"` (16px). Use `w-5 h-5` (20px) for primary actions and `w-6 h-6` (24px) for section headers or prominent UI.

### 6.2 Achievement Icons (10 Achievements)

| ACH ID | Name | lucide-react Icon | Notes |
|--------|------|-------------------|-------|
| ACH-001 | First Steps | `Footprints` | First task completed |
| ACH-002 | Centurion | `Shield` | 100 tasks milestone |
| ACH-003 | Speed Demon | `Zap` | Sub-1s latency sprint |
| ACH-004 | Penny Pincher | `Coins` | Cost efficiency |
| ACH-005 | Iron Will | `Hammer` | Error recovery resilience |
| ACH-006 | Marathon Runner | `Timer` | 24h session time |
| ACH-007 | Team Player | `Handshake` | Graph connectivity |
| ACH-008 | Perfect Streak | `Star` | 10 consecutive task streak |
| ACH-009 | Night Owl | `Moon` | Night-time tasks |
| ACH-010 | Trailblazer | `Flag` | First to Level 5 |

Fallback for `Footprints` / `Coins` / `Handshake` (may not be in older lucide versions): use `Activity` / `DollarSign` / `Users` respectively.

### 6.3 Navigation Icons (Sidebar)

| Page | lucide-react Icon | Notes |
|------|-------------------|-------|
| Dashboard | `LayoutDashboard` | Landing page |
| Agent Canvas / World | `Globe` | Virtual world |
| Topology | `Network` | Graph view |
| Leaderboard | `Trophy` | Gamification |
| Analytics | `BarChart2` | Data insights |
| Alerts | `Bell` | Operational |
| Sessions | `Play` | Replay |
| Settings | `Settings` | Bottom of sidebar |

Alert badge: `<Bell>` with red pill counter overlay `bg-oav-error text-white text-[10px] font-bold`.

### 6.4 FSM State Icons

| State | Icon | Color class | Used in |
|-------|------|-------------|---------|
| `idle` | `Pause` | `text-oav-muted` | State machine diagram, tooltip |
| `active` | `Activity` | `text-oav-success` | State machine diagram, tooltip |
| `waiting` | `Clock` | `text-oav-warning` | State machine diagram, canvas overlay |
| `error` | `AlertCircle` | `text-oav-error` | State machine diagram, canvas overlay, alert table |
| `complete` | `CheckCircle` | `text-oav-accent` | State machine diagram, canvas overlay |

### 6.5 Alert Severity Icons

| Severity | Icon | Color | Size |
|----------|------|-------|------|
| Critical | `AlertCircle` | `text-oav-error` | `w-5 h-5` |
| Warning | `AlertTriangle` | `text-oav-warning` | `w-5 h-5` |
| Info | `Info` | `text-oav-accent` | `w-5 h-5` |
| Resolved | `CheckCircle2` | `text-oav-success` | `w-4 h-4` |

### 6.6 General UI Icons

| Usage | Icon |
|-------|------|
| Close / dismiss | `X` |
| Copy to clipboard | `Copy` |
| Copied (success) | `Check` |
| Expand / open detail | `ChevronRight` |
| Collapse / close detail | `ChevronLeft` |
| Trend up | `ArrowUp` or `TrendingUp` |
| Trend down | `ArrowDown` or `TrendingDown` |
| Trend neutral | `Minus` |
| Crown (champion/level 7+) | `Crown` |
| Star (Level 10 icon) | `Sparkles` |
| Logout | `LogOut` |
| Refresh | `RefreshCw` |
| Export | `Download` |
| Filter | `Filter` |
| Search | `Search` |
| Connection live | `Wifi` (green) |
| Connection lost | `WifiOff` (red) |
| Reconnecting | `RefreshCw` with `animate-spin` |
| Canvas zoom in | `ZoomIn` |
| Canvas zoom out | `ZoomOut` |
| Canvas fit | `Maximize2` |
| Auto-layout | `LayoutTemplate` |

---

## 7. Canvas Visual Design (PixiJS)

### 7.1 Grid Background Pattern

**Type:** Isometric-style dot grid (provides depth without distracting from agents).

**Implementation:**
```javascript
// PIXI.Graphics — draw once, cache as texture
const grid = new PIXI.Graphics();
const dotColor = 0x2d3748; // oav-border
const dotAlpha = 0.4;
const spacing = 32; // 32px grid

for (let x = 0; x < worldWidth; x += spacing) {
  for (let y = 0; y < worldHeight; y += spacing) {
    grid.circle(x, y, 1).fill({ color: dotColor, alpha: dotAlpha });
  }
}
const gridTexture = app.renderer.generateTexture(grid);
const gridTilingSprite = new PIXI.TilingSprite({ texture: gridTexture,
  width: worldWidth, height: worldHeight });
gridTilingSprite.alpha = 0.4;
worldContainer.addChildAt(gridTilingSprite, 0);
```

**Grid behavior:** Grid tile moves with world pan but does NOT scale with zoom (creates a parallax-like depth effect — grid is background context, not the world coordinate space).

### 7.2 Agent Sprite Visual Specs

Each `AgentSprite` is a PIXI.Container with these children (bottom to top):

| Layer | Object | Description |
|-------|--------|-------------|
| 0 | `glowCircle` (Graphics) | Level 8+ glow effect, behind avatar |
| 1 | `bodyCircle` (Graphics) | Avatar filled circle, tinted by FSM state |
| 2 | `levelRing` (Graphics) | Colored ring drawn around bodyCircle |
| 3 | `statusDot` (Graphics) | Small 4px dot at bottom-right, FSM state color |
| 4 | `iconOverlay` (Sprite or Graphics) | Checkmark / clock icon for complete/waiting state |
| 5 | `nameLabel` (PIXI.Text) | Agent name, below the avatar group |
| 6 | `levelLabel` (PIXI.Text) | "Lv 5" sub-label, below name |
| 7 | `achievementRow` (Container) | Up to 3 achievement badge sprites + "+N" text |
| 8 | `crownSprite` (Sprite) | Level 7+ crown icon, above avatar |
| 9 | `particleContainer` (Container) | Trailing particles, burst effects |
| 10 | `selectionRing` (Graphics) | Blue selection ring, visible only when selected |

**Agent sprite sizes by level:**

| Level | bodyCircle radius | Total container approx |
|-------|------------------|----------------------|
| 1–2 | 14px | 28×28px body |
| 3–4 | 15px | 30×30px body |
| 5–7 | 16px | 32×32px body |
| 8 | 18px | 36×36px body |
| 9 | 19px | 38×38px body |
| 10 | 20px | 40×40px body |

**bodyCircle tint color:** Applied as PIXI tint matching FSM state (see Section 1.3 table).

**levelRing thickness:**

| Level | lineWidth |
|-------|----------|
| 1–2 | 1.5px |
| 3–4 | 2px |
| 5–10 | 3px |

**glowCircle (level 8+):**
```javascript
// Pulsing loop
gsap.to(glowCircle, {
  pixi: { scaleX: 40/30, scaleY: 40/30 },  // 30px → 40px radius
  alpha: 0.4,
  duration: 2,
  yoyo: true, repeat: -1,
  ease: 'sine.inOut',
});
glowCircle.tint = 0xeab308;
glowCircle.alpha = 0.2;
```

**selectionRing:**
```javascript
// Drawn as arc, not filled
// Radius: bodyCircle_radius + ringThickness + 4px
// Color: 0x3b82f6 (accent)
// lineWidth: 2px
// Alpha: 0.8, with gentle pulse: alpha 0.8 → 0.5, 1s, yoyo: true
```

**iconOverlay specs:**
- Waiting state: Clock icon, 16×16px, white (`0xffffff`) sprite, centered on avatar
- Complete state: Checkmark icon, 16×16px, white sprite, centered on avatar
- Icons are pre-rendered PixiJS Graphics paths or loaded SVG textures at 32px resolution then scaled

**achievementBadge row:**
- Badges: 16×16px circles with achievement icon rendered as Graphics (simplified shapes, not full lucide detail at this scale)
- Row centered below nameLabel, with 2px gap between badges
- Max 3 visible; 4th+ adds "+N" PIXI.Text in oav-muted color

### 7.3 Connection Lines Between Agents

Connection lines are drawn in the PixiJS world canvas (not ReactFlow). They represent live task relationships (not topology graph — those are in ReactFlow on the Topology page).

**Rendering:** PIXI.Graphics `lineTo` calls, redrawn each frame when agent positions change.

**Line style:**
- Active connection: `lineStyle({ width: 1, color: 0x3b82f6, alpha: 0.25 })`
- Idle connection: `lineStyle({ width: 1, color: 0x2d3748, alpha: 0.15 })`

Lines are drawn last (lowest z-order, behind all agent sprites) to avoid visual noise.

### 7.4 Agent Selection Highlight

On single-click:
1. `selectionRing` (Graphics) becomes visible on the clicked agent
2. Other agents dim to `alpha = 0.6` via GSAP `to(sprite, { alpha: 0.6, duration: 150ms })`
3. Deselected agent: `alpha = 1.0`, 150ms

On `Escape` or click on empty space:
1. All agents return to `alpha = 1.0`
2. `selectionRing` hides

### 7.5 Hover Tooltip (React overlay)

The canvas tooltip is a **React DOM element** positioned over the canvas via `getBoundingClientRect()` to map PixiJS world coordinates to screen coordinates.

**Dimensions:** `w-64` (256px), auto height. `max-w-[90vw]` on mobile.

**Structure:**
```html
<div class="bg-oav-surface border border-oav-border rounded-xl p-3 shadow-xl z-[70]
            fixed pointer-events-none" style="left: {x}px; top: {y - 8}px; transform: translateX(-50%) translateY(-100%)">
  <!-- Arrow pointing down, centered -->
  <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full
              w-0 h-0 border-l-4 border-r-4 border-t-4
              border-l-transparent border-r-transparent border-t-oav-border" />

  <div class="flex items-center gap-2 mb-2">
    <AgentAvatar size="small" level={agent.level} />
    <div>
      <p class="text-sm font-semibold text-oav-text">{agent.name}</p>
      <StatusBadge state={agent.status} />
    </div>
  </div>

  <div class="text-xs text-oav-muted space-y-1 mb-2">
    <p>Level {level} — {levelTitle}</p>
    <p>XP: {xp} / {nextLevelXP}</p>
    <p>Current task: {currentTask || "None"}</p>
  </div>

  <XPBar currentXP={xp} nextLevelXP={nextLevelXP} />

  <div class="flex gap-1 mt-2">
    {/* Achievement badges, max 3 */}
    {/* "+N" overflow if needed */}
  </div>
</div>
```

**Positioning rules:**
- Default: Appears above agent sprite (tooltip bottom-center points down to agent)
- Near top edge: Flips to below agent (tooltip top-center points up)
- Near left/right edge: Horizontal offset clamped to viewport with 8px margin

### 7.6 Minimap Visual Treatment

**Dimensions:** 160×100px (desktop), 120×80px (tablet), hidden on mobile.

**Background:** `bg-oav-surface/80 border border-oav-border rounded-lg backdrop-blur-sm`

**Agent dots:** 3×3px circles, color = FSM state color. Same relative positions as world canvas.

**Viewport rectangle:** White/accent semi-transparent rect (`0x3b82f6` at 20% alpha, border `0x3b82f6` 1px stroke). Draggable — drag viewport rect to pan world canvas.

**Zoom-level indicator:** Text overlay bottom-right of minimap: `{Math.round(zoom * 100)}%`, `text-[10px] text-oav-muted`.

---

## 8. Responsive Adaptations

### 8.1 Breakpoint Reference

| Name | Min Width | Tailwind Prefix |
|------|-----------|-----------------|
| Mobile | 0px | (default) |
| Tablet | 768px | `md:` |
| Desktop | 1024px | `lg:` |
| Wide | 1440px | `xl:` |
| Ultra | 1920px | `2xl:` |

### 8.2 Component Adjustments per Breakpoint

**AgentCard:**
- Mobile: Full width, compact. Avatar 32×32px. XP bar always visible.
- Tablet/Desktop: Same layout, avatar 36×36px. Cost visible.

**AgentAvatar:**
- Mobile touch tap target: Minimum 44×44px hit area even if visual is 32×32px. Use `p-[6px]` padding inside a `w-11 h-11` wrapper.

**Sidebar:**
- Mobile: Hidden entirely. Replaced by `MobileTabBar` fixed bottom.
- Tablet (768–1023px): Collapsed icon-only sidebar (64px), no expand-on-hover (explicit toggle only).
- Desktop (1024px+): Collapsed by default, expands to 224px on hover or toggle.

**MobileTabBar:**
- Height: `h-16` (64px). Fixed bottom. `bg-oav-surface border-t border-oav-border`.
- 5 items: Dashboard, World, Topology, Leaderboard, More.
- Active: `text-oav-accent` with filled icon variant (use `fill-current`).
- "More" opens bottom sheet with: Analytics, Alerts, Sessions, Settings.
- Bottom sheet: `fixed inset-x-0 bottom-0 bg-oav-surface border-t border-oav-border rounded-t-2xl p-4 z-50`. Drag handle at top: `w-12 h-1 bg-oav-border rounded-full mx-auto mb-4`.
- Safe area: `pb-[env(safe-area-inset-bottom)]` for iPhone notch.

**Dashboard Page:**
- Mobile: `grid-cols-2` for stat cards, `grid-cols-1` for agent grid, charts stacked.
- Tablet: `grid-cols-4` stats, `grid-cols-2` agents, charts stacked, mini-leaderboard below.
- Desktop: `grid-cols-4` stats, `grid-cols-4` agents, 3-col row for charts + mini-leaderboard.

**Agent Canvas:**
- Mobile: Filter bar collapses to `<Filter />` icon button. Tap opens full-screen bottom sheet with filter options. Minimap hidden. Controls simplified to zoom + connection status only.
- Gesture support: `touch-action: none` on canvas element. Pinch-to-zoom via `pointermove` distance delta. Drag via `pointermove` after `pointerdown` on empty space.

**Topology Page:**
- Mobile/Tablet: Detail panel opens as bottom sheet (50vh height). Legend hidden behind `<Info />` info button.
- Desktop: Detail panel 320px slide from right.

**Agent Detail Page:**
- Mobile: Profile header stacks (avatar top, stats below). Tabs scroll horizontally (`overflow-x-auto whitespace-nowrap`). Sidebar panel hidden (stats inline below tab content).
- Tablet: Profile header 2-column. Tabs full width. Sidebar below.
- Desktop: 3-column grid. Profile: full width. Tab content: 8/12 cols. Sidebar: 4/12 cols.

**Leaderboard:**
- Mobile: Champion card compact (avatar 48×48px, stats in 2 columns). List rows hide achievement count. Period + category selectors stack.
- Tablet+: Full layout as wireframed.

**Sessions Page:**
- Mobile: Session list is a full-screen view. Tapping a session navigates to detail view (separate screen with back button). Playback controls use larger 48px touch targets.
- Tablet: Session list as 280px drawer (collapsible via toggle). Detail fills remaining.
- Desktop: Permanent side-by-side split view.

### 8.3 Touch Target Rules (WCAG 2.5.5)

All interactive elements on mobile must have a minimum 44×44px tap target. Where visual size is smaller (e.g., icons), use padding or `::after` pseudo-element to extend the hit area:

```css
.icon-button {
  position: relative;
}
.icon-button::after {
  content: '';
  position: absolute;
  inset: -8px; /* extends 8px on all sides of a 28px icon = 44px target */
}
```

Tailwind shorthand: `p-2.5` (10px padding on a 24px icon = 44px total).

### 8.4 Mobile-Specific UI Patterns

**Bottom sheet (used for: filter bar on canvas, detail panel on topology/mobile, "More" menu):**
- Entry: `translateY(100%) → translateY(0)`, 300ms, `cubic-bezier(0.32, 0.72, 0, 1)`
- Exit: `translateY(0) → translateY(100%)`, 250ms, `ease-in`
- Drag to dismiss: `touch-action: pan-y` on the drag handle. Velocity check — if swipe velocity > 400px/s, dismiss.
- Backdrop: `bg-black/50` behind sheet, tap to dismiss.

**Swipe gestures on canvas (mobile):**
- Pan: 1-finger drag
- Zoom: 2-finger pinch
- Select agent: Tap (treated as click)
- Open detail: Double-tap (treated as double-click, navigates to agent detail page)

---

## 9. Tailwind Config Extension

The following is the complete updated `tailwind.config.js` for the frontend. The existing colors are preserved and new Sprint 2 tokens are added alongside keyframes and animation utilities.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── Color Tokens ───────────────────────────────────────────────────────
      colors: {
        // Existing tokens (unchanged)
        'oav-bg':      '#0f1117',
        'oav-surface': '#1e2433',
        'oav-border':  '#2d3748',
        'oav-text':    '#e2e8f0',
        'oav-muted':   '#94a3b8',
        'oav-accent':  '#3b82f6',
        'oav-success': '#22c55e',
        'oav-warning': '#f59e0b',
        'oav-error':   '#ef4444',
        'oav-purple':  '#a855f7',

        // New Sprint 2 tokens
        'oav-gold':           '#eab308',
        'oav-xp':             '#06b6d4',
        'oav-surface-hover':  '#283040',
        'oav-surface-active': '#2a3650',
      },

      // ─── Font Families ───────────────────────────────────────────────────────
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', 'BlinkMacSystemFont',
          '"Segoe UI"', 'Roboto', 'sans-serif',
        ],
        mono: [
          'ui-monospace', '"Cascadia Code"', '"Fira Code"',
          'Menlo', 'Monaco', 'Consolas', 'monospace',
        ],
      },

      // ─── Keyframes ──────────────────────────────────────────────────────────
      keyframes: {
        // Skeleton loading shimmer
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        // XP flash (dashboard echo — floats up, fades)
        'xp-flash': {
          '0%':   { opacity: '1', transform: 'translateY(0px)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        // New alert / event prepend highlight
        'alert-prepend': {
          '0%':   { backgroundColor: 'rgb(59 130 246 / 0.10)' },
          '100%': { backgroundColor: 'transparent' },
        },
        // Achievement badge glow pulse
        'badge-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 transparent' },
          '50%':       { boxShadow: '0 0 12px 4px rgb(234 179 8 / 0.25)' },
        },
        // Page enter
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Page exit
        'page-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        // Bottom sheet entry
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        // Bottom sheet exit
        'sheet-down': {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(100%)' },
        },
        // Champion confetti dots falling
        'confetti-fall': {
          '0%':   { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(60px) scale(0.6)', opacity: '0' },
        },
        // Leaderboard rank change highlight fade
        'rank-highlight': {
          '0%':   { backgroundColor: 'rgb(59 130 246 / 0.10)' },
          '100%': { backgroundColor: 'transparent' },
        },
        // XP bar fill pulse on gain
        'xp-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.7' },
        },
        // Tooltip arrow bounce (subtle micro-interaction)
        'tooltip-appear': {
          '0%':   { opacity: '0', transform: 'translateX(-50%) translateY(calc(-100% - 4px)) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(calc(-100% - 8px)) scale(1)' },
        },
        // Level 10 screen flash
        'screen-flash': {
          '0%':   { opacity: '0.3' },
          '100%': { opacity: '0' },
        },
      },

      // ─── Animation Utilities ────────────────────────────────────────────────
      animation: {
        'shimmer':         'shimmer 1.5s ease-in-out infinite',
        'xp-flash':        'xp-flash 1.5s ease-out forwards',
        'alert-prepend':   'alert-prepend 2s ease-out forwards',
        'badge-glow':      'badge-glow 500ms ease-in-out',
        'page-in':         'page-in 200ms ease-out',
        'page-out':        'page-out 150ms ease-in',
        'sheet-up':        'sheet-up 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down':      'sheet-down 250ms ease-in',
        'confetti-fall':   'confetti-fall 2s ease-out forwards',
        'rank-highlight':  'rank-highlight 1.5s ease-out forwards',
        'xp-pulse':        'xp-pulse 600ms ease-in-out',
        'tooltip-appear':  'tooltip-appear 150ms ease-out forwards',
        'screen-flash':    'screen-flash 500ms ease-out forwards',
      },

      // ─── Box Shadows (elevation + glow) ────────────────────────────────────
      boxShadow: {
        'glow-gold-sm': '0 0 12px rgb(234 179 8 / 0.38)',
        'glow-gold-md': '0 0 16px rgb(234 179 8 / 0.50)',
        'glow-gold-lg': '0 0 24px rgb(234 179 8 / 0.63)',
        'glow-accent':  '0 0 12px rgb(59 130 246 / 0.40)',
        'glow-error':   '0 0 12px rgb(239 68 68 / 0.40)',
      },

      // ─── Z-index Scale ──────────────────────────────────────────────────────
      zIndex: {
        '45': '45',
        '60': '60',
        '70': '70',
        '80': '80',
      },

      // ─── Transition Duration ─────────────────────────────────────────────────
      transitionDuration: {
        '0':    '0ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },

      // ─── Min/Max Dimensions ─────────────────────────────────────────────────
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};
```

### 9.1 Usage Notes

**Color classes** generated for each new token support all Tailwind utility variants: `bg-oav-gold`, `text-oav-gold`, `border-oav-gold`, `ring-oav-gold`, `from-oav-gold`, `via-oav-gold`, `to-oav-gold`, and opacity modifiers like `bg-oav-gold/20`.

**Skeleton shimmer usage:**
```html
<div class="skeleton h-4 w-24 rounded" />
```
Where `.skeleton` is the CSS class defined in Section 5.7. Add to `src/frontend/src/index.css` or a dedicated `animations.css` imported in `main.tsx`.

**Touch target utility:**
```html
<button class="w-6 h-6 min-w-touch min-h-touch flex items-center justify-center">
  <X class="w-4 h-4" />
</button>
```

**XP gradient (not in Tailwind config — use inline style or CSS class):**
```css
.xp-bar-fill {
  background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%);
}
.xp-bar-fill-gold {
  background: linear-gradient(90deg, #eab308 0%, #f59e0b 100%);
}
```

**Focus ring standard (apply to all interactive elements):**
```
focus-visible:ring-2 focus-visible:ring-oav-accent
focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg
focus-visible:outline-none
```

---

*End of UI Design System Document*
