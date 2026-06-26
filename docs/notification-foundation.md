# Notification Foundation — Phase 2 Step 7

## Summary

Review of in-app notification storage, read/update flows, and gaps before event-driven notification creation.

No Supabase migrations were created. No UI was changed.

## Schema

`notifications` fields in use:

| Field | Purpose |
| --- | --- |
| `user_id` | Recipient |
| `type` | Notification category |
| `title` | Short headline |
| `body` | Detail text |
| `url` | Deep link target |
| `entity_type` / `entity_id` | Related record |
| `actor_id` | Who triggered the event |
| `read_at` | Read state |
| `resolved_at` | Optional resolution state |
| `created_at` | Ordering |

## Current Frontend Usage

| Surface | Behavior |
| --- | --- |
| `/inbox` | Primary notification inbox, realtime subscription |
| Dashboard | Reads notifications for signals/widgets |
| App shell | Unread badge via `fetchNotifications` |
| Settings | Stores notification preferences in `user_settings.notifications` JSON |

## Data Access Layer

`src/lib/wave1.ts`:

- `fetchNotifications()` — list latest 100 rows
- `markNotification()` — update read/resolved timestamps
- `markAllRead()` — mark current user's unread rows

## Issues Found

| Issue | Severity |
| --- | --- |
| `fetchNotifications()` does not filter by `user_id` | High — may leak cross-user rows depending on RLS |
| No shared `createNotification()` helper | Medium — creation paths inconsistent |
| No event triggers from task/project mutations | Expected gap for foundation phase |
| Email/push channels not implemented | Intentionally deferred |
| Preference JSON not enforced on delivery | Settings exist but are not applied |

### RLS note

Notification select/update policies should be verified in migrations before production. Client queries must always scope to `auth.uid()` even when RLS exists.

## Target Notification Types (Phase 2+)

Initial in-app types to support:

- `task_assigned`
- `task_due_soon`
- `project_updated`
- `mention`
- `invitation_accepted`
- `decision_pending`
- `system`

Email and push remain later phases.

## Recommended Foundation Helpers (Future)

Add `src/lib/notifications.ts`:

```typescript
createNotification({ userId, type, title, body, entityType, entityId, actorId, url })
fetchMyNotifications(limit?)
markNotificationRead(id)
markAllNotificationsRead()
```

Fix `fetchNotifications()` to filter by current user.

## Delivery Boundaries

| Channel | Status |
| --- | --- |
| In-app | Partially wired (read/update) |
| Email | Not connected (Resend later) |
| Push | Not planned yet |
| SMS | Not planned yet |

## Recommended Next Task

Phase 2 Step 8: Future AI gateway planning. See `docs/ai-gateway-planning.md`.

## Validation

```bash
npm run build
```
