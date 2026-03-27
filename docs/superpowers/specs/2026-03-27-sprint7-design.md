# Sprint 7 Design: Platform & Ecosystem

## Executive Summary

Sprint 7 completes the OpenAgentVisualizer product by adding platform-level capabilities: public API documentation with versioning, outbound webhook system, third-party plugin architecture, enterprise SSO (SAML + OIDC), and multi-organization tenancy with cross-workspace agent sharing.

## Subsystem 1: Public API Docs

### API Versioning
- Add `/api/v1/` prefix aliasing all current `/api/` endpoints
- Both `/api/` and `/api/v1/` serve the same handlers (FastAPI `include_router` with two prefixes)
- Future breaking changes get `/api/v2/` prefix
- `X-API-Version` response header on all responses

### OpenAPI Schema Polish
- Add `json_schema_extra` with `examples` to all Pydantic request/response schemas
- Add `tags_metadata` to FastAPI app for organized Swagger grouping
- Add `description` to all router `APIRouter()` instances

### Frontend API Docs Page
- `/api-docs` route: embedded Swagger UI (swagger-ui-react or iframe to /docs)
- SDK code snippets component: tabbed view (Python, TypeScript, cURL) per endpoint
- API changelog page at `/api-docs/changelog`

### Endpoints
- GET /api/v1/docs — redirects to Swagger UI
- GET /api/v1/openapi.json — raw OpenAPI spec

## Subsystem 2: Webhook System

### Backend

**New table: `webhooks`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(255) | |
| url | VARCHAR(2000) | Target URL |
| secret | VARCHAR(64) | HMAC-SHA256 signing key, auto-generated |
| events | JSONB | Array of subscribed event types |
| active | BOOLEAN | default true |
| created_at | TIMESTAMPTZ | |

**New table: `webhook_deliveries`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| webhook_id | UUID | FK → webhooks |
| event_type | VARCHAR(100) | |
| payload | JSONB | Full event payload |
| status | VARCHAR(20) | pending, success, failed |
| response_code | INTEGER | nullable |
| attempts | INTEGER | default 0, max 3 |
| next_retry_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | |

**Event types:** agent.created, agent.status_changed, task.completed, alert.triggered, achievement.unlocked, level_up, challenge.completed, tournament.finalized

**Webhook delivery flow:**
1. Event fires in application (e.g., achievement unlock)
2. Query webhooks where workspace_id matches and event_type in events array and active=true
3. For each matching webhook: create delivery record, dispatch `deliver_webhook` Celery task
4. Task: POST payload to URL with `X-OAV-Signature: sha256=HMAC(secret, payload)` header
5. Success (2xx): mark delivered. Failure: increment attempts, schedule retry (10s, 60s, 300s). After 3 failures: mark failed.

**Celery tasks:**
- `deliver_webhook` (critical queue): POST + HMAC + retry logic
- `cleanup_deliveries` (beat daily): delete successful deliveries > 30 days

**Endpoints:**
- GET /api/v1/webhooks — list workspace webhooks
- POST /api/v1/webhooks — create (name, url, events; secret auto-generated, returned once)
- PUT /api/v1/webhooks/{id} — update (name, url, events, active)
- DELETE /api/v1/webhooks/{id} — delete webhook + deliveries
- GET /api/v1/webhooks/{id}/deliveries?limit=50 — delivery log
- POST /api/v1/webhooks/{id}/test — send test payload

### Frontend
- Settings → Webhooks tab
- Webhook list with status indicators (active=green, inactive=gray)
- Create/edit modal: name, URL, event type checkboxes, auto-generated secret (shown once with copy button)
- Delivery log: expandable rows with payload, response code, retry count, timestamps
- Test button with inline result

## Subsystem 3: Plugin System

### Backend

**New table: `plugins`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
| name | VARCHAR(255) | |
| description | TEXT | |
| version | VARCHAR(50) | semver |
| author | VARCHAR(255) | |
| manifest | JSONB | permissions, hooks, routes |
| status | VARCHAR(20) | installed, disabled, error |
| installed_by | UUID | FK → users |
| installed_at | TIMESTAMPTZ | |

**New table: `plugin_registry`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | unique |
| description | TEXT | |
| version | VARCHAR(50) | latest version |
| author | VARCHAR(255) | |
| manifest_url | VARCHAR(2000) | URL to fetch manifest |
| download_url | VARCHAR(2000) | URL to fetch package |
| verified | BOOLEAN | default false |
| downloads | INTEGER | default 0 |
| created_at | TIMESTAMPTZ | |

**Plugin manifest schema:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "What it does",
  "permissions": ["read:agents", "read:events", "write:events"],
  "hooks": ["on_event", "on_agent_created", "on_task_completed"],
  "routes": ["/api/plugins/my-plugin/config"]
}
```

**Sandboxed execution:**
- Plugins loaded via `importlib.import_module` into isolated namespace
- RestrictedPython-style guards: no `os`, `sys`, `subprocess`, `socket` imports
- Plugins can only call OAV APIs through a provided `PluginContext` object
- `PluginContext` exposes: `get_agents()`, `get_events()`, `create_event()`, `get_config()`, `set_config()`
- Execution timeout: 5 seconds per hook invocation

**Hook dispatcher:**
- `dispatch_hook(hook_name, payload)` — iterates installed+enabled plugins with matching hook, calls handler
- Called from event pipeline, agent router, task completion handlers
- Errors caught per-plugin (one plugin failure doesn't block others), logged + plugin status set to "error"

**Endpoints:**
- GET /api/v1/plugins/registry — browse available (paginated, search)
- POST /api/v1/plugins/install — body: {registry_id} — download, validate manifest, install
- GET /api/v1/plugins — list installed plugins
- POST /api/v1/plugins/{id}/enable — enable plugin
- POST /api/v1/plugins/{id}/disable — disable plugin
- DELETE /api/v1/plugins/{id} — uninstall

**Seed registry:** 5 example plugins (event logger, Slack notifier, cost alerter, custom metrics, agent namer)

### Frontend
- PluginRegistryPage (/plugins/registry): browse cards with install button, search, verified badge, download count
- PluginManagerPage (/plugins): installed plugins with enable/disable toggle, status badge, uninstall button
- Settings → Plugins tab (link to manager)

## Subsystem 4: SSO/SAML

### Backend

**New table: `sso_configs`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces, unique |
| provider_type | VARCHAR(20) | saml, oidc |
| entity_id | VARCHAR(500) | SAML entity ID |
| sso_url | VARCHAR(2000) | SAML SSO URL or OIDC authorization endpoint |
| certificate | TEXT | SAML IdP X.509 cert (PEM) |
| metadata_url | VARCHAR(2000) | nullable, SAML metadata URL |
| client_id | VARCHAR(255) | OIDC client ID |
| client_secret_encrypted | TEXT | OIDC client secret (Fernet) |
| issuer | VARCHAR(500) | OIDC issuer URL |
| enabled | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | |

**New table: `sso_sessions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| provider_type | VARCHAR(20) | |
| external_id | VARCHAR(500) | IdP user identifier |
| session_data | JSONB | |
| created_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | |

**Dependencies:** `python3-saml==1.16.0`, `authlib==1.3.0`

**SAML 2.0 Flow (SP-initiated):**
1. User clicks "Sign in with SSO" → enters workspace slug
2. GET /api/v1/auth/sso/{workspace_slug}/login → load sso_config, build AuthnRequest, redirect to IdP
3. User authenticates at IdP
4. IdP POSTs SAML Response to POST /api/v1/auth/sso/callback/saml (ACS endpoint)
5. Validate assertion (signature, audience, expiry), extract email + name
6. Auto-provision user if first login, add to workspace as "member"
7. Issue JWT access + refresh tokens, redirect to dashboard

**OIDC Flow (Authorization Code):**
1. GET /api/v1/auth/sso/{workspace_slug}/login → redirect to OIDC authorization endpoint with state + nonce
2. User authenticates at IdP
3. IdP redirects to GET /api/v1/auth/sso/callback/oidc with authorization code
4. Exchange code for tokens, validate ID token, extract email + name
5. Auto-provision + issue JWT, redirect to dashboard

**Admin endpoints:**
- GET /api/v1/sso/config — current SSO config for workspace
- PUT /api/v1/sso/config — save/update config
- POST /api/v1/sso/config/test — validate config (check metadata URL reachable, cert parseable)
- DELETE /api/v1/sso/config — remove SSO config

### Frontend
- LoginPage: "Sign in with SSO" button → workspace slug input → redirect
- Settings → SSO tab: provider type selector (SAML/OIDC), config form, certificate upload (SAML), client ID/secret (OIDC), test + enable/disable buttons

## Subsystem 5: Multi-Org Tenancy

### Backend

**New table: `organizations`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | |
| slug | VARCHAR(100) | unique, URL-safe |
| logo_url | VARCHAR(500) | nullable |
| plan | VARCHAR(20) | free, pro, enterprise |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |

**New table: `org_members`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| user_id | UUID | FK → users |
| role | VARCHAR(20) | owner, admin, member |
| joined_at | TIMESTAMPTZ | |

**New table: `shared_agents`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| agent_id | UUID | FK → agents |
| source_workspace_id | UUID | FK → workspaces |
| target_workspace_id | UUID | FK → workspaces |
| permissions | VARCHAR(20) | read, write |
| shared_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |

**Schema changes:**
- Add `org_id` (UUID, FK → organizations, nullable) to `workspaces` table
- Existing workspaces without org_id continue to work (backward compatible)

**Data isolation:**
- All existing queries filter by workspace_id — unchanged
- Org-level queries: aggregate across workspaces WHERE workspace.org_id = org_id
- Shared agents: target workspace can query shared agent's data (events, metrics) with read permission, or create events with write permission

**Endpoints:**
- POST /api/v1/orgs — create organization
- GET /api/v1/orgs — list user's organizations
- GET /api/v1/orgs/{id} — org detail
- PUT /api/v1/orgs/{id} — update org (name, logo)
- GET /api/v1/orgs/{id}/members — list org members
- POST /api/v1/orgs/{id}/members — invite member (email, role)
- DELETE /api/v1/orgs/{id}/members/{user_id} — remove member
- GET /api/v1/orgs/{id}/workspaces — list org's workspaces
- GET /api/v1/orgs/{id}/analytics — cross-workspace metrics
- POST /api/v1/agents/{id}/share — share agent (target_workspace_id, permissions)
- GET /api/v1/shared-agents — agents shared with current workspace
- DELETE /api/v1/shared-agents/{id} — revoke sharing

### Frontend
- OrgSwitcher: dropdown in header (next to workspace name), shows orgs user belongs to, "Create Organization" option
- OrgSettingsPage (/org/settings): name, logo upload, plan badge, member management, workspace list with "Create Workspace" button
- OrgAnalyticsPage (/org/analytics): cross-workspace metrics cards (total agents, total events, total XP, active workspaces), charts aggregating across workspaces
- SharedAgentsPage (/shared-agents): list of agents shared with this workspace, share modal (select agent, target workspace, read/write permission)

## New Database Tables Summary

| Table | Subsystem |
|-------|-----------|
| webhooks | Webhooks |
| webhook_deliveries | Webhooks |
| plugins | Plugins |
| plugin_registry | Plugins |
| sso_configs | SSO |
| sso_sessions | SSO |
| organizations | Multi-Org |
| org_members | Multi-Org |
| shared_agents | Multi-Org |

**9 new tables** in a single Alembic migration (008).

## New API Endpoints Summary

| Count | Subsystem |
|-------|-----------|
| 2 | API Docs (versioned spec + redirect) |
| 6 | Webhooks (CRUD + deliveries + test) |
| 6 | Plugins (registry + install + manage) |
| 4 | SSO (login + callbacks + config) |
| 12 | Multi-Org (orgs CRUD + members + workspaces + analytics + sharing) |
| **30** | **Total** |

## Priority Matrix

| Priority | Features |
|----------|----------|
| Must-have | API versioning, webhook CRUD + delivery, plugin install/manage, SSO SAML flow, org CRUD + members |
| Should-have | API changelog, webhook test button, plugin registry browse, OIDC flow, org analytics, agent sharing |
| Nice-to-have | SDK code snippets, plugin sandboxing, SSO auto-provision, org logo upload |

## Dependencies
- `python3-saml==1.16.0` — SAML assertion parsing
- `authlib==1.3.0` — OIDC client
- `swagger-ui-react` or iframe embed for frontend API docs

## Non-Goals (Sprint 7)
- Plugin monetization / paid plugins
- Custom domain per organization
- SCIM provisioning
- Billing / payment processing
- Plugin CLI scaffolding tool
- Cross-organization competitions
