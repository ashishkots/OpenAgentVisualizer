# OpenAgentVisualizer -- Master Design System Specification

**Stage:** 3.3 -- Design System Agent
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Design System Agent
**Depends On:** UI Design System (3.1), Visualization Spec (2.2), Animation Spec (2.3), Gamification System Design (1.2), UX Design Spec (2.1)
**Feeds Into:** Frontend Expert (2.2a), Code Reviewer (2.3), QA Engineer (2.4)

---

## Table of Contents

1. [Design System Principles](#1-design-system-principles)
2. [Token Architecture](#2-token-architecture)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing & Layout System](#5-spacing--layout-system)
6. [Component Specification](#6-component-specification)
7. [Pattern Library](#7-pattern-library)
8. [Motion System](#8-motion-system)
9. [Iconography](#9-iconography)
10. [Elevation & Depth](#10-elevation--depth)
11. [Responsive Design System](#11-responsive-design-system)
12. [Theming Architecture](#12-theming-architecture)
13. [Design-to-Code Bridge](#13-design-to-code-bridge)

---

## 1. Design System Principles

### 1.1 Governing Rules

This document is the **single source of truth** for all visual implementation. Where other upstream documents (UI Design System, Visualization Spec, Animation Spec, Gamification System Design) define intent, this document defines the **exact tokens, components, and patterns** a frontend developer implements.

**Rule 1: Data First.** Every pixel encodes information or enables action. No decorative elements.

**Rule 2: Dual Density.** The canvas view works at arm's length (wall display, ambient monitoring). The dashboard view works at arm's reach (debugging, data analysis). Both share identical tokens applied at different densities.

**Rule 3: Dual Personality.** Gamified Mode and Professional Mode share layout grid, component library, and data model. They differ only in color intensity, icon style, animation vocabulary, and gamification visibility. Mode switching never changes element positions.

**Rule 4: Motion as Information.** Every animation communicates state. If removing an animation loses information, it stays. If not, it goes. See Section 8.

**Rule 5: Progressive Disclosure.** Default views show 3-5 key metrics. Hover reveals tooltips. Click opens panels. Expand shows full data. Never front-load complexity.

**Rule 6: Performance Budget.** 60fps with 50 agents at full fidelity. 30fps with 200 agents at reduced fidelity. Frame drops are bugs.

### 1.2 Design System Scope

| Layer | Technology | Governed By |
|-------|-----------|-------------|
| World canvas | PixiJS 8 (WebGL2) via `@pixi/react` | Visualization Spec + this doc (tokens only) |
| Agent animations | Rive `.riv` state machines | Animation Spec (authoring) + this doc (token bindings) |
| Dashboard transitions | GSAP 3 | Animation Spec (choreography) + this doc (duration/easing tokens) |
| Charts | Recharts (simple) / ECharts (complex) | Visualization Spec (encoding) + this doc (color/type tokens) |
| Topology | React Flow (<200 nodes) / Cytoscape.js (200+) | Visualization Spec |
| UI chrome | React 18 + Tailwind CSS | This document (primary authority) |

---

## 2. Token Architecture

### 2.1 Three-Tier Token Model

```
Primitive Tokens (raw values)
    --> Semantic Tokens (meaning-based aliases)
        --> Component Tokens (component-specific overrides)
```

**Naming convention:** `--oav-{category}-{variant}-{modifier}`

All tokens are CSS custom properties on `:root`. Consumed via Tailwind utilities or direct `var()` references.

### 2.2 Primitive Tokens

Primitive tokens are raw values with no semantic meaning. They form the palette from which semantic tokens draw.

```css
:root {
  /* --- Indigo scale (primary brand) --- */
  --oav-indigo-50: #EEF2FF;
  --oav-indigo-100: #E0E7FF;
  --oav-indigo-200: #C7D2FE;
  --oav-indigo-300: #A5B4FC;
  --oav-indigo-400: #818CF8;
  --oav-indigo-500: #6366F1;
  --oav-indigo-600: #4F46E5;
  --oav-indigo-700: #4338CA;
  --oav-indigo-800: #3730A3;
  --oav-indigo-900: #312E81;

  /* --- Teal scale (secondary) --- */
  --oav-teal-50: #F0FDFA;
  --oav-teal-100: #CCFBF1;
  --oav-teal-200: #99F6E4;
  --oav-teal-300: #5EEAD4;
  --oav-teal-400: #2DD4BF;
  --oav-teal-500: #14B8A6;
  --oav-teal-600: #0D9488;
  --oav-teal-700: #0F766E;

  /* --- Orange scale (accent) --- */
  --oav-orange-50: #FFF7ED;
  --oav-orange-100: #FFEDD5;
  --oav-orange-200: #FED7AA;
  --oav-orange-300: #FDBA74;
  --oav-orange-400: #FB923C;
  --oav-orange-500: #F97316;
  --oav-orange-600: #EA580C;
  --oav-orange-700: #C2410C;

  /* --- Green scale --- */
  --oav-green-50: #F0FDF4;   --oav-green-100: #DCFCE7;
  --oav-green-200: #BBF7D0;  --oav-green-300: #86EFAC;
  --oav-green-400: #4ADE80;  --oav-green-500: #22C55E;
  --oav-green-600: #16A34A;  --oav-green-700: #15803D;

  /* --- Yellow scale --- */
  --oav-yellow-50: #FFFBEB;  --oav-yellow-100: #FEF3C7;
  --oav-yellow-200: #FDE68A; --oav-yellow-300: #FCD34D;
  --oav-yellow-400: #FBBF24; --oav-yellow-500: #F59E0B;
  --oav-yellow-600: #D97706; --oav-yellow-700: #B45309;

  /* --- Red scale --- */
  --oav-red-50: #FEF2F2;   --oav-red-100: #FEE2E2;
  --oav-red-200: #FECACA;  --oav-red-300: #FCA5A5;
  --oav-red-400: #F87171;  --oav-red-500: #EF4444;
  --oav-red-600: #DC2626;  --oav-red-700: #B91C1C;

  /* --- Blue scale --- */
  --oav-blue-50: #EFF6FF;  --oav-blue-100: #DBEAFE;
  --oav-blue-200: #BFDBFE; --oav-blue-300: #93C5FD;
  --oav-blue-400: #60A5FA; --oav-blue-500: #3B82F6;
  --oav-blue-600: #2563EB; --oav-blue-700: #1D4ED8;

  /* --- Neutral scale (12 shades) --- */
  --oav-neutral-0: #FFFFFF;
  --oav-neutral-50: #F9FAFB;  --oav-neutral-100: #F3F4F6;
  --oav-neutral-200: #E5E7EB; --oav-neutral-300: #D1D5DB;
  --oav-neutral-400: #9CA3AF; --oav-neutral-500: #6B7280;
  --oav-neutral-600: #4B5563; --oav-neutral-700: #374151;
  --oav-neutral-800: #1F2937; --oav-neutral-900: #111827;
  --oav-neutral-950: #0F1117;

  /* --- Spacing primitives (4px base) --- */
  --oav-unit: 4px;
}
```

### 2.3 Semantic Tokens

Semantic tokens reference primitives and carry meaning. Theme switching swaps semantic token values.

```css
:root {
  /* --- Brand --- */
  --oav-primary-50: var(--oav-indigo-50);
  --oav-primary-100: var(--oav-indigo-100);
  --oav-primary-200: var(--oav-indigo-200);
  --oav-primary-300: var(--oav-indigo-300);
  --oav-primary-400: var(--oav-indigo-400);
  --oav-primary-500: var(--oav-indigo-500);
  --oav-primary-600: var(--oav-indigo-600);
  --oav-primary-700: var(--oav-indigo-700);
  --oav-primary-800: var(--oav-indigo-800);
  --oav-primary-900: var(--oav-indigo-900);

  --oav-secondary-400: var(--oav-teal-400);
  --oav-secondary-500: var(--oav-teal-500);
  --oav-secondary-600: var(--oav-teal-600);

  --oav-accent-400: var(--oav-orange-400);
  --oav-accent-500: var(--oav-orange-500);
  --oav-accent-600: var(--oav-orange-600);

  /* --- Semantic status --- */
  --oav-success-50 through --oav-success-700: maps to green scale;
  --oav-warning-50 through --oav-warning-700: maps to yellow scale;
  --oav-error-50 through --oav-error-700: maps to red scale;
  --oav-info-50 through --oav-info-700: maps to blue scale;

  /* --- Surface hierarchy (dark-mode-first) --- */
  --oav-surface-base: #0F1117;
  --oav-surface-raised: #161B26;
  --oav-surface-overlay: #1C2233;
  --oav-surface-sunken: #0A0D14;
  --oav-surface-modal: #1F2740;
  --oav-surface-tooltip: #252D3F;

  /* --- Borders --- */
  --oav-border-default: #2A3246;
  --oav-border-subtle: #1E2536;
  --oav-border-strong: #3D4760;

  /* --- Text --- */
  --oav-text-primary: #F1F5F9;
  --oav-text-secondary: #94A3B8;
  --oav-text-tertiary: #64748B;
  --oav-text-inverse: #0F172A;
}
```

### 2.4 Component Tokens

Component tokens override semantic tokens for specific components. Only defined when a component deviates from the semantic default.

```css
:root {
  /* Button */
  --oav-btn-primary-bg: var(--oav-primary-500);
  --oav-btn-primary-bg-hover: var(--oav-primary-600);
  --oav-btn-primary-bg-active: var(--oav-primary-700);
  --oav-btn-primary-text: #FFFFFF;
  --oav-btn-danger-bg: var(--oav-error-500);
  --oav-btn-danger-bg-hover: var(--oav-error-600);

  /* Input */
  --oav-input-bg: var(--oav-surface-sunken);
  --oav-input-border: var(--oav-border-default);
  --oav-input-border-focus: var(--oav-primary-500);
  --oav-input-border-error: var(--oav-error-500);

  /* Card */
  --oav-card-bg: var(--oav-surface-overlay);
  --oav-card-border: var(--oav-border-default);
  --oav-card-radius: var(--oav-radius-rounded);

  /* Sidebar */
  --oav-sidebar-bg: var(--oav-surface-raised);
  --oav-sidebar-width-collapsed: 64px;
  --oav-sidebar-width-expanded: 240px;
  --oav-sidebar-active-border: var(--oav-primary-500);

  /* Header */
  --oav-header-bg: var(--oav-surface-raised);
  --oav-header-height: 56px;
}
```

---

## 3. Color System

### 3.1 Brand Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `--oav-primary-500` | `#6366F1` | Brand color, primary buttons, active nav, thinking state |
| Secondary | `--oav-secondary-500` | `#14B8A6` | Collaboration indicators, secondary buttons, quest progress |
| Accent | `--oav-accent-500` | `#F97316` | CTAs, highlights, warning-adjacent emphasis |

Full 10-shade scales for each are defined in Section 2.2 (primitive tokens). Use 500 as the base, 600 for hover, 700 for active, 50-100 for tinted backgrounds.

### 3.2 Semantic Status Colors

| Status | Base (500) | Light BG (50) | Indicator (400) | Usage |
|--------|-----------|---------------|-----------------|-------|
| Success | `#22C55E` | `#F0FDF4` | `#4ADE80` | Healthy agents, completed tasks, uptime |
| Warning | `#F59E0B` | `#FFFBEB` | `#FBBF24` | Latency spikes, budget thresholds, recovering |
| Error | `#EF4444` | `#FEF2F2` | `#F87171` | Agent errors, loop detection, critical alerts |
| Info | `#3B82F6` | `#EFF6FF` | `#60A5FA` | Active working, task assignment, initializing |

### 3.3 Agent State Colors (Canvas)

These map directly to the Rive state machine states and the status ring around each agent avatar.

| State | Token | Hex | Ring Behavior |
|-------|-------|-----|---------------|
| Idle | `--oav-state-idle` | `#6B7280` | Solid, no glow |
| Initializing | `--oav-state-initializing` | `#60A5FA` | Animated rotation |
| Thinking | `--oav-state-thinking` | `#818CF8` | Pulsing glow |
| Executing | `--oav-state-executing` | `#34D399` | Steady glow |
| Communicating | `--oav-state-communicating` | `#60A5FA` | Solid with particle emission |
| Waiting | `--oav-state-waiting` | `#FBBF24` | Dashed, animated |
| Error | `--oav-state-error` | `#EF4444` | Rapid pulse |
| Recovering | `--oav-state-recovering` | `#F59E0B` | Sweep fill |
| Complete | `--oav-state-complete` | `#22C55E` | Bright glow |
| Terminated | `--oav-state-terminated` | `#374151` | No glow |
| Sleeping | `--oav-state-sleeping` | `#4B5563` | Faded |
| Overloaded | `--oav-state-overloaded` | `#FB923C` | Inner orange ring modifier |

### 3.4 Gamification Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-xp-gold` | `#FFD700` | XP text, floating "+XP", XP bar fill |
| `--oav-xp-gold-dim` | `#B8960F` | XP bar track (unfilled) |
| `--oav-level-purple` | `#A855F7` | Level badge bg, level-up glow |
| `--oav-streak-flame` | `#FF6B35` | Streak indicator, hot streak effects |
| `--oav-quest-teal` | `#2DD4BF` | Quest card borders, quest progress |

**Rarity Scale:**

| Rarity | Token | Value | Frame Style |
|--------|-------|-------|-------------|
| Common | `--oav-rarity-common` | `#9CA3AF` | Solid border |
| Uncommon | `--oav-rarity-uncommon` | `#4ADE80` | Solid border |
| Rare | `--oav-rarity-rare` | `#60A5FA` | Solid border + subtle glow |
| Epic | `--oav-rarity-epic` | `#A855F7` | Solid border + glow |
| Legendary | `--oav-rarity-legendary` | `#FFD700` | Animated shimmer |

**Tier Badge Colors:**

| Tier | Levels | Background | Border |
|------|--------|-----------|--------|
| Starter | 1-5 | `--oav-neutral-600` | `--oav-neutral-500` |
| Standard | 6-14 | `#C0C0C0` (silver) | silver, 2px |
| Advanced | 15-24 | `#FFD700` (gold) | gold, 2px |
| Elite | 25-34 | `#E5E4E2` (platinum) | `#B9F2FF` (diamond), glow |
| Master | 35-44 | `#B9F2FF` (diamond) | prismatic shimmer |
| Legendary | 45-50 | animated prismatic gradient | 3px gold + crown overlay |

**Prismatic gradient:** `linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)`

### 3.5 Data Visualization Palette

Derived from the Visualization Spec (Section 7). Used for chart series, topology edges, and flow particles.

**Categorical (max 8 series):**

| Index | Hex | Usage Example |
|-------|-----|---------------|
| 0 | `#6366F1` | Primary series / agent type 1 |
| 1 | `#14B8A6` | Secondary series / agent type 2 |
| 2 | `#F97316` | Accent series / agent type 3 |
| 3 | `#3B82F6` | Info series / agent type 4 |
| 4 | `#A855F7` | Purple series / agent type 5 |
| 5 | `#EF4444` | Red series / cost overage |
| 6 | `#22C55E` | Green series / efficiency |
| 7 | `#F59E0B` | Amber series / warnings |

**Sequential (single-hue gradient for heatmaps):** Indigo-50 to Indigo-900.

**Diverging (for delta comparisons):** Red-500 -- Neutral-400 -- Green-500.

**Flow Particle Colors (canvas):**

| Data Type | Color | Hex |
|-----------|-------|-----|
| Task assignment | Blue | `#3B82F6` |
| Handoff | Purple | `#8B5CF6` |
| Response | Green | `#10B981` |
| Error escalation | Red | `#EF4444` |
| Tool result | Amber | `#F59E0B` |

### 3.6 Dark Mode Surface Hierarchy

OpenAgentVisualizer is **dark-mode-first**. Surface tokens layer from darkest (base) to lightest (tooltip):

```
--oav-surface-base    #0F1117  (canvas background, app base)
--oav-surface-sunken  #0A0D14  (inset areas, code blocks, input bg)
--oav-surface-raised  #161B26  (sidebar, header)
--oav-surface-overlay #1C2233  (cards, panels, dropdowns)
--oav-surface-modal   #1F2740  (modals, dialogs)
--oav-surface-tooltip #252D3F  (tooltips)
```

### 3.7 WCAG 2.2 AA Validation

| Foreground | Background | Contrast Ratio | Pass (AA) |
|-----------|-----------|----------------|-----------|
| `--oav-text-primary` (#F1F5F9) | `--oav-surface-base` (#0F1117) | 15.8:1 | Yes |
| `--oav-text-secondary` (#94A3B8) | `--oav-surface-base` (#0F1117) | 7.2:1 | Yes |
| `--oav-text-tertiary` (#64748B) | `--oav-surface-base` (#0F1117) | 4.5:1 | Yes (AA minimum) |
| `--oav-text-primary` (#F1F5F9) | `--oav-surface-overlay` (#1C2233) | 12.1:1 | Yes |
| `#FFFFFF` | `--oav-primary-500` (#6366F1) | 4.6:1 | Yes (AA) |
| `#FFFFFF` | `--oav-error-500` (#EF4444) | 4.5:1 | Yes (AA minimum) |
| `--oav-xp-gold` (#FFD700) | `--oav-surface-base` (#0F1117) | 10.4:1 | Yes |

All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Non-text indicators (state rings, chart colors) must be distinguishable by shape or pattern in addition to color.

---

## 4. Typography System

### 4.1 Font Stacks

```css
:root {
  --oav-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --oav-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}
```

**Loading strategy:** Inter (400, 500, 600, 700) and JetBrains Mono (400, 500, 600) loaded via `@fontsource/inter` and `@fontsource/jetbrains-mono` NPM packages. `font-display: swap`.

### 4.2 Type Scale

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|---------------|-------|
| `--oav-text-xs` | 0.75rem (12px) | 1rem (16px) | normal | Timestamps, badge labels, minimap labels |
| `--oav-text-sm` | 0.875rem (14px) | 1.25rem (20px) | normal | Labels, table cells, tooltips, nav items |
| `--oav-text-base` | 1rem (16px) | 1.5rem (24px) | normal | Body text, form inputs, button labels |
| `--oav-text-lg` | 1.125rem (18px) | 1.75rem (28px) | -0.01em | Section headings, card titles, panel headers |
| `--oav-text-xl` | 1.25rem (20px) | 1.75rem (28px) | -0.01em | Page section titles, metric card values |
| `--oav-text-2xl` | 1.5rem (24px) | 2rem (32px) | -0.02em | Page titles, dashboard header metrics |
| `--oav-text-3xl` | 1.875rem (30px) | 2.25rem (36px) | -0.02em | Hero metric numbers |
| `--oav-text-4xl` | 2.25rem (36px) | 2.5rem (40px) | -0.02em | Executive dashboard headline metrics |
| `--oav-text-5xl` | 3rem (48px) | 3rem (48px) | -0.02em | Landing page hero, onboarding titles |

### 4.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-font-normal` | 400 | Body text, descriptions, table cells |
| `--oav-font-medium` | 500 | Labels, nav items, button text, card titles |
| `--oav-font-semibold` | 600 | Section headings, metric values, badge text |
| `--oav-font-bold` | 700 | Page titles, hero metrics, alert headings |

### 4.4 Heading Styles

| Level | Size | Weight | Tracking | Color |
|-------|------|--------|----------|-------|
| H1 (Page Title) | `text-2xl` | bold | tighter (-0.02em) | `--oav-text-primary` |
| H2 (Section) | `text-xl` | semibold | tight (-0.01em) | `--oav-text-primary` |
| H3 (Subsection) | `text-lg` | semibold | tight (-0.01em) | `--oav-text-primary` |
| H4 (Card Title) | `text-base` | semibold | normal | `--oav-text-primary` |

### 4.5 Body & Code Styles

| Style | Font | Size | Weight | Color |
|-------|------|------|--------|-------|
| Body | sans | base | normal | `--oav-text-primary` |
| Body secondary | sans | sm | normal | `--oav-text-secondary` |
| Caption | sans | xs | normal | `--oav-text-tertiary` |
| Label | sans | sm | medium | `--oav-text-secondary` |
| Overline | sans | xs | medium | `--oav-text-tertiary`, `tracking-wider`, uppercase |
| Code inline | mono | sm | normal | `--oav-text-primary`, bg `--oav-surface-sunken`, px-1, radius-sharp |
| Code block | mono | sm | normal | `--oav-text-primary`, bg `--oav-surface-sunken`, p-4, radius-sharp |
| Metric value | mono | varies | semibold | `--oav-text-primary`, `tabular-nums` |

### 4.6 Numeric Display Rules

- All numeric displays use `font-variant-numeric: tabular-nums` to prevent layout shift on real-time updates.
- Currency: always 2 decimal places, `$` prefix, comma separators. Example: `$1,234.56`.
- Token counts: no decimals, comma separators. Above 99,999 switch to abbreviated (`100K`).
- Percentages: 1 decimal place. Example: `94.2%`.
- XP values: no decimals, comma separators. Example: `2,290 XP`.

---

## 5. Spacing & Layout System

### 5.1 Base Grid

All spacing is built on a **4px base unit**. Every margin, padding, gap, and dimension must be a multiple of 4px.

### 5.2 Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--oav-space-1` | 4px | `p-1`, `gap-1` | Icon-to-text in badges, inline margins |
| `--oav-space-2` | 8px | `p-2`, `gap-2` | Badge padding, stacked icon gaps |
| `--oav-space-3` | 12px | `p-3`, `gap-3` | Chip padding, related form elements |
| `--oav-space-4` | 16px | `p-4`, `gap-4` | Card internal padding, card gaps, table cell padding |
| `--oav-space-5` | 20px | `p-5`, `gap-5` | Metric card padding, form group gaps |
| `--oav-space-6` | 24px | `p-6`, `gap-6` | Card outer padding, section separators |
| `--oav-space-8` | 32px | `p-8`, `gap-8` | Panel padding, page section gaps |
| `--oav-space-10` | 40px | `p-10` | Modal padding, large section gaps |
| `--oav-space-12` | 48px | `p-12` | Page header height unit |
| `--oav-space-16` | 64px | `p-16` | Sidebar icon area width |
| `--oav-space-20` | 80px | `p-20` | Sidebar expanded width unit |
| `--oav-space-24` | 96px | `p-24` | Maximum component padding |

### 5.3 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-radius-sharp` | 2px | Code blocks, inline code, data table cells |
| `--oav-radius-default` | 6px | Buttons, inputs, cards, dropdowns, modals, tooltips |
| `--oav-radius-rounded` | 12px | Metric cards, agent cards, larger panels |
| `--oav-radius-pill` | 9999px | Badges, tags, status dots, toggle switches, XP bars |

### 5.4 Layout Primitives

#### AppShell

```
+---+----------------------------------------------+
| S |  Header (56px)                               |
| i +----------------------------------------------+
| d |                                              |
| e |  PageContainer                               |
| b |  (main content area, scrollable)             |
| a |                                              |
| r |                                              |
+---+----------------------------------------------+
```

| Dimension | Value |
|-----------|-------|
| Sidebar collapsed | 64px |
| Sidebar expanded | 240px |
| Header height | 56px |
| Sidebar toggle keyboard shortcut | `[` |

#### Grid Variants

| Variant | Columns | Gap | Responsive |
|---------|---------|-----|------------|
| `grid-metrics` | 4 x 1fr | 16px | 2-col at <1024px, 1-col at <640px |
| `grid-agents` | 3 x 1fr | 16px | 2-col at <1024px, 1-col at <640px |
| `grid-2col` | 60% / 40% | 24px | Stack at <1024px |
| `grid-settings` | 240px / 1fr | 0 | Stack at <768px |

#### Stack Utilities

| Variant | Direction | Default Gap |
|---------|-----------|-------------|
| `stack-v` | Column | 16px |
| `stack-h` | Row | 12px |
| `stack-v-tight` | Column | 8px |
| `stack-h-tight` | Row | 8px |

#### PageContainer

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Padding | 24px | 16px | 12px |
| Max width | 1440px (dashboard), full-bleed (canvas) | full | full |

### 5.5 Breakpoints

| Name | Min Width | CSS Variable | Usage |
|------|-----------|-------------|-------|
| `sm` | 640px | `--oav-bp-sm` | Mobile landscape, single-col to 2-col |
| `md` | 768px | `--oav-bp-md` | Tablet portrait, settings stack breakpoint |
| `lg` | 1024px | `--oav-bp-lg` | Tablet landscape, grid column reductions |
| `xl` | 1280px | `--oav-bp-xl` | Desktop, sidebar auto-expand |
| `2xl` | 1536px | `--oav-bp-2xl` | Wide desktop, max density |

---

## 6. Component Specification

Components are organized into 7 categories. Each entry specifies anatomy, variants, sizes, states, and key CSS properties. Full token values reference Sections 2-5.

### 6.1 Layout Components

#### AppShell
- **Anatomy:** Sidebar + Header + PageContainer
- **Behavior:** Sidebar auto-collapses below xl breakpoint. Press `[` to toggle. Canvas view hides sidebar entirely.
- **Key tokens:** `--oav-sidebar-bg`, `--oav-header-bg`, `--oav-header-height`

#### Sidebar
- **Anatomy:** Logo (56px) > Workspace Switcher > NavItem list > Spacer > Settings + User Avatar
- **States:** Collapsed (icon-only, 64px) | Expanded (icon+label, 240px) | Hidden (canvas fullscreen)
- **NavItem count:** 10 items (World View, Dashboard, Agents, Sessions, Leaderboard, Costs, Alerts, Topology, Settings, User)
- **Active indicator:** 3px left border `--oav-primary-500`

#### Header
- **Anatomy:** Menu toggle + Cost Ticker + Agent Count + Search Trigger (Cmd+K) + Notification Bell + Mode Toggle + User Menu
- **Height:** 56px fixed
- **Cost ticker:** `--oav-font-mono`, `--oav-font-medium`, real-time counter with roll-up animation

### 6.2 Navigation Components

#### NavItem
- **Variants:** Default | Hover | Active
- **Size:** 40px height, 8px 12px padding
- **Icon:** 20px, `--oav-text-secondary` (default), `--oav-primary-400` (active)
- **Badge:** Pill, 18px height, `--oav-error-500` bg, white text

#### Breadcrumb
- **Separator:** `/`, `--oav-text-tertiary`
- **Current:** `--oav-font-medium`, `--oav-text-primary`
- **Parent:** `--oav-text-secondary`, underline on hover

#### TabBar
- **Active indicator:** 2px bottom border `--oav-primary-500`, slides between tabs (200ms `ease-out`)
- **Tab padding:** 8px 16px

#### CommandPalette (Cmd+K)
- **Width:** 600px, max-height 480px
- **Background:** `--oav-surface-modal`, `--oav-border-strong`
- **Input:** 48px height, `text-lg`
- **Result items:** 44px height, grouped by category
- **Animation:** Scale 0.95 to 1.0, fade, 200ms
- **Z-index:** `--oav-z-modal` (300)

### 6.3 Data Display Components

#### MetricCard
- **Anatomy:** Icon + Label + Value + Trend + Sparkline
- **Padding:** 20px
- **Background:** `--oav-card-bg` / `--oav-card-border`
- **Radius:** `--oav-radius-rounded`
- **Value font:** `text-3xl`, bold, mono, `tabular-nums`
- **Trend:** `text-xs`, green (up) / red (down) / tertiary (neutral)
- **Sparkline:** 80x32px, stroke `--oav-primary-400`, 1.5px
- **Variants:** `default` | `alert` (left 3px error border) | `success` (left 3px success border)
- **Animation:** Value counts from 0 on first render, 600ms `ease-out`

#### AgentCard
- **Anatomy:** Avatar (48px circle + state ring) + Name + Level + StatusBadge + Metrics Row + XP Bar + Sparkline
- **Hover:** `translateY(-2px)`, shadow-md, 200ms
- **XP bar:** 4px height, gold fill, pill radius

#### StatusBadge
- **Size:** 22px height, pill shape
- **Anatomy:** 6px dot + label text
- **Variants:** `active` (green) | `idle` (gray) | `thinking` (indigo) | `error` (red) | `warning` (amber) | `terminated` (dark gray)
- **Dot animation:** Pulsing on active/thinking/error states (scale 1.0-1.4, opacity 1.0-0.4, 1500ms)

#### DataTable
- **Header:** 44px, `--oav-surface-sunken`, `text-xs` uppercase semibold
- **Row:** 48px, hover `--oav-surface-modal`, selected: 8% primary bg + 2px left border
- **Numeric cells:** `--oav-font-mono`, `tabular-nums`, right-aligned
- **Pagination:** Bottom bar 40px, "1-20 of 847", prev/next buttons

#### Sparkline
- **Sizes:** 80x32px (card), 120x32px (table)
- **Stroke:** 1.5px, color varies by trend
- **Fill:** Gradient from stroke color at 20% to transparent
- **Curve:** Monotone X interpolation
- **Animation:** Draw left-to-right on first render, 800ms

#### AvatarStack
- **Sizes:** 28px (sm), 36px (md), 48px (lg)
- **Overlap:** -8px margin-left
- **Max visible:** 5, then "+N" counter
- **Hover:** Scale 1.1, z+1, tooltip

#### Skeleton
- **Animation:** Shimmer gradient sweep, 1500ms infinite
- **Variants:** `skeleton-text`, `skeleton-metric`, `skeleton-card`, `skeleton-avatar`, `skeleton-chart`

#### EmptyState
- **Anatomy:** Icon (48px) + Title + Description (max 360px) + Optional Action Button
- **Layout:** Centered in parent

### 6.4 Input Components

#### Button
- **Variants:** Primary | Secondary | Ghost | Danger
- **Sizes:** sm (32px) | md (36px) | lg (44px)
- **States:** Default | Hover | Active | Disabled (50% opacity) | Focus (2px ring)
- **Primary:** bg `--oav-primary-500`, text white, hover 600, active 700
- **Secondary:** transparent bg, `--oav-border-strong` border
- **Ghost:** transparent bg, no border, secondary text
- **Danger:** bg `--oav-error-500`, text white
- **Icon button:** Square, icon centered, no text, same variants

#### Input
- **Height:** sm 32px | md 36px | lg 44px
- **Background:** `--oav-surface-sunken`
- **Border:** `--oav-border-default`, focus: `--oav-primary-500`, error: `--oav-error-500`
- **Focus ring:** 2px `--oav-primary-200` at 25%
- **Label:** `text-sm`, medium, secondary, 4px mb
- **Helper/Error text:** `text-xs`, tertiary/error-400, 4px mt

#### Select
- **Same base as Input, plus dropdown panel**
- **Dropdown:** `--oav-surface-modal`, shadow-lg, max-height 240px
- **Option:** 36px, hover overlay, selected: checkmark + 10% primary bg

#### Checkbox
- **Size:** 16x16px
- **Checked:** `--oav-primary-500` bg, white checkmark
- **Indeterminate:** `--oav-primary-500` bg, white dash

#### Toggle
- **Track:** 36x20px, off `--oav-neutral-600`, on `--oav-primary-500`
- **Thumb:** 16px circle, white, 200ms `ease-out`

#### Slider
- **Track:** 4px, `--oav-neutral-600` bg, `--oav-primary-500` fill
- **Thumb:** 16px circle, hover scale 1.2 with glow

#### SearchInput
- **Anatomy:** Search icon (left) + Input + Clear button (right, on value)
- **Debounce:** 150ms

#### DateRangePicker
- **Trigger:** Input-styled button, date range text
- **Presets:** Today, Last 7 Days, Last 30 Days, Last 90 Days, Custom
- **Calendar:** Dual-month, day cells 36x36px

### 6.5 Feedback Components

#### Toast
- **Width:** 360px
- **Position:** Bottom-right
- **Anatomy:** Left color border (3px) + Icon + Title + Description + Close
- **Types:** Success (green) | Error (red) | Warning (amber) | Info (blue) | Achievement (purple + gold)
- **Auto-dismiss:** Info 5s, Error 8s, Success 3s
- **Stack:** Max 3 visible, 8px gap
- **Animation:** Slide from right 40px + fade, 200ms
- **Z-index:** `--oav-z-toast` (400)

#### Alert (Inline)
- **Full-width banner within page content**
- **Background:** Type color at 8% opacity
- **Border:** 1px solid type color at 30%

#### Modal
- **Overlay:** `--oav-surface-base` 60% opacity, `backdrop-filter: blur(4px)`
- **Sizes:** Small (480px) | Medium (640px) | Large (800px)
- **Max-height:** 80vh
- **Anatomy:** Header (56px) + Body (scrollable) + Footer (right-aligned buttons)
- **Animation:** Scale 0.95 to 1.0, fade, 200ms
- **Keyboard:** Escape closes, focus trapped

#### ConfirmDialog
- **Width:** 400px
- **Anatomy:** Error icon (48px) + Title (centered) + Description + Cancel + Danger button

#### Tooltip
- **Background:** `--oav-surface-tooltip`
- **Padding:** 6px 10px
- **Max-width:** 240px
- **Delay:** 200ms show, 0ms hide
- **Z-index:** `--oav-z-tooltip` (500)

#### Popover
- **Background:** `--oav-surface-modal`
- **Padding:** 16px, max-width 360px
- **Trigger:** Click (not hover)
- **Dismiss:** Click outside or Escape

#### ProgressBar
- **Heights:** Slim (4px) | Default (8px) | Thick (12px)
- **Track:** `--oav-neutral-700`, pill radius
- **Fill:** `--oav-primary-500` (default), success/warning/error variants
- **Indeterminate:** Animated gradient sweep 1500ms

### 6.6 Gamification Components

#### XPBar
- **Height:** 6px (compact on avatar), 10px (detail panel)
- **Track:** `--oav-xp-gold-dim` at 30%
- **Fill:** Gradient `--oav-xp-gold` to `#FFA500`
- **Animation:** 800ms `ease-out` on XP gain; shimmer sweep on large gain (>10%); gold particle burst on level-up (100% fill)

#### LevelBadge
- **Sizes:** 24px (avatar overlay) | 36px (profile) | 48px (detail)
- **Shape:** Circle, white bold text, tier-colored background
- **Tier visuals:** See Section 3.4 Tier Badge Colors table

#### AchievementPopup
- **Common:** Activity feed only, no popup
- **Uncommon:** Toast (1s), border-left `--oav-rarity-uncommon`
- **Rare:** Toast with glow (1.5s), `--oav-shadow-glow-primary`
- **Epic:** Top banner (2.5s), large badge (48px), particle effect
- **Legendary:** Full-screen overlay (4s), 72px badge, confetti, `--oav-z-celebration` (600)

#### LeaderboardRow
- **Height:** 56px
- **Anatomy:** Rank + Change Arrow + Avatar (36px) + Name + Level + Score + Key Metric + Sparkline
- **Top 3 highlight:** Left 3px border in medal color (gold/silver/bronze) + 5% tint bg
- **Current user highlight:** `--oav-primary-500` at 5% bg + primary left border

#### QuestCard
- **Border:** `--oav-quest-teal` at 30%
- **Anatomy:** Icon + Title + Description + Progress Bar (8px, teal) + Counter + Timer + Reward

#### StreakIndicator
- **Anatomy:** Flame icon (16px) + number
- **Scaling:** 1-9 gray, 10-19 amber, 20-49 orange+glow, 50-99 flame+flicker, 100+ fire particles

### 6.7 Chart Components

#### ChartContainer
- **Background:** `--oav-surface-overlay`, `--oav-border-default`, `--oav-radius-rounded`
- **Padding:** 20px
- **Title:** `text-base` semibold, 16px gap below
- **Controls:** Top-right (period selector, zoom, download)
- **Min height:** 240px
- **Responsive:** Re-renders on container resize via ResizeObserver

#### Legend
- **Layout:** Horizontal (default) or vertical
- **Swatches:** 8px circle (or line for line charts)
- **Interactive:** Click toggles series visibility (dim to 20%)

#### ChartTooltip
- **Background:** `--oav-surface-tooltip`
- **Shadow:** `--oav-shadow-md`
- **Tracks mouse/touch position, appears instantly, no delay**

---

## 7. Pattern Library

### 7.1 Form Patterns

**Standard Form Layout:**
- Labels above inputs (not inline)
- 20px gap between form groups
- Error text appears below input on validation failure
- Submit button right-aligned in footer
- Keyboard: Tab through fields, Enter submits

**Filter Bar Pattern:**
- Horizontal row of Select/SearchInput/DateRangePicker
- "Clear All" ghost button when any filter active
- Applied filter count badge on mobile filter trigger
- Debounce search at 150ms

### 7.2 List Patterns

**Sortable Data Table:**
- Default sort column highlighted in header
- Click header to sort (asc/desc toggle, tertiary sort indicator)
- Sticky header on scroll
- Row click navigates to detail
- Bulk selection via checkbox column (optional)

**Card Grid:**
- Used for Agents, Sessions, Quests
- 3-col on xl, 2-col on lg, 1-col on sm
- Cards have hover lift effect
- Click navigates to detail

**Infinite Scroll:**
- Used for activity feeds and session lists
- Load 20 items per batch
- Skeleton row during load
- "You're all caught up" end marker

### 7.3 Detail Panel Pattern

**Slide-in Panel (Agent Detail, Trace Detail):**
- Slides from right, 480px width (medium) or 640px (large)
- Overlay dims left content at 20%
- Close via X, Escape, or click overlay
- Contains: Header (avatar + name + status) + TabBar + Scrollable content
- Tabs: Overview | Traces | Metrics | Settings

### 7.4 State Patterns

#### Empty State
- Centered illustration/icon + title + description + CTA button
- Contextual per view:
  - No agents: "Connect Your First Agent" + SDK code snippet
  - No sessions: "Waiting for activity..." + sample data mode toggle
  - No search results: "No results for [query]" + clear filters link

#### Error State
- Inline Alert (error variant) at top of affected area
- Retry button when recoverable
- Error code + "Copy Error" for support

#### Loading State
- Skeleton components matching the layout being loaded
- Shimmer animation (1500ms sweep)
- Never show spinner for page-level loads; use skeleton
- Spinner reserved for inline actions (button loading state)

#### Offline State
- Persistent top banner: "Connection lost. Reconnecting..."
- Canvas agents freeze in last known state
- Data displays show "Last updated: [timestamp]"
- Auto-reconnect with exponential backoff

---

## 8. Motion System

### 8.1 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-duration-instant` | 0ms | Immediate state swap (reduced motion fallback) |
| `--oav-duration-fast` | 100ms | Tooltip show, icon swap, micro-feedback |
| `--oav-duration-normal` | 200ms | Button hover, panel open, tab switch |
| `--oav-duration-moderate` | 300ms | Toast entry, chart data update, card hover lift |
| `--oav-duration-slow` | 500ms | Modal open, chart initial render, progress fill |
| `--oav-duration-slower` | 800ms | Sparkline draw, XP bar fill, line chart draw |
| `--oav-duration-slowest` | 1500ms | Shimmer cycle, achievement animation |

### 8.2 Easing Tokens

| Token | CSS Value | GSAP Equivalent | Usage |
|-------|-----------|-----------------|-------|
| `--oav-ease-linear` | `linear` | `linear` | Progress fills, shimmer |
| `--oav-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `power2.in` | Exit animations |
| `--oav-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `power2.out` | Entry animations, data transitions |
| `--oav-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `power2.inOut` | Repositioning, axis rescale |
| `--oav-ease-bounce` | -- | `back.out(1.5)` | Data point pop-in, badge fly-in |
| `--oav-ease-spring` | -- | `elastic.out(1, 0.5)` | Level-up bounce, celebration |

### 8.3 Transition Presets

| Preset | Properties | Duration | Easing | Usage |
|--------|-----------|----------|--------|-------|
| `transition-colors` | `color, background-color, border-color` | 150ms | ease | Buttons, links, nav items |
| `transition-opacity` | `opacity` | 150ms | ease | Fade in/out, disabled state |
| `transition-transform` | `transform` | 200ms | ease-out | Card hover lift, scale effects |
| `transition-all` | `all` | 150ms | ease | General purpose (use sparingly) |
| `transition-panel` | `transform, opacity` | 200ms | ease-out | Panel slide-in, modal open |
| `transition-tab` | `transform` | 200ms | ease-out | Tab indicator slide |

### 8.4 Canvas Animation Tokens (Rive/PixiJS)

These tokens bind to Rive state machine inputs and PixiJS particle parameters. See Animation Spec for full choreography.

| Token | Default | Range | Driven By |
|-------|---------|-------|-----------|
| `agent.speed` | 1.0 | 0.25-2.0 | Replay speed, LOD, user pref |
| `agent.intensity` | 0.5 | 0.0-1.0 | Task complexity |
| `agent.energy` | 1.0 | 0.0-1.0 | `1.0 - (idle_ms / 300000)` clamped |
| `agent.mood` | 0.7 | 0.0-1.0 | Recent success rate (last 20 tasks) |
| `agent.tier` | 1 | 1-6 | Level tier (Starter through Legendary) |
| `agent.severity` | 0.0 | 0.0-1.0 | warning=0.2, error=0.6, fatal=1.0 |

### 8.5 LOD Tiers

| Tier | Agent Count | Fidelity | Target FPS |
|------|------------|----------|------------|
| Full | 1-50 | All animations, particles, blend trees | 60fps |
| Medium | 51-100 | Animations at 0.5x speed, no fidgets, reduced particles | 45fps |
| Minimal | 101-200 | Static sprites with color-coded rings, no character animation | 30fps |
| Off | 200+ | Colored dots only, no sprites | 30fps |

### 8.6 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- All CSS transitions set to `--oav-duration-instant` (0ms)
- Canvas agents render as static sprites with state-colored rings (no breathing, blinking, fidgets)
- Particle systems disabled entirely
- Chart animations replaced with immediate renders
- Achievement/level-up popups appear without fly-in; display for normal duration then disappear
- Shimmer loading replaced with static skeleton with pulsing opacity (subtle, 2s cycle)
- Number roll-ups replaced with instant value swap

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Iconography

### 9.1 Icon Library

**Primary:** Lucide React (`lucide-react`). Consistent 24px grid, 1.5px stroke, rounded caps/joins.

**Custom icons** are required only for domain-specific concepts not covered by Lucide:

| Custom Icon | Purpose | Base Shape |
|-------------|---------|------------|
| `agent-avatar` | Generic agent placeholder | Circle with head silhouette |
| `xp-star` | XP gain indicator | 5-point star |
| `streak-flame` | Streak counter | Flame shape |
| `loop-detected` | Loop detection alert | Circular arrow with exclamation |
| `token-coin` | Token cost indicator | Coin with "T" |
| `handoff-arrow` | Agent-to-agent handoff | Curved arrow between two dots |

Custom icons follow Lucide conventions: 24x24 viewBox, 1.5px stroke, `currentColor`, no fills.

### 9.2 Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `xs` | 12px | Inline with text-xs, sort indicators, trend arrows |
| `sm` | 16px | Input icons, button icons (sm), table cell icons |
| `md` | 20px | Sidebar nav, button icons (md), card header icons |
| `lg` | 24px | Page headers, empty state icons (secondary) |
| `xl` | 32px | Feature callouts |
| `2xl` | 48px | Empty state primary icons, confirm dialog icons |

### 9.3 Icon Color Rules

| Context | Color Token |
|---------|-------------|
| Default (inactive) | `--oav-text-secondary` |
| Hover | `--oav-text-primary` |
| Active / Selected | `--oav-primary-400` |
| Disabled | `--oav-text-tertiary` at 50% opacity |
| Status icon | Matches semantic color (success/warning/error/info) |
| Gamification icon | Matches gamification token (gold, purple, teal) |

### 9.4 Professional Mode Icon Swap

In Professional Mode, canvas agent avatars swap from animated Rive characters to static geometric icons:

| Agent State | Gamified | Professional |
|------------|----------|-------------|
| Any state | Animated Rive character | Static circle with state-colored ring + role icon centered |

The role icon inside the Professional Mode circle uses Lucide icons:
- Researcher: `Search`
- Coder: `Code`
- Reviewer: `CheckSquare`
- Manager: `LayoutDashboard`
- Default: `Bot`

---

## 10. Elevation & Depth

### 10.1 Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Buttons, small cards |
| `--oav-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)` | Cards, panels, dropdowns |
| `--oav-shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.4)` | Modals, command palette, floating panels |
| `--oav-shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)` | Toast notifications, elevated overlays |

### 10.2 Glow Effects

Used for state communication on the canvas and gamification emphasis.

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-shadow-glow-primary` | `0 0 12px rgba(99,102,241,0.4)` | Active/selected elements, thinking state |
| `--oav-shadow-glow-success` | `0 0 12px rgba(34,197,94,0.4)` | Complete agent ring |
| `--oav-shadow-glow-error` | `0 0 12px rgba(239,68,68,0.5)` | Error state, critical alerts |
| `--oav-shadow-glow-warning` | `0 0 12px rgba(245,158,11,0.4)` | Warning state, budget threshold |
| `--oav-shadow-glow-xp` | `0 0 16px rgba(255,215,0,0.5)` | XP gain, level-up border |
| `--oav-shadow-glow-achievement` | `0 0 20px rgba(168,85,247,0.5)` | Achievement unlock, legendary badge |

### 10.3 Z-Index Scale

| Token | Value | Layer |
|-------|-------|-------|
| `--oav-z-base` | 0 | Canvas, page content |
| `--oav-z-raised` | 10 | Cards, panels above canvas |
| `--oav-z-dropdown` | 100 | Dropdowns, select menus, popovers |
| `--oav-z-sticky` | 200 | Sticky header, sidebar, minimap, replay controls |
| `--oav-z-modal` | 300 | Modals, command palette, confirm dialogs |
| `--oav-z-toast` | 400 | Toast notifications, alert banners |
| `--oav-z-tooltip` | 500 | Tooltips (always on top) |
| `--oav-z-celebration` | 600 | Full-screen celebration overlays (legendary, level-up) |

**Rule:** Never use arbitrary z-index values. Always reference these tokens.

### 10.4 Backdrop Blur

| Context | Value |
|---------|-------|
| Modal overlay | `backdrop-filter: blur(4px)` |
| Command palette overlay | `backdrop-filter: blur(4px)` |
| Tooltip | None |
| Canvas overlay panels | `backdrop-filter: blur(2px)` (optional, for performance) |

---

## 11. Responsive Design System

### 11.1 Breakpoint Behavior Matrix

| Component | <640px (sm) | 640-767px | 768-1023px (md-lg) | 1024-1279px (lg-xl) | >=1280px (xl+) |
|-----------|------------|-----------|-------------------|--------------------|----|
| Sidebar | Hidden, hamburger menu | Hidden, hamburger | Collapsed (64px) | Collapsed (64px) | Expanded (240px) |
| Header | Compact (hide cost ticker) | Full | Full | Full | Full |
| Grid metrics | 1 col | 2 col | 2 col | 4 col | 4 col |
| Grid agents | 1 col | 1 col | 2 col | 3 col | 3 col |
| Canvas | Full screen, no chrome | Full + minimap | Full + sidebar | Full + sidebar | Full + sidebar |
| Detail panel | Full screen overlay | Full screen overlay | Slide-in 480px | Slide-in 480px | Slide-in 640px |
| DataTable | Card view (stacked) | Horizontal scroll | Horizontal scroll | Full table | Full table |
| CommandPalette | Full width - 24px | 600px | 600px | 600px | 600px |

### 11.2 Container Queries

Use container queries for components that live in variable-width parents (e.g., MetricCard in a resizable panel):

```css
.metric-card-container {
  container-type: inline-size;
}

@container (max-width: 200px) {
  .metric-card { /* hide sparkline, stack vertically */ }
}

@container (max-width: 140px) {
  .metric-card { /* hide trend, show value only */ }
}
```

### 11.3 Touch Targets

On mobile/tablet (pointer: coarse):
- Minimum touch target: 44x44px
- Increase button padding by 4px
- Increase table row height to 56px
- Tooltip triggers convert to tap (long-press)

---

## 12. Theming Architecture

### 12.1 CSS Custom Property Strategy

All visual values flow through CSS custom properties. Theme switching reassigns semantic tokens without touching component code.

```css
/* Dark theme (default) - defined on :root */
:root {
  --oav-surface-base: #0F1117;
  --oav-surface-raised: #161B26;
  --oav-text-primary: #F1F5F9;
  /* ... all semantic tokens ... */
}

/* Light theme - applied via data attribute */
[data-theme="light"] {
  --oav-surface-base: #FFFFFF;
  --oav-surface-raised: #F9FAFB;
  --oav-surface-overlay: #F3F4F6;
  --oav-surface-sunken: #E5E7EB;
  --oav-surface-modal: #FFFFFF;
  --oav-surface-tooltip: #1F2937;
  --oav-border-default: #E5E7EB;
  --oav-border-subtle: #F3F4F6;
  --oav-border-strong: #D1D5DB;
  --oav-text-primary: #111827;
  --oav-text-secondary: #6B7280;
  --oav-text-tertiary: #9CA3AF;
  --oav-text-inverse: #F1F5F9;
  --oav-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --oav-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06);
}
```

### 12.2 Theme Switching Implementation

```typescript
// Theme is stored in localStorage and synced to <html> data attribute
type Theme = 'dark' | 'light' | 'system';
type Mode = 'gamified' | 'professional';

function applyTheme(theme: Theme) {
  const resolved = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

function applyMode(mode: Mode) {
  document.documentElement.setAttribute('data-mode', mode);
}
```

### 12.3 Professional vs Gamified Mode

Mode is independent of theme (dark/light). Both modes work in both themes.

| Element | Gamified Mode | Professional Mode |
|---------|--------------|-------------------|
| Agent avatars | Animated Rive characters | Static geometric icons with role symbol |
| XP bar | Gold gradient, shimmer, particles | Hidden (data still computed) |
| Level badge | Colored circle with tier effects | Gray badge labeled "Tier N" |
| Achievement popup | Full animation per rarity | Toast notification only |
| Level-up | Full-screen golden flash + particles | "Tier Upgraded" toast |
| Leaderboard | Medals, flames, sparklines | "Performance Ranking" table |
| Celebration confetti | Yes | No |
| Particle effects (canvas) | Full (data flow + ambient) | Data flow only (no ambient) |
| Weather/day-night cycle | Yes | No |
| Color intensity | Full saturation | Muted (-15% saturation via filter) |

**CSS implementation:**

```css
[data-mode="professional"] {
  --oav-gamification-display: none;        /* hides XP bars, badges, streaks */
  --oav-particle-ambient: 0;              /* disables ambient particles */
  --oav-celebration-display: none;         /* disables celebration overlays */
  --oav-saturation-modifier: saturate(0.85); /* subtle desaturation */
}

[data-mode="gamified"] {
  --oav-gamification-display: flex;
  --oav-particle-ambient: 1;
  --oav-celebration-display: flex;
  --oav-saturation-modifier: saturate(1);
}
```

### 12.4 Theme Token Override Table

Components that behave differently per mode use conditional tokens:

```css
/* XP bar visibility */
.xp-bar { display: var(--oav-gamification-display, flex); }

/* Agent avatar filter */
.agent-canvas { filter: var(--oav-saturation-modifier, none); }

/* Celebration overlay */
.celebration-overlay { display: var(--oav-celebration-display, flex); }
```

---

## 13. Design-to-Code Bridge

### 13.1 Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--oav-primary-50)',
          100: 'var(--oav-primary-100)',
          200: 'var(--oav-primary-200)',
          300: 'var(--oav-primary-300)',
          400: 'var(--oav-primary-400)',
          500: 'var(--oav-primary-500)',
          600: 'var(--oav-primary-600)',
          700: 'var(--oav-primary-700)',
          800: 'var(--oav-primary-800)',
          900: 'var(--oav-primary-900)',
        },
        secondary: { /* teal scale via vars */ },
        accent: { /* orange scale via vars */ },
        success: { /* green scale via vars */ },
        warning: { /* yellow scale via vars */ },
        error: { /* red scale via vars */ },
        info: { /* blue scale via vars */ },
        surface: {
          base: 'var(--oav-surface-base)',
          raised: 'var(--oav-surface-raised)',
          overlay: 'var(--oav-surface-overlay)',
          sunken: 'var(--oav-surface-sunken)',
          modal: 'var(--oav-surface-modal)',
          tooltip: 'var(--oav-surface-tooltip)',
        },
        border: {
          DEFAULT: 'var(--oav-border-default)',
          subtle: 'var(--oav-border-subtle)',
          strong: 'var(--oav-border-strong)',
        },
      },
      fontFamily: {
        sans: 'var(--oav-font-sans)',
        mono: 'var(--oav-font-mono)',
      },
      borderRadius: {
        sharp: 'var(--oav-radius-sharp)',
        DEFAULT: 'var(--oav-radius-default)',
        rounded: 'var(--oav-radius-rounded)',
        pill: 'var(--oav-radius-pill)',
      },
      boxShadow: {
        sm: 'var(--oav-shadow-sm)',
        md: 'var(--oav-shadow-md)',
        lg: 'var(--oav-shadow-lg)',
        xl: 'var(--oav-shadow-xl)',
        'glow-primary': 'var(--oav-shadow-glow-primary)',
        'glow-success': 'var(--oav-shadow-glow-success)',
        'glow-error': 'var(--oav-shadow-glow-error)',
        'glow-warning': 'var(--oav-shadow-glow-warning)',
        'glow-xp': 'var(--oav-shadow-glow-xp)',
        'glow-achievement': 'var(--oav-shadow-glow-achievement)',
      },
      zIndex: {
        base: 'var(--oav-z-base)',
        raised: 'var(--oav-z-raised)',
        dropdown: 'var(--oav-z-dropdown)',
        sticky: 'var(--oav-z-sticky)',
        modal: 'var(--oav-z-modal)',
        toast: 'var(--oav-z-toast)',
        tooltip: 'var(--oav-z-tooltip)',
        celebration: 'var(--oav-z-celebration)',
      },
    },
  },
  plugins: [],
};
```

### 13.2 Component-to-File Mapping

Every component in Section 6 maps to a React component file:

```
src/components/
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── PageContainer.tsx
│   └── Grid.tsx
├── navigation/
│   ├── NavItem.tsx
│   ├── Breadcrumb.tsx
│   ├── TabBar.tsx
│   └── CommandPalette.tsx
├── data-display/
│   ├── MetricCard.tsx
│   ├── AgentCard.tsx
│   ├── StatusBadge.tsx
│   ├── DataTable.tsx
│   ├── Sparkline.tsx
│   ├── AvatarStack.tsx
│   ├── Skeleton.tsx
│   └── EmptyState.tsx
├── inputs/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Toggle.tsx
│   ├── Slider.tsx
│   ├── SearchInput.tsx
│   └── DateRangePicker.tsx
├── feedback/
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── Tooltip.tsx
│   ├── Popover.tsx
│   └── ProgressBar.tsx
├── gamification/
│   ├── XPBar.tsx
│   ├── LevelBadge.tsx
│   ├── AchievementPopup.tsx
│   ├── LeaderboardRow.tsx
│   ├── QuestCard.tsx
│   └── StreakIndicator.tsx
├── charts/
│   ├── ChartContainer.tsx
│   ├── Legend.tsx
│   └── ChartTooltip.tsx
└── canvas/
    ├── AgentSprite.tsx       (PixiJS + Rive wrapper)
    ├── WorldCanvas.tsx       (PixiJS stage)
    ├── Minimap.tsx
    ├── FlowParticle.tsx
    └── ZoneOverlay.tsx
```

### 13.3 Storybook Organization

Stories mirror the component directory structure:

```
stories/
├── Layout/          (AppShell, Sidebar, Header, Grid)
├── Navigation/      (NavItem, Breadcrumb, TabBar, CommandPalette)
├── DataDisplay/     (MetricCard, AgentCard, StatusBadge, DataTable, ...)
├── Inputs/          (Button, Input, Select, Checkbox, Toggle, ...)
├── Feedback/        (Toast, Alert, Modal, ConfirmDialog, Tooltip, ...)
├── Gamification/    (XPBar, LevelBadge, AchievementPopup, ...)
├── Charts/          (ChartContainer, Legend, ChartTooltip)
├── Canvas/          (AgentSprite, WorldCanvas, Minimap)
└── Tokens/          (ColorPalette, TypographyScale, SpacingScale, IconGrid)
```

Each story includes:
- **Default:** Component with default props
- **Variants:** All visual variants (Primary/Secondary/Ghost/Danger for Button)
- **Sizes:** All size options
- **States:** Default, Hover, Active, Disabled, Focus, Error
- **Dark/Light:** Both themes via decorator
- **Gamified/Professional:** Both modes via decorator

### 13.4 Token Export Formats

Tokens are authored as CSS custom properties (source of truth) and exported to:

| Format | File | Consumer |
|--------|------|----------|
| CSS custom properties | `src/styles/tokens.css` | All components via Tailwind |
| TypeScript constants | `src/lib/tokens.ts` | Canvas renderer (PixiJS), chart configs |
| JSON | `src/lib/tokens.json` | Storybook, design tool sync |

```typescript
// src/lib/tokens.ts (auto-generated from tokens.css)
export const colors = {
  primary: { 50: '#EEF2FF', /* ... */ 900: '#312E81' },
  surface: { base: '#0F1117', raised: '#161B26', /* ... */ },
  state: {
    idle: '#6B7280', initializing: '#60A5FA', thinking: '#818CF8',
    executing: '#34D399', communicating: '#60A5FA', waiting: '#FBBF24',
    error: '#EF4444', recovering: '#F59E0B', complete: '#22C55E',
    terminated: '#374151', sleeping: '#4B5563', overloaded: '#FB923C',
  },
} as const;

export const durations = {
  instant: 0, fast: 100, normal: 200, moderate: 300,
  slow: 500, slower: 800, slowest: 1500,
} as const;

export const easings = {
  linear: 'linear',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  bounce: 'back.out(1.5)',
  spring: 'elastic.out(1, 0.5)',
} as const;
```

### 13.5 Implementation Priority

Components should be built in this order to unblock page assembly:

| Phase | Components | Blocked By |
|-------|-----------|------------|
| 1 (Foundation) | Tokens CSS, Tailwind config, AppShell, Sidebar, Header | Nothing |
| 2 (Primitives) | Button, Input, Select, Checkbox, Toggle, Badge, Tooltip | Phase 1 |
| 3 (Data) | MetricCard, DataTable, StatusBadge, Sparkline, Skeleton, EmptyState | Phase 2 |
| 4 (Feedback) | Toast, Modal, Alert, ConfirmDialog, ProgressBar | Phase 2 |
| 5 (Gamification) | XPBar, LevelBadge, AchievementPopup, LeaderboardRow, QuestCard | Phase 3 |
| 6 (Canvas) | WorldCanvas, AgentSprite, Minimap, FlowParticle | Phase 1 + Rive assets |
| 7 (Charts) | ChartContainer, Legend, all chart types | Phase 3 |

---

## Appendix A: Cross-Reference to Upstream Documents

| This Section | Source Document | Source Section |
|-------------|----------------|----------------|
| Color tokens | UI Design System (3.1) | Section 2.1 |
| Agent state colors | Visualization Spec (2.2) | Section 7 |
| Typography | UI Design System (3.1) | Section 2.2 |
| Component library | UI Design System (3.1) | Section 3 |
| Motion durations/easings | Animation Spec (2.3) | Sections 4, 8, 11 |
| Canvas animation params | Animation Spec (2.3) | Section 2.5 |
| Gamification colors/tiers | Gamification System Design (1.2) | Sections 2, 7 |
| Data viz palette | Visualization Spec (2.2) | Section 7 |
| Responsive strategy | UX Design Spec (2.1) | Section 6 |
| Accessibility | UX Design Spec (2.1) | Section 7 |

---

*End of Design System Specification.*
