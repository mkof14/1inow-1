# Supabase Reality Audit

Date: 2026-06-21  
Branch: `main`  
Scope: documentation-only audit for Phase 2 planning.

## Summary

The project already has a broad Supabase foundation: authentication, profiles,
roles, projects, tasks, communications, notifications, admin tables, audit logs,
settings, translations, and a large future AI/intelligence data layer.

The codebase is not a blank prototype. Several app areas already read and write
real Supabase data. At the same time, some screens are still presentation-heavy
or planning/demo-oriented, and the AI execution layer is intentionally disabled.

The main production gap is not table coverage. The main gap is hardening:
authorization boundaries, organization scoping, founder bootstrap verification,
and separating current usable data flows from future AI/product ambitions.

## Current Supabase Tables And Domains

Current generated Supabase types include these active table domains:

- Identity and access: `profiles`, `user_roles`, `permissions`,
  `role_permissions`, `user_permissions_overrides`.
- Organization model: `organizations`, `departments`, `teams`,
  `team_members`, `invitations`.
- Project/task work: `projects`, `project_members`, `tasks`,
  `activity_logs`.
- Communication: `channels`, `channel_members`, `messages`,
  `message_reactions`, `message_read_receipts`, `saved_messages`.
- Decisions and approvals: `decisions`, `decision_approvals`.
- Personal productivity: `favorites`, `recent_items`, `relations`,
  `notifications`, `user_settings`.
- Internationalization: `languages`, `translations`, `translation_memory`,
  `document_translations`, `message_translations`.
- Admin and operations: `audit_logs`, `system_settings`, `email_templates`,
  `email_logs`.
- Future intelligence layer: `ai_memories`, `ai_memory_sources`, `ai_agents`,
  `ai_agent_runs`, `ai_workflows`, `ai_workflow_steps`, `ai_rules`,
  `ai_questions`, `ai_actions`, `ai_action_approvals`,
  `ai_confidence_logs`, `ai_reminders`, `assistant_preferences`,
  `data_quality_issues`, `user_privacy_zones`, `context_graph_nodes`,
  `context_graph_edges`.

## Current RLS And Security Model

RLS is enabled broadly across the schema.

The core model currently combines:

- User ownership checks through `auth.uid()`.
- Global role checks through `public.has_role`.
- Admin checks through `public.is_admin`.
- Super-admin checks through `public.is_super_admin`.
- Permission checks through `public.has_permission`.
- Service-role-only server paths for controlled owner/dev bootstrap tooling.

Current role values include:

- `super_admin`
- `admin`
- `manager`
- `analyst`
- `employee`
- `viewer`

Important security observations:

- `profiles` are selectable by any authenticated user.
- `user_roles` are selectable by any authenticated user, while role changes are
  admin-gated.
- `projects` and `tasks` currently have broad authenticated read policies.
- Some updates/deletes are owner, creator, assignee, or admin scoped.
- Admin tables such as permissions, invitations, settings, email templates, and
  audit logs use admin or permission-based policies.
- AI/intelligence personal tables are mostly user-owned and scoped to the
  current user.

For a single-founder/internal baseline this can work. For multi-organization
production, broad authenticated read policies must be narrowed before inviting
external users or additional organizations.

## Current Auth, Profile, And Role Flow

Current implemented flow:

- Authenticated app routes are protected under `_authenticated`.
- Unauthenticated users are redirected to `/auth`.
- `/auth` supports email/password sign-in.
- Open self-sign-up is not exposed in the UI.
- Google auth is feature-flagged by `VITE_ENABLE_GOOGLE_AUTH`.
- Founder dev mode is local-only and requires:
  - `import.meta.env.DEV`
  - `VITE_ENABLE_FOUNDER_MODE=true`
- Dev owner tools are server-gated by `ENABLE_DEV_OWNER_TOOLS=true`.
- Server owner tooling uses `FOUNDER_EMAIL`, currently expected to be
  `dnainform@gmail.com`.
- The authenticated profile bootstrap creates a missing `profiles` row for the
  current user and syncs the email when needed.
- The database trigger `handle_new_user` creates a profile and assigns the
  first user `super_admin`; later users receive the default employee role.
- The frontend `isAdmin` check uses the Supabase `is_admin` RPC, which treats
  `super_admin` as admin-equivalent.

Production requirement: verify in the real Supabase project that
`dnainform@gmail.com` exists, has a `profiles` row, and has the expected
`super_admin` role. Do not rely only on the "first user becomes super_admin"
trigger once production data exists.

## App Areas Using Real Data

These areas currently use Supabase data directly or through query helpers:

- Dashboard: projects, tasks, profiles, notifications.
- Projects: project list, project creation, archive actions, project details.
- Project detail: task creation, task updates, task deletion.
- Tasks: task status and task updates.
- Quick create: task and project inserts.
- Profile: profile row read/write.
- Settings: profile/user preference updates.
- Administration: permissions, role permissions, profiles, roles,
  invitations, audit logs, system settings, email templates, email logs.
- Communication: channels, members, messages, reactions, saved messages,
  pinned/deleted/edited messages, task creation from messages.
- Command bar: searches tasks and messages.
- Intelligence: reads/writes AI memory, agent, workflow, rule, question,
  action, confidence, reminder, privacy, and assistant preference tables.
- People/team areas: profiles, teams, team membership, and related views.
- Approvals/decisions: decision and approval-related tables.
- Favorites/recent items/relations: personal productivity tables.

## App Areas That Are Mostly Static, Demo, Or Planning-Oriented

These areas should be reviewed before treating them as production-complete:

- AI assistant UI: present in the app shell, but `/api/chat` returns a disabled
  placeholder response.
- Voice administration: frontend exists, but `/api/stt` and `/api/tts` return
  `501 Not Implemented`.
- Advisor and project advisor server functions: authenticated, input-validated,
  but currently return "AI service is not connected yet."
- Translation and rewrite server functions: authenticated, input-validated, but
  currently return disabled placeholder responses.
- Intelligence screen: real database tables exist, but there is no external
  model execution, autonomous agent runtime, or production model router.
- Static content routes such as principles/help/strategy-style pages should be
  treated as product content, not proof of completed backend flows.
- Files/documents/calendar/reporting/portfolio-style areas need separate review
  before being marked production-grade.

## Missing Production-Critical Tables Or Policies

The schema is broad, so the missing work is mostly policy and product-contract
clarity rather than raw table creation.

Before production multi-user use:

- Add or tighten organization-scoped read policies for projects, tasks,
  profiles, teams, communications, decisions, and admin views.
- Define whether `projects` and `tasks` belong to one personal workspace, one
  organization, or multiple organizations.
- Ensure every table that can contain private personal data is scoped by
  `user_id`, `organization_id`, membership, or explicit permission.
- Add clear invite/onboarding flow policies before allowing non-founder users.
- Add audit logging to critical mutations that are not already covered.
- Decide whether `user_roles` should remain readable by all authenticated users.
- Review whether broad `profiles` visibility is acceptable.
- Add production-safe file/attachment storage policies before enabling uploads.
- Verify email-related tables are data-only until an email provider is approved.
- Treat AI tables as configuration/state only until model execution is approved.

Potential future tables, if product requirements confirm them:

- `task_comments` as a first-class domain if comments should be separate from
  activity logs/messages.
- `task_attachments` or storage metadata if files need task-level ownership and
  policy control.
- `calendar_events` if calendar becomes more than a task due-date view.
- `personal_areas` or `life_domains` if the product needs non-work categories
  such as health, family, finance, home, learning, and travel.
- `daily_plans`, `reviews`, or `signals` if the assistant needs structured
  daily planning and proactive guidance.

Do not create these tables until the next schema task defines exact behavior.

## Data Risks

Current data risks to resolve before wider production use:

- Broad authenticated read access can expose workspace data between users.
- Organization boundaries are present but not yet consistently enforced across
  every core table and query path.
- The owner/super-admin bootstrap is fragile if production already has users.
- Direct client writes are acceptable only if RLS is treated as the real
  security boundary and is thoroughly tested.
- Admin UI visibility and admin RLS are not the same thing; policies must
  enforce every privileged operation.
- AI/intelligence tables can create a false sense of "AI is ready"; currently
  they store state/configuration but do not execute production AI.
- Stubs must stay explicit until OpenAI, Anthropic, Gemini, or any internal AI
  gateway is approved.
- `src/lib/api/example.functions.ts` appears to be sample/dead code and should
  be reviewed in a cleanup-only task.

## Recommended Next Implementation Order

1. Production Supabase verification:
   - Confirm the real project URL and anon key are correct.
   - Confirm `dnainform@gmail.com` can sign in.
   - Confirm the user has `profiles` and `user_roles` rows.
   - Confirm the user has `super_admin`.

2. RLS hardening audit:
   - Write a table-by-table policy matrix.
   - Mark each table as personal, organization-scoped, admin-only, or public
     authenticated.
   - Decide which current broad read policies must be narrowed.

3. Founder/admin access stabilization:
   - Add explicit production owner verification steps.
   - Keep local founder mode disabled outside development.
   - Keep dev owner tools disabled unless a one-time maintenance task requires
     them.

4. Core data contract:
   - Define the exact required fields and lifecycle for projects, tasks,
     subtasks, comments, attachments, notifications, and audit logs.
   - Do not expand UI until the contract is clear.

5. Task/project engine:
   - Stabilize statuses, priorities, assignment, due dates, activity logs, and
     relationships.
   - Add comments and attachments only after ownership/storage policies are
     clear.

6. Personal operating system layer:
   - Define personal domains/life areas.
   - Define daily/weekly planning records.
   - Define assistant-readable context rules before adding AI execution.

7. AI gateway planning:
   - Keep existing AI routes stubbed.
   - Design provider-agnostic internal API contracts.
   - Define audit logs, user permissions, privacy zones, and cost controls
     before connecting OpenAI, Anthropic, Gemini, or another paid service.

8. Production integrations:
   - Add Resend, Stripe, analytics, monitoring, and AI providers only through
     separate approved tasks.

## Validation

- `npm run build`: passed on 2026-06-21.
