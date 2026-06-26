# Supabase Audit — Phase 2 Step 1

## Summary

This audit compares the current Supabase schema, generated types, RLS posture, and frontend data access patterns against the Phase 2 foundation plan.

No runtime code was changed as part of this audit. No migrations were created.

Baseline:

- Branch: `main`
- Production base tag: `v0.1.0-production-base`
- Generated types: `src/integrations/supabase/types.ts`
- Migrations: 18 files in `supabase/migrations/`

## 1. Schema Inventory

The generated Supabase types define **52 public tables** and **7 RPC helpers**.

### Core work

| Table | Status | Notes |
| --- | --- | --- |
| `profiles` | Present | User metadata, locale, formats |
| `projects` | Present | Status, priority, health, progress, owner |
| `project_members` | Present | Project membership |
| `tasks` | Present | Status, priority, assignee, due date, position |
| `decisions` | Present | Decision workflow with approvals |
| `decision_approvals` | Present | Approval rows for decisions |
| `activity_logs` | Present | Entity/project activity |
| `relations` | Present | Generic cross-entity links |
| `favorites` | Present | User favorites |
| `recent_items` | Present | Recently viewed items |

### Organization and access

| Table | Status | Notes |
| --- | --- | --- |
| `organizations` | Present | Org records exist in schema |
| `departments` | Present | Nested under organizations |
| `teams` | Present | Team records |
| `team_members` | Present | Team membership |
| `user_roles` | Present | Role assignments per user |
| `permissions` | Present | Permission definitions |
| `role_permissions` | Present | Role-to-permission mapping |
| `user_permissions_overrides` | Present | Per-user overrides |
| `invitations` | Present | Invite flow |
| `audit_logs` | Present | Admin/system audit trail |
| `system_settings` | Present | Global settings |

### Communication

| Table | Status | Notes |
| --- | --- | --- |
| `channels` | Present | Company/project/DM channels |
| `channel_members` | Present | Channel membership |
| `messages` | Present | Channel messages |
| `message_reactions` | Present | Emoji reactions |
| `message_read_receipts` | Present | Read state |
| `saved_messages` | Present | Saved messages |

### Notifications and settings

| Table | Status | Notes |
| --- | --- | --- |
| `notifications` | Present | In-app notifications |
| `user_settings` | Present | Per-user settings |

### Translation domain

| Table | Status | Notes |
| --- | --- | --- |
| `languages` | Present | Language catalog |
| `translations` | Present | Translation records |
| `translation_memory` | Present | TM entries |
| `message_translations` | Present | Message translation links |
| `document_translations` | Present | Document translation links |

### Email admin

| Table | Status | Notes |
| --- | --- | --- |
| `email_templates` | Present | Template storage |
| `email_logs` | Present | Send/log history |

### AI / intelligence preparation

| Table | Status | Notes |
| --- | --- | --- |
| `ai_memories` | Present | Long-term memory records |
| `ai_memory_sources` | Present | Memory provenance |
| `ai_agents` | Present | Agent definitions |
| `ai_agent_runs` | Present | Agent execution runs |
| `ai_workflows` | Present | Workflow definitions |
| `ai_workflow_steps` | Present | Workflow steps |
| `ai_rules` | Present | Rule definitions |
| `ai_questions` | Present | Open questions |
| `ai_actions` | Present | Proposed/executed AI actions |
| `ai_action_approvals` | Present | Approval gate for actions |
| `ai_confidence_logs` | Present | Confidence audit trail |
| `ai_reminders` | Present | Reminder records |
| `assistant_preferences` | Present | Assistant prefs per user |
| `context_graph_nodes` | Present | Context graph |
| `context_graph_edges` | Present | Context graph edges |
| `data_quality_issues` | Present | Data quality tracking |
| `user_privacy_zones` | Present | Privacy zones for AI data |

### RPC helpers

| Function | Purpose |
| --- | --- |
| `has_role` | Role check |
| `has_permission` | Permission check |
| `is_admin` | Admin check |
| `is_super_admin` | Super admin check |
| `is_channel_admin` | Channel admin check |
| `is_channel_member` | Channel membership check |
| `log_audit` | Audit log helper |

## 2. Comparison With Phase 2 Plan

Phase 2 planning document expected these domains:

| Planned domain | Current state | Gap |
| --- | --- | --- |
| `profiles` | Present | None |
| `organizations` | Present | Frontend usage is minimal |
| `organization_members` | Missing as named table | Use `team_members` + `invitations`; clarify model |
| `roles` | Present as enum + `user_roles` | Broader role set than Phase 2 doc |
| `permissions` | Present | Needs RBAC enforcement review |
| `projects` | Present | Used heavily in UI |
| `tasks` | Present | Used heavily in UI |
| `task_comments` | Missing | Comments live in `messages` / not task-scoped yet |
| `task_attachments` | Missing | No file metadata table yet |
| `notifications` | Present | UI partially wired |
| `audit_logs` | Present | Admin UI reads audit logs |
| `app_settings` | Split | `user_settings` + `system_settings` instead |

### Extra domains beyond Phase 2 plan

The schema is richer than the Phase 2 planning doc:

- Full communication stack (`channels`, `messages`, reactions, receipts)
- Decision/approval workflow
- Translation stack
- Email templates/logs
- Large AI/intelligence preparation layer
- Context graph and data quality tooling

This is an asset, not a blocker. Phase 2 should stabilize usage of what already exists before adding more tables.

## 3. Role Model Mismatch

### Database enum `app_role`

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

### Phase 2 planning model

Planned simplified model:

- `super_admin`
- `admin`
- `manager`
- `member`
- `viewer`

### Frontend usage

- `src/lib/admin-queries.ts` uses the full 10-role model
- `src/hooks/use-auth.tsx` checks `is_admin` RPC only
- Dev role switcher exposes 4 practical roles mapped to DB enum values

### Recommendation

Do not migrate roles in Step 1.

Next RBAC task should decide one of:

1. Keep the current 10-role enum and map Phase 2 docs to it
2. Add alias mapping layer in app code (`manager` → `project_manager`, `member` → `employee`, `viewer` → `guest`)
3. Plan a later enum migration only after explicit approval

## 4. RLS Posture

RLS is enabled on core tables. Early migrations use a permissive baseline:

- Many tables allow **any authenticated user** to `SELECT`
- Create/update policies often allow any authenticated user or broad owner/admin checks
- Communication tables have stronger member-scoped policies
- Email admin tables restrict writes to admins

Examples from initial migrations:

- `profiles`: authenticated can view all profiles; users update own profile
- `projects`: authenticated can view/create; owner/admin update/delete
- `tasks`: authenticated can view/create; assignee/owner/admin update
- `channels` / `messages`: member-scoped policies

### Production risk

The current RLS baseline is acceptable for trusted internal/demo use but **not production-safe for multi-tenant isolation**.

Before external launch, RLS must be tightened for:

- Organization/team scoping
- Project membership boundaries
- Admin-only tables
- AI memory and assistant preferences
- Audit and email logs

Do not change RLS in this audit step. Treat tightening as a dedicated migration task after organization scope is finalized.

## 5. Frontend Data Access Patterns

### Primary query layers

| Module | Files | Pattern |
| --- | --- | --- |
| General app data | `src/lib/queries.ts` | Direct Supabase client reads/writes |
| Admin | `src/lib/admin-queries.ts` | Admin stats, users, audit, invitations |
| Communication | `src/lib/comm.ts` | Channels, messages, reactions |
| Wave1 bootstrap | `src/lib/wave1.ts` | Early workspace helpers |
| Relations | `src/lib/relations.ts` | Generic relation graph |
| Intelligence | `src/routes/_authenticated/intelligence.tsx` | AI tables direct access |
| Brain/thinking | `brain.tsx`, `thinking.tsx` | AI memories/rules |
| Projects/tasks | Multiple route files | CRUD via Supabase client |
| Voice/quick create | `voice-command-center.tsx`, `quick-create.tsx` | Direct inserts |

### Server-side protected operations

Server functions using `requireSupabaseAuth`:

- Advisor/translate/project-advisor stubs
- Dev tools (`setSelfRole`, `resetDemoData`, `seedDemoData`)

Server functions using service role + env gate:

- `devOwnerMagicLink`

### Type safety gaps

Roughly 30 files still use `as any` for Supabase access, especially in:

- `admin-queries.ts`
- `brain.tsx`
- `teams.tsx`
- `relations.ts`
- `routeTree.gen.ts` (generated)

Generated types cover most tables, but runtime code bypasses them in admin and intelligence areas.

## 6. Auth Integration State

Current auth behavior (updated since earlier audit doc):

- `/_authenticated` redirects to `/auth` when no Supabase session
- Founder mode bypass exists for local/dev only
- Server functions still require Bearer tokens via `requireSupabaseAuth`
- `is_admin` RPC drives client admin flag; `super_admin` should be verified via `is_super_admin` in a later task

Founder mode uses a synthetic user object and does **not** create a real Supabase session. Database writes under founder mode may fail depending on RLS and missing bearer tokens.

## 7. Missing or Underused Domains

### Missing tables relative to product needs

| Need | Gap |
| --- | --- |
| Task comments | No `task_comments`; messages are channel-based |
| File attachments | No attachment metadata table |
| Organization membership | No explicit `organization_members`; teams/departments partially cover this |
| Milestones | No dedicated milestone table |

### Present but underused in UI

| Table | Observation |
| --- | --- |
| `organizations` | Schema exists; limited frontend wiring |
| `departments` | Used in teams admin only |
| `invitations` | Admin UI exists |
| `notifications` | Partial UI coverage |
| `audit_logs` | Admin dashboard reads recent rows |
| AI tables | Intelligence/brain screens exist; no external AI provider connected |

## 8. Naming and Duplication Notes

Potential conceptual overlap to resolve in Phase 2:

| Concept A | Concept B | Notes |
| --- | --- | --- |
| `teams` | `departments` | Both exist; clarify hierarchy |
| `organizations` | `projects` | Projects may need org_id enforcement |
| `user_settings` | `system_settings` | Split replaces planned `app_settings` |
| `messages` | planned `task_comments` | Decide whether tasks get dedicated comments or channel linkage |
| `activity_logs` | `audit_logs` | User/project activity vs admin/security audit |

## 9. Access Pattern Recommendations

For Phase 2 implementation order:

1. **Document organization scope decision** before RLS tightening
2. **Stabilize auth/session** — real Supabase session for production owner access
3. **Align role model** — map 10 DB roles to product language
4. **Harden project/task writes** — consistent creator/owner/assignee rules
5. **Reduce `as any`** in admin and intelligence modules using generated types
6. **Defer new tables** until comment/attachment requirements are confirmed

## 10. Migration Policy For Phase 2

Do not create migrations until all of the following are true:

- Organization ownership model is chosen
- Role model decision is recorded
- RLS target policy is written per table group
- Frontend access paths are identified for each domain

Approved migration candidates later (not now):

- `task_comments` or task-linked message bridge
- `file_attachments` metadata
- `organization_members` if teams model is insufficient
- RLS hardening pass per organization/project scope

## 11. Validation Performed For This Audit

- Reviewed `src/integrations/supabase/types.ts`
- Reviewed all files in `supabase/migrations/`
- Searched frontend `.from("...")` usage across `src/`
- Compared against `docs/phase-2-development-plan.md`
- Compared against `docs/auth-supabase-owner-audit.md`

## 12. Recommended Next Task

Phase 2 Step 2: Auth and profile stabilization.

Focus:

- Confirm production auth policy (no founder bypass outside local/dev)
- Wire `is_super_admin` into client admin checks
- Ensure profile bootstrap runs on every real sign-in
- Document organization/project ownership assumptions before RBAC expansion
