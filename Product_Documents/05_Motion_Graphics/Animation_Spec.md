# OpenAgentVisualizer -- Animation Specification

**Stage:** 2.3 -- Motion Graphics Agent
**Date:** March 16, 2026
**Status:** Complete
**Author:** Motion Graphics Agent
**Depends On:** PRD (Stage 1.1), Gamification System Design (Stage 1.2), Agent Integration Architecture (Stage 1.3)
**Feeds Into:** Frontend Expert (2.2a), Sound Designer, QA Engineer (2.4)

---

## Table of Contents

1. [Animation Philosophy](#1-animation-philosophy)
2. [Rive State Machine Specifications](#2-rive-state-machine-specifications)
3. [Agent Character Animations](#3-agent-character-animations)
4. [UI Micro-Animations](#4-ui-micro-animations)
5. [Data Visualization Animations](#5-data-visualization-animations)
6. [Notification Animations](#6-notification-animations)
7. [Particle Systems](#7-particle-systems)
8. [Transition Specifications (GSAP)](#8-transition-specifications-gsap)
9. [Performance Guidelines](#9-performance-guidelines)
10. [Sound Design Integration](#10-sound-design-integration)
11. [Animation Tokens and Variables](#11-animation-tokens-and-variables)

---

## 1. Animation Philosophy

### 1.1 Core Principle: Motion as Information

Every animation in OpenAgentVisualizer must communicate state, not decorate space. If an animation can be removed without losing information, it should not exist. Motion is a data channel: it tells the user what an agent is doing, how well it is performing, and what just changed. Decorative animation wastes frame budget and trains users to ignore motion cues.

### 1.2 The Three Laws of OAV Motion

**Law 1: Motion encodes state.** An idle agent breathes slowly. A working agent types. An erroring agent shakes. The user should be able to mute all text, hide all numbers, and still read the system state from motion alone.

**Law 2: Motion respects attention.** Peripheral animations (agent idle loops, background particles) must be subtle enough that they do not pull focus from the user's current task. Only state transitions (error, level-up, alert) are allowed to demand attention, and only briefly.

**Law 3: Motion degrades gracefully.** Every animation must have a reduced-motion fallback (opacity change or instant state swap). Every animation must have an LOD tier (full, medium, minimal, off). The system must run at 60fps with 50 agents at full fidelity and at 30fps with 200 agents at minimal fidelity.

### 1.3 Design Language

OpenAgentVisualizer's motion language draws from two sources:

**Virtual world games** (spatial metaphor, character personality, celebration effects) -- used for the world canvas layer where agents live as persistent characters.

**Professional dashboards** (crisp transitions, purposeful micro-interactions, data-driven motion) -- used for the UI chrome, panels, charts, and controls.

The two languages must never cross-contaminate. Character animations live on the PixiJS canvas. UI animations live in the React DOM layer. They share timing tokens but not visual vocabulary.

### 1.4 Professional Mode Behavior

When Professional Mode is active (per Gamification System Design Section 10), all character animations shift to a reduced vocabulary:

| Standard Mode | Professional Mode |
|---|---|
| Character breathing, blinking, fidgeting | Static icon with color-coded status ring |
| Celebration particle burst | Green checkmark fade-in |
| Level-up glow + particle explosion | "Tier Upgraded" badge swap |
| XP floating number animation | Counter increment in sidebar |
| Confetti on achievement | Toast notification only |

Professional Mode disables all particle systems except data-flow particles between communicating agents (because those encode real information). UI micro-animations remain unchanged in both modes.

---

## 2. Rive State Machine Specifications

### 2.1 Why Rive

Rive is selected as the primary character animation engine because:
- State machines are first-class: transitions between agent states (idle, working, error) are defined in the Rive editor as state machine nodes, not code
- The runtime is 150KB gzipped, lightweight enough for 50+ simultaneous agents
- Rive files (.riv) are binary and compact (10-50KB per agent type vs. 200KB+ for equivalent Lottie JSON)
- Interactive inputs (speed, intensity, mood) can be driven from code at runtime without re-authoring

### 2.2 Agent Avatar State Machine

Every agent avatar is driven by a single Rive state machine with the following structure:

```
StateMachine: "AgentLifecycle"

States:
  [Entry] --> Idle
  Idle --> Initializing      (trigger: task_assigned)
  Initializing --> Thinking   (trigger: context_loaded)
  Thinking --> Executing      (trigger: tool_called)
  Thinking --> Communicating  (trigger: message_sent)
  Thinking --> Complete       (trigger: all_tasks_done)
  Executing --> Thinking      (trigger: tool_result)
  Executing --> Error         (trigger: tool_error)
  Communicating --> Waiting   (trigger: awaiting_response)
  Communicating --> Thinking  (trigger: response_received)
  Waiting --> Thinking        (trigger: unblocked)
  Waiting --> Terminated      (trigger: timeout)
  Error --> Recovering        (trigger: can_recover)
  Error --> Terminated        (trigger: fatal)
  Recovering --> Thinking     (trigger: recovered)
  Recovering --> Terminated   (trigger: recovery_exhausted)
  Complete --> Idle            (trigger: new_session)
  Any --> Overloaded          (trigger: queue_depth_exceeded)
  Overloaded --> Thinking     (trigger: queue_normalized)
  Any --> Sleeping            (trigger: idle_timeout_300s)
  Sleeping --> Idle            (trigger: wake_event)
  Complete --> Celebrating    (trigger: achievement_earned)
  Celebrating --> Complete    (trigger: celebration_done, after 2000ms)
  Any --> LevelingUp          (trigger: level_up)
  LevelingUp --> [previous]   (trigger: levelup_done, after 3000ms)
```

### 2.3 State Transition Diagram

```
                        +-----------+
            +---------->|   Idle    |<-----------+
            |           +-----+-----+            |
            |                 |                  |
            |           task_assigned       new_session
            |                 |                  |
            |           +-----v------+     +-----+------+
            |           |Initializing|     |  Complete   |
            |           +-----+------+     +--+----+----+
            |                 |               |    |
            |           context_loaded   all_done  achievement_earned
            |                 |               |    |
            |           +-----v-----+         |  +-v-----------+
  idle_timeout_300s +--->| Thinking  |<--------+  | Celebrating |
            |       |   +--+--+--+--+            +------+------+
            |       |      |  |  |                      |
            |       |      |  |  +--- all_tasks_done ---+
            |       |      |  |              celebration_done
        +---v---+   |      |  |
        |Sleeping|  |      |  +---- message_sent ---+
        +---+---+   |      |                        |
            |       |  tool_called           +------v--------+
        wake_event  |      |                 | Communicating |
            |       |  +---v------+          +--+------+----+
            +-------+  | Executing|             |      |
                    |  +---+--+---+    awaiting_ |   response_
                    |      |  |       response   |   received
                    |  result |                  |      |
                    |      |  tool_error   +-----v---+  |
                    +------+       |       | Waiting |  |
                           |       |       +--+--+---+  |
                           |       |          |  |      |
                           |  +----v---+ unblocked timeout
                           |  | Error  |      |     |
                           |  +--+--+--+      |  +--v---------+
                           |     |  |         |  | Terminated |
                           | can_recover fatal|  +--^----^----+
                           |     |     |      |     |    |
                           | +---v-------+ +--+  recovery_exhausted
                           | | Recovering|      |
                           | +---+-------+      |
                           |     |              |
                           | recovered          |
                           +-----+              |
                                                |
  Any State ---> [Overloaded] (queue_depth_exceeded)
  Overloaded --> Thinking (queue_normalized)
  Any State ---> [LevelingUp] (level_up) --> [previous state] (after 3000ms)
```

### 2.4 Blend Trees

Rive blend trees interpolate between animation variants based on continuous input parameters. Each agent avatar uses blend trees within the following states:

**Idle Blend Tree**
```
BlendTree: "IdleBlend"
Input: "energy" (0.0 = exhausted, 1.0 = fully rested)
  energy < 0.3 -> idle_tired (droopy eyes, slow breathing, slumped posture)
  energy 0.3-0.7 -> idle_normal (standard breathing, occasional blink)
  energy > 0.7 -> idle_alert (upright posture, looking around, quick blinks)
Blend mode: linear interpolation with 500ms smoothing
```

**Working Blend Tree**
```
BlendTree: "WorkingBlend"
Input: "intensity" (0.0 = light task, 1.0 = heavy task)
  intensity < 0.3 -> working_light (casual typing, relaxed posture)
  intensity 0.3-0.7 -> working_normal (focused typing, standard posture)
  intensity > 0.7 -> working_intense (fast typing, leaning forward, occasional head shake)
Blend mode: linear interpolation with 300ms smoothing
```

**Error Blend Tree**
```
BlendTree: "ErrorBlend"
Input: "severity" (0.0 = warning, 1.0 = fatal)
  severity < 0.3 -> error_warning (yellow tint, small shake, concerned expression)
  severity 0.3-0.7 -> error_standard (red flash, medium shake, distressed expression)
  severity > 0.7 -> error_critical (intense red pulse, violent shake, panic gesture, crack on border)
Blend mode: linear interpolation with 150ms smoothing
```

### 2.5 Input Parameters

Every Rive state machine exposes these runtime-controllable inputs:

| Input Name | Type | Range | Default | Driven By |
|---|---|---|---|---|
| `speed` | Number | 0.25 -- 2.0 | 1.0 | Replay playback speed; LOD; user preference |
| `intensity` | Number | 0.0 -- 1.0 | 0.5 | Task complexity score from SDK event `data.priority` |
| `energy` | Number | 0.0 -- 1.0 | 1.0 | Computed from idle duration: `1.0 - (idle_ms / 300000)` clamped to [0, 1] |
| `mood` | Number | 0.0 -- 1.0 | 0.7 | Recent success rate: `successes / (successes + failures)` over last 20 tasks |
| `tier` | Number | 1 -- 6 | 1 | Agent level tier (Starter=1, Standard=2, Advanced=3, Elite=4, Master=5, Legendary=6) |
| `severity` | Number | 0.0 -- 1.0 | 0.0 | Error severity from SDK event: warning=0.2, error=0.6, fatal=1.0 |
| `task_assigned` | Boolean | -- | false | Trigger: set to true when `agent.task.started` fires |
| `context_loaded` | Boolean | -- | false | Trigger: set to true when `agent.thinking.started` fires |
| `tool_called` | Boolean | -- | false | Trigger: set to true when `agent.tool.called` fires |
| `message_sent` | Boolean | -- | false | Trigger: set to true when `agent.message.sent` fires |
| `tool_error` | Boolean | -- | false | Trigger: set to true when `agent.tool.error` fires |
| `all_tasks_done` | Boolean | -- | false | Trigger: set to true when `agent.task.completed` with no remaining tasks |
| `level_up` | Boolean | -- | false | Trigger: set to true when XP crosses level threshold |
| `achievement_earned` | Boolean | -- | false | Trigger: set to true when any achievement unlocks |

### 2.6 File Organization

```
src/assets/rive/
├── agents/
│   ├── agent_starter.riv          # Tier 1: Levels 1-5, simple geometric avatar
│   ├── agent_standard.riv         # Tier 2: Levels 6-14, rounded character with face
│   ├── agent_advanced.riv         # Tier 3: Levels 15-24, detailed character + accessories
│   ├── agent_elite.riv            # Tier 4: Levels 25-34, unique silhouette + particle trail
│   ├── agent_master.riv           # Tier 5: Levels 35-44, environmental effects
│   └── agent_legendary.riv        # Tier 6: Levels 45-50, full aura + crown
├── effects/
│   ├── celebration_confetti.riv   # Confetti burst for achievements
│   ├── celebration_firework.riv   # Firework pop variant
│   ├── celebration_shockwave.riv  # Shockwave ring variant
│   ├── levelup_glow.riv           # Level-up glow + size pulse
│   ├── xp_float.riv               # Floating "+50 XP" text
│   ├── badge_unlock.riv           # Badge fly-in animation
│   └── error_crack.riv            # Border crack effect for critical errors
├── ui/
│   ├── loading_spinner.riv        # App-level loading indicator
│   ├── status_ring.riv            # Health ring around agent (green/amber/red/grey)
│   └── progress_ring.riv          # Task progress ring that fills during execution
└── shared/
    ├── thought_bubble.riv         # Thought bubble with animated dots
    ├── speech_bubble.riv          # Speech bubble with animated text lines
    ├── zzz_bubble.riv             # Sleep bubbles
    └── tool_icons.riv             # Animated tool icons (search, code, file, api)
```

Each `.riv` file contains the full state machine for its purpose. The agent tier files each contain all animation states (idle, working, thinking, communicating, error, celebrating, etc.) with the blend trees defined in Section 2.4. When an agent levels up from one tier to another, the frontend swaps the `.riv` file and plays the `levelup_glow.riv` overlay effect during the transition.

**File Size Budget:**
| File | Target Size | Max Size |
|---|---|---|
| Agent tier .riv (each) | 30KB | 50KB |
| Effect .riv (each) | 10KB | 20KB |
| UI .riv (each) | 5KB | 10KB |
| Shared .riv (each) | 8KB | 15KB |
| **Total Rive bundle** | **~250KB** | **400KB** |

---

## 3. Agent Character Animations

### 3.1 Idle

The idle state is what the user sees most often. It must convey "alive but not working" through subtle, organic motion that does not demand attention.

**Animation Variants (6 total, randomly cycled):**

| Variant | Description | Duration | Easing |
|---|---|---|---|
| `idle_breathe` | Chest expands/contracts by 2% scale, shoulders rise 1px | 3000ms per cycle | `ease-in-out-sine` |
| `idle_blink` | Eyes close and reopen with 80ms hold | 200ms total, fires every 3-7s (random interval) | `ease-in-quad` close, `ease-out-quad` open |
| `idle_look_around` | Eyes shift left 4px, hold 800ms, shift right 4px, hold 800ms, return center | 2800ms total, fires every 15-30s | `ease-in-out-cubic` |
| `idle_fidget_1` | Small weight shift: body tilts 2deg left then returns | 1500ms, fires every 20-45s | `ease-in-out-sine` |
| `idle_fidget_2` | Arm scratch gesture: one arm reaches to opposite shoulder | 1800ms, fires every 30-60s | `ease-in-out-quad` |
| `idle_stretch` | Arms raise overhead, slight arch, return to rest | 2200ms, fires every 45-90s | `ease-in-out-cubic` |

**Loop Behavior:** `idle_breathe` loops continuously. `idle_blink` fires on a random timer (Poisson distribution, mean 5s). Fidgets and look-arounds fire on independent random timers and are queued so they never overlap. Only one secondary animation plays at a time; if a fidget is queued while another is active, it waits.

**Blend Tree Integration:** The `energy` input controls which idle sub-variant dominates. Low energy: slower breathing, droopy eyelids, no fidgets. High energy: quicker breathing, alert eyes, more frequent look-arounds.

**Per-Tier Differences:**
- Tier 1 (Starter): `idle_breathe` and `idle_blink` only; no fidgets (simple geometric shape has no arms)
- Tier 2 (Standard): All 6 variants
- Tier 3+ (Advanced, Elite, Master, Legendary): All 6 variants plus tier-specific ambient effects (particle trail for Elite, orbiting icons for Master, aura pulse for Legendary)

---

### 3.2 Working

The working state communicates active task execution. The animation must feel productive and focused.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `working_typing` | Hands move rapidly over a keyboard silhouette, keys light up | 600ms per cycle | `linear` | Continuous loop |
| `working_document` | Papers shuffle in front of agent, pages flip | 2000ms per cycle | `ease-in-out-sine` | Continuous loop |
| `working_focused` | Body leans forward 3deg, brow furrows, occasional head nod | 4000ms per cycle | `ease-in-out-quad` | Continuous loop |

**Variant Selection:** The variant is chosen based on the tool being called:
- `web_search`, `file_read`, `code_execute` -> `working_typing`
- `document_parse`, `data_extract` -> `working_document`
- Default / unknown tool -> `working_focused`

**Progress Ring:** A circular progress indicator renders around the agent avatar during the working state. It fills clockwise from 0% to 100% over the estimated task duration. If the task takes longer than estimated, the ring pulses amber at 100%. The ring uses `status_ring.riv`.

**Data Stream Particles:** Small data particles (2x2px squares) flow inward toward the agent from the edges of its bounding box. Color matches the agent's health ring color. Rate: 3 particles/second at intensity=0.5, 8 particles/second at intensity=1.0.

---

### 3.3 Thinking

The thinking state represents LLM inference in flight. The user must be able to distinguish "agent is thinking" from "agent is idle" at a glance.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `thinking_bubble` | Thought bubble appears above avatar with 3 dots cycling (dot 1 grows, dot 2 grows, dot 3 grows, all shrink) | 1200ms per cycle | `ease-in-out-cubic` per dot | Continuous loop |
| `thinking_head_tilt` | Head tilts 8deg to one side, holds, returns, tilts to other side | 3000ms per cycle | `ease-in-out-sine` | Continuous loop |
| `thinking_chin_scratch` | Hand reaches to chin, taps twice, returns | 2000ms per fire | `ease-in-out-quad` | Fires every 5-10s |

**All three variants run simultaneously** (they animate different body parts and do not conflict).

**Pulsing Glow:** A soft blue glow (rgba(59, 130, 246, 0.3)) pulses around the avatar at 2000ms per cycle, scaling between 100% and 115% opacity. Uses the `ease-in-out-sine` curve.

**Tier Differences:**
- Tier 1: Thought bubble dots only (no body animation on geometric shapes)
- Tier 2-3: Bubble + head tilt
- Tier 4+: Bubble + head tilt + chin scratch + orbiting brain particle effect

---

### 3.4 Communicating

The communicating state shows inter-agent interaction. It must clearly indicate both the sender and receiver.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `comm_speech_bubble` | Speech bubble appears with 2-3 animated text lines that fill left-to-right | 1500ms per cycle | `ease-out-quad` per line | Continuous loop |
| `comm_turn_toward` | Agent body rotates up to 30deg toward the target agent's position on canvas | 500ms | `ease-out-cubic` | One-shot on state entry |
| `comm_data_beam` | A dashed line connects sender to receiver, dashes animate in the direction of data flow | Continuous | `linear` dash offset animation at 60px/s | Continuous until communication ends |

**Connection Line:** The dashed line between communicating agents is drawn on the PixiJS layer (not Rive). It uses the particle system (Section 7) for data-flow particles that travel along the line. Line color indicates message type:
- Task assignment: `#3b82f6` (blue)
- Handoff: `#8b5cf6` (purple)
- Response: `#10b981` (green)
- Error escalation: `#ef4444` (red)

**Lean Effect:** Both sender and receiver agents subtly lean toward each other by 3deg during active communication. This is driven by a Rive input `comm_angle` (Number, -30 to 30).

---

### 3.5 Error

The error state must immediately grab attention. It is the highest-priority visual signal in the system.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `error_red_flash` | Avatar border flashes from current color to `#ef4444` (red) | 300ms on, 200ms off | `ease-in-out-quad` | 3 cycles then continuous glow |
| `error_shake` | Avatar shakes horizontally: -4px, +4px, -3px, +3px, -2px, +2px, 0 | 500ms | `ease-out-cubic` (decaying) | One-shot on state entry, repeats every 5s while in error |
| `error_distress` | Arms raise in alarm gesture, eyes widen, mouth opens | 400ms | `ease-out-back` | One-shot on state entry |
| `error_exclamation` | Red exclamation triangle icon (20x20px) appears above avatar with a bounce-in | 300ms appear | `ease-out-bounce` | Persistent while in error state |

**Severity Blend:** The `severity` input controls animation intensity:
- `severity < 0.3` (warning): Yellow flash instead of red, gentle shake (-2px/+2px), small exclamation icon (12x12px)
- `severity 0.3-0.7` (error): Standard red flash, medium shake, standard icon
- `severity > 0.7` (fatal): Intense red pulse, violent shake with screen-shake on canvas (2px offset), border crack overlay from `error_crack.riv`, large exclamation icon (24x24px)

---

### 3.6 Overloaded

The overloaded state fires when an agent's task queue exceeds its capacity threshold.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `overloaded_sweat` | Animated sweat drops (2-3 droplets) appear on the agent's forehead and fall, dissipating at chin level | 1500ms per drop cycle | `ease-in-quad` (accelerating fall) | Continuous loop |
| `overloaded_frantic` | Working animation plays at 1.5x speed with occasional head-turn to look at growing stack | Continuous | `linear` at 1.5x speed | Continuous loop |
| `overloaded_stack` | A stack of paper/task icons accumulates beside the agent, growing from 1 to 5 items based on queue depth | 800ms per item appear | `ease-out-back` (pop-in) | Items appear as queue grows, remove as queue shrinks |

**Transition In:** From any working/thinking state. Triggered when `queue_depth > agent_capacity_threshold`. Default capacity threshold: 5 queued tasks.

**Transition Out:** Back to thinking when `queue_depth <= agent_capacity_threshold`. Paper stack animates out in reverse (top item first, 400ms each, `ease-in-quad`).

---

### 3.7 Sleeping / Idle Timeout

After 5 minutes (300,000ms) of continuous idle, the agent transitions to sleeping.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `sleep_zzz` | Three "Z" letters float upward in sequence from the agent's head, each larger than the last, fading out at 30px above | 2500ms per ZZZ cycle | `ease-out-sine` (float up), `ease-in-quad` (fade out) | Continuous loop |
| `sleep_slump` | Agent posture slumps: head tilts forward 15deg, arms drop, body sinks 3px | 1500ms transition | `ease-in-out-sine` | One-shot on entry, holds pose |
| `sleep_breathe` | Slower, deeper breathing than idle: 4000ms per cycle (vs. idle's 3000ms), 3% scale change (vs. idle's 2%) | 4000ms per cycle | `ease-in-out-sine` | Continuous loop |

**Wake Transition:** When a task is assigned (`task_assigned` trigger), the agent plays a wake-up animation: eyes snap open (100ms), body straightens (400ms, `ease-out-back`), ZZZ bubbles pop (each pops in 100ms stagger), then transitions to Initializing.

---

### 3.8 Celebrating

Celebrating plays on achievement unlock or task completion streaks.

**Animation Variants:**

| Variant | Description | Duration | Easing | Loop |
|---|---|---|---|---|
| `celebrate_confetti` | Confetti burst of 30 particles from the agent's center, spreading in a 120deg upward cone, gravity-affected fall | 2000ms | Particles: `ease-out-quad` (launch), `ease-in-quad` (fall) | One-shot |
| `celebrate_fist_pump` | Arm raises overhead in a fist pump gesture, body bounces 4px upward | 800ms | `ease-out-back` (overshoot on raise) | One-shot |
| `celebrate_sparkle` | 5-8 sparkle stars appear around the agent at random positions, scale from 0 to 100% to 0 | 1200ms total, staggered 100ms apart | `ease-out-cubic` (grow), `ease-in-cubic` (shrink) | One-shot |

**Sequencing:** On achievement unlock:
1. `celebrate_fist_pump` starts at t=0
2. `celebrate_confetti` starts at t=200ms
3. `celebrate_sparkle` starts at t=400ms
4. All complete by t=2000ms
5. Agent returns to previous state

**Rarity Scaling:** Achievement rarity controls celebration intensity:
- Common: No celebration animation (activity feed post only, per Gamification System Design Section 3.3)
- Uncommon: `celebrate_sparkle` only (1200ms)
- Rare: `celebrate_sparkle` + `celebrate_fist_pump` (1500ms)
- Epic: All three variants + particle burst from `celebration_confetti.riv` (2000ms)
- Legendary: All three variants + full-screen golden flash overlay + extended confetti (3000ms)

---

### 3.9 Leveling Up

Level-up is a high-visibility event that rewards the user for optimization work.

**Animation Sequence (3000ms total):**

| Time | Effect | Description | Easing |
|---|---|---|---|
| 0ms | Glow onset | Agent border begins glowing with level-tier color (bronze/silver/gold/platinum/diamond/prismatic) at 0% opacity, ramps to 80% | `ease-in-quad` over 500ms |
| 200ms | Size pulse start | Agent scales from 100% to 120% | `ease-out-cubic` over 400ms |
| 600ms | Size pulse return | Agent scales from 120% back to 105% (slightly larger than before -- tier upgrade) | `ease-in-out-sine` over 300ms |
| 300ms | Particle burst | 40 particles explode outward from agent center in a 360deg ring, colored in tier color | Particles: radial velocity with `ease-out-expo` deceleration over 1500ms |
| 500ms | Level number | Floating text "Level N" appears above agent, drifts upward 20px, fades out | `ease-out-quad` drift, `ease-in-quad` fade over 2000ms |
| 800ms | Badge appear | New level badge icon slides in from below the avatar with bounce | `ease-out-bounce` over 600ms |
| 1200ms | XP bar fill | XP progress bar resets to 0 and begins filling toward next level threshold | `ease-out-cubic` over 1000ms |
| 2500ms | Glow fade | Border glow fades from 80% to resting intensity (varies by tier) | `ease-out-sine` over 500ms |
| 3000ms | Complete | Agent returns to previous state with updated tier visuals |  |

**Tier Transition:** If the level-up crosses a tier boundary (e.g., Level 5 to Level 6 = Starter to Standard), the entire avatar model swaps during the glow peak (at t=400ms when glow is brightest and size is largest, masking the swap). The old `.riv` file fades out and the new one fades in within a single frame at peak glow.

---

### 3.10 Terminated

The terminated state is final. The agent is being removed from the active workspace.

**Animation Sequence (1500ms total):**

| Time | Effect | Description | Easing |
|---|---|---|---|
| 0ms | Freeze | All current animations halt instantly | -- |
| 0ms | Desaturate | Avatar color transitions to greyscale over 400ms | `ease-in-quad` |
| 200ms | Ghost trail | A translucent copy (30% opacity) of the avatar separates upward by 10px, creating a "soul leaving body" effect | `ease-out-sine` over 800ms |
| 400ms | Fade begin | Main avatar opacity begins decreasing from 100% to 0% | `ease-in-quad` over 1000ms |
| 800ms | Shrink | Avatar scales from 100% to 60% | `ease-in-cubic` over 700ms |
| 1200ms | Ghost fade | Ghost trail fades from 30% to 0% opacity | `ease-in-quad` over 300ms |
| 1500ms | Remove | Avatar DOM/Canvas node removed | -- |

**Sound:** A soft descending tone (see Section 10) plays at t=0.

---

## 4. UI Micro-Animations

All UI animations use GSAP (GreenSock Animation Platform) via the React integration (`@gsap/react`). These run in the DOM layer, separate from the PixiJS canvas.

### 4.1 Page Transitions

| Transition | Animation | Duration | Easing |
|---|---|---|---|
| **Forward navigation** (e.g., Dashboard to Traces) | Current page slides left and fades out; new page slides in from right and fades in | 350ms | `power2.out` (GSAP equivalent of `ease-out-quad`) |
| **Back navigation** | Current page slides right and fades out; new page slides in from left and fades in | 350ms | `power2.out` |
| **Tab switch** (same-page) | Current content fades out (150ms), new content fades in (200ms) with 8px upward slide | 350ms total (150ms out + 200ms in) | `power1.out` |
| **First load** | Page content fades in from 0% opacity with 16px upward slide | 400ms | `power2.out` |

**Implementation Pattern:**
```
gsap.fromTo(enteringPage,
  { opacity: 0, x: direction === 'forward' ? 40 : -40 },
  { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
)
gsap.fromTo(exitingPage,
  { opacity: 1, x: 0 },
  { opacity: 0, x: direction === 'forward' ? -40 : 40, duration: 0.35, ease: 'power2.in' }
)
```

### 4.2 Panel Open/Close

| Panel Type | Open Animation | Close Animation | Duration | Easing |
|---|---|---|---|---|
| **Sidebar (left)** | Slides in from left (-280px to 0px) + content fades in from 0% to 100% | Slides out to left (0px to -280px) + content fades out | 300ms | Open: `power3.out`; Close: `power2.in` |
| **Detail panel (right)** | Slides in from right (+400px to 0px) + content fades in | Slides out to right (0px to +400px) + content fades out | 300ms | Open: `power3.out`; Close: `power2.in` |
| **Bottom panel** | Slides up from bottom (+300px to 0px) + content fades in | Slides down (0px to +300px) + content fades out | 250ms | Open: `power2.out`; Close: `power2.in` |
| **Overlay backdrop** | Opacity 0% to 40% (black) | Opacity 40% to 0% | 200ms | `linear` |

**Content Stagger:** When a panel opens, its internal elements (title, stats, charts) stagger in with 50ms delay between each, using `power2.out` with 8px upward slide. This creates a cascading reveal that feels purposeful.

### 4.3 Button States

| State | Property | From | To | Duration | Easing |
|---|---|---|---|---|---|
| **Hover enter** | scale | 1.0 | 1.02 | 150ms | `power1.out` |
| **Hover enter** | background-color | `--btn-bg` | `--btn-bg-hover` | 150ms | `linear` |
| **Hover exit** | scale | 1.02 | 1.0 | 200ms | `power1.out` |
| **Press (mousedown)** | scale | 1.02 | 0.97 | 80ms | `power2.in` |
| **Release (mouseup)** | scale | 0.97 | 1.0 | 150ms | `back.out(1.7)` (slight overshoot) |
| **Loading** | -- | -- | Spinner icon rotates, button text fades to 50% opacity | 150ms transition, spinner loops at 800ms/rotation | `linear` rotation |
| **Success** | background-color | current | `#10b981` (green) | 200ms | `power1.out` |
| **Success** | content | current | Checkmark icon replaces text | 200ms | `power1.out` scale-in |
| **Error** | -- | -- | Button shakes (-3px, +3px, -2px, +2px, 0) + border flash red | 400ms shake | `power2.out` (decaying) |

### 4.4 Toggle/Switch Animations

| Property | Animation | Duration | Easing |
|---|---|---|---|
| Thumb position | Slides from left (4px) to right (calc(100% - 4px - thumbWidth)) or reverse | 200ms | `back.out(1.4)` (slight overshoot bounce) |
| Track color | Cross-fades between off-color (`#d1d5db`) and on-color (`#3b82f6`) | 200ms | `linear` |
| Thumb scale | On press: scales to 1.1. On release: scales to 1.0 | 100ms press, 150ms release | Press: `power1.in`; Release: `back.out(1.2)` |

### 4.5 Tooltip Appear/Disappear

| Property | Appear | Disappear |
|---|---|---|
| Opacity | 0 to 1 | 1 to 0 |
| Transform | `translateY(4px)` to `translateY(0)` | `translateY(0)` to `translateY(4px)` |
| Scale | 0.95 to 1.0 | 1.0 to 0.95 |
| Duration | 150ms | 100ms |
| Easing | `power2.out` | `power1.in` |
| Delay | 400ms hover delay before appear | No delay on mouse leave |

**Pointer Arrow:** The tooltip arrow (CSS triangle) appears simultaneously with the body. No separate animation.

### 4.6 Modal Entrance/Exit

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Backdrop appear** | Opacity 0% to 50% (black) | 200ms | `power1.out` |
| **Modal entrance** | Scale from 0.9 to 1.0 + opacity 0% to 100% + translateY from 20px to 0 | 300ms | `back.out(1.5)` |
| **Modal exit** | Scale from 1.0 to 0.95 + opacity 100% to 0% + translateY from 0 to 10px | 200ms | `power2.in` |
| **Backdrop disappear** | Opacity 50% to 0% | 150ms (starts when modal exit begins) | `power1.in` |

**Focus Trap:** Modal entrance triggers focus trap activation at the end of the entrance animation (t=300ms). The first focusable element receives focus.

### 4.7 Tab Switching

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Active indicator slide** | Underline bar slides from previous tab position to new tab position (transforms `translateX` and `width`) | 250ms | `power3.out` |
| **Previous content exit** | Opacity 100% to 0% | 150ms | `power1.in` |
| **New content enter** | Opacity 0% to 100% + translateY from 8px to 0 | 200ms (starts at t=100ms, overlapping exit by 50ms) | `power2.out` |

**Direction Awareness:** If switching to a tab to the right, new content slides in from right (translateX: 16px to 0). If switching left, from left (translateX: -16px to 0).

### 4.8 List Item Enter/Exit (Staggered)

| Action | Animation | Per-item Duration | Stagger Delay | Easing |
|---|---|---|---|---|
| **Initial load** | Opacity 0 to 1 + translateY 12px to 0 | 300ms | 40ms between items (max 15 items animated; rest appear instantly) | `power2.out` |
| **New item prepend** (e.g., new alert) | Slides in from top: translateY from -20px to 0 + opacity 0 to 1; existing items slide down by item height | 300ms | -- | `power3.out` |
| **Item remove** | Opacity 1 to 0 + scale 1.0 to 0.95 + height collapses to 0 | 250ms (200ms fade/scale + 150ms height collapse starting at t=100ms) | -- | `power2.in` (fade), `power2.inOut` (height) |
| **Reorder** (e.g., leaderboard position change) | Items animate to new Y positions via translateY | 400ms | -- | `power3.out` |

**Performance Cap:** Stagger animations cap at 15 items. Item 16+ appear instantly. This prevents long lists from creating a 2-second waterfall of animations.

### 4.9 Skeleton Loading Shimmer

| Property | Value |
|---|---|
| Background | Linear gradient: `#e5e7eb` (0%), `#f3f4f6` (50%), `#e5e7eb` (100%) |
| Animation | `background-position` translates from -200% to 200% of element width |
| Duration | 1500ms per cycle |
| Easing | `linear` |
| Loop | Infinite until content loads |
| Border radius | Matches the element it replaces (8px for cards, 4px for text lines, 50% for avatars) |

**Content Swap:** When real content loads, the skeleton fades out (opacity 1 to 0, 200ms, `power1.in`) and real content fades in (opacity 0 to 1, 300ms, `power2.out`). The swap is cross-faded with 100ms overlap.

### 4.10 Progress Bar Fill Animations

| Variant | Description | Duration | Easing |
|---|---|---|---|
| **Determinate fill** | Width animates from current % to target % | 500ms | `power2.out` |
| **Indeterminate** | A 30%-width highlight slides left to right across the bar continuously | 1200ms per cycle | `ease-in-out-sine` (via CSS) |
| **Success completion** | Bar fills to 100%, flashes green (`#10b981`) once, then fades to resting state | 300ms fill + 200ms flash + 300ms fade | Fill: `power2.out`; Flash: `linear`; Fade: `power1.out` |
| **Error halt** | Bar stops at current position, flashes red once, shows error stripe pattern | 200ms flash | `linear` |

---

## 5. Data Visualization Animations

All chart animations use GSAP for orchestration. Charts are rendered with a D3.js + SVG approach or PixiJS for high-frequency updates.

### 5.1 Chart Data Entry (Points Animate In)

**Line/Area Charts:**
| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Path draw | SVG path `stroke-dashoffset` animates from total length to 0 (line draws left to right) | 800ms | `power2.out` |
| Area fill | Area below line fades in from 0% to target opacity | 600ms (starts at t=200ms) | `power1.out` |
| Data points | Each circle scales from 0 to 1 | 200ms per point | `back.out(1.5)` |
| Point stagger | Points appear left to right | 30ms between points | -- |

**Bar Charts:**
| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Bar grow | Each bar height animates from 0 to target height (bottom-anchored) | 500ms | `power3.out` |
| Bar stagger | Bars appear left to right | 40ms between bars | -- |
| Value label | Number fades in above bar at animation end | 200ms | `power1.out` |

**Scatter Plots:**
| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Point pop-in | Each point scales from 0 to 1 with a slight bounce | 250ms | `back.out(2.0)` |
| Stagger | Points appear in data order | 20ms between points (capped at 100 animated points) | -- |

### 5.2 Real-Time Chart Updates

For live-updating charts (token burn rate, cost accumulation, active task count):

| Behavior | Implementation | Duration | Easing |
|---|---|---|---|
| **New data point** | Line path morphs smoothly to include new point; viewport scrolls right if needed | 300ms | `power1.out` |
| **Y-axis rescale** | Axis labels and gridlines animate to new positions; data re-plots to new scale | 500ms | `power2.inOut` |
| **Data point exit** (scrolled off left edge) | Point and corresponding path segment fade out over 200ms as they exit the viewport | 200ms | `power1.in` |

**Interpolation:** New data points are not instantly plotted. The line interpolates from the last known value to the new value over 300ms, creating smooth motion instead of jagged jumps. This uses GSAP's `gsap.to()` on the SVG path data.

**Buffering:** Data arriving faster than 60fps is batched and interpolated. The chart updates at most once per animation frame (16.6ms). If 5 data points arrive in a single frame, the chart interpolates to the latest value.

### 5.3 Metric Counter Animations (Number Roll-Up)

When a metric value changes (e.g., token count, cost, task count), the number animates from old value to new value.

| Property | Value |
|---|---|
| Animation type | Counting number: digits roll from old to new value |
| Duration | Proportional to change magnitude: `min(1000, max(300, abs(newVal - oldVal) / maxVal * 1000))` ms |
| Easing | `power2.out` (fast start, gentle landing) |
| Decimal handling | For currency (cost): always 2 decimal places, digits roll independently. For integers (token count): no decimals, comma separators update in-place |
| Color flash | If value increased: brief green flash (200ms). If decreased: brief red flash (200ms). Neutral: no flash |
| Format | Numbers > 999 use comma separators. Numbers > 99,999 switch to "100K" abbreviated format |

**Implementation:** Use GSAP `gsap.to()` targeting a proxy object `{ value: oldVal }` and updating the DOM text on each frame via `onUpdate`. This avoids DOM thrashing.

### 5.4 Sparkline Drawing Animation

Sparklines appear in agent detail panels, leaderboard entries, and dashboard cards.

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Line draw | `stroke-dashoffset` from full length to 0 | 600ms | `power2.out` |
| Gradient fill | Below-line area fades in | 400ms (starts at t=200ms) | `power1.out` |
| End dot | Final data point circle scales from 0 to 1 | 200ms (starts at t=400ms) | `back.out(1.5)` |

**Live Update:** When a new data point arrives, the sparkline path morphs rightward, the oldest point scrolls off the left edge, and the end dot slides to the new position. Duration: 300ms, easing: `power1.out`.

### 5.5 Pie/Donut Chart Segment Transitions

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Initial render** | Each segment sweeps clockwise from 0deg to its target arc length, starting from 12 o'clock | 800ms total | `power2.out` per segment |
| **Segment stagger** | Segments animate sequentially, largest first | 80ms stagger between segments | -- |
| **Data update** | Segment arcs morph from old angle to new angle simultaneously | 500ms | `power2.inOut` |
| **Hover expand** | Hovered segment radially extends outward by 6px | 200ms | `power2.out` |
| **Center label** | Donut center number counts from old to new value | 500ms (synced with segment transition) | `power2.out` |

---

## 6. Notification Animations

### 6.1 Achievement Unlock

**Full Sequence (2000ms for Epic; shorter for lower rarities):**

| Time | Element | Animation | Duration | Easing |
|---|---|---|---|---|
| 0ms | Backdrop | Screen dims to 80% brightness (overlay opacity 0 to 20%) | 300ms | `power1.out` |
| 100ms | Badge icon | Badge flies in from bottom-right corner of screen to center, scaling from 0.3 to 1.0 | 500ms | `back.out(1.8)` |
| 400ms | Badge settle | Badge bounces slightly: scale 1.0 to 1.05 to 1.0 | 200ms | `power1.inOut` |
| 500ms | Particle burst | 25 particles explode from badge center in a starburst pattern, colors match rarity tier | 1000ms | `power3.out` (velocity), `ease-in-quad` (gravity) |
| 600ms | Title text | Achievement name fades in below badge with 8px upward slide | 300ms | `power2.out` |
| 700ms | Description | Achievement description fades in below title | 200ms | `power2.out` |
| 800ms | Sound cue | Achievement sound plays (see Section 10) | -- | -- |
| 1500ms | Dismiss begin | Entire notification scales to 0.95 and fades out | 500ms | `power2.in` |
| 1800ms | Backdrop clear | Overlay fades to 0% | 200ms | `power1.in` |

**Rarity Particle Colors:**
- Common: `#9ca3af` (grey)
- Uncommon: `#22c55e` (green)
- Rare: `#3b82f6` (blue)
- Epic: `#a855f7` (purple)
- Legendary: `#f59e0b` (gold) + `#fbbf24` (light gold) alternating

**Legendary Override:** Legendary achievements get an extended 3000ms animation with a full-screen golden flash (100% screen overlay at `#f59e0b` opacity 30% for 200ms), double the particles (50), and the badge orbits once before settling.

### 6.2 Level Up

**Full-Screen Sequence (3000ms):**

| Time | Element | Animation | Duration | Easing |
|---|---|---|---|---|
| 0ms | Golden flash | Full-screen overlay flashes `#f59e0b` at 25% opacity | 400ms (200ms in + 200ms out) | `power1.inOut` |
| 100ms | Level number | Large "LEVEL N" text flies up from bottom center, scales from 2.0 to 1.0 | 600ms | `power3.out` |
| 300ms | Previous level | Old level number fades out and slides up | 300ms | `power1.in` |
| 300ms | Number increment | Level number visually counts from (N-1) to N | 400ms | `power2.out` (counting) |
| 500ms | Title reveal | New level title (e.g., "Specialist I") types in character by character below the number | 600ms (50ms per character) | `steps(1)` per character |
| 700ms | Fanfare particles | 40 particles in tier colors burst from behind the level number | 1500ms | `power3.out` (velocity) |
| 800ms | XP bar | XP bar at bottom resets to 0 and fills to new starting position | 800ms | `power2.out` |
| 2000ms | Settle | Number and title scale down to toast-size and slide to top-right corner | 600ms | `power3.inOut` |
| 2600ms | Toast hold | Remains as toast for 3000ms then fades out | 3000ms + 300ms fade | `power1.in` (fade) |

**Tier Boundary Transition:** If the level-up crosses a tier boundary (e.g., Level 14 to 15 = Standard to Advanced), the background flash uses the new tier color instead of gold, and an additional "TIER UP: Advanced" banner appears between the level number and title.

### 6.3 Alert Notification

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Slide in** | Toast slides in from right edge: `translateX(120%)` to `translateX(0)` | 300ms | `power3.out` |
| **Border pulse** | Left border pulses between normal thickness (3px) and thick (5px) 3 times | 1500ms (500ms per pulse) | `power1.inOut` |
| **Icon bounce** | Alert icon (bell/warning) bounces: translateY 0 to -4px to 0 | 400ms, fires once on entry | `power2.out` |
| **Hold** | Toast remains visible | Configurable: 5000ms default (critical: manual dismiss only) | -- |
| **Auto-dismiss** | Toast fades out: opacity 1 to 0 + slides right: translateX 0 to 40px | 300ms | `power2.in` |

**Alert Type Colors:**
- Info: `#3b82f6` (blue) border and icon
- Warning: `#f59e0b` (amber) border and icon
- Error: `#ef4444` (red) border and icon
- Critical: `#dc2626` (dark red) border and icon + red pulse on entire toast background

**Stack Behavior:** Multiple alerts stack vertically with 8px gap. New alerts push existing ones down with a 200ms `power2.out` slide. Max visible: 5 toasts. Overflow enters a queue and appears as existing toasts dismiss.

### 6.4 Error Notification

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Red shake** | Toast shakes horizontally on entry: -6px, +6px, -4px, +4px, -2px, +2px, 0 | 500ms | `power2.out` (decaying amplitude) |
| **Icon bounce** | Error icon (exclamation triangle) bounces vertically: 0, -6px, 0 | 300ms | `power2.out` |
| **Background flash** | Toast background flashes from `#fef2f2` to `#fee2e2` and back | 400ms (200ms each way) | `linear` |
| **Persist** | Error toasts do not auto-dismiss; user must click dismiss or the error must be resolved | -- | -- |

### 6.5 Success Notification

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Checkmark draw-on** | SVG checkmark path draws from start to end via `stroke-dashoffset` | 400ms | `power2.out` |
| **Green circle** | Circle behind checkmark scales from 0 to 1 | 300ms (starts at t=0, so checkmark draws on top of growing circle) | `back.out(1.5)` |
| **Confetti mini** | 10 small confetti particles burst from the checkmark, spreading in 180deg upward arc | 800ms | `power2.out` (launch), `ease-in-quad` (fall) |
| **Text** | Success message fades in beside the checkmark | 200ms (starts at t=300ms) | `power1.out` |
| **Auto-dismiss** | Fade out after 3000ms hold | 300ms | `power2.in` |

---

## 7. Particle Systems

All particle systems run on the PixiJS canvas layer using a custom particle emitter built on `@pixi/particle-emitter` (or a lightweight custom implementation). Particles are GPU-rendered as textured quads.

### 7.1 Data Flow Particles

**Purpose:** Visualize data moving between communicating agents. Direction, speed, and color encode the nature of the communication.

| Property | Value |
|---|---|
| Shape | Small circle (3px radius) with 1px glow |
| Speed | 80-120 px/s along the connection path (bezier curve between agents) |
| Emission rate | 5 particles/second per active connection |
| Lifetime | Determined by path length / speed (typically 1-4 seconds) |
| Color by data type | Task assignment: `#3b82f6` (blue), Handoff: `#8b5cf6` (purple), Response: `#10b981` (green), Error escalation: `#ef4444` (red), Tool result: `#f59e0b` (amber) |
| Size variation | 2-4px radius (random per particle) |
| Opacity | 80% at spawn, fades to 0% over last 20% of lifetime |
| Trail | Each particle leaves a 3-particle trail at 40% opacity, spaced 8px apart |
| Path | Bezier curve from sender bounding box center to receiver bounding box center, with a control point offset 50px perpendicular to the direct line (creating a gentle arc) |

**Bidirectional Communication:** When two agents communicate simultaneously, particles flow in both directions. The paths arc in opposite directions (one curves up, one curves down) to avoid visual collision.

### 7.2 Token Consumption Particles

**Purpose:** Visualize tokens being consumed from the agent's "energy bar" / token budget.

| Property | Value |
|---|---|
| Shape | Tiny square (2x2px), rotated 45deg (diamond shape) |
| Color | Gradient from `#3b82f6` (blue, start) to `#ef4444` (red, as budget depletes) -- color interpolates based on budget_used_pct |
| Emission source | Agent's token budget bar (positioned below avatar) |
| Direction | Flow from the bar upward toward the agent avatar (representing consumption) |
| Speed | 30-50 px/s |
| Emission rate | Proportional to token burn rate: `min(10, tokens_per_second / 100)` particles/second |
| Lifetime | 800ms |
| Size | 2px at spawn, scales to 0px at death |
| Opacity | 100% at spawn, 0% at death |

**Bar Drain Effect:** As particles flow upward from the bar, the bar's fill level visually decreases. When the bar crosses 25% remaining, particles turn amber. When below 10%, particles turn red and emission rate doubles (urgency signal).

### 7.3 Cost Accumulation Particles

**Purpose:** Visualize money being spent as agents execute tasks.

| Property | Value |
|---|---|
| Shape | Tiny coin icon (4x4px sprite) or small spark (2px circle) |
| Color | `#f59e0b` (gold/amber) |
| Emission source | Agent avatar center (on each LLM call completion) |
| Direction | Flow outward toward the cost meter in the dashboard sidebar |
| Path | Arc trajectory: launch upward 10px, then curve toward the cost meter position |
| Speed | 100-150 px/s along the arc |
| Emission count | Proportional to cost: 1 particle per $0.01 spent, capped at 20 particles per event |
| Lifetime | Path duration (typically 500-1500ms depending on distance to meter) |
| Opacity | 100% at spawn, flash to 120% brightness on arrival at meter, then instant remove |
| Arrival effect | When particle reaches cost meter, meter value increments and a tiny "+$0.XX" text floats up 10px and fades (200ms) |

### 7.4 Celebration Particles

**Purpose:** Visual reward for achievements, level-ups, and milestones.

| Variant | Shape | Count | Spread | Colors | Lifetime | Gravity |
|---|---|---|---|---|---|---|
| **Confetti** | Rectangles (4x2px), random rotation | 30 per burst | 120deg upward cone | Random from: `#ef4444`, `#f59e0b`, `#22c55e`, `#3b82f6`, `#a855f7`, `#ec4899` | 2000ms | Yes: 200 px/s^2 downward |
| **Sparkles** | Star shape (5-point, 3px radius) | 8 per burst | 360deg radial | `#f59e0b` (gold) and `#fef3c7` (light gold) | 1200ms | No (fade in place) |
| **Stars** | Star shape (5-point, 5px radius) | 5 per burst | 360deg radial, slower than confetti | `#f59e0b` at 100% opacity | 1500ms | Slight: 50 px/s^2 downward |

**Confetti Physics:**
- Initial velocity: 200-400 px/s upward with -60deg to +60deg spread
- Air resistance: velocity decays by 2% per frame
- Rotation: each piece rotates at 180-720 deg/s (random)
- Tumble: pieces flip along secondary axis, creating the characteristic confetti flutter
- Ground: particles are removed when they exit the screen bounds (no floor collision needed)

### 7.5 Error Particles

**Purpose:** Reinforce the error state with visceral visual feedback.

| Variant | Shape | Count | Behavior | Color | Lifetime |
|---|---|---|---|---|---|
| **Red sparks** | Circle (2px) | 8-12 per error event | Burst outward from agent center at 100-200 px/s, decelerate rapidly | `#ef4444` at 100% to `#991b1b` at 30% | 600ms |
| **Smoke** | Soft circle (8px radius, 20% opacity) | 3-5 per error event | Rise upward at 20-40 px/s, expand from 8px to 16px radius, fade out | `#374151` (dark grey) | 1200ms |

**Smoke** appears only for `severity > 0.5` errors. Red sparks appear for all errors.

### 7.6 Particle Budget and LOD

**Global Particle Budget:**

| Tier | Max Particles on Screen | Condition |
|---|---|---|
| Full fidelity | 500 | Fewer than 50 agents visible |
| Medium fidelity | 300 | 50-100 agents visible |
| Low fidelity | 150 | 100-200 agents visible |
| Minimal | 50 | 200+ agents visible or reduced-motion preference |

**LOD Culling Rules:**
1. Particles belonging to off-screen agents are not emitted (viewport culling)
2. When budget is exceeded, lowest-priority particles are culled first. Priority order (highest to lowest):
   - Error particles (always rendered)
   - Data flow particles between actively communicating agents
   - Cost accumulation particles
   - Token consumption particles
   - Celebration particles
   - Idle ambient particles (background sparkles for high-tier agents)
3. Culled particles are not emitted; existing in-flight particles are allowed to complete their lifetime
4. Particle emission rate is halved when frame time exceeds 20ms (below 50fps)
5. Particle emission is disabled entirely when frame time exceeds 33ms (below 30fps)

**Object Pooling:** All particles are drawn from a pre-allocated pool of 500 particle objects. No runtime allocation. Particles are recycled on death. If the pool is exhausted, the oldest low-priority particle is force-killed to make room.

---

## 8. Transition Specifications (GSAP)

### 8.1 Page-to-Page Transitions

| Route Change | Animation | Duration | Easing |
|---|---|---|---|
| Dashboard to World View | Dashboard panels scale down (1.0 to 0.9) and fade out; World canvas fades in from below (translateY: 20px to 0) | 400ms | Out: `power2.in`; In: `power3.out` |
| World View to Dashboard | World canvas zooms out slightly (scale 1.0 to 0.95) and fades; Dashboard panels slide up and fade in with 50ms stagger | 400ms | Out: `power2.in`; In: `power2.out` |
| Any to Trace Detail | Current view slides left and fades; Trace detail slides in from right | 350ms | `power2.out` |
| Any to Settings | Current view fades out; Settings slides down from top | 300ms | Out: `power1.in`; In: `power3.out` |

### 8.2 View Mode Switches

| Switch | Animation | Duration | Easing |
|---|---|---|---|
| **World View to Dashboard View** | World canvas scales down to a thumbnail (1.0 to 0.15) and slides to top-left corner as a mini-map; Dashboard panels emerge from behind and expand | 500ms | `power3.inOut` |
| **Dashboard View to World View** | Dashboard panels slide down and fade; Mini-map thumbnail scales up (0.15 to 1.0) to fill viewport | 500ms | `power3.inOut` |
| **World View to Trace View** | World canvas blurs (filter: blur 0 to 4px) and dims; Trace timeline slides up from bottom | 400ms | Canvas: `power2.in`; Timeline: `power3.out` |
| **Trace View to World View** | Timeline slides down; Canvas unblurs and brightens | 400ms | Timeline: `power2.in`; Canvas: `power2.out` |

### 8.3 Layout Shifts

| Shift | Animation | Duration | Easing |
|---|---|---|---|
| **Sidebar collapse** | Sidebar width animates from 280px to 0px; main content width expands to fill | 300ms | `power3.inOut` |
| **Sidebar expand** | Sidebar width animates from 0px to 280px; main content adjusts | 300ms | `power3.out` |
| **Panel resize (drag)** | Width/height follows cursor in real-time (no easing during drag); on release, snaps to nearest grid point | Snap: 150ms | `power2.out` |
| **Agent detail panel open** | Right panel slides in (width 0 to 400px); world canvas width compresses | 300ms | `power3.out` |
| **Agent detail panel close** | Right panel slides out; world canvas expands | 250ms | `power2.in` |

### 8.4 Easing Curves

**Standard Easing Tokens (GSAP names):**

| Token Name | GSAP Ease | CSS Equivalent | Use Case |
|---|---|---|---|
| `ease-default` | `power2.out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | General UI transitions, panel open |
| `ease-enter` | `power3.out` | `cubic-bezier(0.165, 0.84, 0.44, 1)` | Elements entering view (strong deceleration) |
| `ease-exit` | `power2.in` | `cubic-bezier(0.55, 0.085, 0.68, 0.53)` | Elements leaving view |
| `ease-move` | `power3.inOut` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | Layout shifts, position changes |
| `ease-bounce` | `back.out(1.7)` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful elements: buttons, badges, toggle |
| `ease-spring` | `elastic.out(1, 0.5)` | N/A (use GSAP only) | Level-up effects, achievement pop-in |
| `ease-dramatic` | `expo.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Full-screen transitions, view mode switches |
| `ease-linear` | `none` | `linear` | Continuous rotations, shimmer, particle movement |

**Custom Spring for Agent Avatar:**
```
gsap.to(avatar, {
  y: targetY,
  duration: 0.6,
  ease: CustomEase.create("agentSpring",
    "M0,0 C0.05,0 0.15,1.12 0.3,1.04 0.45,0.96 0.55,1.02 0.65,1.01 0.75,0.995 0.85,1.005 1,1"
  )
})
```
This produces a natural spring with one overshoot and one undershoot before settling. Used for avatar position changes (drag-drop placement, zone assignment).

---

## 9. Performance Guidelines

### 9.1 Animation Frame Budget

**Target: 60fps (16.6ms per frame)**

| Budget Allocation | Time | Purpose |
|---|---|---|
| Rive render (all agents) | 4ms max | State machine evaluation + Rive canvas draw |
| PixiJS particles | 3ms max | Particle position updates + sprite batch draw |
| GSAP tick | 2ms max | All active tweens evaluation |
| React render | 4ms max | DOM updates for UI animations |
| Compositor | 2ms max | Layer composition, will-change management |
| **Headroom** | **1.6ms** | Buffer for GC pauses, OS scheduling |

**If frame time exceeds 16.6ms for 5 consecutive frames:**
1. Particle emission rate halved
2. Agent idle fidget animations disabled (breathing continues)
3. Data visualization update rate drops from 60fps to 30fps (every other frame)
4. Sparkline draw animations disabled (instant render instead)

**If frame time exceeds 33ms for 3 consecutive frames:**
1. All particles disabled except error particles
2. All agent animations reduced to color-state only (no movement, just color ring)
3. Chart animations disabled
4. Notification animations reduced to instant appear/disappear

### 9.2 GPU vs. CPU Animation Decisions

| Animation Type | Renderer | Reason |
|---|---|---|
| Agent avatar state machines (Rive) | GPU (WebGL via Rive WASM renderer) | Complex vector animations, multiple simultaneous instances |
| PixiJS particles | GPU (WebGL batched sprites) | Hundreds of small sprites, perfect for GPU batch rendering |
| UI micro-animations (panel slide, fade) | GPU (CSS `transform` + `opacity` via GSAP) | These properties are compositor-only, no layout/paint |
| Skeleton shimmer | GPU (CSS `background-position` animation) | Single-property animation, GPU-composited |
| SVG chart draw-on | CPU (SVG `stroke-dashoffset`) | SVG rendering is CPU-bound; keep chart count low (<10 visible) |
| Number roll-up counters | CPU (DOM text updates via GSAP `onUpdate`) | Text content changes require layout; minimize by batching |
| List reorder | GPU (CSS `transform: translateY`) | Position changes via transform avoid layout thrash |

### 9.3 will-change and Transform Optimizations

**Rules:**
1. Apply `will-change: transform, opacity` to any element that will be animated within the next 200ms. Remove it 500ms after the animation completes. Never leave `will-change` permanently on more than 20 elements (GPU memory overhead).
2. All position animations must use `transform: translate()` instead of `top`/`left`/`margin`. This avoids layout recalculation.
3. All size animations must use `transform: scale()` instead of `width`/`height` where pixel-perfect sizing is not required.
4. Opacity animations must use the `opacity` property (compositor-only), never `visibility` or `display` for animated transitions.
5. The PixiJS canvas element gets `will-change: contents` permanently (it is always being drawn to).
6. Sidebar and detail panels use `transform: translateX()` for slide animations, with `overflow: hidden` on the parent to clip content during transition.

### 9.4 Reduced Motion Mode

**Detection:** `window.matchMedia('(prefers-reduced-motion: reduce)')` is checked on app load and on media query change events.

**When Reduced Motion is Active:**

| Standard Animation | Reduced Motion Replacement |
|---|---|
| Agent idle breathing, blinking, fidgets | Static avatar with color-coded status ring only |
| Agent state transition animations | Instant state swap (color change, icon swap) with 200ms crossfade |
| Page transitions (slide + fade) | 200ms crossfade only (no movement) |
| Panel slide open/close | 200ms fade only (no slide) |
| Particle systems (all) | Disabled entirely |
| Celebration effects (confetti, sparkles) | Static badge icon appears for 2000ms, then fades |
| Level-up animation | Toast notification with level number (no full-screen effect) |
| Chart data entry animations | Instant render (no draw-on, no stagger) |
| Number roll-up counters | Instant number swap |
| Skeleton shimmer | Static grey background |
| Button hover/press | Instant color swap (no scale) |
| Notification slide-in | Instant appear with 200ms fade-in |

**User Override:** The Settings page includes a "Motion" toggle with three options:
1. **Full** -- all animations enabled regardless of OS setting
2. **System** (default) -- respects `prefers-reduced-motion`
3. **Minimal** -- reduced motion mode regardless of OS setting
4. **Off** -- all animations disabled; instant state changes everywhere

### 9.5 Mobile Performance Constraints

| Constraint | Desktop | Tablet | Mobile |
|---|---|---|---|
| Max simultaneous Rive instances | 50 | 25 | 10 |
| Particle budget | 500 | 250 | 100 |
| Chart animation | Full | Full | Reduced (instant render for <768px width) |
| Agent idle variants | 6 | 4 | 2 (breathe + blink only) |
| Celebration effects | Full | Medium (halved particle count) | Minimal (sparkles only, no confetti) |
| Skeleton shimmer | 1500ms cycle | 1500ms cycle | Disabled (static grey) |
| Canvas resolution | 1x or 2x DPR | 1x DPR | 1x DPR, max 720p canvas resolution |

**Detection:** Device tier is determined by a startup benchmark (render 100 sprites for 60 frames, measure average frame time). Tier assignment:
- Desktop (avg < 8ms): Full fidelity
- Tablet (avg 8-16ms): Medium fidelity
- Mobile (avg > 16ms): Minimal fidelity

### 9.6 Animation LOD (Distance-Based Quality Reduction)

On the world canvas, agents far from the viewport center receive reduced animation fidelity.

| Distance from Viewport Center | LOD Level | Animation |
|---|---|---|
| 0-50% of viewport | LOD 0 (Full) | All animation variants, full particle effects, blend trees active |
| 50-80% of viewport | LOD 1 (Medium) | Breathing and state color only; no fidgets, no thought bubbles, no particles |
| 80-100% of viewport | LOD 2 (Minimal) | Color-coded status ring only, static avatar |
| Off-screen | LOD 3 (Culled) | Rive instance paused, no rendering, no particle emission |

**LOD Transition:** When an agent crosses an LOD boundary (e.g., user pans the canvas), the transition occurs over 200ms with a crossfade to avoid popping artifacts.

**Zoom LOD:** At zoom levels below 0.5x, all agents render at LOD 2 (too small for animation detail to be visible). At zoom levels below 0.25x, agents render as colored dots only (LOD 3 with a 4px circle fallback).

---

## 10. Sound Design Integration

### 10.1 Audio Philosophy

Sound is opt-in, muted by default. When enabled, sounds serve as secondary confirmation of visual events -- they reinforce, never replace, visual feedback. All sounds are synthesized via Tone.js (no audio file downloads) for minimal bundle impact.

### 10.2 Sound Triggers

| Animation Event | Sound | Tone.js Implementation | Volume (0-1) | Spatial |
|---|---|---|---|---|
| **Achievement unlock (Common)** | None | -- | -- | -- |
| **Achievement unlock (Uncommon)** | Soft chime | `Synth({ oscillator: { type: 'sine' } }).triggerAttackRelease('C5', '0.15')` | 0.15 | No |
| **Achievement unlock (Rare)** | Rising two-tone chime | `Sequence: C5 (0.1s) -> E5 (0.1s)` | 0.25 | No |
| **Achievement unlock (Epic)** | Three-tone ascending fanfare | `Sequence: C5 (0.1s) -> E5 (0.1s) -> G5 (0.15s)` | 0.35 | No |
| **Achievement unlock (Legendary)** | Full ascending arpeggio with reverb | `Sequence: C4 -> E4 -> G4 -> C5 -> E5 (0.08s each) + Reverb(1.5s)` | 0.45 | No |
| **Level up** | Ascending power chord with shimmer | `PolySynth.triggerAttackRelease(['C4','E4','G4'], '0.3') + MetalSynth shimmer` | 0.4 | No |
| **Error (warning)** | Single low tone | `Synth({ type: 'triangle' }).triggerAttackRelease('A3', '0.2')` | 0.2 | Yes (pans toward agent position) |
| **Error (critical)** | Two-tone descending alarm | `Sequence: A4 (0.15s) -> E3 (0.3s) + Distortion(0.3)` | 0.5 | Yes |
| **Agent terminated** | Soft descending tone | `Synth({ type: 'sine' }).triggerAttackRelease('E3', '0.5') + Filter(lowpass, 400Hz)` | 0.2 | Yes |
| **Task completed** | Subtle click/pop | `NoiseSynth.triggerAttackRelease('0.02')` with bandpass filter at 2000Hz | 0.1 | Yes |
| **Loop detection alert** | Repeating pulse (3 beeps) | `Loop: Synth.triggerAttackRelease('A4', '0.08') x3, 200ms interval` | 0.4 | Yes |
| **Cost alert** | Cash register ding | `MetalSynth.triggerAttackRelease('C4', '0.15') + slight reverb` | 0.3 | No |
| **Button click** | Micro-click | `NoiseSynth.triggerAttackRelease('0.01')` with highpass 3000Hz | 0.05 | No |
| **Toggle switch** | Soft toggle | `Synth({ type: 'sine' }).triggerAttackRelease('G5', '0.05')` | 0.08 | No |

### 10.3 Volume Levels

| Category | Default Volume | Range | User Control |
|---|---|---|---|
| **Master** | 0.0 (muted) | 0.0 - 1.0 | Master volume slider in Settings |
| **Notifications** | 0.5 relative to master | 0.0 - 1.0 | Category slider |
| **UI Feedback** | 0.3 relative to master | 0.0 - 1.0 | Category slider |
| **Alerts** | 0.8 relative to master | 0.0 - 1.0 | Category slider |
| **Ambient** | 0.2 relative to master | 0.0 - 1.0 | Category slider |

### 10.4 Spatial Audio

When spatial audio is enabled (opt-in toggle), sounds are panned based on the source agent's position on the canvas relative to the viewport center.

| Agent Position | Pan Value |
|---|---|
| Left edge of viewport | -0.8 (mostly left speaker) |
| Center of viewport | 0.0 (center) |
| Right edge of viewport | +0.8 (mostly right speaker) |

**Implementation:** `Tone.Panner` node with value computed as:
```
panValue = clamp((agentX - viewportCenterX) / (viewportWidth / 2) * 0.8, -0.8, 0.8)
```

Sounds from off-screen agents are suppressed (not panned to extremes).

### 10.5 Sound Budget

- Maximum simultaneous voices: 8 (Tone.js polyphony limit per category)
- Sound queue: if more than 8 sounds trigger in a single frame, lower-priority sounds are dropped (priority: Alert > Notification > UI Feedback > Ambient)
- Minimum interval between same-sound triggers: 100ms (debounce to prevent machine-gun effect from rapid events)
- Total Tone.js bundle: ~45KB gzipped (loaded lazily on first audio enable)

---

## 11. Animation Tokens and Variables

All animation parameters are defined as tokens in a central configuration file (`src/config/animation-tokens.ts`). This ensures consistency across all components and enables runtime theme switching.

### 11.1 Duration Tokens

| Token | Value | Use Case |
|---|---|---|
| `--duration-instant` | 0ms | Reduced motion fallback |
| `--duration-micro` | 80ms | Button press feedback |
| `--duration-fast` | 150ms | Hover states, tooltip appear, toggle |
| `--duration-normal` | 300ms | Panel transitions, page fades, standard UI |
| `--duration-slow` | 500ms | Chart animations, layout shifts |
| `--duration-dramatic` | 1000ms | Level-up effects, full-screen transitions |
| `--duration-epic` | 2000ms | Celebration sequences, achievement unlocks |
| `--duration-legendary` | 3000ms | Legendary achievement, level-up with tier change |

### 11.2 Easing Tokens

| Token | GSAP Value | CSS Value | Use Case |
|---|---|---|---|
| `--ease-default` | `power2.out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | General purpose |
| `--ease-enter` | `power3.out` | `cubic-bezier(0.165, 0.84, 0.44, 1)` | Elements appearing |
| `--ease-exit` | `power2.in` | `cubic-bezier(0.55, 0.085, 0.68, 0.53)` | Elements disappearing |
| `--ease-move` | `power3.inOut` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | Position changes |
| `--ease-bounce` | `back.out(1.7)` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful UI elements |
| `--ease-spring` | `elastic.out(1, 0.5)` | N/A | Celebratory effects |
| `--ease-dramatic` | `expo.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | High-impact transitions |
| `--ease-linear` | `none` | `linear` | Continuous loops |
| `--ease-sine` | `sine.inOut` | `cubic-bezier(0.445, 0.05, 0.55, 0.95)` | Breathing, pulsing |

### 11.3 Color Transition Tokens

| Token | From Color | To Color | Use Case |
|---|---|---|---|
| `--color-state-idle` | `#6b7280` | -- | Idle agent ring |
| `--color-state-thinking` | `#3b82f6` | -- | Thinking glow |
| `--color-state-executing` | `#10b981` | -- | Active execution ring |
| `--color-state-waiting` | `#f59e0b` | -- | Blocked/waiting ring |
| `--color-state-error` | `#ef4444` | -- | Error flash |
| `--color-state-success` | `#22c55e` | -- | Success flash |
| `--color-state-communicating` | `#8b5cf6` | -- | Communication beam |
| `--color-state-overloaded` | `#f97316` | -- | Overload warning |
| `--color-state-sleeping` | `#9ca3af` | -- | Dormant grey |
| `--color-state-terminated` | `#374151` | -- | Terminated/ghost |
| `--color-tier-bronze` | `#CD7F32` | -- | Levels 2-5 |
| `--color-tier-silver` | `#C0C0C0` | -- | Levels 6-14 |
| `--color-tier-gold` | `#FFD700` | -- | Levels 15-24 |
| `--color-tier-platinum` | `#E5E4E2` | -- | Levels 25-34 |
| `--color-tier-diamond` | `#B9F2FF` | -- | Levels 35-44 |
| `--color-tier-prismatic` | gradient cycle of all tier colors at 3000ms/cycle | -- | Levels 45-50 |
| `--color-rarity-common` | `#9ca3af` | -- | Common achievement particles |
| `--color-rarity-uncommon` | `#22c55e` | -- | Uncommon achievement particles |
| `--color-rarity-rare` | `#3b82f6` | -- | Rare achievement particles |
| `--color-rarity-epic` | `#a855f7` | -- | Epic achievement particles |
| `--color-rarity-legendary` | `#f59e0b` | -- | Legendary achievement particles |

**Color Transition Duration:** All state color transitions use `--duration-normal` (300ms) with `--ease-default` (`power2.out`). The exception is error flash, which uses `--duration-fast` (150ms) for urgency.

### 11.4 Scale Tokens

| Token | Value | Use Case |
|---|---|---|
| `--scale-press` | 0.97 | Button press depression |
| `--scale-hover` | 1.02 | Button hover lift |
| `--scale-pop` | 1.05 | Badge appear, toast entrance |
| `--scale-levelup-peak` | 1.20 | Level-up size pulse maximum |
| `--scale-levelup-settle` | 1.05 | Level-up settle (slightly larger due to tier upgrade) |
| `--scale-celebrate` | 1.10 | Celebration fist pump apex |
| `--scale-error-shake` | 1.0 (no scale, only translate) | Error shake is positional only |
| `--scale-modal-enter` | 0.9 to 1.0 | Modal entrance |
| `--scale-modal-exit` | 1.0 to 0.95 | Modal exit |
| `--scale-terminate` | 1.0 to 0.6 | Agent termination shrink |

### 11.5 Particle Tokens

| Token | Value | Use Case |
|---|---|---|
| `--particle-budget-full` | 500 | Max particles at full fidelity |
| `--particle-budget-medium` | 300 | Medium fidelity |
| `--particle-budget-low` | 150 | Low fidelity |
| `--particle-budget-minimal` | 50 | Minimal fidelity |
| `--particle-pool-size` | 500 | Pre-allocated pool size |
| `--particle-confetti-count` | 30 | Standard celebration burst |
| `--particle-confetti-legendary` | 50 | Legendary celebration burst |
| `--particle-sparkle-count` | 8 | Sparkle effect |
| `--particle-levelup-count` | 40 | Level-up burst |
| `--particle-error-spark-count` | 10 | Error spark burst |
| `--particle-dataflow-rate` | 5/s | Data flow particles per second per connection |
| `--particle-gravity` | 200 px/s^2 | Confetti downward acceleration |

### 11.6 Z-Index Tokens (Animation Layers)

| Token | Value | Layer |
|---|---|---|
| `--z-canvas-background` | 0 | World canvas background (zones, grid) |
| `--z-canvas-connections` | 10 | Data flow lines and particles between agents |
| `--z-canvas-agents` | 20 | Agent avatars |
| `--z-canvas-agent-effects` | 30 | Agent particles, glow, thought bubbles |
| `--z-canvas-celebrations` | 40 | Confetti, sparkles, level-up effects |
| `--z-ui-base` | 100 | Dashboard panels, sidebar |
| `--z-ui-floating` | 200 | Tooltips, dropdowns |
| `--z-ui-notification` | 300 | Toast notifications, alerts |
| `--z-ui-modal` | 400 | Modal dialogs + backdrop |
| `--z-ui-celebration-overlay` | 500 | Full-screen celebration (legendary achievement, level-up) |

---

## Appendix A: Animation Decision Matrix

For each new animation, answer these questions before implementation:

| Question | Acceptable Answer |
|---|---|
| What information does this animation communicate? | Must name a specific system state or data change |
| What happens if this animation is removed? | User loses information (acceptable) or user loses nothing (animation should not exist) |
| What is the reduced-motion fallback? | Must have one: instant state swap, crossfade, or static indicator |
| What is the frame budget impact? | Must estimate: <1ms (trivial), 1-3ms (moderate), >3ms (needs LOD) |
| Does this animation scale to 50+ agents? | Must work at scale; if single-instance-only, must be flagged as overlay |
| What triggers this animation? | Must map to a specific SDK event type or user interaction |

---

## Appendix B: Implementation Priority

| Priority | Component | Dependency | Estimated Effort |
|---|---|---|---|
| P0 | Animation tokens + configuration | None | 1 day |
| P0 | Agent state machine (Rive, Tier 1 only) | Rive editor setup | 3 days |
| P0 | Agent state color ring (idle/thinking/executing/error/waiting) | PixiJS canvas | 1 day |
| P0 | Error shake + red flash | Agent state machine | 0.5 day |
| P0 | Page transitions (GSAP) | React router | 1 day |
| P0 | Panel open/close | GSAP | 0.5 day |
| P1 | Data flow particles between agents | PixiJS particle emitter | 2 days |
| P1 | Chart data entry animations | D3 + GSAP | 2 days |
| P1 | Notification slide-in/out | GSAP | 1 day |
| P1 | Skeleton shimmer | CSS | 0.5 day |
| P1 | Number roll-up counters | GSAP | 0.5 day |
| P1 | Agent Tier 2-3 Rive files | Rive editor | 3 days |
| P2 | Celebration particles (confetti, sparkles) | PixiJS particle emitter | 1.5 days |
| P2 | Level-up animation sequence | Rive + GSAP + particles | 2 days |
| P2 | Achievement unlock animation | GSAP + particles | 1.5 days |
| P2 | Sound design (Tone.js) | Tone.js setup | 2 days |
| P2 | Agent Tier 4-6 Rive files | Rive editor | 4 days |
| P3 | Token consumption particles | PixiJS | 1 day |
| P3 | Cost accumulation particles | PixiJS | 1 day |
| P3 | Spatial audio | Tone.js | 1 day |
| P3 | Agent sleeping/overloaded states | Rive | 1 day |
| P3 | Terminated ghost trail | Rive + GSAP | 0.5 day |

**Total estimated effort: ~31 developer-days**

---

*End of Animation Specification. This document is the single source of truth for all motion design decisions in OpenAgentVisualizer. Any animation not specified here must go through the Animation Decision Matrix (Appendix A) before implementation.*
