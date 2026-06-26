# RBAC Model — Phase 2 Step 4

## Summary

This document defines the current role and permission model and how the app should use it during Phase 2 foundation work.

No Supabase migrations were created. No UI was changed.

## Role Layers

1inow currently uses **three overlapping layers**:

| Layer | Source | Used for |
| --- | --- | --- |
| App roles | `user_roles.role` (`app_role` enum) | Broad access class |
| Permission keys | `permissions` + `role_permissions` | Feature-level checks |
| RPC helpers | `is_admin`, `is_super_admin`, `has_role`, `has_permission` | RLS and client/server checks |

## Database Roles (`app_role`)

Current enum values:

- `super_admin`
- `admin`
- `ceo`
- `project_manager`
- `team_lead`
- `employee`
- `contractor`
- `client`
- `investor`
- `guest`

Phase 2 planning doc proposed a simplified set (`super_admin`, `admin`, `manager`, `member`, `viewer`).

**Decision:** keep the database enum unchanged in Phase 2. Map product language to DB roles in documentation and UI labels only.

Suggested product mapping:

| Product label | DB role |
| --- | --- |
| Super Admin | `super_admin` |
| Admin | `admin` |
| Executive | `ceo` |
| Manager | `project_manager` |
| Team Lead | `team_lead` |
| Member | `employee` |
| Contractor | `contractor` |
| Client | `client` |
| Investor | `investor` |
| Guest | `guest` |

## Permission Model

Permissions are string keys stored in `permissions` and assigned through `role_permissions`.

Examples:

- `invite_users`
- `create_projects`
- `assign_tasks`
- `view_audit_logs`
- `manage_settings`
- `use_assistant`

### Super admin bypass

`has_permission()` returns `true` for all keys when the user has `super_admin` in `user_roles`, even without explicit `role_permissions` rows.

### Admin role seed

`admin` receives all permission keys via migration seed.

### Other roles

`ceo`, `project_manager`, `team_lead`, `employee`, `contractor`, `client`, and `investor` receive curated subsets in migration seed data.

## Client vs Server Checks

### Current client checks

| Check | Location | Notes |
| --- | --- | --- |
| `is_admin` RPC | `use-auth.tsx`, admin route guard | Includes `super_admin` |
| `is_super_admin` RPC | `use-auth.tsx` | Exposed but rarely used in UI |
| Admin nav visibility | `app-shell.tsx` | Uses `isAdmin` from auth context |
| Admin route access | `administration.tsx` beforeLoad | Requires real session + `is_admin` |

### Current server checks

| Check | Location |
| --- | --- |
| Bearer session | `requireSupabaseAuth` middleware |
| Owner-only dev tools | `dev-tools.functions.ts` |
| RLS `has_permission()` | invitations, audit logs, system settings, role permissions |

### Gap

Most UI actions still rely on `isAdmin` or no check at all. Fine-grained permission keys exist in the database but are not used consistently in frontend route guards or mutations.

## Recommended Check Strategy

| Action type | Required check |
| --- | --- |
| Enter admin area | Real session + `is_admin` |
| Super-admin-only system actions | `is_super_admin` |
| Invite users | `has_permission('invite_users')` |
| Manage roles/permissions | `has_permission('manage_roles')` / `manage_permissions` |
| Create project | `has_permission('create_projects')` or project owner rules |
| Create task | `has_permission('create_tasks')` or assignee rules |
| Use assistant/voice | `has_permission('use_assistant')` / `use_voice` |

## Founder Mode and RBAC

Founder mode no longer grants synthetic admin privileges after Step 2 auth stabilization.

Local UI preview can use founder mode for non-admin pages. Admin and permission-gated server functions require a real Supabase session and matching role/permission rows.

## Overrides

`user_permissions_overrides` allows per-user grant/deny of a permission key.

This is useful for exceptions but should not replace role assignment as the primary model.

## RLS vs Application RBAC

RLS currently mixes:

- broad authenticated access on core work tables
- `has_permission()` on admin-ish tables
- `is_admin()` on org/team/department writes

Before production:

1. Decide org-scoped RLS boundaries
2. Align UI permission checks with the same keys used in RLS
3. Avoid duplicating conflicting rules in app code and SQL

## Code Added In This Step

Extended `src/lib/auth-roles.ts` with:

- `resolveUserPermission()`
- `requirePermissionSession()`

These are foundation helpers for future route and mutation guards.

## Recommended Next Task

Phase 2 Step 5: Project and task engine stabilization — completed. See `docs/project-task-engine.md`.

Next: Phase 2 Step 6 — Admin foundation review.

## Validation

```bash
npm run build
```
