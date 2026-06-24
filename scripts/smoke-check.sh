#!/usr/bin/env bash
set -euo pipefail

npm run lint -- --max-warnings=0
npm run build

if rg -n "coming soon|demo channel|Notes module coming|Meetings — coming soon" src; then
  echo "Smoke check failed: visible placeholder copy found." >&2
  exit 1
fi

echo "Smoke check passed."
