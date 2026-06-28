#!/usr/bin/env bash
# Apply org foundation migrations to linked Supabase project.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "▶ 1inow org migrations"
bash "$ROOT/scripts/verify-org-migrations.sh"
echo

run_push() {
  local cmd=("$@")
  echo "▶ Running: ${cmd[*]}"
  "${cmd[@]}"
}

if command -v supabase >/dev/null 2>&1; then
  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    export SUPABASE_ACCESS_TOKEN
  fi
  if [[ -n "${VITE_SUPABASE_PROJECT_ID:-}" ]] && [[ ! -f "$ROOT/supabase/.temp/project-ref" ]]; then
    echo "▶ Linking project ${VITE_SUPABASE_PROJECT_ID}…"
    supabase link --project-ref "$VITE_SUPABASE_PROJECT_ID" --yes 2>/dev/null || true
  fi
  run_push supabase db push --yes
elif command -v npx >/dev/null 2>&1; then
  echo "▶ Supabase CLI not installed — using npx supabase@latest"
  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    export SUPABASE_ACCESS_TOKEN
  fi
  run_push npx --yes supabase@latest db push --yes
else
  echo "✖ Supabase CLI unavailable."
  echo "  Option A: npx supabase login && npx supabase link --project-ref \$VITE_SUPABASE_PROJECT_ID"
  echo "  Option B: paste migrations in Supabase Dashboard → SQL (see docs/supabase-migration-runbook.md)"
  exit 1
fi

echo
echo "▶ Post-apply remote checks"
node "$ROOT/scripts/check-supabase-remote.mjs"
