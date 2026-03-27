# Sprint 6 Design: Advanced Gamification

## Executive Summary

Sprint 6 transforms OpenAgentVisualizer from a monitored dashboard into a fully gamified platform with quest chains, skill trees, virtual economy, tournaments, seasonal leaderboards, teams, and cooperative challenges.

## Subsystem 1: Progression

### Quest Chains

**New table: `quests`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(255) | |
| description | TEXT | |
| type | VARCHAR(20) | daily, weekly, epic |
| steps | JSONB | Array of {description, condition_type, condition_value, completed} |
| xp_reward | INTEGER | XP granted on completion |
| currency_reward | INTEGER | Tokens granted on completion |
| icon | VARCHAR(50) | Lucide icon name |
| active | BOOLEAN | default true |
| reset_hours | INTEGER | nullable — 24 for daily, 168 for weekly, null for epic |
| created_at | TIMESTAMPTZ | |

**New table: `agent_quest_progress`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| agent_id | UUID | FK → agents |
| quest_id | UUID | FK → quests |
| current_step | INTEGER | 0-indexed |
| completed | BOOLEAN | default false |
| completed_at | TIMESTAMPTZ | nullable |
| last_reset_at | TIMESTAMPTZ | nullable, for daily/weekly reset |

**15 pre-seeded quests:**
- Daily (5): "Ingest 100 events", "Complete 10 tasks", "Earn 500 XP", "Run for 1 hour", "Zero errors for 4 hours"
- Weekly (5): "Complete 50 tasks without errors", "Earn 5,000 XP", "Top 3 on leaderboard", "Use all 4 integrations", "Ingest 5,000 events"
- Epic (5): "Reach Level 5", "Reach Level 10", "Unlock 5 achievements", "Complete 100 quests", "Earn 50,000 lifetime XP"

**Celery task:** `evaluate_quest_progress` on critical queue — triggered after XP/event/task updates. Checks all active quests for the agent, advances step if condition met, marks complete if all steps done.

**Celery beat:** `reset_daily_quests` (every 24h), `reset_weekly_quests` (every 168h) — resets progress for recurring quests.

**Endpoints:**
- GET /api/quests — list all quests (with agent progress if agent_id query param)
- GET /api/agents/{id}/quests — agent's quest progress
- POST /api/quests/{quest_id}/claim — claim rewards (validates completed, credits XP + tokens)

### Skill Trees

**New table: `skill_trees`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(100) | Speed, Accuracy, Efficiency, Resilience |
| description | TEXT | |
| category | VARCHAR(50) | |
| icon | VARCHAR(50) | |

**New table: `skill_nodes`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tree_id | UUID | FK → skill_trees |
| name | VARCHAR(100) | |
| description | TEXT | |
| parent_id | UUID | FK → skill_nodes, nullable for root |
| level_required | INTEGER | minimum agent level |
| cost | INTEGER | token cost to unlock |
| stat_bonus | JSONB | e.g., {"speed_multiplier": 1.1} |
| icon | VARCHAR(50) | |
| tier | INTEGER | 1-5, visual positioning |

**New table: `agent_skills`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| agent_id | UUID | FK → agents |
| node_id | UUID | FK → skill_nodes |
| unlocked_at | TIMESTAMPTZ | |

**4 trees, 5 nodes each (20 total):**
- Speed: Quick Start → Burst Mode → Parallel Processing → Time Warp → Lightning
- Accuracy: Focus → Precision → Double Check → Zero Defect → Perfectionist
- Efficiency: Resource Aware → Cost Cutter → Lean Operator → Optimizer → Minimalist
- Resilience: Retry Logic → Circuit Breaker → Self Heal → Fault Tolerant → Immortal

Each node: tier 1 costs 50 tokens (level 1), tier 5 costs 500 tokens (level 8). Parent must be unlocked first.

**Endpoints:**
- GET /api/skill-trees — all trees with nodes
- GET /api/agents/{id}/skills — agent's unlocked skills
- POST /api/agents/{id}/skills/{node_id}/unlock — validates level + parent + wallet, deducts tokens, unlocks

### Frontend

- **QuestsPage** (/quests): tabs for Daily/Weekly/Epic, quest cards with progress bar, step checklist, claim button (enabled when complete), reward preview (XP + tokens)
- **SkillTreePage** (/skills): 4-column layout (one per tree), nodes as connected circles (ReactFlow or custom SVG), states: locked (gray), available (blue pulse), unlocked (green glow), unlock modal with cost + requirements
- **Agent Detail** → new Quests tab and Skills tab

## Subsystem 2: Economy

### Virtual Currency (Tokens)

**New table: `wallets`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces, unique |
| balance | INTEGER | default 0, no negative |
| created_at | TIMESTAMPTZ | |

Auto-created on workspace creation (seed migration). One wallet per workspace.

**New table: `transactions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| wallet_id | UUID | FK → wallets |
| amount | INTEGER | positive = credit, negative = debit |
| type | VARCHAR(50) | quest_reward, achievement_reward, login_bonus, level_bonus, purchase, tournament_entry, tournament_prize, refund |
| reference_id | VARCHAR(255) | nullable — quest_id, item_id, tournament_id |
| description | VARCHAR(500) | |
| created_at | TIMESTAMPTZ | |

**Token sources:**
- Quest completion: per-quest reward (50-500 tokens)
- Achievement unlock: 100 tokens each
- Daily login bonus: 25 tokens (first event of day)
- Level-up: level_number * 50 tokens
- Tournament prizes: from prize pool

**Endpoints:**
- GET /api/wallet — balance + recent transactions
- GET /api/wallet/transactions?limit=50&offset=0 — full history

### Marketplace

**New table: `shop_items`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | |
| description | TEXT | |
| category | VARCHAR(50) | cosmetic, boost, title |
| price | INTEGER | token cost |
| icon | VARCHAR(50) | |
| rarity | VARCHAR(20) | common, rare, epic, legendary |
| effect_data | JSONB | e.g., {"ring_color": "#ff0000"} or {"xp_multiplier": 2, "duration_hours": 1} |
| active | BOOLEAN | default true |

**New table: `inventory`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| item_id | UUID | FK → shop_items |
| agent_id | UUID | FK → agents, nullable |
| equipped | BOOLEAN | default false |
| acquired_at | TIMESTAMPTZ | |

**20 pre-seeded items:**
- Cosmetics (8): Golden Ring (rare, 200), Diamond Ring (epic, 500), Fire Border (rare, 300), Ice Border (rare, 300), Neon Glow (epic, 400), Shadow Trail (legendary, 1000), Rainbow Name (epic, 600), Crown Icon (legendary, 800)
- Boosts (6): 2x XP 1hr (common, 100), 2x XP 4hr (rare, 300), Quest Skip (rare, 250), Daily Reset (epic, 500), Bonus Tokens 2x (rare, 200), Shield (no XP loss, epic, 400)
- Titles (6): "Speedrunner" (common, 50), "Perfectionist" (rare, 150), "Cost Cutter" (rare, 150), "Iron Will" (epic, 350), "Legend" (legendary, 1000), "Transcendent" (legendary, 1500)

**Endpoints:**
- GET /api/shop — all active items with "owned" flag
- POST /api/shop/{item_id}/buy — validates balance, deducts tokens, adds to inventory, logs transaction
- GET /api/inventory — workspace inventory with equipped status
- POST /api/inventory/{id}/equip — equip cosmetic on agent
- POST /api/inventory/{id}/unequip — remove from agent

### Frontend

- **WalletBadge**: token icon + balance in header (next to notification bell)
- **WalletDropdown**: recent transactions, "View All" link
- **ShopPage** (/shop): category tabs, item cards with rarity border (common=gray, rare=blue, epic=purple, legendary=gold), price tag, buy button, "Owned" badge
- **InventoryPage** (/inventory): owned items grid, equip/unequip buttons, filter by category

## Subsystem 3: Competitive

### Tournaments

**New table: `tournaments`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(255) | |
| description | TEXT | |
| type | VARCHAR(50) | speed, accuracy, cost_efficiency |
| start_at | TIMESTAMPTZ | |
| end_at | TIMESTAMPTZ | |
| entry_fee | INTEGER | tokens |
| prize_pool | INTEGER | accumulated from entries |
| status | VARCHAR(20) | upcoming, active, completed |
| created_at | TIMESTAMPTZ | |

**New table: `tournament_entries`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tournament_id | UUID | FK → tournaments |
| agent_id | UUID | FK → agents |
| score | FLOAT | computed during tournament |
| rank | INTEGER | nullable, set on completion |
| prize_awarded | INTEGER | nullable |
| entered_at | TIMESTAMPTZ | |

**Auto-created tournaments (Celery beat):**
- Weekly Speed Tournament: Mondays, 7-day duration, 50 token entry, scored by tasks_completed / hours
- Weekly Efficiency Tournament: Wednesdays, 7-day duration, 50 token entry, scored by tasks_completed / cost

**Scoring (Celery task `score_tournament`):** Runs hourly for active tournaments, computes score per entry based on agent metrics during tournament window.

**Prize distribution (Celery task `finalize_tournament`):** On tournament end — rank entries, distribute prize pool: 1st 50%, 2nd 30%, 3rd 20%. Credit wallets, log transactions, send notifications.

**Endpoints:**
- GET /api/tournaments — list (filterable by status)
- GET /api/tournaments/{id} — detail with entries
- POST /api/tournaments/{id}/enter — pay entry fee, add entry
- GET /api/tournaments/{id}/leaderboard — ranked entries

### Seasonal Leaderboards

**New table: `seasons`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(100) | e.g., "Season 1: Genesis" |
| number | INTEGER | sequential |
| start_at | TIMESTAMPTZ | |
| end_at | TIMESTAMPTZ | |
| status | VARCHAR(20) | active, completed |

**New table: `seasonal_xp`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| season_id | UUID | FK → seasons |
| agent_id | UUID | FK → agents |
| xp | INTEGER | default 0, resets each season |

Seasons last 30 days. Celery beat: `rotate_season` daily check — if active season ended, finalize (award top 10), create next season.

End-of-season rewards: Top 10 agents get exclusive title + token bonus (1st: 2000, 2nd: 1500, 3rd: 1000, 4th-10th: 500).

**Endpoints:**
- GET /api/seasons/current — active season with days remaining
- GET /api/seasons/{id}/leaderboard — seasonal XP rankings

### Frontend

- **TournamentsPage** (/tournaments): upcoming/active/completed tabs, TournamentCard (name, type badge, countdown, prize pool, entry count), enter modal (shows fee + balance)
- **SeasonBanner**: current season name + days remaining, shown at top of LeaderboardPage
- **LeaderboardPage** → new "Seasonal" and "Tournament" tabs alongside existing tabs

## Subsystem 4: Social

### Teams

**New table: `teams`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(100) | |
| description | TEXT | nullable |
| icon | VARCHAR(50) | |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |

**New table: `team_members`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| team_id | UUID | FK → teams |
| agent_id | UUID | FK → agents, unique per team |
| role | VARCHAR(20) | leader, member |
| joined_at | TIMESTAMPTZ | |

Constraints: max 10 members per team, max 5 teams per workspace. Team XP = sum of member XP. Team level = derived from team XP using same 10-level thresholds.

**Endpoints:**
- GET /api/teams — list workspace teams with member count + stats
- POST /api/teams — create team (name, description, icon)
- GET /api/teams/{id} — team detail with members + stats
- POST /api/teams/{id}/members — add agent to team
- DELETE /api/teams/{id}/members/{agent_id} — remove agent
- GET /api/teams/{id}/stats — aggregated team metrics

### Cooperative Challenges

**New table: `challenges`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(255) | |
| description | TEXT | |
| type | VARCHAR(20) | team, workspace |
| goal_type | VARCHAR(50) | events, tasks, xp |
| goal_value | INTEGER | target |
| current_value | INTEGER | default 0 |
| reward_tokens | INTEGER | |
| reward_xp | INTEGER | |
| start_at | TIMESTAMPTZ | |
| end_at | TIMESTAMPTZ | |
| status | VARCHAR(20) | active, completed, failed |

**New table: `challenge_progress`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| challenge_id | UUID | FK → challenges |
| contributor_id | UUID | agent_id or team_id |
| contribution | INTEGER | |
| updated_at | TIMESTAMPTZ | |

**3 auto-created weekly challenges:**
- "Ingest 10,000 events" (workspace-wide, 500 tokens + 1000 XP)
- "Complete 500 tasks" (workspace-wide, 300 tokens + 500 XP)
- "Earn 50,000 total XP" (workspace-wide, 400 tokens + 750 XP)

Celery task `update_challenge_progress`: aggregates from events/tasks, updates current_value. On goal met: mark completed, distribute rewards to all agents. On end_at passed without goal: mark failed.

**Endpoints:**
- GET /api/challenges — active + recent challenges
- GET /api/challenges/{id} — detail with progress
- GET /api/challenges/{id}/progress — per-contributor breakdown

### Frontend

- **TeamsPage** (/teams): team cards (avatar grid, name, level, member count), create team modal (name, icon, select agents)
- **TeamDetailPage** (/teams/:id): member list with roles, team stats (total XP, tasks, level), add/remove members
- **ChallengesPage** (/challenges): active challenges with shared progress bar (percentage + current/goal), countdown timer, reward preview, contributor breakdown
- **LeaderboardPage** → new "Teams" tab

## New Database Tables Summary

| Table | Subsystem | Count |
|-------|-----------|-------|
| quests | Progression | |
| agent_quest_progress | Progression | |
| skill_trees | Progression | |
| skill_nodes | Progression | |
| agent_skills | Progression | |
| wallets | Economy | |
| transactions | Economy | |
| shop_items | Economy | |
| inventory | Economy | |
| tournaments | Competitive | |
| tournament_entries | Competitive | |
| seasons | Competitive | |
| seasonal_xp | Competitive | |
| teams | Social | |
| team_members | Social | |
| challenges | Social | |
| challenge_progress | Social | |

**17 new tables** in a single Alembic migration (007).

## New API Endpoints Summary

| Method | Path | Subsystem |
|--------|------|-----------|
| GET | /api/quests | Progression |
| GET | /api/agents/{id}/quests | Progression |
| POST | /api/quests/{id}/claim | Progression |
| GET | /api/skill-trees | Progression |
| GET | /api/agents/{id}/skills | Progression |
| POST | /api/agents/{id}/skills/{node_id}/unlock | Progression |
| GET | /api/wallet | Economy |
| GET | /api/wallet/transactions | Economy |
| GET | /api/shop | Economy |
| POST | /api/shop/{item_id}/buy | Economy |
| GET | /api/inventory | Economy |
| POST | /api/inventory/{id}/equip | Economy |
| POST | /api/inventory/{id}/unequip | Economy |
| GET | /api/tournaments | Competitive |
| GET | /api/tournaments/{id} | Competitive |
| POST | /api/tournaments/{id}/enter | Competitive |
| GET | /api/tournaments/{id}/leaderboard | Competitive |
| GET | /api/seasons/current | Competitive |
| GET | /api/seasons/{id}/leaderboard | Competitive |
| GET | /api/teams | Social |
| POST | /api/teams | Social |
| GET | /api/teams/{id} | Social |
| POST | /api/teams/{id}/members | Social |
| DELETE | /api/teams/{id}/members/{agent_id} | Social |
| GET | /api/teams/{id}/stats | Social |
| GET | /api/challenges | Social |
| GET | /api/challenges/{id} | Social |
| GET | /api/challenges/{id}/progress | Social |

## Priority Matrix

| Priority | Features |
|----------|----------|
| Must-have | Quests (daily/weekly/epic), wallet + transactions, shop + inventory, tournaments, teams, challenges |
| Should-have | Skill trees, seasonal leaderboards, cosmetic equip system, tournament auto-creation |
| Nice-to-have | Boost effects (2x XP), rarity animations, prestige/rebirth |

## Non-Goals (Sprint 6)

- Real currency / payments
- Cross-workspace competitions
- Agent trading between workspaces
- Loot boxes / random rewards
- Chat / messaging between users
