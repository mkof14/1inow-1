# Advanced Features — Phased Plan

40 feature areas is roughly 6–10 full sprints of work for a real team. To keep Digital Invest OS shippable at every step (no half-broken modules), I'll deliver in 4 waves. Each wave is independently usable, has real DB + RLS + working CRUD, and ends with the app in a stable state.

You can approve the full plan, or tell me to start with Wave 1 only and re-decide later.

## Wave 1 — Personal productivity layer (real, end-to-end)
The features users touch every day. All backed by real tables, RLS, and working UI.

- **Favorites** (#1) — `favorites` table (polymorphic: entity_type + entity_id), star buttons on projects/tasks/docs/channels, "Favorites" group in sidebar.
- **Recent items** (#2) — `recent_items` table, auto-logged on open, shown in sidebar + Cmd+K.
- **My Work** (#3) — single page with tabs: Assigned, Created, Today, This Week, Overdue, Blocked, Completed. Pure queries over existing `tasks` table.
- **Inbox** (#4) — `notifications` table (type, actor, target, read_at, resolved_at), Inbox page with mark read/unread/resolve, unread badge in sidebar.
- **Universal Quick Create** (#14) — floating + button → dialog with task/project/doc/note/meeting tabs.
- **Keyboard shortcuts** (#15) — Cmd+K, C, P, /, G→D, G→T, G→P.
- **Task detail side panel** (#25) — replaces full-page navigation; description, comments stub, activity, dependencies tab.
- **Personal settings** (#13) — `user_settings` table; language, timezone, theme, working hours, default view.
- **Empty / loading / error states** (#35–37) — shared `<EmptyState>`, skeleton loaders, error boundaries across all existing pages.

## Wave 2 — Collaboration & data model depth
- **Mentions** (#26) — @user parsing in comments, generates notifications.
- **Comments + Activity history** (#31) — `comments` and `activity_logs` (extend existing), shown on every entity.
- **Presence** (#27) — Realtime presence channel, dots on avatars.
- **Status updates / Daily standup** (#28, #29) — `status_updates` table, daily form, project feed.
- **Dependencies** (#11) — `task_dependencies` (blocks/waits_on/related/duplicate), warning badges.
- **Recurring tasks** (#10) — `recurrence_rule` on tasks + pg_cron job to materialize next instance.
- **Custom fields** (#9) — `custom_fields` + `custom_field_values` tables, admin UI, render in task/project detail.
- **Saved views + Advanced filters + Bulk actions** (#5, #6, #7) — `saved_views` table; filter bar component reused across Tasks/Projects/People; bulk select toolbar.
- **Templates** (#8) — `templates` table for projects/tasks/docs, "Create from template" in Quick Create.
- **Trash bin** (#32) — soft-delete (`deleted_at`) on all major tables + Trash page with restore.
- **Audit history UI** (#31) — extend `activity_logs`, history drawer on each entity.

## Wave 3 — Planning & visualization
- **Advanced calendar** (#16) — month/week/day/agenda views over tasks+meetings+milestones.
- **Gantt chart** (#17) — timeline with dependencies, drag-to-reschedule.
- **Workload view** (#18) — team capacity heatmap.
- **Kanban improvements** (#24) — DnD, swimlanes, WIP limits, collapsed columns.
- **Project health score** (#19) — computed view from deadline/overdue/blocked/activity.
- **Roadmaps** (#20) — quarter/year timeline by project/department.
- **Goals / OKRs** (#21) — `goals` + `key_results` + linked tasks.
- **Notes** (#22) — `notes` table, personal/project/meeting scopes, convert-to-task.
- **Whiteboard placeholder** (#23) — `whiteboards` table, basic card/arrow canvas (react-flow), marked beta.

## Wave 4 — Automation, admin & onboarding
- **Automations** (#12) — `automations` table (trigger JSON, action JSON), simple WHEN/THEN builder, runner via pg trigger or server fn.
- **Weekly executive summary** (#30) — generated page from existing data + AI summary.
- **Permissions matrix UI** (#38) — admin page rendering roles × permissions, edits write to a `role_permissions` table.
- **Invite system** (#39) — `invitations` table, email via Lovable AI / resend, pre-assigned role + project access.
- **Onboarding wizard** (#40) — first-login multi-step: org → invite → first project → first task → layout pick.
- **Import / Export** (#33) — CSV import for tasks/contacts; CSV export for tasks/projects/reports.
- **Mobile responsiveness pass** (#34) — audit sidebar→drawer, tables→cards, side panels→sheets across the app.

## What this plan does NOT do
- It does not pretend any of these are "one-shot" features. Automations, Gantt drag-reschedule, recurring-task materialization, and the permissions matrix are each non-trivial — they get real DB + working baseline UI, with clearly marked "advanced editor coming soon" where the full UX would take another wave.
- No mock data masquerading as real. Anything not wired to the DB will be labeled "Preview".

## Technical notes
- New tables follow the existing pattern: `id`, `created_at`, `updated_at`, RLS on, explicit GRANTs, policies scoped via `has_role()` / `auth.uid()`.
- Polymorphic tables (`favorites`, `recent_items`, `notifications`, `comments`, `activity_logs`) use `(entity_type text, entity_id uuid)` with a check constraint on allowed types.
- Realtime enabled for `notifications`, `comments`, presence.
- All new pages live under `src/routes/_authenticated/` and appear in the existing sidebar groups.
- Task detail side panel = global `<Sheet>` controlled by a Zustand store + URL search param (`?task=<id>`) so it's deep-linkable without route change.

## Recommended next step
Approve the plan and I'll start Wave 1 immediately. Wave 1 alone is ~6–8 migrations and ~20 new files but leaves the app in a much more "real SaaS" state. Tell me if you'd rather:
- **(a)** Ship Wave 1 now, then we re-scope 2–4 after you try it.
- **(b)** Ship all 4 waves back-to-back (will take many turns; each wave ends in a stable state).
- **(c)** Re-prioritize — name the 5–10 features you most want first and I'll collapse the plan around them.
