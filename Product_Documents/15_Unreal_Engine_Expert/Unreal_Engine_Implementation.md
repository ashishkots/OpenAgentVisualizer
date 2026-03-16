# OpenAgentVisualizer -- Unreal Engine 5 Implementation Specification

**Stage:** 7.1 -- Unreal Engine Expert
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Unreal Engine Expert Agent
**Depends On:** PRD (Stage 1.1), Gamification System Design (Stage 1.2), Agent Integration Architecture (Stage 1.3), Visualization Spec (Stage 2.2), Animation Spec (Stage 2.3), System Architecture (Stage 4.1), Design System Spec (Stage 3.3)
**Feeds Into:** Frontend Expert (2.2a), Backend Expert (2.2b), Code Reviewer (2.3), QA Engineer (2.4), DevOps (Convergence)

---

## Table of Contents

1. [Vision & Strategy](#1-vision--strategy)
2. [3D Virtual Office World Design](#2-3d-virtual-office-world-design)
3. [3D Agent Avatar System](#3-3d-agent-avatar-system)
4. [Niagara Particle Systems](#4-niagara-particle-systems)
5. [Real-Time Data Integration](#5-real-time-data-integration)
6. [Camera & Navigation System](#6-camera--navigation-system)
7. [UI System (UMG)](#7-ui-system-umg)
8. [Gamification in 3D](#8-gamification-in-3d)
9. [Performance & Optimization](#9-performance--optimization)
10. [Pixel Streaming (Web Delivery)](#10-pixel-streaming-web-delivery)
11. [VR & XR Support](#11-vr--xr-support)
12. [Build & Deployment](#12-build--deployment)

---

## 1. Vision & Strategy

### 1.1 Why Unreal Engine 5 for Agent Visualization

The web-based PixiJS version of OpenAgentVisualizer delivers a 2D isometric virtual office at 60fps in the browser. It is the correct choice for broad accessibility -- zero install, low hardware bar, works on Chromebooks. But it operates under fundamental constraints: PixiJS is a 2D renderer. The "depth" of the office is faked with layered sprites. Lighting is baked. Particles are CPU-bound sprite emitters. There is no volumetric audio, no true camera freedom, and no path to VR.

Unreal Engine 5 removes every one of these constraints. It transforms the metaphor from "watching an animated dashboard" to "walking through a living workspace." The agent office is no longer a flat illustration -- it is a volumetric space the user inhabits. This distinction matters because the core product thesis is that treating agents as living entities increases engagement, and engagement drives optimization behavior. A 3D environment where you can walk up to an agent's desk, see their screen, hear their keyboard, and watch particles of data flow between them is categorically more immersive than a top-down sprite view.

**Specific UE5 capabilities that unlock new visualization dimensions:**

| UE5 Feature | What It Enables for OAV |
|-------------|------------------------|
| **Lumen** (Global Illumination) | Agent desks glow brighter when active; error states cast red light on walls; idle zones dim naturally. Lighting becomes a data channel without manual light placement. |
| **Nanite** (Virtualized Geometry) | High-detail office environments with millions of polygons render at consistent frame rates. No manual LOD authoring for static environment meshes. |
| **Niagara** (GPU Particle System) | Data flow between agents rendered as thousands of luminous particles traveling along splines. Token consumption visualized as energy draining from an agent's aura. Celebration effects with 50,000+ confetti particles at zero CPU cost. |
| **MetaSounds** | Procedural spatial audio: typing speed maps to agent busyness, error events trigger alarm tones spatialized to the agent's desk, ambient office hum rises with total agent count. |
| **World Partition** | Large-scale deployments (500+ agents) partition the office into streamable sub-levels. Users only load the zones they are viewing. |
| **Chaos Physics** | Papers fly off a desk during an error state. Coffee cups rattle during high-load events. Physical interactions sell the "living office" metaphor. |
| **UMG + Render Targets** | In-world monitors display live Recharts-style graphs rendered to texture. Each agent's desk monitor shows their actual metrics. |
| **OpenXR** | Native VR support. Walk through the office in Quest 3 or Vive. Point at agents with controllers. Grab metrics panels and pin them in 3D space. |

### 1.2 Target Platforms

| Platform | Delivery Method | Minimum Spec | Target FPS |
|----------|----------------|-------------|-----------|
| Windows Desktop | Packaged .exe (installed or portable) | GTX 1070 / Ryzen 5 3600 / 16GB RAM | 60fps @ 1080p |
| macOS Desktop | Packaged .app (Apple Silicon native) | M1 / 16GB unified memory | 60fps @ 1080p |
| Linux Desktop | Packaged binary (Vulkan) | GTX 1070 equivalent / 16GB RAM | 60fps @ 1080p |
| Web (Pixel Streaming) | Browser via WebRTC (no install) | Any modern browser; GPU rendering on cloud | 60fps @ 1080p, <100ms latency |
| VR (Quest 3) | Standalone or Link | Quest 3 hardware | 72fps @ eye resolution |
| VR (PC VR) | SteamVR / OpenXR | GTX 3070+ / 32GB RAM | 90fps @ HMD resolution |

### 1.3 Relationship to the Web Version

The UE5 build is NOT a replacement for the PixiJS web client. They are two rendering frontends for the same backend.

```
                    ┌─────────────────────────────┐
                    │   FastAPI Backend            │
                    │   (REST + WebSocket + OTLP)  │
                    │   Redis Streams / Postgres   │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐  ┌──▼──────────┐  ┌──▼──────────────┐
    │  PixiJS Web Client │  │  UE5 Desktop │  │  UE5 Pixel      │
    │  (Browser, 2D)     │  │  (Native 3D) │  │  Streaming (Web) │
    │  Free Tier         │  │  Pro Tier    │  │  Enterprise Tier  │
    └────────────────────┘  └─────────────┘  └──────────────────┘
```

**Tier mapping:**

- **Free / Starter:** PixiJS web client only. Zero install, runs everywhere.
- **Pro:** UE5 desktop application (Windows/Mac/Linux). Downloaded installer. Full 3D experience with local GPU rendering.
- **Enterprise:** UE5 via Pixel Streaming. Browser-based 3D experience rendered on cloud GPUs. No client install, same 3D fidelity as Pro. Also includes VR mode.

Both clients consume identical WebSocket event streams and REST API endpoints. The UE5 client adds no backend requirements beyond what the web client already uses. The backend is unaware of which client is connected.

### 1.4 UE5 Version and Plugin Requirements

**Engine Version:** Unreal Engine 5.4.x (minimum 5.4.1)

**Required Plugins (built-in):**

| Plugin | Purpose |
|--------|---------|
| `PixelStreaming` | Web delivery via WebRTC |
| `PixelStreamingInfrastructure` | Signalling server and matchmaker |
| `EnhancedInput` | Modern input mapping (keyboard, mouse, gamepad, VR controllers) |
| `CommonUI` | Cross-platform UI framework on top of UMG |
| `MetaSounds` | Procedural audio system |
| `Niagara` | GPU particle system |
| `ChaosPhysics` | Physics simulation for environmental effects |
| `OpenXR` | VR/XR runtime abstraction |
| `Water` | Optional decorative water features in the office (fountain, aquarium) |

**Required Plugins (third-party or custom):**

| Plugin | Purpose | Source |
|--------|---------|--------|
| `WebSocketClient` | WebSocket connectivity to FastAPI backend | Custom C++ module (see Section 5) |
| `JsonBlueprintUtilities` | JSON parsing in Blueprints | Built-in (UE5.4+) |
| `RuntimeDataTable` | Dynamic data tables for agent configuration | Custom C++ module |

---

## 2. 3D Virtual Office World Design

### 2.1 Office Layout Architecture

The virtual office is a single contiguous 3D environment organized into functional zones. Each zone maps directly to the zone system defined in the Visualization Spec (Section 2), but realized as full 3D architectural spaces rather than 2D tile regions.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          FLOOR PLAN — TOP VIEW                           │
│                                                                           │
│  ┌──────────────┐  ┌─────────────────────────────────────┐  ┌─────────┐ │
│  │              │  │                                     │  │         │ │
│  │   LOBBY      │  │          OPEN FLOOR                 │  │ SERVER  │ │
│  │   (Entry +   │  │    (Agent Desks — up to 100)        │  │  ROOM   │ │
│  │   Leaderboard│  │                                     │  │(Infra   │ │
│  │   + Trophy   │  │    4x desk clusters of 25 agents    │  │ Metrics)│ │
│  │    Case)     │  │    Each cluster = one "team"         │  │         │ │
│  │              │  │                                     │  │         │ │
│  └──────┬───────┘  └──────────┬──────────────────────────┘  └────┬────┘ │
│         │                     │                                   │      │
│  ┌──────▼───────┐  ┌─────────▼──────────┐  ┌────────────┐  ┌────▼────┐ │
│  │  MANAGER     │  │  MEETING ROOMS     │  │  BREAK     │  │ ARCHIVE │ │
│  │  OFFICE      │  │  (3x glass-walled) │  │  ROOM      │  │  ROOM   │ │
│  │  (Dashboard  │  │  (Multi-agent task │  │  (Idle     │  │(History │ │
│  │   overview,  │  │   collaboration    │  │   agents,  │  │ + Replay│ │
│  │   controls)  │  │   visualization)   │  │   cooldown)│  │ Engine) │ │
│  └──────────────┘  └────────────────────┘  └────────────┘  └─────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        ROOFTOP TERRACE                             │  │
│  │              (Celebration events, milestone ceremonies)             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Zone Specifications

#### Lobby (Entry Zone)

**Purpose:** First space the user sees. Establishes context and provides global overview.

**3D Elements:**
- Reception desk with a holographic company logo (UMG render target displaying workspace name)
- Floor-to-ceiling digital display showing the team leaderboard (top 10 agents by XP, updated in real-time)
- Trophy case: glass cabinet with 3D trophy meshes for unlocked achievements (see Section 8)
- Agent count display: holographic number above the entrance showing "47 Agents Active"
- Entrance door that opens/closes with agent spawn/terminate events
- Ambient: soft lobby music, distant keyboard sounds from the open floor

**UE5 Implementation:**
- `BP_Lobby` — Blueprint Actor containing all lobby elements
- `WBP_LeaderboardDisplay` — UMG widget rendered to a `UTextureRenderTarget2D` applied to the wall display mesh
- `BP_TrophyCase` — Modular actor with `UInstancedStaticMeshComponent` for trophy slots
- `BP_HolographicCounter` — Niagara system with a number display driven by agent count

#### Open Floor (Primary Agent Workspace)

**Purpose:** Main workspace where agents sit at desks and perform tasks. This is where 80% of the visual activity occurs.

**3D Elements:**
- Desk clusters arranged in pods of 4-6 desks each, grouped by team/role
- Each desk has: monitor mesh (render target showing agent metrics), keyboard, mouse, coffee mug, personal items
- Desk monitors display real agent data via `UMediaTexture` render targets
- Rolling office chairs that swivel when the agent turns to communicate
- Overhead lighting panels that dim/brighten per-cluster based on aggregate activity
- Cable runs on the floor between desks (stylized data cables that glow when data flows)
- Potted plants that grow taller as team XP increases (see Gamification section)
- Whiteboard at each cluster showing team-level metrics

**UE5 Implementation:**
- `BP_AgentDesk` — Blueprint Actor with:
  - `UStaticMeshComponent` for desk geometry
  - `USkeletalMeshComponent` for the agent character (see Section 3)
  - `UWidgetComponent` for the desk monitor (UMG widget showing agent stats)
  - `USpotLightComponent` for desk lamp (color = agent status)
  - `UNiagaraComponent` for desk-level particle effects
- `BP_DeskCluster` — Container actor that spawns and arranges 4-6 `BP_AgentDesk` instances
- `BP_FloorManager` — Level Blueprint logic that manages desk assignment for newly spawned agents
- Desk assignment algorithm: agents are assigned to clusters by `agent.role` tag, then to the first empty desk within that cluster. Overflow agents spawn new clusters dynamically.

#### Meeting Rooms (Collaboration Zones)

**Purpose:** When multiple agents collaborate on a task, their avatars move to a meeting room. Particle effects show data flow between them.

**3D Elements:**
- 3 glass-walled meeting rooms visible from the open floor
- Central conference table with holographic display showing shared task context
- Chairs arranged around the table; agents sit in them during collaboration
- Glass walls allow the user to see inside without entering
- Whiteboard with task breakdown (UMG render target)
- Data flow particles visible through the glass (Niagara spline-based particle trails)

**UE5 Implementation:**
- `BP_MeetingRoom` — Blueprint Actor with:
  - Glass wall material using `M_Glass_Translucent` with Lumen reflections
  - `UWidgetComponent` on the central table hologram
  - Seating slots (array of `FTransform` for agent placement)
  - `OnAgentsEnter` event: agents pathfind to the room, sit down, collaboration particles start
  - `OnAgentsLeave` event: agents return to their desks
- Meeting room capacity: 6 agents maximum. If more are needed, a second room opens.

#### Server Room (Infrastructure Zone)

**Purpose:** Visualizes backend infrastructure health — database load, Redis queue depth, API latency, connection counts.

**3D Elements:**
- Rows of server racks with blinking LED meshes (LED color = health status)
- Cooling fans that spin faster when CPU/load metrics are high (driven by a float parameter)
- Floor-mounted cable bundles connecting racks (glow intensity = throughput)
- Temperature display (holographic thermometer) mapped to system load
- Emergency lighting that activates during outage events
- A "mainframe" central unit with a large holographic display of the system architecture diagram

**UE5 Implementation:**
- `BP_ServerRack` — Instanced mesh actor with dynamic material parameters:
  - `LED_Color` (`FLinearColor`): green/yellow/red based on health
  - `Fan_Speed` (`float`): 0.0 to 1.0 drives fan rotation rate via `RotatingMovement` component
  - `Cable_Glow` (`float`): emissive intensity on cable material
- `BP_ServerRoom` — Contains 8-12 `BP_ServerRack` instances, subscribes to infrastructure metric events

#### Break Room (Idle Zone)

**Purpose:** Agents in idle or cooldown state move here. Visually communicates that they are healthy but not working.

**3D Elements:**
- Couch, coffee table, vending machine, water cooler
- Agents sit on couch, stand at water cooler, or lean against walls
- Television screen showing a "screensaver" with aggregate metrics
- Plants, posters, and casual decor to contrast with the work floor
- Agents in break room have relaxed idle animations (stretching, sipping coffee)

#### Manager Office (Dashboard Zone)

**Purpose:** Dedicated space for the user/manager to view comprehensive dashboards and controls.

**3D Elements:**
- Executive desk with 3 large monitors (each a UMG render target):
  - Monitor 1: Real-time dashboard (agent count, active tasks, error rate, cost burn)
  - Monitor 2: Leaderboard and XP charts
  - Monitor 3: Alert feed and anomaly log
- Wall-mounted displays showing historical trends
- Control panel on the desk (buttons to pause agents, trigger replays, adjust settings)
- Window overlooking the open floor (player can see agents working from here)

#### Archive Room (History/Replay Zone)

**Purpose:** Physical representation of the replay engine. Users "enter" this room to browse and replay historical sessions.

**3D Elements:**
- Filing cabinets (each drawer = one session, labeled with date/time)
- Central holographic timeline that the user can scrub through
- Replay plays out on a miniature holographic office on the central table
- Dim lighting with warm amber tones to convey "looking at the past"

#### Rooftop Terrace (Celebration Zone)

**Purpose:** Special events — milestone celebrations, achievement ceremonies, prestige events.

**3D Elements:**
- Open-air terrace with skybox view
- Stage platform with spotlights
- Confetti and fireworks Niagara systems
- Camera automatically cuts here during major events

### 2.3 Art Style Decision

**Recommended: Stylized Corporate** — A hybrid between low-poly stylized and realistic. Think "Overcooked meets Google Office."

**Rationale:** Pure realism is expensive to produce and enters the uncanny valley for character models. Pure low-poly looks toylike and undermines the "professional tool" positioning. Stylized corporate uses:
- Clean geometric shapes with beveled edges
- PBR materials with slightly exaggerated color saturation
- Soft ambient occlusion via Lumen (no baked lightmaps needed)
- Consistent scale: desks are 1.2m wide, chairs are 0.5m, agents are 1.7m tall
- Color palette derived from the Design System Spec (slate-900 base, blue-500 accent, status colors for agent states)

**Material Master:**

```
M_OAV_Master (Material Instance parent)
├── MI_Wood       — desks, shelves (base color: warm oak, roughness: 0.6)
├── MI_Metal      — server racks, frames (base color: dark grey, metallic: 0.9)
├── MI_Glass      — meeting room walls (translucent, Lumen reflections)
├── MI_Fabric     — chairs, couches (roughness: 0.8, subtle texture)
├── MI_Screen     — all monitors (emissive, fed by render targets)
├── MI_Floor      — carpet tiles (roughness: 0.9, subtle pattern)
├── MI_Agent_Base — agent character base material (see Section 3)
└── MI_Hologram   — holographic displays (additive blend, scanline effect, slight flicker)
```

### 2.4 Level Streaming and World Partition

For deployments with more than 100 agents, the office expands into a multi-floor building using UE5 World Partition.

**Streaming Strategy:**

```cpp
// OAVWorldPartitionStreamingPolicy.h
// Custom streaming policy that loads sub-levels based on camera proximity
// and agent activity (not just distance)

UCLASS()
class AOAVWorldPartitionStreamingPolicy : public AWorldPartitionStreamingPolicy
{
    GENERATED_BODY()
public:
    // Override to factor in agent activity — high-activity zones stream in
    // even if camera is far away (for minimap rendering)
    virtual bool ShouldLoadCell(const FWorldPartitionCell& Cell) const override;

    // Zones with zero agents for > 5 minutes can be unloaded
    UPROPERTY(EditAnywhere)
    float InactiveZoneUnloadDelay = 300.0f; // seconds
};
```

**Floor Layout for Scale:**

| Agent Count | Office Layout |
|------------|--------------|
| 1-50 | Single floor, all zones |
| 51-100 | Single floor, expanded open floor (8 clusters) |
| 101-200 | Two floors connected by elevator/stairs (World Partition sub-levels) |
| 201-500 | Four floors, each with own open floor + meeting rooms; shared lobby/server room |
| 500+ | Campus layout: multiple buildings, outdoor walkways, shuttle system between buildings |

### 2.5 Day/Night Cycle and Weather System

The office environment reflects system state through environmental storytelling.

**Day/Night Cycle:**

The sky outside the office windows follows a configurable cycle. By default, it maps to the real-world clock of the user's timezone. Alternatively, it can be driven by agent activity:

| System State | Time of Day | Lighting |
|-------------|------------|---------|
| Peak activity (>80% agents working) | Midday | Bright, warm sunlight through windows, Lumen GI fills the office |
| Normal activity (30-80%) | Morning/Afternoon | Moderate sunlight, balanced indoor lighting |
| Low activity (<30%) | Evening | Warm sunset tones, desk lamps become primary light sources |
| Near-zero activity | Night | Dark office, only active agent desks are lit, moonlight through windows |

**Implementation:**
- `BP_SkyManager` — Actor controlling `UDirectionalLightComponent` (sun), `USkyAtmosphereComponent`, and `UExponentialHeightFogComponent`
- `SunAngle` parameter (0-360) driven by either system clock or activity metric
- Material parameter collection `MPC_TimeOfDay` feeds all window materials and indoor light intensities

**Weather System:**

Weather is a secondary environmental indicator tied to system health metrics.

| System Health | Weather | Visual Effect |
|--------------|---------|--------------|
| Healthy (error rate < 1%) | Clear skies | Blue sky, sunlight, no particles |
| Warning (error rate 1-5%) | Overcast | Grey clouds, muted lighting, slight fog |
| Degraded (error rate 5-15%) | Rain | Rain Niagara system outside windows, wet window material, thunder audio |
| Critical (error rate > 15%) | Storm | Lightning flashes (directional light pulses), heavy rain, wind sound, office lights flicker |
| Outage (backend disconnected) | Blackout | All exterior light removed, emergency red lighting inside, alarm audio |

**Rain Niagara System (`NS_Weather_Rain`):**
- GPU particle emitter: 10,000 raindrop sprites falling at varying speeds
- Collision module: splashes on window sills and rooftop terrace surfaces
- Audio: `MS_RainAmbient` MetaSound source spatialized to windows
- Performance: weather particles only render in the skybox and window areas, not inside the office

### 2.6 Sound Design

**Audio Engine:** UE5 MetaSounds for procedural audio generation. No pre-baked audio loops.

**Spatial Audio Zones:**

| Zone | Ambient Sound | Dynamic Sounds |
|------|--------------|----------------|
| Open Floor | Soft keyboard clicks (density = active agent count), mouse clicks, paper shuffles | Agent-specific: typing speed scales with task progress; error = alert chime |
| Lobby | Muzak (low volume), footsteps on marble | Door sound on agent spawn/terminate |
| Meeting Rooms | Muffled from outside; clear inside. Conference murmur sound. | Data flow particles have a soft "whoosh" when passing through |
| Server Room | Constant fan hum (pitch = server load), electrical buzz | Alert klaxon on infrastructure warning |
| Break Room | Coffee machine gurgle, vending machine hum, distant chatter | Agent-specific: sigh sound on enter, stretch sound |
| Rooftop | Wind, distant city, birds | Celebration: fireworks pops, confetti rustle, fanfare |

**MetaSound Graph Structure:**

```
MS_OfficeAmbient (MetaSound Source)
├── Input: AgentCount (int) → drives keyboard click density
├── Input: ErrorRate (float) → drives alert tone probability
├── Input: SystemLoad (float) → drives fan hum pitch
├── Output: Spatial audio at each desk position
│
MS_AgentAudio (per-agent MetaSound Source, attached to agent actor)
├── Input: AgentState (enum) → selects audio layer
│   ├── Idle: soft breathing, occasional fidget sound
│   ├── Working: typing (speed = task progress rate)
│   ├── Error: spark/glitch sound, alert chime
│   ├── Celebrating: confetti pop, fanfare sting
│   └── Sleeping: soft snore loop
├── Input: Urgency (float 0-1) → modulates typing speed and volume
├── Output: Mono source, spatialized by UE5 audio engine
```

---

## 3. 3D Agent Avatar System

### 3.1 Character Model Specification

Agent avatars are stylized humanoid characters — approximately 1.7m tall, with slightly oversized heads (1.2x proportional) for readability at distance. They are NOT MetaHumans. MetaHumans are photorealistic, heavy (50MB+ per character), and require facial animation rigs that add no value for agent visualization. Instead, OAV agents use lightweight custom skeletal meshes.

**Mesh Budget per Agent:**

| Component | Triangle Count | Texture Resolution | Memory |
|-----------|---------------|-------------------|--------|
| Body (LOD0) | 4,000 tris | 512x512 (base color + normal + ORM) | ~2MB |
| Body (LOD1) | 1,500 tris | 256x256 | ~0.5MB |
| Body (LOD2) | 500 tris | 128x128 | ~0.15MB |
| Accessories (hat, badge, etc.) | 200-500 tris each | Shared atlas 512x512 | ~0.5MB shared |
| **Total per agent (LOD0)** | **~4,500 tris** | | **~2.5MB** |

With 100 agents on screen at mixed LODs, total character geometry is approximately 200K-300K triangles — well within UE5's rendering budget alongside the environment.

### 3.2 Skeletal Mesh and Skeleton

**Skeleton:** `SK_OAV_Agent` — a shared skeleton used by ALL agent variants. This enables animation retargeting and shared Animation Blueprints.

**Bone Hierarchy:**

```
Root
├── Pelvis
│   ├── Spine_01
│   │   ├── Spine_02
│   │   │   ├── Spine_03
│   │   │   │   ├── Neck
│   │   │   │   │   └── Head
│   │   │   │   │       ├── EyeL / EyeR (for look-at)
│   │   │   │   │       └── Jaw (for speech bubble trigger)
│   │   │   │   ├── Clavicle_L
│   │   │   │   │   └── UpperArm_L → LowerArm_L → Hand_L → Fingers (5)
│   │   │   │   └── Clavicle_R
│   │   │   │       └── UpperArm_R → LowerArm_R → Hand_R → Fingers (5)
│   │   │   └── (IK targets: IK_Hand_L, IK_Hand_R)
│   │   └── (IK target: IK_Spine)
│   ├── Thigh_L → Calf_L → Foot_L → Toe_L
│   ├── Thigh_R → Calf_R → Foot_R → Toe_R
│   └── (IK targets: IK_Foot_L, IK_Foot_R)
└── (Virtual bones for props: VB_Monitor_LookAt, VB_Desk_Sit)
```

**Rig Features:**
- IK bones for hands (keyboard placement) and feet (floor contact)
- Virtual bones for attaching props and targeting look-at
- Twist bones on forearms for clean deformation during typing animations
- Total bone count: 67 (well under the 75-bone mobile limit for future Quest standalone builds)

### 3.3 Animation Blueprint (`ABP_OAV_Agent`)

The Animation Blueprint is the central state machine that drives all agent visual behavior. It mirrors the XState v5 actor model from the web client, but implemented as UE5 Anim Graph nodes.

**State Machine Architecture:**

```
ABP_OAV_Agent
│
├── [Locomotion Layer] — Controls movement (walk to desk, walk to meeting room, etc.)
│   ├── State: Idle_Standing
│   ├── State: Walking (BlendSpace1D: speed 0-150 cm/s)
│   ├── State: Sitting_Down (transition montage)
│   ├── State: Standing_Up (transition montage)
│   └── Transitions: triggered by UOAVAgentMovementComponent
│
├── [Upper Body Layer] — Layered blend, controls torso/arms while seated
│   ├── State: Seated_Idle
│   │   ├── Anim: A_Seated_Breathing (looping, additive)
│   │   ├── Anim: A_Seated_LookAround (random play, additive)
│   │   └── Anim: A_Seated_Fidget (random play, 15% chance every 10s)
│   │
│   ├── State: Seated_Working
│   │   ├── Anim: A_Seated_Typing (looping, speed driven by task_progress_rate)
│   │   ├── Anim: A_Seated_MouseClick (random interspersed)
│   │   └── Anim: A_Seated_ReviewDocument (alternative loop for non-code tasks)
│   │
│   ├── State: Seated_Thinking
│   │   ├── Anim: A_Seated_ChinScratch (looping)
│   │   ├── Anim: A_Seated_LeanBack (blended)
│   │   └── VFX Trigger: spawn thought bubble widget above head
│   │
│   ├── State: Seated_Communicating
│   │   ├── Anim: A_Seated_TurnToFace (IK look-at target = other agent)
│   │   ├── Anim: A_Seated_Gesture_Talk (hand gestures loop)
│   │   └── VFX Trigger: speech bubble + data flow particles to target
│   │
│   ├── State: Seated_Error
│   │   ├── Anim: A_Seated_Flinch (one-shot on enter)
│   │   ├── Anim: A_Seated_Distressed (looping: head in hands)
│   │   ├── Material Override: red emissive pulse on character
│   │   └── VFX Trigger: NS_Error_Sparks attached to desk
│   │
│   ├── State: Seated_Overloaded
│   │   ├── Anim: A_Seated_FranticTyping (2x speed typing)
│   │   ├── Anim: A_Seated_WipeSweat (additive, periodic)
│   │   ├── VFX Trigger: NS_Sweat_Particles on forehead
│   │   └── Desk VFX: papers stacking up (spawned static meshes)
│   │
│   ├── State: Seated_Sleeping
│   │   ├── Anim: A_Seated_Slumped (looping)
│   │   ├── Anim: A_Seated_Breathing_Deep (additive)
│   │   └── VFX Trigger: NS_ZZZ_Particles above head
│   │
│   ├── State: Celebrating
│   │   ├── Anim: A_Standing_FistPump (montage, one-shot)
│   │   ├── Anim: A_Standing_Clap (looping during celebration window)
│   │   └── VFX Trigger: NS_Confetti_Burst + NS_Sparkles
│   │
│   └── State: Terminated
│       ├── Anim: A_Standing_SlumpFade (one-shot)
│       ├── Material Override: ghost dissolve shader (opacity 1.0 → 0.0 over 2s)
│       └── Post: destroy actor after fade completes
│
├── [Full Body Override] — Used for one-shot montages that override everything
│   ├── Montage: AM_LevelUp (golden glow + size pulse + badge materialize)
│   ├── Montage: AM_AchievementUnlock (stop, look at camera, badge appears)
│   └── Montage: AM_Spawn (materialize from particles, walk to desk)
│
└── [Additive Layer] — Always-on subtle overlays
    ├── A_Breathing (chest rise/fall, 0.2Hz)
    ├── A_Blink (eye close/open, random interval 2-6s)
    └── A_StatusGlow (material parameter driven by agent health, pulsing)
```

### 3.4 Agent State Enum and Transitions

```cpp
// OAVAgentState.h
UENUM(BlueprintType)
enum class EOAVAgentState : uint8
{
    Spawning        UMETA(DisplayName = "Spawning"),
    Idle            UMETA(DisplayName = "Idle"),
    Working         UMETA(DisplayName = "Working"),
    Thinking        UMETA(DisplayName = "Thinking"),
    Communicating   UMETA(DisplayName = "Communicating"),
    Error           UMETA(DisplayName = "Error"),
    Overloaded      UMETA(DisplayName = "Overloaded"),
    Sleeping        UMETA(DisplayName = "Sleeping"),
    Celebrating     UMETA(DisplayName = "Celebrating"),
    LevelingUp      UMETA(DisplayName = "Leveling Up"),
    Terminated      UMETA(DisplayName = "Terminated")
};
```

**Transition Rules:**

| From | To | Trigger Event | Animation Transition |
|------|-----|--------------|---------------------|
| (none) | Spawning | `agent.lifecycle.spawned` | Particle materialization → walk to desk |
| Spawning | Idle | Reached desk | Sit down montage → Seated_Idle |
| Idle | Working | `agent.task.started` | 0.3s blend to Seated_Working |
| Working | Thinking | `agent.llm.request` (long prompt) | 0.5s blend to ChinScratch |
| Thinking | Working | `agent.llm.response` | 0.3s blend back to typing |
| Working | Communicating | `agent.communication.*` | Turn chair, face target, gestures |
| Communicating | Working | Communication event ends | Turn back to desk |
| Working | Error | `agent.error` | Flinch montage → Distressed loop |
| Error | Working | `agent.task.started` (retry) | Relief sigh → back to typing |
| Working | Idle | `agent.task.completed` | Stretch → lean back → Seated_Idle |
| Idle | Sleeping | Idle for > 5 minutes | Slow slump → ZZZ particles |
| Sleeping | Working | `agent.task.started` | Wake up montage → typing |
| Any | Celebrating | `agent.achievement.unlocked` | Override montage plays |
| Any | LevelingUp | `agent.xp.level_up` | Override montage plays |
| Any | Terminated | `agent.lifecycle.terminated` | Ghost dissolve → destroy |
| Working | Overloaded | Queue depth > threshold | Blend to frantic typing |
| Overloaded | Working | Queue depth normalizes | Blend back to normal typing |

### 3.5 Avatar Customization System

Agents are visually distinct through a layered customization system. Customization is driven by agent metadata (role, framework, performance tier) and user preferences.

**Customization Layers:**

```cpp
// OAVAgentAppearance.h
USTRUCT(BlueprintType)
struct FOAVAgentAppearance
{
    GENERATED_BODY()

    // Base body color (tint applied to MI_Agent_Base)
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FLinearColor BodyColor = FLinearColor(0.3f, 0.5f, 0.8f, 1.0f); // default blue

    // Head accessory socket attachment
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TSoftObjectPtr<UStaticMesh> HeadAccessory; // hat, headphones, crown, etc.

    // Badge mesh attached to chest socket
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TSoftObjectPtr<UStaticMesh> BadgeMesh; // role badge, level badge

    // Desk decoration (placed on agent's desk)
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<TSoftObjectPtr<UStaticMesh>> DeskDecorations; // plant, figurine, photo frame

    // Name plate text
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AgentName;

    // Role text (displayed on badge)
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString AgentRole;

    // Framework icon (LangChain, CrewAI, AutoGen, etc.)
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TSoftObjectPtr<UTexture2D> FrameworkIcon;
};
```

**Auto-Customization by Role:**

| Agent Role | Body Color | Head Accessory | Desk Decoration |
|-----------|-----------|---------------|-----------------|
| Researcher | Blue (#3B82F6) | Magnifying glass headband | Stack of books |
| Writer | Purple (#8B5CF6) | Beret | Quill pen holder |
| Coder | Green (#10B981) | Headphones | Dual monitor stand |
| Reviewer | Orange (#F59E0B) | Reading glasses | Red pen cup |
| Manager | Slate (#475569) | Earpiece | Executive desk toy |
| Orchestrator | Gold (#EAB308) | Crown | Globe |
| Custom | User-defined | User-defined | User-defined |

### 3.6 LOD System

Three LOD levels ensure 100+ agents render at 60fps.

**LOD Distances (from camera):**

| LOD | Distance | Triangles | Texture | Animations | Particles |
|-----|----------|-----------|---------|------------|-----------|
| LOD0 (Close) | 0-8m | 4,500 | 512x512 | Full skeletal animation, all additive layers | Full VFX |
| LOD1 (Medium) | 8-20m | 1,500 | 256x256 | Simplified animation (no finger movement, no additive blink) | Reduced VFX (no sweat, simplified sparkles) |
| LOD2 (Far) | 20m+ | 500 | 128x128 | Pose-based (snap to state pose, no blend) | Status glow only (no particles) |
| Culled | Behind camera / occluded | 0 | None | None | None |

**Implementation:**

```cpp
// Set on each agent's USkeletalMeshComponent
SkeletalMesh->SetLODScreenSizes({
    0.5f,   // LOD0: covers >50% of screen height
    0.15f,  // LOD1: covers 15-50%
    0.05f   // LOD2: covers <15%
});

// Animation budget allocation via URVOAvoidanceComponent
// Agents beyond LOD2 distance use significance manager to skip tick
AgentMesh->SetComponentTickEnabled(bIsVisible && LODLevel <= 2);
```

---

## 4. Niagara Particle Systems

### 4.1 System Overview

Niagara is UE5's GPU-accelerated particle system. It replaces the web version's CSS/canvas-based particle emitters with systems capable of rendering 100,000+ particles at negligible CPU cost. Every particle system in OAV serves a data communication purpose — none are purely decorative.

**System Naming Convention:** `NS_OAV_{Category}_{Effect}`

**Performance Budget:**
- Total active Niagara systems across scene: up to 200
- Total active GPU particles: up to 500,000
- Target GPU particle cost: < 2ms per frame on GTX 1070
- Distance-based culling: systems beyond 30m from camera reduce spawn rate to 10%; beyond 50m, disabled entirely

### 4.2 Data Flow Particles (`NS_OAV_DataFlow_Beam`)

**Purpose:** Visualize data/messages traveling between two communicating agents. This is the 3D equivalent of the 2D "connection lines" in the PixiJS version, but rendered as streams of glowing particles traveling along a spline.

**Visual Description:** Luminous orbs (2-4cm diameter) travel from source agent to target agent along a curved spline path. Color encodes the type of communication. Trail ribbons follow each orb.

**Niagara Module Stack:**

```
NS_OAV_DataFlow_Beam
├── Emitter: DataOrbs
│   ├── Spawn Rate: 15-30 particles/sec (driven by message frequency)
│   ├── Initialize Particle:
│   │   ├── Position: Source agent's hand socket
│   │   ├── Lifetime: calculated from spline length / travel speed
│   │   ├── Size: 2-4cm (randomized)
│   │   ├── Color: based on communication type (see table below)
│   │   └── Velocity: along spline tangent at spawn point
│   ├── Update:
│   │   ├── Spline Follow Module (custom): particle follows USplineComponent
│   │   │   - Spline is a cubic Bezier from source desk to target desk
│   │   │   - Control points create an arc (peak height = 1.5m above desk level)
│   │   ├── Size over Life: slight pulse (1.0 → 1.2 → 1.0, sine wave)
│   │   └── Color over Life: slight brightness variation
│   ├── Render:
│   │   ├── Sprite Renderer (camera-facing quads)
│   │   ├── Material: MI_DataOrb (additive blend, soft circle texture, emissive)
│   │   └── Ribbon Renderer (trail behind each orb)
│   │       ├── Width: 1cm
│   │       ├── Lifetime: 0.3s
│   │       └── Material: MI_DataTrail (additive, fade-out alpha)
│   └── Events:
│       └── On particle reaches end of spline → trigger receive VFX on target agent
│
├── Emitter: AmbientGlow
│   ├── Spawn: along spline at fixed intervals
│   ├── Stationary glow points that pulse when orbs pass through
│   └── Material: MI_SplineGlow (emissive, bloom contribution)
```

**Color by Communication Type:**

| Communication Type | Orb Color | Hex |
|-------------------|----------|-----|
| Task delegation | Blue | #3B82F6 |
| Data transfer | Cyan | #06B6D4 |
| Error escalation | Red | #EF4444 |
| Feedback/review | Purple | #8B5CF6 |
| Acknowledgment | Green | #10B981 |
| Cost alert | Amber | #F59E0B |

### 4.3 Token Consumption Effect (`NS_OAV_TokenDrain`)

**Purpose:** Visualize an agent consuming LLM tokens during a model call. Renders as energy particles draining from a "mana bar" hovering above the agent.

**Visual Description:** A translucent blue bar floats 30cm above the agent's head (the "token budget bar"). When the agent makes an LLM call, particles stream downward from the bar into the agent's head, and the bar shrinks. The bar refills when a new task is assigned with a fresh budget.

**Niagara Module Stack:**

```
NS_OAV_TokenDrain
├── Emitter: DrainParticles
│   ├── Spawn: burst of 20-50 particles on each agent.llm.request event
│   ├── Initialize:
│   │   ├── Position: bar bottom edge (random X spread across bar width)
│   │   ├── Velocity: downward (0, 0, -80 cm/s) + slight random lateral
│   │   ├── Size: 0.5-1.5cm
│   │   ├── Color: Lerp(Blue, Red) based on remaining budget %
│   │   └── Lifetime: 0.6s
│   ├── Update:
│   │   ├── Curl Noise: slight swirl as particles descend
│   │   ├── Size over Life: shrink to 0 at death
│   │   └── Color over Life: fade to transparent
│   └── Render: Sprite (additive, soft dot texture)
│
├── Emitter: BarGlow
│   ├── Spawn: continuous, 5 particles/sec along bar edge
│   ├── Purpose: ambient shimmer on the token budget bar
│   └── Material: MI_BarGlow (emissive pulse)
```

### 4.4 Cost Accumulation Effect (`NS_OAV_CostStream`)

**Purpose:** Visualize money being spent. Small coin/spark particles float upward from active agents toward a central cost meter hologram mounted on the ceiling of the open floor.

**Visual Description:** Gold spark particles rise from each working agent's desk, drifting upward in a lazy spiral. They converge on a ceiling-mounted holographic counter that displays total session cost. The more agents are active, the denser the upward particle stream.

**Niagara Module Stack:**

```
NS_OAV_CostStream
├── Emitter: CostSparks
│   ├── Spawn: 2-5 particles per agent per second (scales with token burn rate)
│   ├── Initialize:
│   │   ├── Position: agent desk surface
│   │   ├── Velocity: upward (0, 0, 120 cm/s) + spiral rotation
│   │   ├── Size: 0.8-1.5cm
│   │   ├── Color: Gold (#EAB308) with brightness = cost magnitude
│   │   └── Lifetime: 3-5s (time to reach ceiling)
│   ├── Update:
│   │   ├── Point Attractor: ceiling cost meter position, strength ramps up at distance < 2m
│   │   ├── Spiral Motion: orbital velocity around vertical axis
│   │   └── Size over Life: grow slightly as they rise (0.8 → 1.2cm)
│   └── Render: Sprite (additive, star texture, bloom)
│
├── Counter VFX: NS_OAV_CostCounter
│   ├── Stationary emitter at ceiling meter
│   ├── Ring of particles that pulse when cost sparks arrive
│   └── Material: MI_CostMeter (holographic, UMG render target for the number display)
```

### 4.5 Error Particles (`NS_OAV_Error_Sparks`)

**Purpose:** Immediate visual alert when an agent enters an error state.

**Visual Description:** Red-orange electrical sparks burst from the agent's desk monitor. Accompanied by a brief smoke wisp. The monitor screen material switches to a static/glitch pattern.

```
NS_OAV_Error_Sparks
├── Emitter: Sparks (burst)
│   ├── Spawn: burst of 40-80 particles on error event
│   ├── Initialize:
│   │   ├── Position: monitor screen center
│   │   ├── Velocity: outward in hemisphere (200-400 cm/s)
│   │   ├── Size: 0.3-1.0cm
│   │   ├── Color: Lerp(Red #EF4444, Orange #F97316)
│   │   └── Lifetime: 0.3-0.8s
│   ├── Update:
│   │   ├── Gravity: -980 cm/s^2 (sparks arc downward)
│   │   ├── Drag: 2.0 (sparks slow quickly)
│   │   └── Color over Life: fade to dark red, then transparent
│   └── Render: Sprite (additive, elongated along velocity for streak)
│
├── Emitter: Smoke
│   ├── Spawn: 5-10 particles, delayed 0.2s after sparks
│   ├── Slow-rising dark grey translucent puffs
│   ├── Lifetime: 2-4s
│   └── Render: Sprite (translucent, noise-distorted circle)
│
├── Emitter: ArcingElectricity
│   ├── Spawn: 2-3 ribbon emitters
│   ├── Each ribbon: randomized zigzag path from monitor to desk edge
│   ├── Lifetime: 0.15s (very brief flash)
│   └── Render: Ribbon (additive, bright white core, blue-white edge)
```

### 4.6 Celebration Particles (`NS_OAV_Celebration`)

**Purpose:** Achievement unlock, level-up, and milestone celebrations.

**Sub-Systems:**

**Confetti Burst (`NS_OAV_Confetti`):**
- Burst of 500-2,000 confetti pieces from above the agent
- Mesh particles: small rectangular planes with random rotation
- Random color from celebration palette: gold, blue, green, purple, pink
- Physics: gravity + air drag + tumble rotation (curl noise on angular velocity)
- Lifetime: 3-5s (land on floor, fade out)

**Fireworks (`NS_OAV_Fireworks`):**
- Used for major milestones (team-level achievements)
- Rocket trail rises from rooftop terrace → burst of 200-500 particles at apex
- Burst pattern: sphere with randomized shell layers
- Color: preset palettes (gold+white, blue+silver, red+gold)
- Audio trigger: explosion pop via MetaSound event

**Golden Sparkles (`NS_OAV_GoldenSparkles`):**
- Ambient sparkle aura around a leveling-up agent
- 50-100 tiny gold sprites orbiting the agent at varying radii
- Lifetime: 5-10s (duration of level-up cinematic)
- Bloom contribution: high (creates a warm glow around the agent)

### 4.7 Loop Detection Visualization (`NS_OAV_LoopVortex`)

**Purpose:** When the backend detects an agent stuck in a loop (same tool called with similar arguments > N times), a red swirling vortex appears between the looping agent and the entity it is cycling with.

**Visual Description:** A flat disc of swirling red particles at desk height between two agents (or centered on a single agent if self-looping). The vortex grows larger and faster as the loop count increases. At critical threshold (2x the configured limit), the vortex gains lightning arcs.

```
NS_OAV_LoopVortex
├── Emitter: VortexCore
│   ├── Spawn: continuous, 100 particles/sec
│   ├── Position: ring around center point (radius grows with loop count)
│   ├── Velocity: tangential (orbital), speed = 200 + (loop_count * 30) cm/s
│   ├── Color: Dark Red (#991B1B) core, lighter red (#EF4444) edge
│   ├── Size: 1-3cm
│   └── Lifetime: one full orbit
│
├── Emitter: WarningRing
│   ├── Mesh ring particle that scales up with loop_count
│   ├── Material: MI_WarningRing (emissive red, pulsing opacity)
│   └── Rotation: slow continuous spin
│
├── Emitter: LightningArcs (active only at critical threshold)
│   ├── Ribbon emitters: 3 arcs from vortex center to random edge points
│   ├── Zigzag path with per-frame re-randomization
│   └── Material: bright white-red additive
```

### 4.8 Achievement Unlock VFX (`NS_OAV_AchievementUnlock`)

**Purpose:** When an agent unlocks an achievement, a badge materializes in 3D space above them with a light burst.

**Sequence (2.5 seconds total):**

1. **0.0s:** Point light flash (white, intensity 10,000, radius 3m, fade over 0.3s)
2. **0.1s:** Concentric ring particles expand outward from the badge spawn point (2 rings, gold color)
3. **0.3s:** Badge mesh fades in (opacity 0→1 over 0.5s) at the spawn point, rotating slowly
4. **0.5s:** Golden sparkle particles surround the badge (50 particles, orbital)
5. **1.5s:** Badge floats down to agent's chest badge socket and attaches
6. **2.5s:** Sparkles fade out, point light fully gone

---

## 5. Real-Time Data Integration

### 5.1 Architecture Overview

The UE5 client connects to the same FastAPI backend that serves the PixiJS web client. No backend modifications are required. The UE5 client acts as another WebSocket consumer.

```
┌─────────────────────────────────────────────────────────────────┐
│                       UE5 CLIENT                                 │
│                                                                   │
│  ┌────────────────┐     ┌──────────────────┐     ┌────────────┐ │
│  │  UOAVWebSocket │────▶│ UOAVEventDispatcher│────▶│ AOAVAgent  │ │
│  │  Client        │     │ (GameInstance     │     │ Actors     │ │
│  │  (C++ Module)  │     │  Subsystem)       │     │ (Blueprints)│ │
│  └───────┬────────┘     └────────┬─────────┘     └────────────┘ │
│          │                       │                                │
│          │              ┌────────▼─────────┐                     │
│          │              │ UOAVAgentRegistry │                     │
│          │              │ (TMap<FString,    │                     │
│          │              │  AOAVAgent*>)     │                     │
│          │              └──────────────────┘                     │
│          │                                                        │
│  ┌───────▼────────┐     ┌──────────────────┐                    │
│  │  REST Client   │────▶│ UOAVMetricStore  │                    │
│  │  (HTTP GET for │     │ (Cached metrics   │                    │
│  │   initial state)│    │  for UMG widgets) │                    │
│  └────────────────┘     └──────────────────┘                    │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                    WebSocket: ws://host:8001/ws/events
                    REST: http://host:8000/api/v1/*
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                     FastAPI Backend (unchanged)                    │
└───────────────────────────────────────────────────────────────────┘
```

### 5.2 WebSocket Client (`UOAVWebSocketClient`)

A custom C++ module wrapping the IWebSocket interface from UE5's WebSockets module.

```cpp
// OAVWebSocketClient.h
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "IWebSocket.h"
#include "OAVWebSocketClient.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnOAVEventReceived, const FString&, JsonPayload);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnOAVConnected);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnOAVDisconnected, int32, StatusCode, const FString&, Reason);

UCLASS()
class OPENAGENTVISUALIZER_API UOAVWebSocketClient : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // Connect to the backend WebSocket server
    UFUNCTION(BlueprintCallable, Category = "OAV|Network")
    void Connect(const FString& URL, const FString& AuthToken);

    // Disconnect gracefully
    UFUNCTION(BlueprintCallable, Category = "OAV|Network")
    void Disconnect();

    // Send a message (for bidirectional commands)
    UFUNCTION(BlueprintCallable, Category = "OAV|Network")
    void SendMessage(const FString& Message);

    // Connection state
    UFUNCTION(BlueprintPure, Category = "OAV|Network")
    bool IsConnected() const;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "OAV|Network")
    FOnOAVEventReceived OnEventReceived;

    UPROPERTY(BlueprintAssignable, Category = "OAV|Network")
    FOnOAVConnected OnConnected;

    UPROPERTY(BlueprintAssignable, Category = "OAV|Network")
    FOnOAVDisconnected OnDisconnected;

private:
    TSharedPtr<IWebSocket> WebSocket;
    FString ServerURL;
    FString Token;

    // Reconnection logic
    FTimerHandle ReconnectTimerHandle;
    int32 ReconnectAttempts = 0;
    static constexpr int32 MaxReconnectAttempts = 10;
    static constexpr float BaseReconnectDelay = 1.0f; // seconds
    static constexpr float MaxReconnectDelay = 30.0f;

    void AttemptReconnect();
    float GetReconnectDelay() const;

    // Handlers
    void OnWebSocketConnected();
    void OnWebSocketConnectionError(const FString& Error);
    void OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean);
    void OnWebSocketMessage(const FString& Message);

    // Event buffer for messages received during processing
    TQueue<FString> EventQueue;
    static constexpr int32 MaxQueueSize = 10000;
};
```

**Reconnection Strategy:**

Exponential backoff with jitter:
```
delay = min(BaseReconnectDelay * 2^attempt + random(0, 1.0), MaxReconnectDelay)
```

After 10 failed attempts, show a UMG overlay: "Connection Lost — Retrying..." with a manual reconnect button.

**Message Buffer:**

During reconnection, the client stores the timestamp of the last successfully processed event. On reconnect, it sends a `catch_up` request to the REST API:

```
GET /api/v1/events?since={last_event_timestamp}&limit=1000
```

This returns missed events in chronological order. The client replays them at 10x speed (animations compressed to 100ms each) to catch up without overwhelming the user.

### 5.3 Event Dispatcher (`UOAVEventDispatcher`)

Parses JSON events from the WebSocket and routes them to the appropriate agent actor.

```cpp
// OAVEventDispatcher.h
UCLASS()
class OPENAGENTVISUALIZER_API UOAVEventDispatcher : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    // Called by WebSocket client for each received message
    void ProcessEvent(const FString& JsonPayload);

    // Agent registry: maps agent_id to spawned actor
    UPROPERTY()
    TMap<FString, AAOAVAgent*> AgentRegistry;

    // Delegates for specific event types (Blueprint-bindable)
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnAgentStateChanged, const FString&, AgentId, EOAVAgentState, NewState);
    UPROPERTY(BlueprintAssignable) FOnAgentStateChanged OnAgentStateChanged;

    DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnAgentMetricUpdated, const FString&, AgentId, const FString&, MetricName, float, Value);
    UPROPERTY(BlueprintAssignable) FOnAgentMetricUpdated OnAgentMetricUpdated;

    DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnAgentCommunication, const FString&, SourceAgentId, const FString&, TargetAgentId, const FString&, MessageType);
    UPROPERTY(BlueprintAssignable) FOnAgentCommunication OnAgentCommunication;

    DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnSystemMetricUpdated, const FString&, MetricName, float, Value);
    UPROPERTY(BlueprintAssignable) FOnSystemMetricUpdated OnSystemMetricUpdated;

private:
    // Parse and dispatch based on event_type field
    void DispatchAgentLifecycleEvent(const TSharedPtr<FJsonObject>& EventData);
    void DispatchAgentStateEvent(const TSharedPtr<FJsonObject>& EventData);
    void DispatchAgentMetricEvent(const TSharedPtr<FJsonObject>& EventData);
    void DispatchCommunicationEvent(const TSharedPtr<FJsonObject>& EventData);
    void DispatchSystemEvent(const TSharedPtr<FJsonObject>& EventData);
    void DispatchGamificationEvent(const TSharedPtr<FJsonObject>& EventData);

    // Spawn a new agent actor when agent.lifecycle.spawned is received
    AAOAVAgent* SpawnAgentActor(const FString& AgentId, const TSharedPtr<FJsonObject>& Metadata);

    // Destroy agent actor on agent.lifecycle.terminated
    void DestroyAgentActor(const FString& AgentId);
};
```

**Event Type Routing:**

| Event Type Pattern | Dispatch Method | Target |
|-------------------|----------------|--------|
| `agent.lifecycle.spawned` | `DispatchAgentLifecycleEvent` | Spawns new `AOAVAgent` actor |
| `agent.lifecycle.terminated` | `DispatchAgentLifecycleEvent` | Triggers terminate animation, then destroys actor |
| `agent.state.*` | `DispatchAgentStateEvent` | Sets `EOAVAgentState` on target agent actor |
| `agent.task.*` | `DispatchAgentStateEvent` | Updates task context, triggers Working/Idle transitions |
| `agent.llm.*` | `DispatchAgentMetricEvent` | Updates token bar, triggers TokenDrain VFX |
| `agent.tool.*` | `DispatchAgentMetricEvent` | Updates tool usage counter on desk monitor |
| `agent.communication.*` | `DispatchCommunicationEvent` | Spawns DataFlow particles between two agents |
| `agent.error` | `DispatchAgentStateEvent` | Triggers Error state + Error VFX |
| `agent.anomaly.loop_detected` | `DispatchAgentStateEvent` | Spawns LoopVortex VFX |
| `agent.xp.*` | `DispatchGamificationEvent` | Updates XP bar, triggers level-up VFX if applicable |
| `agent.achievement.*` | `DispatchGamificationEvent` | Triggers achievement unlock VFX |
| `system.metric.*` | `DispatchSystemEvent` | Updates server room, weather, day/night cycle |

### 5.4 Agent Actor Class (`AOAVAgent`)

The core actor class representing one AI agent in the 3D world.

```cpp
// OAVAgent.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "OAVAgentState.h"
#include "OAVAgentAppearance.h"
#include "OAVAgent.generated.h"

UCLASS(Blueprintable)
class OPENAGENTVISUALIZER_API AOAVAgent : public ACharacter
{
    GENERATED_BODY()

public:
    AOAVAgent();

    // --- Identity ---
    UPROPERTY(BlueprintReadOnly, Category = "OAV|Identity")
    FString AgentId;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Identity")
    FString AgentName;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Identity")
    FString AgentRole;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Identity")
    FString FrameworkType; // "langchain", "crewai", "autogen", etc.

    // --- State ---
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_AgentState, Category = "OAV|State")
    EOAVAgentState CurrentState = EOAVAgentState::Spawning;

    UFUNCTION(BlueprintCallable, Category = "OAV|State")
    void SetAgentState(EOAVAgentState NewState);

    // --- Metrics (displayed on desk monitor and overhead widgets) ---
    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    int32 CurrentXP = 0;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    int32 CurrentLevel = 1;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    float TokenBudgetRemaining = 1.0f; // 0.0 to 1.0

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    int32 TasksCompleted = 0;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    float ErrorRate = 0.0f;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|Metrics")
    float CostAccumulated = 0.0f;

    // --- Appearance ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAV|Appearance")
    FOAVAgentAppearance Appearance;

    UFUNCTION(BlueprintCallable, Category = "OAV|Appearance")
    void ApplyAppearance(const FOAVAgentAppearance& NewAppearance);

    // --- Desk Assignment ---
    UPROPERTY(BlueprintReadOnly, Category = "OAV|World")
    FVector AssignedDeskLocation;

    UPROPERTY(BlueprintReadOnly, Category = "OAV|World")
    FRotator AssignedDeskRotation;

    // --- Communication ---
    UFUNCTION(BlueprintCallable, Category = "OAV|Communication")
    void StartCommunication(AOAVAgent* TargetAgent, const FString& MessageType);

    UFUNCTION(BlueprintCallable, Category = "OAV|Communication")
    void StopCommunication();

    // --- VFX ---
    UPROPERTY(EditDefaultsOnly, Category = "OAV|VFX")
    UNiagaraSystem* NS_TokenDrain;

    UPROPERTY(EditDefaultsOnly, Category = "OAV|VFX")
    UNiagaraSystem* NS_ErrorSparks;

    UPROPERTY(EditDefaultsOnly, Category = "OAV|VFX")
    UNiagaraSystem* NS_Celebration;

    UPROPERTY(EditDefaultsOnly, Category = "OAV|VFX")
    UNiagaraSystem* NS_LevelUp;

    UPROPERTY(EditDefaultsOnly, Category = "OAV|VFX")
    UNiagaraSystem* NS_ZZZSleep;

    // --- Components ---
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAV|Components")
    UWidgetComponent* OverheadWidget; // XP bar, name, level badge

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAV|Components")
    UWidgetComponent* DeskMonitorWidget; // Desk monitor showing metrics

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAV|Components")
    USpotLightComponent* DeskLamp; // Color reflects agent status

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAV|Components")
    UNiagaraComponent* ActiveVFX; // Currently playing particle system

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    UFUNCTION()
    void OnRep_AgentState();

    // State-dependent desk lamp colors
    FLinearColor GetLampColorForState(EOAVAgentState State) const;

    // Navigation to assigned desk
    void NavigateToDesk();
    void NavigateToMeetingRoom(int32 RoomIndex);
    void NavigateToBreakRoom();
};
```

### 5.5 Holographic Dashboard Displays

Metrics are displayed on in-world surfaces using UMG widgets rendered to `UTextureRenderTarget2D`.

**Implementation Pattern:**

```cpp
// For each in-world monitor/display:
// 1. Create a UMG Widget Blueprint (WBP_AgentDeskMonitor)
// 2. Bind widget data to agent metrics via UOAVMetricStore
// 3. Render the widget to a texture render target
// 4. Apply the render target to the monitor's screen material

// In BP_AgentDesk constructor:
UWidgetComponent* MonitorWidget = CreateDefaultSubobject<UWidgetComponent>(TEXT("MonitorWidget"));
MonitorWidget->SetWidgetClass(WBP_AgentDeskMonitor::StaticClass());
MonitorWidget->SetDrawSize(FVector2D(640, 360)); // render resolution
MonitorWidget->SetRenderTarget(MonitorRenderTarget); // shared RT per LOD group
```

**Widget Blueprints for In-World Displays:**

| Widget | Location | Content | Update Rate |
|--------|----------|---------|------------|
| `WBP_AgentDeskMonitor` | Each agent's desk | Agent name, current task, token usage, XP, mini error log | 1 Hz |
| `WBP_LeaderboardDisplay` | Lobby wall | Top 10 agents by XP, animated bars | 5 Hz |
| `WBP_CostMeter` | Open floor ceiling | Total session cost, burn rate, cost graph | 2 Hz |
| `WBP_ServerRackDisplay` | Server room | CPU %, memory %, queue depth, connections | 2 Hz |
| `WBP_MeetingRoomBoard` | Meeting room whiteboard | Active collaboration task, participant list, progress | 1 Hz |
| `WBP_ManagerDashboard` | Manager office monitors | Full dashboard (mirrors web dashboard) | 1 Hz |
| `WBP_TimelineDisplay` | Archive room | Session history timeline, replay controls | On interaction |

### 5.6 Event Queue and Interpolation

Events arrive from the backend at irregular intervals. To prevent jarring visual snaps, the UE5 client implements an interpolation buffer.

```cpp
// OAVEventInterpolator.h
// Buffers incoming state changes and applies them smoothly over time

UCLASS()
class UOAVEventInterpolator : public UActorComponent
{
    GENERATED_BODY()

public:
    // Buffer duration: events are delayed by this amount to allow smooth interpolation
    UPROPERTY(EditAnywhere, Category = "OAV|Interpolation")
    float BufferDuration = 0.15f; // 150ms buffer

    // Queue an incoming state change
    void QueueStateChange(EOAVAgentState NewState, float Timestamp);

    // Queue a metric update for smooth interpolation
    void QueueMetricUpdate(const FString& MetricName, float TargetValue, float Timestamp);

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

private:
    struct FPendingStateChange
    {
        EOAVAgentState State;
        float ApplyTime; // game time when this should be applied
    };

    struct FPendingMetricUpdate
    {
        FString MetricName;
        float TargetValue;
        float ApplyTime;
        float InterpDuration; // how long to lerp to the target
    };

    TArray<FPendingStateChange> PendingStates;
    TArray<FPendingMetricUpdate> PendingMetrics;

    // Smooth metric values
    TMap<FString, float> CurrentMetricValues;
    TMap<FString, float> MetricInterpTargets;
    TMap<FString, float> MetricInterpSpeeds;
};
```

**Interpolation Rules:**
- State changes: applied after `BufferDuration` delay. If multiple state changes arrive for the same agent within the buffer, only the latest is applied (skip intermediate states).
- Metric values (XP, token budget, cost): linearly interpolated over 0.3s to prevent jumps.
- Position changes (agent moving to meeting room): pathfinding is triggered immediately; the agent walks at a natural pace regardless of event timing.

---

## 6. Camera & Navigation System

### 6.1 Camera Mode Architecture

The camera system provides multiple perspectives for different use cases. All camera modes share a common `AOAVPlayerController` that handles mode switching and smooth transitions.

```cpp
// OAVCameraManager.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "OAVCameraManager.generated.h"

UENUM(BlueprintType)
enum class EOAVCameraMode : uint8
{
    FreeRoam        UMETA(DisplayName = "Free Roam"),
    OrbitalAgent    UMETA(DisplayName = "Orbital (Agent Focus)"),
    TopDown         UMETA(DisplayName = "Top-Down Overview"),
    Cinematic       UMETA(DisplayName = "Cinematic Spectator"),
    VRFirstPerson   UMETA(DisplayName = "VR First Person"),
    PictureInPicture UMETA(DisplayName = "Picture in Picture")
};

UCLASS(Blueprintable)
class OPENAGENTVISUALIZER_API AOAVCameraManager : public AActor
{
    GENERATED_BODY()

public:
    // Switch between camera modes with interpolated transition
    UFUNCTION(BlueprintCallable, Category = "OAV|Camera")
    void SetCameraMode(EOAVCameraMode NewMode, float TransitionDuration = 0.8f);

    // Focus on a specific agent (used by Orbital and PiP modes)
    UFUNCTION(BlueprintCallable, Category = "OAV|Camera")
    void FocusOnAgent(const FString& AgentId, float TransitionDuration = 0.5f);

    // Save/recall bookmarked camera positions
    UFUNCTION(BlueprintCallable, Category = "OAV|Camera")
    void SaveBookmark(int32 SlotIndex); // slots 0-9

    UFUNCTION(BlueprintCallable, Category = "OAV|Camera")
    void RecallBookmark(int32 SlotIndex, float TransitionDuration = 0.6f);

    // Current mode
    UPROPERTY(BlueprintReadOnly, Category = "OAV|Camera")
    EOAVCameraMode CurrentMode = EOAVCameraMode::FreeRoam;

    // Currently focused agent (if any)
    UPROPERTY(BlueprintReadOnly, Category = "OAV|Camera")
    FString FocusedAgentId;

private:
    // Camera components for each mode
    UPROPERTY(VisibleAnywhere)
    UCameraComponent* FreeRoamCamera;

    UPROPERTY(VisibleAnywhere)
    USpringArmComponent* OrbitalSpringArm;

    UPROPERTY(VisibleAnywhere)
    UCameraComponent* OrbitalCamera;

    UPROPERTY(VisibleAnywhere)
    UCameraComponent* TopDownCamera;

    UPROPERTY(VisibleAnywhere)
    UCameraComponent* CinematicCamera;

    // Bookmarks
    TArray<FTransform> CameraBookmarks; // 10 slots

    // Transition state
    FTransform TransitionStart;
    FTransform TransitionEnd;
    float TransitionAlpha = 1.0f;
    float TransitionSpeed = 1.0f;

    void InterpolateTransition(float DeltaTime);
};
```

### 6.2 Free Roam Mode

**Input:** WASD movement, mouse look, scroll wheel altitude, shift for speed boost.

**Behavior:**
- Camera floats through the office at a default height of 2.0m (eye level)
- Collision with walls and furniture to prevent clipping
- Movement speed: 300 cm/s default, 600 cm/s with shift
- Mouse sensitivity: configurable (default 2.0)
- Altitude adjustment: scroll wheel adjusts camera height from 0.5m to 8m
- No gravity — the camera is a free-flying spectator pawn

**Enhanced Input Action Mapping:**

```
IA_Move        → WASD / Left Stick       → Move camera on XY plane
IA_Look        → Mouse Delta / Right Stick → Rotate camera yaw/pitch
IA_Altitude    → Scroll Wheel / Triggers  → Raise/lower camera
IA_Sprint      → Left Shift / L3          → 2x movement speed
IA_Interact    → Left Click / A Button    → Select agent under cursor
IA_CycleMode   → Tab / Y Button           → Cycle camera modes
IA_Bookmark_S  → Ctrl+1-9                 → Save bookmark to slot
IA_Bookmark_R  → 1-9                      → Recall bookmark from slot
```

### 6.3 Orbital Agent Mode

**Trigger:** Click on an agent, or press `F` to focus on the agent under the cursor.

**Behavior:**
- Spring arm camera orbits around the selected agent's desk
- Spring arm length: 3m default (adjustable with scroll wheel: 1.5m to 8m)
- Orbit: mouse drag rotates around the agent (full 360 horizontal, -10 to 80 vertical)
- Agent's overhead widget becomes more detailed (shows full stat panel)
- Agent's desk monitor is readable at this distance
- DOF (Depth of Field): background agents blur slightly to draw focus
- Press `Escape` or `Tab` to return to Free Roam

**Implementation:**
```cpp
// In AOAVCameraManager::FocusOnAgent
OrbitalSpringArm->AttachToActor(TargetAgent, FAttachmentTransformRules::KeepRelativeTransform);
OrbitalSpringArm->TargetArmLength = 300.0f; // 3m
OrbitalSpringArm->bDoCollisionTest = true;
OrbitalSpringArm->bEnableCameraLag = true;
OrbitalSpringArm->CameraLagSpeed = 8.0f;

// Enable DOF on the post-process volume
PostProcessSettings.bOverride_DepthOfFieldFocalDistance = true;
PostProcessSettings.DepthOfFieldFocalDistance = 300.0f;
PostProcessSettings.DepthOfFieldFstop = 2.8f;
```

### 6.4 Top-Down Overview Mode

**Purpose:** RTS-style bird's-eye view of the entire office. Shows all agents as colored dots with status indicators. Ideal for large deployments where the user wants to see macro patterns.

**Behavior:**
- Camera positioned at 15m height, looking straight down
- Mouse wheel zooms between 8m and 50m height
- Edge-of-screen scrolling (move mouse to screen edge to pan)
- Agent avatars at this distance render at LOD2 (simplified geometry)
- Status rings visible around each agent (color = state, thickness = XP level)
- Data flow particles visible as colored arcs between agents
- Minimap is hidden in this mode (the view IS the minimap)

**Minimap Widget (`WBP_Minimap`):**

When NOT in top-down mode, a minimap widget occupies the bottom-right corner of the screen.

```
WBP_Minimap (UMG Widget)
├── Size: 200x200 pixels
├── Background: dark translucent floor plan outline
├── Agent Dots:
│   ├── Color: status color (green=working, blue=idle, red=error, grey=sleeping)
│   ├── Size: 4px (normal), 6px (selected/focused)
│   └── Pulse: slow pulse on the currently focused agent
├── Camera Frustum: white trapezoid showing current camera view bounds
├── Zone Labels: abbreviated zone names at low opacity
├── Click-to-Navigate: clicking a point on the minimap moves the camera there
└── Data Flow Lines: thin colored lines between communicating agents
```

### 6.5 Cinematic Spectator Mode

**Purpose:** "Lean back and watch" mode. The camera automatically tours the office, lingering on active agents, following data flow, and cutting to interesting events.

**Behavior:**
- Camera follows a procedurally generated path through the office
- Dwells on agents that are currently active (working, communicating, error)
- Cuts to the most "interesting" event in the scene:
  - Error events: camera moves to the error agent
  - Achievement unlocks: camera cuts to the celebrating agent
  - Communication: camera follows the data flow particles
  - Level-up: cinematic close-up with DOF
- Path generation uses a weighted interest score per agent:

```
Interest_Score =
    (IsWorking ? 1.0 : 0.0) +
    (IsError ? 5.0 : 0.0) +
    (IsCelebrating ? 8.0 : 0.0) +
    (IsCommunicating ? 2.0 : 0.0) +
    (SecondsSinceLastViewed > 60 ? 1.5 : 0.0)
```

- Camera selects the highest-scoring agent every 8-15 seconds
- Smooth Bezier curve transition between viewpoints (3s travel time)
- Slight handheld camera shake (very subtle: 0.3 amplitude, 1.5Hz)
- Letterbox bars (optional, enabled by default for cinematic feel)

**Implementation:**
```cpp
// CinematicCameraDirector.h
UCLASS()
class UCinematicCameraDirector : public UActorComponent
{
    GENERATED_BODY()

public:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
        FActorComponentTickFunction* ThisTickFunction) override;

private:
    // Current target agent
    UPROPERTY()
    AOAVAgent* CurrentTarget = nullptr;

    // Time spent on current target
    float TimeOnTarget = 0.0f;

    // Minimum dwell time before switching
    float MinDwellTime = 8.0f;
    float MaxDwellTime = 15.0f;

    // Calculate interest score for all agents, return highest
    AOAVAgent* SelectNextTarget() const;

    // Generate smooth camera path to target
    void GeneratePathToTarget(AOAVAgent* Target);

    // Camera orbit offsets for visual variety
    TArray<FVector> CameraOffsetPresets = {
        FVector(-200, -100, 150),  // front-left, slightly above
        FVector(100, -250, 120),   // right side
        FVector(-50, 200, 80),     // behind, low angle
        FVector(0, 0, 300),        // overhead
    };
    int32 CurrentOffsetIndex = 0;

    // Tracks when each agent was last viewed by cinematic camera
    TMap<FString, float> LastViewedTimestamps;
};
```

### 6.6 VR First-Person Mode

See Section 11 for full VR details. In summary:
- The user is a 1.7m-tall invisible character walking through the office
- Locomotion: teleport (default) or smooth (option)
- Look: head tracking
- Interact: point controller at agent, trigger to select
- Scale: 1:1 real-world scale. Desks are desk-sized. Agents are person-sized.

### 6.7 Picture-in-Picture (PiP) Mode

**Purpose:** Monitor a specific agent in a small viewport while exploring the rest of the office.

**Behavior:**
- A small viewport (320x180, bottom-left corner) shows the focused agent's orbital view
- Main viewport remains in Free Roam (or any other mode)
- The PiP agent's name and status are displayed above the PiP viewport
- Press `P` to toggle PiP. Press `P` again while hovering over an agent to change the PiP target.
- PiP uses a `USceneCaptureComponent2D` rendering to a separate render target at reduced resolution.

**Performance Impact:**
- Second scene capture at 320x180 costs approximately 0.5-1ms GPU time
- LOD for PiP scene capture is locked to LOD1 to reduce draw calls
- PiP update rate: 30fps (every other frame) to halve the cost

### 6.8 Camera Transitions

All camera mode switches use smooth interpolation to prevent disorienting cuts.

**Transition Algorithm:**

```cpp
void AOAVCameraManager::InterpolateTransition(float DeltaTime)
{
    if (TransitionAlpha >= 1.0f) return;

    TransitionAlpha = FMath::Clamp(TransitionAlpha + DeltaTime * TransitionSpeed, 0.0f, 1.0f);

    // Ease-in-out cubic interpolation
    float T = TransitionAlpha;
    float EasedT = (T < 0.5f) ? 4.0f * T * T * T : 1.0f - FMath::Pow(-2.0f * T + 2.0f, 3.0f) / 2.0f;

    FTransform CurrentTransform;
    CurrentTransform.Blend(TransitionStart, TransitionEnd, EasedT);

    ActiveCamera->SetWorldTransform(CurrentTransform);

    // Also interpolate FOV if modes have different FOVs
    float TargetFOV = GetFOVForMode(CurrentMode);
    float CurrentFOV = FMath::Lerp(ActiveCamera->FieldOfView, TargetFOV, EasedT);
    ActiveCamera->SetFieldOfView(CurrentFOV);
}
```

**FOV per Mode:**

| Mode | FOV | Rationale |
|------|-----|-----------|
| Free Roam | 90 | Standard FPS-style field of view |
| Orbital | 60 | Narrower for focused detail view |
| Top-Down | 45 | Minimal perspective distortion for overview |
| Cinematic | 50 | Cinematic standard |
| VR | HMD native | Determined by headset (typically 90-110) |

### 6.9 Camera Bookmarks

Users can save up to 10 camera positions and recall them instantly.

**Storage:** Serialized to `FTransform` (location + rotation + scale) and saved to the user's settings file (`SaveGame` system).

**Keyboard Shortcuts:**
- `Ctrl + 0-9`: Save current camera position to slot
- `0-9`: Recall camera position from slot (smooth transition over 0.6s)
- Visual feedback: brief "Bookmark Saved" toast notification (UMG)

---

## 7. UI System (UMG)

### 7.1 UI Architecture

All UI is built with UMG (Unreal Motion Graphics), UE5's native UI framework. The UI follows the Design System Spec's token system adapted for UMG.

**UI Layer Stack (front to back):**

```
[Layer 6] Modal Overlays       — Settings panel, command palette, dialogs
[Layer 5] Notifications        — Achievement toasts, error alerts (top-right)
[Layer 4] HUD                  — Agent tooltips, health bars, status badges
[Layer 3] Dashboard Overlay    — Semi-transparent metrics dashboard (toggleable)
[Layer 2] Minimap              — Bottom-right corner minimap
[Layer 1] Side Panel           — Agent detail panel (slides from right)
[Layer 0] 3D World             — The game viewport
```

**UI Manager:**

```cpp
// OAVUIManager.h
UCLASS()
class OPENAGENTVISUALIZER_API UOAVUIManager : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    // Show/hide major UI elements
    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void ToggleDashboardOverlay();

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void ShowAgentDetailPanel(const FString& AgentId);

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void HideAgentDetailPanel();

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void OpenCommandPalette();

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void ShowNotification(const FString& Title, const FString& Body,
        EOAVNotificationType Type, float Duration = 5.0f);

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void ToggleSettings();

    UFUNCTION(BlueprintCallable, Category = "OAV|UI")
    void ToggleMinimap();

private:
    UPROPERTY()
    UWBP_DashboardOverlay* DashboardOverlay;

    UPROPERTY()
    UWBP_AgentDetailPanel* AgentDetailPanel;

    UPROPERTY()
    UWBP_CommandPalette* CommandPalette;

    UPROPERTY()
    UWBP_Minimap* Minimap;

    UPROPERTY()
    UWBP_NotificationStack* NotificationStack;

    UPROPERTY()
    UWBP_SettingsPanel* SettingsPanel;
};
```

### 7.2 HUD Elements (World-Space and Screen-Space)

#### Agent Tooltips (World-Space)

When the user hovers over an agent in the 3D world (line trace from cursor), a tooltip appears above the agent.

**Widget:** `WBP_AgentTooltip`

```
┌─────────────────────────────────────┐
│  [Role Icon]  Agent Name            │
│  Role: Researcher                   │
│  Framework: LangChain               │
│  ─────────────────────────          │
│  Status: ██████░░░░ Working (67%)   │
│  XP: 2,450 / 3,000  [Level 7]      │
│  Tasks Today: 14 completed          │
│  Cost: $0.34                        │
│  Uptime: 4h 23m (streak)           │
└─────────────────────────────────────┘
```

- Attached to agent via `UWidgetComponent` (world space)
- Billboard rotation: always faces the camera
- Fades in/out over 0.2s
- LOD-aware: only shown for agents within 15m of camera

#### Overhead Status Display (World-Space, Always Visible)

Every agent has a persistent overhead display visible at medium distances.

**Widget:** `WBP_AgentOverhead`

```
       ★ Level 7
   [Agent Name]
  ████████░░  (XP bar)
    [Status Icon]
```

- Height: 30cm above agent's head
- Text size scales inversely with distance (always readable)
- Status icon: colored circle (green/blue/red/yellow/grey matching agent state)
- XP bar: thin horizontal bar, fill color matches Design System progression colors
- Level star: gold star with level number; upgrades visually at milestone levels

### 7.3 Agent Detail Panel (`WBP_AgentDetailPanel`)

Slides in from the right side of the screen when an agent is selected (click or orbital focus).

**Layout (400px wide, full height):**

```
┌──────────────────────────────────────┐
│  ✕ Close                             │
│                                      │
│  ┌────────────────────────────────┐  │
│  │   [3D Agent Render]            │  │
│  │   (Scene capture of agent)     │  │
│  │   Name: Research-Agent-042     │  │
│  │   Role: Researcher             │  │
│  │   Framework: LangChain         │  │
│  └────────────────────────────────┘  │
│                                      │
│  ── Performance ──────────────────   │
│  Level: 7 (Expert)                   │
│  XP: 2,450 / 3,000                  │
│  [████████████████░░░░] 81.6%       │
│  Tasks Completed: 147                │
│  Success Rate: 94.2%                 │
│  Avg Response Time: 3.2s            │
│                                      │
│  ── Cost ─────────────────────────   │
│  Total Cost: $12.47                  │
│  Cost/Task: $0.085                   │
│  Token Efficiency: 87%              │
│  [Line chart: cost over last 24h]   │
│                                      │
│  ── Current Task ────────────────   │
│  Task: "Analyze Q4 report data"     │
│  Progress: 67%                       │
│  Tokens Used: 1,240 / 2,000        │
│  Duration: 4m 12s                    │
│                                      │
│  ── Achievements ────────────────   │
│  [Badge] [Badge] [Badge] [Badge]    │
│  [Badge] [Badge] +3 more            │
│                                      │
│  ── Recent Events ───────────────   │
│  12:34:02  Task started              │
│  12:34:05  LLM call (GPT-4o)        │
│  12:34:08  Tool: web_search          │
│  12:34:12  LLM call (GPT-4o)        │
│  12:34:15  Error: timeout            │
│  12:34:16  Retry: LLM call          │
│                                      │
│  [View Full History] [Replay]       │
└──────────────────────────────────────┘
```

**Animation:** Slides from x=100% to x=0 over 0.3s with ease-out-cubic. The 3D world viewport narrows to accommodate (no overlap).

### 7.4 Dashboard Overlay (`WBP_DashboardOverlay`)

Full-screen semi-transparent overlay showing aggregate metrics. Toggled with `D` key.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  DASHBOARD                                          [✕ Close] │
│  (Semi-transparent black background, 80% opacity)            │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ Active: 47  │ │ Tasks/min:  │ │ Error Rate: │ │ Cost:  │ │
│  │ agents      │ │ 12.3        │ │ 2.1%        │ │ $4.23  │ │
│  │ ↑3 from 1h  │ │ ↑15% from 1h│ │ ↓0.5% from 1h│ │ $47/day│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Line chart: agent activity over last 24 hours]       │  │
│  │  X: time, Y: active agent count, overlaid: error rate  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────┐ ┌────────────────────────────┐  │
│  │  [Bar chart: top 10    │ │ [Pie chart: cost by        │  │
│  │   agents by XP]        │ │  agent role]               │  │
│  └────────────────────────┘ └────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Alert Feed: last 20 alerts, scrollable]              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Charts in UMG:** UMG does not have native charting widgets. Charts are rendered using one of:

1. **Procedural UMG drawing:** Custom `UUserWidget` with `OnPaint` override using `FSlateDrawElement` to draw lines, bars, and areas directly on the widget canvas. This is the lightest approach.

2. **Render Target from web:** For complex charts, a hidden Chromium Embedded Framework (CEF) browser widget renders Recharts/ECharts, and the output is captured as a texture. This reuses the existing web dashboard's chart code.

**Recommended approach:** Option 1 for simple KPI cards and sparklines, Option 2 for complex time-series charts. The CEF approach avoids re-implementing chart libraries in C++/Blueprint.

### 7.5 Command Palette (`WBP_CommandPalette`)

Opened with backtick (`` ` ``) key. A fuzzy-search command bar similar to VS Code's Ctrl+P.

**Features:**
- Text input with auto-complete suggestions
- Search agents by name, role, or framework
- Run commands: "focus [agent]", "dashboard", "toggle gamification", "settings", "replay [session]"
- Filter agents: "show errors", "show idle", "show role:researcher"
- Navigation: "go to lobby", "go to server room", "go to meeting room 2"
- Fuzzy matching: typing "res" matches "Research-Agent-042" and "show researchers"

**Implementation:**

```cpp
// CommandPaletteEntry.h
USTRUCT(BlueprintType)
struct FOAVCommandEntry
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly)
    FString DisplayText;

    UPROPERTY(BlueprintReadOnly)
    FString Category; // "Agent", "Navigation", "View", "Setting"

    UPROPERTY(BlueprintReadOnly)
    FString IconPath;

    // Action to execute when selected
    UPROPERTY()
    FString ActionId;

    // Fuzzy match score (calculated on input change)
    float MatchScore = 0.0f;
};
```

### 7.6 Achievement Notifications

Achievement notifications combine screen-space UI with world-space VFX.

**Sequence:**

1. **Screen-space:** A notification toast slides in from the top-right:
```
┌─────────────────────────────────────┐
│  ★ Achievement Unlocked!             │
│  [Badge Icon]  "First Blood"        │
│  Agent Research-042 completed their  │
│  first task with Perfect quality.    │
│  +250 XP                            │
└─────────────────────────────────────┘
```
- Duration: 5 seconds, then slides out
- Stacks vertically if multiple achievements fire simultaneously

2. **World-space:** Simultaneously, `NS_OAV_AchievementUnlock` plays on the agent (see Section 4.8)

3. **Audio:** Achievement fanfare sound (MetaSound sting, 1.5s, spatialized to agent location)

### 7.7 Settings Panel (`WBP_SettingsPanel`)

Full-screen overlay (similar to dashboard overlay) with categorized settings.

**Categories:**

| Category | Settings |
|----------|---------|
| **Display** | Resolution, window mode, V-Sync, frame rate cap, HDR toggle |
| **Graphics** | Quality preset (Low/Medium/High/Ultra), shadow quality, post-process quality, Lumen on/off, Nanite on/off |
| **Gamification** | Enable/disable gamification overlay, professional mode toggle, XP bar visibility, achievement notifications |
| **Audio** | Master volume, ambient volume, notification volume, agent audio volume, spatial audio toggle |
| **Camera** | Mouse sensitivity, invert Y, FOV per mode, cinematic letterbox toggle |
| **Accessibility** | Color blind mode (deuteranopia, protanopia, tritanopia), high contrast UI, increased font size, reduced motion (disables particles and screen shake) |
| **Network** | Server URL, auth token, reconnect behavior, event buffer size |
| **VR** | Locomotion type (teleport/smooth), comfort vignette, seated/standing mode, controller handedness |

### 7.8 Minimap Widget

See Section 6.4 for the minimap specification. The minimap is a `UUserWidget` that uses a `USceneCaptureComponent2D` positioned above the office at 50m height, rendering a top-down orthographic view to a 512x512 render target. Agent dots and labels are overlaid in UMG.

---

## 8. Gamification in 3D

### 8.1 XP Bar and Level Display

Every agent has a 3D overhead widget (`WBP_AgentOverhead`) showing their XP bar and level, as described in Section 7.2.

**XP Bar Behavior:**
- Fill percentage: `CurrentXP / XPRequiredForNextLevel`
- Fill color: gradient from the Design System token `--color-progression-start` (#3B82F6) to `--color-progression-end` (#8B5CF6)
- When XP is gained, the bar animates a "fill pulse": the new fill region flashes bright white, then settles to the gradient color over 0.5s
- Fill animation: smooth lerp over 0.3s, never jumps

**Level Badge:**
- Displayed as a small 3D mesh attached to the agent's chest socket
- Badge shape evolves with progression tier:

| Level Range | Tier Name | Badge Shape | Badge Material |
|------------|-----------|-------------|----------------|
| 1-4 | Rookie | Circle | Bronze (#CD7F32) |
| 5-9 | Specialist | Pentagon | Silver (#C0C0C0) |
| 10-14 | Expert | Hexagon | Gold (#FFD700) |
| 15-19 | Master | Star (5-point) | Platinum (#E5E4E2) with shimmer |
| 20+ | Legend | Star (8-point) with glow | Diamond (translucent, refractive, Niagara sparkle aura) |

### 8.2 Achievement Trophy Case (Lobby)

**Physical Object:** A glass display cabinet in the lobby zone, 3m wide, 2.5m tall, with 5 shelves.

**3D Trophy Meshes:**

Each achievement category has a distinct trophy model:

| Achievement Category | Trophy Mesh | Description |
|---------------------|------------|------------|
| First Steps | Small cup | Bronze trophy cup on a base |
| Performance | Winged shoe | Speed/efficiency achievements |
| Reliability | Shield | Uptime streak achievements |
| Collaboration | Handshake statue | Multi-agent coordination achievements |
| Cost Efficiency | Piggy bank | Under-budget achievements |
| Innovation | Light bulb | Novel task completion, first-of-kind |
| Mastery | Crown | Level milestones, prestige |
| Team | Group statue | Team-level achievements |

**Implementation:**

```cpp
// BP_TrophyCase.h — Blueprint Actor
UCLASS(Blueprintable)
class ABP_TrophyCase : public AActor
{
    GENERATED_BODY()

public:
    // Called when a new achievement is unlocked workspace-wide
    UFUNCTION(BlueprintCallable, Category = "OAV|Gamification")
    void AddTrophy(const FString& AchievementId, const FString& AgentName);

    // Trophy slot transforms (5 shelves x 8 positions = 40 slots)
    UPROPERTY(EditAnywhere, Category = "OAV|Gamification")
    TArray<FTransform> TrophySlots; // 40 entries

    // Map: AchievementId → static mesh asset
    UPROPERTY(EditAnywhere, Category = "OAV|Gamification")
    TMap<FString, TSoftObjectPtr<UStaticMesh>> TrophyMeshMap;

private:
    // Instanced meshes for placed trophies
    UPROPERTY()
    TArray<UStaticMeshComponent*> PlacedTrophies;

    int32 NextAvailableSlot = 0;
};
```

When a new trophy is added:
1. Trophy mesh spawns at the designated slot with a scale-up animation (0→1 over 0.5s, ease-out-back bounce)
2. Spotlight above the slot illuminates
3. A small nameplate UMG widget appears below the trophy with the agent name and achievement date
4. `NS_OAV_GoldenSparkles` plays around the trophy for 3 seconds

### 8.3 Leaderboard Holographic Display (Lobby)

A floor-to-ceiling holographic display in the lobby showing the top 10 agents by XP.

**Visual Design:**
- Translucent blue holographic material with scanline effect
- Each agent entry shows: rank number, agent avatar thumbnail, name, XP, level badge
- Animated bar graph next to each entry (bar width = XP)
- The #1 agent has a golden glow and crown icon
- Entries animate when rankings change (sliding up/down with position swap)
- Updated every 5 seconds from the backend leaderboard API

**Implementation:**
- `WBP_HologramLeaderboard` rendered to a `UTextureRenderTarget2D`
- Applied to a flat plane mesh with `MI_Hologram` material (additive blend, scanline post-process, slight flicker)
- Plane mesh positioned vertically in the lobby (2m wide, 3m tall)
- UMG widget binds to `UOAVMetricStore` leaderboard data

### 8.4 Agent Visual Evolution

As agents progress through tiers, their 3D model visually upgrades. This is NOT a mesh swap (which would be expensive and jarring). Instead, it is a layered accessory and material system.

**Evolution Visual Changes:**

| Tier | Visual Upgrades Applied |
|------|------------------------|
| **Rookie (1-4)** | Base model, no accessories, matte material, basic desk |
| **Specialist (5-9)** | +Headphones accessory, slightly shinier material (metallic +0.1), +1 desk decoration (plant) |
| **Expert (10-14)** | +Badge glows, emissive trim lines on clothing, dual monitor desk, +2 desk decorations |
| **Master (15-19)** | +Particle aura (subtle, 10 gold particles orbiting), premium desk mesh, animated desk toy, emissive eyes |
| **Legend (20+)** | +Full golden particle aura (50 particles), crown accessory, executive desk, holographic name plate, custom walk animation (confident stride) |

**Implementation:** Each tier upgrade is an `FAgentTierVisualConfig` struct applied via `ApplyAppearance()`:

```cpp
USTRUCT(BlueprintType)
struct FOAVTierVisualConfig
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere)
    TArray<TSoftObjectPtr<UStaticMesh>> Accessories;

    UPROPERTY(EditAnywhere)
    float MaterialMetallic = 0.0f;

    UPROPERTY(EditAnywhere)
    float MaterialEmissiveIntensity = 0.0f;

    UPROPERTY(EditAnywhere)
    FLinearColor EmissiveTrimColor = FLinearColor::Black;

    UPROPERTY(EditAnywhere)
    UNiagaraSystem* AuraParticleSystem = nullptr;

    UPROPERTY(EditAnywhere)
    TSoftObjectPtr<UStaticMesh> DeskMesh;

    UPROPERTY(EditAnywhere)
    TArray<TSoftObjectPtr<UStaticMesh>> DeskDecorations;

    UPROPERTY(EditAnywhere)
    UAnimMontage* CustomWalkMontage = nullptr;
};
```

### 8.5 Office Upgrades Tied to Team Performance

As the overall team XP grows, the office environment itself upgrades, providing a shared sense of progress.

| Team XP Milestone | Office Upgrade |
|------------------|---------------|
| 10,000 XP | Plants appear in the open floor (potted ferns on desks) |
| 25,000 XP | Art appears on walls (framed abstract paintings) |
| 50,000 XP | Lobby gets a water fountain feature |
| 100,000 XP | Meeting rooms get upgraded furniture (leather chairs) |
| 250,000 XP | Server room gets a holographic data globe |
| 500,000 XP | Rooftop terrace unlocks a lounge area with string lights |
| 1,000,000 XP | The entire office gets a "premium" material pass (marble floors, wood trim, upgraded lighting) |

These upgrades are cosmetic and persist across sessions (stored in the backend's workspace settings).

### 8.6 Celebration Sequences

When a significant gamification event occurs, the cinematic camera briefly takes over.

**Level-Up Sequence (3.5 seconds):**

1. Camera smoothly cuts to the leveling-up agent (0.5s transition)
2. Agent stands up from desk (animation montage)
3. Golden light burst from below (Niagara system: upward column of golden particles)
4. Agent rises 20cm off the ground, arms slightly outstretched
5. Level badge materializes and attaches to chest (0.5s)
6. XP bar overhead widget shows the number rolling up to the new level
7. Badge shockwave ring expands outward (Niagara ring emitter, 3m radius)
8. Agent settles back down, sits at desk
9. Camera returns to previous position (0.5s transition)
10. Nearby agents play a brief "clap" montage (additive, 1s)

**Achievement Sequence (2.5 seconds):**
- Shorter than level-up
- Camera does NOT cut unless in Cinematic mode
- World-space VFX plays (see Section 4.8)
- Screen-space notification appears (see Section 7.6)

### 8.7 Quest Board (Physical Object)

A corkboard in the break room showing active quests.

**Visual Design:**
- Physical corkboard mesh (1.5m wide, 1m tall) mounted on a wall
- Quest cards are UMG widgets rendered to mesh planes pinned to the corkboard
- Each card shows: quest name, description, progress bar, reward, time remaining
- Completed quests have a "COMPLETED" stamp overlaid and are greyed out
- New quests appear with a pin-drop animation (card slides down and pins)

### 8.8 Hall of Fame (Manager Office Wall)

A wall of framed portraits in the manager office showing the top performer for each historical period.

**Visual Design:**
- Frame meshes on the wall (5-10 frames visible)
- Each frame contains: agent avatar render (scene capture), name, period ("Week of Mar 10"), top metric
- Golden frame for the current period's leader; silver frames for historical
- New entries added weekly (configurable), old ones shift right

---

## 9. Performance & Optimization

### 9.1 Performance Targets

| Metric | Target | Hard Limit |
|--------|--------|-----------|
| Frame rate | 60fps | Never below 30fps |
| Game thread | < 8ms per frame | < 12ms |
| Render thread | < 8ms per frame | < 12ms |
| GPU frame time | < 12ms per frame | < 16ms |
| Memory (RAM) | < 4GB | < 8GB |
| VRAM | < 4GB | < 6GB |
| Agent count (LOD0) | 20 simultaneous | 30 max |
| Agent count (LOD1) | 40 simultaneous | 60 max |
| Agent count (LOD2) | 100 simultaneous | 200 max |
| Active Niagara systems | 50 simultaneous | 100 max |
| Active GPU particles | 200,000 | 500,000 max |
| WebSocket event throughput | 500 events/sec | 2,000 events/sec |

### 9.2 LOD Strategy

**Agent LOD (described in Section 3.6):**
- 3 mesh LOD levels with automatic transitions based on screen size
- Animation complexity reduces with LOD level
- Particle systems cull based on distance from camera

**Environment LOD:**
- Nanite handles static environment mesh LOD automatically (no manual LOD authoring needed for desks, walls, floors)
- Exception: glass materials and translucent objects are NOT Nanite-compatible; these use manual LOD (meeting room walls, trophy case)

**Widget LOD:**
- Overhead agent widgets (`WBP_AgentOverhead`): full detail < 10m, simplified (name + dot only) 10-20m, hidden > 20m
- Desk monitor widgets: rendered at full resolution < 5m, half resolution 5-10m, static texture > 10m
- In-world holographic displays: always rendered (they are large and purpose-built for distance viewing)

### 9.3 Instanced Rendering

Static office furniture (desks, chairs, shelves, plants, server racks) uses `UInstancedStaticMeshComponent` (ISM) or `UHierarchicalInstancedStaticMeshComponent` (HISM) for efficient batch rendering.

**Instance Groups:**

| Mesh | Expected Count | Rendering Method |
|------|---------------|-----------------|
| Desk | 100-500 | HISM (automatic LOD per instance) |
| Chair | 100-500 | HISM |
| Monitor Stand | 100-500 | HISM |
| Potted Plant | 20-50 | ISM |
| Server Rack | 8-12 | ISM |
| Ceiling Light Panel | 30-60 | ISM |
| Filing Cabinet | 10-20 | ISM |
| Coffee Mug | 100-500 | HISM (tiny mesh, needs aggressive culling) |

**Draw Call Budget:**
- Target: < 2,000 draw calls per frame
- Instanced meshes reduce hundreds of individual meshes to a single draw call each
- With HISM, each instance group is 1 draw call regardless of instance count

### 9.4 Niagara Performance

**GPU Particle Rules:**
- ALL Niagara systems use GPU simulation (never CPU)
- Spawn rate scales with distance from camera:

```cpp
// In each Niagara system's SpawnRate module:
float DistanceToCam = length(ParticleSystemPosition - CameraPosition);
float DistanceFactor = saturate(1.0 - (DistanceToCam - 500.0) / 3000.0); // full at 5m, zero at 35m
SpawnRate = BaseSpawnRate * DistanceFactor;
```

- Systems beyond 50m from camera are deactivated entirely via significance manager
- Maximum simultaneous active Niagara components: 100 (managed by `UNiagaraSignificanceHandler`)

**Per-System Budgets:**

| System | Max Particles | Spawn Rate | GPU Cost |
|--------|--------------|-----------|---------|
| `NS_OAV_DataFlow_Beam` | 200 | 30/s | ~0.05ms |
| `NS_OAV_TokenDrain` | 50 | Burst 50 | ~0.02ms |
| `NS_OAV_CostStream` | 500 (global) | 5/agent/s | ~0.1ms |
| `NS_OAV_Error_Sparks` | 80 | Burst 80 | ~0.03ms |
| `NS_OAV_Confetti` | 2,000 | Burst 2,000 | ~0.2ms |
| `NS_OAV_LoopVortex` | 100 | 100/s | ~0.05ms |
| `NS_OAV_Weather_Rain` | 10,000 | 10,000/s | ~0.3ms |
| `NS_OAV_GoldenSparkles` | 100 | 100/s | ~0.05ms |

**Total worst-case GPU particle cost:** ~1.5ms (well within the 2ms budget)

### 9.5 Occlusion Culling

The office layout naturally creates occlusion opportunities.

**Strategy:**
- Rooms with solid walls (server room, manager office, archive) occlude their contents when the camera is outside
- UE5's software occlusion culling is enabled for the main camera
- Hardware occlusion queries for large objects (server racks, trophy case)
- Meeting rooms with glass walls do NOT occlude (glass is transparent)
- Precomputed visibility volumes for each room (PVS — Potentially Visible Set)

**Custom Occlusion for Agent Actors:**
```cpp
// On each AOAVAgent, check visibility before running expensive updates
void AOAVAgent::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Skip expensive updates if not recently rendered
    if (!WasRecentlyRendered(0.5f)) // not rendered in last 0.5s
    {
        // Reduce tick rate to 2Hz
        if (TimeSinceLastReducedTick < 0.5f)
        {
            TimeSinceLastReducedTick += DeltaTime;
            return;
        }
        TimeSinceLastReducedTick = 0.0f;
    }

    // Full update: state machine, animation params, widget updates
    UpdateStateMachine(DeltaTime);
    UpdateWidgets(DeltaTime);
    UpdateVFX(DeltaTime);
}
```

### 9.6 Texture Streaming and Virtual Textures

**Virtual Textures:** Enabled for all floor and wall materials. This allows the entire office to share a single large virtual texture atlas, reducing material draw calls and memory fragmentation.

**Texture Streaming:**
- All agent textures use streaming (loaded on demand based on distance)
- Mip bias: +1 for agents beyond LOD1 distance (saves ~25% VRAM)
- Desk monitor render targets: resolution scales with distance (512x288 close, 256x144 medium, 128x72 far)

### 9.7 Network Bandwidth Optimization

**Event Batching:**
The UE5 WebSocket client processes events in batches, not individually.

```cpp
// In UOAVWebSocketClient::Tick()
// Process up to 50 events per frame to prevent frame spikes
int32 EventsProcessed = 0;
FString EventJson;
while (EventsProcessed < 50 && EventQueue.Dequeue(EventJson))
{
    EventDispatcher->ProcessEvent(EventJson);
    EventsProcessed++;
}
```

**Delta Updates:**
The client requests delta-only updates from the WebSocket:
- On connect, client sends `{ "mode": "delta", "last_event_id": "..." }`
- Server sends only changed fields, not full agent state
- Typical delta message: 50-200 bytes (vs 2-5KB for full state)

**Estimated Bandwidth:**

| Scenario | Events/sec | Bytes/event | Bandwidth |
|----------|-----------|------------|----------|
| 50 agents, normal activity | 100-200 | 150 | 15-30 KB/s |
| 100 agents, peak activity | 500-1,000 | 150 | 75-150 KB/s |
| 200 agents, sustained | 1,000-2,000 | 150 | 150-300 KB/s |

All well within modern network capabilities.

### 9.8 Scalability Settings

**Presets:**

| Setting | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Lumen GI | Off (baked) | Software | Hardware | Hardware + ray-traced |
| Nanite | Off (manual LOD) | On | On | On |
| Shadow quality | Low (cascaded only) | Medium | High | Ultra (ray-traced) |
| Niagara particle count | 25% | 50% | 100% | 150% |
| Agent LOD distances | 50% closer | Default | Default | 50% farther |
| Post-process | Minimal | Standard | Full | Full + motion blur |
| Render resolution | 75% | 100% | 100% | 100% + DLSS/FSR |
| Weather effects | Off | Simplified | Full | Full + puddles |
| Ambient audio sources | 5 max | 15 max | 30 max | Unlimited |
| Desk monitor resolution | 128x72 | 256x144 | 512x288 | 512x288 |

**Auto-Detection:**
On first launch, the engine runs a GPU benchmark (render a test scene for 2 seconds) and selects the appropriate preset. Users can override manually.

### 9.9 Profiling Instrumentation

**Built-in Profiling Markers:**
Every major system adds UE5 profiling markers for Unreal Insights:

```cpp
// Example: in UOAVEventDispatcher::ProcessEvent
TRACE_CPUPROFILER_EVENT_SCOPE(OAV_ProcessEvent);

// Example: in AOAVAgent::Tick
TRACE_CPUPROFILER_EVENT_SCOPE(OAV_AgentTick);

// Example: in Niagara system update callback
TRACE_CPUPROFILER_EVENT_SCOPE(OAV_NiagaraUpdate);
```

**Custom Stat Groups:**

```cpp
DECLARE_STATS_GROUP(TEXT("OAV"), STATGROUP_OAV, STATCAT_Advanced);
DECLARE_CYCLE_STAT(TEXT("OAV Event Processing"), STAT_OAVEventProcessing, STATGROUP_OAV);
DECLARE_CYCLE_STAT(TEXT("OAV Agent Tick"), STAT_OAVAgentTick, STATGROUP_OAV);
DECLARE_CYCLE_STAT(TEXT("OAV Widget Update"), STAT_OAVWidgetUpdate, STATGROUP_OAV);
DECLARE_DWORD_COUNTER_STAT(TEXT("OAV Active Agents"), STAT_OAVActiveAgents, STATGROUP_OAV);
DECLARE_DWORD_COUNTER_STAT(TEXT("OAV Active Particles"), STAT_OAVActiveParticles, STATGROUP_OAV);
DECLARE_DWORD_COUNTER_STAT(TEXT("OAV Events/Frame"), STAT_OAVEventsPerFrame, STATGROUP_OAV);
```

**Console Commands for Live Debugging:**
```
stat OAV                    — Show all OAV-specific stats
OAV.ShowAgentBounds 1       — Visualize agent bounding boxes
OAV.ShowNiagaraBudget 1     — Show Niagara particle counts per system
OAV.ForceLOD 0/1/2          — Force all agents to a specific LOD
OAV.DisableWeather 1        — Turn off weather particles
OAV.EventLog 1              — Print all WebSocket events to screen
OAV.SimulateAgents 100      — Spawn 100 fake agents for perf testing
```

---

## 10. Pixel Streaming (Web Delivery)

### 10.1 Architecture

Pixel Streaming allows the full UE5 3D experience to be delivered via a web browser with zero client installation. The UE5 application renders on a cloud GPU server and streams the video output to the browser via WebRTC. User input (mouse, keyboard, touch) travels back over the same WebRTC connection.

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLOUD GPU SERVER                           │
│                                                                    │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐ │
│  │  UE5 Application           │  │  Pixel Streaming Plugin     │ │
│  │  (OpenAgentVisualizer)     │──▶│  - Encodes viewport (H.264)│ │
│  │  - Full 3D rendering       │  │  - WebRTC server            │ │
│  │  - Niagara, Lumen, etc.    │  │  - Input receiver           │ │
│  └────────────────────────────┘  └──────────┬──────────────────┘ │
│                                              │                     │
│  ┌───────────────────────────────────────────▼──────────────────┐ │
│  │  Signalling Server (Node.js, built-in)                       │ │
│  │  - WebSocket signalling for WebRTC handshake                 │ │
│  │  - Manages peer connections                                  │ │
│  └───────────────────────────────────────────┬──────────────────┘ │
│                                              │                     │
│  ┌───────────────────────────────────────────▼──────────────────┐ │
│  │  Matchmaker (optional, for multi-instance)                   │ │
│  │  - Routes browser clients to available UE5 instances         │ │
│  │  - Load balancing across GPU pool                            │ │
│  └───────────────────────────────────────────┬──────────────────┘ │
└──────────────────────────────────────────────┼────────────────────┘
                                               │
                                    WebRTC (STUN/TURN)
                                               │
┌──────────────────────────────────────────────▼────────────────────┐
│                         USER'S BROWSER                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Pixel Streaming JS Client (provided by Epic)               │  │
│  │  - Receives H.264/VP8 video stream                          │  │
│  │  - Sends input events (mouse, keyboard, touch, gamepad)     │  │
│  │  - Handles WebRTC connection lifecycle                      │  │
│  │  - <video> element renders the stream                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Custom Overlay UI (HTML/CSS/JS)                            │  │
│  │  - Connection status indicator                              │  │
│  │  - Quality selector (720p / 1080p / 1440p)                  │  │
│  │  - Latency display                                          │  │
│  │  - Fallback link to PixiJS web version                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 UE5 Pixel Streaming Configuration

**Launch Arguments for the UE5 Application:**

```bash
OpenAgentVisualizer.exe \
  -PixelStreamingIP=0.0.0.0 \
  -PixelStreamingPort=8888 \
  -RenderOffscreen \
  -ForceRes \
  -ResX=1920 \
  -ResY=1080 \
  -GraphicsAdapter=0 \
  -AudioMixer \
  -PixelStreamingEncoderCodec=H264 \
  -PixelStreamingEncoderTargetBitrate=15000000 \
  -PixelStreamingEncoderMinQP=18 \
  -PixelStreamingEncoderMaxQP=36 \
  -PixelStreamingEncoderRateControl=CBR \
  -PixelStreamingEncoderKeyframeInterval=300
```

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Encoder Codec | H.264 | Broadest browser compatibility (Safari, Chrome, Firefox, Edge) |
| Target Bitrate | 15 Mbps | High quality for 1080p; adjustable per client bandwidth |
| Min QP / Max QP | 18 / 36 | Quality bounds: never worse than QP 36, never overkill below QP 18 |
| Rate Control | CBR | Constant bitrate prevents bandwidth spikes that cause buffering |
| Keyframe Interval | 300 frames (5s at 60fps) | Balance between seek/recovery speed and compression efficiency |
| Audio | Opus codec via WebRTC | Spatial audio is mixed to stereo before encoding |

### 10.3 Latency Targets and Optimization

**End-to-End Latency Budget:**

| Stage | Target | Notes |
|-------|--------|-------|
| Input transmission (browser → server) | < 20ms | WebRTC DataChannel, low overhead |
| Input processing (UE5 game thread) | < 8ms | Single frame game thread budget |
| Render (GPU) | < 12ms | Single frame GPU budget |
| Encode (NVENC/AMF) | < 5ms | Hardware encoder, zero-copy from GPU |
| Network transmission (server → browser) | < 30ms | Depends on geographic proximity |
| Decode (browser) | < 5ms | Hardware decode in browser |
| Display | < 8ms | Next vsync |
| **Total** | **< 88ms** | **Target: < 100ms perceived** |

**Latency Reduction Techniques:**
- **NVENC zero-copy encode:** The UE5 render target is encoded directly from GPU memory without CPU readback
- **WebRTC DataChannel for input:** Lower latency than HTTP for input events
- **Adaptive bitrate:** If the client detects buffering, bitrate reduces automatically
- **Region-local deployment:** GPU servers deployed in same cloud region as majority of users (see Section 10.5)
- **Frame pipelining:** UE5 renders frame N while encoding frame N-1

### 10.4 Scaling Strategy

**Option A: One Instance Per User (Recommended for initial launch)**

Each browser session gets a dedicated UE5 instance on a GPU. This provides full interactivity — the user controls the camera, selects agents, opens panels, etc.

**Pros:** Full interactivity, isolated state, simple architecture.
**Cons:** Expensive. Each user requires one GPU.

**Capacity per GPU:**

| GPU | UE5 Instances (1080p 60fps) | Monthly Cost (AWS) |
|-----|---------------------------|-------------------|
| NVIDIA T4 (AWS g4dn) | 1-2 instances | ~$525/mo (g4dn.xlarge) |
| NVIDIA A10G (AWS g5) | 2-3 instances | ~$1,010/mo (g5.xlarge) |
| NVIDIA A100 (AWS p4d) | 4-6 instances | ~$24,000/mo (overkill) |
| NVIDIA L4 (AWS g6) | 2-4 instances | ~$650/mo (g6.xlarge) |

**Recommended:** AWS g5.xlarge (1x A10G, 24GB VRAM) supporting 2 concurrent users at $1,010/month per GPU.

**Option B: Shared Instance (Spectator Mode)**

Multiple browser clients view the same UE5 instance. One user has camera control; others are spectators. Cheaper but limited interaction.

**Use case:** Executive dashboard mode where a team views the same agent visualization on a shared display.

### 10.5 Cost Analysis

**Comparison: Pixel Streaming vs. Traditional Web Hosting**

| Metric | PixiJS Web Client | UE5 Pixel Streaming |
|--------|-------------------|---------------------|
| Server cost per user | ~$0.01/hour (static hosting + API) | ~$0.70/hour (GPU instance) |
| Client hardware required | Any browser | Any browser |
| Visual fidelity | 2D sprite-based, limited particles | Full 3D, Lumen, Niagara, spatial audio |
| Max concurrent users (same budget) | 10,000+ | 50-100 (on g5 fleet) |
| Latency | <1ms (local rendering) | 50-100ms (network + encode) |
| Offline capability | Service Worker cache | None (requires active connection) |

**Pricing Tier Implication:**
Pixel Streaming is reserved for Enterprise tier ($299+/month per seat) where the visual fidelity justifies the GPU cost. The breakeven at 2 users per GPU is $1,010 / 2 = $505/month per user in GPU costs, which the Enterprise tier must cover.

### 10.6 Fallback to Web Version

When Pixel Streaming is unavailable (no GPU capacity, high latency, mobile device on cellular), the system falls back to the PixiJS web client.

**Fallback Logic (in the web frontend):**

```javascript
async function connectToVisualization(workspaceId, userTier) {
  if (userTier === 'enterprise' || userTier === 'pro') {
    try {
      const stream = await PixelStreamingClient.connect({
        signallingUrl: `wss://stream.oav.example.com/ws/${workspaceId}`,
        timeout: 5000, // 5s connection timeout
      });
      if (stream.latency > 150) {
        console.warn('High latency detected, offering fallback');
        showFallbackPrompt();
      }
      return stream;
    } catch (err) {
      console.warn('Pixel Streaming unavailable, falling back to web');
      return initPixiJSClient(workspaceId);
    }
  }
  return initPixiJSClient(workspaceId);
}
```

### 10.7 Touch Input Support

For tablet users accessing Pixel Streaming:

| Touch Gesture | Mapped Action |
|--------------|--------------|
| Single tap | Select agent (left click) |
| Double tap | Focus/orbit agent |
| Two-finger drag | Pan camera (WASD equivalent) |
| Pinch zoom | Camera altitude / orbital distance |
| Two-finger rotate | Camera yaw |
| Swipe from right edge | Open agent detail panel |
| Swipe from left edge | Open command palette |
| Three-finger tap | Toggle dashboard overlay |
| Long press | Context menu on agent |

**Implementation:** The Pixel Streaming JS client translates touch events to virtual mouse/keyboard events before sending them over WebRTC. Custom touch mapping is configured in the HTML overlay layer.

---

## 11. VR & XR Support

### 11.1 OpenXR Integration

The UE5 application supports VR via the OpenXR plugin, which provides a single abstraction layer across headsets.

**Supported Headsets (tested):**

| Headset | Connection | Target FPS | Render Resolution |
|---------|-----------|-----------|------------------|
| Meta Quest 3 | Link cable or Air Link | 72fps | 2064x2208 per eye |
| Meta Quest Pro | Link cable or Air Link | 72fps | 1800x1920 per eye |
| Valve Index | SteamVR (wired) | 90fps (120 optional) | 1440x1600 per eye |
| HTC Vive Pro 2 | SteamVR (wired) | 90fps | 2448x2448 per eye |
| HP Reverb G2 | WMR/SteamVR | 90fps | 2160x2160 per eye |
| Apple Vision Pro | (future, via OpenXR if available) | 90fps | TBD |

**VR Entry Point:**
- UE5 detects connected VR headset on launch via OpenXR runtime
- If headset detected and VR mode enabled in settings, the application initializes in VR mode
- If no headset, the application starts in desktop mode (no VR code path executes)
- Users can toggle VR mode at runtime via Settings panel (requires headset connected)

### 11.2 VR Player Pawn (`BP_OAV_VRPawn`)

```cpp
// OAVVRPawn.h
UCLASS(Blueprintable)
class OPENAGENTVISUALIZER_API AOAVVRPawn : public APawn
{
    GENERATED_BODY()

public:
    AOAVVRPawn();

    // Root component for tracking space
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    USceneComponent* VROrigin;

    // Camera (follows HMD)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UCameraComponent* VRCamera;

    // Motion controllers
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UMotionControllerComponent* LeftController;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UMotionControllerComponent* RightController;

    // Controller meshes (visual representation of controllers in-world)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* LeftControllerMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* RightControllerMesh;

    // Laser pointer for agent selection (right controller)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UNiagaraComponent* LaserPointer;

    // Teleport arc for locomotion (left controller)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    USplineComponent* TeleportArc;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* TeleportTarget; // circle on the floor

    // Interaction
    UFUNCTION(BlueprintCallable, Category = "OAV|VR")
    void GrabAgent(AOAVAgent* Agent); // Pick up agent for inspection

    UFUNCTION(BlueprintCallable, Category = "OAV|VR")
    void ReleaseAgent();

    UFUNCTION(BlueprintCallable, Category = "OAV|VR")
    void PointAtMetric(UWidgetComponent* Widget); // Highlight and enlarge

    // Grabbed agent (held in front of VR user for inspection)
    UPROPERTY(BlueprintReadOnly)
    AOAVAgent* GrabbedAgent = nullptr;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    // Teleport logic
    bool bIsTeleporting = false;
    FVector TeleportDestination;

    void PerformTeleport();
    void UpdateTeleportArc(float DeltaTime);

    // Smooth locomotion (alternative to teleport)
    void SmoothMove(const FVector2D& Input);
    float SmoothMoveSpeed = 200.0f; // cm/s

    // Comfort vignette
    UPROPERTY(EditDefaultsOnly)
    UMaterialInterface* VignettePostProcess;

    void UpdateComfortVignette(float MovementSpeed);
};
```

### 11.3 VR Interactions

**Agent Selection (Right Controller Laser):**
1. Point right controller at an agent
2. Laser beam (Niagara ribbon) extends from controller to the hit point
3. When laser hits an agent, the agent's overhead widget enlarges (1.5x scale)
4. Press trigger to select: agent detail panel appears as a floating UMG widget pinned to the user's left hand
5. Hold grip to "grab" the agent: the agent avatar lifts from their desk and floats in front of the user for close inspection (all detail is LOD0, metrics panel visible)
6. Release grip: agent returns to desk

**Metric Panel Interaction (Left Controller):**
1. Press left trigger to summon the dashboard as a floating panel at arm's distance
2. Panel tracks left controller position with a slight lag (spring follow)
3. Point right controller at chart elements to get tooltips
4. Flick left stick to cycle between dashboard tabs
5. Press left grip to "pin" the panel in world space (detaches from controller)
6. Pinned panels remain where placed until dismissed

**Gesture Controls:**
| Gesture | Action |
|---------|--------|
| Right trigger press | Select agent / confirm |
| Right grip hold | Grab agent for inspection |
| Left trigger press | Summon/dismiss dashboard panel |
| Left grip press | Pin/unpin floating panel |
| Right stick up/down | Zoom (move closer/farther from pointed direction) |
| Left stick | Teleport aim (hold) / Smooth move (option) |
| Left stick click | Toggle between teleport and smooth locomotion |
| Both grips squeeze | Reset view (recenter VR origin) |
| Menu button | Open settings |

### 11.4 VR Comfort Settings

**Locomotion Options:**
- **Teleport (default):** Point left controller, arc trajectory shows landing zone, release to teleport. Instantaneous with a brief screen flash (50ms fade to black, 50ms fade in).
- **Smooth locomotion:** Left stick moves the player pawn continuously. Comfort vignette darkens peripheral vision proportional to movement speed.
- **Snap turn:** Right stick left/right rotates view in 30/45/60 degree increments (configurable). No smooth rotation to prevent nausea.
- **Smooth turn (option):** Right stick continuously rotates. Disabled by default.

**Comfort Vignette:**
When the user is in smooth locomotion, a post-process vignette darkens the screen edges. Intensity scales from 0 (stationary) to 0.6 (full speed). This reduces motion sickness by removing peripheral optic flow.

```cpp
void AOAVVRPawn::UpdateComfortVignette(float MovementSpeed)
{
    float NormalizedSpeed = FMath::Clamp(MovementSpeed / SmoothMoveSpeed, 0.0f, 1.0f);
    float VignetteIntensity = NormalizedSpeed * MaxVignetteIntensity; // MaxVignetteIntensity = 0.6

    if (VignettePostProcessDynamic)
    {
        VignettePostProcessDynamic->SetScalarParameterValue(
            TEXT("VignetteRadius"), FMath::Lerp(1.0f, 0.4f, VignetteIntensity));
        VignettePostProcessDynamic->SetScalarParameterValue(
            TEXT("VignetteSoftness"), 0.3f);
    }
}
```

**Seated vs Standing Mode:**
- **Standing:** Full room-scale tracking. User walks physically in tracked space.
- **Seated:** Camera height is offset to simulate standing eye height (adjustable). All locomotion is controller-based.

### 11.5 Mixed Reality Potential

Future-facing architecture for MR/AR headsets (Quest 3 passthrough, Apple Vision Pro):

**Concept:** Overlay agent data on the user's physical office. Agents appear as AR characters sitting at physical desks. Metrics float as holograms anchored to real-world positions.

**Technical Requirements:**
- Quest 3 passthrough API (Meta XR SDK)
- Scene mesh anchors for placing virtual objects on physical surfaces
- Color passthrough with correct occlusion (virtual objects behind physical objects)
- Persistent anchors for saving agent positions across sessions

**Implementation Status:** Architecture-ready (OpenXR abstraction layer supports passthrough extensions), but not implemented in MVP. Flagged as a v2 feature.

### 11.6 Hand Tracking

For headsets that support hand tracking (Quest 3, Quest Pro):

**Supported Gestures:**

| Hand Gesture | Action |
|-------------|--------|
| Point (index finger extended) | Laser pointer for selection |
| Pinch (thumb + index) | Grab / select |
| Open palm (facing up) | Summon dashboard |
| Fist (close hand) | Dismiss current panel |
| Thumbs up | Acknowledge notification |
| Two-hand spread | Zoom into area between hands |

**Implementation:** Uses UE5's Hand Tracking plugin with `UOpenXRHandTrackingComponent`. Gesture recognition is implemented as a state machine monitoring joint angles:

```cpp
// Pinch detection
bool IsPinching(const FXRHandJointData& HandData)
{
    float ThumbTipToIndexTip = FVector::Distance(
        HandData.GetJointPosition(EXRHandJoint::ThumbTip),
        HandData.GetJointPosition(EXRHandJoint::IndexTip)
    );
    return ThumbTipToIndexTip < 2.0f; // 2cm threshold
}
```

---

## 12. Build & Deployment

### 12.1 UE5 Project Structure

```
OpenAgentVisualizer_UE5/
├── OpenAgentVisualizer.uproject          — Project descriptor
├── Config/
│   ├── DefaultEngine.ini                 — Engine settings (rendering, physics, audio)
│   ├── DefaultGame.ini                   — Game settings (default map, project info)
│   ├── DefaultInput.ini                  — Input bindings (Enhanced Input)
│   ├── DefaultScalability.ini            — Scalability presets (Low/Med/High/Ultra)
│   └── DefaultPixelStreaming.ini         — Pixel Streaming configuration
├── Content/
│   ├── Maps/
│   │   ├── MainOffice.umap              — Primary level
│   │   ├── MainOffice_Lobby.umap         — Sub-level (World Partition)
│   │   ├── MainOffice_OpenFloor.umap     — Sub-level
│   │   ├── MainOffice_ServerRoom.umap    — Sub-level
│   │   └── MainOffice_Rooftop.umap       — Sub-level
│   ├── Characters/
│   │   ├── Agent/
│   │   │   ├── SK_OAV_Agent.uasset       — Skeletal mesh
│   │   │   ├── SK_OAV_Agent_Skeleton.uasset — Skeleton asset
│   │   │   ├── ABP_OAV_Agent.uasset      — Animation Blueprint
│   │   │   ├── Animations/
│   │   │   │   ├── A_Seated_Breathing.uasset
│   │   │   │   ├── A_Seated_Typing.uasset
│   │   │   │   ├── A_Seated_ChinScratch.uasset
│   │   │   │   ├── A_Seated_Distressed.uasset
│   │   │   │   ├── A_Seated_FranticTyping.uasset
│   │   │   │   ├── A_Seated_Slumped.uasset
│   │   │   │   ├── A_Seated_TurnToFace.uasset
│   │   │   │   ├── A_Seated_Gesture_Talk.uasset
│   │   │   │   ├── A_Standing_FistPump.uasset
│   │   │   │   ├── A_Standing_Walk.uasset
│   │   │   │   ├── A_Standing_SlumpFade.uasset
│   │   │   │   ├── AM_LevelUp.uasset     — Montage
│   │   │   │   ├── AM_AchievementUnlock.uasset
│   │   │   │   ├── AM_Spawn.uasset
│   │   │   │   └── BS_Locomotion.uasset   — Blend Space 1D
│   │   │   ├── Materials/
│   │   │   │   ├── MI_Agent_Base.uasset
│   │   │   │   ├── MI_Agent_Ghost.uasset  — Dissolve material
│   │   │   │   └── MI_Agent_Glow.uasset   — Status glow overlay
│   │   │   └── Accessories/
│   │   │       ├── SM_Hat_Crown.uasset
│   │   │       ├── SM_Headphones.uasset
│   │   │       ├── SM_Badge_Bronze.uasset
│   │   │       ├── SM_Badge_Silver.uasset
│   │   │       ├── SM_Badge_Gold.uasset
│   │   │       ├── SM_Badge_Platinum.uasset
│   │   │       └── SM_Badge_Diamond.uasset
│   ├── Environment/
│   │   ├── Furniture/
│   │   │   ├── SM_Desk_Standard.uasset
│   │   │   ├── SM_Desk_Executive.uasset
│   │   │   ├── SM_Chair_Standard.uasset
│   │   │   ├── SM_Chair_Executive.uasset
│   │   │   ├── SM_Monitor_Single.uasset
│   │   │   ├── SM_Monitor_Dual.uasset
│   │   │   ├── SM_ServerRack.uasset
│   │   │   ├── SM_CoffeeMug.uasset
│   │   │   └── ... (30+ furniture meshes)
│   │   ├── Architecture/
│   │   │   ├── SM_Wall_Panel.uasset
│   │   │   ├── SM_Floor_Tile.uasset
│   │   │   ├── SM_Ceiling_Panel.uasset
│   │   │   ├── SM_Glass_Wall.uasset
│   │   │   ├── SM_Door.uasset
│   │   │   ├── SM_Window.uasset
│   │   │   └── SM_Elevator.uasset
│   │   ├── Decorations/
│   │   │   ├── SM_Plant_Fern.uasset
│   │   │   ├── SM_Plant_Succulent.uasset
│   │   │   ├── SM_Painting_Abstract_01.uasset
│   │   │   ├── SM_Trophy_Cup.uasset
│   │   │   ├── SM_Trophy_Shield.uasset
│   │   │   └── ... (20+ decoration meshes)
│   │   └── Materials/
│   │       ├── M_OAV_Master.uasset       — Master material
│   │       ├── MI_Wood.uasset
│   │       ├── MI_Metal.uasset
│   │       ├── MI_Glass.uasset
│   │       ├── MI_Fabric.uasset
│   │       ├── MI_Screen.uasset
│   │       ├── MI_Floor.uasset
│   │       ├── MI_Hologram.uasset
│   │       └── MPC_TimeOfDay.uasset      — Material Parameter Collection
│   ├── VFX/
│   │   ├── NS_OAV_DataFlow_Beam.uasset
│   │   ├── NS_OAV_TokenDrain.uasset
│   │   ├── NS_OAV_CostStream.uasset
│   │   ├── NS_OAV_Error_Sparks.uasset
│   │   ├── NS_OAV_Confetti.uasset
│   │   ├── NS_OAV_Fireworks.uasset
│   │   ├── NS_OAV_GoldenSparkles.uasset
│   │   ├── NS_OAV_LoopVortex.uasset
│   │   ├── NS_OAV_AchievementUnlock.uasset
│   │   ├── NS_OAV_Weather_Rain.uasset
│   │   ├── NS_OAV_ZZZ_Sleep.uasset
│   │   ├── NS_OAV_Sweat.uasset
│   │   └── Materials/
│   │       ├── MI_DataOrb.uasset
│   │       ├── MI_DataTrail.uasset
│   │       ├── MI_SplineGlow.uasset
│   │       ├── MI_BarGlow.uasset
│   │       ├── MI_CostMeter.uasset
│   │       └── MI_WarningRing.uasset
│   ├── UI/
│   │   ├── Widgets/
│   │   │   ├── WBP_AgentTooltip.uasset
│   │   │   ├── WBP_AgentOverhead.uasset
│   │   │   ├── WBP_AgentDetailPanel.uasset
│   │   │   ├── WBP_DashboardOverlay.uasset
│   │   │   ├── WBP_CommandPalette.uasset
│   │   │   ├── WBP_Minimap.uasset
│   │   │   ├── WBP_NotificationStack.uasset
│   │   │   ├── WBP_SettingsPanel.uasset
│   │   │   ├── WBP_LeaderboardDisplay.uasset
│   │   │   ├── WBP_CostMeter.uasset
│   │   │   ├── WBP_AgentDeskMonitor.uasset
│   │   │   ├── WBP_ServerRackDisplay.uasset
│   │   │   ├── WBP_MeetingRoomBoard.uasset
│   │   │   ├── WBP_ManagerDashboard.uasset
│   │   │   ├── WBP_TimelineDisplay.uasset
│   │   │   └── WBP_HologramLeaderboard.uasset
│   │   └── Fonts/
│   │       ├── F_Inter_Regular.uasset
│   │       └── F_JetBrainsMono.uasset
│   ├── Audio/
│   │   ├── MetaSounds/
│   │   │   ├── MS_OfficeAmbient.uasset
│   │   │   ├── MS_AgentAudio.uasset
│   │   │   ├── MS_AchievementFanfare.uasset
│   │   │   ├── MS_ErrorAlert.uasset
│   │   │   ├── MS_LevelUpSting.uasset
│   │   │   ├── MS_RainAmbient.uasset
│   │   │   └── MS_ThunderClap.uasset
│   │   └── Samples/
│   │       ├── keyboard_click_01-05.wav
│   │       ├── mouse_click_01-03.wav
│   │       ├── confetti_pop.wav
│   │       ├── alert_chime.wav
│   │       └── ... (50+ audio samples)
│   └── Blueprints/
│       ├── Agents/
│       │   ├── BP_OAVAgent.uasset         — Agent actor Blueprint
│       │   └── BP_OAVAgent_Spawner.uasset — Agent factory
│       ├── World/
│       │   ├── BP_Lobby.uasset
│       │   ├── BP_AgentDesk.uasset
│       │   ├── BP_DeskCluster.uasset
│       │   ├── BP_FloorManager.uasset
│       │   ├── BP_MeetingRoom.uasset
│       │   ├── BP_ServerRoom.uasset
│       │   ├── BP_ServerRack.uasset
│       │   ├── BP_TrophyCase.uasset
│       │   ├── BP_QuestBoard.uasset
│       │   ├── BP_SkyManager.uasset
│       │   └── BP_WeatherSystem.uasset
│       ├── Camera/
│       │   ├── BP_OAVCameraManager.uasset
│       │   └── BP_CinematicDirector.uasset
│       ├── VR/
│       │   └── BP_OAV_VRPawn.uasset
│       └── Core/
│           ├── BP_OAVGameMode.uasset
│           ├── BP_OAVGameInstance.uasset
│           └── BP_OAVPlayerController.uasset
├── Source/
│   ├── OpenAgentVisualizer/
│   │   ├── OpenAgentVisualizer.Build.cs     — Build script
│   │   ├── OpenAgentVisualizer.h
│   │   ├── OpenAgentVisualizer.cpp
│   │   ├── Core/
│   │   │   ├── OAVGameMode.h / .cpp
│   │   │   ├── OAVGameInstance.h / .cpp
│   │   │   └── OAVPlayerController.h / .cpp
│   │   ├── Network/
│   │   │   ├── OAVWebSocketClient.h / .cpp
│   │   │   ├── OAVEventDispatcher.h / .cpp
│   │   │   ├── OAVRESTClient.h / .cpp
│   │   │   └── OAVEventInterpolator.h / .cpp
│   │   ├── Agents/
│   │   │   ├── OAVAgent.h / .cpp
│   │   │   ├── OAVAgentState.h
│   │   │   ├── OAVAgentAppearance.h / .cpp
│   │   │   └── OAVAgentMovementComponent.h / .cpp
│   │   ├── World/
│   │   │   ├── OAVFloorManager.h / .cpp
│   │   │   ├── OAVSkyManager.h / .cpp
│   │   │   ├── OAVWeatherSystem.h / .cpp
│   │   │   └── OAVWorldPartitionStreamingPolicy.h / .cpp
│   │   ├── Camera/
│   │   │   ├── OAVCameraManager.h / .cpp
│   │   │   └── OAVCinematicDirector.h / .cpp
│   │   ├── UI/
│   │   │   ├── OAVUIManager.h / .cpp
│   │   │   └── OAVCommandPalette.h / .cpp
│   │   ├── Gamification/
│   │   │   ├── OAVTrophyCase.h / .cpp
│   │   │   └── OAVTierVisualConfig.h
│   │   ├── VR/
│   │   │   └── OAVVRPawn.h / .cpp
│   │   └── Metrics/
│   │       └── OAVMetricStore.h / .cpp
│   └── OpenAgentVisualizerEditor/         — Editor-only code
│       ├── OpenAgentVisualizerEditor.Build.cs
│       └── OAVEditorUtilities.h / .cpp    — Custom editor tools
├── Plugins/
│   └── (third-party plugins if any)
├── .gitattributes                          — LFS tracking rules
├── .gitignore                              — UE5 gitignore
└── README.md
```

### 12.2 Engine Requirements

| Requirement | Specification |
|-------------|--------------|
| Unreal Engine Version | 5.4.1+ (5.4 LTS preferred when available) |
| C++ Standard | C++20 (UE5.4 default) |
| Build System | UnrealBuildTool (UBT) |
| IDE Support | Visual Studio 2022 (17.8+), Rider 2024.1+ |
| Target SDK | Windows 10 SDK (10.0.22621), macOS 14 SDK, Linux (glibc 2.31+) |
| .NET | .NET 6.0 SDK (for UBT) |
| CMake | 3.28+ (for third-party dependency builds) |

### 12.3 Build Pipeline

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Developer Push  │────▶│  GitHub Actions   │────▶│  Build Artifacts  │
│  (feature branch)│     │  CI Pipeline      │     │                  │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
              │  Windows  │ │  Linux  │ │  macOS    │
              │  Build    │ │  Build  │ │  Build    │
              │  (MSVC)   │ │  (clang)│ │  (Apple)  │
              └─────┬─────┘ └────┬────┘ └─────┬─────┘
                    │            │             │
              ┌─────▼─────┐ ┌────▼─────┐ ┌────▼──────┐
              │  Package  │ │  Package │ │  Package  │
              │  .exe     │ │  .tar.gz │ │  .app     │
              │  installer│ │  AppImage│ │  .dmg     │
              └─────┬─────┘ └────┬─────┘ └────┬──────┘
                    │            │             │
                    └────────────┼─────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Artifact Storage       │
                    │  (GitHub Releases / S3) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Docker Image           │
                    │  (Pixel Streaming)      │
                    │  Base: nvidia/cuda      │
                    │  + UE5 packaged build   │
                    │  + signalling server    │
                    └─────────────────────────┘
```

### 12.4 GitHub Actions CI/CD

**Workflow file:** `.github/workflows/build_ue5.yml`

```yaml
name: Build UE5 OpenAgentVisualizer
on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Target platform'
        required: true
        default: 'Win64'
        type: choice
        options:
          - Win64
          - Linux
          - Mac
      configuration:
        description: 'Build configuration'
        required: true
        default: 'Shipping'
        type: choice
        options:
          - Development
          - Shipping

env:
  UE_VERSION: '5.4'
  PROJECT_NAME: 'OpenAgentVisualizer'

jobs:
  build:
    runs-on: ${{ inputs.platform == 'Win64' && 'windows-2022' || inputs.platform == 'Mac' && 'macos-14' || 'ubuntu-22.04' }}
    timeout-minutes: 120

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Setup UE5 (cached)
        uses: game-ci/setup-unreal@v1
        with:
          unreal-version: ${{ env.UE_VERSION }}

      - name: Build
        run: |
          RunUAT BuildCookRun \
            -project="${{ github.workspace }}/${{ env.PROJECT_NAME }}.uproject" \
            -noP4 \
            -platform=${{ inputs.platform }} \
            -clientconfig=${{ inputs.configuration }} \
            -build \
            -cook \
            -stage \
            -package \
            -archive \
            -archivedirectory="${{ github.workspace }}/Build"

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ env.PROJECT_NAME }}-${{ inputs.platform }}-${{ inputs.configuration }}
          path: ${{ github.workspace }}/Build/
          retention-days: 30

  build-pixel-streaming-docker:
    runs-on: ubuntu-22.04
    needs: build
    if: inputs.platform == 'Linux'
    timeout-minutes: 30

    steps:
      - name: Download Linux Build
        uses: actions/download-artifact@v4
        with:
          name: ${{ env.PROJECT_NAME }}-Linux-${{ inputs.configuration }}

      - name: Build Docker Image
        run: |
          docker build -t oav-pixel-streaming:latest \
            -f docker/Dockerfile.pixelstreaming .

      - name: Push to Container Registry
        run: |
          docker tag oav-pixel-streaming:latest \
            ghcr.io/${{ github.repository_owner }}/oav-pixel-streaming:${{ github.sha }}
          docker push ghcr.io/${{ github.repository_owner }}/oav-pixel-streaming:${{ github.sha }}
```

### 12.5 Docker Configuration for Pixel Streaming

**Dockerfile (`docker/Dockerfile.pixelstreaming`):**

```dockerfile
FROM nvidia/cuda:12.3.1-runtime-ubuntu22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    libvulkan1 \
    libegl1 \
    libxkbcommon0 \
    libx11-6 \
    libxrandr2 \
    pulseaudio \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy UE5 packaged build
COPY Build/LinuxNoEditor/ /app/

# Copy signalling server
COPY signalling/ /app/signalling/
WORKDIR /app/signalling
RUN npm ci --production

# Expose ports
EXPOSE 80     # Signalling server (HTTP + WebSocket)
EXPOSE 8888   # Pixel Streaming (WebRTC)

# Launch script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

**Entrypoint Script (`docker/entrypoint.sh`):**

```bash
#!/bin/bash
set -e

# Start signalling server in background
cd /app/signalling
node cirrus.js --HttpPort 80 --StreamerPort 8888 &

# Start UE5 application
cd /app
./OpenAgentVisualizer.sh \
  -PixelStreamingIP=0.0.0.0 \
  -PixelStreamingPort=8888 \
  -RenderOffscreen \
  -ForceRes \
  -ResX=${RENDER_WIDTH:-1920} \
  -ResY=${RENDER_HEIGHT:-1080} \
  -GraphicsAdapter=${GPU_INDEX:-0} \
  -AudioMixer \
  -PixelStreamingEncoderCodec=H264 \
  -PixelStreamingEncoderTargetBitrate=${BITRATE:-15000000} \
  -LOG
```

### 12.6 Asset Pipeline

**3D Model Production Pipeline:**

```
Blender / Maya (source files, .blend / .mb)
    │
    ├── Export FBX (skeletal meshes, static meshes, animations)
    │
    ▼
UE5 Import (via FBX importer)
    │
    ├── Skeletal Meshes → assign to SK_OAV_Agent skeleton
    ├── Static Meshes → enable Nanite (for environment), assign materials
    ├── Animations → retarget to SK_OAV_Agent, add to Animation Blueprint
    └── Textures → compress to BC7 (color), BC5 (normal), streaming enabled
```

**Asset Specifications:**

| Asset Type | Format | Compression | Notes |
|-----------|--------|------------|-------|
| Skeletal Mesh | FBX → .uasset | N/A | Max 67 bones, tangent space normals |
| Static Mesh | FBX → .uasset | Nanite (environment) | Nanite for any mesh > 1,000 tris |
| Animations | FBX → .uasset | Curve compression: remove constant/linear keys | 30fps capture, runtime at engine tick |
| Textures (Color) | PNG → BC7 | ~6:1 | sRGB color space |
| Textures (Normal) | PNG → BC5 | ~4:1 | Linear color space |
| Textures (ORM) | PNG → BC7 | ~6:1 | Linear, packed: R=AO, G=Roughness, B=Metallic |
| Audio (samples) | WAV (48kHz, 16bit) | Vorbis in-engine | Mono for spatialized, stereo for ambient |
| Niagara Systems | .uasset | N/A | Author in-engine only |

### 12.7 Plugin Dependencies

**Module Dependencies (in OpenAgentVisualizer.Build.cs):**

```csharp
// OpenAgentVisualizer.Build.cs
using UnrealBuildTool;

public class OpenAgentVisualizer : ModuleRules
{
    public OpenAgentVisualizer(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",

            // Networking
            "WebSockets",
            "HTTP",
            "Json",
            "JsonUtilities",

            // UI
            "UMG",
            "Slate",
            "SlateCore",
            "CommonUI",

            // Rendering
            "Niagara",
            "RenderCore",

            // Navigation
            "NavigationSystem",
            "AIModule",

            // VR
            "HeadMountedDisplay",
            "OpenXRHMD",

            // Audio
            "MetasoundEngine",
            "MetasoundFrontend",

            // Pixel Streaming
            "PixelStreaming",
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "RHI",
            "Renderer",
            "NiagaraCore",
        });
    }
}
```

### 12.8 Version Control Strategy

**Recommended: Git + Git LFS**

UE5 projects contain large binary assets (meshes, textures, levels) that do not diff well in standard Git. Git LFS stores these as pointers in the repository and the actual binary on a separate LFS server.

**.gitattributes:**

```
# UE5 binary asset types tracked by LFS
*.uasset filter=lfs diff=lfs merge=lfs -text
*.umap filter=lfs diff=lfs merge=lfs -text
*.uexp filter=lfs diff=lfs merge=lfs -text

# Source assets
*.fbx filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.hdr filter=lfs diff=lfs merge=lfs -text
*.exr filter=lfs diff=lfs merge=lfs -text

# Keep C++ source as regular Git
*.h text
*.cpp text
*.cs text
*.ini text
*.json text
*.yaml text
*.yml text
*.md text
```

**LFS Storage Estimate:**

| Asset Category | Estimated Size | File Count |
|---------------|---------------|-----------|
| Character meshes + animations | 50-100 MB | 30-50 files |
| Environment meshes | 200-400 MB | 100-200 files |
| Textures | 300-600 MB | 200-400 files |
| Niagara systems | 20-50 MB | 15-20 files |
| Audio samples | 100-200 MB | 50-100 files |
| Level maps | 50-200 MB | 5-10 files |
| **Total LFS storage** | **~720 MB - 1.5 GB** | |

Git LFS hosting: GitHub LFS (1GB free, $5/month for 50GB data pack) or self-hosted MinIO/S3.

**Alternative: Perforce (for larger teams)**

If the art team grows beyond 3 people, Perforce (Helix Core) is the industry standard for UE5 projects. It provides:
- File locking (prevents two artists from editing the same .uasset simultaneously)
- Stream depots for efficient branching of large binary repos
- Native UE5 integration via the Source Control plugin
- Cost: free for up to 5 users (Helix Core free tier)

### 12.9 Estimated Asset Production Requirements

**Character Assets:**

| Asset | Quantity | Estimated Production Time | Notes |
|-------|---------|--------------------------|-------|
| Base agent skeletal mesh | 1 (with 5 color variants) | 40 hours | High-priority, blocks all agent visuals |
| Agent animations | 25 sequences + 3 montages + 1 blend space | 80 hours | Can use mixamo retargeted as placeholder |
| Head accessories | 8 meshes | 16 hours | Simple static meshes |
| Badge meshes | 5 meshes | 8 hours | Tiny meshes with emissive materials |
| Desk decorations | 12 meshes | 24 hours | Books, plants, figurines, etc. |

**Environment Assets:**

| Asset | Quantity | Estimated Production Time | Notes |
|-------|---------|--------------------------|-------|
| Desk (2 variants) | 2 meshes | 16 hours | Standard + Executive |
| Chair (2 variants) | 2 meshes | 12 hours | |
| Monitor (2 variants) | 2 meshes | 8 hours | Single + Dual |
| Server rack | 1 mesh | 8 hours | With animated fan sub-mesh |
| Trophy meshes | 8 meshes | 24 hours | One per achievement category |
| Wall/floor/ceiling panels | 6 meshes | 12 hours | Modular kit pieces |
| Glass wall | 1 mesh | 4 hours | With transparency material |
| Doors | 2 meshes | 8 hours | Standard + Glass |
| Furniture (couch, table, cabinet, etc.) | 10 meshes | 30 hours | Break room + lobby |
| Decorative (paintings, plants, fountain) | 15 meshes | 30 hours | Office upgrades |

**Materials and Textures:**

| Asset | Quantity | Estimated Production Time |
|-------|---------|--------------------------|
| Master material + instances | 1 master + 10 instances | 24 hours |
| Hologram material | 1 material | 8 hours |
| Ghost/dissolve material | 1 material | 8 hours |
| Agent base material (with parameters) | 1 material | 12 hours |
| Texture sets (PBR: base, normal, ORM) | 20 sets | 40 hours |

**VFX (Niagara):**

| System | Quantity | Estimated Production Time |
|--------|---------|--------------------------|
| Data flow beam | 1 system | 16 hours |
| Token drain | 1 system | 8 hours |
| Cost stream | 1 system | 8 hours |
| Error sparks | 1 system | 8 hours |
| Confetti | 1 system | 8 hours |
| Fireworks | 1 system | 12 hours |
| Golden sparkles | 1 system | 4 hours |
| Loop vortex | 1 system | 12 hours |
| Achievement unlock | 1 system | 8 hours |
| Weather (rain + lightning) | 1 system | 16 hours |
| Sleep ZZZ | 1 system | 4 hours |
| Sweat particles | 1 system | 4 hours |

**Audio:**

| Asset | Quantity | Estimated Production Time |
|-------|---------|--------------------------|
| MetaSound graphs | 7 graphs | 40 hours |
| Audio samples | 50+ samples | 20 hours (from libraries) or 60 hours (custom recording) |

**Total Estimated Production:**
- **Art (meshes + textures + materials):** ~340 hours
- **Animation:** ~80 hours
- **VFX:** ~108 hours
- **Audio:** ~60-100 hours
- **C++ / Blueprint programming:** ~400 hours
- **Integration + testing:** ~160 hours
- **Grand total:** ~1,150 - 1,190 hours (~29-30 person-weeks)

With a team of 3 (1 artist, 1 tech artist/VFX, 1 programmer), this is approximately 10 weeks of production. With placeholder assets (mixamo characters, prototype box meshes, simple materials), a functional prototype can be achieved in 4-5 weeks.

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| ABP | Animation Blueprint — UE5 asset that defines animation state machine and blend logic |
| HISM | Hierarchical Instanced Static Mesh — efficient batch rendering of many identical meshes with automatic LOD |
| ISM | Instanced Static Mesh — batch rendering without hierarchical LOD |
| LOD | Level of Detail — progressively simplified meshes/animations at increasing distances |
| Lumen | UE5's dynamic global illumination and reflections system |
| MI | Material Instance — a parameter override of a parent Material |
| MPC | Material Parameter Collection — shared parameter set accessible by all materials |
| Nanite | UE5's virtualized geometry system for automatic mesh LOD |
| Niagara | UE5's GPU particle and visual effects system |
| NS | Niagara System — a complete particle effect asset |
| ORM | Occlusion/Roughness/Metallic — packed PBR texture (3 channels in one texture) |
| PiP | Picture in Picture — secondary camera viewport rendered as a small overlay |
| PVS | Potentially Visible Set — precomputed visibility data for occlusion culling |
| SM | Static Mesh — non-animated 3D geometry asset |
| SK | Skeletal Mesh — animated 3D geometry with a bone hierarchy |
| UBT | UnrealBuildTool — UE5's build system for C++ compilation |
| UMG | Unreal Motion Graphics — UE5's UI framework |
| WBP | Widget Blueprint — a UMG widget authored in the Blueprint editor |

---

## Appendix B: References

- [Unreal Engine 5.4 Documentation](https://docs.unrealengine.com/5.4/)
- [Pixel Streaming Reference](https://docs.unrealengine.com/5.4/en-US/pixel-streaming-in-unreal-engine/)
- [Niagara VFX System](https://docs.unrealengine.com/5.4/en-US/creating-visual-effects-in-niagara-for-unreal-engine/)
- [Lumen Global Illumination](https://docs.unrealengine.com/5.4/en-US/lumen-global-illumination-and-reflections-in-unreal-engine/)
- [OpenXR in UE5](https://docs.unrealengine.com/5.4/en-US/openxr-in-unreal-engine/)
- [World Partition](https://docs.unrealengine.com/5.4/en-US/world-partition-in-unreal-engine/)
- [MetaSounds](https://docs.unrealengine.com/5.4/en-US/metasounds-in-unreal-engine/)
- OpenAgentVisualizer PRD (Stage 1.1)
- OpenAgentVisualizer Visualization Spec (Stage 2.2)
- OpenAgentVisualizer Animation Spec (Stage 2.3)
- OpenAgentVisualizer Gamification System Design (Stage 1.2)
- OpenAgentVisualizer Agent Integration Architecture (Stage 1.3)
- OpenAgentVisualizer System Architecture (Stage 4.1)
- OpenAgentVisualizer Design System Spec (Stage 3.3)
