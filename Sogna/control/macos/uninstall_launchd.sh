#!/usr/bin/env bash
# Elimina agentes launchd de Sogna (macOS).
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Este script solo aplica en macOS." >&2
  exit 1
fi

UID_NUM="$(id -u)"
DOMAIN="gui/$UID_NUM"

for label in com.sogna.resident com.sogna.consolidation; do
  launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/${label}.plist"
  echo "Eliminado: $label"
done

echo "Agentes launchd de Sogna desinstalados."
