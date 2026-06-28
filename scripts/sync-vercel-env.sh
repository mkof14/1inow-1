#!/usr/bin/env bash
# Sync production Vercel env from .env.local (no values printed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "✖ Missing .env.local" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "✖ Missing VERCEL_TOKEN in .env.local" >&2
  exit 1
fi

export VERCEL_TOKEN

VERCEL=(npx --yes vercel@latest)
TARGETS=(production preview)

sync_var() {
  local name=$1
  local value=$2
  for target in "${TARGETS[@]}"; do
    "${VERCEL[@]}" env rm "$name" "$target" --yes 2>/dev/null || true
    printf '%s' "$value" | "${VERCEL[@]}" env add "$name" "$target" --yes >/dev/null
    echo "  ✓ $name ($target)"
  done
}

echo "▶ Syncing Vercel env from .env.local"

for key in \
  VITE_SUPABASE_URL \
  VITE_SUPABASE_PUBLISHABLE_KEY \
  VITE_SUPABASE_PROJECT_ID \
  SUPABASE_URL \
  SUPABASE_PUBLISHABLE_KEY \
  SUPABASE_PROJECT_ID \
  VITE_ENABLE_GOOGLE_AUTH \
  VITE_ENABLE_FOUNDER_MODE \
  FOUNDER_EMAIL; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    echo "  ! skip $key (empty)"
    continue
  fi
  sync_var "$key" "$value"
done

echo "✓ Vercel env sync complete"
