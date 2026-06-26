# RLS Policy Matrix

Post–org-scoping baseline after migrations through `20260626170000_communication_decisions_org_scoping.sql`.

Legend:

- **Org** — scoped by `profiles.organization_id` / `current_organization_id()`
- **Personal** — user owns the row (`user_id`, `created_by`, etc.)
- **Permission** — gated by `has_permission()` or admin RPCs
- **Global** — all authenticated users (review candidate)
- **Open read** — broad SELECT; writes still restricted

## Organization domain

| Table | Scope | SELECT | INSERT | UPDATE | DELETE | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `organizations` | Org + super admin | Org member or super admin | Super admin | Admin in org or super admin | Super admin | |
| `profiles` | Org | Self, same org, super admin | Own profile | Own profile | — | Org-scoped SELECT |
| `departments` | Org | Same org or super admin | Org member (non-null org) | Admin legacy + org insert | Admin | Writes partially org-aware |
| `teams` | Org | Same org or super admin | Org member | Admin legacy + org insert | Admin | |
| `team_members` | Org | Team in same org | Admin + invite accept RPC | Admin | Admin | Accept via SECURITY DEFINER |
| `invitations` | Org + permission | `invite_users`, inviter, org admin | `invite_users` + org match | `invite_users` + org | `invite_users` + org | Preview/accept via RPC |

## Work domain

| Table | Scope | SELECT | INSERT | UPDATE | DELETE | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `projects` | Org + membership | Org, owner, creator, member | Creator + org match | Owner/admin policies | Owner/admin | `organization_id` required in app writes |
| `tasks` | Org + assignment | Org project path, assignee, creator | Authenticated create | Assignee/owner/admin | Assignee/owner/admin | Orphan tasks scoped via creator org |
| `project_members` | Project | Project access | Project admin | Project admin | Project admin | Inherited via project |
| `decisions` | Org | Same org or project path | Requester + org match | Same org | Requester/admin in org | `organization_id` on writes |
| `notifications` | Personal | Own rows | Self or admin | Own rows | Own rows | User-scoped |
| `activity_logs` | Org | Same org | Self + org match | — | — | `organization_id` on writes |
| `relations` | Org | Same org | Creator + org match | Creator/admin in org | Creator/admin in org | Mirror copies org |

## Admin / RBAC

| Table | Scope | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- | --- |
| `permissions` | Global catalog | All authenticated | — | — | — |
| `role_permissions` | Global catalog | All authenticated | `manage_permissions` | — | `manage_permissions` |
| `user_roles` | Global | All authenticated | Admin policy | Admin policy | Admin policy |
| `user_permissions_overrides` | Personal/admin | Self or admin | `manage_permissions` | `manage_permissions` | `manage_permissions` |
| `audit_logs` | Org + permission | `view_audit_logs` | Actor = self | — | — |
| `system_settings` | Global | All authenticated | `manage_settings` | `manage_settings` | `manage_settings` |

## Communication

| Table | Scope | SELECT | INSERT | UPDATE | DELETE | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `channels` | Org + member | Member in org | Creator + org match | Admin in org | Admin in org | Company channels org-scoped |
| `messages` | Channel | Channel member in org | Channel member | Author/admin | Author/admin | Via `is_channel_member` |

## Remaining gaps (next RLS pass)

1. **`user_roles` SELECT** — visible to all authenticated; acceptable for admin UI but noisy for multi-tenant.
2. **AI / translation tables** — mostly catalog or authenticated-wide; no org boundary yet.
3. **Cross-org project membership** — project_members can still grant access without org check on membership table itself.

## Validation

After applying org migrations:

```bash
./scripts/verify-production-supabase.sh
npm run smoke
```
