#!/usr/bin/env bash
# SOGNA DREAM — entrada sin pnpm (solo requiere Node >= 20 tras bootstrap brew opcional)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "[dream] Node ausente — instalando node@20 vía Homebrew..."
    brew install node@20
    export PATH="/opt/homebrew/opt/node@20/bin:/usr/local/opt/node@20/bin:$PATH"
  else
    echo "[dream] ERROR: Node no encontrado. Instale Node 20+ o Homebrew (https://brew.sh)."
    exit 1
  fi
fi

exec node scripts/sogna-dream.mjs "$@"
