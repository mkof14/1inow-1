#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT}/public/assistants/nova.jpg"
OUT="${ROOT}/public/icons"

mkdir -p "$OUT"

if [[ ! -f "$SRC" ]]; then
  echo "Source image missing: $SRC" >&2
  exit 1
fi

sips -z 192 192 "$SRC" --out "$OUT/icon-192.png"
sips -z 512 512 "$SRC" --out "$OUT/icon-512.png"
sips -z 180 180 "$SRC" --out "$OUT/apple-touch-icon.png"
sips -z 32 32 "$SRC" --out "${ROOT}/public/favicon.png"

echo "PWA icons written to public/icons/ and public/favicon.png"
