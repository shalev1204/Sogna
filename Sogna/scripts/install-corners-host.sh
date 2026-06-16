#!/usr/bin/env bash
# Instala esquinas Capa 2 en la raiz git del host que contiene carpeta Sogna/
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOGNA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ ! -f "$SOGNA_ROOT/platform.manifest.json" ]]; then
  echo "No Sogna installation at $SOGNA_ROOT (missing platform.manifest.json)." >&2
  exit 1
fi

HOST_ROOT="$(cd "$SOGNA_ROOT/.." && pwd)"
echo "Host root: $HOST_ROOT"
echo "Sogna root: $SOGNA_ROOT"
echo ""

exec "$SCRIPT_DIR/deploy-corners.sh"
