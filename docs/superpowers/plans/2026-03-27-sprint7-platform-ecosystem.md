# Sprint 7: Platform & Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the OpenAgentVisualizer platform with API versioning, webhooks, plugin system, enterprise SSO, and multi-organization tenancy.

**Architecture:** 5 independent subsystems implemented in parallel groups. Single Alembic migration for all 9 new tables. Backend creates models/services/routers per subsystem. Frontend adds pages/components. SSO uses python3-saml + authlib. Plugins use importlib with restricted execution context.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Celery, python3-saml, authlib, React 18, Zustand, React Query, Tailwind CSS

---

## File Structure

### New Backend Files

| File | Subsystem |
|------|-----------|
| `app/models/webhook.py` | Webhooks — Webhook + WebhookDelivery models |
| `app/models/plugin.py` | Plugins — Plugin + PluginRegistry models |
| `app/models/sso.py` | SSO — SSOConfig + SSOSession models |
| `app/models/organization.py` | Multi-Org — Organization + OrgMember + SharedAgent models |
| `app/schemas/webhook.py` | Webhooks |
| `app/schemas/plugin.py` | Plugins |
| `app/schemas/sso.py` | SSO |
| `app/schemas/organization.py` | Multi-Org |
| `app/routers/webhooks.py` | Webhooks — CRUD + deliveries + test |
| `app/routers/plugins.py` | Plugins — registry + install + manage |
| `app/routers/sso.py` | SSO — login flows + config |
| `app/routers/organizations.py` | Multi-Org — orgs + members + workspaces |
| `app/routers/shared_agents.py` | Multi-Org — agent sharing |
| `app/services/webhook_service.py` | Webhooks — HMAC signing + dispatch |
| `app/services/plugin_service.py` | Plugins — load, execute, sandbox |
| `app/services/sso_service.py` | SSO — SAML + OIDC flows |
| `app/tasks/webhooks.py` | Webhooks — delivery + cleanup tasks |
| `app/data/seed_plugins.py` | Plugins — 5 example registry entries |
| `alembic/versions/008_platform_ecosystem.py` | Migration for 9 tables |
| `tests/test_webhooks.py` | Webhook tests |
| `tests/test_plugins.py` | Plugin tests |
| `tests/test_sso.py` | SSO tests |
| `tests/test_organizations.py` | Multi-Org tests |
| `tests/test_shared_agents.py` | Shared agent tests |

### New Frontend Files

| File | Subsystem |
|------|-----------|
| `types/webhook.ts` | Webhooks |
| `types/plugin.ts` | Plugins |
| `types/sso.ts` | SSO |
| `types/organization.ts` | Multi-Org |
| `hooks/useWebhooks.ts` | Webhooks |
| `hooks/usePlugins.ts` | Plugins |
| `hooks/useSSO.ts` | SSO |
| `hooks/useOrganizations.ts` | Multi-Org |
| `stores/orgStore.ts` | Multi-Org |
| `pages/ApiDocsPage.tsx` | API Docs |
| `pages/PluginRegistryPage.tsx` | Plugins |
| `pages/PluginManagerPage.tsx` | Plugins |
| `pages/OrgSettingsPage.tsx` | Multi-Org |
| `pages/OrgAnalyticsPage.tsx` | Multi-Org |
| `pages/SharedAgentsPage.tsx` | Multi-Org |
| `components/platform/WebhookList.tsx` | Webhooks |
| `components/platform/WebhookModal.tsx` | Webhooks |
| `components/platform/DeliveryLog.tsx` | Webhooks |
| `components/platform/PluginCard.tsx` | Plugins |
| `components/platform/SSOConfigForm.tsx` | SSO |
| `components/platform/OrgSwitcher.tsx` | Multi-Org |
| `components/platform/ShareAgentModal.tsx` | Multi-Org |

---

## Group A: Migration + Models (Task 1)

### Task 1: Alembic Migration + All Models + Seed Data

**Files:**
- Create: All 4 model files (webhook, plugin, sso, organization)
- Create: `src/backend/alembic/versions/008_platform_ecosystem.py`
- Create: `src/backend/app/data/seed_plugins.py`
- Modify: `src/backend/app/models/__init__.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/requirements.txt` (add python3-saml, authlib)

Create all 9 tables in migration 008. Models follow existing Mapped/mapped_column pattern. Register all models. Add python3-saml==1.16.0 and authlib==1.3.0 to requirements. Seed 5 plugin registry entries on startup.

**Seed plugin registry (5 entries):**
- Event Logger: logs all events to file (verified, 1000 downloads)
- Slack Notifier: sends alerts to Slack channel (verified, 2500 downloads)
- Cost Alerter: alerts when agent costs exceed threshold (verified, 800 downloads)
- Custom Metrics: adds custom metric collection hooks (verified, 600 downloads)
- Agent Namer: auto-generates creative agent names (unverified, 200 downloads)

- [ ] **Commit:** `feat: add 9 platform tables + seed plugin registry (migration 008)`

---

## Group B: API Docs + Webhooks Backend (Tasks 2-3)

### Task 2: API Versioning + Docs Polish

**Files:**
- Modify: `src/backend/app/main.py` — add /api/v1/ prefix aliases, tags_metadata, X-API-Version middleware

Add a v1 router that includes all existing routers under `/api/v1/` prefix. Keep `/api/` working for backward compatibility. Add `X-API-Version: 1` response header via middleware. Add `tags_metadata` list to FastAPI app for organized Swagger grouping.

- [ ] **Commit:** `feat: add API v1 versioning + OpenAPI schema polish`

### Task 3: Webhook Backend

**Files:**
- Create: `src/backend/app/schemas/webhook.py`
- Create: `src/backend/app/routers/webhooks.py`
- Create: `src/backend/app/services/webhook_service.py`
- Create: `src/backend/app/tasks/webhooks.py`
- Create: `src/backend/tests/test_webhooks.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

Schemas: WebhookCreate (name, url, events), WebhookRead, WebhookDeliveryRead.
Service: create_delivery(webhook, event_type, payload), sign_payload(secret, payload) using HMAC-SHA256, dispatch_to_matching_webhooks(workspace_id, event_type, payload).
Router: CRUD + GET deliveries + POST test.
Tasks: deliver_webhook (POST with HMAC header, 3 retries at 10s/60s/300s), cleanup_deliveries (beat daily, delete >30 days).
Tests: create webhook, test delivery, HMAC signature verification.

- [ ] **Commit:** `feat: add webhook system with HMAC signing and retry delivery`

---

## Group C: Plugin Backend (Task 4)

### Task 4: Plugin System Backend

**Files:**
- Create: `src/backend/app/schemas/plugin.py`
- Create: `src/backend/app/routers/plugins.py`
- Create: `src/backend/app/services/plugin_service.py`
- Create: `src/backend/tests/test_plugins.py`
- Modify: `src/backend/app/main.py`

Schemas: PluginRegistryRead, PluginRead, PluginInstallRequest.
Service: PluginContext class (get_agents, get_events, create_event, get_config, set_config), load_plugin (importlib), execute_hook (with 5s timeout + error handling), validate_manifest.
Router: GET registry (paginated + search), POST install, GET installed, POST enable, POST disable, DELETE uninstall.
Hook dispatcher: dispatch_hook(hook_name, payload) iterates enabled plugins with matching hook.
Tests: list registry, install plugin, enable/disable, hook dispatch.

- [ ] **Commit:** `feat: add plugin system with registry, install, and hook dispatch`

---

## Group D: SSO Backend (Task 5)

### Task 5: SSO/SAML + OIDC Backend

**Files:**
- Create: `src/backend/app/schemas/sso.py`
- Create: `src/backend/app/routers/sso.py`
- Create: `src/backend/app/services/sso_service.py`
- Create: `src/backend/tests/test_sso.py`
- Modify: `src/backend/app/main.py`

Schemas: SSOConfigCreate (provider_type, entity_id, sso_url, certificate, client_id, client_secret, issuer), SSOConfigRead.
Service: build_saml_auth_request(config), validate_saml_response(config, response), build_oidc_auth_url(config, state, nonce), exchange_oidc_code(config, code), auto_provision_user(email, name, workspace_id).
Router: GET /api/v1/auth/sso/{workspace_slug}/login (detect provider type, redirect), POST /api/v1/auth/sso/callback/saml (ACS), GET /api/v1/auth/sso/callback/oidc, GET/PUT/DELETE /api/v1/sso/config, POST /api/v1/sso/config/test.
Tests: config CRUD, SAML request generation (mocked IdP), OIDC URL generation.

- [ ] **Commit:** `feat: add SSO with SAML 2.0 and OIDC support`

---

## Group E: Multi-Org Backend (Tasks 6-7)

### Task 6: Organization Backend

**Files:**
- Create: `src/backend/app/schemas/organization.py`
- Create: `src/backend/app/routers/organizations.py`
- Create: `src/backend/tests/test_organizations.py`
- Modify: `src/backend/app/main.py`

Schemas: OrgCreate, OrgRead, OrgMemberRead, OrgAnalytics.
Router: POST /api/v1/orgs, GET /api/v1/orgs, GET /api/v1/orgs/{id}, PUT /api/v1/orgs/{id}, GET /api/v1/orgs/{id}/members, POST /api/v1/orgs/{id}/members, DELETE /api/v1/orgs/{id}/members/{user_id}, GET /api/v1/orgs/{id}/workspaces, GET /api/v1/orgs/{id}/analytics.
Analytics: aggregate total agents, events, XP across org's workspaces.
Tests: create org, add member, list workspaces, analytics.

- [ ] **Commit:** `feat: add organization CRUD with member management and analytics`

### Task 7: Shared Agents Backend

**Files:**
- Create: `src/backend/app/routers/shared_agents.py`
- Create: `src/backend/tests/test_shared_agents.py`
- Modify: `src/backend/app/main.py`

Router: POST /api/v1/agents/{id}/share (body: target_workspace_id, permissions), GET /api/v1/shared-agents, DELETE /api/v1/shared-agents/{id}.
Share validates: agent belongs to current workspace, target workspace exists in same org, not already shared.
Tests: share agent, list shared, revoke, cross-org rejection.

- [ ] **Commit:** `feat: add cross-workspace agent sharing`

---

## Group F: Frontend — API Docs + Webhooks + Plugins (Tasks 8-9)

### Task 8: API Docs + Webhooks Frontend

**Files:**
- Create: `src/frontend/src/types/webhook.ts`
- Create: `src/frontend/src/hooks/useWebhooks.ts`
- Create: `src/frontend/src/components/platform/WebhookList.tsx`
- Create: `src/frontend/src/components/platform/WebhookModal.tsx`
- Create: `src/frontend/src/components/platform/DeliveryLog.tsx`
- Create: `src/frontend/src/pages/ApiDocsPage.tsx`
- Modify: `src/frontend/src/pages/SettingsPage.tsx` (Webhooks tab)
- Modify: `src/frontend/src/routes.tsx`

ApiDocsPage: iframe embedding /docs (Swagger UI), SDK snippets tabs (Python/TS/cURL), changelog section.
Settings → Webhooks tab: WebhookList (name, URL, event count, active toggle), WebhookModal (create/edit: name, URL, event checkboxes, secret shown once), DeliveryLog (expandable rows: event, status badge, response code, attempts, timestamps), test button.

- [ ] **Commit:** `feat: add API docs page and webhook management UI`

### Task 9: Plugin Frontend

**Files:**
- Create: `src/frontend/src/types/plugin.ts`
- Create: `src/frontend/src/hooks/usePlugins.ts`
- Create: `src/frontend/src/components/platform/PluginCard.tsx`
- Create: `src/frontend/src/pages/PluginRegistryPage.tsx`
- Create: `src/frontend/src/pages/PluginManagerPage.tsx`
- Modify: `src/frontend/src/routes.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx`

PluginCard: name, author, description, verified badge (lucide ShieldCheck), download count, install/uninstall button.
PluginRegistryPage (/plugins/registry): search bar, grid of PluginCards, "Browse" feel.
PluginManagerPage (/plugins): installed plugins with enable/disable toggle, status badge (installed=green, disabled=gray, error=red), uninstall button.
Settings → Plugins tab (link).

- [ ] **Commit:** `feat: add plugin registry and manager frontend`

---

## Group G: Frontend — SSO + Multi-Org (Tasks 10-11)

### Task 10: SSO Frontend

**Files:**
- Create: `src/frontend/src/types/sso.ts`
- Create: `src/frontend/src/hooks/useSSO.ts`
- Create: `src/frontend/src/components/platform/SSOConfigForm.tsx`
- Modify: `src/frontend/src/pages/LoginPage.tsx`
- Modify: `src/frontend/src/pages/SettingsPage.tsx` (SSO tab)

LoginPage: add "Sign in with SSO" button → workspace slug input → redirect to /api/v1/auth/sso/{slug}/login.
Settings → SSO tab: SSOConfigForm with provider type selector (SAML/OIDC), conditional fields (SAML: entity ID, SSO URL, certificate textarea; OIDC: client ID, client secret, issuer URL), test connection button, enable/disable toggle.

- [ ] **Commit:** `feat: add SSO login flow and configuration UI`

### Task 11: Multi-Org Frontend

**Files:**
- Create: `src/frontend/src/types/organization.ts`
- Create: `src/frontend/src/hooks/useOrganizations.ts`
- Create: `src/frontend/src/stores/orgStore.ts`
- Create: `src/frontend/src/components/platform/OrgSwitcher.tsx`
- Create: `src/frontend/src/components/platform/ShareAgentModal.tsx`
- Create: `src/frontend/src/pages/OrgSettingsPage.tsx`
- Create: `src/frontend/src/pages/OrgAnalyticsPage.tsx`
- Create: `src/frontend/src/pages/SharedAgentsPage.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx` (OrgSwitcher in header)
- Modify: `src/frontend/src/routes.tsx`

OrgSwitcher: dropdown in header showing current org name, list of user's orgs, "Create Organization" option.
OrgSettingsPage: name/logo, member list (role badges, invite/remove), workspace list with create button.
OrgAnalyticsPage: 4 stat cards (total agents/events/XP/workspaces), aggregated charts.
SharedAgentsPage: list of agents shared with current workspace, ShareAgentModal (select agent, target workspace dropdown, read/write permission).

- [ ] **Commit:** `feat: add multi-org UI — org switcher, settings, analytics, agent sharing`

---

## Group H: Finalize (Task 12)

### Task 12: Sprint Backlog + Push

- [ ] Update `docs/sprint-backlog.md` with Sprint 7 completion
- [ ] Update memory/pipeline tracker
- [ ] **Commit:** `docs: update sprint backlog with Sprint 7 completion — final sprint`
- [ ] Push to GitHub
