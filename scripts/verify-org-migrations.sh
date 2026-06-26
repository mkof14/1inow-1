#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "1inow organization migration runbook"
echo "Apply these files in the Supabase SQL editor (or via supabase db push), in order:"
echo

for file in \
  "$ROOT/supabase/migrations/20260626150000_default_organization_bootstrap.sql" \
  "$ROOT/supabase/migrations/20260626153000_organization_rls_scoping.sql" \
  "$ROOT/supabase/migrations/20260626160000_invitation_acceptance.sql"
do
  if [[ -f "$file" ]]; then
    echo "  - $(basename "$file")"
  else
    echo "  - MISSING: $(basename "$file")" >&2
    exit 1
  fi
done

echo
echo "Post-apply checks (SQL):"
cat <<'SQL'
-- Default org exists
SELECT id, slug FROM public.organizations WHERE slug = '1inow-workspace';

-- RPC helpers exist
SELECT proname FROM pg_proc
WHERE proname IN (
  'default_organization_id',
  'ensure_profile_organization',
  'current_organization_id',
  'get_invitation_preview',
  'accept_invitation'
)
ORDER BY proname;

-- Profiles linked to an organization
SELECT count(*) AS profiles_without_org
FROM public.profiles
WHERE organization_id IS NULL;
SQL

echo
echo "Optional local env for invitation email:"
echo "  ENABLE_INVITATION_EMAIL=true"
echo "  RESEND_API_KEY=..."
echo "  RESEND_FROM_EMAIL=\"1inow <onboarding@yourdomain.com>\""
