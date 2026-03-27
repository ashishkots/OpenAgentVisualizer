# Sprint 6: Advanced Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add quest chains, skill trees, virtual economy, tournaments, seasonal leaderboards, teams, and cooperative challenges to transform OAV into a fully gamified platform.

**Architecture:** 4 independent subsystems (Progression, Economy, Competitive, Social) implemented in parallel groups. Single Alembic migration for all 17 tables. Backend tasks create models/services/routers per subsystem. Frontend tasks add pages/components/stores. Celery tasks handle quest evaluation, tournament scoring, season rotation, and challenge progress.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Celery, React 18, Zustand, React Query, ReactFlow (skill trees), Tailwind CSS, Lucide React

---

## File Structure

### New Backend Files

| File | Subsystem | Responsibility |
|------|-----------|---------------|
| `app/models/quest.py` | Progression | Quest + AgentQuestProgress models |
| `app/models/skill.py` | Progression | SkillTree + SkillNode + AgentSkill models |
| `app/models/wallet.py` | Economy | Wallet + Transaction models |
| `app/models/shop.py` | Economy | ShopItem + Inventory models |
| `app/models/tournament.py` | Competitive | Tournament + TournamentEntry models |
| `app/models/season.py` | Competitive | Season + SeasonalXP models |
| `app/models/team.py` | Social | Team + TeamMember models |
| `app/models/challenge.py` | Social | Challenge + ChallengeProgress models |
| `app/schemas/quest.py` | Progression | Quest Pydantic schemas |
| `app/schemas/skill.py` | Progression | Skill tree schemas |
| `app/schemas/wallet.py` | Economy | Wallet + transaction schemas |
| `app/schemas/shop.py` | Economy | Shop + inventory schemas |
| `app/schemas/tournament.py` | Competitive | Tournament schemas |
| `app/schemas/season.py` | Competitive | Season schemas |
| `app/schemas/team.py` | Social | Team schemas |
| `app/schemas/challenge.py` | Social | Challenge schemas |
| `app/routers/quests.py` | Progression | Quest endpoints |
| `app/routers/skills.py` | Progression | Skill tree endpoints |
| `app/routers/wallet.py` | Economy | Wallet endpoints |
| `app/routers/shop.py` | Economy | Shop + inventory endpoints |
| `app/routers/tournaments.py` | Competitive | Tournament endpoints |
| `app/routers/seasons.py` | Competitive | Season endpoints |
| `app/routers/teams.py` | Social | Team endpoints |
| `app/routers/challenges.py` | Social | Challenge endpoints |
| `app/services/quest_service.py` | Progression | Quest evaluation logic |
| `app/services/wallet_service.py` | Economy | Token credit/debit logic |
| `app/services/tournament_service.py` | Competitive | Scoring + prize distribution |
| `app/services/challenge_service.py` | Social | Challenge progress aggregation |
| `app/tasks/quests.py` | Progression | Quest eval + reset tasks |
| `app/tasks/tournaments.py` | Competitive | Scoring + finalization tasks |
| `app/tasks/seasons.py` | Competitive | Season rotation task |
| `app/tasks/challenges.py` | Social | Challenge progress + creation tasks |
| `app/data/seed_quests.py` | Progression | 15 quest definitions |
| `app/data/seed_skills.py` | Progression | 4 trees, 20 nodes |
| `app/data/seed_shop.py` | Economy | 20 shop items |
| `alembic/versions/007_gamification_advanced.py` | All | Migration for 17 tables |
| `tests/test_quests.py` | Progression | Quest endpoint tests |
| `tests/test_skills.py` | Progression | Skill tree tests |
| `tests/test_wallet.py` | Economy | Wallet tests |
| `tests/test_shop.py` | Economy | Shop + inventory tests |
| `tests/test_tournaments.py` | Competitive | Tournament tests |
| `tests/test_teams.py` | Social | Team tests |
| `tests/test_challenges.py` | Social | Challenge tests |

### New Frontend Files

| File | Subsystem |
|------|-----------|
| `types/quest.ts` | Progression |
| `types/skill.ts` | Progression |
| `types/economy.ts` | Economy |
| `types/tournament.ts` | Competitive |
| `types/team.ts` | Social |
| `hooks/useQuests.ts` | Progression |
| `hooks/useSkills.ts` | Progression |
| `hooks/useWallet.ts` | Economy |
| `hooks/useShop.ts` | Economy |
| `hooks/useTournaments.ts` | Competitive |
| `hooks/useTeams.ts` | Social |
| `hooks/useChallenges.ts` | Social |
| `stores/questStore.ts` | Progression |
| `stores/economyStore.ts` | Economy |
| `stores/tournamentStore.ts` | Competitive |
| `stores/teamStore.ts` | Social |
| `pages/QuestsPage.tsx` | Progression |
| `pages/SkillTreePage.tsx` | Progression |
| `pages/ShopPage.tsx` | Economy |
| `pages/InventoryPage.tsx` | Economy |
| `pages/TournamentsPage.tsx` | Competitive |
| `pages/TeamsPage.tsx` | Social |
| `pages/TeamDetailPage.tsx` | Social |
| `pages/ChallengesPage.tsx` | Social |
| `components/gamification/WalletBadge.tsx` | Economy |
| `components/gamification/WalletDropdown.tsx` | Economy |
| `components/gamification/QuestCard.tsx` | Progression |
| `components/gamification/SkillNode.tsx` | Progression |
| `components/gamification/TournamentCard.tsx` | Competitive |
| `components/gamification/SeasonBanner.tsx` | Competitive |
| `components/gamification/TeamCard.tsx` | Social |
| `components/gamification/ChallengeCard.tsx` | Social |

---

## Group A: Database Migration + Seed Data (Task 1)

### Task 1: Alembic Migration + All Models + Seed Data

**Files:**
- Create: All model files listed above (8 files)
- Create: `src/backend/alembic/versions/007_gamification_advanced.py`
- Create: `src/backend/app/data/seed_quests.py`
- Create: `src/backend/app/data/seed_skills.py`
- Create: `src/backend/app/data/seed_shop.py`
- Modify: `src/backend/app/models/__init__.py`
- Modify: `src/backend/app/main.py` (import models + seed on startup)

Create all 17 tables in migration 007. Models follow existing Mapped/mapped_column pattern. Seed data files export lists of dicts that main.py inserts on startup if tables are empty.

**Seed data:**
- 15 quests (5 daily, 5 weekly, 5 epic) per spec
- 4 skill trees with 5 nodes each (20 nodes) per spec
- 20 shop items (8 cosmetic, 6 boost, 6 title) per spec

- [ ] **Commit:** `feat: add 17 gamification tables + seed data (migration 007)`

---

## Group B: Progression Backend (Tasks 2-3)

### Task 2: Quest Backend

**Files:**
- Create: `src/backend/app/schemas/quest.py`
- Create: `src/backend/app/routers/quests.py`
- Create: `src/backend/app/services/quest_service.py`
- Create: `src/backend/app/tasks/quests.py`
- Create: `src/backend/tests/test_quests.py`
- Modify: `src/backend/app/main.py` (register router)
- Modify: `src/backend/app/core/celery_app.py` (add tasks + beat)

Endpoints: GET /api/quests, GET /api/agents/{id}/quests, POST /api/quests/{id}/claim.
Service: evaluate_quest_progress (check conditions, advance steps, mark complete).
Tasks: evaluate_quest_progress (critical queue), reset_daily_quests (beat 24h), reset_weekly_quests (beat 168h).
Tests: list quests, agent quest progress, claim rewards.

- [ ] **Commit:** `feat: add quest endpoints, service, and Celery evaluation tasks`

### Task 3: Skill Tree Backend

**Files:**
- Create: `src/backend/app/schemas/skill.py`
- Create: `src/backend/app/routers/skills.py`
- Create: `src/backend/tests/test_skills.py`
- Modify: `src/backend/app/main.py`

Endpoints: GET /api/skill-trees, GET /api/agents/{id}/skills, POST /api/agents/{id}/skills/{node_id}/unlock.
Unlock validates: agent level >= node.level_required, parent node unlocked, wallet balance >= cost. Deducts tokens via wallet_service.
Tests: list trees, list agent skills, unlock (success + insufficient funds + locked parent).

- [ ] **Commit:** `feat: add skill tree endpoints with unlock validation`

---

## Group C: Economy Backend (Tasks 4-5)

### Task 4: Wallet Backend

**Files:**
- Create: `src/backend/app/schemas/wallet.py`
- Create: `src/backend/app/routers/wallet.py`
- Create: `src/backend/app/services/wallet_service.py`
- Create: `src/backend/tests/test_wallet.py`
- Modify: `src/backend/app/main.py`

Service: credit(wallet_id, amount, type, ref, desc), debit(wallet_id, amount, type, ref, desc) — debit raises 400 if insufficient balance. Auto-create wallet on first access if not exists.
Endpoints: GET /api/wallet (balance + last 10 transactions), GET /api/wallet/transactions?limit=50&offset=0.
Tests: wallet creation, credit, debit, insufficient balance, transaction history.

- [ ] **Commit:** `feat: add wallet service + endpoints with credit/debit`

### Task 5: Shop + Inventory Backend

**Files:**
- Create: `src/backend/app/schemas/shop.py`
- Create: `src/backend/app/routers/shop.py`
- Create: `src/backend/tests/test_shop.py`
- Modify: `src/backend/app/main.py`

Endpoints: GET /api/shop (items + owned flag), POST /api/shop/{item_id}/buy (validate balance, deduct, add to inventory), GET /api/inventory, POST /api/inventory/{id}/equip, POST /api/inventory/{id}/unequip.
Buy: check item active, check not already owned (for non-consumables), debit wallet, create inventory entry, log transaction.
Tests: list shop, buy item, buy with insufficient funds, already owned, equip/unequip.

- [ ] **Commit:** `feat: add shop + inventory endpoints with purchase flow`

---

## Group D: Competitive Backend (Tasks 6-7)

### Task 6: Tournament Backend

**Files:**
- Create: `src/backend/app/schemas/tournament.py`
- Create: `src/backend/app/routers/tournaments.py`
- Create: `src/backend/app/services/tournament_service.py`
- Create: `src/backend/app/tasks/tournaments.py`
- Create: `src/backend/tests/test_tournaments.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

Endpoints: GET /api/tournaments, GET /api/tournaments/{id}, POST /api/tournaments/{id}/enter (debit entry fee, add to prize pool), GET /api/tournaments/{id}/leaderboard.
Service: score_entries (compute score per agent metrics), finalize (rank, distribute prizes 50/30/20).
Tasks: create_weekly_tournaments (beat weekly), score_active_tournaments (beat hourly), finalize_completed_tournaments (beat hourly).
Tests: list tournaments, enter (success + insufficient funds), leaderboard.

- [ ] **Commit:** `feat: add tournament endpoints, scoring, and prize distribution`

### Task 7: Season Backend

**Files:**
- Create: `src/backend/app/schemas/season.py`
- Create: `src/backend/app/routers/seasons.py`
- Create: `src/backend/app/tasks/seasons.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

Endpoints: GET /api/seasons/current, GET /api/seasons/{id}/leaderboard.
Task: rotate_season (beat daily) — if active season ended: finalize (award top 10), create next season with incremented number.
Season 1 auto-created on first access if none exists.
Tests: current season, leaderboard.

- [ ] **Commit:** `feat: add seasonal leaderboards with auto-rotation`

---

## Group E: Social Backend (Tasks 8-9)

### Task 8: Team Backend

**Files:**
- Create: `src/backend/app/schemas/team.py`
- Create: `src/backend/app/routers/teams.py`
- Create: `src/backend/tests/test_teams.py`
- Modify: `src/backend/app/main.py`

Endpoints: GET /api/teams, POST /api/teams, GET /api/teams/{id}, POST /api/teams/{id}/members, DELETE /api/teams/{id}/members/{agent_id}, GET /api/teams/{id}/stats.
Constraints: max 10 members/team, max 5 teams/workspace. Team stats: sum XP, total tasks, derived level.
Tests: create team, add member, max members, remove member, team stats.

- [ ] **Commit:** `feat: add team endpoints with member management`

### Task 9: Challenge Backend

**Files:**
- Create: `src/backend/app/schemas/challenge.py`
- Create: `src/backend/app/routers/challenges.py`
- Create: `src/backend/app/services/challenge_service.py`
- Create: `src/backend/app/tasks/challenges.py`
- Create: `src/backend/tests/test_challenges.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

Endpoints: GET /api/challenges, GET /api/challenges/{id}, GET /api/challenges/{id}/progress.
Service: update_progress (aggregate from events/tasks), check_completion (mark complete + distribute rewards), check_expiry (mark failed).
Tasks: update_challenge_progress (beat every 5min), create_weekly_challenges (beat weekly).
Tests: list challenges, progress, completion.

- [ ] **Commit:** `feat: add cooperative challenges with progress tracking`

---

## Group F: Frontend — Progression + Economy (Tasks 10-11)

### Task 10: Progression Frontend

**Files:**
- Create: `src/frontend/src/types/quest.ts`, `src/frontend/src/types/skill.ts`
- Create: `src/frontend/src/hooks/useQuests.ts`, `src/frontend/src/hooks/useSkills.ts`
- Create: `src/frontend/src/stores/questStore.ts`
- Create: `src/frontend/src/components/gamification/QuestCard.tsx`
- Create: `src/frontend/src/components/gamification/SkillNode.tsx`
- Create: `src/frontend/src/pages/QuestsPage.tsx`
- Create: `src/frontend/src/pages/SkillTreePage.tsx`
- Modify: `src/frontend/src/routes.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx` (nav links)

QuestsPage: Daily/Weekly/Epic tabs, QuestCard (progress bar, step checklist, claim button with XP+token preview).
SkillTreePage: 4-column layout, SkillNode (locked=gray, available=blue pulse, unlocked=green glow), connected with lines, click to unlock with cost modal.
Agent detail → new Quests and Skills tabs.

- [ ] **Commit:** `feat: add quest and skill tree frontend pages`

### Task 11: Economy Frontend

**Files:**
- Create: `src/frontend/src/types/economy.ts`
- Create: `src/frontend/src/hooks/useWallet.ts`, `src/frontend/src/hooks/useShop.ts`
- Create: `src/frontend/src/stores/economyStore.ts`
- Create: `src/frontend/src/components/gamification/WalletBadge.tsx`
- Create: `src/frontend/src/components/gamification/WalletDropdown.tsx`
- Create: `src/frontend/src/pages/ShopPage.tsx`
- Create: `src/frontend/src/pages/InventoryPage.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx` (WalletBadge in header)
- Modify: `src/frontend/src/routes.tsx`

WalletBadge: coin icon + balance in header. WalletDropdown: recent transactions + "View All".
ShopPage: category tabs, item cards with rarity borders (gray/blue/purple/gold), price, buy button, "Owned" badge.
InventoryPage: owned items grid, equip/unequip per agent.

- [ ] **Commit:** `feat: add shop, inventory, and wallet UI`

---

## Group G: Frontend — Competitive + Social (Tasks 12-13)

### Task 12: Competitive Frontend

**Files:**
- Create: `src/frontend/src/types/tournament.ts`
- Create: `src/frontend/src/hooks/useTournaments.ts`
- Create: `src/frontend/src/stores/tournamentStore.ts`
- Create: `src/frontend/src/components/gamification/TournamentCard.tsx`
- Create: `src/frontend/src/components/gamification/SeasonBanner.tsx`
- Create: `src/frontend/src/pages/TournamentsPage.tsx`
- Modify: `src/frontend/src/pages/LeaderboardPage.tsx` (Seasonal + Tournament tabs)
- Modify: `src/frontend/src/routes.tsx`

TournamentsPage: upcoming/active/completed tabs, TournamentCard (name, type badge, countdown, prize pool, entry count, enter button).
SeasonBanner: current season name + days remaining at top of LeaderboardPage.
LeaderboardPage: new "Seasonal" and "Tournament" tabs.

- [ ] **Commit:** `feat: add tournament and seasonal leaderboard frontend`

### Task 13: Social Frontend

**Files:**
- Create: `src/frontend/src/types/team.ts`
- Create: `src/frontend/src/hooks/useTeams.ts`, `src/frontend/src/hooks/useChallenges.ts`
- Create: `src/frontend/src/stores/teamStore.ts`
- Create: `src/frontend/src/components/gamification/TeamCard.tsx`
- Create: `src/frontend/src/components/gamification/ChallengeCard.tsx`
- Create: `src/frontend/src/pages/TeamsPage.tsx`
- Create: `src/frontend/src/pages/TeamDetailPage.tsx`
- Create: `src/frontend/src/pages/ChallengesPage.tsx`
- Modify: `src/frontend/src/pages/LeaderboardPage.tsx` (Teams tab)
- Modify: `src/frontend/src/routes.tsx`

TeamsPage: team cards (member avatars, name, level, member count), create team modal.
TeamDetailPage: member list with roles, stats, add/remove.
ChallengesPage: active challenges with shared progress bar, countdown, reward preview.
LeaderboardPage: new "Teams" tab.

- [ ] **Commit:** `feat: add teams and cooperative challenges frontend`

---

## Group H: Finalize (Task 14)

### Task 14: Sprint Backlog + Push

- [ ] Update `docs/sprint-backlog.md` with Sprint 6 completion
- [ ] **Commit:** `docs: update sprint backlog with Sprint 6 completion`
- [ ] Push to GitHub
