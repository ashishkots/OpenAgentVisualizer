# Sprint 5 Design: User Experience

## Executive Summary

Sprint 5 delivers 5 UX subsystems to make OpenAgentVisualizer ready for general-purpose users (DevOps, data scientists, engineering managers): onboarding wizard, notification center, data export, workspace collaboration, and mobile polish with PWA support.

## Subsystem 1: Onboarding

### First-Run Wizard (3 steps)

**Step 1 — Welcome:** Workspace name confirmation, optional avatar upload. Shown on first login when workspace has zero agents.

**Step 2 — Connect:** Choose integration method with copy-to-clipboard code blocks:
- SDK snippet (Python: `pip install oav-sdk` + 5-line setup)
- API key (generate key + curl example)
- OTLP endpoint (endpoint URL + collector config snippet)

**Step 3 — Verify:** Real-time polling (every 2s, max 60s) checking if first event arrived. Success animation (confetti via GSAP) + "Go to Dashboard" button. Timeout shows "Skip for now" with manual verification link.

**Detection logic:** `GET /api/agents` returns empty → show wizard. Wizard completion stored as `onboarding_completed` flag on workspace model (new boolean column, default false).

### Guided Tour

- 6-stop tooltip tour: sidebar nav → agent grid → canvas view → leaderboard → alerts → settings
- `TourProvider` React context wrapping AppShell
- `TourTooltip` component: positioned absolutely, arrow pointing to target, "Next" / "Skip" buttons, progress dots
- Triggered after wizard step 3 completion
- State in `localStorage` key `oav-tour-completed` — no backend needed
- `prefers-reduced-motion`: no animation on tooltip appearance

### Empty States

- Reusable `EmptyState` component: `icon: LucideIcon`, `title: string`, `description: string`, `actionLabel: string`, `onAction: () => void`
- Applied to: AgentsPage, EventsPage, AlertsPage, SessionsPage, TraceExplorerPage, LeaderboardPage
- Each page checks data length === 0 and renders EmptyState instead of empty table/grid
- Icons from lucide-react, consistent with existing icon system

## Subsystem 2: Notifications

### Backend

**New table: `notifications`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (uuid7) | PK |
| workspace_id | UUID | FK → workspaces |
| user_id | UUID | FK → users |
| type | VARCHAR(50) | achievement, alert, system, collaboration |
| title | VARCHAR(255) | |
| body | TEXT | |
| read | BOOLEAN | default false |
| link | VARCHAR(500) | nullable, navigation target |
| created_at | TIMESTAMPTZ | default now |

**New Alembic migration:** `006_notifications_and_collaboration.py`

**Notification triggers (Celery tasks):**
- Achievement unlock → type=achievement, link=/agents/{id}?tab=achievements
- Alert triggered → type=alert, link=/alerts
- Level-up → type=achievement, link=/leaderboard
- Workspace invite → type=collaboration, link=/settings?tab=members
- Integration failure → type=system, link=/settings?tab=integrations

**Endpoints:**
- GET /api/notifications?limit=20&offset=0&unread=true|false — paginated, filterable
- PATCH /api/notifications/{id}/read — mark single as read
- POST /api/notifications/read-all — mark all as read
- GET /api/notifications/unread-count — returns `{ count: int }`

**WebSocket:** New notification channel `ws:user:{user_id}` — push new notifications in real-time.

### Frontend

**Header: NotificationBell**
- Bell icon (lucide `Bell`) in AppShell header, right side
- Unread badge: red circle with count (max "99+")
- Click opens NotificationDropdown

**NotificationDropdown**
- Positioned below bell, max 20 items, scrollable
- NotificationItem: icon by type (Trophy=achievement, AlertTriangle=alert, Info=system, Users=collaboration), title, body truncated to 1 line, time-ago, read/unread background styling
- Click item → mark read + navigate to link
- Footer: "Mark all read" button + "View All" link → /notifications

**NotificationsPage (/notifications)**
- Full page with infinite scroll (React Query `useInfiniteQuery`)
- Filter tabs: All, Achievements, Alerts, System, Collaboration
- Bulk actions: "Mark all read", "Clear read"

**Toast Notifications**
- High-priority types (alert, level-up) also show a toast via existing NotificationLayer
- Auto-dismiss after 5s, click navigates to link

**Zustand store: useNotificationStore**
- Fields: unreadCount, notifications[], isDropdownOpen
- Actions: fetchUnreadCount, markRead, markAllRead
- WebSocket subscription: on `notification.new` → prepend to list, increment count

## Subsystem 3: Data Export

### Backend

**New router: `src/backend/app/routers/export.py`**

- GET /api/export/agents?format=csv|json
  - CSV columns: id, name, type, framework, status, level, xp, tasks_completed, created_at
  - JSON: array of agent objects
  - StreamingResponse with `text/csv` or `application/json` content type
  - `Content-Disposition: attachment; filename="agents-{timestamp}.{ext}"`

- GET /api/export/events?format=csv|json&start=&end=
  - Required: start and end (ISO 8601 timestamps)
  - Max range: 30 days (return 400 if exceeded)
  - CSV columns: id, agent_id, event_type, timestamp, extra_data (JSON-serialized)
  - Streaming: yield rows in chunks of 1000

- GET /api/export/metrics?format=csv|json&interval=hourly|daily&start=&end=
  - Required: interval, start, end
  - Max range: 30 days
  - CSV columns: timestamp, agent_id, metric_type, value

**Implementation:** Use Python `csv.writer` with `io.StringIO` buffer, yield chunks. For JSON, use `orjson.dumps` per chunk.

### Frontend

**ExportButton component**
- Props: `endpoint: string`, `filename: string`, `hasDateRange: boolean`
- Renders: download icon button, click opens ExportDialog

**ExportDialog**
- Format selector: CSV / JSON radio buttons
- Date range picker (shown when `hasDateRange=true`): start/end date inputs
- "Export" button triggers `fetch()` → `blob()` → `URL.createObjectURL()` → `<a download>`
- Loading spinner during download

**Placement:**
- AgentsPage header: "Export Agents" button
- EventsPage header: "Export Events" button (with date range)
- AnalyticsPage header: "Export Metrics" button (with date range + interval)

## Subsystem 4: Collaboration

### Backend

**New table: `workspace_invites`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (uuid7) | PK |
| workspace_id | UUID | FK → workspaces |
| email | VARCHAR(255) | invitee email |
| role | VARCHAR(20) | admin, member, viewer |
| invited_by | UUID | FK → users |
| status | VARCHAR(20) | pending, accepted, declined |
| token | VARCHAR(64) | unique, URL-safe random |
| expires_at | TIMESTAMPTZ | default now + 7 days |
| created_at | TIMESTAMPTZ | |

**New table: `activity_feed`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (uuid7) | PK |
| workspace_id | UUID | FK → workspaces |
| user_id | UUID | FK → users, nullable (system events) |
| action | VARCHAR(100) | agent_created, config_changed, member_joined, export_triggered, etc. |
| target_type | VARCHAR(50) | agent, workspace, integration, etc. |
| target_id | VARCHAR(255) | nullable |
| extra_data | JSONB | additional context |
| created_at | TIMESTAMPTZ | |

Both tables created in migration `006_notifications_and_collaboration.py`.

**Invite Endpoints:**
- POST /api/workspaces/invite — body: `{ email, role }`, generates token, returns invite URL
- GET /api/workspaces/invites — list pending invites for workspace
- DELETE /api/workspaces/invites/{id} — revoke pending invite
- POST /api/workspaces/invites/{token}/accept — validates token + expiry, creates workspace membership, updates invite status, logs activity, sends notification

**Role enforcement:** Add `role` column to existing workspace membership model (default "admin" for creator, "member" for invitees). Viewer role: read-only on all mutation endpoints (POST/PUT/PATCH/DELETE return 403).

**Activity Feed Endpoints:**
- GET /api/workspaces/activity?limit=50&offset=0 — paginated activity
- Activity auto-logged via a `log_activity()` helper called in key routers (agent CRUD, settings changes, export, member join/leave)

**Celery task:** `prune_activity` runs daily, deletes activity older than 90 days.

### Frontend

**Settings → Members Tab**
- Member list: avatar (hash-generated), name, email, role badge, "Remove" button (admin only)
- "Invite Member" button → InviteModal
- InviteModal: email input, role selector (Admin/Member/Viewer), generates invite link, copy-to-clipboard

**Activity Feed Panel**
- Collapsible right sidebar on DashboardPage (icon: `Activity` from lucide)
- Last 20 items, "View All" button
- ActivityItem: user avatar, action text (e.g., "Alice created agent-007"), time-ago
- Click navigates to target

**Invite Accept Page**
- Route: /invite/{token}
- If logged in: accept invite, redirect to dashboard
- If not logged in: redirect to register with invite token in URL, auto-accept after registration

**Viewer Role UI**
- All mutation buttons (Create, Edit, Delete) hidden for viewer role
- Role stored in `useAuthStore` after login (from JWT claims or /api/me endpoint)

## Subsystem 5: Mobile Polish

### Bottom Navigation

- Replaces sidebar on screens < 768px (`md:` breakpoint)
- 5 tabs: Dashboard (LayoutDashboard), Canvas (Globe), Agents (Bot), Alerts (Bell), More (Menu)
- "More" expands upward menu with remaining pages
- Active tab indicator (accent color underline)
- Component: `BottomNav` rendered in AppShell, hidden on `md:` and above

### Touch Interactions

- PixiJS canvas: add touch event handlers for pinch-to-zoom (two-finger gesture via `pointermove` delta)
- Tap agent to select (replaces hover tooltip)
- Long-press (500ms) for context menu (inspect, view detail, copy ID)
- All interactive elements: minimum 44px touch target (`min-h-[44px] min-w-[44px]`)

### Bottom Sheets

- `BottomSheet` component: slides up from bottom on mobile, replaces modals/dialogs
- Used for: agent detail (from canvas), filter panels, export options, notification actions
- Drag-to-dismiss gesture (drag down > 100px = close)
- Backdrop overlay, max height 75vh

### PWA Support

- `public/manifest.json`: name, short_name, icons (192 + 512), theme_color (oav-bg), background_color, display: standalone, start_url: /dashboard
- Service worker (`public/sw.js`): cache app shell (index.html, CSS, JS bundles), network-first for API calls
- Register in `main.tsx`: `navigator.serviceWorker.register('/sw.js')`
- Offline banner component: shown when `navigator.onLine === false`
- "Add to Home Screen" prompt: `beforeinstallprompt` event, shown after 3rd visit (count in localStorage)

### Small Screen Adaptations

- Agent grid: `grid-cols-1` on mobile (already `sm:grid-cols-2 lg:grid-cols-4`)
- Tables (alerts, events, members): card layout on mobile using `<dl>` definition lists
- Charts: horizontal scroll wrapper with `overflow-x-auto`, simplified tooltips
- Slide-in panels: become bottom sheets on mobile

## Feature Priority Matrix

| Priority | Features |
|----------|----------|
| Must-have | Onboarding wizard, empty states, notification center, notification WebSocket, data export (CSV/JSON), workspace invites, role enforcement, bottom navigation |
| Should-have | Guided tour, activity feed, invite accept page, PWA manifest + service worker, bottom sheets, touch canvas interactions |
| Nice-to-have | Swipe gestures, offline banner, add-to-home-screen prompt, activity pruning |

## New Database Tables

1. `notifications` — user notifications
2. `workspace_invites` — collaboration invites
3. `activity_feed` — workspace activity log
4. Add `onboarding_completed` boolean to `workspaces` table
5. Add `role` varchar to workspace membership table

All in a single migration: `006_notifications_and_collaboration.py`

## New API Endpoints Summary

| Method | Path | Subsystem |
|--------|------|-----------|
| GET | /api/notifications | Notifications |
| PATCH | /api/notifications/{id}/read | Notifications |
| POST | /api/notifications/read-all | Notifications |
| GET | /api/notifications/unread-count | Notifications |
| GET | /api/export/agents | Export |
| GET | /api/export/events | Export |
| GET | /api/export/metrics | Export |
| POST | /api/workspaces/invite | Collaboration |
| GET | /api/workspaces/invites | Collaboration |
| DELETE | /api/workspaces/invites/{id} | Collaboration |
| POST | /api/workspaces/invites/{token}/accept | Collaboration |
| GET | /api/workspaces/activity | Collaboration |

## Non-Goals (Sprint 5)

- Email delivery (invites use copy-link pattern)
- Real-time collaboration (simultaneous editing)
- Push notifications (browser push API)
- Offline data sync (service worker caches shell only)
- i18n / localization
