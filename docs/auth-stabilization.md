# Auth Stabilization — Phase 2 Step 2

## Summary

This step stabilizes authentication, profile bootstrap, founder-mode policy, and admin route access without changing UI design.

No Supabase schema was changed. No external services were connected.

## Changes

### Role resolution

Added `src/lib/auth-roles.ts`:

- `resolveUserRoleFlags()` calls both `is_admin` and `is_super_admin` RPC helpers
- `requireAdminSession()` guards admin routes with a real Supabase session

Database note: `is_admin` already includes `super_admin` in SQL. The client now also exposes `isSuperAdmin` for future super-admin-only controls.

### Auth provider

Updated `src/hooks/use-auth.tsx`:

- Exposes `isSuperAdmin` alongside `isAdmin`
- Admin flags come only from Supabase RPC with a real session
- Founder mode no longer grants synthetic admin privileges
- Profile bootstrap runs on initial session load and on auth state changes
- Clears founder bypass when a real session appears

### Founder mode policy

Updated `src/lib/founder-mode.ts`:

- `syncFounderModeWithSession()` removes founder bypass after real sign-in
- `enforceFounderModePolicy()` clears founder bypass outside trusted local/dev environments

Founder access remains available only when:

- `VITE_ENABLE_FOUNDER_MODE="true"`, or
- Vite dev mode, or
- hostname is `localhost` / `127.0.0.1`

Production deployments should keep `VITE_ENABLE_FOUNDER_MODE="false"`.

### Route guards

Updated route behavior:

- `/_authenticated`: enforces founder policy and requires session unless founder bypass is active in local/dev
- `/_authenticated/administration`: requires real session plus `is_admin` RPC
- Non-admin users redirect to `/dashboard`
- Unauthenticated admin access redirects to `/auth`

### Sign-in flow

Updated `src/routes/auth.tsx`:

- Clears founder bypass before password sign-in
- Awaits `ensureCurrentProfile()` immediately after successful sign-in
- Enforces founder policy on auth page load

## Current Auth Model

| Mode | App access | Admin access | DB writes |
| --- | --- | --- | --- |
| Real Supabase session | Yes | Yes if `is_admin` | Yes, subject to RLS |
| Founder mode (local/dev) | Yes | No | Limited; no bearer token for server functions |
| Unauthenticated | Public routes only | No | No |

## Production Rules

1. Require real Supabase auth for production owner access.
2. Keep `VITE_ENABLE_FOUNDER_MODE="false"` on Vercel production.
3. Keep `ENABLE_DEV_OWNER_TOOLS="false"` and `VITE_ENABLE_DEV_OWNER_TOOLS="false"` on production.
4. Use owner magic link locally when admin/server-function testing is needed.

## Recommended Next Task

Phase 2 Step 3: Organization and team model review.

Focus:

- Decide whether `organizations`, `departments`, and `teams` are the canonical workspace hierarchy
- Map project ownership to organization scope
- Prepare RBAC boundaries before RLS tightening

## Validation

```bash
npm run build
npm run smoke
```
