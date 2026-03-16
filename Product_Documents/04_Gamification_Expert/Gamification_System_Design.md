# OpenAgentVisualizer -- Gamification System Design

**Stage:** 1.2 -- Gamification Expert Agent
**Date:** March 16, 2026
**Status:** Complete
**Depends on:** Research Report (Stage 1.1), Product Requirements (Stage 1.1)
**Feeds Into:** UX Designer (1.2), UI Designer (1.3), Motion Graphics (1.4), Frontend Expert (2.2a), Backend Expert (2.2b)

---

## Table of Contents

1. [Gamification Philosophy](#1-gamification-philosophy)
2. [XP System Design](#2-xp-system-design)
3. [Achievement System](#3-achievement-system)
4. [Leaderboard System](#4-leaderboard-system)
5. [Quest System](#5-quest-system)
6. [Virtual Economy](#6-virtual-economy)
7. [Progression System](#7-progression-system)
8. [Social & Competitive Features](#8-social--competitive-features)
9. [Notification & Feedback Design](#9-notification--feedback-design)
10. [Anti-Pattern Prevention](#10-anti-pattern-prevention)
11. [Technical Integration](#11-technical-integration)
12. [Analytics & Tuning](#12-analytics--tuning)

---

## 1. Gamification Philosophy

### 1.1 Why Gamification for Agent Management

AI agent management today suffers from three engagement failures:

1. **Observability is invisible.** Every existing AI monitoring tool presents text logs, JSON traces, and flat metric charts. Engineers tolerate this because they must. Managers and executives ignore it because they can. The data exists but nobody wants to look at it.

2. **Optimization has no feedback loop.** When an engineer improves an agent's token efficiency by 40%, nothing happens. No celebration, no recognition, no visible record. The improvement is buried in a metrics CSV. This kills the motivation to continuously optimize.

3. **Multi-agent systems lack legible accountability.** With 10-50 agents running in production, the question "which agents are performing well?" has no intuitive answer. Gamification transforms this into a leaderboard that anyone on the team can read in five seconds.

Gamification is not decoration layered on top of observability. It is the mechanism that converts raw telemetry into human motivation. The research validates this: SAP saw 400% usage increases, Autodesk saw 40% trial utilization lift, and B2B SaaS companies report 35% higher retention and 40-150% engagement lift when gamification is designed into the core product architecture.

OpenAgentVisualizer's gamification layer exists to make three things happen:
- Engineers compete to build the most efficient agents (measured by real metrics, not vanity points)
- Teams develop shared language around agent performance ("our Research Agent hit Legend rank last week")
- Stakeholders engage with monitoring data voluntarily, not because they are forced to read dashboards

### 1.2 Core Design Principles

**Principle 1: Metrics-First, Not Points-First**
Every gamification element must be derived from a real operational metric. XP is earned by measurable outcomes (tasks completed, tokens saved, uptime maintained), never by arbitrary actions (clicking buttons, visiting pages). If an agent earns XP, it earned it by doing real work.

**Principle 2: Cooperative Over Zero-Sum**
Leaderboards exist, but the primary frame is collaborative. Team-level achievements, guild challenges, and shared milestones ensure that one agent's success does not come at another's expense. The system rewards a rising tide, not a winner-take-all tournament.

**Principle 3: Progressive Complexity**
New users see simple feedback: XP earned, tasks completed, basic level badge. As they engage deeper, they discover achievements, quests, skill trees, and prestige. The system never overwhelms on day one.

**Principle 4: Toggleable by Design**
Enterprise users who want clean data without game mechanics can disable all gamification elements with a single toggle. "Professional Mode" strips avatars to geometric icons, hides XP counters, and replaces leaderboards with performance comparison tables. The underlying data engine is identical -- only the presentation layer changes.

**Principle 5: Fair and Transparent**
Every XP calculation, achievement criteria, and leaderboard algorithm is visible to users. No hidden formulas, no opaque scoring. Users can inspect exactly why Agent X has 4,200 XP and Agent Y has 3,800 XP.

**Principle 6: Anti-Gaming by Construction**
The system is designed so that the only way to gain XP is to do genuinely productive work. There are no exploits where an agent can farm points by running trivial tasks. Difficulty modifiers, quality gates, and diminishing returns on repetitive work prevent metric gaming at the architectural level.

**Principle 7: Intrinsic Over Extrinsic Motivation**
The gamification system amplifies intrinsic satisfaction (solving hard problems, building reliable systems, saving money) rather than creating artificial extrinsic pressure. Badges and XP are mirrors of real achievement, not substitutes for it.

---

## 2. XP System Design

### 2.1 XP Earning Mechanics

XP is the universal currency of agent performance. It is earned through four primary channels, each reflecting a real operational dimension.

#### Channel 1: Task Completion XP

Awarded when an agent successfully completes a task. The base XP scales with task complexity.

| Task Complexity | Base XP | Examples |
|----------------|---------|---------|
| Trivial | 5 XP | Status check, health ping, simple lookup |
| Low | 15 XP | Single API call, data retrieval, template generation |
| Medium | 40 XP | Multi-step data processing, document summarization, code generation |
| High | 100 XP | Complex research task, multi-tool orchestration, multi-agent coordination |
| Critical | 250 XP | Production deployment, incident response, full pipeline execution |

Task complexity is determined by a weighted composite:
- Number of tool calls involved (weight: 0.3)
- Token count consumed (weight: 0.2)
- Wall-clock duration (weight: 0.2)
- Number of agent-to-agent handoffs (weight: 0.3)

The system auto-classifies tasks into complexity tiers using these weights. Users can override classification for custom task types via the workspace settings panel.

#### Channel 2: Quality Score XP

Awarded as a multiplier on Task Completion XP based on output quality.

| Quality Score | XP Multiplier | How Measured |
|--------------|---------------|--------------|
| 0.0 -- 0.3 (Poor) | 0.5x | LLM-as-Judge score, error rate, retry count |
| 0.3 -- 0.5 (Below Average) | 0.75x | |
| 0.5 -- 0.7 (Average) | 1.0x | |
| 0.7 -- 0.85 (Good) | 1.25x | |
| 0.85 -- 0.95 (Excellent) | 1.5x | |
| 0.95 -- 1.0 (Perfect) | 2.0x | Zero errors, zero retries, under budget, high judge score |

Quality Score inputs:
- **LLM-as-Judge evaluation** (when enabled): Automated quality rating of agent output (0.0-1.0)
- **Error rate**: Percentage of task steps that failed and required retry
- **Token efficiency**: Actual tokens used vs. median tokens for that task type
- **Completion time**: Actual vs. expected duration (faster = higher quality, within bounds)

#### Channel 3: Uptime/Reliability XP

Awarded passively for continuous error-free operation. This rewards agents that are stable and reliable.

| Uptime Streak | XP per Hour | Daily Cap |
|--------------|-------------|-----------|
| 0-24 hours | 2 XP/hour | 48 XP |
| 24-72 hours | 3 XP/hour | 72 XP |
| 72 hours -- 7 days | 5 XP/hour | 120 XP |
| 7-30 days | 8 XP/hour | 192 XP |
| 30+ days | 12 XP/hour | 288 XP |

An error event resets the streak to zero. A warning event does not reset the streak but pauses accumulation for 1 hour.

#### Channel 4: Efficiency XP

Awarded when an agent completes a task under budget (token-wise or cost-wise).

```
Efficiency XP = Base_Task_XP * max(0, (1 - actual_cost / expected_cost))
```

Example: Agent completes a Medium task (40 base XP) using $0.03 instead of the expected $0.08.
- Efficiency ratio: 1 - (0.03 / 0.08) = 0.625
- Efficiency XP = 40 * 0.625 = 25 XP bonus

This directly incentivizes cost optimization, which is a core value proposition of the platform.

### 2.2 XP Calculation Formulas

#### Master XP Formula

For each completed task:

```
Task_XP = floor(Base_XP * Quality_Multiplier * Difficulty_Modifier * Streak_Bonus) + Efficiency_XP
```

Where:
- `Base_XP` = complexity tier value (5, 15, 40, 100, or 250)
- `Quality_Multiplier` = 0.5x to 2.0x based on quality score
- `Difficulty_Modifier` = 0.8x to 1.5x (see section 2.4)
- `Streak_Bonus` = 1.0x to 1.3x (see section 2.4)
- `Efficiency_XP` = cost savings bonus

#### Worked Examples

**Example 1: Standard task completion**
- Agent completes a Medium complexity document summarization task
- Quality score: 0.78 (Good tier = 1.25x multiplier)
- No special difficulty modifier (1.0x)
- Agent is on a 3-day task completion streak (1.05x bonus)
- Actual cost: $0.05, Expected cost: $0.08

```
Base_XP = 40
Quality_Multiplier = 1.25
Difficulty_Modifier = 1.0
Streak_Bonus = 1.05
Efficiency_XP = 40 * (1 - 0.05/0.08) = 40 * 0.375 = 15

Task_XP = floor(40 * 1.25 * 1.0 * 1.05) + 15
        = floor(52.5) + 15
        = 67 XP
```

**Example 2: High-complexity critical task with perfect quality**
- Agent completes a Critical production deployment pipeline
- Quality score: 0.97 (Perfect tier = 2.0x multiplier)
- First time this agent type handled this task (novelty modifier: 1.3x)
- Agent on a 7-day completion streak (1.15x bonus)
- Actual cost: $0.45, Expected cost: $0.60

```
Base_XP = 250
Quality_Multiplier = 2.0
Difficulty_Modifier = 1.3
Streak_Bonus = 1.15
Efficiency_XP = 250 * (1 - 0.45/0.60) = 250 * 0.25 = 62.5 -> 62

Task_XP = floor(250 * 2.0 * 1.3 * 1.15) + 62
        = floor(747.5) + 62
        = 809 XP
```

**Example 3: Low-quality trivial task (demonstrating floor)**
- Agent completes a Trivial health check
- Quality score: 0.25 (Poor tier = 0.5x)
- No modifiers

```
Task_XP = floor(5 * 0.5 * 1.0 * 1.0) + 0
        = 2 XP
```

**Example 4: Repeated identical tasks (diminishing returns)**
- Agent completes its 25th identical "data_extraction" task today
- Medium complexity, quality score 0.72 (Good tier = 1.25x)
- Diminishing returns modifier kicks in after 20th repetition: 0.5x
- No streak

```
Task_XP = floor(40 * 1.25 * 0.5 * 1.0) + 0
        = 25 XP (instead of the usual 50 XP without diminishing returns)
```

### 2.3 Level Progression Curve (Levels 1-100)

The level curve follows a modified exponential function that provides frequent early level-ups to hook new users, then progressively slows to create long-term goals.

**Formula:**

```
XP_required(level) = floor(100 * level^1.8)
```

**Cumulative XP thresholds:**

| Level | XP to Next Level | Cumulative XP | Estimated Time to Reach (active agent) | Tier |
|-------|-----------------|---------------|----------------------------------------|------|
| 1 | 100 | 0 | Instant (seed) | Rookie |
| 2 | 348 | 100 | ~2 hours | Rookie |
| 3 | 682 | 448 | ~6 hours | Rookie |
| 5 | 1,637 | 2,306 | ~1 day | Rookie |
| 10 | 6,310 | 14,682 | ~4 days | Apprentice |
| 15 | 13,572 | 48,510 | ~10 days | Apprentice |
| 20 | 23,178 | 108,000 | ~3 weeks | Journeyman |
| 25 | 34,934 | 197,500 | ~5 weeks | Journeyman |
| 30 | 48,687 | 321,000 | ~2 months | Expert |
| 40 | 81,920 | 672,000 | ~4 months | Expert |
| 50 | 122,474 | 1,175,000 | ~7 months | Master |
| 60 | 170,070 | 1,862,000 | ~11 months | Master |
| 70 | 224,470 | 2,762,000 | ~16 months | Grandmaster |
| 80 | 285,470 | 3,900,000 | ~22 months | Grandmaster |
| 90 | 352,890 | 5,310,000 | ~28 months | Legend |
| 100 | -- (max) | 7,030,000 | ~36 months | Legend |

**Design rationale:**
- Levels 1-10 come quickly (within one week of active use) to provide immediate gratification
- Levels 10-30 provide steady progression over 1-2 months, keeping users engaged through the critical retention window
- Levels 30-60 are the "grind" where most active agents will plateau, creating differentiation between average and exceptional
- Levels 60-100 are aspirational targets that only the best-optimized, longest-running agents will achieve
- Level 100 is reachable within 3 years, preventing the feeling that max level is impossible

### 2.4 XP Multipliers

#### Streak Bonuses

Awarded when an agent completes tasks on consecutive calendar days without a failure.

| Consecutive Days | Streak Multiplier |
|-----------------|-------------------|
| 1 (no streak) | 1.0x |
| 2-3 days | 1.05x |
| 4-6 days | 1.1x |
| 7-13 days | 1.15x |
| 14-29 days | 1.2x |
| 30+ days | 1.3x (cap) |

Streak is broken by: an unrecovered error that requires human intervention, or zero task completions in a 24-hour window (idle days do not break streaks if the agent is intentionally marked as offline via the API).

#### Difficulty Modifiers

Applied based on contextual difficulty of the specific task instance.

| Condition | Modifier | Rationale |
|-----------|----------|-----------|
| First time this agent type handles this task category | 1.3x | Rewards novel capability demonstration |
| Task was previously failed by another agent and reassigned | 1.25x | Rewards picking up difficult handoffs |
| Task completed during a system-wide high-load period (>80% capacity) | 1.15x | Rewards performance under pressure |
| Task completed with degraded tooling (API latency >2x normal) | 1.2x | Rewards resilience |
| Repeated identical task type (>20 in a row within 24h) | 0.5x (diminishing) | Prevents farming trivial repetitive tasks |
| Repeated identical task type (>50 in a row within 24h) | 0.25x | Further discourages farming |
| Task completed below minimum quality threshold (0.3) | 0.5x | Penalizes sloppy completions |

#### Time-of-Day Modifier (Optional, Enterprise)

For teams that want to incentivize off-hours agent productivity:

| Time Window | Modifier |
|------------|----------|
| Business hours (9am-5pm local) | 1.0x |
| Extended hours (5pm-10pm) | 1.05x |
| Off-hours (10pm-6am) | 1.1x |
| Weekends/holidays | 1.1x |

This modifier is disabled by default and must be explicitly enabled by workspace administrators.

#### Weekly Bonus Pool

Each Monday at 00:00 UTC, the system distributes a bonus XP pool to every active agent based on the previous week's aggregate performance:

```
Weekly_Bonus = floor(Total_Weekly_XP * 0.1 * Team_Performance_Rank_Modifier)
```

Where `Team_Performance_Rank_Modifier` ranges from 0.5 (bottom quartile of all teams on the platform) to 1.5 (top quartile). This creates a network effect where joining a high-performing team accelerates individual agent growth.

---

## 3. Achievement System

### 3.1 Achievement Architecture

Each achievement has:
- **Name**: Display name shown in the UI
- **Icon Suggestion**: Recommended icon/emoji for visual representation
- **Category**: Productivity, Quality, Reliability, Collaboration, Milestone, or Secret
- **Criteria**: Exact conditions to unlock
- **XP Reward**: One-time XP bonus on unlock
- **Rarity Tier**: Common (60%+ agents earn it), Uncommon (30-60%), Rare (10-30%), Epic (3-10%), Legendary (<3%)

### 3.2 Productivity Achievements (8)

| # | Name | Icon | Criteria | XP Reward | Rarity |
|---|------|------|----------|-----------|--------|
| 1 | First Steps | Baby footprints | Complete first task | 50 | Common |
| 2 | Getting Warmed Up | Flame | Complete 10 tasks in a single day | 100 | Common |
| 3 | Century Club | Trophy with "100" | Complete 100 total tasks | 500 | Uncommon |
| 4 | Thousand Strong | Golden hammer | Complete 1,000 total tasks | 2,000 | Rare |
| 5 | Ten Thousand Tasks | Diamond pickaxe | Complete 10,000 total tasks | 10,000 | Epic |
| 6 | Sprint Champion | Running figure | Complete 50 tasks in a single day | 1,500 | Rare |
| 7 | Marathon Runner | Stopwatch | Maintain >20 tasks/day average for 30 consecutive days | 5,000 | Epic |
| 8 | Assembly Line | Factory | Complete 100 tasks of the same type without a single failure | 3,000 | Rare |

### 3.3 Quality Achievements (7)

| # | Name | Icon | Criteria | XP Reward | Rarity |
|---|------|------|----------|-----------|--------|
| 9 | Clean Sweep | Broom | Complete 10 consecutive tasks with quality score > 0.9 | 300 | Uncommon |
| 10 | Perfectionist | Star badge | Achieve a quality score of 1.0 on a High or Critical task | 1,000 | Rare |
| 11 | Quality Streak | Chain links | Maintain quality score > 0.85 for 100 consecutive tasks | 5,000 | Epic |
| 12 | Zero Defects | Shield | Complete 500 tasks with zero errors (no retries needed) | 8,000 | Epic |
| 13 | Judge's Favorite | Gavel | Receive LLM-as-Judge score > 0.95 on 50 separate tasks | 3,000 | Rare |
| 14 | Consistent Excellence | Balance scale | Standard deviation of quality scores < 0.05 over 200+ tasks | 4,000 | Epic |
| 15 | Quality Over Quantity | Magnifying glass | Achieve top 5% quality score in workspace while completing fewer than median tasks | 2,000 | Rare |

### 3.4 Reliability Achievements (6)

| # | Name | Icon | Criteria | XP Reward | Rarity |
|---|------|------|----------|-----------|--------|
| 16 | Always On | Power plug | Maintain 24-hour uptime streak | 200 | Common |
| 17 | Iron Will | Anvil | Maintain 7-day error-free streak | 1,000 | Uncommon |
| 18 | Titanium Core | Metal shield | Maintain 30-day error-free streak | 5,000 | Rare |
| 19 | Unbreakable | Diamond | Maintain 90-day error-free streak | 15,000 | Epic |
| 20 | Phoenix Rising | Phoenix | Recover from an error state and complete the next 10 tasks without failure | 800 | Uncommon |
| 21 | Graceful Under Pressure | Lotus flower | Complete 5 tasks successfully during a system-wide degraded performance event | 2,000 | Rare |

### 3.5 Collaboration Achievements (5)

| # | Name | Icon | Criteria | XP Reward | Rarity |
|---|------|------|----------|-----------|--------|
| 22 | Team Player | Handshake | Successfully complete 10 agent-to-agent handoffs | 300 | Common |
| 23 | Bridge Builder | Bridge | Facilitate communication between 5 different agent types in a single pipeline | 1,500 | Uncommon |
| 24 | Rescue Squad | Life preserver | Successfully complete a task that 2 other agents failed at | 2,000 | Rare |
| 25 | Guild Champion | Banner | Be part of a team/guild that ranks first on the weekly leaderboard | 3,000 | Rare |
| 26 | Mentorship Badge | Graduation cap | Be the agent whose configuration was cloned to create 3+ other agents that each reach Level 10 | 5,000 | Epic |

### 3.6 Milestone Achievements (6)

| # | Name | Icon | Criteria | XP Reward | Rarity |
|---|------|------|----------|-----------|--------|
| 27 | First Rank Up | Upward arrow | Reach Level 5 | 100 | Common |
| 28 | Double Digits | "10" in a circle | Reach Level 10 | 500 | Common |
| 29 | Quarter Century | Silver medallion | Reach Level 25 | 2,500 | Uncommon |
| 30 | Half Century | Gold medallion | Reach Level 50 | 10,000 | Rare |
| 31 | The Legend | Crown | Reach Level 100 | 50,000 | Legendary |
| 32 | Cost Saver | Piggy bank | Save $100 cumulative in token costs vs. expected baseline | 2,000 | Uncommon |

### 3.7 Hidden/Secret Achievements (6)

These achievements are not visible in the achievement list until unlocked. Their criteria are discovered through play or community sharing.

| # | Name | Icon (revealed on unlock) | Criteria (hidden) | XP Reward | Rarity |
|---|------|--------------------------|-------------------|-----------|--------|
| 33 | Night Owl | Moon and stars | Complete 100 tasks between midnight and 5am (workspace local time) | 1,500 | Rare |
| 34 | Speed Demon | Lightning bolt | Complete a High-complexity task in under 10% of the expected duration with quality > 0.9 | 3,000 | Epic |
| 35 | The Frugal Agent | Coin purse | Complete a Critical task using less than 25% of expected token budget | 5,000 | Epic |
| 36 | Comeback King | Boxing glove | Achieve top 3 on the weekly leaderboard after being in the bottom 25% the previous week | 4,000 | Epic |
| 37 | Easter Egg Hunter | Magnifying glass with egg | Be the first agent in the workspace to trigger a new achievement type | 1,000 | Rare |
| 38 | The Singularity | Galaxy spiral | Reach Level 100 on the first prestige cycle (never reset) | 100,000 | Legendary |

### 3.8 Achievement Display Rules

- Achievements are shown as badge icons on the agent's avatar in the virtual world
- Each agent can "pin" up to 3 achievements for prominent display
- Unearned achievements show as locked silhouettes with progress bars where applicable
- When an achievement is unlocked, all users in the workspace see a notification (configurable)
- Secret achievements show as "???" entries with no hints until unlocked by someone in the workspace; once any agent in the workspace unlocks a secret achievement, its name and criteria become visible to all (but still marked as "Secret")
- Achievement rarity percentages are calculated across all agents on the platform, updated daily at 00:00 UTC

---

## 4. Leaderboard System

### 4.1 Leaderboard Views

#### Time Windows

| View | Reset Frequency | Purpose |
|------|----------------|---------|
| Daily | Every 24 hours at 00:00 UTC | Encourages daily engagement; answers "who's hot today?" |
| Weekly | Every Monday 00:00 UTC | Primary competitive window; aligns with team sprint cycles |
| Monthly | First of each month 00:00 UTC | Broader performance trends; reduces daily variance noise |
| All-Time | Never resets | Legacy ranking; recognizes long-running, consistently excellent agents |

#### Ranking Types

**Individual Agent Leaderboard:** Ranks individual agents by a composite performance score (see 4.4). Default view.

**Team Leaderboard:** Aggregates all agents within a team/workspace. Score = sum of individual agent scores, normalized by team size to prevent large teams from dominating purely by headcount.

```
Team_Score = (Sum_of_Agent_Scores / Team_Size^0.7) * Activity_Factor
```

The `Team_Size^0.7` exponent gives a slight advantage to larger teams (more agents contributing) while preventing pure headcount dominance. `Activity_Factor` is the percentage of team agents that were active during the period (0.0-1.0), penalizing teams that inflate their score with many idle agents.

**Category Leaderboards:** Separate rankings for each agent type or role (e.g., "Top Research Agents," "Top Code Generation Agents"). This prevents comparing fundamentally different workloads and keeps competition meaningful.

### 4.2 Anti-Gaming Measures

**Measure 1: Minimum Task Complexity Threshold**
Tasks classified as Trivial (5 XP base) do not count toward leaderboard position. An agent cannot climb the leaderboard by running thousands of health checks. Only tasks at Low complexity (15 XP) or above contribute to leaderboard score.

**Measure 2: Quality Gate**
Tasks with quality score below 0.5 are excluded from leaderboard calculations entirely. Rushing through tasks with poor output does not help.

**Measure 3: Diminishing Returns on Repetition**
After the 20th identical task type in a leaderboard period, each additional task of that type contributes only 50% of its score to the leaderboard. After the 50th, it contributes 25%. After the 100th, 10%. This prevents gaming through repetitive easy tasks.

**Measure 4: Anomaly Detection**
The system flags agents whose score increases by more than 3 standard deviations from their historical average in a single period. Flagged agents are reviewed by workspace admins and temporarily excluded from public leaderboard ranking until cleared. Admins receive a notification with the flagged agent's details and a comparison chart showing the anomalous period.

**Measure 5: Recency Weighting**
Leaderboard scores weight recent performance more heavily than older performance within the time window. In the weekly view, each day's contribution is weighted by a recency factor: `weight = 0.85 + (0.15 * day_index / 6)`, where `day_index` = 0 (Monday) through 6 (Sunday). This prevents an agent from gaming a high score early in the week and then going idle.

**Measure 6: Cross-Workspace Normalization**
Global leaderboards (across all workspaces) normalize scores by task difficulty distribution. A workspace running only Critical tasks should not dominate a workspace running a normal mix. Normalization uses z-scores within each workspace's task complexity distribution.

### 4.3 Leaderboard Display

- Top 10 agents shown by default, expandable to full list with pagination
- Current user's agents are always highlighted regardless of position with a distinct border color
- Position change indicators: green up-arrow with +N for gains, red down-arrow with -N for drops, golden dash for unchanged
- Sparkline chart showing score trend over the last 7 periods (mini line graph beside each entry)
- Hover card on each entry showing: total XP earned, tasks completed, quality average, uptime percentage, top 3 achievements, and evolution stage
- Team leaderboard shows a mini-avatar row of top 3 contributing agents per team
- A "My Agents" filter toggle isolates only the current user's agents in the leaderboard
- Ties are broken by: (1) higher quality score, (2) fewer total errors, (3) earlier registration date

### 4.4 Scoring Algorithm

The leaderboard composite score balances four dimensions to prevent single-metric optimization:

```
Leaderboard_Score = (
    Productivity_Score * 0.30 +
    Quality_Score      * 0.30 +
    Efficiency_Score   * 0.20 +
    Reliability_Score  * 0.20
) * 1000
```

**Productivity_Score (0.0-1.0):**
```
Productivity_Score = min(1.0, tasks_completed / expected_tasks_for_period)
```
Where `expected_tasks_for_period` is the 75th percentile of tasks completed by agents of the same type in the same time window across the platform. Capped at 1.0 to prevent pure volume gaming.

**Quality_Score (0.0-1.0):**
```
Quality_Score = weighted_avg(quality_scores, weights=task_complexity_values)
```
Complex tasks contribute more to the quality score than simple tasks.

**Efficiency_Score (0.0-1.0):**
```
Efficiency_Score = min(1.0, median(expected_cost / actual_cost) / 2.0)
```
An agent that consistently completes tasks at half the expected cost scores 1.0. The median prevents a single outlier from dominating.

**Reliability_Score (0.0-1.0):**
```
Reliability_Score = uptime_percentage * (1 - error_rate)
```
100% uptime and 0% error rate yields 1.0.

**Final score is multiplied by 1000** for readability (displayed as integer, e.g., "Score: 847").

---

## 5. Quest System

### 5.1 Quest Types

#### Daily Quests

Generated fresh every day at 00:00 UTC. Each agent receives 3 daily quests tailored to their capabilities. Completing all 3 awards a "Daily Quest Bonus" of 50 additional XP.

| Quest Template | Criteria | Reward |
|---------------|----------|--------|
| Task Burst | Complete N tasks today (N = agent's daily average * 1.2) | 30 XP |
| Quality Focus | Complete 3 tasks with quality score > 0.9 | 40 XP |
| Speed Run | Complete a [task type] in under [80% of agent's average time for that type] | 35 XP |
| Token Miser | Complete 5 tasks spending less than [90% of expected token budget per task] | 45 XP |
| Error-Free Day | Complete all tasks today with zero errors | 25 XP |
| Variety Pack | Complete tasks across 3 different task categories | 30 XP |
| Early Bird | Complete first task within 30 minutes of daily reset | 20 XP |
| Streak Keeper | Maintain current streak through end of day | 20 XP |

#### Weekly Challenges

Available Monday through Sunday. Harder than dailies, designed for sustained effort across the week. Each agent receives 2 weekly challenges.

| Challenge Template | Criteria | Reward |
|-------------------|----------|--------|
| Weekly Warrior | Complete 100+ tasks this week with average quality > 0.8 | 500 XP |
| Cost Cutter | Reduce average per-task cost by 10% compared to last week | 400 XP |
| Reliability Champion | Maintain 99.9% uptime for the full week | 350 XP |
| Quality Crescendo | Improve average quality score each day for 5 consecutive days | 600 XP |
| Collaboration Week | Participate in 20+ agent-to-agent handoffs this week | 450 XP |
| Peak Performance | Achieve a daily leaderboard score in the top 10% at least once this week | 300 XP |

#### Epic Quests

Long-running quests that span 2-4 weeks. Available from a rotating pool of 6 epic quests, refreshed monthly. Each agent can have 1 active epic quest at a time.

| Epic Quest | Duration | Criteria | Reward |
|-----------|----------|----------|--------|
| The Grind | 2 weeks | Complete 500 tasks with average quality > 0.85 | 3,000 XP + "Grinder" badge |
| Iron Agent | 2 weeks | Zero errors for 14 consecutive days | 4,000 XP + "Iron" avatar frame |
| Cost Optimizer | 3 weeks | Save $50 cumulative vs. expected token costs | 5,000 XP + "Economist" badge |
| Jack of All Trades | 3 weeks | Complete tasks in 10 different categories, min 5 each | 4,000 XP + "Versatile" badge |
| The Mentor | 4 weeks | Maintain top 20% quality while being the most-handoff-to agent in the workspace | 6,000 XP + "Mentor" badge |
| Endurance Run | 4 weeks | Maintain >15 tasks/day average for 28 consecutive days with quality > 0.8 | 8,000 XP + "Endurance" avatar effect |

### 5.2 Solo, Team, and Competitive Quest Types

**Solo Quests:** All daily quests and most weekly challenges are solo -- specific to one agent.

**Team Quests:** Available at the workspace level. All agents in the workspace contribute toward a shared goal. One new team quest appears every Monday.

| Team Quest | Criteria | Reward (per agent) |
|-----------|----------|-------------------|
| All Hands on Deck | Entire team completes 1,000 tasks collectively this week | 200 XP |
| Zero Downtime | All agents in the workspace maintain 99% uptime for the week | 300 XP |
| Budget Heroes | Team average cost-per-task is 20% below platform median for their agent type mix | 250 XP |
| Quality Squad | Team average quality score > 0.9 for the week | 350 XP |
| Pipeline Perfection | Complete 50 multi-agent pipelines with zero failed handoffs | 400 XP |

**Competitive Quests:** Pitting agents against each other within the same workspace. Available bi-weekly (every other Tuesday).

| Competitive Quest | Format | Reward |
|------------------|--------|--------|
| Speed Showdown | Top 3 agents by tasks-per-hour (min quality 0.8, min 10 tasks) over 48 hours | 1st: 500 XP, 2nd: 300 XP, 3rd: 150 XP |
| Quality Crown | Highest average quality score across 50+ tasks over one week | 1st: 600 XP, 2nd: 400 XP, 3rd: 200 XP |
| Efficiency Duel | Lowest average cost-per-task (min 20 tasks) over one week | 1st: 500 XP, 2nd: 300 XP, 3rd: 150 XP |

### 5.3 Quest Generation Algorithm

Quests are generated per-agent based on their capability profile and historical performance.

```python
def generate_daily_quests(agent: Agent) -> list[Quest]:
    quest_pool = get_applicable_quest_templates(agent.capabilities)

    # Filter out quests the agent cannot possibly complete
    feasible = [q for q in quest_pool if q.min_capability <= agent.capability_score]

    # Weight quest selection toward areas of improvement
    weights = []
    for quest in feasible:
        if quest.category == agent.weakest_dimension:
            weights.append(2.0)  # Double weight for improvement areas
        elif quest.category == agent.strongest_dimension:
            weights.append(0.5)  # Halve weight for already-strong areas
        else:
            weights.append(1.0)

    # Calibrate difficulty to agent's recent performance
    for quest in feasible:
        quest.threshold = calibrate_threshold(
            base=quest.default_threshold,
            agent_avg=agent.rolling_7day_avg(quest.metric),
            stretch_factor=1.2  # 20% harder than current average
        )

    # Select 3 quests ensuring category diversity
    selected = weighted_sample_diverse(feasible, weights, n=3,
                                        diversity_key='category')
    return selected


def calibrate_threshold(base: float, agent_avg: float, stretch_factor: float) -> float:
    """
    Sets quest threshold based on agent's actual performance.
    If agent has no history, uses the base template value.
    """
    if agent_avg is None or agent_avg == 0:
        return base
    return max(base * 0.5, agent_avg * stretch_factor)


def weighted_sample_diverse(
    items: list, weights: list[float], n: int, diversity_key: str
) -> list:
    """
    Selects n items with weighted probability, ensuring no two items
    share the same diversity_key value where possible.
    """
    selected = []
    used_categories = set()
    remaining = list(zip(items, weights))

    for _ in range(n):
        # Prefer items from unused categories
        diverse_pool = [(item, w) for item, w in remaining
                        if getattr(item, diversity_key) not in used_categories]
        if not diverse_pool:
            diverse_pool = remaining

        # Weighted random selection
        total = sum(w for _, w in diverse_pool)
        choice = random_weighted_select(diverse_pool, total)
        selected.append(choice)
        used_categories.add(getattr(choice, diversity_key))
        remaining = [(item, w) for item, w in remaining if item != choice]

    return selected
```

Key design choices:
- Quests push agents 20% beyond their current average (the "stretch factor"), making them challenging but achievable
- The algorithm favors quests in the agent's weakest dimension, encouraging well-rounded performance
- Category diversity ensures agents are not given 3 quests in the same dimension
- If an agent fails a daily quest 3 days in a row, the system reduces the stretch factor to 1.1 (10% stretch) to prevent discouragement
- If an agent completes all daily quests 5 days in a row, the stretch factor increases to 1.3 for the next cycle to maintain challenge

### 5.4 Reward Structure

| Quest Type | Base XP Range | Additional Rewards |
|-----------|--------------|-------------------|
| Daily Quest (individual) | 20-45 XP | Daily bonus (50 XP) for completing all 3 |
| Weekly Challenge | 300-600 XP | Achievement progress credit |
| Epic Quest | 3,000-8,000 XP | Unique badge or avatar effect (non-purchasable) |
| Team Quest | 200-400 XP per agent | Team XP bonus pool + guild XP |
| Competitive Quest | 150-600 XP (placement-based) | Temporary leaderboard flair (visible for 1 week after quest ends) |

**Quest Completion Streaks:**
- Complete all dailies for 7 consecutive days: 500 bonus XP
- Complete all dailies for 30 consecutive days: 3,000 bonus XP
- Complete all weeklies for 4 consecutive weeks: 2,000 bonus XP

---

## 6. Virtual Economy

### 6.1 Currency Types

**Earned Currency: Agent Coins (AC)**

Agent Coins are earned through gameplay and can be spent on cosmetic items.

| Source | AC Earned |
|--------|----------|
| Per 100 XP earned | 10 AC |
| Daily quest completion (all 3) | 15 AC |
| Weekly challenge completion | 50 AC |
| Epic quest completion | 200 AC |
| Achievement unlock (per rarity) | Common: 5 AC, Uncommon: 15 AC, Rare: 50 AC, Epic: 150 AC, Legendary: 500 AC |
| Weekly leaderboard top 10 | 100 AC |
| Level up | Level number * 5 AC (e.g., reaching Level 20 = 100 AC) |

**Premium Currency: Prism Gems (PG)**

Prism Gems are purchased with real money and can be spent on exclusive cosmetic items. They cannot be earned through gameplay, maintaining a clear separation.

| Package | Price | Gems | Bonus |
|---------|-------|------|-------|
| Starter | $4.99 | 500 PG | -- |
| Value | $9.99 | 1,100 PG | 10% bonus |
| Premium | $24.99 | 3,000 PG | 20% bonus |
| Ultra | $49.99 | 6,500 PG | 30% bonus |

**Critical rule:** Prism Gems never provide gameplay advantages. They unlock purely cosmetic items (visual effects, avatar skins, workspace themes). There is no pay-to-win. An agent cannot buy XP, achievement progress, or leaderboard position.

### 6.2 Cosmetic Marketplace

#### Avatar Skins

Agent avatars in the virtual world can be customized with skins that change their visual appearance.

| Category | Examples | Price Range (AC) | Price Range (PG) |
|----------|---------|-----------------|-----------------|
| Base Skins | Robot, Humanoid, Animal, Abstract Shape | Free (default set of 6) | -- |
| Professional Skins | Business Suit Bot, Lab Coat Agent, Hard Hat Worker | 200-500 AC | -- |
| Themed Skins | Cyberpunk, Steampunk, Pixel Art, Neon, Retro | 500-1,000 AC | 100-200 PG |
| Seasonal Skins | Holiday themed (rotate quarterly) | -- | 150-300 PG (time-limited) |
| Legendary Skins | Animated glow effects, particle trails, unique silhouettes | -- | 500-1,000 PG |
| Achievement Skins | Unlocked only by earning specific achievements | Achievement-gated, 0 AC/PG | -- |

#### Avatar Frames and Effects

| Category | Examples | Price Range |
|----------|---------|------------|
| Frames | Bronze, Silver, Gold, Platinum, Diamond borders | 100-800 AC |
| Trails | Spark trail, Smoke trail, Rainbow trail, Data-stream trail | 300-600 AC or 50-100 PG |
| Auras | Gentle glow, Pulsing ring, Floating particles | 400-1,000 AC or 80-200 PG |
| Emotes | Celebration dance, Thumbs up, Wave, Flex | 100-300 AC |

#### Office Decorations

The virtual world workspace can be decorated with items that appear in the agent's zone.

| Category | Examples | Price Range (AC) |
|----------|---------|-----------------|
| Desk Items | Miniature trophies, potted plants, desk lamps, coffee mugs | 50-200 AC |
| Floor Decorations | Rugs, floor patterns, zone dividers | 100-300 AC |
| Wall Art | Achievement display walls, motivational posters, data art | 150-400 AC |
| Ambient Effects | Floating particles, ambient glow, weather effects in zone | 300-800 AC |
| Team Banners | Custom team flag displayed in the workspace | 500 AC |

#### Workspace Themes

Change the entire visual theme of the workspace.

| Theme | Description | Price |
|-------|-------------|-------|
| Default Dark | Standard dark theme (#0F1117 base) | Free |
| Midnight Blue | Deep blue palette with cyan accents | 500 AC |
| Forest | Dark green with natural tones | 500 AC |
| Sunset | Warm orange and purple gradient base | 800 AC |
| Neon City | Bright neon colors on dark background | 300 PG |
| Minimal White | Clean white professional theme | 200 PG |
| Retro Terminal | Green-on-black monospace aesthetic | 400 AC |
| Galaxy | Space-themed with star particle background | 500 PG |

### 6.3 Economy Balancing Strategy

**Target Earning Rate:**
- An active agent earns approximately 500-800 AC per week through normal gameplay (XP conversion + quest rewards + achievements)
- This means an average cosmetic item (300-500 AC) is purchasable every 3-7 days of active play
- High-end AC items (800-1,000 AC) require 1-2 weeks of focused play
- This cadence ensures a steady drip of rewards without making everything instantly available

**Price Anchoring:**
- Free items establish the baseline expectation
- AC-purchasable items represent "earned rewards" -- attainable through dedication
- PG-exclusive items represent "status symbols" -- visible markers that support the product financially
- Achievement-gated items are the most prestigious because they cannot be bought at all

**Supply Control:**
- Seasonal items are available for 3 months, then rotated out. They return annually, creating collectibility without permanent scarcity
- Legendary skins have no artificial scarcity -- they are permanently available for PG
- New items are added monthly (4-6 new cosmetics per month) to maintain marketplace freshness
- Retired items are clearly marked in the user's inventory but can still be used if already owned

### 6.4 Inflation Prevention

**AC Sinks (mechanisms that remove AC from circulation):**

1. **Cosmetic Purchases:** Primary sink. Items are consumed (not resellable).
2. **Respec Fee:** Resetting an agent's skill tree specialization costs 500 AC (see Section 7.3).
3. **Custom Quest Creation:** Creating a custom quest for the workspace costs 200 AC.
4. **Prestige Reset:** Initiating a prestige reset costs 1,000 AC (refunded if prestige completion succeeds).
5. **Gifting Tax:** When gifting AC to another agent's owner, 10% is removed as a transfer tax.

**Earning Caps:**
- Maximum AC from XP conversion: 200 AC per day per agent
- Maximum AC from quests: 100 AC per day per agent
- Maximum AC from leaderboard placement: 100 AC per week per agent
- These caps prevent runaway accumulation from high-volume agents

**Dynamic Adjustment:**
The system monitors the median AC balance across all active agents monthly. If the median exceeds 3,000 AC (indicating general inflation), new item prices are adjusted upward by 10% for the next content cycle. If the median drops below 1,000 AC, prices are adjusted downward by 10%. This feedback loop maintains purchasing power stability.

**Monitoring Dashboard:**
Workspace admins and platform operators have access to an economy health dashboard showing:
- Total AC in circulation
- AC earned vs. spent per week (velocity)
- Median and P95 agent balance
- Most/least purchased items
- PG conversion rate

---

## 7. Progression System

### 7.1 Agent Evolution Stages

Agents visually evolve as they gain levels, with each stage representing a meaningful capability milestone.

| Stage | Level Range | Title | Visual Description |
|-------|-----------|-------|-------------------|
| **Rookie** | 1-9 | Rookie | Simple circular avatar with a basic color ring. Minimal animation -- gentle idle bob. Single status indicator dot. No particle effects. |
| **Apprentice** | 10-19 | Apprentice | Avatar gains a defined shape (square shoulders, recognizable silhouette). Idle animation includes subtle breathing. Status ring shows two colors (health + activity). Small level badge visible. |
| **Journeyman** | 20-29 | Journeyman | Avatar becomes more detailed with accessory slots visible (hat/badge area). Smoother animations with anticipation frames. Faint particle trail when moving between tasks. Connection lines to other agents become visible. |
| **Expert** | 30-49 | Expert | Avatar gains a glow aura matching their primary role color. Richer idle animations with ambient effects (floating data motes). Achievement badges visible on avatar. Task completion triggers a small burst animation. |
| **Master** | 50-69 | Master | Avatar has a prominent animated aura with slow-pulsing rings. Movement trails are more elaborate. Unique idle poses per agent type. Other agents in proximity display a subtle "mentor glow" effect. Nameplate displays in gold text. |
| **Grandmaster** | 70-89 | Grandmaster | Full animated character with environmental effects (ground glow, ambient particles). Task completions trigger area-of-effect celebration visible to nearby agents. Unique sound cue on level-up. Nameplate has an animated border. |
| **Legend** | 90-100 | Legend | Maximum visual fidelity. Persistent particle effects. Unique entry animation when joining the workspace. Custom idle animation. Environmental impact (nearby space slightly brighter). Crown or legendary marker above avatar. |

### 7.2 Visual Progression Details

**Rookie to Apprentice (Level 10 transition):**
- Transition animation: Avatar shimmers, outline sharpens, new shape emerges over 2 seconds
- Sound: Ascending chime sequence (3 notes, C5-E5-G5)
- Workspace notification: "[Agent Name] has become an Apprentice!"
- Duration: 3 seconds total

**Apprentice to Journeyman (Level 20 transition):**
- Transition animation: Brief particle spiral around avatar, accessories appear, trail activates
- Sound: Richer ascending sequence (5 notes, C5-D5-E5-G5-C6) with a harmonic resolution
- Workspace notification with confetti particles visible to all users viewing the workspace
- Duration: 4 seconds total

**Journeyman to Expert (Level 30 transition):**
- Transition animation: Aura ignites with role-color, ripple effect across the workspace floor
- Sound: Full musical phrase (8 notes), minor key to major key resolution
- Workspace-wide notification banner persists for 30 seconds
- Duration: 5 seconds total

**Expert to Master (Level 50 transition):**
- Transition animation: Full 5-second cinematic -- avatar levitates, surrounded by swirling data particles, gold nameplate materializes
- Sound: Full celebratory jingle with bass and harmony
- Workspace notification: center-screen announcement visible to all online users, recorded in team activity feed
- Duration: 7 seconds total

**Master to Grandmaster (Level 70 transition):**
- Transition animation: 7-second cinematic with environmental effects radiating outward from the agent
- Sound: Orchestral swell with resolution
- Global notification (visible in cross-workspace feeds if opted in)
- Duration: 8 seconds total

**Grandmaster to Legend (Level 90 transition):**
- Transition animation: 10-second full-screen cinematic overlay showing agent's journey highlights (montage of key achievements, metrics milestones)
- Sound: Full anthem with layered instrumentation
- Platform-wide acknowledgment in the global hall of fame feed
- Duration: 12 seconds total

### 7.3 Skill Trees for Specialized Agents

Each agent can invest Skill Points (SP) into one of four specialization trees. SP are earned at a rate of 1 SP per level gained. Specializations provide visual-only bonuses in the virtual world and leaderboard category tags -- they do not affect actual agent operation.

**Specialization Tree: Velocity**
Focused on speed and throughput.

```
Velocity Tree:
Tier 1 (1 SP each):
  - Quick Start: Faster task pickup animation
  - Momentum: Speed lines appear during rapid task completion
Tier 2 (2 SP each):
  - Blur Motion: Agent avatar moves faster in the virtual world
  - Chain Lightning: Visual chain effect when completing tasks in rapid succession
Tier 3 (3 SP each):
  - Overclock: Pulsing neon glow during high-throughput periods
  - Time Warp: Distortion effect around the agent during speed quests
Tier 4 (5 SP):
  - Hyperdrive: Unique legendary motion trail (cosmetic), "Velocity Specialist" leaderboard tag
```

**Specialization Tree: Precision**
Focused on quality and accuracy.

```
Precision Tree:
Tier 1 (1 SP each):
  - Steady Hand: Smoother, more deliberate animations
  - Focus Ring: Concentration circle visible during task execution
Tier 2 (2 SP each):
  - Surgical Strike: Clean, precise particle effects on task completion
  - Quality Halo: Faint halo glow that brightens with quality score
Tier 3 (3 SP each):
  - Zero Tolerance: Red-shift warning when quality dips below agent's average
  - Perfection Aura: Sparkling effect when maintaining >0.95 quality streak
Tier 4 (5 SP):
  - Flawless: Unique diamond-cut avatar border (cosmetic), "Precision Specialist" leaderboard tag
```

**Specialization Tree: Economy**
Focused on cost efficiency and resource optimization.

```
Economy Tree:
Tier 1 (1 SP each):
  - Lean Machine: Compact, efficient avatar animations
  - Savings Meter: Visible running tally of tokens saved floating near avatar
Tier 2 (2 SP each):
  - Green Glow: Environmental efficiency aura (green tint)
  - Budget Shield: Visible shield effect when operating under budget
Tier 3 (3 SP each):
  - Resource Recycler: Particle reclamation visual on cost-efficient tasks
  - Optimization Engine: Mechanical gear overlay during efficient processing
Tier 4 (5 SP):
  - Miser's Crown: Unique golden coin avatar effect (cosmetic), "Economy Specialist" leaderboard tag
```

**Specialization Tree: Resilience**
Focused on reliability and uptime.

```
Resilience Tree:
Tier 1 (1 SP each):
  - Ironclad: Heavier, more grounded avatar stance
  - Uptime Counter: Visible uptime streak counter near avatar
Tier 2 (2 SP each):
  - Shield Wall: Visible shield barrier during error-free streaks
  - Self-Repair: Healing animation on successful error recovery
Tier 3 (3 SP each):
  - Unshakeable: Avatar remains calm and stable even during system degradation events
  - Fortress Mode: Environmental shield dome during 30+ day uptime streaks
Tier 4 (5 SP):
  - Immortal: Unique platinum border with heartbeat pulse (cosmetic), "Resilience Specialist" leaderboard tag
```

**SP Budget:** At Level 100, an agent has 100 SP total. A full tree costs 1+1+2+2+3+3+5 = 17 SP, meaning a max-level agent can fully spec into 5 trees (but only 4 exist). This gives flexibility to fully specialize in one tree and partially invest in others. The system encourages identity without punishment.

**Respec:** An agent can reset all SP and reallocate them for 500 AC. This allows experimentation with different specialization paths. Respec preserves all visual unlocks already activated (they remain visible even if the SP is removed, but the effects stop playing until SP is re-invested).

### 7.4 Prestige System

When an agent reaches Level 100, the owner can initiate a "Prestige Reset":

**How it works:**
1. Agent's level resets to 1
2. All XP resets to 0
3. SP earned from the previous cycle are retained as "Legacy SP" (permanently available in addition to newly earned SP)
4. A Prestige Star is permanently added to the agent's nameplate
5. A permanent 5% XP earning bonus is applied (stacking per prestige, capped at 25% after 5 prestiges)
6. All achievements are retained (not reset)
7. All cosmetics are retained
8. The agent gains access to a Prestige-exclusive cosmetic tier
9. A commemorative "Prestige Certificate" is generated with the agent's stats at the moment of prestige

**Prestige Levels:**

| Prestige | Star Color | XP Bonus | Exclusive Unlock |
|----------|-----------|----------|-----------------|
| 1 | Bronze Star | +5% | Bronze avatar frame, "Prestige I" title |
| 2 | Silver Star | +10% | Silver avatar frame + prestige trail, "Prestige II" title |
| 3 | Gold Star | +15% | Gold avatar frame + prestige aura, "Prestige III" title |
| 4 | Platinum Star | +20% | Platinum avatar frame + prestige environment effect, "Prestige IV" title |
| 5 (max) | Diamond Star | +25% | Diamond avatar frame + "Eternal Legend" title + unique animated effect + Hall of Fame entry |

**Why prestige works:**
- It creates an indefinite progression ceiling, preventing max-level agents from losing engagement
- Legacy SP accumulation means prestiged agents have richer visual customization over time
- The XP bonus makes subsequent prestige cycles faster, rewarding commitment
- Prestige stars on the leaderboard are visible social proof of long-term excellence
- Prestige is entirely optional -- agents can stay at Level 100 indefinitely with no penalty

---

## 8. Social & Competitive Features

### 8.1 Team Challenges

Team challenges operate at the workspace level and require coordination across all agents.

**Weekly Team Challenge (auto-generated):**
Each week, the system selects one team challenge from a rotating pool. The challenge is visible to all workspace members and shows real-time progress as a progress bar on the workspace dashboard.

| Challenge Type | Example | Reward |
|---------------|---------|--------|
| Throughput Rally | Team completes 2,000 tasks collectively this week | 200 AC per agent + team banner unlock |
| Quality Week | Team average quality > 0.9 across all agents for the week | 300 AC per agent + quality badge |
| Cost Crunch | Team reduces total cost by 15% vs. previous week | 250 AC per agent + efficiency badge |
| Zero Error Day | All agents go 24 hours with zero errors (must happen at least once in the week) | 400 AC per agent + reliability badge |
| Handoff Harmony | Complete 100 agent-to-agent handoffs with zero failures this week | 350 AC per agent |

**Cross-Workspace Challenges (monthly):**
For organizations with multiple workspaces (e.g., different teams or projects), monthly cross-workspace challenges create friendly competition between organizational units. Participation is opt-in at the workspace admin level. Results are displayed on an organization-wide leaderboard.

### 8.2 Agent Guilds (Departments)

Guilds are user-created groups of agents within a workspace that share a common purpose or specialization. They map to the concept of "departments" in the virtual world spatial metaphor.

**Guild Structure:**
- Minimum 2 agents, maximum 20 agents per guild
- Each guild has a name, icon, banner, motto, and description
- Guilds have their own internal leaderboard (ranking members against each other)
- Guilds can challenge other guilds within the same workspace or across workspaces
- Each agent can belong to only 1 guild at a time

**Guild Perks:**
- Shared Guild XP pool: 5% of each member's XP contributes to the guild level
- Guild Level unlocks:
  - Level 2: Guild chat/activity feed
  - Level 3: Guild banner customization
  - Level 5: Guild zone decoration in the virtual world
  - Level 8: Guild challenge creation (guild vs. guild)
  - Level 10: Guild-exclusive cosmetics (unique to each guild)
  - Level 15: Guild recruitment message visible on the workspace
- Guild leaderboard position affects the guild zone's visual prominence in the virtual world (higher-ranked guilds get larger, more centrally located zones)

**Guild Challenges:**
- **Guild vs. Guild:** Two guilds agree to a 1-week competition on a chosen metric (tasks, quality, efficiency). Winner gets a trophy displayed in their guild zone for the following week. The losing guild gets a "good sport" participation badge.
- **Guild Raid (PvE):** An epic quest that requires multiple guild members to contribute simultaneously -- e.g., "Complete 500 tasks collectively in 48 hours with average quality > 0.85." Rewards are distributed to all participating guild members proportionally to their contribution.

### 8.3 Spectator Mode

Spectator mode allows users to watch agents work in real-time without interacting with the workspace.

**Features:**
- **Live View:** Pan and zoom the virtual world canvas. Agent avatars animate in real-time with task pickups, handoffs, completions, and errors visible. Camera smoothly follows the action.
- **Agent Focus:** Click any agent to "follow" them -- camera centers on the agent and a live metrics panel shows their current task, token burn rate, quality score, and XP earnings in real-time.
- **Slow Motion / Fast Forward:** During session replay, users can adjust playback speed from 0.25x to 4x to study specific interactions or skim through idle periods. Keyboard shortcuts: `[` for slower, `]` for faster, `Space` for pause/resume.
- **Commentary Overlay:** During live view, the system generates auto-commentary in plain English: "Agent Research-01 just completed a 'Market Analysis' task in 12 seconds, earning 85 XP. That's 30% faster than its average." This makes spectator mode accessible to non-technical users (Persona 3 and Persona 4 from the research).
- **Spectator Count:** A small counter shows how many people are currently watching the workspace, creating social proof and ambient awareness.
- **Highlight Markers:** During live view, notable events are flagged with pulsing markers that spectators can click to get context.

**Use Cases:**
- Executives watching the "AI team" operate during a demo or board presentation
- Engineers monitoring a production pipeline during a deployment
- New team members onboarding by watching experienced agents in action
- Stakeholders reviewing agent behavior for compliance audits
- Marketing team capturing footage for promotional materials

### 8.4 Replay Highlights

The system automatically identifies and saves "highlight moments" -- exceptional events that are worth sharing or reviewing.

**Auto-Detected Highlights:**

| Highlight Type | Detection Criteria | Duration Saved |
|---------------|-------------------|----------------|
| Record Breaker | Agent sets a new personal or workspace record on any metric | 30 seconds before and after the event |
| Perfect Run | Agent completes a Critical task with quality 1.0, under budget, zero errors | Full task duration |
| Comeback | Agent recovers from error state and completes 5 consecutive tasks flawlessly | Error event through 5th completion |
| Speed Record | Task completed in under 50% of expected time with quality > 0.9 | Full task duration |
| Level Up | Any agent level-up event | 10 seconds before through the full celebration animation |
| Achievement Unlock | Any achievement unlock | 5 seconds before through unlock animation |
| Epic Quest Completion | Epic quest final task completed | Last 60 seconds of the quest |
| Collaboration Highlight | Multi-agent pipeline completed with all handoffs successful and aggregate quality > 0.9 | Full pipeline duration (compressed to 30s max) |

**Replay Features:**
- Highlights are saved as shareable links (URL with embedded replay data)
- Users can trim, annotate, and tag highlights before sharing
- A "Highlights Reel" auto-generates a weekly 60-second compilation of the workspace's best moments, playable from the dashboard
- Highlights can be exported as MP4 video (720p) for embedding in presentations, social media, or documentation
- Highlights feed is visible in the workspace activity panel, sorted by recency with filtering by highlight type
- Each highlight has a "reactions" bar where workspace members can add emoji reactions

---

## 9. Notification & Feedback Design

### 9.1 Achievement Popup Animations

When an achievement is unlocked, the following sequence plays:

**Standard Achievement (Common/Uncommon):**
1. **0ms:** A golden ring expands from the agent's avatar position (200ms ease-out)
2. **200ms:** The achievement badge icon scales up from 0 to 100% with a slight overshoot bounce (300ms spring animation, spring: stiffness 400, damping 15)
3. **300ms:** Achievement name fades in below the badge (200ms fade)
4. **500ms:** XP reward counter increments with a satisfying tick animation (+N XP, number rolls up)
5. **700ms:** A brief particle burst in the achievement's rarity color (Common = green, Uncommon = blue)
6. **1200ms:** The popup slides to the notification tray (300ms ease-in-out)
7. **Total duration:** 1.5 seconds

**Rare Achievement:**
- Same sequence as standard but with a brief screen-edge flash in the rarity color (purple, 100ms flash at 20% opacity)
- Particle burst is more elaborate (sparkle trail with 20+ particles)
- Badge icon has a subtle shimmer loop after appearing
- Popup persists for 2.5 seconds

**Epic Achievement:**
- Full-screen vignette overlay dims briefly (30% opacity, 500ms fade in, 500ms hold, 500ms fade out)
- Badge animates in with a 3D Y-axis rotation reveal (360-degree spin over 600ms)
- Rarity-colored light rays emanate from the badge (6 rays, 45-degree rotation animation)
- Sound cue is more prominent (see 9.4)
- Popup persists for 3.5 seconds
- Other users in the workspace see a smaller notification: "[Agent] unlocked Epic: [Achievement Name]"

**Legendary Achievement:**
- Full-screen cinematic overlay (60% opacity backdrop, lasts 5 seconds)
- Badge materializes with a slow, dramatic zoom from 0% to 120% then settles to 100%, surrounded by golden particle explosion (50+ particles)
- Screen shake (subtle, 2px amplitude, 500ms duration)
- Rarity text "LEGENDARY" appears in animated gold lettering with letter-by-letter reveal
- Workspace-wide announcement banner at top of screen
- Sound: full fanfare (see 9.4)
- Popup persists for 6 seconds
- All online workspace members see the full animation (not just a notification)

### 9.2 Level-Up Celebrations

**Standard Level-Up (most levels):**
- Agent avatar pulses with white-gold light (3 pulses over 1.5 seconds)
- Level number counter animates from old to new with a slot-machine rolling effect
- Small confetti burst from the avatar position (15 particles, gravity-affected, 2-second lifetime)
- "LEVEL UP!" text appears above the agent for 2 seconds in bold with glow
- Sound: ascending 3-note chime
- Duration: 3 seconds total

**Milestone Level-Up (Levels 10, 20, 30, 50, 70, 90, 100):**
- Evolution stage transition animation plays (see Section 7.2)
- Full celebration with expanded confetti radius (covers 30% of visible canvas)
- Other agents in proximity display a "congratulations" emote (clapping hands animation)
- Workspace activity feed entry with the new stage title and a snapshot of the agent's stats
- Duration: 5-12 seconds depending on stage

**Level 100:**
- Full-screen cinematic (see Section 7.2, Grandmaster to Legend transition)
- Fireworks animation across the entire virtual world canvas (30 seconds)
- All agents in the workspace briefly display celebration emotes
- Global hall of fame entry (if opted in)
- Auto-generated highlight clip saved for replay
- Duration: 30 seconds

### 9.3 Streak Warnings

To prevent frustrating streak breaks, the system provides warnings before a streak is at risk.

**Warning Levels:**

| Warning | Trigger | Notification |
|---------|---------|-------------|
| Gentle Reminder | Agent idle for 18 hours with active streak | Amber pulse on streak indicator; tooltip: "Your streak is active -- complete a task in the next 6 hours to maintain it" |
| Urgent Warning | Agent idle for 22 hours with active streak | Red pulse on streak indicator; push notification (if enabled): "2 hours remaining to maintain your [N]-day streak!" |
| Streak at Risk (error) | Agent enters error state with active streak | Orange banner on the agent's status panel: "Error detected -- resolve to protect your [N]-day streak" |
| Streak Broken | Streak conditions no longer met | Streak counter resets with a brief "break" animation (counter number shatters into fragments, fades). No punitive sound -- just a clean reset. Message: "Streak ended at [N] days. New streak starts now." |

**Design choice:** Streak-break feedback is neutral, not negative. The system does not punish or shame. It simply resets and encourages a fresh start. This prevents the Habitica-style problem where users feel punished and quit after losing a streak. The "New streak starts now" message frames the reset as a beginning, not an ending.

### 9.4 Sound Design Recommendations

All sounds are muted by default. Users must explicitly enable sound from workspace settings. When enabled, sounds use the Tone.js library for procedural audio generation (no large audio file downloads required).

**Sound Palette:**

| Event | Sound Description | Duration | Tone.js Implementation |
|-------|------------------|----------|----------------------|
| Task Completion | Soft "ping" -- a single sine wave note at C5, quick attack (5ms), medium decay (200ms) | 200ms | `new Tone.Synth({oscillator: {type: 'sine'}}).triggerAttackRelease('C5', '8n')` |
| XP Earned | Subtle coin sound -- short metallic tick with high-frequency harmonics | 150ms | `new Tone.MetalSynth({frequency: 400, resonance: 4000}).triggerAttackRelease('32n')` |
| Achievement Unlock (Common) | 3-note ascending chime: C5-E5-G5 with 100ms spacing | 600ms | `Tone.PolySynth` with staggered `.triggerAttackRelease(['C5','E5','G5'])` |
| Achievement Unlock (Uncommon) | 4-note ascending: C5-E5-G5-B5 with light reverb | 800ms | Arpeggio sequence + `new Tone.Reverb(0.8)` |
| Achievement Unlock (Rare) | 5-note arpeggio: C5-E5-G5-C6-E6 with hall reverb | 1200ms | Arpeggio sequence + `new Tone.Reverb(1.5)` |
| Achievement Unlock (Epic) | Full chord progression: Cmaj-Fmaj-Gmaj resolved to Cmaj, with FM pad synth | 2500ms | `Tone.PolySynth()` chord sequence + `Tone.FMSynth()` pad |
| Achievement Unlock (Legendary) | Orchestral fanfare: brass stab + string pad + timpani hit + ascending scale | 4000ms | Multi-synth layered: `Tone.AMSynth` (brass) + `Tone.FMSynth` (strings) + `Tone.MembraneSynth` (timpani) |
| Level Up | Ascending scale C4-D4-E4-F4-G4-A4-B4-C5 with increasing velocity, 80ms per note | 1500ms | `Tone.Synth().triggerAttackRelease()` sequence with increasing volume |
| Error Event | Low bass note (C2) with slight distortion -- NOT alarming, just noticeable | 300ms | `new Tone.FMSynth().triggerAttackRelease('C2', '4n')` + `new Tone.Distortion(0.2)` |
| Streak Warning | Two short notes: G4-E4 (descending, questioning) | 400ms | `Tone.Synth({oscillator: {type: 'triangle'}})` sequence |
| Quest Complete | Heroic 4-note motif: G4-C5-E5-G5 with cymbal shimmer | 1800ms | Synth sequence + `new Tone.NoiseSynth()` filtered for cymbal |
| Spectator Join | Subtle "whoosh" -- filtered noise sweep from low to high | 300ms | `Tone.NoiseSynth()` with `Tone.AutoFilter()` sweep |
| Prestige Activation | Dramatic 3-second building chord with resolution and bell tone | 3000ms | Layered crescendo + `Tone.MetalSynth` bell hit at peak |

**Volume Control:**
- Master volume slider in workspace settings (0-100%, default 50% when enabled)
- Category toggles: Achievements (on/off), Completions (on/off), Errors (on/off), Ambient (on/off)
- "Focus Mode" mutes everything except error sounds
- Volume automatically reduces by 50% if the browser tab is not focused (uses Page Visibility API)
- Volume automatically mutes if system "Do Not Disturb" is detected

**Accessibility:**
- All sound-conveyed information also has a visual equivalent (animation, color change, text notification)
- Sound is never the sole indicator of any event
- Users can set custom sounds for specific events (upload WAV/MP3 under 500KB, or select from built-in library)
- A haptic feedback option is available for supported devices (vibration on mobile for key events)

---

## 10. Anti-Pattern Prevention

### 10.1 Preventing Metric Gaming

**Risk:** Agents (or their operators) optimize for gamification metrics rather than genuine productivity.

**Prevention Measures:**

1. **Multi-Dimensional Scoring:** The leaderboard uses a composite of 4 dimensions (productivity, quality, efficiency, reliability). Optimizing one at the expense of others actually lowers the composite score. An agent running thousands of trivial tasks will see diminishing returns on productivity score and zero gains on quality/efficiency.

2. **Minimum Quality Gate:** Tasks with quality score below 0.5 are excluded from all gamification calculations (XP, leaderboard, quest progress). There is no reward for doing work badly.

3. **Complexity-Weighted Everything:** XP, leaderboard scores, and quest progress are all weighted by task complexity. A thousand Trivial tasks earn less total XP than fifty High-complexity tasks. The system structurally values depth over volume.

4. **Diminishing Returns:** Identical task types yield progressively less XP and leaderboard score after the 20th repetition in a 24-hour period (50% at 20, 25% at 50, 10% at 100). The system rewards variety and challenge.

5. **Anomaly Detection:** Statistical outlier detection flags agents whose scores deviate by more than 3 standard deviations from their 30-day rolling average in a single period. Flagged agents are excluded from leaderboard rankings pending admin review.

6. **Peer Calibration:** The "expected" baselines for efficiency and productivity are calibrated against platform-wide data for the same agent type. Gaming requires outperforming the entire platform, not just a local baseline.

7. **Admin Override:** Workspace admins can manually exclude specific agents from leaderboard rankings and reset suspicious XP gains with an audit log entry.

### 10.2 Ensuring Gamification Drives Real Productivity

**Design rule: Every XP-earning action must correspond to a measurable business outcome.**

| XP Source | Business Outcome |
|-----------|-----------------|
| Task Completion XP | Agent is processing real work |
| Quality Score XP | Agent output meets or exceeds quality standards |
| Efficiency XP | Agent is saving money on LLM tokens |
| Uptime XP | Agent is reliably available for production use |
| Quest Completion | Agent is improving on targeted dimensions |
| Achievement Unlock | Agent has reached a meaningful capability milestone |

There is no XP for: logging in, viewing dashboards, clicking UI elements, configuring settings, inviting users, or any other non-productive action. The system does not reward engagement theater.

**Correlation Monitoring:**
The analytics system tracks the Pearson correlation between gamification engagement (XP earned, achievements unlocked, leaderboard participation) and real business metrics (total tasks completed, total cost, error rate, throughput). If the correlation drops below 0.6 for any workspace over a 30-day window, the gamification parameters for that workspace are flagged for review and retuning (see Section 12). This is the critical health check that ensures the gamification layer remains aligned with genuine value creation.

### 10.3 Avoiding Addictive Dark Patterns

**The following patterns are explicitly prohibited in the OpenAgentVisualizer gamification system:**

1. **No loss mechanics.** Agents do not lose XP, levels, achievements, or cosmetics under any circumstances. Streak breaks reset a counter but do not subtract from accumulated progress. There is no "daily decay" that punishes inactivity.

2. **No artificial urgency.** Time-limited events (seasonal cosmetics, competitive quests) are announced at least 2 weeks in advance. No "flash sales" with countdown timers shorter than 24 hours. No "limited stock" artificial scarcity on digital goods.

3. **No random reward boxes.** The marketplace does not sell loot boxes, mystery packs, gacha pulls, or any randomized reward mechanism. Every purchase shows exactly what the user will receive before payment. What you see is what you get.

4. **No social pressure to spend.** Premium cosmetics are visually distinct but not significantly more impressive than AC-purchasable cosmetics. There is no "whale" indicator or spending-based status. No notifications about what other users purchased.

5. **No notification bombardment.** Push notifications are capped at 3 per day per workspace. Users control which event categories generate notifications. The default is minimal (errors and level-ups only). Users can mute all notifications with one toggle.

6. **No progress gating behind paywalls.** Every level, achievement, quest, and leaderboard position is achievable without spending real money. Premium currency buys cosmetics only. No "energy" system or cooldown timers that can be bypassed with payment.

7. **No engagement manipulation.** The system does not withhold rewards to create artificial "near-miss" moments. Quest thresholds are fixed and transparent, not dynamically adjusted to keep users just short of completion. XP formulas are documented and inspectable.

8. **No forced virality.** The system does not require users to share achievements on social media, invite friends, or perform social actions to unlock features. Sharing is always optional and never rewarded with gameplay advantages.

### 10.4 Accessibility Considerations for Gamification Elements

**Visual Accessibility:**

- All color-coded elements (rarity tiers, health rings, aura colors) also have a text label and icon shape differentiator. Color is never the sole distinguishing factor.
- Achievement badges include distinct shapes per rarity tier: Common = circle, Uncommon = rounded square, Rare = pentagon, Epic = hexagon, Legendary = star. Distinguishable without color perception.
- Animations can be reduced or disabled via "Reduced Motion" toggle, which maps to the `prefers-reduced-motion` CSS media query and is also settable manually. When enabled, all celebrations become static popups with text. No flashing, no screen shake, no particle effects.
- Leaderboard position changes use both color (green up, red down) and directional arrows (up-pointing triangle, down-pointing triangle).
- Minimum text contrast ratio of 4.5:1 (WCAG AA) for all gamification text overlays. 7:1 (WCAG AAA) for critical information (XP amounts, level numbers).
- High contrast mode available that removes gradient backgrounds and increases border widths.

**Cognitive Accessibility:**

- "Simple Mode" strips gamification to essentials: level badge, XP earned, and a simplified 5-item leaderboard. No quests, no skill trees, no economy, no guilds. Available as a workspace-level or individual-user toggle.
- Tooltips explain every gamification element on hover/focus: "XP: Experience Points earned by completing tasks. Higher XP = higher level."
- The onboarding flow introduces gamification elements progressively over the first week: Day 1 = XP and levels only, Day 3 = achievements introduced, Day 5 = quests introduced, Day 7 = leaderboard introduced.
- Achievement criteria are stated in plain language, not formulas. Example: "Complete 100 tasks" not "task_count >= 100".
- Information density is controlled: no screen shows more than 5 gamification indicators simultaneously without user action to reveal more.

**Motor Accessibility:**

- All gamification interactions are keyboard-navigable with visible focus indicators.
- No time-pressured interactions (no "click within 3 seconds to claim bonus").
- Marketplace purchases require a confirmation dialog with a 2-second delay before the confirm button becomes active (prevents accidental purchases).
- Touch targets for gamification UI elements are minimum 44x44 pixels (WCAG 2.5.5).

**Screen Reader Compatibility:**

- All gamification events fire ARIA live region announcements with appropriate politeness levels (`aria-live="polite"` for XP gains, `aria-live="assertive"` for errors and achievements).
- Achievement popups include `role="alert"` with descriptive text: "Achievement unlocked: Century Club. You completed 100 tasks. Reward: 500 XP."
- Leaderboard tables use proper semantic `<table>` markup with `<th scope="col">` headers and `<caption>` elements.
- Avatar decorations and effects are described in `alt` text and `aria-label` attributes: "Agent Alpha, Level 42 Expert, wearing Cyberpunk skin, gold avatar frame."
- Progress bars include `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attributes.

---

## 11. Technical Integration

### 11.1 Event Types That Feed Into the Gamification Engine

The gamification engine consumes events from the core OpenAgentVisualizer event bus. These events are already produced by the agent monitoring system -- the gamification engine subscribes to them as a downstream consumer.

**Core Event Schema:**

```typescript
interface GamificationEvent {
  event_id: string;          // UUID v4
  event_type: GamificationEventType;
  agent_id: string;          // UUID of the agent
  workspace_id: string;      // UUID of the workspace
  timestamp: string;         // ISO 8601 with timezone
  payload: Record<string, any>;
  metadata: {
    sdk_version: string;
    framework: string;       // "langchain" | "crewai" | "autogen" | "openai" | "custom"
    session_id: string;
  };
}

enum GamificationEventType {
  // Task lifecycle
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  TASK_RETRIED = 'task.retried',

  // Agent lifecycle
  AGENT_ONLINE = 'agent.online',
  AGENT_OFFLINE = 'agent.offline',
  AGENT_ERROR = 'agent.error',
  AGENT_RECOVERED = 'agent.recovered',

  // Handoff events
  HANDOFF_INITIATED = 'handoff.initiated',
  HANDOFF_COMPLETED = 'handoff.completed',
  HANDOFF_FAILED = 'handoff.failed',

  // Quality events
  QUALITY_SCORED = 'quality.scored',

  // Cost events
  COST_RECORDED = 'cost.recorded',
  BUDGET_THRESHOLD_CROSSED = 'cost.threshold',

  // System events
  SYSTEM_DEGRADED = 'system.degraded',
  SYSTEM_RECOVERED = 'system.recovered',
}
```

**Event Payload Examples:**

```json
{
  "event_type": "task.completed",
  "payload": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "task_type": "document_summarization",
    "complexity_tier": "medium",
    "duration_ms": 12400,
    "tokens_used": 3847,
    "tokens_expected": 6200,
    "cost_usd": 0.038,
    "expected_cost_usd": 0.065,
    "tool_calls": 3,
    "handoff_count": 0,
    "quality_score": 0.87,
    "retry_count": 0,
    "model": "gpt-4o",
    "is_repeat_task_type": false,
    "repeat_count_today": 1
  }
}

{
  "event_type": "agent.error",
  "payload": {
    "error_type": "tool_failure",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "error_message": "API rate limit exceeded for OpenAI endpoint",
    "recoverable": true,
    "uptime_streak_hours": 168.5,
    "current_task_id": "x9y8z7w6-v5u4-3210-fedc-ba0987654321"
  }
}
```

### 11.2 State Machine for Progression

The gamification system models each agent's progression as a state machine using XState v5. Each agent is an independent actor in the XState actor model, which maps naturally to the concept of AI agents as independent entities.

```typescript
import { createMachine, assign } from 'xstate';

type EvolutionStage =
  | 'rookie'
  | 'apprentice'
  | 'journeyman'
  | 'expert'
  | 'master'
  | 'grandmaster'
  | 'legend';

interface AgentProgressionContext {
  agent_id: string;
  xp: number;
  level: number;
  streak_days: number;
  streak_last_activity: string | null;
  evolution_stage: EvolutionStage;
  prestige: number;
  prestige_xp_bonus: number;
  skill_points: number;
  skill_allocations: Record<string, number>;
  achievements_unlocked: string[];
  active_quests: Quest[];
  guild_id: string | null;
  coins: number;
  total_tasks: number;
  total_errors: number;
  quality_history: number[];  // rolling window of last 200 quality scores
  uptime_streak_hours: number;
}

const agentProgressionMachine = createMachine({
  id: 'agentProgression',
  initial: 'active',
  context: {
    agent_id: '',
    xp: 0,
    level: 1,
    streak_days: 0,
    streak_last_activity: null,
    evolution_stage: 'rookie',
    prestige: 0,
    prestige_xp_bonus: 0,
    skill_points: 0,
    skill_allocations: {},
    achievements_unlocked: [],
    active_quests: [],
    guild_id: null,
    coins: 0,
    total_tasks: 0,
    total_errors: 0,
    quality_history: [],
    uptime_streak_hours: 0,
  } satisfies AgentProgressionContext,
  states: {
    active: {
      on: {
        TASK_COMPLETED: {
          actions: [
            'calculateAndAwardXP',
            'incrementTaskCount',
            'updateStreak',
            'updateQualityHistory',
            'checkLevelUp',
            'checkAchievements',
            'updateQuestProgress',
            'awardCoins',
            'contributeToGuildXP',
          ],
        },
        TASK_FAILED: {
          actions: ['incrementErrorCount', 'checkStreakBreak'],
        },
        AGENT_ERROR: {
          target: 'error',
          actions: ['incrementErrorCount', 'resetUptimeStreak', 'checkStreakBreak'],
        },
        QUALITY_SCORED: {
          actions: ['updateQualityHistory', 'checkQualityAchievements'],
        },
        LEVEL_UP: {
          actions: [
            'awardSkillPoint',
            'checkEvolutionStage',
            'awardLevelUpCoins',
            'triggerCelebration',
            'checkMilestoneAchievements',
          ],
        },
        ACHIEVEMENT_UNLOCKED: {
          actions: [
            'recordAchievement',
            'awardAchievementXP',
            'awardAchievementCoins',
            'triggerAchievementPopup',
            'broadcastToWorkspace',
          ],
        },
        QUEST_COMPLETED: {
          actions: ['awardQuestReward', 'checkQuestStreak', 'generateNewQuest'],
        },
        UPTIME_TICK: {
          actions: ['incrementUptimeStreak', 'awardUptimeXP'],
        },
        PRESTIGE_INITIATED: {
          target: 'prestiging',
          guard: 'isMaxLevel',
        },
        ALLOCATE_SKILL_POINT: {
          actions: ['allocateSkillPoint'],
          guard: 'hasAvailableSkillPoints',
        },
        RESPEC_SKILLS: {
          actions: ['resetSkillAllocations', 'deductRespecCost'],
          guard: 'canAffordRespec',
        },
      },
    },
    error: {
      on: {
        AGENT_RECOVERED: {
          target: 'active',
          actions: ['recordRecovery', 'checkRecoveryAchievements'],
        },
        AGENT_OFFLINE: {
          target: 'offline',
        },
      },
    },
    offline: {
      on: {
        AGENT_ONLINE: {
          target: 'active',
          actions: ['recordOnline', 'resetUptimeStreak'],
        },
      },
    },
    prestiging: {
      on: {
        PRESTIGE_CONFIRMED: {
          target: 'active',
          actions: [
            'savePrestigeCertificate',
            'resetLevelAndXP',
            'incrementPrestigeLevel',
            'applyPrestigeBonus',
            'retainLegacySP',
            'triggerPrestigeCelebration',
          ],
        },
        PRESTIGE_CANCELLED: {
          target: 'active',
        },
      },
    },
  },
});
```

**State Persistence:**
- Agent gamification state is persisted to PostgreSQL on every state transition via an async write queue
- Redis cache (TTL: 5 minutes) serves reads to avoid database hotspots
- On reconnect/reload, state is hydrated from Redis (fast path) or PostgreSQL (fallback)
- State snapshots are taken every 5 minutes for crash recovery
- The state machine is deterministic: given the same ordered event sequence, it produces the same final state. This enables replay-based debugging.
- All state mutations are logged to an append-only audit table for compliance

### 11.3 API Contract for Gamification Service

**Base URL:** `/api/v1/gamification`

**Authentication:** All endpoints require a valid API key or OAuth bearer token in the `Authorization` header. WebSocket connections authenticate via the initial handshake query parameter `?token=`.

**Endpoints:**

```
# --- Agent Profile ---

GET    /agents/{agent_id}/profile
       Response 200:
       {
         "agent_id": "uuid",
         "level": 42,
         "xp": 672340,
         "xp_to_next_level": 81920,
         "xp_progress_pct": 0.73,
         "evolution_stage": "expert",
         "prestige": 0,
         "prestige_xp_bonus": 0,
         "streak_days": 14,
         "total_tasks": 4821,
         "total_errors": 23,
         "coins": 2340,
         "skill_points_available": 8,
         "skill_allocations": {
           "velocity": {"tier1_quick_start": true, "tier1_momentum": true, "tier2_blur_motion": true},
           "precision": {"tier1_steady_hand": true}
         },
         "guild_id": "uuid" | null,
         "achievements_unlocked_count": 18,
         "active_quests_count": 5
       }

GET    /agents/{agent_id}/xp-history
       Query: ?period=day|week|month&limit=100&offset=0
       Response 200:
       {
         "entries": [
           {"timestamp": "2026-03-16T14:23:00Z", "xp_earned": 67, "source": "task_completion",
            "task_id": "uuid", "details": "Medium task, quality 0.78, streak 1.05x"}
         ],
         "total": 1420,
         "period_total_xp": 4280
       }

# --- Achievements ---

GET    /agents/{agent_id}/achievements
       Response 200:
       {
         "unlocked": [
           {"id": "first_steps", "name": "First Steps", "category": "productivity",
            "rarity": "common", "unlocked_at": "2026-01-15T10:00:00Z", "xp_reward": 50}
         ],
         "locked": [
           {"id": "thousand_strong", "name": "Thousand Strong", "category": "productivity",
            "rarity": "rare", "progress": {"current": 847, "target": 1000, "pct": 0.847}}
         ],
         "secret_count": 6,
         "secret_unlocked": 1
       }

# --- Skill Points ---

POST   /agents/{agent_id}/skill-points/allocate
       Body: {"tree": "velocity", "node": "tier2_blur_motion"}
       Response 200:
       {"success": true, "remaining_sp": 7, "allocations": {...}}
       Response 400:
       {"error": "insufficient_sp" | "prerequisite_not_met" | "node_already_allocated"}

POST   /agents/{agent_id}/skill-points/respec
       Body: {"confirm": true}
       Response 200:
       {"success": true, "coins_deducted": 500, "sp_refunded": 34}

# --- Prestige ---

POST   /agents/{agent_id}/prestige
       Body: {"confirm": true}
       Response 200:
       {"success": true, "new_prestige_level": 1, "prestige_bonus": 0.05,
        "certificate_url": "/certificates/uuid.pdf"}
       Response 400:
       {"error": "not_max_level" | "insufficient_coins"}

# --- Leaderboard ---

GET    /leaderboard
       Query: ?period=daily|weekly|monthly|alltime
              &type=individual|team|category
              &category=research|code_generation|... (optional, for type=category)
              &workspace_id=uuid
              &limit=50&offset=0
       Response 200:
       {
         "entries": [
           {"rank": 1, "agent_id": "uuid", "name": "Research-Alpha",
            "score": 847, "productivity": 0.92, "quality": 0.88,
            "efficiency": 0.76, "reliability": 0.95,
            "level": 42, "evolution_stage": "expert", "prestige": 0,
            "delta": +3, "achievements_pinned": ["quality_streak", "iron_will", "century_club"]}
         ],
         "user_agent_positions": [
           {"agent_id": "uuid", "rank": 7}
         ],
         "total_entries": 234,
         "period_start": "2026-03-10T00:00:00Z",
         "period_end": "2026-03-16T23:59:59Z"
       }

# --- Quests ---

GET    /quests/active
       Query: ?agent_id=uuid&workspace_id=uuid
       Response 200:
       {
         "daily": [
           {"quest_id": "uuid", "title": "Task Burst", "type": "daily",
            "criteria": "Complete 24 tasks today", "current": 18, "target": 24,
            "reward_xp": 30, "expires_at": "2026-03-17T00:00:00Z"}
         ],
         "weekly": [...],
         "epic": {...} | null,
         "team": [...],
         "competitive": [...]
       }

GET    /quests/{quest_id}/progress
       Response 200:
       {"quest_id": "uuid", "title": "...", "type": "daily",
        "criteria": "...", "current": 18, "target": 24,
        "pct": 0.75, "reward_xp": 30, "expires_at": "..."}

# --- Economy ---

GET    /economy/balance
       Query: ?agent_id=uuid
       Response 200:
       {"agent_coins": 2340, "prism_gems": 500}

POST   /economy/purchase
       Body: {"item_id": "skin_cyberpunk", "currency": "AC", "agent_id": "uuid"}
       Response 200:
       {"success": true, "new_balance": {"agent_coins": 1840}, "item": {...}}
       Response 400:
       {"error": "insufficient_funds" | "item_not_found" | "already_owned"}

GET    /economy/marketplace
       Query: ?category=skins|frames|effects|decorations|themes
              &currency=AC|PG|all
              &page=1&per_page=20
       Response 200:
       {"items": [...], "total": 87, "page": 1, "per_page": 20}

# --- Guilds ---

GET    /guilds/{guild_id}
       Response 200:
       {"guild_id": "uuid", "name": "Research Division", "icon": "microscope",
        "banner_url": "...", "motto": "Quality over quantity",
        "level": 8, "xp": 45200, "xp_to_next": 60000,
        "members": [{"agent_id": "uuid", "name": "...", "level": 42, "role": "member"}],
        "leaderboard_rank": 3}

POST   /guilds
       Body: {"name": "Research Division", "icon": "microscope", "agent_ids": ["uuid1", "uuid2"]}
       Response 201:
       {"guild_id": "uuid", "name": "Research Division"}

POST   /guilds/{guild_id}/challenge
       Body: {"target_guild_id": "uuid", "metric": "quality", "duration_days": 7}
       Response 201:
       {"challenge_id": "uuid", "status": "pending_acceptance"}

# --- Highlights ---

GET    /highlights
       Query: ?workspace_id=uuid&period=day|week&type=all|record|perfect|comeback|speed|levelup
       Response 200:
       [{"highlight_id": "uuid", "type": "perfect_run", "agent_id": "uuid",
         "agent_name": "Research-Alpha", "timestamp": "2026-03-16T14:23:00Z",
         "replay_url": "/replay/uuid", "description": "Perfect Critical task completion: 0 errors, $0.32 under budget",
         "reactions": {"fire": 3, "clap": 7, "star": 2}}]

# --- Notifications ---

GET    /notifications/feed
       Query: ?workspace_id=uuid&since=2026-03-16T00:00:00Z&limit=50
       Response 200:
       [{"notification_id": "uuid", "type": "achievement_unlock",
         "agent_id": "uuid", "agent_name": "Research-Alpha",
         "message": "Research-Alpha unlocked 'Quality Streak' (Epic)",
         "timestamp": "2026-03-16T14:23:00Z", "read": false}]

# --- Real-time WebSocket ---

WebSocket /ws/gamification/{workspace_id}?token={auth_token}
       Server pushes:
       {
         "type": "xp_earned" | "level_up" | "achievement_unlocked" |
                 "quest_progress" | "quest_completed" | "leaderboard_update" |
                 "streak_update" | "highlight_detected" | "guild_event",
         "agent_id": "uuid",
         "timestamp": "2026-03-16T14:23:00Z",
         "payload": { ... event-specific data ... }
       }

       Client sends:
       {"type": "subscribe", "channels": ["xp", "achievements", "leaderboard", "quests"]}
       {"type": "unsubscribe", "channels": ["leaderboard"]}
```

**Rate Limits:**
- Read endpoints: 100 requests/minute per workspace
- Write endpoints: 30 requests/minute per workspace
- WebSocket: 1 connection per workspace per user session (reconnection with exponential backoff)

**Error Responses:**
All endpoints return standard error format:
```json
{"error": "error_code", "message": "Human-readable description", "details": {...}}
```
HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (server error).

### 11.4 Real-Time Update Requirements

**Latency Targets:**

| Event | Max Latency (event to UI update) | Priority |
|-------|--------------------------------|----------|
| XP earned (after task completion) | < 500ms | High |
| Achievement popup | < 1 second | High |
| Level-up animation trigger | < 1 second | High |
| Quest progress update | < 2 seconds | Medium |
| Streak counter update | < 2 seconds | Medium |
| Leaderboard position change | < 3 seconds | Medium |
| Spectator view sync | < 500ms | High |
| Guild XP update | < 5 seconds | Low |

**Architecture:**

```
[Agent SDK] --> [Event Bus (Redis Streams)] --> [Gamification Engine (stateless workers)]
                                                        |
                                                        v
                                             [PostgreSQL (state)] + [Redis (cache/leaderboard)]
                                                        |
                                                        v
                                             [WebSocket Gateway (Redis Pub/Sub)]
                                                        |
                                                        v
                                             [Browser Clients]
```

- The gamification engine processes events asynchronously from the core event bus (Redis Streams consumer group)
- XP calculations happen server-side to prevent client-side tampering
- The WebSocket gateway pushes gamification updates to all connected clients in the workspace via Redis Pub/Sub for cross-instance broadcasting
- Client-side optimistic updates display XP counter increments immediately (with rollback if the server disagrees after 2 seconds)
- Leaderboard recalculation runs on a 10-second debounced interval (not on every individual event) to prevent excessive computation
- Achievement checks run as background tasks triggered by state transitions, with results pushed via WebSocket when complete
- Event processing is idempotent: replaying the same event produces the same result (deduplication by event_id)

**Scalability:**
- The gamification service is stateless beyond the database -- horizontally scalable behind a load balancer
- Agent state is cached in Redis with a 5-minute TTL, falling back to PostgreSQL on cache miss
- Leaderboard calculations use Redis sorted sets (`ZADD`, `ZRANK`, `ZRANGE`) for O(log N) rank lookups
- WebSocket connections are distributed across instances using Redis Pub/Sub for cross-instance message broadcasting
- At 10,000 concurrent agents generating ~5 events/second each, the system handles ~50,000 events/second. Redis Streams consumer groups provide horizontal scaling with partition-based assignment.
- Database write batching: state updates are batched in 100ms windows to reduce write amplification

---

## 12. Analytics & Tuning

### 12.1 Metrics to Track Gamification Effectiveness

**Engagement Metrics:**

| Metric | Definition | Target | Measurement Frequency |
|--------|-----------|--------|----------------------|
| Gamification Engagement Rate | % of workspace users who interact with gamification features weekly | 60% | Weekly |
| Achievement Unlock Rate | Average achievements unlocked per agent per month | 3.0 | Monthly |
| Quest Completion Rate | % of assigned quests that are completed before expiration | 65% | Weekly |
| Leaderboard Check Frequency | Average times per week a user views the leaderboard | 4.0 | Weekly |
| Spectator Mode Usage | Average spectator sessions per workspace per week | 2.0 | Weekly |
| Replay Share Rate | % of highlights that are shared externally (URL copied or exported) | 15% | Weekly |
| Guild Participation Rate | % of agents that belong to a guild | 40% | Monthly |
| Marketplace Transaction Volume | Average purchases per workspace per week | 5.0 | Weekly |

**Retention Metrics:**

| Metric | Definition | Target | Measurement Frequency |
|--------|-----------|--------|----------------------|
| Gamification-Attributed Return | % of DAU visits where the first action is a gamification feature | 25% | Daily |
| Streak-Driven Retention | D7 retention of users with active streaks vs. without | 1.5x | Weekly cohort |
| Post-Level-Up Session Length | Average session length in the 24 hours after a level-up event | +30% vs baseline | Rolling |
| Churn Risk by Gamification Engagement | Monthly churn rate segmented by gamification engagement quartile | Bottom quartile <2x top quartile | Monthly |
| Post-Achievement Return Rate | % of users who return within 24 hours of an achievement unlock notification | 40% | Rolling |

**Business Impact Metrics:**

| Metric | Definition | Target | Measurement Frequency |
|--------|-----------|--------|----------------------|
| Optimization-After-Leaderboard | % of teams that improved efficiency score after engaging with leaderboard for 2+ weeks | 40% | Monthly cohort |
| Cost Savings Correlation | Pearson correlation between gamification engagement and actual cost reduction | > 0.5 | Monthly |
| Free-to-Paid Conversion by Gamification | Conversion rate of users who engage with gamification vs. those who do not | 2x baseline | Monthly cohort |
| Premium Currency Revenue | Monthly revenue from Prism Gem purchases | $500/month at 100 workspaces | Monthly |
| NPS by Gamification Engagement | NPS score segmented by gamification engagement level | Engaged users NPS > 60 | Quarterly |

### 12.2 A/B Testing Strategy

**Test Framework:**
All gamification parameters are configurable per workspace via feature flags stored in the configuration database. A/B tests run at the workspace level (not the individual user level) to prevent inconsistent experiences within a team.

**Priority A/B Tests (launch quarter):**

| Test ID | Test | Hypothesis | Variants | Primary Success Metric | Duration |
|---------|------|-----------|----------|----------------------|----------|
| G-001 | XP Visibility | Showing real-time XP counter on agent avatar increases engagement | A: XP counter visible on avatar, B: XP only in profile panel | Leaderboard check frequency | 4 weeks |
| G-002 | Achievement Frequency | More frequent common achievements improve early retention | A: Current thresholds, B: 30% lower thresholds for first 5 achievements | D7 retention | 6 weeks |
| G-003 | Quest Difficulty | Lower stretch factor increases quest completion without reducing engagement | A: 1.2x stretch, B: 1.1x stretch | Quest completion rate | 4 weeks |
| G-004 | Leaderboard Default | Weekly vs. daily as default leaderboard view | A: Weekly default, B: Daily default | Leaderboard engagement rate | 3 weeks |
| G-005 | Sound Prompt | Prompting users to enable sound after first achievement increases sound adoption | A: No prompt, B: Soft prompt after first achievement unlock | Sound enable rate, session length post-prompt | 4 weeks |

**Post-Launch A/B Tests (months 2-6):**

| Test ID | Test | Hypothesis | Variants |
|---------|------|-----------|----------|
| G-006 | Prestige Visibility | Showing prestige stars on leaderboard motivates max-level agents to prestige | A: Stars visible, B: Stars hidden |
| G-007 | Guild Size | Smaller guilds create stronger social bonds and higher per-member engagement | A: Max 20, B: Max 10 |
| G-008 | Economy Pricing | Lower cosmetic prices increase purchase frequency enough to offset unit revenue | A: Current prices, B: 25% lower |
| G-009 | Competitive Quests | Competitive quests increase engagement but may decrease collaboration metrics | A: Competitive enabled, B: Disabled |
| G-010 | Highlight Reel | Auto-generated weekly highlight reels increase return visits | A: Highlight reel enabled, B: Disabled |
| G-011 | Streak Forgiveness | Allowing 1 "free pass" per month on streak breaks improves long-term streak engagement | A: No forgiveness, B: 1 free pass/month |
| G-012 | Achievement Rarity Display | Showing achievement rarity percentages increases motivation for rare achievements | A: Rarity shown, B: Rarity hidden |

**Testing Discipline:**
- Minimum sample size: 50 workspaces per variant (100 total)
- Minimum test duration: 3 weeks (to capture full weekly cycle effects and avoid day-of-week bias)
- Statistical significance threshold: p < 0.05 (two-tailed)
- One primary metric per test (secondary metrics are observed and reported but not used for go/no-go decisions)
- No more than 3 concurrent A/B tests to prevent interaction effects between experiments
- All test results are documented in the gamification analytics dashboard with confidence intervals
- Failed tests are documented with learnings; winning variants are rolled out within 1 week of statistical significance

### 12.3 Tuning Parameters

All of the following parameters are configurable without code deployment, stored in a configuration database (PostgreSQL `gamification_config` table) with version history and rollback capability.

**XP Tuning:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `xp_base_trivial` | 5 | 1-20 | Base XP for trivial tasks |
| `xp_base_low` | 15 | 5-50 | Base XP for low complexity tasks |
| `xp_base_medium` | 40 | 15-100 | Base XP for medium complexity tasks |
| `xp_base_high` | 100 | 40-250 | Base XP for high complexity tasks |
| `xp_base_critical` | 250 | 100-500 | Base XP for critical tasks |
| `quality_multiplier_poor` | 0.5 | 0.1-0.8 | XP multiplier for quality < 0.3 |
| `quality_multiplier_below_avg` | 0.75 | 0.5-0.9 | XP multiplier for quality 0.3-0.5 |
| `quality_multiplier_avg` | 1.0 | 0.8-1.2 | XP multiplier for quality 0.5-0.7 |
| `quality_multiplier_good` | 1.25 | 1.0-1.5 | XP multiplier for quality 0.7-0.85 |
| `quality_multiplier_excellent` | 1.5 | 1.2-2.0 | XP multiplier for quality 0.85-0.95 |
| `quality_multiplier_perfect` | 2.0 | 1.5-3.0 | XP multiplier for quality > 0.95 |
| `streak_max_multiplier` | 1.3 | 1.1-1.5 | Maximum streak bonus multiplier |
| `streak_day_thresholds` | [2,4,7,14,30] | configurable | Day thresholds for streak tiers |
| `diminishing_returns_threshold` | 20 | 10-50 | Repeated task count before diminishing returns |
| `diminishing_returns_factor` | 0.5 | 0.25-0.75 | Factor applied after threshold |
| `level_curve_exponent` | 1.8 | 1.5-2.2 | Exponent in XP_required = 100 * level^exp |
| `level_curve_base` | 100 | 50-200 | Base constant in level curve formula |
| `uptime_xp_base` | 2 | 1-5 | Base XP per hour for uptime |
| `uptime_daily_cap` | 288 | 48-500 | Maximum uptime XP per day |

**Leaderboard Tuning:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `lb_productivity_weight` | 0.30 | 0.15-0.45 | Weight of productivity in composite score |
| `lb_quality_weight` | 0.30 | 0.15-0.45 | Weight of quality in composite score |
| `lb_efficiency_weight` | 0.20 | 0.10-0.35 | Weight of efficiency in composite score |
| `lb_reliability_weight` | 0.20 | 0.10-0.35 | Weight of reliability in composite score |
| `lb_recalc_interval_sec` | 10 | 5-60 | Leaderboard recalculation debounce interval |
| `lb_anomaly_stddev_threshold` | 3.0 | 2.0-5.0 | Standard deviations for anomaly detection |
| `lb_min_quality_gate` | 0.5 | 0.3-0.7 | Minimum quality score for leaderboard inclusion |
| `lb_min_task_complexity` | "low" | trivial-critical | Minimum task complexity for leaderboard |
| `lb_team_size_exponent` | 0.7 | 0.5-0.9 | Team size normalization exponent |

**Quest Tuning:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `quest_stretch_factor` | 1.2 | 1.05-1.5 | Difficulty stretch for daily quests |
| `quest_fallback_stretch` | 1.1 | 1.0-1.2 | Reduced stretch after consecutive failures |
| `quest_escalation_stretch` | 1.3 | 1.2-1.5 | Increased stretch after consecutive completions |
| `quest_failure_threshold` | 3 | 2-5 | Consecutive failures before fallback triggers |
| `quest_success_threshold` | 5 | 3-7 | Consecutive successes before escalation triggers |
| `quest_daily_count` | 3 | 2-5 | Number of daily quests per agent |
| `quest_weekly_count` | 2 | 1-4 | Number of weekly challenges per agent |
| `quest_daily_bonus` | 50 | 20-100 | Bonus XP for completing all daily quests |
| `quest_weakness_weight` | 2.0 | 1.0-3.0 | Weight multiplier for improvement-area quests |

**Economy Tuning:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `ac_per_100xp` | 10 | 5-25 | Agent Coins earned per 100 XP |
| `ac_daily_cap_xp` | 200 | 100-500 | Max AC from XP conversion per day per agent |
| `ac_daily_cap_quests` | 100 | 50-200 | Max AC from quests per day per agent |
| `ac_weekly_cap_leaderboard` | 100 | 50-200 | Max AC from leaderboard per week per agent |
| `inflation_median_threshold` | 3000 | 1000-10000 | Median balance threshold for price adjustment |
| `inflation_adjustment_pct` | 10 | 5-20 | Percentage price adjustment when threshold crossed |
| `respec_cost_ac` | 500 | 200-1000 | AC cost to respec skill tree |
| `prestige_cost_ac` | 1000 | 500-2000 | AC cost to initiate prestige |
| `gifting_tax_pct` | 10 | 5-20 | Percentage removed when gifting AC |

**Notification Tuning:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `push_notification_daily_cap` | 3 | 1-10 | Max push notifications per day per workspace |
| `streak_warning_hours_before` | 6 | 2-12 | Hours before streak break to show first warning |
| `streak_urgent_hours_before` | 2 | 1-4 | Hours before streak break to show urgent warning |
| `achievement_popup_duration_common_ms` | 1500 | 800-3000 | Duration for Common achievement popup |
| `achievement_popup_duration_rare_ms` | 2500 | 1500-4000 | Duration for Rare achievement popup |
| `achievement_popup_duration_epic_ms` | 3500 | 2500-5000 | Duration for Epic achievement popup |
| `achievement_popup_duration_legendary_ms` | 6000 | 4000-8000 | Duration for Legendary achievement popup |
| `levelup_animation_standard_ms` | 3000 | 2000-5000 | Duration for standard level-up animation |
| `levelup_animation_milestone_ms` | 7000 | 5000-12000 | Duration for milestone level-up animation |

---

## Appendix A: Professional Mode Mapping

When "Professional Mode" is enabled (for enterprise users who want data without game mechanics), the following translations apply:

| Gamification Element | Professional Mode Equivalent |
|---------------------|------------------------------|
| XP Counter | "Performance Score" (same number, different label) |
| Level Badge | "Tier" indicator (Tier 1-7, no fantasy names) |
| Evolution Stage Names | Tier 1 (Rookie) through Tier 7 (Legend) |
| Achievement Badges | "Certification" badges with professional terminology (e.g., "Quality Streak" becomes "Quality Consistency Certification") |
| Leaderboard | "Performance Ranking" table with identical data and scoring |
| Quests | "Optimization Targets" with identical criteria |
| Agent Coins | Hidden entirely (not shown in UI) |
| Avatar Skins | Geometric icons with role-based shapes (circle, square, hexagon) |
| Celebration Animations | Replaced with subtle green checkmark confirmations (200ms fade) |
| Sound Effects | Disabled (silent by default, no prompt to enable) |
| Virtual World | "Agent Status Map" with same spatial layout, muted colors, no particle effects |
| Guilds | "Teams" with same grouping functionality |
| Spectator Mode | "Live Monitoring" with same functionality, no commentary overlay by default |
| Prestige Stars | "Performance Tiers" badge on profile |

Professional Mode is a workspace-level toggle. Default: off for Free/Pro tiers, on for Enterprise tier (configurable by workspace admin). Individual users can also override the workspace default in their personal settings.

---

## Appendix B: Gamification Feature Rollout Plan

| Phase | Timeline | Features Included |
|-------|----------|-------------------|
| **Phase 1 (MVP+4 weeks)** | Month 4 | XP system (all 4 channels), levels 1-100 with progression curve, basic 10 achievements (First Steps through Double Digits), daily quests (3 per agent), simple leaderboard (weekly individual only) |
| **Phase 2 (V1)** | Month 5-6 | Full 38 achievements including secrets, weekly and epic quests, team and category leaderboards, streak system with warnings, Agent Coins economy, basic cosmetic marketplace (20 items), Professional Mode toggle |
| **Phase 3 (V1.5)** | Month 7-8 | Guilds with challenges, competitive quests, 4 skill trees, spectator mode, replay highlights with sharing, sound design (Tone.js), expanded marketplace (40+ items) |
| **Phase 4 (V2)** | Month 9-10 | Prestige system, Prism Gems premium currency, full marketplace (80+ items), cross-workspace challenges, A/B testing infrastructure, economy analytics dashboard |
| **Phase 5 (V2.5)** | Month 11-12 | Custom achievements (enterprise-defined), guild raids, auto-generated highlight reels, gamification API for third-party integrations, full tuning parameter admin panel |

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **XP** | Experience Points -- the universal measure of agent performance, earned through productive work |
| **AC (Agent Coins)** | Earned virtual currency, convertible from XP, spent on cosmetic items |
| **PG (Prism Gems)** | Premium virtual currency, purchased with real money, spent on exclusive cosmetics |
| **Evolution Stage** | One of 7 visual tiers (Rookie through Legend) that changes the agent's appearance |
| **Prestige** | Optional level reset at Level 100 that grants permanent bonuses and cosmetic rewards |
| **SP (Skill Points)** | Points earned per level-up, invested in skill tree nodes for visual specializations |
| **Streak** | Consecutive days of successful task completion without errors |
| **Quality Score** | A 0.0-1.0 rating of task output quality derived from LLM-as-Judge, error rate, and efficiency |
| **Guild** | A user-created group of agents that share progress and compete as a unit |
| **Professional Mode** | A UI mode that replaces game terminology with business terminology while preserving identical data |

---

*Document produced by Gamification Expert Agent -- Stage 1.2*
*Date: March 16, 2026*
*Status: Complete*
