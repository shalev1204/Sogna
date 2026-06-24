#!/usr/bin/env bash
set -euo pipefail
CONTROL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$CONTROL_DIR/sogna.mjs" "$@"
