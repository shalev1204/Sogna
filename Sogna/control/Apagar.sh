#!/usr/bin/env bash
set -euo pipefail
CONTROL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$CONTROL_DIR/sogna.sh" off
echo ""
read -r -p "Pulse Enter para cerrar..."
