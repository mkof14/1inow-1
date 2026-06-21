# Founder Mode Implementation Plan

## Summary

This document defines a safe founder-mode strategy for 1inow.

No runtime code is changed by this document. No Supabase schema changes are included. No external service is connected.

Founder identity:

- Email: `dnainform@gmail.com`
- Intended role: `super_admin`
- Production requirement: real Supabase session
- Local/dev allowance: limited convenience mode only

## Source Context

This plan is based on:

- `docs/auth-supabase-owner-audit.md`
- Current auth provider behavior in `src/hooks/use-auth.tsx`
- Current route shell behavior in `src/routes/_authenticated/route.tsx`
- Current server function auth in `src/integrations/supabase/auth-middleware.ts`
- Current owner helper in `src/lib/api/dev-owner.functions.ts`
- Current owner-only dev tools in `src/lib/api/dev-tools.functions.ts`

Key audit findings:

- App routes under `/_authenticated` currently render without login.
- Protected server functions still require a real Bearer token.
- Client-side write helpers often require `supabase.auth.getUser()`.
- `devOwnerMagicLink` can create or locate `dnainform@gmail.com`, assign `super_admin`, and generate a magic link.
- `devOwnerMagicLink` currently needs environment gating before it is safe to keep around.
- `resetDemoData` and `seedDemoData` are powerful owner-only tools and should not be exposed in production.

## Goals

Founder mode must support:

- Fast local access during development.
- Real production identity.
- Owner email: `dnainform@gmail.com`.
- `super_admin` role assignment.
- No production auth bypass.
- No fake production writes.
- Audit-safe actor identity.
- Compatibility with Supabase RLS and server functions.

## Non-Goals

Founder mode must not:

- Bypass production auth.
- Store secrets in the repo.
- Add external services.
- Connect AI providers.
- Modify Supabase schema in this task.
- Change UI design, styling, layout, colors, typography, or existing page content.
- Replace the role model without a separate RBAC task.

## Required Operating Principle

1inow can have a low-friction owner experience, but it must not be built on an unauthenticated production user.

The personal assistant, memory layer, audit logs, notifications, and future AI permissions all need a stable actor identity. For production, that identity must be a real Supabase-authenticated user.

## Local And Dev Behavior

Local/dev can support a convenience founder mode.

Allowed behavior:

- Display the app shell without forcing sign-in.
- Make it clear that the local founder context is development-only.
- Allow owner bootstrap through a gated magic-link helper.
- Keep destructive owner tools behind explicit local/dev gates.
- Keep writes that depend on real user identity tied to a real Supabase session.

Not allowed:

- Fake production writes using a synthetic user ID.
- Service-role access from client code.
- Public access to owner bootstrap endpoints.
- Public access to destructive reset/seed tools.
- Treating local convenience mode as equivalent to production auth.

## Production Behavior

Production must require a real Supabase session for owner identity.

Required behavior:

- `dnainform@gmail.com` exists as a Supabase auth user.
- `dnainform@gmail.com` has `super_admin` in `user_roles`.
- Admin and owner actions check real session identity.
- Server functions that mutate privileged data require auth.
- Audit logs preserve the actor ID.
- Dev owner bootstrap tools are disabled unless explicitly enabled in a safe environment.

Recommended production login model:

- Use Supabase-supported login for `dnainform@gmail.com`.
- Magic link is acceptable if intentionally exposed through a secure owner-only flow.
- Do not implement a blanket production login bypass.

## Environment Variable Contract

These variables should be introduced later in a dedicated implementation task.

### `VITE_ENABLE_FOUNDER_MODE`

Client-side flag.

Purpose:

- Allows development-only founder convenience behavior in the browser.

Allowed values:

- `true`
- `false`

Default:

- `false`

Production:

- Must be `false`.

### `FOUNDER_EMAIL`

Server-side preferred; client exposure only if needed for display.

Purpose:

- Defines the owner email without hard-coding it in multiple files.

Expected value:

- `dnainform@gmail.com`

Default:

- No default in production.

### `ENABLE_DEV_OWNER_TOOLS`

Server-side flag.

Purpose:

- Enables owner bootstrap and destructive dev helpers only in allowed environments.

Allowed values:

- `true`
- `false`

Default:

- `false`

Production:

- Must be `false` unless a separate security-reviewed task approves a controlled owner bootstrap flow.

### `SUPABASE_SERVICE_ROLE_KEY`

Server-side only.

Purpose:

- Required for Supabase admin operations such as creating the owner user or generating admin magic links.

Rules:

- Never expose to browser code.
- Never commit to the repo.
- Never add to `.env.example` as a real value.
- Only use from server-only code paths.

## Implementation Phases

### Phase A: Documentation And Env Contract

Purpose:

- Document expected founder-mode behavior.
- Define environment variable contract.
- Decide dev/prod split.

Allowed changes:

- Documentation only.

Status:

- This document covers Phase A.

### Phase B: Guard `devOwnerMagicLink`

Purpose:

- Prevent owner bootstrap from being available by default.

Required behavior:

- Read `ENABLE_DEV_OWNER_TOOLS`.
- Refuse to run unless the flag is explicitly enabled.
- Read founder email from `FOUNDER_EMAIL`.
- Fall back to `dnainform@gmail.com` only in local/dev if explicitly approved.
- Keep service-role import server-side only.

Files likely involved later:

- `src/lib/api/dev-owner.functions.ts`
- `src/lib/config.server.ts`
- `.env.example`
- Documentation

Validation:

- `npm run build`

### Phase C: Normalize Owner Role Checks

Purpose:

- Ensure owner/admin checks treat `super_admin` correctly.

Required behavior:

- `super_admin` should be accepted as admin-equivalent for admin UI access.
- `isAdmin` naming may need to become `isAdminLike` or include `isSuperAdmin`.
- Do not change the role model in the same task.

Files likely involved later:

- `src/hooks/use-auth.tsx`
- Role helper utilities if introduced
- Admin route access helpers if introduced

Validation:

- `npm run build`

### Phase D: Re-Enable Protected App Route Behavior

Purpose:

- Move from public app shell to controlled app access.

Required behavior:

- Production requires a real Supabase session for authenticated app routes.
- Local/dev founder convenience can remain if explicitly enabled.
- Preserve current UI design.
- Do not redesign auth pages.

Files likely involved later:

- `src/routes/_authenticated/route.tsx`
- `src/hooks/use-auth.tsx`
- Any existing auth route or redirect route

Validation:

- `npm run build`

### Phase E: Audit Destructive Dev Tools

Purpose:

- Prevent accidental production data loss.

Required behavior:

- `resetDemoData` must be disabled unless `ENABLE_DEV_OWNER_TOOLS=true`.
- `seedDemoData` must be disabled unless `ENABLE_DEV_OWNER_TOOLS=true`.
- Owner email check must remain.
- Real Supabase auth must still be required.
- Add explicit failure messages when disabled.

Files likely involved later:

- `src/lib/api/dev-tools.functions.ts`
- Admin pages that call these functions, if any
- Documentation

Validation:

- `npm run build`

## Risks And Mitigations

### Risk: Production Auth Bypass

Problem:

- If founder mode bypasses production auth, private data and future AI memory can lose identity boundaries.

Mitigation:

- Production must require real Supabase session.
- `VITE_ENABLE_FOUNDER_MODE=false` in production.
- `ENABLE_DEV_OWNER_TOOLS=false` in production.

### Risk: Service Role Exposure

Problem:

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must never reach browser code.

Mitigation:

- Keep service-role access in server-only paths.
- Use dynamic server imports carefully.
- Do not expose service-role values through Vite env vars.

### Risk: Destructive Dev Tool Exposure

Problem:

- `resetDemoData` can wipe important tables.

Mitigation:

- Require real auth.
- Require owner email match.
- Require `ENABLE_DEV_OWNER_TOOLS=true`.
- Consider requiring an explicit typed confirmation in a later UI task.

### Risk: Role Model Drift

Problem:

- Existing code uses many roles while Phase 2 docs describe a simplified role model.

Mitigation:

- Do not migrate roles inside founder-mode work.
- Create a separate RBAC decision task.

### Risk: Fake Local User Contaminates Data

Problem:

- Synthetic local users can create records that cannot be audited or owned correctly.

Mitigation:

- Use local founder convenience only for display or navigation.
- Require real session before writes.
- Prefer magic-link bootstrap for local owner work.

## Recommended Founder Mode Design

Recommended split:

1. Local/dev:
   - App can render without login.
   - Owner bootstrap can be enabled with `ENABLE_DEV_OWNER_TOOLS=true`.
   - Real writes should use a real Supabase session.

2. Production:
   - App routes require session.
   - Owner uses real Supabase auth.
   - `dnainform@gmail.com` has `super_admin`.
   - Dev tools are disabled.

This gives development speed without compromising the production foundation.

## Next Implementation Task

```text
Project: 1inow-1
Branch: main

Goal:
Guard owner bootstrap and destructive dev tools behind explicit environment flags.

Files allowed to change:
- src/lib/api/dev-owner.functions.ts
- src/lib/api/dev-tools.functions.ts
- src/lib/config.server.ts
- .env.example
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
- existing page content
- Supabase schema
- external services
- AI routes

Tasks:
1. Add server-side config for:
   - FOUNDER_EMAIL
   - ENABLE_DEV_OWNER_TOOLS
2. Update devOwnerMagicLink so it refuses to run unless dev owner tools are enabled.
3. Update resetDemoData and seedDemoData so they refuse to run unless dev owner tools are enabled.
4. Keep real auth and owner email checks for destructive tools.
5. Update .env.example with safe placeholders only.
6. Do not implement route-level auth changes yet.
7. Do not change UI.

Validation:
npm run build

Commit:
refactor: guard founder dev tools
```

## Validation

Required validation for the implementation task:

```bash
npm run build
```
