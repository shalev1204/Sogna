#!/usr/bin/env bash
# Registra agentes launchd para arranque residente y consolidacion UMA diaria (macOS).
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Este script solo aplica en macOS." >&2
  exit 1
fi

CONTROL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$CONTROL_DIR/.." && pwd)"
MACOS_DIR="$CONTROL_DIR/macos"
AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$PROJECT_ROOT/memory/operational/logs"
SOGNA_SH="$CONTROL_DIR/sogna.sh"
CONSOLIDATE_SH="$CONTROL_DIR/consolidate_scheduled.sh"

mkdir -p "$AGENTS_DIR" "$LOG_DIR"
chmod +x "$SOGNA_SH" "$CONSOLIDATE_SH" "$CONTROL_DIR/Encender.sh" "$CONTROL_DIR/Apagar.sh"

render_plist() {
  local template="$1"
  local dest="$2"
  sed \
    -e "s|__PROJECT_ROOT__|$PROJECT_ROOT|g" \
    -e "s|__LOG_DIR__|$LOG_DIR|g" \
    -e "s|__SOGNA_SH__|$SOGNA_SH|g" \
    -e "s|__CONSOLIDATE_SH__|$CONSOLIDATE_SH|g" \
    "$template" > "$dest"
}

RESIDENT_PLIST="$AGENTS_DIR/com.sogna.resident.plist"
CONSOLIDATION_PLIST="$AGENTS_DIR/com.sogna.consolidation.plist"

render_plist "$MACOS_DIR/com.sogna.resident.plist.template" "$RESIDENT_PLIST"
render_plist "$MACOS_DIR/com.sogna.consolidation.plist.template" "$CONSOLIDATION_PLIST"

launchctl bootout "gui/$(id -u)/com.sogna.resident" 2>/dev/null || true
launchctl bootout "gui/$(id -u)/com.sogna.consolidation" 2>/dev/null || true

launchctl bootstrap "gui/$(id -u)" "$RESIDENT_PLIST"
launchctl bootstrap "gui/$(id -u)" "$CONSOLIDATION_PLIST"

launchctl enable "gui/$(id -u)/com.sogna.resident"
launchctl enable "gui/$(id -u)/com.sogna.consolidation"

echo ""
echo "launchd registrado:"
echo "  com.sogna.resident       — arranque al iniciar sesion"
echo "  com.sogna.consolidation  — diaria 03:00"
echo "  Log residente: $LOG_DIR/launchd_resident.log"
echo "  Log consolidacion: $LOG_DIR/launchd_consolidation.log"
echo ""
echo "Arranque manual: $CONTROL_DIR/Encender.sh"
echo "Apagado manual:  $CONTROL_DIR/Apagar.sh"
