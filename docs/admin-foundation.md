# Admin Foundation — Phase 2 Step 6

## Summary

Review of the current admin structure, data access, and governance boundaries.

No Supabase migrations were created. No UI was changed.

## Admin Surface Map

| Route | Purpose | Data source |
| --- | --- | --- |
| `/administration` | Dashboard stats, dev sample tools | `admin-queries`, dev-tools |
| `/administration/users` | User list and profile status | `profiles`, `user_roles` |
| `/administration/roles` | Permission matrix | `permissions`, `role_permissions` |
| `/administration/invitations` | Invite flow | `invitations`, email logs |
| `/administration/emails` | Email templates | `email_templates` |
| `/administration/email-logs` | Send history | `email_logs` |
| `/administration/voice` | Voice provider controls | env + connection overview |
| `/administration/audit` | Audit trail | `audit_logs` |
| `/administration/settings` | System settings | `system_settings` |
| `/administration/downloads` | Export bundles | local/generated |
| `/administration/role-switcher` | Dev role testing | dev-tools (env gated) |

## Access Control

### Route guard

`/_authenticated/administration` requires:

- Real Supabase session
- `is_admin` RPC (includes `super_admin`)

Founder mode does not grant admin route access.

### UI visibility

Admin nav items in `app-shell.tsx` use `isAdmin` from auth context.

### Server-side privileged tools

| Tool | Guard |
| --- | --- |
| `devOwnerMagicLink` | `ENABLE_DEV_OWNER_TOOLS=true` |
| `setSelfRole` / `resetDemoData` / `seedDemoData` | owner email + dev tools env flag |

## Admin Data Modules

### Users

- Reads all profiles for admin list
- Can update profile `status` (active/inactive)
- Role rows read from `user_roles`
- Does not yet create auth users directly except via invitations/dev owner magic link

### Roles and permissions

- Permission catalog seeded in migration
- Role-permission matrix editable in admin UI
- Uses `role_permissions` insert/delete
- Super admin bypass handled in SQL via `has_permission()`

### Invitations

- Creates invitation rows with email, role, language, message
- Does not yet set `organization_id`, `team_id`, or `department_id`
- Email send is logged locally; Resend not connected

### Audit logs

- Read via `fetchAuditLogs`
- Insert policy allows authenticated users to write rows where `actor_id = auth.uid()`
- No centralized app helper yet for writing audit events from mutations

### System settings

- Key/value JSON store
- Voice, assistant, email, and i18n defaults seeded
- Updates require `manage_settings` permission in RLS

## Gaps

| Gap | Risk |
| --- | --- |
| No organizations admin UI | Org model exists in DB but is invisible in admin |
| Admin checks use `is_admin` only, not permission keys | Coarse access; super_admin/admin treated equally in route guard |
| Invitations lack org/team scope | Onboarded users may not land in correct workspace |
| Audit log writes not standardized | Sensitive actions may not be recorded consistently |
| Email templates/logs disconnected from Resend | Admin email tooling is local/metadata only |
| Dev sample data tools powerful even when gated | Must stay disabled in production env |

## Recommended Admin Write Paths (Future)

Introduce internal helpers (no UI change required initially):

1. `logAdminAction(action, entityType, entityId, metadata)`
2. `assignUserRole(userId, role)` with permission check
3. `createScopedInvitation(input)` including org/team/dept

## Production Rules

1. Keep dev owner tools disabled on Vercel production.
2. Require real owner session for admin operations.
3. Do not expose role switcher or sample reset UI without `VITE_ENABLE_DEV_OWNER_TOOLS`.
4. Connect email delivery only after Resend approval and domain setup.

## Recommended Next Task

Phase 2 Step 7: Notification foundation review. See `docs/notification-foundation.md`.

## Validation

```bash
npm run build
```
