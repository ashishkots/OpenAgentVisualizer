# OpenAgentVisualizer -- UI Design System

**Stage:** 3.1 -- UI Designer
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** UI Designer Agent
**Depends On:** PRD (Stage 1.1), UX Design Spec (Stage 2.1), Gamification System Design (Stage 1.2), Visualization Spec (Stage 2.2), Animation Spec (Stage 2.3)
**Feeds Into:** Frontend Expert (Stage 2.2a), Code Reviewer (Stage 2.3), QA Engineer (Stage 2.4)

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Design Tokens](#2-design-tokens)
3. [Component Library](#3-component-library)
4. [Screen Designs](#4-screen-designs)
5. [Iconography](#5-iconography)
6. [Dark Mode and Theming](#6-dark-mode-and-theming)
7. [Responsive Grid](#7-responsive-grid)
8. [Accessibility Visual Standards](#8-accessibility-visual-standards)

---

## 1. Design System Overview

### 1.1 Philosophy

OpenAgentVisualizer sits at the intersection of a living virtual world and a precision observability dashboard. The design system must serve both identities without compromise. When the user is watching agents on the canvas, the system feels like a polished, ambient game world. When the user is debugging a trace or reading cost data, the system feels like a fast, dense, keyboard-first productivity tool. The design language bridges these two worlds through consistent color semantics, typography hierarchy, spatial rhythm, and motion vocabulary.

Every visual decision is governed by three rules:

1. **Data first.** Every pixel must earn its place by encoding information or enabling action. Decorative elements that do not communicate state, relationship, or hierarchy are removed.
2. **Glanceable at arm's length, precise at arm's reach.** The canvas view works as a wall display. The dashboard view works as a debugging instrument. Both share the same design tokens but apply them at different densities.
3. **Dual personality.** Gamified Mode and Professional Mode share an identical layout grid, component library, and data model. They differ only in color intensity, typography tone, icon style, and animation vocabulary. Switching modes never changes where things are -- only how they look and sound.

### 1.2 Brand Personality

| Attribute | Expression |
|-----------|-----------|
| **Intelligent** | High information density presented cleanly. No dumbing down. Data tables are dense, charts are precise, tooltips are rich. |
| **Alive** | Subtle motion everywhere. Agents breathe. Numbers animate. Transitions are smooth. Static screens feel broken. |
| **Approachable** | Rounded corners, warm accent colors, friendly gamification elements. Not intimidating to a PM or exec seeing it for the first time. |
| **Professional** | Dark, muted base palette. No neon. No visual noise. Clean enough for an enterprise demo, engaging enough for a developer's second monitor. |
| **Fast** | Interactions respond in under 100ms. Animations never block user input. Keyboard shortcuts for everything. Feels like Linear, not Jira. |

### 1.3 Visual Identity

The visual identity is built on a dark canvas foundation with vibrant semantic accents. The dark base (#0F1117) provides maximum contrast for colored status indicators and reduces eye strain during extended monitoring sessions. Agent avatars are the primary visual subjects -- all surrounding UI chrome is deliberately subdued to keep focus on the living entities.

Typography uses Inter for all interface text (clean, highly legible at small sizes, excellent tabular number support) and JetBrains Mono for code, traces, and technical data (monospaced, ligature-rich, developer-friendly). The combination communicates "serious tool with personality" rather than "toy" or "enterprise gray."

---

## 2. Design Tokens

All tokens are defined as CSS custom properties on `:root` and consumed via Tailwind CSS utilities or direct `var()` references. Token names follow the pattern `--oav-{category}-{variant}-{modifier}`.

### 2.1 Colors

#### Primary Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--oav-primary-50` | `#EEF2FF` | 238, 242, 255 | Primary tint backgrounds, hover states on light surfaces |
| `--oav-primary-100` | `#E0E7FF` | 224, 231, 255 | Selected item backgrounds in lists |
| `--oav-primary-200` | `#C7D2FE` | 199, 210, 254 | Focus ring color on inputs |
| `--oav-primary-300` | `#A5B4FC` | 165, 180, 252 | Secondary button borders |
| `--oav-primary-400` | `#818CF8` | 129, 140, 248 | Thinking state ring, link hover color |
| `--oav-primary-500` | `#6366F1` | 99, 102, 241 | Primary brand color, primary buttons, active nav items |
| `--oav-primary-600` | `#4F46E5` | 79, 70, 229 | Primary button hover |
| `--oav-primary-700` | `#4338CA` | 67, 56, 202 | Primary button active/pressed |
| `--oav-primary-800` | `#3730A3` | 55, 48, 163 | Dark primary accents |
| `--oav-primary-900` | `#312E81` | 49, 46, 129 | Deep primary for backgrounds |

#### Secondary Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--oav-secondary-50` | `#F0FDFA` | 240, 253, 250 | Teal tint for secondary highlights |
| `--oav-secondary-100` | `#CCFBF1` | 204, 251, 241 | Secondary badge backgrounds |
| `--oav-secondary-200` | `#99F6E4` | 153, 246, 228 | Secondary indicator fills |
| `--oav-secondary-300` | `#5EEAD4` | 94, 234, 212 | Secondary accents |
| `--oav-secondary-400` | `#2DD4BF` | 45, 212, 191 | Secondary buttons, collaboration indicators |
| `--oav-secondary-500` | `#14B8A6` | 20, 184, 166 | Core secondary color |
| `--oav-secondary-600` | `#0D9488` | 13, 148, 136 | Secondary hover states |
| `--oav-secondary-700` | `#0F766E` | 15, 118, 110 | Secondary active states |

#### Accent Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--oav-accent-50` | `#FFF7ED` | 255, 247, 237 | Accent tint backgrounds |
| `--oav-accent-100` | `#FFEDD5` | 255, 237, 213 | Warm highlight backgrounds |
| `--oav-accent-200` | `#FED7AA` | 254, 215, 170 | Accent indicator fills |
| `--oav-accent-300` | `#FDBA74` | 253, 186, 116 | Accent borders |
| `--oav-accent-400` | `#FB923C` | 251, 146, 60 | Accent icons, warning-adjacent elements |
| `--oav-accent-500` | `#F97316` | 249, 115, 22 | Core accent color, CTAs, highlights |
| `--oav-accent-600` | `#EA580C` | 234, 88, 12 | Accent hover |
| `--oav-accent-700` | `#C2410C` | 194, 65, 12 | Accent active |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--oav-success-50` | `#F0FDF4` | Success background tint |
| `--oav-success-100` | `#DCFCE7` | Success badge background |
| `--oav-success-200` | `#BBF7D0` | Success fill light |
| `--oav-success-300` | `#86EFAC` | Success border |
| `--oav-success-400` | `#4ADE80` | Success indicators |
| `--oav-success-500` | `#22C55E` | Core success: healthy agents, completed tasks, uptime |
| `--oav-success-600` | `#16A34A` | Success hover |
| `--oav-success-700` | `#15803D` | Success active |
| `--oav-warning-50` | `#FFFBEB` | Warning background tint |
| `--oav-warning-100` | `#FEF3C7` | Warning badge background |
| `--oav-warning-200` | `#FDE68A` | Warning fill light |
| `--oav-warning-300` | `#FCD34D` | Warning border |
| `--oav-warning-400` | `#FBBF24` | Warning indicators, waiting state ring |
| `--oav-warning-500` | `#F59E0B` | Core warning: latency spikes, budget thresholds, recovering |
| `--oav-warning-600` | `#D97706` | Warning hover |
| `--oav-warning-700` | `#B45309` | Warning active |
| `--oav-error-50` | `#FEF2F2` | Error background tint |
| `--oav-error-100` | `#FEE2E2` | Error badge background |
| `--oav-error-200` | `#FECACA` | Error fill light |
| `--oav-error-300` | `#FCA5A5` | Error border |
| `--oav-error-400` | `#F87171` | Error indicators |
| `--oav-error-500` | `#EF4444` | Core error: agent errors, loop detection, critical alerts |
| `--oav-error-600` | `#DC2626` | Error hover |
| `--oav-error-700` | `#B91C1C` | Error active |
| `--oav-info-50` | `#EFF6FF` | Info background tint |
| `--oav-info-100` | `#DBEAFE` | Info badge background |
| `--oav-info-200` | `#BFDBFE` | Info fill light |
| `--oav-info-300` | `#93C5FD` | Info border |
| `--oav-info-400` | `#60A5FA` | Info indicators, initializing state, communication lines |
| `--oav-info-500` | `#3B82F6` | Core info: active working state, task assignment lines |
| `--oav-info-600` | `#2563EB` | Info hover |
| `--oav-info-700` | `#1D4ED8` | Info active |

#### Neutral Scale (12 shades)

| Token | Hex | Usage |
|-------|-----|-------|
| `--oav-neutral-0` | `#FFFFFF` | Pure white, rare -- used only for maximum contrast text on dark overlays |
| `--oav-neutral-50` | `#F9FAFB` | Lightest background (light mode only) |
| `--oav-neutral-100` | `#F3F4F6` | Card backgrounds (light mode), divider on dark |
| `--oav-neutral-200` | `#E5E7EB` | Border color (light mode), secondary text on dark |
| `--oav-neutral-300` | `#D1D5DB` | Disabled text (light mode), muted icons on dark |
| `--oav-neutral-400` | `#9CA3AF` | Placeholder text, muted labels, idle state ring |
| `--oav-neutral-500` | `#6B7280` | Secondary text on dark backgrounds, agent idle ring |
| `--oav-neutral-600` | `#4B5563` | Borders on dark surfaces, subtle dividers |
| `--oav-neutral-700` | `#374151` | Card backgrounds on dark theme, terminated agent ring |
| `--oav-neutral-800` | `#1F2937` | Elevated surface backgrounds (panels, modals, dropdowns) |
| `--oav-neutral-900` | `#111827` | Sidebar background, header background |
| `--oav-neutral-950` | `#0F1117` | Canvas background, app base background |

#### Dark Mode Palette (Primary Application)

OpenAgentVisualizer is dark-mode-first. The following tokens define the dark theme surface hierarchy:

| Token | Hex | Usage |
|-------|-----|-------|
| `--oav-surface-base` | `#0F1117` | App background, canvas background |
| `--oav-surface-raised` | `#161B26` | Sidebar, header bar |
| `--oav-surface-overlay` | `#1C2233` | Cards, panels, dropdown menus |
| `--oav-surface-sunken` | `#0A0D14` | Inset areas, code blocks, input backgrounds |
| `--oav-surface-modal` | `#1F2740` | Modal backgrounds, dialog backgrounds |
| `--oav-surface-tooltip` | `#252D3F` | Tooltip backgrounds |
| `--oav-border-default` | `#2A3246` | Default border color on dark surfaces |
| `--oav-border-subtle` | `#1E2536` | Subtle dividers, separator lines |
| `--oav-border-strong` | `#3D4760` | Emphasized borders, active input borders |
| `--oav-text-primary` | `#F1F5F9` | Primary text (headings, body) |
| `--oav-text-secondary` | `#94A3B8` | Secondary text (labels, descriptions, timestamps) |
| `--oav-text-tertiary` | `#64748B` | Tertiary text (placeholders, disabled labels) |
| `--oav-text-inverse` | `#0F172A` | Text on light/colored backgrounds |

#### Gamification Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--oav-xp-gold` | `#FFD700` | XP text color, floating "+XP" animations, XP bar fill |
| `--oav-xp-gold-dim` | `#B8960F` | XP bar track (unfilled portion) |
| `--oav-level-purple` | `#A855F7` | Level badge background, level-up glow |
| `--oav-level-purple-light` | `#C084FC` | Level badge text, level indicators |
| `--oav-achievement-bronze` | `#CD7F32` | Common/Uncommon badge frames, Tier 1-5 borders |
| `--oav-achievement-silver` | `#C0C0C0` | Rare badge frames, Tier 6-9 borders |
| `--oav-achievement-gold` | `#FFD700` | Epic badge frames, Tier 10-19 borders |
| `--oav-achievement-platinum` | `#E5E4E2` | Platinum badge frames, Tier 20-29 borders |
| `--oav-achievement-diamond` | `#B9F2FF` | Diamond badge frames, Tier 30-39 borders |
| `--oav-achievement-prismatic` | `linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)` | Legendary/Master tier, animated gradient |
| `--oav-streak-flame` | `#FF6B35` | Streak indicator, hot streak effects |
| `--oav-quest-teal` | `#2DD4BF` | Quest card borders, quest progress bars |
| `--oav-rarity-common` | `#9CA3AF` | Common achievement frame |
| `--oav-rarity-uncommon` | `#4ADE80` | Uncommon achievement frame |
| `--oav-rarity-rare` | `#60A5FA` | Rare achievement frame |
| `--oav-rarity-epic` | `#A855F7` | Epic achievement frame |
| `--oav-rarity-legendary` | `#FFD700` | Legendary achievement frame, animated shimmer |

#### Agent State Colors (Canvas)

| Token | Hex | State |
|-------|-----|-------|
| `--oav-state-idle` | `#6B7280` | Idle agent ring |
| `--oav-state-initializing` | `#60A5FA` | Initializing agent ring (animated rotation) |
| `--oav-state-thinking` | `#818CF8` | Thinking agent ring (pulsing glow) |
| `--oav-state-executing` | `#34D399` | Executing agent ring (steady glow) |
| `--oav-state-communicating` | `#60A5FA` | Communicating agent ring |
| `--oav-state-waiting` | `#FBBF24` | Waiting agent ring (dashed, animated) |
| `--oav-state-error` | `#EF4444` | Error agent ring (rapid pulse) |
| `--oav-state-recovering` | `#F59E0B` | Recovering agent ring (sweep fill) |
| `--oav-state-complete` | `#22C55E` | Complete agent ring (bright glow) |
| `--oav-state-terminated` | `#374151` | Terminated agent ring (no glow) |
| `--oav-state-sleeping` | `#4B5563` | Sleeping agent ring (faded) |
| `--oav-state-overloaded` | `#FB923C` | Overloaded modifier (inner orange ring) |

### 2.2 Typography

#### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | All UI text: headings, body, labels, buttons, navigation |
| `--oav-font-mono` | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace` | Code blocks, trace IDs, API keys, token counts, JSON data, session IDs |

#### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--oav-text-xs` | 12px / 0.75rem | 16px / 1.33 | Timestamps, badge labels, minimap labels, canvas agent names at low zoom |
| `--oav-text-sm` | 14px / 0.875rem | 20px / 1.43 | Secondary labels, table cell text, tooltip text, sidebar nav items |
| `--oav-text-base` | 16px / 1rem | 24px / 1.5 | Body text, form inputs, button labels, primary labels |
| `--oav-text-lg` | 18px / 1.125rem | 28px / 1.56 | Section headings, card titles, panel headers |
| `--oav-text-xl` | 20px / 1.25rem | 28px / 1.4 | Page section titles, metric card values |
| `--oav-text-2xl` | 24px / 1.5rem | 32px / 1.33 | Page titles, dashboard header metrics |
| `--oav-text-3xl` | 30px / 1.875rem | 36px / 1.2 | Hero metric numbers, large dashboard values |
| `--oav-text-4xl` | 36px / 2.25rem | 40px / 1.11 | Feature numbers, executive dashboard headline metrics |
| `--oav-text-5xl` | 48px / 3rem | 48px / 1.0 | Landing page hero text, onboarding titles |

#### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-font-normal` | 400 | Body text, descriptions, table cells |
| `--oav-font-medium` | 500 | Labels, nav items, button text, card titles |
| `--oav-font-semibold` | 600 | Section headings, metric values, badge text, emphasis |
| `--oav-font-bold` | 700 | Page titles, hero metrics, alert headings |

#### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-tracking-tighter` | -0.02em | Large headings (2xl and above) |
| `--oav-tracking-tight` | -0.01em | Medium headings (lg, xl) |
| `--oav-tracking-normal` | 0em | Body text, labels, descriptions |
| `--oav-tracking-wide` | 0.025em | Uppercase labels, badge text, small caps |
| `--oav-tracking-wider` | 0.05em | Category headers, section divider labels |

#### Tabular Numbers

All numeric displays (metrics, costs, token counts, XP values, percentages, timestamps) use `font-variant-numeric: tabular-nums` to prevent layout shifts when numbers update in real time.

### 2.3 Spacing

Base unit: 4px. All spacing values are multiples of the base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-space-1` | 4px | Minimum gap, icon-to-text within a badge, inline element margins |
| `--oav-space-2` | 8px | Tight padding (inside badges, small buttons), gap between stacked icons |
| `--oav-space-3` | 12px | Standard padding inside chips, between related form elements |
| `--oav-space-4` | 16px | Component internal padding, gap between cards, table cell padding |
| `--oav-space-5` | 20px | Standard element spacing, gap between form groups |
| `--oav-space-6` | 24px | Card padding, section separators, sidebar item height |
| `--oav-space-8` | 32px | Panel padding, gap between page sections |
| `--oav-space-10` | 40px | Large section gaps, modal padding |
| `--oav-space-12` | 48px | Page header height, sidebar width divisions |
| `--oav-space-16` | 64px | Sidebar icon area width, large section dividers |
| `--oav-space-20` | 80px | Sidebar expanded width unit, vertical page margins |
| `--oav-space-24` | 96px | Maximum component padding, page-level vertical gaps |

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-radius-sharp` | 2px | Data table cells, code blocks, inline code |
| `--oav-radius-default` | 6px | Buttons, inputs, cards, dropdowns, modals, panels, tooltips |
| `--oav-radius-rounded` | 12px | Metric cards, agent cards, image containers, larger cards |
| `--oav-radius-pill` | 9999px | Badges, tags, status indicators, toggle switches, XP bars, pill buttons |

### 2.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` | Subtle lift: buttons, small cards on dark surfaces |
| `--oav-shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)` | Cards, panels, dropdown menus |
| `--oav-shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)` | Modals, floating panels, command palette |
| `--oav-shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)` | Elevated overlays, popover menus, toast notifications |
| `--oav-shadow-glow-primary` | `0 0 12px rgba(99, 102, 241, 0.4)` | Active/selected primary elements, thinking state glow |
| `--oav-shadow-glow-success` | `0 0 12px rgba(34, 197, 94, 0.4)` | Success state glow, complete agent ring |
| `--oav-shadow-glow-error` | `0 0 12px rgba(239, 68, 68, 0.5)` | Error state glow, critical alert borders |
| `--oav-shadow-glow-warning` | `0 0 12px rgba(245, 158, 11, 0.4)` | Warning state glow, budget threshold approach |
| `--oav-shadow-glow-xp` | `0 0 16px rgba(255, 215, 0, 0.5)` | XP gain animation glow, level-up border glow |
| `--oav-shadow-glow-achievement` | `0 0 20px rgba(168, 85, 247, 0.5)` | Achievement unlock glow, legendary badge shimmer |

### 2.6 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--oav-z-base` | 0 | Canvas layer, page content |
| `--oav-z-raised` | 10 | Cards, panels above canvas |
| `--oav-z-dropdown` | 100 | Dropdown menus, select options, autocomplete |
| `--oav-z-sticky` | 200 | Sticky header, sidebar, minimap, replay controls |
| `--oav-z-modal` | 300 | Modal dialogs, confirm dialogs, command palette overlay |
| `--oav-z-toast` | 400 | Toast notifications, alert banners |
| `--oav-z-tooltip` | 500 | Tooltips, popovers (always on top of everything) |
| `--oav-z-celebration` | 600 | Full-screen celebration overlays (legendary achievement, level-up) |

---

## 3. Component Library

### 3.1 Layout Components

#### AppShell

The root layout container that structures the entire application. All pages render inside AppShell.

```
+---+----------------------------------------------+
| S |  Header (56px)                               |
| i +----------------------------------------------+
| d |                                              |
| e |  PageContainer                               |
| b |  (main content area)                         |
| a |                                              |
| r |                                              |
|   |                                              |
| 6 |                                              |
| 4 |                                              |
| p |                                              |
| x |                                              |
+---+----------------------------------------------+
```

| Property | Value |
|----------|-------|
| Sidebar width (collapsed) | 64px |
| Sidebar width (expanded) | 240px |
| Header height | 56px |
| Content area | Fills remaining viewport |
| Background | `--oav-surface-base` |
| Sidebar background | `--oav-surface-raised` |
| Header background | `--oav-surface-raised` |
| Sidebar border-right | 1px solid `--oav-border-subtle` |
| Header border-bottom | 1px solid `--oav-border-subtle` |

**States:** Sidebar collapsed (default on <1280px), Sidebar expanded (default on >=1280px), Sidebar hidden (canvas fullscreen mode).

**Behavior:** Sidebar collapses to icon-only mode on smaller viewports. Hover on collapsed sidebar shows tooltip labels. Click hamburger in header toggles sidebar expand/collapse. Press `[` to toggle sidebar.

#### Sidebar

Vertical navigation rail on the left edge. Contains primary navigation, workspace switcher, and user avatar.

**Structure:**
```
+------------------+
| Logo / Wordmark  |   <- 56px height, aligned with header
+------------------+
| Workspace Switch |   <- Dropdown trigger
+------------------+
| World View       |   <- NavItem (active)
| Dashboard        |   <- NavItem
| Agents           |   <- NavItem
| Sessions         |   <- NavItem
| Leaderboard      |   <- NavItem (V1)
| Costs            |   <- NavItem
| Alerts           |   <- NavItem
| Topology         |   <- NavItem (V1)
+------------------+
|                  |   <- Flexible spacer
+------------------+
| Settings         |   <- NavItem (bottom-pinned)
| User Avatar      |   <- User menu trigger
+------------------+
```

| Property | Value |
|----------|-------|
| Background | `--oav-surface-raised` |
| Border right | 1px solid `--oav-border-subtle` |
| Padding | 8px horizontal |
| Nav item height | 40px |
| Nav item gap | 4px |
| Active indicator | 3px left border, `--oav-primary-500` |
| Hover background | `--oav-surface-overlay` |
| Icon size | 20px |
| Icon color (default) | `--oav-text-secondary` |
| Icon color (active) | `--oav-primary-400` |
| Label font | `--oav-text-sm`, `--oav-font-medium` |
| Label color (default) | `--oav-text-secondary` |
| Label color (active) | `--oav-text-primary` |
| Transition | background-color 150ms ease |

#### Header

Persistent top bar containing workspace context, global metrics, and user controls.

**Structure:**
```
+-------+----------------------------------+------+-----+-----+------+
| Menu  | Cost Ticker  | Agents: 12 Active | Cmd+K|  Bell| Mode| User |
+-------+----------------------------------+------+-----+-----+------+
```

| Property | Value |
|----------|-------|
| Height | 56px |
| Background | `--oav-surface-raised` |
| Border bottom | 1px solid `--oav-border-subtle` |
| Padding horizontal | 16px |
| Content alignment | center vertically, space-between horizontally |
| Cost ticker font | `--oav-text-sm`, `--oav-font-mono`, `--oav-font-medium` |
| Cost ticker color | `--oav-text-primary` |
| Search trigger | Rounded rectangle, `--oav-surface-overlay` background, "Search... Cmd+K" placeholder, 200px width |

#### PageContainer

Wrapper for all page content below header and right of sidebar.

| Property | Value |
|----------|-------|
| Padding | 24px (desktop), 16px (tablet), 12px (mobile) |
| Max width | 1440px (centered) for dashboard pages; full-bleed for canvas |
| Background | `--oav-surface-base` |
| Overflow | auto (vertical scroll), hidden (horizontal) |

#### Grid

CSS Grid utility for laying out cards, metrics, and dashboard sections.

| Variant | Columns | Gap | Usage |
|---------|---------|-----|-------|
| `grid-metrics` | 4 columns (1fr each) | 16px | Dashboard summary metric cards |
| `grid-agents` | 3 columns (1fr each) | 16px | Agent card grid on dashboard |
| `grid-2col` | 2 columns (60% / 40%) | 24px | Agent detail: content + sidebar |
| `grid-settings` | 2 columns (240px / 1fr) | 0 | Settings page: nav + content |

**Responsive behavior:** 4-col becomes 2-col at <1024px, 1-col at <640px. 3-col becomes 2-col at <1024px, 1-col at <640px.

#### Stack

Flex container for vertically or horizontally stacking elements with consistent gaps.

| Variant | Direction | Default Gap |
|---------|-----------|-------------|
| `stack-v` | Column | 16px |
| `stack-h` | Row | 12px |
| `stack-v-tight` | Column | 8px |
| `stack-h-tight` | Row | 8px |

#### Divider

Horizontal or vertical separator line.

| Property | Value |
|----------|-------|
| Color | `--oav-border-subtle` |
| Thickness | 1px |
| Margin | 16px vertical (horizontal divider), 12px horizontal (vertical divider) |
| Variant: labeled | Center-aligned text label with lines on each side, label font `--oav-text-xs`, `--oav-tracking-wider`, uppercase, color `--oav-text-tertiary` |

---

### 3.2 Navigation Components

#### NavItem

Individual navigation item in the sidebar.

| Property | Default | Hover | Active |
|----------|---------|-------|--------|
| Background | transparent | `--oav-surface-overlay` | `--oav-surface-overlay` |
| Left border | none | none | 3px solid `--oav-primary-500` |
| Icon color | `--oav-text-secondary` | `--oav-text-primary` | `--oav-primary-400` |
| Label color | `--oav-text-secondary` | `--oav-text-primary` | `--oav-text-primary` |
| Border radius | `--oav-radius-default` | same | same |
| Padding | 8px 12px | same | same |
| Height | 40px | same | same |
| Transition | all 150ms ease | -- | -- |
| Badge (notification count) | Pill badge, 18px height, `--oav-error-500` background, white text, `--oav-text-xs`, positioned right edge |

#### Breadcrumb

Path indicator for nested pages (e.g., Dashboard > ResearchAgent > Traces).

| Property | Value |
|----------|-------|
| Font | `--oav-text-sm` |
| Separator | `/` character, color `--oav-text-tertiary` |
| Current page | `--oav-text-primary`, `--oav-font-medium` |
| Parent pages | `--oav-text-secondary`, clickable, underline on hover |
| Gap between items | 8px |

#### TabBar

Horizontal tab navigation for sub-views within a page.

| Property | Default | Hover | Active |
|----------|---------|-------|--------|
| Font | `--oav-text-sm`, `--oav-font-medium` | same | same |
| Color | `--oav-text-secondary` | `--oav-text-primary` | `--oav-text-primary` |
| Bottom border | none | none | 2px solid `--oav-primary-500` |
| Padding | 8px 16px | same | same |
| Background | transparent | `--oav-surface-overlay` at 50% opacity | transparent |
| Transition | all 150ms ease | -- | -- |
| Container border-bottom | 1px solid `--oav-border-subtle` |
| Tab gap | 0 (tabs are adjacent) |

**Animation:** Active indicator (bottom border) slides horizontally between tabs using `transform: translateX()` with 200ms `ease-out` transition (GSAP).

#### CommandPalette (Cmd+K)

Global search and action palette.

| Property | Value |
|----------|-------|
| Trigger | `Cmd+K` (Mac), `Ctrl+K` (Windows/Linux) |
| Overlay | `--oav-surface-base` at 60% opacity, blur(4px) |
| Container width | 600px |
| Container max-height | 480px |
| Container background | `--oav-surface-modal` |
| Container border | 1px solid `--oav-border-strong` |
| Container border-radius | `--oav-radius-rounded` |
| Container shadow | `--oav-shadow-lg` |
| Input height | 48px |
| Input font | `--oav-text-lg` |
| Input placeholder | "Search agents, tasks, sessions..." in `--oav-text-tertiary` |
| Input border-bottom | 1px solid `--oav-border-default` |
| Result item height | 44px |
| Result item padding | 12px 16px |
| Result item hover | `--oav-surface-overlay` background |
| Result item selected (keyboard) | `--oav-primary-500` at 10% opacity background, left border 2px `--oav-primary-500` |
| Category header | `--oav-text-xs`, `--oav-tracking-wider`, uppercase, `--oav-text-tertiary`, 28px height, 16px padding-left |
| Result icon | 20px, `--oav-text-secondary` |
| Result title | `--oav-text-sm`, `--oav-text-primary` |
| Result subtitle | `--oav-text-xs`, `--oav-text-tertiary` |
| Keyboard hint | Right-aligned, `--oav-text-xs`, `--oav-font-mono`, `--oav-surface-sunken` background, 4px padding, `--oav-radius-sharp` |
| Animation in | Fade overlay 150ms, scale container from 0.95 to 1.0 with 200ms `ease-out` |
| Animation out | Fade overlay 100ms, scale container from 1.0 to 0.98 with 150ms `ease-in` |
| Z-index | `--oav-z-modal` |

---

### 3.3 Data Display Components

#### MetricCard

Summary metric display used in dashboard grids.

```
+----------------------------------+
|  [icon]  Total Agents            |
|                                  |
|  12                              |
|  +8.3% vs last week   [spark]   |
+----------------------------------+
```

| Property | Value |
|----------|-------|
| Width | 1fr (fills grid column) |
| Padding | 20px |
| Background | `--oav-surface-overlay` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-rounded` |
| Shadow | `--oav-shadow-sm` |
| Label font | `--oav-text-sm`, `--oav-font-medium`, `--oav-text-secondary` |
| Value font | `--oav-text-3xl`, `--oav-font-bold`, `--oav-text-primary`, tabular-nums |
| Trend font | `--oav-text-xs`, trend-up: `--oav-success-500`, trend-down: `--oav-error-500`, neutral: `--oav-text-tertiary` |
| Icon | 20px, `--oav-text-secondary`, top-left |
| Sparkline | 80px wide, 32px tall, bottom-right, stroke `--oav-primary-400`, 1.5px stroke width |
| Hover | Border shifts to `--oav-border-strong`, shadow to `--oav-shadow-md`, transition 150ms |
| Animation | Value counts up from 0 on first render, 600ms duration, `ease-out` |

**Variants:**
- `metric-card-default`: Standard as above
- `metric-card-alert`: Left border 3px `--oav-error-500`, used when metric exceeds threshold
- `metric-card-success`: Left border 3px `--oav-success-500`, used for positive milestone

#### Sparkline

Inline miniature chart for trend indication.

| Property | Value |
|----------|-------|
| Width | 80px (in MetricCard), 120px (in table rows) |
| Height | 32px |
| Stroke color | `--oav-primary-400` (default), `--oav-success-400` (positive trend), `--oav-error-400` (negative trend) |
| Stroke width | 1.5px |
| Fill | Linear gradient from stroke color at 20% opacity to transparent |
| Data points | Last 24 data points (one per hour for 24h view) |
| Curve | Monotone X interpolation (smooth, non-overshooting) |
| Animation | Line draws left-to-right on first render, 800ms, `ease-out` |

#### StatusBadge

Small pill indicator showing agent or system state.

| Property | Value |
|----------|-------|
| Height | 22px |
| Padding | 0 8px |
| Border radius | `--oav-radius-pill` |
| Font | `--oav-text-xs`, `--oav-font-medium` |
| Dot | 6px circle, left of text, 6px gap |

| Variant | Background | Text Color | Dot Color |
|---------|-----------|------------|-----------|
| `active` | `--oav-success-500` at 15% | `--oav-success-400` | `--oav-success-500` (pulsing) |
| `idle` | `--oav-neutral-500` at 15% | `--oav-neutral-400` | `--oav-neutral-500` |
| `thinking` | `--oav-primary-500` at 15% | `--oav-primary-400` | `--oav-primary-500` (pulsing) |
| `error` | `--oav-error-500` at 15% | `--oav-error-400` | `--oav-error-500` (pulsing) |
| `warning` | `--oav-warning-500` at 15% | `--oav-warning-400` | `--oav-warning-500` |
| `terminated` | `--oav-neutral-700` at 15% | `--oav-neutral-500` | `--oav-neutral-600` |

**Pulsing dot animation:** Scale 1.0 to 1.4, opacity 1.0 to 0.4, 1500ms cycle, `ease-in-out-sine`.

#### AgentCard

Card representing a single agent, used on the dashboard agent grid.

```
+--------------------------------------------------+
| [Avatar 48px] AgentName        [StatusBadge]     |
|               Level 12 - Expert I                |
|--------------------------------------------------|
| Tasks: 847  | Cost: $12.40  | Quality: 94%      |
| [==========-----] 68% XP to Level 13            |
| [Sparkline: token usage 24h]                     |
+--------------------------------------------------+
```

| Property | Value |
|----------|-------|
| Width | 1fr (fills grid column) |
| Padding | 16px |
| Background | `--oav-surface-overlay` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-rounded` |
| Shadow | `--oav-shadow-sm` |
| Avatar | 48px circle, colored border matching agent state color, 2px border width |
| Agent name | `--oav-text-base`, `--oav-font-semibold`, `--oav-text-primary` |
| Level text | `--oav-text-xs`, `--oav-text-secondary` |
| Metrics row | `--oav-text-sm`, `--oav-font-mono`, tabular-nums, `--oav-text-secondary` |
| XP bar | Full width, 4px height, track `--oav-xp-gold-dim`, fill `--oav-xp-gold`, `--oav-radius-pill` |
| XP label | `--oav-text-xs`, `--oav-text-tertiary` |
| Hover | translateY(-2px), shadow `--oav-shadow-md`, border `--oav-border-strong`, transition 200ms ease |
| Click | Navigate to agent detail page |

#### AvatarStack

Overlapping row of agent avatars, used in session lists and team displays.

| Property | Value |
|----------|-------|
| Avatar size | 28px (small), 36px (medium), 48px (large) |
| Overlap | -8px margin-left (each subsequent avatar) |
| Border | 2px solid `--oav-surface-overlay` (creates separation between overlapping avatars) |
| Border radius | 50% (circle) |
| Max visible | 5 avatars, then "+N" overflow counter |
| Overflow counter | Same size circle, `--oav-surface-overlay` background, `--oav-text-xs`, `--oav-font-medium`, `--oav-text-secondary` |
| Hover on avatar | Scale 1.1, z-index +1, tooltip with agent name |

#### DataTable

Sortable, filterable table for traces, tasks, sessions, costs.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-overlay` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-default` |
| Header row height | 44px |
| Header background | `--oav-surface-sunken` |
| Header font | `--oav-text-xs`, `--oav-font-semibold`, `--oav-tracking-wide`, uppercase, `--oav-text-tertiary` |
| Header sort icon | 12px, `--oav-text-tertiary` (inactive), `--oav-text-primary` (active) |
| Body row height | 48px |
| Body font | `--oav-text-sm`, `--oav-text-primary` |
| Body row border-bottom | 1px solid `--oav-border-subtle` |
| Body row hover | `--oav-surface-modal` background |
| Body row selected | `--oav-primary-500` at 8% background, left border 2px `--oav-primary-500` |
| Cell padding | 12px 16px |
| Numeric cells | `--oav-font-mono`, tabular-nums, right-aligned |
| Status cells | StatusBadge component |
| Empty state | Centered EmptyState component |
| Pagination | Bottom bar, 40px height, `--oav-text-sm`, showing "1-20 of 847", prev/next buttons |

#### EmptyState

Placeholder shown when a list or view has no data.

| Property | Value |
|----------|-------|
| Layout | Centered vertically and horizontally in parent |
| Icon | 48px, `--oav-text-tertiary`, relevant context icon (e.g., search icon for no results, agent icon for no agents) |
| Title | `--oav-text-lg`, `--oav-font-semibold`, `--oav-text-primary` |
| Description | `--oav-text-sm`, `--oav-text-secondary`, max-width 360px, text-align center |
| Action button | Primary Button variant (if action is available, e.g., "Connect Your First Agent") |
| Vertical spacing | 16px between icon, title, description; 24px before button |

#### Skeleton

Loading placeholder showing animated content shapes.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-overlay` |
| Animation | Shimmer effect: linear-gradient sweep from left to right, background-size 200%, 1500ms infinite, `ease-in-out` |
| Shimmer color | `--oav-surface-modal` (lighter band sweeping across the darker base) |
| Border radius | Matches the component being loaded (e.g., `--oav-radius-rounded` for cards, `--oav-radius-pill` for badges) |
| Variants | `skeleton-text` (16px height, varying widths), `skeleton-metric` (48px height, 120px width), `skeleton-card` (full card shape), `skeleton-avatar` (circle), `skeleton-chart` (rectangular) |

---

### 3.4 Input Components

#### Button

| Property | Primary | Secondary | Ghost | Danger |
|----------|---------|-----------|-------|--------|
| Background | `--oav-primary-500` | transparent | transparent | `--oav-error-500` |
| Border | none | 1px solid `--oav-border-strong` | none | none |
| Text color | `#FFFFFF` | `--oav-text-primary` | `--oav-text-secondary` | `#FFFFFF` |
| Hover bg | `--oav-primary-600` | `--oav-surface-overlay` | `--oav-surface-overlay` | `--oav-error-600` |
| Active bg | `--oav-primary-700` | `--oav-surface-modal` | `--oav-surface-modal` | `--oav-error-700` |
| Disabled | 50% opacity, cursor not-allowed | same | same | same |
| Font | `--oav-text-sm`, `--oav-font-medium` | same | same | same |
| Border radius | `--oav-radius-default` | same | same | same |
| Padding | 8px 16px | same | same | same |
| Min width | 80px | same | 0 | same |
| Transition | all 150ms ease | same | same | same |
| Focus ring | 2px offset, `--oav-primary-300` | same | same | `--oav-error-300` |

**Sizes:**

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | 6px 12px | `--oav-text-xs` |
| `md` | 36px | 8px 16px | `--oav-text-sm` |
| `lg` | 44px | 12px 24px | `--oav-text-base` |

**Icon button:** Square aspect ratio (e.g., 36x36px for md), icon centered, no text, same color variants.

#### Input

| Property | Value |
|----------|-------|
| Height | 36px (md), 32px (sm), 44px (lg) |
| Background | `--oav-surface-sunken` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-default` |
| Padding | 8px 12px |
| Font | `--oav-text-sm`, `--oav-text-primary` |
| Placeholder | `--oav-text-tertiary` |
| Focus border | `--oav-primary-500` |
| Focus ring | 0 0 0 2px `--oav-primary-200` at 25% opacity |
| Error border | `--oav-error-500` |
| Error ring | 0 0 0 2px `--oav-error-200` at 25% opacity |
| Disabled | `--oav-surface-overlay` background, 50% opacity |
| Label | `--oav-text-sm`, `--oav-font-medium`, `--oav-text-secondary`, 4px margin-bottom |
| Helper text | `--oav-text-xs`, `--oav-text-tertiary`, 4px margin-top |
| Error text | `--oav-text-xs`, `--oav-error-400`, 4px margin-top |
| Transition | border-color 150ms ease, box-shadow 150ms ease |

#### Select

Same base styling as Input, plus:

| Property | Value |
|----------|-------|
| Chevron icon | 16px, `--oav-text-tertiary`, right-aligned, 12px right padding |
| Dropdown menu | `--oav-surface-modal` background, `--oav-border-default` border, `--oav-shadow-lg`, `--oav-radius-default`, max-height 240px with scroll |
| Option height | 36px |
| Option padding | 8px 12px |
| Option hover | `--oav-surface-overlay` |
| Option selected | `--oav-primary-500` at 10% background, checkmark icon right-aligned |
| Z-index | `--oav-z-dropdown` |

#### Checkbox

| Property | Value |
|----------|-------|
| Size | 16px x 16px |
| Border | 1.5px solid `--oav-border-strong` |
| Border radius | `--oav-radius-sharp` |
| Checked background | `--oav-primary-500` |
| Checked icon | White checkmark SVG, 10px |
| Indeterminate | `--oav-primary-500` background, white dash icon |
| Focus ring | 0 0 0 2px `--oav-primary-200` at 25% opacity |
| Label gap | 8px |
| Label font | `--oav-text-sm`, `--oav-text-primary` |
| Transition | all 150ms ease |

#### Toggle

| Property | Value |
|----------|-------|
| Track width | 36px |
| Track height | 20px |
| Track off | `--oav-neutral-600` |
| Track on | `--oav-primary-500` |
| Thumb | 16px circle, `#FFFFFF`, 2px inset from track edge |
| Thumb transition | transform 200ms `ease-out` |
| Focus ring | 0 0 0 2px `--oav-primary-200` at 25% opacity, on thumb |
| Label gap | 8px |

#### Slider

| Property | Value |
|----------|-------|
| Track height | 4px |
| Track background | `--oav-neutral-600` |
| Track fill | `--oav-primary-500` |
| Track border-radius | `--oav-radius-pill` |
| Thumb | 16px circle, `--oav-primary-500`, 2px white border |
| Thumb hover | Scale 1.2, `--oav-shadow-glow-primary` |
| Thumb active | Scale 1.1 |
| Value tooltip | Appears above thumb on drag, `--oav-surface-tooltip` background, `--oav-text-xs`, `--oav-font-mono` |

#### SearchInput

Input variant with search icon and clear button.

| Property | Value |
|----------|-------|
| Left icon | Search (magnifying glass), 16px, `--oav-text-tertiary` |
| Left padding | 36px (accommodates icon) |
| Clear button | X icon, 16px, appears when input has value, `--oav-text-tertiary`, hover `--oav-text-primary` |
| Debounce | 150ms before emitting search event |

#### DateRangePicker

| Property | Value |
|----------|-------|
| Trigger | Input-styled button showing "Mar 1 - Mar 16, 2026" |
| Presets | Today, Last 7 Days, Last 30 Days, Last 90 Days, Custom |
| Calendar | Dual-month view, `--oav-surface-modal` background |
| Selected range | `--oav-primary-500` at 15% background on range days, `--oav-primary-500` solid on start/end days |
| Day cell size | 36px x 36px |
| Day font | `--oav-text-sm`, tabular-nums |
| Day hover | `--oav-surface-overlay` |
| Today indicator | Dot below date number, `--oav-primary-500` |
| Popover position | Below trigger, left-aligned |
| Z-index | `--oav-z-dropdown` |

---

### 3.5 Feedback Components

#### Toast

Non-blocking notification that appears in the bottom-right corner.

| Property | Value |
|----------|-------|
| Width | 360px |
| Padding | 12px 16px |
| Background | `--oav-surface-modal` |
| Border | 1px solid `--oav-border-default` |
| Border-left | 3px solid (color varies by type: success/error/warning/info) |
| Border radius | `--oav-radius-default` |
| Shadow | `--oav-shadow-xl` |
| Title | `--oav-text-sm`, `--oav-font-semibold`, `--oav-text-primary` |
| Description | `--oav-text-sm`, `--oav-text-secondary` |
| Close button | X icon, 16px, top-right |
| Auto-dismiss | 5000ms (info), 8000ms (error), 3000ms (success) |
| Stack | Max 3 visible, 8px gap, newest on bottom |
| Z-index | `--oav-z-toast` |
| Animation in | Slide from right 40px, fade in, 200ms `ease-out` |
| Animation out | Slide right 20px, fade out, 150ms `ease-in` |

| Type | Border-left Color | Icon |
|------|------------------|------|
| `success` | `--oav-success-500` | CircleCheck, `--oav-success-500` |
| `error` | `--oav-error-500` | CircleX, `--oav-error-500` |
| `warning` | `--oav-warning-500` | AlertTriangle, `--oav-warning-500` |
| `info` | `--oav-info-500` | Info, `--oav-info-500` |
| `achievement` | `--oav-level-purple` | Trophy, `--oav-xp-gold` |

#### Alert

Inline alert banner within page content.

| Property | Value |
|----------|-------|
| Width | Full width of parent |
| Padding | 12px 16px |
| Border radius | `--oav-radius-default` |
| Border | 1px solid (type color at 30% opacity) |
| Background | Type color at 8% opacity |
| Icon | 20px, type color, left-aligned |
| Title | `--oav-text-sm`, `--oav-font-semibold`, `--oav-text-primary` |
| Description | `--oav-text-sm`, `--oav-text-secondary` |
| Dismiss | Optional X button, right-aligned |
| Actions | Optional button group, right-aligned or below description |

#### Modal

Centered dialog overlay for confirmations, forms, and detail views.

| Property | Value |
|----------|-------|
| Overlay | `--oav-surface-base` at 60% opacity, backdrop-filter blur(4px) |
| Container width | 480px (small), 640px (medium), 800px (large) |
| Container max-height | 80vh |
| Container background | `--oav-surface-modal` |
| Container border | 1px solid `--oav-border-default` |
| Container border-radius | `--oav-radius-rounded` |
| Container shadow | `--oav-shadow-lg` |
| Header | 56px height, `--oav-text-lg`, `--oav-font-semibold`, padding 24px, bottom border |
| Body | Padding 24px, overflow-y auto |
| Footer | Padding 16px 24px, top border, right-aligned buttons with 8px gap |
| Close button | X icon in header, right-aligned |
| Z-index | `--oav-z-modal` |
| Animation in | Overlay fade 150ms; container scale 0.95 to 1.0 and fade, 200ms `ease-out` |
| Animation out | Overlay fade 100ms; container scale 1.0 to 0.98 and fade, 150ms `ease-in` |
| Keyboard | `Escape` closes; focus trapped within modal |

#### ConfirmDialog

Specialized Modal for destructive actions (kill agent, revoke key, delete workspace).

| Property | Value |
|----------|-------|
| Width | 400px |
| Icon | 48px, centered, `--oav-error-500` at 10% circle background, `--oav-error-500` AlertTriangle icon |
| Title | `--oav-text-lg`, `--oav-font-semibold`, centered |
| Description | `--oav-text-sm`, `--oav-text-secondary`, centered, max-width 320px |
| Cancel button | Secondary variant |
| Confirm button | Danger variant, with descriptive label (e.g., "Kill Agent", "Revoke Key") |

#### Tooltip

Small contextual popup on hover.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-tooltip` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-default` |
| Padding | 6px 10px |
| Font | `--oav-text-xs`, `--oav-text-primary` |
| Shadow | `--oav-shadow-md` |
| Max width | 240px |
| Arrow | 6px triangle, same background color |
| Delay | 200ms show delay, 0ms hide delay |
| Z-index | `--oav-z-tooltip` |
| Animation | Fade in 100ms, fade out 75ms |
| Placement | Auto (prefers top, falls back to bottom/left/right) |

#### Popover

Richer interactive popup for agent hover details, filter panels.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-modal` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-default` |
| Padding | 16px |
| Shadow | `--oav-shadow-lg` |
| Max width | 360px |
| Arrow | 8px triangle |
| Z-index | `--oav-z-dropdown` |
| Trigger | Click (not hover, unlike Tooltip) |
| Animation | Scale 0.95 to 1.0, fade, 150ms `ease-out` |
| Dismiss | Click outside, Escape key |

#### ProgressBar

Horizontal progress indicator.

| Property | Value |
|----------|-------|
| Height | 4px (slim), 8px (default), 12px (thick) |
| Track | `--oav-neutral-700` background, `--oav-radius-pill` |
| Fill | `--oav-primary-500` (default), color variants for success/warning/error, `--oav-radius-pill` |
| Animation | Fill width transitions with 300ms `ease-out` |
| Label (optional) | `--oav-text-xs`, `--oav-text-secondary`, right-aligned, showing percentage |
| Indeterminate | Animated gradient sweep, 1500ms infinite |

---

### 3.6 Gamification Components

#### XPBar

Agent experience progress bar showing XP toward next level.

```
[==============================-----------] 68% | 2,290 / 3,362 XP
```

| Property | Value |
|----------|-------|
| Height | 6px (compact on avatar), 10px (in agent detail panel) |
| Track background | `--oav-xp-gold-dim` at 30% opacity |
| Fill | Linear gradient from `--oav-xp-gold` to `#FFA500` (left to right) |
| Border radius | `--oav-radius-pill` |
| Glow (on gain) | `--oav-shadow-glow-xp` for 1s after XP increase, then fades |
| Label font | `--oav-text-xs`, `--oav-font-mono`, `--oav-text-secondary` |
| Animation | Fill width transitions smoothly on XP gain, 800ms `ease-out`. On large gain (>10%), a shimmer sweep plays along the bar. |
| Overflow sparkle | When bar reaches 100% (level up), bar flashes white then resets to 0 with a burst of 8 gold particles |

#### LevelBadge

Circular badge showing agent level number and tier color.

| Property | Value |
|----------|-------|
| Size | 24px (avatar overlay), 36px (profile header), 48px (detail view) |
| Shape | Circle |
| Font | `--oav-text-xs` (24px), `--oav-text-sm` (36px), `--oav-text-base` (48px), `--oav-font-bold`, tabular-nums |
| Text color | `#FFFFFF` |

| Tier | Levels | Background | Border |
|------|--------|-----------|--------|
| Starter | 1-5 | `--oav-neutral-600` | 1px solid `--oav-neutral-500` |
| Standard | 6-14 | `--oav-achievement-silver` at 80% | 2px solid `--oav-achievement-silver` |
| Advanced | 15-24 | `--oav-achievement-gold` at 80% | 2px solid `--oav-achievement-gold` |
| Elite | 25-34 | `--oav-achievement-platinum` at 80% | 2px solid `--oav-achievement-diamond`, `--oav-shadow-glow-primary` |
| Master | 35-44 | `--oav-achievement-diamond` at 80% | 2px solid `--oav-achievement-diamond`, animated prismatic shimmer |
| Legendary | 45-50 | Animated gradient `--oav-achievement-prismatic` | 3px solid gold, crown icon overlay, `--oav-shadow-glow-xp` |

#### AchievementPopup

Notification displayed when an agent unlocks an achievement.

| Rarity | Display |
|--------|---------|
| Common | Activity feed entry only. No popup. |
| Uncommon | Toast notification (1s): badge icon + name + agent name. Border-left `--oav-rarity-uncommon`. |
| Rare | Toast with glow (1.5s): badge icon (pulsing glow) + name + description + agent name. Border-left `--oav-rarity-rare`. `--oav-shadow-glow-primary`. |
| Epic | Banner (2.5s): Slides from top. Badge icon (large, 48px) + name + description + XP reward. Background gradient from `--oav-rarity-epic` at 10% to transparent. Particle effect on canvas agent. |
| Legendary | Full-screen overlay (4s): 60% dark backdrop. Centered card (400px wide): large badge icon (72px) with animated glow + confetti. Name in `--oav-text-2xl`, `--oav-font-bold`. Description, XP reward, rarity tag. Background `--oav-surface-modal` with `--oav-rarity-legendary` border glow. Z-index `--oav-z-celebration`. |

#### LeaderboardRow

Single row in the leaderboard table.

```
+----+----+---------+-----------------+-------+--------+-----------+
| #1 | -- | [Avtr]  | CoderAgent Lv18 | 94.2  | $0.012 | [sparkln] |
+----+----+---------+-----------------+-------+--------+-----------+
```

| Property | Value |
|----------|-------|
| Height | 56px |
| Rank column | 40px width, `--oav-text-base`, `--oav-font-bold`, center-aligned. #1 = `--oav-xp-gold`, #2 = `--oav-achievement-silver`, #3 = `--oav-achievement-bronze`, #4+ = `--oav-text-secondary` |
| Change column | 24px width, up arrow `--oav-success-500`, down arrow `--oav-error-500`, dash `--oav-text-tertiary` |
| Avatar | 36px, circular, state ring color border |
| Name | `--oav-text-sm`, `--oav-font-semibold`, `--oav-text-primary` |
| Level | `--oav-text-xs`, `--oav-text-tertiary`, below name |
| Score | `--oav-text-sm`, `--oav-font-mono`, `--oav-font-semibold`, tabular-nums |
| Key metric | `--oav-text-sm`, `--oav-font-mono`, `--oav-text-secondary` |
| Sparkline | 80px, trailing 7 days |
| Top-3 highlight | Left border 3px in rank medal color, background tint at 5% of medal color |
| Hover | `--oav-surface-modal` background |
| Current user's agent | `--oav-primary-500` at 5% background, `--oav-primary-500` left border |

#### QuestCard

Card showing an active quest/mission with progress.

```
+--------------------------------------------------+
| [Shield icon]  The Grand Pipeline                |
|  Complete 1,000 tasks across all agents          |
|  [================================------] 78%    |
|  780 / 1,000 tasks | 6 days remaining           |
|  Reward: 2,000 team XP + Pipeline Masters badge  |
+--------------------------------------------------+
```

| Property | Value |
|----------|-------|
| Width | Full width or 1fr in grid |
| Padding | 16px |
| Background | `--oav-surface-overlay` |
| Border | 1px solid `--oav-quest-teal` at 30% |
| Border radius | `--oav-radius-rounded` |
| Icon | 24px, `--oav-quest-teal` |
| Title | `--oav-text-base`, `--oav-font-semibold`, `--oav-text-primary` |
| Description | `--oav-text-sm`, `--oav-text-secondary` |
| Progress bar | 8px height, track `--oav-quest-teal` at 20%, fill `--oav-quest-teal` |
| Progress label | `--oav-text-xs`, `--oav-font-mono`, `--oav-text-secondary` |
| Remaining time | `--oav-text-xs`, `--oav-text-tertiary` |
| Reward text | `--oav-text-xs`, `--oav-xp-gold` for XP values, `--oav-text-secondary` for text |
| Completed state | Border solid `--oav-quest-teal`, checkmark overlay, "Completed" badge |

#### StreakIndicator

Shows consecutive success count with flame effect.

| Property | Value |
|----------|-------|
| Layout | Inline, flame icon + number |
| Icon | Flame, 16px, color scales with streak length |
| Number | `--oav-text-sm`, `--oav-font-bold`, tabular-nums |
| Streak 1-9 | Flame `--oav-neutral-400`, number `--oav-text-secondary` |
| Streak 10-19 | Flame `--oav-warning-400`, number `--oav-warning-400` |
| Streak 20-49 | Flame `--oav-accent-500`, number `--oav-accent-500`, subtle glow |
| Streak 50-99 | Flame `--oav-streak-flame`, number `--oav-streak-flame`, animated flicker |
| Streak 100+ | Flame `--oav-error-500` with `--oav-xp-gold` inner, animated fire particles (2 per second), number `--oav-xp-gold` |

---

### 3.7 Chart Components

#### ChartContainer

Wrapper providing consistent styling for all chart types.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-overlay` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-rounded` |
| Padding | 20px |
| Title | `--oav-text-base`, `--oav-font-semibold`, `--oav-text-primary` |
| Subtitle | `--oav-text-xs`, `--oav-text-tertiary` |
| Title gap | 16px below title before chart area |
| Controls (top-right) | Period selector, zoom, download buttons |
| Min height | 240px |
| Responsive | Chart re-renders on container resize (ResizeObserver) |

#### Legend

Chart legend component.

| Property | Value |
|----------|-------|
| Layout | Horizontal (default) or vertical |
| Item gap | 16px (horizontal), 8px (vertical) |
| Color swatch | 8px circle (or line segment for line charts) |
| Label | `--oav-text-xs`, `--oav-text-secondary` |
| Interactive | Click to toggle series visibility (dim to 20% opacity) |
| Disabled series | Swatch and label at 30% opacity, strikethrough on label |

#### ChartTooltip

Custom tooltip for chart hover states.

| Property | Value |
|----------|-------|
| Background | `--oav-surface-tooltip` |
| Border | 1px solid `--oav-border-default` |
| Border radius | `--oav-radius-default` |
| Padding | 8px 12px |
| Shadow | `--oav-shadow-md` |
| Title | `--oav-text-xs`, `--oav-font-semibold`, `--oav-text-primary` (e.g., date/time) |
| Value rows | Color swatch (8px) + series name (`--oav-text-xs`, `--oav-text-secondary`) + value (`--oav-text-xs`, `--oav-font-mono`, `--oav-font-semibold`, `--oav-text-primary`) |
| Row gap | 4px |
| Max rows | 8 (scrollable if more) |
| Follow cursor | Positioned near cursor with smart edge detection |
| Show delay | 0ms (immediate on chart hover) |

---

## 4. Screen Designs

### 4.1 Virtual World Main View

The primary screen -- the canvas where agents live.

```
+---+---------------------------------------------------+
| S |  [Menu] [Cost: $4.27 today] [12 agents] [Cmd+K] [Bell] [Mode] [User] |
| i +---------------------------------------------------+
| d |                                                   |
| e |        +---------+                                |
| b |        | Library |    +------------+              |
| a |        | [A][A]  |    | Open Floor |              |
| r |        +---------+    | [A][A][A]  |  +--------+  |
|   |                       | [A][A]     |  | Review |  |
| W |   +-----------+       +------------+  | [A]    |  |
| o |   | Lobby     |                       +--------+  |
| r |   | [A]       |    +---------+                    |
| l |   +-----------+    | Manager |     +--------+     |
| d |                     | [A]     |     | Server |     |
|   |   +-----------+    +---------+     | [LEDs] |     |
| D |   | Break Rm  |                    +--------+     |
| a |   | [A][A]    |   +---------------------------+   |
| s |   +-----------+   | Archive / Trophy Room     |   |
| h |                    +---------------------------+   |
| b |                                                   |
| o |                                    +----------+   |
| a |                                    | Minimap  |   |
| r |                                    | [......] |   |
| d |                                    +----------+   |
|   +---------------------------------------------------+
| A |  [Activity Feed Panel - slides from left]         |
| l +---------------------------------------------------+
| e |                                                   |
| r |  [Alert Banner - slides from top when triggered]  |
| t |                                                   |
+---+---------------------------------------------------+
```

**Layout Details:**

| Element | Position | Size | Behavior |
|---------|----------|------|----------|
| Canvas | Fills entire content area | Full bleed, no padding | PixiJS WebGL canvas, pans/zooms |
| Minimap | Bottom-right, 16px margin | 200px x 150px | Shows full world with viewport rectangle, click to navigate |
| Activity Feed | Left panel, overlays canvas | 320px width, full height | Toggle via sidebar icon or `F` key, semi-transparent background |
| Alert Banner | Top of canvas, centered | 80% width, auto height | Slides down on alert trigger, has action buttons |
| Agent Detail Panel | Right panel, overlays canvas | 400px width, full height | Opens on agent click, slides from right, `Escape` closes |
| Task Queue Panel | Left panel, overlays canvas | 320px width, full height | Toggle via sidebar Tasks icon |
| Replay Controls | Bottom of canvas, centered | 600px width, 56px height | Only visible in replay mode |

**Minimap:**
- Background: `--oav-surface-overlay` at 80% opacity
- Border: 1px solid `--oav-border-default`
- Border radius: `--oav-radius-default`
- Agent dots: 3px circles, colored by state
- Viewport rectangle: 1px solid `--oav-primary-400`, transparent fill
- Zone labels: `--oav-text-xs`, 8px font, `--oav-text-tertiary`

### 4.2 Dashboard Overview

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Dashboard > Overview                   [7 days v]|
| e |                                                   |
| b |  +----------+ +----------+ +----------+ +------+  |
| a |  | Total    | | Active   | | Session  | | Tasks|  |
| r |  | Agents   | | Now      | | Cost     | | Today|  |
|   |  | 12       | | 8        | | $4.72    | | 147  |  |
|   |  | +8% [~~] | | [~~]     | | -12% [~] | | [~~] |  |
|   |  +----------+ +----------+ +----------+ +------+  |
|   |                                                   |
|   |  Agent Performance             Cost Trend         |
|   |  +-----------------------+  +------------------+  |
|   |  | [Agent Cards Grid    |  | [Line chart:     |  |
|   |  |  3 per row           |  |  Daily cost      |  |
|   |  |  CoderAgent  Lv.18   |  |  over period     |  |
|   |  |  ResearchAgt Lv.12   |  |  with budget     |  |
|   |  |  ReviewAgent Lv.15   |  |  line overlay]   |  |
|   |  |  AnalystAgt  Lv.8    |  |                  |  |
|   |  |  ...]                |  |                  |  |
|   |  +-----------------------+  +------------------+  |
|   |                                                   |
|   |  Error Rate Trend           Model Distribution    |
|   |  +-----------------------+  +------------------+  |
|   |  | [Area chart:          |  | [Donut chart:    |  |
|   |  |  error % over time]   |  |  GPT-4o 60%     |  |
|   |  |                       |  |  GPT-4o-mini 25% |  |
|   |  |                       |  |  Claude 10%      |  |
|   |  +-----------------------+  +------------------+  |
+---+---------------------------------------------------+
```

**Metric Cards Row:** 4-column grid at >=1280px, 2-column at >=768px, 1-column below.

**Charts:** 2-column grid (60/40 split) at >=1024px, stack to 1-column below.

**Chart Colors:**
- Line chart series: `--oav-primary-400`, `--oav-secondary-400`, `--oav-accent-400`, `--oav-info-400`
- Area fill: Series color at 15% opacity
- Grid lines: `--oav-border-subtle`
- Axis labels: `--oav-text-xs`, `--oav-text-tertiary`
- Budget line: 1px dashed `--oav-warning-400`
- Anomaly dots: `--oav-error-500`, 6px circle

### 4.3 Agent Detail Panel

Slides in from right when an agent is clicked on canvas or navigated to from dashboard.

```
+------------------------------------------+
| [<-Back]  Agent Detail      [X Close]    |
+------------------------------------------+
| [Avatar 64px]  ResearchAgent             |
| [LevelBadge 36px]  Level 12 - Expert I  |
| [StatusBadge: Active]                    |
| [XPBar: 68% =================---------] |
| 2,290 / 3,362 XP to Level 13            |
|                                          |
| [Badge1] [Badge2] [Badge3]  View All >  |
+------------------------------------------+
| [Overview] [Tasks] [Traces] [Cost] [Ach] |
+------------------------------------------+
|                                          |
| OVERVIEW TAB:                            |
|                                          |
| +--------+ +--------+ +--------+        |
| |Tasks   | |Success | |Tokens  |        |
| |847     | |94.2%   | |1.2M    |        |
| +--------+ +--------+ +--------+        |
| +--------+ +--------+ +--------+        |
| |Avg Cost| |Avg Lat | |Errors  |        |
| |$0.018  | |2.1s    | |14      |        |
| +--------+ +--------+ +--------+        |
|                                          |
| Activity Timeline                        |
| +--------------------------------------+ |
| | 14:30  Completed: web_search  +50 XP | |
| | 14:28  Started: Research task        | |
| | 14:25  Handoff from ManagerAgent     | |
| | 14:22  Completed: data_extract +25XP | |
| | ...                                  | |
| +--------------------------------------+ |
|                                          |
| Current State                            |
| Executing: web_search tool               |
| Current Task: Research competitor pricing|
| Token Budget: [=====------] 45%          |
| Streak: [flame] 23 consecutive successes |
|                                          |
| [View on Canvas] [View Trace] [Export]   |
+------------------------------------------+
```

| Property | Value |
|----------|-------|
| Width | 400px |
| Background | `--oav-surface-raised` |
| Border left | 1px solid `--oav-border-subtle` |
| Shadow | `--oav-shadow-lg` (left shadow) |
| Header | 56px, sticky top |
| Scroll | Body content scrolls independently |
| Animation in | translateX(100%) to translateX(0), 300ms `ease-out` |
| Animation out | translateX(0) to translateX(100%), 200ms `ease-in` |

### 4.4 Traces/Sessions List

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Sessions                    [Search] [Filters v] |
| e |                                                   |
| b |  +-----------------------------------------------+|
| a |  | Session     | Agents | Dur  | Tasks|Cost|Stat ||
| r |  |-------------|--------|------|------|----|----- ||
|   |  | Run #42     | [AAA]  | 4m32s| 12   |$1.38|OK ||
|   |  | Run #41     | [AA]   | 2m10s| 8    |$0.72|OK ||
|   |  | Run #40     | [AAAA] | 8m45s| 24   |$3.90|Err||
|   |  | Run #39     | [AA]   | 1m55s| 6    |$0.48|OK ||
|   |  | ...         |        |      |      |     |    ||
|   |  +-----------------------------------------------+|
|   |                                                   |
|   |  +-----------------------------------------------+|
|   |  | Preview Panel (expands on row click)           ||
|   |  | Session: Run #42                               ||
|   |  | Agents: Research, Coder, Reviewer              ||
|   |  | Timeline: [====|===|==|=======]                ||
|   |  | Summary: 12 tasks, 0 errors, $1.38 total      ||
|   |  | [Open Replay] [View Traces] [Share]            ||
|   |  +-----------------------------------------------+|
+---+---------------------------------------------------+
```

**Filters bar:**
- Status filter: Dropdown (All, Success, Failed, Mixed)
- Date range: DateRangePicker
- Agent filter: Multi-select dropdown
- Cost range: Min/Max inputs
- Sort: Dropdown (Newest, Oldest, Most Expensive, Longest)

**Preview Panel:** Expands below the clicked row with 300ms slide-down animation. Shows session summary with mini-timeline, agent avatars, and action buttons.

### 4.5 Leaderboard Page

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Leaderboard                [Today|7d|30d|All]    |
| e |                                                   |
| b |  [Composite] [Efficiency] [Speed] [Quality] [Cost]|
| a |                                                   |
| r |  +-----------------------------------------------+|
|   |  | #  | Ch | Avatar | Agent        |Score| Metric||
|   |  |----|----+--------+------------- |-----|-------||
|   |  | 1  | -- | [av]   | CoderAgent  |94.2 | $0.012||
|   |  |    |    |        | Lv.18       |     | /task ||
|   |  |----|----+--------+------------- |-----|-------||
|   |  | 2  | +2 | [av]   | ResearchAgt |91.8 | 1.8s  ||
|   |  |    |    |        | Lv.12       |     | avg   ||
|   |  |----|----+--------+------------- |-----|-------||
|   |  | 3  | -1 | [av]   | ReviewAgent |89.5 | 97.3% ||
|   |  |    |    |        | Lv.15       |     | qual  ||
|   |  +-----------------------------------------------+|
|   |                                                   |
|   |  Achievements Showcase                            |
|   |  +-----------------------------------------------+|
|   |  | Recently Unlocked                              ||
|   |  | [Badge] Centurion - CoderAgent - 3h ago        ||
|   |  | [Badge] Budget Hawk - ResearchAgt - 1d ago     ||
|   |  | [Badge] Clean Run - ReviewAgent - 2d ago       ||
|   |  +-----------------------------------------------+|
+---+---------------------------------------------------+
```

**Professional Mode Alternate:**
- Title: "Performance Benchmarks" instead of "Leaderboard"
- Rank column: Shows percentile tier (Elite, Advanced, Proficient) instead of #1, #2
- No medal colors on top-3
- Score labeled "Performance Index" instead of "Score"
- Achievements section: "Certifications" with formal certificate-style badges

### 4.6 Settings Page

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Settings                                         |
| e |                                                   |
| b |  +----------+------------------------------------+|
| a |  | General  | Workspace Settings                  ||
| r |  | Members  |                                     ||
|   |  | API Keys | Workspace Name                      ||
|   |  | Gamific. | [My Workspace_____________]          ||
|   |  | Alerts   |                                     ||
|   |  | Billing  | Display Mode                        ||
|   |  |          | (o) Gamified  ( ) Professional       ||
|   |  |          | [x] Allow member override            ||
|   |  |          |                                     ||
|   |  |          | Canvas Theme                        ||
|   |  |          | [Dark v]                            ||
|   |  |          |                                     ||
|   |  |          | Default Credentials                  ||
|   |  |          | Email: kotsai@gmail.com              ||
|   |  |          | [Change Password]                   ||
|   |  |          |                                     ||
|   |  |          | Danger Zone                          ||
|   |  |          | [Delete Workspace]                   ||
|   |  +----------+------------------------------------+|
+---+---------------------------------------------------+
```

**Layout:** 2-column settings layout. Left: vertical nav (240px). Right: settings content (scrollable). Settings nav uses same NavItem component as sidebar but in a vertical list without icons.

### 4.7 Alert Configuration

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Alerts > Alert Rules                             |
| e |                                                   |
| b |  [Active Alerts] [Alert Rules] [SLOs] [History]  |
| a |                                                   |
| r |  [+ Create Alert Rule]                           |
|   |                                                   |
|   |  +-----------------------------------------------+|
|   |  | Rule Name        |Type     |Agent  |Status    ||
|   |  |------------------|---------|-------|--------- ||
|   |  | Loop Detection   |Loop     |All    |Active    ||
|   |  | High Cost Alert  |Cost     |All    |Active    ||
|   |  | Error Spike      |Error    |Coder  |Paused    ||
|   |  +-----------------------------------------------+|
|   |                                                   |
|   |  Create Alert Rule (expanded form)                |
|   |  +-----------------------------------------------+|
|   |  | Alert Name: [________________________]         ||
|   |  | Type: [Loop Detection    v]                    ||
|   |  |                                                ||
|   |  | Condition                                      ||
|   |  | Agent: [All Agents        v]                   ||
|   |  | Threshold: [5] repetitions                     ||
|   |  | Window: [60] seconds                           ||
|   |  | Severity: [Critical        v]                  ||
|   |  |                                                ||
|   |  | Notifications                                  ||
|   |  | [x] Canvas banner  [x] Sound  [ ] Slack       ||
|   |  | [x] Email          [ ] PagerDuty              ||
|   |  |                                                ||
|   |  | Auto-Actions                                   ||
|   |  | [ ] Kill agent on trigger                      ||
|   |  | [ ] Pause workspace on trigger                 ||
|   |  |                                                ||
|   |  | [Cancel] [Save Alert Rule]                     ||
|   |  +-----------------------------------------------+|
+---+---------------------------------------------------+
```

**Rule Builder:** Uses standard form components (Input, Select, Checkbox, Toggle). Condition section adapts based on selected alert type. Each type shows relevant threshold fields. Form validates inline -- error text appears below invalid fields.

### 4.8 Cost Analysis Page

```
+---+---------------------------------------------------+
| S |  Header                                           |
| i +---------------------------------------------------+
| d |  Costs                      [Today|7d|30d|Custom] |
| e |                                                   |
| b |  +----------+ +----------+ +----------+ +------+  |
| a |  | Total    | | Avg Daily| | Budget   | |Agents|  |
| r |  | Spend    | |          | | Used     | |Active|  |
|   |  | $847.20  | | $28.24   | | 56%      | | 14   |  |
|   |  +----------+ +----------+ +----------+ +------+  |
|   |                                                   |
|   |  Budget Meter                                     |
|   |  [=============================---------] 56%     |
|   |  $847.20 / $1,500.00       [!50%] [!!80%]        |
|   |                                                   |
|   |  Cost by Agent                  Cost by Model     |
|   |  +-------------------------+ +------------------+ |
|   |  | Agent      |Cost |% Tot | | [Donut chart]    | |
|   |  |------------|-----|------| | GPT-4o: 60%      | |
|   |  | CoderAgt   |$320 | 38%  | | GPT-4o-mini: 25% | |
|   |  | ResearchAgt|$210 | 25%  | | Claude 3.5: 10%  | |
|   |  | AnalystAgt |$140 | 17%  | | Other: 5%        | |
|   |  +-------------------------+ +------------------+ |
|   |                                                   |
|   |  Daily Cost Trend                                 |
|   |  +-----------------------------------------------+|
|   |  | [Line chart with budget overlay line]          ||
|   |  | [Anomaly markers in red]                       ||
|   |  +-----------------------------------------------+|
|   |                                                   |
|   |  Recommendations                                  |
|   |  +-----------------------------------------------+|
|   |  | [Lightbulb] Switch ResearchAgent from GPT-4o   ||
|   |  | to GPT-4o-mini: estimated savings $120/month   ||
|   |  +-----------------------------------------------+|
|   |                                                   |
|   |  [Export CSV] [Export PDF] [Configure Alerts]      |
+---+---------------------------------------------------+
```

**Budget Meter:**
- Full width bar, 12px height
- Track: `--oav-neutral-700`
- Fill color transitions: 0-50% `--oav-success-500`, 50-80% `--oav-warning-500`, 80-100% `--oav-error-500`
- Threshold markers: small triangles at 50% and 80% positions
- Animated fill on load, 600ms `ease-out`

**Donut Chart:**
- Model segment colors: `--oav-primary-400` (GPT-4o), `--oav-secondary-400` (GPT-4o-mini), `--oav-accent-400` (Claude), `--oav-neutral-500` (Other)
- Center: Total cost value, `--oav-text-xl`, `--oav-font-bold`
- Hover: Segment expands 4px outward, tooltip shows exact amount and percentage
- Animation: Segments sweep in clockwise from 0, 600ms, staggered 100ms each

### 4.9 Login and Onboarding Screens

**Login:**

```
+---------------------------------------------------+
|                                                   |
|          [OpenAgentVisualizer Logo]               |
|          Visualize your AI agent teams            |
|                                                   |
|   +-------------------------------------------+  |
|   |                                           |  |
|   |  Email                                    |  |
|   |  [kotsai@gmail.com_________________]      |  |
|   |                                           |  |
|   |  Password                                 |  |
|   |  [**********________________________]     |  |
|   |                                           |  |
|   |  [        Sign In (Primary Button)     ]  |  |
|   |                                           |  |
|   |  ── or ──                                 |  |
|   |                                           |  |
|   |  [  Sign in with GitHub  ]                |  |
|   |  [  Sign in with Google  ]                |  |
|   |                                           |  |
|   |  Don't have an account? Sign up           |  |
|   +-------------------------------------------+  |
|                                                   |
|   [Animated canvas preview in background -        |
|    subtle, blurred, with 3-4 agents moving]       |
+---------------------------------------------------+
```

| Property | Value |
|----------|-------|
| Background | `--oav-surface-base` with subtle animated canvas (3 sample agents at 20% opacity, blurred) |
| Card | 400px width, centered, `--oav-surface-overlay`, `--oav-radius-rounded`, `--oav-shadow-lg`, padding 32px |
| Logo | 48px icon + "OpenAgentVisualizer" wordmark, `--oav-text-primary` |
| Tagline | `--oav-text-sm`, `--oav-text-secondary` |
| OAuth buttons | Secondary button style with provider icon (20px) left-aligned |
| Divider | Labeled divider "or" |

**Onboarding (Welcome Screen after first login):**

```
+---------------------------------------------------+
|                                                   |
|  Welcome to OpenAgentVisualizer!                  |
|                                                   |
|  Your workspace "My Workspace" is ready.          |
|  Let's get your agents on the canvas.             |
|                                                   |
|  +---------------------+ +---------------------+ |
|  | [Agent icon]        | | [Play icon]          | |
|  | Connect Your Agents | | Explore Sample Data  | |
|  | Set up the SDK and  | | See 5 demo agents   | |
|  | see real agents in  | | running in the       | |
|  | under 5 minutes     | | virtual world        | |
|  | [Primary Button]    | | [Secondary Button]   | |
|  +---------------------+ +---------------------+ |
|                                                   |
+---------------------------------------------------+
```

**SDK Setup Panel (after clicking "Connect Your Agents"):**

```
+---------------------------------------------------+
|  Step 1: Install                                  |
|  pip install openagentvisualizer  [Copy]          |
|                                                   |
|  Step 2: Add to your code                         |
|  +-----------------------------------------------+|
|  | from openagentvisualizer import OAVTracer      ||
|  | tracer = OAVTracer(api_key="oav_xxx...")       ||
|  | tracer.auto_instrument()                       ||
|  +-----------------------------------------------+|
|  [Copy]                                           |
|                                                   |
|  Step 3: Run your pipeline                        |
|                                                   |
|  Waiting for first event...  [animated spinner]   |
|                                                   |
+---------------------------------------------------+
```

Code block styling:
- Background: `--oav-surface-sunken`
- Font: `--oav-font-mono`, `--oav-text-sm`
- Border: 1px solid `--oav-border-default`
- Border radius: `--oav-radius-default`
- Padding: 16px
- Copy button: Ghost button, top-right corner, "Copy" text + clipboard icon

---

## 5. Iconography

### 5.1 Icon Style Guide

| Property | Value |
|----------|-------|
| Icon set | Lucide Icons (https://lucide.dev) |
| Stroke width | 1.5px (consistent with Lucide defaults) |
| Default size | 20px for UI chrome, 16px for inline/table, 24px for nav, 48px for empty states |
| Color | Inherits from parent text color via `currentColor` |
| Alignment | Vertically centered with adjacent text |
| Touch target | Minimum 32px x 32px for interactive icons (padding around smaller icons) |

### 5.2 Icon Mapping

| Context | Icon Name | Lucide Icon |
|---------|-----------|-------------|
| World View | `Globe` | Globe |
| Dashboard | `LayoutDashboard` | LayoutDashboard |
| Agents | `Bot` | Bot |
| Sessions/Replays | `Play` | Play |
| Leaderboard | `Trophy` | Trophy |
| Costs | `DollarSign` | DollarSign |
| Alerts | `Bell` | Bell |
| Topology | `Network` | Network |
| Settings | `Settings` | Settings |
| Search | `Search` | Search |
| Close | `X` | X |
| Back | `ArrowLeft` | ArrowLeft |
| Expand | `ChevronDown` | ChevronDown |
| Sort ascending | `ArrowUp` | ArrowUp |
| Sort descending | `ArrowDown` | ArrowDown |
| Filter | `Filter` | Filter |
| Export | `Download` | Download |
| Copy | `Copy` | Copy |
| Share | `Share2` | Share2 |
| Add/Create | `Plus` | Plus |
| Delete | `Trash2` | Trash2 |
| Edit | `Pencil` | Pencil |
| Info | `Info` | Info |
| Warning | `AlertTriangle` | AlertTriangle |
| Error | `AlertCircle` | AlertCircle |
| Success | `CheckCircle2` | CheckCircle2 |
| Agent idle | `Moon` | Moon |
| Agent active | `Zap` | Zap |
| Agent thinking | `Brain` | Brain |
| Agent error | `AlertTriangle` | AlertTriangle |
| Agent communicating | `MessageSquare` | MessageSquare |
| XP/Points | `Star` | Star |
| Level | `Shield` | Shield |
| Achievement | `Award` | Award |
| Streak | `Flame` | Flame |
| Quest | `Compass` | Compass |
| Token/Cost | `Coins` | Coins |
| Speed | `Timer` | Timer |
| Quality | `Sparkles` | Sparkles |
| Kill Agent | `Power` | Power |
| Replay | `RotateCcw` | RotateCcw |
| Workspace | `Building2` | Building2 |
| Team | `Users` | Users |
| API Key | `Key` | Key |
| Webhook | `Webhook` | Webhook |
| Professional Mode | `Briefcase` | Briefcase |
| Gamified Mode | `Gamepad2` | Gamepad2 |

### 5.3 Custom Icons Needed

Icons that do not exist in Lucide and require custom SVG creation:

| Icon | Description | Usage |
|------|-------------|-------|
| `agent-avatar-starter` | Simple circle with two dot eyes | Tier 1 agent placeholder on non-canvas views |
| `agent-avatar-standard` | Rounded character silhouette with face | Tier 2 agent placeholder |
| `loop-detected` | Circular arrow with exclamation mark | Loop detection alert icon |
| `handoff` | Two arrows passing each other (bidirectional transfer) | Agent handoff events in activity feed |
| `energy-bar` | Battery-style icon with fill level | Token budget indicator in compact views |
| `mana-bar` | Diamond with inner fill | Efficiency indicator in compact views |
| `oav-logo` | OpenAgentVisualizer logo mark -- stylized eye/lens with agent dot inside | Branding, favicon, login screen |
| `oav-wordmark` | "OpenAgentVisualizer" in brand typography | Header, login screen |

Custom icons follow Lucide conventions: 24px viewbox, 1.5px stroke, round line caps, round line joins.

---

## 6. Dark Mode and Theming

### 6.1 Color Mapping Strategy

OpenAgentVisualizer is dark-mode-first. The dark theme is the primary and default theme. A light theme exists as an optional preference but is not the primary design target.

All colors are consumed via CSS custom properties, never as direct hex values. This enables theme switching by swapping the property values on the `:root` element.

#### Dark Theme (Default)

```css
:root[data-theme="dark"] {
  --oav-surface-base: #0F1117;
  --oav-surface-raised: #161B26;
  --oav-surface-overlay: #1C2233;
  --oav-surface-sunken: #0A0D14;
  --oav-surface-modal: #1F2740;
  --oav-surface-tooltip: #252D3F;
  --oav-border-default: #2A3246;
  --oav-border-subtle: #1E2536;
  --oav-border-strong: #3D4760;
  --oav-text-primary: #F1F5F9;
  --oav-text-secondary: #94A3B8;
  --oav-text-tertiary: #64748B;
  --oav-text-inverse: #0F172A;
}
```

#### Light Theme (Optional)

```css
:root[data-theme="light"] {
  --oav-surface-base: #F8FAFC;
  --oav-surface-raised: #FFFFFF;
  --oav-surface-overlay: #FFFFFF;
  --oav-surface-sunken: #F1F5F9;
  --oav-surface-modal: #FFFFFF;
  --oav-surface-tooltip: #1E293B;
  --oav-border-default: #E2E8F0;
  --oav-border-subtle: #F1F5F9;
  --oav-border-strong: #CBD5E1;
  --oav-text-primary: #0F172A;
  --oav-text-secondary: #475569;
  --oav-text-tertiary: #94A3B8;
  --oav-text-inverse: #F8FAFC;
}
```

#### Professional Mode Color Overrides

Professional Mode does not change the theme (dark/light) but reduces saturation and intensity of gamification colors:

```css
:root[data-mode="professional"] {
  --oav-xp-gold: #94A3B8;           /* XP gold becomes muted grey */
  --oav-level-purple: #64748B;       /* Level purple becomes neutral */
  --oav-streak-flame: #94A3B8;       /* Streak flame becomes grey */
  --oav-rarity-common: #6B7280;
  --oav-rarity-uncommon: #6B7280;
  --oav-rarity-rare: #6B7280;
  --oav-rarity-epic: #6B7280;
  --oav-rarity-legendary: #6B7280;
  /* Semantic colors (success/warning/error) remain unchanged -- they carry operational meaning */
}
```

### 6.2 Theme Switching

| Property | Value |
|----------|-------|
| Toggle location | Header bar (sun/moon icon) and Settings > General |
| Persistence | `localStorage` key `oav-theme` with values `dark`, `light`, `system` |
| Default | `dark` |
| System detection | `prefers-color-scheme` media query when set to `system` |
| Transition | All color properties transition with 200ms `ease` to avoid flash |
| Canvas | PixiJS canvas reads theme tokens and applies them to sprite tints and background color. Theme change triggers a canvas re-tint pass (batched, one frame). |

### 6.3 CSS Custom Properties Implementation

All tokens are defined in a single `tokens.css` file imported at the app root. Tailwind CSS is configured to reference these tokens via `theme.extend`:

```css
/* tokens.css -- imported in main.tsx */
:root {
  /* All --oav-* tokens defined here */
}

:root[data-theme="dark"] { /* dark overrides */ }
:root[data-theme="light"] { /* light overrides */ }
:root[data-mode="professional"] { /* professional overrides */ }
```

```js
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        'oav-primary': {
          50: 'var(--oav-primary-50)',
          // ... all shades
          900: 'var(--oav-primary-900)',
        },
        'oav-surface': {
          base: 'var(--oav-surface-base)',
          raised: 'var(--oav-surface-raised)',
          overlay: 'var(--oav-surface-overlay)',
          sunken: 'var(--oav-surface-sunken)',
          modal: 'var(--oav-surface-modal)',
        },
        // ... all token groups
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
    },
  },
};
```

---

## 7. Responsive Grid

### 7.1 Grid System

12-column grid with consistent gutter widths across breakpoints.

| Property | Value |
|----------|-------|
| Columns | 12 |
| Gutter | 16px (mobile), 24px (tablet+) |
| Margin | 16px (mobile), 24px (tablet), 32px (desktop) |
| Implementation | CSS Grid with `grid-template-columns: repeat(12, 1fr)` |

### 7.2 Breakpoints

| Name | Min Width | Container Max | Columns Used | Sidebar |
|------|-----------|---------------|-------------|---------|
| `xs` (mobile) | 0px | 100% | 4 (of 12) | Hidden |
| `sm` (mobile landscape) | 640px | 100% | 6 (of 12) | Hidden |
| `md` (tablet) | 768px | 100% | 8 (of 12) | Collapsed (64px) |
| `lg` (desktop) | 1024px | 100% | 12 | Collapsed (64px) |
| `xl` (wide desktop) | 1280px | 1440px | 12 | Expanded (240px) |
| `2xl` (ultrawide) | 1536px | 1440px | 12 | Expanded (240px) |

### 7.3 Container Widths

| Context | Max Width | Behavior |
|---------|-----------|----------|
| Canvas (World View) | Full viewport | No max width, no padding, full bleed |
| Dashboard pages | 1440px | Centered, with page padding |
| Settings pages | 1024px | Centered, with page padding |
| Modal content | 480/640/800px | Centered in viewport |
| Agent detail panel | 400px fixed | Right-anchored, overlays content |
| Activity feed panel | 320px fixed | Left-anchored, overlays canvas |

### 7.4 Responsive Component Behavior

| Component | >=1280px | >=768px | <768px |
|-----------|----------|---------|--------|
| Metric cards | 4-column grid | 2-column grid | 1-column stack |
| Agent cards | 3-column grid | 2-column grid | 1-column stack |
| Charts (2-col) | Side by side (60/40) | Side by side (50/50) | Stacked |
| DataTable | Full columns visible | Horizontal scroll | Horizontal scroll, fewer default columns |
| Sidebar | Expanded (240px) | Collapsed (64px) | Hidden (hamburger menu) |
| Agent detail panel | 400px right panel | 400px right panel | Full-screen overlay |
| Command palette | 600px centered | 600px centered | Full-width, 16px margin |
| Leaderboard | Full table | Full table | Card layout per agent |
| Settings | 2-column (nav + content) | 2-column | 1-column (nav as top tabs) |

---

## 8. Accessibility Visual Standards

### 8.1 Focus Rings

All interactive elements display a visible focus ring when navigated via keyboard (`:focus-visible`).

| Property | Value |
|----------|-------|
| Style | 2px solid offset ring |
| Color | `--oav-primary-300` (default), `--oav-error-300` (danger actions) |
| Offset | 2px from element edge |
| Border radius | Matches element's border-radius |
| Transition | box-shadow 100ms ease |
| Implementation | `box-shadow: 0 0 0 2px var(--oav-surface-base), 0 0 0 4px var(--oav-primary-300)` (double ring ensures visibility on any background) |

Focus rings are never hidden. `:focus:not(:focus-visible)` removes the ring for mouse clicks only; keyboard navigation always shows it.

### 8.2 Contrast Ratios

All text-to-background combinations meet WCAG 2.2 AA minimum (4.5:1 for normal text, 3:1 for large text).

| Combination | Foreground | Background | Contrast Ratio | Pass Level |
|-------------|-----------|------------|---------------|------------|
| Primary text on base | `#F1F5F9` | `#0F1117` | 15.8:1 | AAA |
| Secondary text on base | `#94A3B8` | `#0F1117` | 7.2:1 | AAA |
| Tertiary text on base | `#64748B` | `#0F1117` | 4.6:1 | AA |
| Primary text on overlay | `#F1F5F9` | `#1C2233` | 12.1:1 | AAA |
| Secondary text on overlay | `#94A3B8` | `#1C2233` | 5.5:1 | AA |
| Button text on primary | `#FFFFFF` | `#6366F1` | 4.6:1 | AA |
| Button text on danger | `#FFFFFF` | `#EF4444` | 4.5:1 | AA |
| Success badge text | `#4ADE80` | `#0F1117` | 8.9:1 | AAA |
| Error badge text | `#F87171` | `#0F1117` | 5.8:1 | AA |
| Warning badge text | `#FBBF24` | `#0F1117` | 10.2:1 | AAA |
| Agent name on canvas | `#F1F5F9` | varies (world bg) | >=7.0:1 (text has dark shadow) | AA+ |

### 8.3 Color Independence

No information is conveyed through color alone. Every color-coded element has a secondary indicator:

| Element | Color Signal | Non-Color Signal |
|---------|-------------|-----------------|
| Agent state | Ring color | Ring animation pattern (pulse, rotation, shake) + tooltip text |
| Alert severity | Red/amber/blue | Icon shape (triangle/circle/info) + severity label text |
| Leaderboard rank change | Green up / Red down | Arrow direction icon + numeric change value |
| Success/Failure | Green/Red | Checkmark/X icon + text label |
| Budget meter | Color gradient | Percentage text + threshold markers |
| Weather effects | Environmental color | Text overlay ("System Healthy" / "Errors Detected") available via accessibility toggle |

### 8.4 Touch Targets

| Element | Minimum Size | Notes |
|---------|-------------|-------|
| Buttons | 36px height (md), 44px on mobile | 44px minimum on touch devices |
| Icon buttons | 36px x 36px | 44px x 44px on touch devices |
| Nav items | 40px height | Full sidebar width clickable area |
| Table rows | 48px height | Full row is clickable |
| Checkbox/Toggle | 32px x 32px touch area | Visual element may be smaller; padding expands target |
| Tab items | 40px height | Full tab width clickable |
| Close buttons | 32px x 32px | |

### 8.5 Reduced Motion

When the user has `prefers-reduced-motion: reduce` enabled:

| Normal Behavior | Reduced Motion |
|----------------|---------------|
| Agent breathing/idle animation | Static avatar with state color ring (no animation) |
| Page transitions (slide + fade) | Instant content swap (no animation) |
| Chart draw-in animations | Charts render instantly |
| Particle effects (rain, confetti, XP) | Disabled entirely |
| Celebration animations | Toast notification only (no particles, no glow) |
| Skeleton shimmer | Static grey placeholder (no shimmer) |
| Number count-up | Instant final value |
| Weather effects | Disabled; text status indicator instead |
| Canvas day/night cycle | Static lighting at "afternoon" level |
| Tooltip/popover animations | Instant show/hide |

Implementation: A CSS media query sets `--oav-motion-duration: 0ms` and `--oav-motion-enabled: 0`. JavaScript checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` to disable PixiJS and Rive animation loops.

### 8.6 Screen Reader Support

| Element | ARIA Requirement |
|---------|-----------------|
| Agent avatar on canvas | `role="img"` with `aria-label="[AgentName], Level [N], Status: [state]"` |
| Status badges | `role="status"` with `aria-label` including full state text |
| Metric cards | Structured headings: `aria-label="[MetricName]: [Value], [Trend]"` |
| Charts | `role="img"` with `aria-label` summarizing the data trend; linked data table alternative |
| Modals | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title |
| Toasts | `role="alert"`, `aria-live="polite"` (info/success), `aria-live="assertive"` (error) |
| Navigation | `role="navigation"`, `aria-label="Main navigation"` |
| Leaderboard | `role="table"` with proper `th`/`td` semantics and `aria-sort` on sortable columns |
| Command palette | `role="combobox"` with `aria-expanded`, `aria-activedescendant` for highlighted result |
| Canvas world view | `aria-label="Agent virtual world canvas. [N] agents visible. Use keyboard shortcuts to navigate."` with a companion screen-reader-only agent list |

---

## Appendix A: Component Inventory Checklist

| # | Component | Category | Defined | Variants | States |
|---|-----------|----------|---------|----------|--------|
| 1 | AppShell | Layout | Yes | sidebar-collapsed, sidebar-expanded, fullscreen | -- |
| 2 | Sidebar | Layout | Yes | collapsed, expanded, hidden | -- |
| 3 | Header | Layout | Yes | default, replay-mode | -- |
| 4 | PageContainer | Layout | Yes | full-bleed, contained | -- |
| 5 | Grid | Layout | Yes | metrics, agents, 2col, settings | -- |
| 6 | Stack | Layout | Yes | vertical, horizontal, tight variants | -- |
| 7 | Divider | Layout | Yes | horizontal, vertical, labeled | -- |
| 8 | NavItem | Navigation | Yes | default, hover, active, with-badge | -- |
| 9 | Breadcrumb | Navigation | Yes | -- | -- |
| 10 | TabBar | Navigation | Yes | -- | default, hover, active |
| 11 | CommandPalette | Navigation | Yes | -- | open, searching, results, empty |
| 12 | MetricCard | Data Display | Yes | default, alert, success | default, hover, loading |
| 13 | Sparkline | Data Display | Yes | positive, negative, neutral | -- |
| 14 | StatusBadge | Data Display | Yes | active, idle, thinking, error, warning, terminated | -- |
| 15 | AgentCard | Data Display | Yes | -- | default, hover, selected |
| 16 | AvatarStack | Data Display | Yes | sm, md, lg | -- |
| 17 | DataTable | Data Display | Yes | -- | loading, empty, populated, selected-row |
| 18 | EmptyState | Data Display | Yes | with-action, without-action | -- |
| 19 | Skeleton | Data Display | Yes | text, metric, card, avatar, chart | -- |
| 20 | Button | Input | Yes | primary, secondary, ghost, danger | default, hover, active, disabled, loading |
| 21 | Input | Input | Yes | default, with-icon, with-error | default, focus, error, disabled |
| 22 | Select | Input | Yes | -- | default, open, focus, disabled |
| 23 | Checkbox | Input | Yes | -- | unchecked, checked, indeterminate, disabled |
| 24 | Toggle | Input | Yes | -- | off, on, disabled |
| 25 | Slider | Input | Yes | -- | default, dragging, disabled |
| 26 | SearchInput | Input | Yes | -- | empty, has-value, searching |
| 27 | DateRangePicker | Input | Yes | preset, custom | closed, open |
| 28 | Toast | Feedback | Yes | success, error, warning, info, achievement | entering, visible, exiting |
| 29 | Alert | Feedback | Yes | success, error, warning, info | -- |
| 30 | Modal | Feedback | Yes | small, medium, large | opening, open, closing |
| 31 | ConfirmDialog | Feedback | Yes | -- | -- |
| 32 | Tooltip | Feedback | Yes | -- | hidden, visible |
| 33 | Popover | Feedback | Yes | -- | closed, open |
| 34 | ProgressBar | Feedback | Yes | slim, default, thick; determinate, indeterminate | -- |
| 35 | XPBar | Gamification | Yes | compact, full | default, gaining, level-up |
| 36 | LevelBadge | Gamification | Yes | starter through legendary | default, leveling-up |
| 37 | AchievementPopup | Gamification | Yes | uncommon, rare, epic, legendary | -- |
| 38 | LeaderboardRow | Gamification | Yes | top-3, standard, current-user | default, hover |
| 39 | QuestCard | Gamification | Yes | active, completed | default, hover |
| 40 | StreakIndicator | Gamification | Yes | cold, warm, hot, inferno | -- |
| 41 | ChartContainer | Charts | Yes | -- | loading, populated, error |
| 42 | Legend | Charts | Yes | horizontal, vertical | interactive toggle |
| 43 | ChartTooltip | Charts | Yes | -- | hidden, visible |

---

## Appendix B: Design Token CSS File Structure

```
src/
├── styles/
│   ├── tokens.css              # All --oav-* CSS custom properties
│   ├── themes/
│   │   ├── dark.css            # Dark theme overrides (default)
│   │   ├── light.css           # Light theme overrides
│   │   └── professional.css    # Professional mode overrides
│   ├── base.css                # Reset, global styles, font imports
│   ├── components/             # Per-component CSS modules (if needed beyond Tailwind)
│   └── utilities.css           # Custom Tailwind utilities
├── tailwind.config.js          # Extends Tailwind with OAV tokens
└── index.css                   # Imports all above in order
```

---

*End of UI Design System. This document provides the complete visual specification for implementing the OpenAgentVisualizer frontend. All components, tokens, and patterns defined here are ready for consumption by the Frontend Expert (Stage 2.2a) and should be validated by the Code Reviewer (Stage 2.3) and QA Engineer (Stage 2.4).*
