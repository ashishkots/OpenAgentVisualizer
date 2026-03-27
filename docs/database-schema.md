# OpenAgentVisualizer Database Schema

## Database

- **Engine:** PostgreSQL 16 with TimescaleDB extension
- **ORM:** SQLAlchemy 2.x (asyncpg driver)
- **Migrations:** Alembic
- **Cache:** Redis 7.2 with AOF persistence
- **Multi-tenancy:** All tables scoped by `workspace_id`

---

## Tables

### workspaces

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK, default uuid4 |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | UNIQUE, INDEXED |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMPTZ | default utcnow |
| updated_at | TIMESTAMPTZ | default utcnow |

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK, default uuid4 |
| workspace_id | VARCHAR | FK -> workspaces.id, NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| hashed_password | TEXT | NOT NULL |
| full_name | VARCHAR(255) | |
| is_active | BOOLEAN | default true |
| is_admin | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | default utcnow |
| updated_at | TIMESTAMPTZ | default utcnow |

### workspace_members

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | FK -> workspaces.id |
| user_id | VARCHAR | FK -> users.id |
| role | VARCHAR(50) | (owner/admin/member) |
| joined_at | TIMESTAMPTZ | default utcnow |

### api_keys

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | FK -> workspaces.id |
| name | VARCHAR(255) | |
| key_hash | VARCHAR(255) | |
| key_prefix | VARCHAR(10) | |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMPTZ | default utcnow |

### agents

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK, default uuid4 |
| workspace_id | VARCHAR | FK -> workspaces.id, NOT NULL, INDEXED |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| agent_type | VARCHAR(100) | |
| status | VARCHAR(50) | default 'idle' |
| level | INTEGER | default 1 |
| xp_total | INTEGER | default 0 |
| total_tokens | BIGINT | default 0 |
| total_cost_usd | FLOAT | default 0 |
| config | JSONB | |
| created_at | TIMESTAMPTZ | default utcnow |
| updated_at | TIMESTAMPTZ | default utcnow |

### tasks

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | FK -> workspaces.id |
| agent_id | VARCHAR | FK -> agents.id |
| name | VARCHAR(255) | |
| status | VARCHAR(50) | |
| input_data | JSONB | |
| output_data | JSONB | |
| created_at | TIMESTAMPTZ | default utcnow |
| completed_at | TIMESTAMPTZ | |

### events (TimescaleDB hypertable)

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| agent_id | VARCHAR | FK -> agents.id, INDEXED |
| session_id | VARCHAR | INDEXED |
| event_type | VARCHAR(100) | NOT NULL |
| event_data | JSONB | |
| timestamp | TIMESTAMPTZ | NOT NULL |
| created_at | TIMESTAMPTZ | default utcnow |

**TimescaleDB:** Converted to hypertable on `timestamp` for time-series query performance.

### spans

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| trace_id | VARCHAR(64) | INDEXED |
| span_id | VARCHAR(32) | INDEXED |
| parent_span_id | VARCHAR(32) | |
| agent_id | VARCHAR | |
| name | VARCHAR(500) | |
| kind | VARCHAR(20) | |
| status | VARCHAR(20) | |
| start_time | TIMESTAMPTZ | |
| end_time | TIMESTAMPTZ | |
| duration_ms | FLOAT | |
| attributes | JSONB | |
| events | JSONB | |
| created_at | TIMESTAMPTZ | default utcnow |

### agent_sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL |
| agent_id | VARCHAR | FK -> agents.id |
| status | VARCHAR(50) | default 'active' |
| metadata_json | JSONB | |
| started_at | TIMESTAMPTZ | default utcnow |
| ended_at | TIMESTAMPTZ | |

### xp_transactions

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| agent_id | VARCHAR | FK -> agents.id, NOT NULL |
| amount | INTEGER | NOT NULL |
| reason | VARCHAR(255) | |
| metadata_json | JSONB | |
| created_at | TIMESTAMPTZ | default utcnow |

### alerts

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| agent_id | VARCHAR | |
| severity | VARCHAR(20) | |
| title | VARCHAR(500) | |
| description | TEXT | |
| resolved | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | default utcnow |

### metrics_raw (TimescaleDB hypertable)

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| agent_id | VARCHAR | NOT NULL |
| metric_type | VARCHAR(50) | |
| total_tokens | INTEGER | |
| prompt_tokens | INTEGER | |
| completion_tokens | INTEGER | |
| cost_usd | FLOAT | |
| latency_ms | FLOAT | |
| timestamp | TIMESTAMPTZ | NOT NULL |

**TimescaleDB:** Hypertable on `timestamp`.

### metrics_agg (hourly aggregation)

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK |
| workspace_id | VARCHAR | NOT NULL |
| agent_id | VARCHAR | NOT NULL |
| hour | TIMESTAMPTZ | NOT NULL |
| total_tokens | BIGINT | |
| total_cost_usd | FLOAT | |
| request_count | INTEGER | |
| avg_latency_ms | FLOAT | |

### audit_log

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | PK, default uuid4 |
| workspace_id | VARCHAR | NOT NULL, INDEXED |
| user_id | VARCHAR | |
| action | VARCHAR(100) | NOT NULL |
| resource_type | VARCHAR(50) | NOT NULL |
| resource_id | VARCHAR | |
| extra_data | JSONB | |
| created_at | TIMESTAMPTZ | default utcnow |

---

## Entity Relationship Summary

```
Workspace 1──N User
Workspace 1──N WorkspaceMember
Workspace 1──N APIKey
Workspace 1──N Agent
Agent 1──N Task
Agent 1──N Event (hypertable)
Agent 1──N AgentSession
Agent 1──N XPTransaction
Agent 1──N Span
Workspace 1──N Alert
Workspace 1──N MetricsRaw (hypertable)
Workspace 1──N MetricsAgg
Workspace 1──N AuditLog
```
