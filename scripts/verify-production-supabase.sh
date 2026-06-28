#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

failures=0
warnings=0

pass() { echo "  ✓ $1"; }
warn() { echo "  ! $1"; warnings=$((warnings + 1)); }
fail() { echo "  ✗ $1"; failures=$((failures + 1)); }

echo "1inow production Supabase verification"
echo

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  pass "Loaded .env for local checks"
else
  warn "No .env file found — checking process env only"
fi

echo
echo "Environment variables"
required=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
)
for key in "${required[@]}"; do
  if [[ -n "${!key:-}" ]]; then
    pass "$key is set"
  else
    fail "$key is missing"
  fi
done

optional_secret=(SUPABASE_SERVICE_ROLE_KEY)
for key in "${optional_secret[@]}"; do
  if [[ -n "${!key:-}" ]]; then
    pass "$key is set (server/admin checks enabled)"
  else
    warn "$key is missing (required for server-side admin tools only)"
  fi
done

echo
echo "Production safety flags"
if [[ "${VITE_ENABLE_FOUNDER_MODE:-false}" == "false" ]]; then
  pass "VITE_ENABLE_FOUNDER_MODE=false"
else
  fail "VITE_ENABLE_FOUNDER_MODE must be false in production"
fi

if [[ "${ENABLE_DEV_OWNER_TOOLS:-false}" == "false" ]]; then
  pass "ENABLE_DEV_OWNER_TOOLS=false"
else
  fail "ENABLE_DEV_OWNER_TOOLS must be false in production"
fi

if [[ "${VITE_ENABLE_DEV_OWNER_TOOLS:-false}" == "false" ]]; then
  pass "VITE_ENABLE_DEV_OWNER_TOOLS=false"
else
  fail "VITE_ENABLE_DEV_OWNER_TOOLS must be false in production"
fi

echo
echo "Org foundation migrations"
bash "$ROOT/scripts/verify-org-migrations.sh" | sed 's/^/  /'

echo
echo "Remote database checks"
if command -v node >/dev/null 2>&1; then
  node "$ROOT/scripts/check-supabase-remote.mjs" || failures=$((failures + 1))
else
  warn "Node not available — skip remote Supabase checks"
fi

echo
echo "Migration runbook"
echo "  See docs/supabase-migration-runbook.md for apply order and post-check SQL."

echo
echo "Manual Supabase SQL checks (run in Dashboard → SQL)"
cat <<'SQL'
-- Owner account exists and is bootstrapped
SELECT u.email, p.organization_id, o.slug AS org_slug
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
LEFT JOIN public.organizations AS o ON o.id = p.organization_id
WHERE lower(u.email) = lower('dnainform@gmail.com');

-- Owner role
SELECT ur.role
FROM auth.users AS u
JOIN public.user_roles AS ur ON ur.user_id = u.id
WHERE lower(u.email) = lower('dnainform@gmail.com');

-- RPC helpers present
SELECT proname
FROM pg_proc
WHERE proname IN (
  'default_organization_id',
  'ensure_profile_organization',
  'current_organization_id',
  'get_invitation_preview',
  'accept_invitation',
  'log_audit'
)
ORDER BY proname;

-- Profiles without organization (should trend to 0 after bootstrap)
SELECT count(*) AS profiles_without_org
FROM public.profiles
WHERE organization_id IS NULL;
SQL

echo
echo "Integration flags (should stay disabled until configured)"
for pair in \
  "ENABLE_STRIPE:false" \
  "ENABLE_INVITATION_EMAIL:false" \
  "VITE_ANALYTICS_PROVIDER:disabled" \
  "VITE_MONITORING_PROVIDER:disabled"
do
  key="${pair%%:*}"
  expected="${pair##*:}"
  actual="${!key:-}"
  if [[ -z "$actual" ]]; then
    actual="$expected"
  fi
  if [[ "$actual" == "$expected" ]]; then
    pass "$key=$expected"
  else
    warn "$key is '$actual' (expected '$expected' unless go-live approved)"
  fi
done

echo
echo "Sign-in smoke (manual)"
echo "  1. Open /auth and sign in as dnainform@gmail.com"
echo "  2. Confirm /dashboard loads and profile has organization_id"
echo "  3. Confirm /administration is reachable for admin permissions"
echo "  4. Create a test invitation and verify audit log entry"

echo
if [[ "$failures" -gt 0 ]]; then
  echo "Verification failed: $failures error(s), $warnings warning(s)."
  exit 1
fi

echo "Verification passed with $warnings warning(s)."
