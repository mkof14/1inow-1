# Core Data Contract

Organization-scoped workspace model for 1inow. Canonical membership lives on `profiles.organization_id`.

## Resolution helpers

| Helper | Purpose |
| --- | --- |
| `default_organization_id()` | Returns the bootstrap workspace org (`1inow-workspace`) |
| `ensure_profile_organization(user_id)` | Backfills missing profile org on sign-in/bootstrap |
| `current_organization_id(user_id)` | Reads org from profile; used in RLS policies |
| `resolveActiveOrganizationId(userId)` | Client-side equivalent before writes |

## Tables that require `organization_id` on create

| Table | App entry point | Backfill source |
| --- | --- | --- |
| `profiles` | Auth bootstrap RPC | `default_organization_id()` |
| `projects` | `createProjectRecord()` | Creator profile |
| `channels` | `createChannel()` | Project or creator profile |
| `decisions` | Approvals page insert | Project or requester profile |
| `relations` | `createRelation()` | Creator profile |
| `invitations` | Admin invite flow | Active workspace org |
| `audit_logs` | `log_audit` RPC | Actor profile |

Optional but recommended on insert:

| Table | Notes |
| --- | --- |
| `activity_logs` | Stamp from project or user profile when logging |

## RLS pattern

Most org-scoped tables follow:

```sql
organization_id IS NOT DISTINCT FROM public.current_organization_id()
```

Super admins bypass org boundaries. Legacy rows with `organization_id IS NULL` remain readable by owners/creators until backfill completes.

## Migration order (production)

Run via Supabase SQL editor or `supabase db push`, in order:

1. `20260626150000_default_organization_bootstrap.sql`
2. `20260626153000_organization_rls_scoping.sql`
3. `20260626160000_invitation_acceptance.sql`
4. `20260626163000_audit_log_organization.sql`
5. `20260626170000_communication_decisions_org_scoping.sql`

Verify:

```bash
npm run verify:production
bash scripts/verify-org-migrations.sh
npm run smoke
```

## Production env defaults

```env
VITE_ENABLE_FOUNDER_MODE=false
ENABLE_DEV_OWNER_TOOLS=false
VITE_ENABLE_DEV_OWNER_TOOLS=false
ENABLE_INVITATION_EMAIL=false
ENABLE_STRIPE=false
ANALYTICS_PROVIDER=disabled
MONITORING_PROVIDER=disabled
VITE_MONITORING_PROVIDER=disabled
# SENTRY_DSN=
# VITE_SENTRY_DSN=
```
