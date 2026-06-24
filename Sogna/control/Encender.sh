#!/usr/bin/env bash
set -euo pipefail
CONTROL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ""
echo " Iniciando ecosistema Sogna en segundo plano..."
"$CONTROL_DIR/sogna.sh" on
echo ""
read -r -p "Pulse Enter para cerrar..."
