# Supabase Migration Runbook

Apply organization foundation migrations on the **production** Supabase project before enabling multi-user workspace features.

## Prerequisites

- Supabase Dashboard access for the production project
- Backup or maintenance window if the database already has live users
- Owner account `dnainform@gmail.com` exists in `auth.users`

## Apply order

Run each file in **Supabase Dashboard → SQL Editor** (or `supabase db push`), in this exact order:

| # | Migration file |
| --- | --- |
| 1 | `supabase/migrations/20260626150000_default_organization_bootstrap.sql` |
| 2 | `supabase/migrations/20260626153000_organization_rls_scoping.sql` |
| 3 | `supabase/migrations/20260626160000_invitation_acceptance.sql` |
| 4 | `supabase/migrations/20260626163000_audit_log_organization.sql` |
| 5 | `supabase/migrations/20260626170000_communication_decisions_org_scoping.sql` |
| 6 | `supabase/migrations/20260626180000_user_roles_org_scoping.sql` |

List locally:

```bash
bash scripts/verify-org-migrations.sh
```

## Post-apply SQL checks

```sql
-- Default org exists
SELECT id, slug FROM public.organizations WHERE slug = '1inow-workspace';

-- RPC helpers exist
SELECT proname FROM pg_proc
WHERE proname IN (
  'default_organization_id',
  'ensure_profile_organization',
  'current_organization_id',
  'get_invitation_preview',
  'accept_invitation',
  'log_audit'
)
ORDER BY proname;

-- Owner bootstrapped
SELECT u.email, p.organization_id, o.slug AS org_slug
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
LEFT JOIN public.organizations AS o ON o.id = p.organization_id
WHERE lower(u.email) = lower('dnainform@gmail.com');

-- Profiles without organization (should be 0)
SELECT count(*) AS profiles_without_org
FROM public.profiles
WHERE organization_id IS NULL;

-- Org columns present on communication/decisions tables
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id'
  AND table_name IN ('channels', 'decisions', 'activity_logs', 'relations', 'projects')
ORDER BY table_name;
```

## App verification

```bash
npm run verify:production
npm run smoke
```

Manual smoke:

1. Sign in as `dnainform@gmail.com`
2. Confirm `/dashboard` loads
3. Open `/administration` — stats, integrations, audit log
4. Create a test invitation; verify audit entry
5. Open `/communication` and `/approvals` — org-scoped data loads

## Rollback note

These migrations add columns, functions, and RLS policies. Rollback requires manual SQL reversal. Prefer applying on a staging Supabase project first when possible.
