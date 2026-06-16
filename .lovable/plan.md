# Communication & Collaboration Center — Phased Plan

This request is a full collaboration platform (~17 sub-systems). To keep the app stable, I'll deliver in 3 communication waves (C1–C3) that bolt onto the Wave 1 work already shipped. Each ends with a working, demoable system.

## C1 — Communication Foundations (real, end-to-end)

The skeleton everything else hangs off. All backed by real DB + RLS + working UI.

**Database (one migration):**
- `channels` (name, slug, type: dm/project/company/private/group, project_id?, created_by, archived_at)
- `channel_members` (channel_id, user_id, role: owner/admin/member, last_read_at)
- `messages` (channel_id, author_id, body, message_type: normal/update/decision/action_item/question/blocker/approval/announcement/file_share/meeting_note, thread_root_id?, edited_at, deleted_at, pinned_at, metadata jsonb)
- `message_reactions` (message_id, user_id, emoji)
- `message_read_receipts` (message_id, user_id, read_at)
- `saved_messages` (user_id, message_id)
- All with explicit GRANTs, RLS scoped to channel membership via SECURITY DEFINER `is_channel_member()` to avoid recursion.
- Add `messages` & `message_reactions` to `supabase_realtime` publication.

**UI:**
- `/communication` page replaces the stub: 3-pane layout (channel list | message stream | thread side panel).
- Channel list grouped by: Pinned, Direct messages, Project channels, Company, Private. New channel button.
- Message stream with: message types color-coded by left border, author avatar+presence, timestamp, reactions, hover toolbar (reply, react, pin, save, copy link, more).
- "More" menu: edit, delete, mark unread, convert to task / decision / action item / meeting note, assign to user, set deadline.
- Composer with message-type selector (dropdown), Cmd+Enter to send.
- Threads open in right side panel (nested replies, participants, resolved/unresolved toggle, linked task/project pills).
- Realtime subscription for new messages and reactions, scoped to active channel.

**What this does NOT do yet:** decisions/action-items as standalone modules, announcements with acknowledgments, check-ins, analytics, AI. Those come in C2/C3.

## C2 — Structured Communication Outputs

Turn messages into accountable artifacts. Convert actions from C1 now write to real tables.

- **Decisions module** (`/decisions`): `decisions` table (title, description, project_id, owner_id, status: proposed/approved/rejected/reversed/archived, impact_level, review_date, source_message_id, linked_task_ids[], linked_doc_ids[]). List view + detail panel. "Convert to decision" from message context menu pre-fills + links source.
- **Action Items module** (`/action-items`): `action_items` table (title, description, owner_id, deadline, priority, project_id, source_message_id, related_task_id, status). Personal "assigned to me" view + project view.
- **Blockers** (`/blockers`): `blockers` table (raised_by, project_id, task_id?, description, severity, resolved_at, resolver_id). Mark-as-blocker on any message escalates: creates blocker row + notifies project manager. Surfaced on dashboard.
- **Announcements** (`/announcements`): `announcements` table (title, body, target jsonb {all_company|project_ids|team_ids|role}, requires_ack, pinned, created_by). `announcement_reads` (announcement_id, user_id, read_at, acknowledged_at). Banner on dashboard for un-acknowledged required-ack announcements. Admin view shows ack matrix.
- **Saved & Pinned**: dedicated `/saved` page (reuses `saved_messages`); pinned-per-channel pane.
- **Smart Inbox tabs** extended: All / Mentions / Assignments / Approvals / Decisions / Blockers / Deadlines / Messages / Unread / Archived. Reuses existing `notifications` table, filtered by `type`.
- **Mentions** (#26 from previous plan rolls in here): `@user` autocomplete in composer; on send, parse mentions → write notifications.
- **Project Communication Hub**: each project's detail page gets tabs — Chat, Updates, Decisions, Blockers, Questions, Files, Meeting Notes, Announcements, Action Items — filtered to that project.

## C3 — Remote Team Operations, Permissions, AI

- **Presence** (Realtime presence channel): online/offline/away/busy/in-meeting state, surfaced as dot on every avatar + Remote Team page.
- **User profile extensions**: timezone (already in user_settings), country, working_hours, out_of_office boolean+range, current_status text. Profile page shows local time, workload (count of open tasks), last active.
- **Daily Check-Ins** (`/check-ins`): `check_ins` table (user_id, date, yesterday, today, blockers, help_needed, availability). One-per-user-per-day. Project dashboard shows today's check-ins for project members.
- **Weekly Updates** (`/weekly-updates`): `weekly_updates` table (user_id OR project_id, week_start, completed, in_progress, blockers, risks, next_priorities, manager_comments).
- **Read receipts & Acknowledgments**: receipts already in C1; acknowledgments table for critical messages with "must acknowledge" flag → reminder notification if not acked in 24h (pg_cron).
- **Communication Analytics** (`/analytics/communication`): SQL views for unanswered questions, unresolved threads, open blockers, decisions made, pending acks, inactive projects (no message in 14d).
- **Notification preferences** (`communication_preferences` table): per-project / per-channel / mention-type / quiet-hours overrides on top of existing `user_settings.notifications`.
- **Permissions matrix** for communication: who can create/delete channels, post announcements, invite users, see executive/investor channels, export messages. Backed by `role_permissions` table (also serves the broader permissions matrix from earlier plan).
- **Voice / Video / Loom placeholders**: clean attachment-type UI in composer + message renderer, with "Coming soon" tooltip — no backend.
- **AI Communication Assistant** (`/communication/ai`): server function `summarizeChannel`, `summarizeUnread`, `extractDecisions`, `extractActionItems`, `detectBlockers`, `weeklyReport`, `translate`, `improve`, `replyDraft`. Uses Lovable AI (google/gemini-3-flash-preview) via TanStack server functions. Hooked into channel header ("Summarize"), inbox header ("Summarize unread"), composer ("Improve / Translate / Draft reply"), and a weekly cron report.
- **Search across messages**: `/search?type=message` with filters person, project, channel, date, type, attachment, decision, action item, blocker, unread. Postgres full-text index on `messages.body`.

## What this plan does NOT do
- Real voice/video calling — placeholder UI only.
- Real-time typing indicators in C1 (added in C3 with presence).
- Custom emoji picker (uses a fixed set in C1, full picker C2).
- Slack-grade rich text — markdown only.
- Mobile-native gestures — desktop-first responsive only.

## Technical notes
- All polymorphic links (`source_message_id`, `linked_task_ids`, etc.) use FKs or uuid[] columns — no implicit polymorphism, every reference is typed.
- RLS for `messages`/`reactions`/`receipts` goes through `public.is_channel_member(channel_id, user_id)` SECURITY DEFINER to prevent recursion.
- Realtime is enabled per-table, not globally, to keep bills sane.
- AI calls live in `src/lib/ai-comm.functions.ts` behind `requireSupabaseAuth`; no client keys.
- Existing `notifications` table is reused — no parallel "inbox" tables.

## Recommended next step
Approve and tell me which:
- **(a)** Ship C1 now (channels, messages, threads, realtime, conversion menu, side-panel UX). One large turn.
- **(b)** Ship C1 + C2 back-to-back (also Decisions, Action Items, Blockers, Announcements, Mentions, Smart Inbox, Project Hub). Multiple turns.
- **(c)** Re-prioritize — tell me 3–5 of the listed sub-systems you most want first.
