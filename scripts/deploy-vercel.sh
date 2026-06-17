#!/usr/bin/env bash
# One-button Vercel deploy.
# Uses vercel.json + DEPLOY.md conventions already in the repo.
#
# Usage:
#   bun run deploy          # preview deployment
#   bun run deploy:prod     # production deployment
#
# Env (optional, recommended for CI / non-interactive):
#   VERCEL_TOKEN   - Vercel access token (https://vercel.com/account/tokens)
#   VERCEL_ORG_ID  - linked org id   (from .vercel/project.json after first link)
#   VERCEL_PROJECT_ID - linked project id

set -euo pipefail

MODE="preview"
if [[ "${1:-}" == "--prod" || "${1:-}" == "production" ]]; then
  MODE="prod"
fi

echo "▶ 1inow → Vercel deploy ($MODE)"

# Resolve a runner for the Vercel CLI without requiring a global install.
if command -v vercel >/dev/null 2>&1; then
  VERCEL="vercel"
elif command -v bunx >/dev/null 2>&1; then
  VERCEL="bunx vercel@latest"
elif command -v npx >/dev/null 2>&1; then
  VERCEL="npx --yes vercel@latest"
else
  echo "✖ Need bun, npm, or a global 'vercel' CLI on PATH." >&2
  exit 1
fi

TOKEN_FLAG=()
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  TOKEN_FLAG=(--token "$VERCEL_TOKEN")
fi

# Link project on first run (non-interactive when env ids are present).
if [[ ! -f .vercel/project.json ]]; then
  echo "▶ Linking project to Vercel…"
  if [[ -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]; then
    $VERCEL link --yes --scope "$VERCEL_ORG_ID" --project "$VERCEL_PROJECT_ID" "${TOKEN_FLAG[@]}"
  else
    $VERCEL link "${TOKEN_FLAG[@]}"
  fi
fi

# Pull env + build settings for the right target.
if [[ "$MODE" == "prod" ]]; then
  echo "▶ Pulling production env…"
  $VERCEL pull --yes --environment=production "${TOKEN_FLAG[@]}"
  echo "▶ Building (prod)…"
  $VERCEL build --prod "${TOKEN_FLAG[@]}"
  echo "▶ Deploying to production…"
  URL=$($VERCEL deploy --prebuilt --prod "${TOKEN_FLAG[@]}")
else
  echo "▶ Pulling preview env…"
  $VERCEL pull --yes --environment=preview "${TOKEN_FLAG[@]}"
  echo "▶ Building (preview)…"
  $VERCEL build "${TOKEN_FLAG[@]}"
  echo "▶ Deploying preview…"
  URL=$($VERCEL deploy --prebuilt "${TOKEN_FLAG[@]}")
fi

echo ""
echo "✓ Deployed: $URL"