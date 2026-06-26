# Organization and Team Model — Phase 2 Step 3

## Summary

This document defines the canonical workspace hierarchy for 1inow and records how the current schema and frontend align with it.

No Supabase migrations were created. No UI was changed.

## Canonical Model

1inow should treat the workspace as a four-level hierarchy:

```text
Organization
  └── Department (optional)
        └── Team (optional)
              └── Team members (users)
```

Parallel scopes:

| Scope | Primary table | Purpose |
| --- | --- | --- |
| Organization membership | `profiles.organization_id` | Which workspace a user belongs to |
| Department placement | `profiles.department_id` | User's department within the org |
| Team membership | `team_members` | Operational groups inside a team record |
| Project access | `project_members` | Work container access, independent of teams |

**Decision:** `profiles.organization_id` is the canonical organization membership field. A separate `organization_members` table is not required unless multi-org membership becomes a product requirement.

**Decision:** `project_members` remains the canonical project access model. Team membership does not automatically grant project access.

## Schema State

### Present and typed

| Table | Key fields | Relationships |
| --- | --- | --- |
| `organizations` | `name`, `slug`, `settings`, `created_by` | Root workspace |
| `departments` | `organization_id`, `name` | Belongs to organization |
| `teams` | `organization_id`, `department_id`, `name` | Belongs to org, optionally department |
| `team_members` | `team_id`, `user_id`, `role` | User membership in a team |
| `profiles` | `organization_id`, `department_id` | User workspace placement |
| `invitations` | `organization_id`, `team_id`, `department_id`, `role` | Onboarding with scope |

### Missing relative to product needs

| Need | Gap |
| --- | --- |
| Project org scope | `projects` has no `organization_id` column |
| Org bootstrap | No default organization creation on first sign-up |
| Team member UI | Teams page lists teams but does not add `team_members` |
| Organizations UI | No frontend route reads or writes `organizations` |

## RLS Posture

| Domain | Current policy | Production risk |
| --- | --- | --- |
| `organizations` | Select scoped to user's `profiles.organization_id` or super admin | Good direction |
| `departments` | Select: all authenticated; writes: admin only | Too open for multi-tenant |
| `teams` | Select: all authenticated; writes: admin only | Too open for multi-tenant |
| `team_members` | Select: all authenticated; writes: admin only | Too open for multi-tenant |
| `projects` | Select/create: all authenticated | Not org-scoped |
| `profiles` | Select: all authenticated | Not org-scoped |

RLS tightening should happen after organization scoping is wired through profile bootstrap and project creation.

## Frontend Usage Today

| Surface | Org/team behavior |
| --- | --- |
| `/teams` | Creates teams/departments without `organization_id` |
| `/people` | Lists all profiles globally; uses legacy text field `department` in search |
| `/team-map` | Lists all profiles globally |
| `/administration/invitations` | Creates invitations without org/team/department scope |
| Profile bootstrap | Creates profile without `organization_id` |
| Project/task CRUD | User-scoped via `created_by` / `owner_id` only |

**Gap:** schema supports org hierarchy, but runtime behavior is still global/user-scoped.

## Profile-to-Organization Relationship

Target lifecycle:

1. User signs in with Supabase auth.
2. `ensureCurrentProfile()` creates or updates `profiles`.
3. If user has no `organization_id`, attach to workspace default org (future bootstrap task).
4. Invitations set `organization_id`, `team_id`, and `department_id` on acceptance (future task).

Current state stops at step 2 without organization attachment.

## Project Ownership Scope

Current project model:

- `owner_id` — project owner
- `created_by` — creator
- `project_members` — explicit collaborators

Missing:

- Organization-level project visibility
- Team-to-project assignment
- Org admin project governance boundary

**Decision for Phase 2:** keep project ownership user-centric until organization bootstrap exists. Do not add `organization_id` to projects without an approved migration task.

## Duplication and Naming

| Overlap | Resolution |
| --- | --- |
| `profiles.department` (text) vs `profiles.department_id` (uuid) | Prefer `department_id`; migrate away from free-text later |
| `team_members` vs `project_members` | Keep both; different scopes |
| `people` vs `teams` vs `team-map` | People = directory; teams = structure; team-map = geo/status view |

## Implementation Boundaries

Do not change yet:

- Supabase schema
- UI layouts or copy
- RLS policies

Approved next implementation tasks (separate commits):

1. **Organization bootstrap** — create or resolve default org on profile creation (migration + server fn may be required).
2. **Scoped team creation** — pass `organization_id` from current profile when creating teams/departments.
3. **Invitation scope** — include org/team/department in `createInvitation`.
4. **Project org link** — add `organization_id` to `projects` only after org bootstrap is live.

## Code Added In This Step

`src/lib/organization-model.ts` provides read helpers for profile workspace scope and organization lookup. These are foundation utilities only; no UI calls them yet.

## Recommended Next Task

Phase 2 Step 4: Permissions and RBAC review — completed. See `docs/rbac-model.md`.

Next: Phase 2 Step 5 — Project and task engine stabilization.

## Validation

```bash
npm run build
```
