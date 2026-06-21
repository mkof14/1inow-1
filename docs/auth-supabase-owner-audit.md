# Auth, Supabase, And Owner Mode Audit

## Summary

This audit documents the current authentication, profile, role, and Supabase usage state for 1inow.

No runtime code was changed. No Supabase schema was changed. No external service was connected.

Current baseline:

- Branch: `main`
- Lovable removed
- Production base tag exists: `v0.1.0-production-base`
- Build remains successful
- AI routes remain safe stubs
- Owner email currently hard-coded in dev helpers: `dnainform@gmail.com`

## Files Inspected

Auth and owner files:

- `src/hooks/use-auth.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/lib/api/dev-owner.functions.ts`
- `src/lib/api/dev-tools.functions.ts`

Supabase usage files:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/types.ts`
- `src/lib/queries.ts`
- `src/lib/wave1.ts`
- `src/lib/comm.ts`
- `src/lib/admin-queries.ts`

Additional usage was checked across `src/`.

## Current Auth State

### Client Auth Provider

`src/hooks/use-auth.tsx` provides the client auth context.

Current behavior:

- Reads Supabase session through `supabase.auth.getSession()`.
- Subscribes to auth changes through `supabase.auth.onAuthStateChange()`.
- Exposes:
  - `session`
  - `user`
  - `loading`
  - `isAdmin`
  - `signOut()`
- Checks admin state through Supabase RPC:
  - `has_role(_user_id, _role)`

Important detail:

- `isAdmin` currently checks only the `admin` role.
- It does not check `super_admin`.
- If the owner only has `super_admin`, `isAdmin` may be false unless the database function treats `super_admin` as admin-equivalent internally.

### Authenticated Route Group

`src/routes/_authenticated/route.tsx` currently disables route-level auth enforcement.

Current behavior:

- The authenticated shell renders for all visitors.
- Comment in code states: `Auth temporarily disabled — all routes accessible without login.`
- `ssr: false` is set for the route group.

This means the app UI can be opened without a Supabase session.

### Server Function Auth

`src/integrations/supabase/auth-middleware.ts` still enforces Bearer-token auth for server functions that use `requireSupabaseAuth`.

Current behavior:

- Requires `SUPABASE_URL`.
- Requires `SUPABASE_PUBLISHABLE_KEY`.
- Requires an `Authorization: Bearer <token>` request header.
- Uses `supabase.auth.getClaims(token)`.
- Rejects requests without a valid token.
- Provides server function context:
  - `supabase`
  - `userId`
  - `claims`

This means route-level auth is disabled, but protected server functions still require a valid Supabase session.

### Client Token Attachment

`src/integrations/supabase/auth-attacher.ts` attaches a bearer token to server function calls.

Current behavior:

- Reads the current Supabase session.
- Adds `Authorization: Bearer <access_token>` when a token exists.
- Sends no auth header when there is no session.

Implication:

- Unauthenticated UI access can render pages.
- Auth-protected mutations/server functions can still fail with unauthorized errors.

## Current Profile Assumptions

Profiles are treated as the application user metadata layer.

Referenced profile fields include:

- `id`
- `email`
- `full_name`
- `avatar_url`
- `status`
- `language`
- `preferred_language`
- `secondary_language`
- `timezone`
- `phone`
- `country`
- `city`
- `date_format`
- `time_format`
- `number_format`
- `auto_translate`
- `created_at`

Current usage patterns:

- `src/lib/queries.ts` fetches all profiles for general app screens.
- `src/lib/admin-queries.ts` fetches profile data for admin users.
- `src/routes/_authenticated/profile.tsx` loads and updates the current user's profile.
- `src/routes/_authenticated/settings.tsx` reads and updates language/locale preferences from `profiles`.
- `src/lib/i18n/index.tsx` reads and updates `preferred_language`.
- Communication code resolves message authors through `profiles`.

Risk:

- Several profile operations assume `user.id` exists.
- With route auth disabled, pages may render without a user and some actions will no-op or fail depending on the helper.

## Current Role Assumptions

Role-related tables and helpers exist.

Current role tables/functions referenced:

- `user_roles`
- `permissions`
- `role_permissions`
- RPC: `has_role`

Current app role set in `src/lib/admin-queries.ts`:

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

Current dev tools role set matches this same broader role model.

Important mismatch with Phase 2 docs:

- Phase 2 planning uses a simplified future role model:
  - `super_admin`
  - `admin`
  - `manager`
  - `member`
  - `viewer`
- Current runtime code still uses a broader role model.

Recommendation:

- Do not change roles yet.
- First decide whether Phase 2 should preserve current roles or migrate to the simplified model.
- Role changes should be a separate RBAC task.

## Owner And Super Admin State

Owner identity is currently hard-coded in dev helpers:

- `dnainform@gmail.com`

### `devOwnerMagicLink`

`src/lib/api/dev-owner.functions.ts`:

- Uses the service-role Supabase admin client.
- Finds or creates the owner auth user.
- Confirms the owner email.
- Upserts `super_admin` into `user_roles`.
- Generates a magic-link sign-in URL.

Important risk:

- This server function currently does not use `requireSupabaseAuth`.
- It relies on service-role access and a hard-coded owner email.
- It must be environment-gated before production exposure.

### Dev Tools

`src/lib/api/dev-tools.functions.ts`:

- Uses `requireSupabaseAuth`.
- Verifies the authenticated user's email is `dnainform@gmail.com`.
- Allows owner-only operations:
  - Set own role
  - Reset demo data
  - Seed demo data

Important risk:

- `resetDemoData` can wipe many tables.
- It is owner-only, but still powerful.
- It should be hidden or disabled outside local/dev environments.

## Where Auth Is Disabled

Auth is disabled at the route shell level:

- `src/routes/_authenticated/route.tsx`

Effect:

- All app pages can render without login.
- The app behaves like a public shell when Supabase data/RLS permits reads.

This is useful for early local development, but it is not production-safe as a final policy.

## Where Auth Is Still Required

Auth is still required for server functions using:

- `requireSupabaseAuth`

Current examples:

- `src/lib/advisor.functions.ts`
- `src/lib/project-advisor.functions.ts`
- `src/lib/translate.functions.ts`
- `src/lib/api/dev-tools.functions.ts`

Client helpers also require a Supabase user for write operations:

- `src/lib/wave1.ts`
- `src/lib/comm.ts`
- `src/components/quick-create.tsx`
- `src/components/task-timer.tsx`
- Several `intelligence` actions

Typical behavior without a session:

- Some reads may work depending on RLS.
- Some actions return early.
- Some actions throw `Not signed in`.
- Some protected server functions reject with unauthorized errors.

## Supabase Tables Currently Referenced

The code currently references these Supabase tables:

- `activity_logs`
- `ai_actions`
- `ai_agents`
- `ai_confidence_logs`
- `ai_memories`
- `ai_questions`
- `ai_reminders`
- `ai_rules`
- `ai_workflows`
- `assistant_preferences`
- `audit_logs`
- `channel_members`
- `channels`
- `data_quality_issues`
- `decisions`
- `departments`
- `email_logs`
- `email_templates`
- `favorites`
- `invitations`
- `message_reactions`
- `messages`
- `notifications`
- `permissions`
- `profiles`
- `project_members`
- `projects`
- `recent_items`
- `relations`
- `role_permissions`
- `saved_messages`
- `system_settings`
- `tasks`
- `teams`
- `user_privacy_zones`
- `user_roles`
- `user_settings`

The generated Supabase type file confirms typed tables for core domains such as:

- `profiles`
- `projects`
- `tasks`
- `notifications`
- `audit_logs`
- `system_settings`
- `user_roles`

Some newer or experimental domains are accessed through `as any`, which means their type coverage should be reviewed before production hardening.

## Main Data Domains Already Present

### Core Work

- `projects`
- `project_members`
- `tasks`
- `decisions`
- `activity_logs`
- `relations`

### People And Access

- `profiles`
- `user_roles`
- `permissions`
- `role_permissions`
- `invitations`

### Communication

- `channels`
- `channel_members`
- `messages`
- `message_reactions`
- `saved_messages`

### Personal Productivity

- `favorites`
- `recent_items`
- `notifications`
- `user_settings`

### Admin

- `audit_logs`
- `system_settings`
- `email_templates`
- `email_logs`

### AI/Intelligence Preparation

- `ai_memories`
- `ai_agents`
- `ai_workflows`
- `ai_rules`
- `ai_questions`
- `ai_actions`
- `ai_confidence_logs`
- `ai_reminders`
- `assistant_preferences`
- `data_quality_issues`
- `user_privacy_zones`

These AI tables are local application data domains. They do not mean an external AI provider is connected.

## Risks Of Bypassing Auth

Bypassing auth entirely is not recommended for production.

Risks:

- User-specific data cannot be scoped safely.
- RLS behavior becomes unclear.
- Write operations can fail inconsistently.
- Owner-only workflows can become overpowered if not environment-gated.
- Audit logs lose reliable actor identity.
- AI memory and assistant preferences cannot be safely tied to one person.
- Future email, notification, and AI actions require a real actor identity.

The product can support low-friction owner access, but it should still create a real Supabase session or a controlled dev-only founder context.

## Safe Founder-Mode Options

### Option A: Local Dev Founder Mode

Use only for local development.

Behavior:

- If no Supabase session exists, app can display a local founder identity.
- Founder email: `dnainform@gmail.com`.
- Local founder identity is not used for production writes.
- Any write requiring database ownership should still use a real Supabase session.

Pros:

- Fast local access.
- Useful for UI and workflow iteration.

Cons:

- Not production-safe.
- Cannot reliably satisfy RLS.
- Not enough for server functions that require Bearer tokens.

### Option B: Owner Magic-Link Bootstrap

Use `devOwnerMagicLink` behind a local/dev-only guard.

Behavior:

- Ensures `dnainform@gmail.com` exists.
- Ensures `super_admin` role exists.
- Generates a Supabase magic link.
- User enters the app through a real Supabase session.

Pros:

- Keeps real Supabase auth.
- Works with RLS and server functions.
- Preserves actor identity for audit logs.

Cons:

- Requires `SUPABASE_SERVICE_ROLE_KEY`.
- Must be carefully restricted to local/dev or owner-only environments.

### Option C: Production Owner Login

Recommended production direction.

Behavior:

- Use real Supabase auth for `dnainform@gmail.com`.
- Keep `super_admin` role in `user_roles`.
- Allow a quick owner login method, but do not bypass auth.

Pros:

- Production-safe.
- Compatible with audit logs, permissions, AI permissions, notifications, and future integrations.

Cons:

- Slightly less convenient than no-login mode.

## Recommended Direction

Use this split:

- Local development: allow founder convenience mode only as a dev feature.
- Production: require a real Supabase owner session for `dnainform@gmail.com`.
- Admin/dev destructive tools: hide or disable unless the environment is explicitly local/dev.

Do not build the future personal AI system on a fake unauthenticated user model.

The assistant, memory, task prioritization, audit logs, and notifications all need a stable actor identity.

## Recommended Next Implementation Task

```text
Project: 1inow-1
Branch: main

Goal:
Implement a safe local founder access plan without changing UI design.

Files allowed to change:
- src/hooks/use-auth.tsx
- src/lib/api/dev-owner.functions.ts
- src/lib/api/dev-tools.functions.ts
- docs/founder-mode-implementation.md

Files not allowed to change:
- src/styles.css
- src/components/**
- src/routes/_authenticated/**
- package.json
- package-lock.json
- vite.config.ts
- Supabase migrations/schema files

Must not change:
- UI/design/style/layout/colors/typography
- existing page copy
- Supabase schema
- external services
- AI routes

Tasks:
1. Add a documented founder-mode strategy for local/dev only.
2. Add environment-gating plan for dev owner magic link and destructive dev tools.
3. Ensure production direction still requires real Supabase auth.
4. Do not implement database migrations.
5. Do not connect external services.

Validation:
npm run build

Commit:
docs: add founder mode implementation plan
```

## Build Validation

Required validation for this audit task:

```bash
npm run build
```
