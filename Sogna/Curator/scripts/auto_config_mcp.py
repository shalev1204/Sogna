#!/usr/bin/env python3
"""Registra Sogna_UMA y Sognatore en clientes MCP (Cursor + Antigravity). Cross-platform."""
from __future__ import annotations

import json
import sys
from pathlib import Path

SOGNA_ROOT = Path(__file__).resolve().parent.parent.parent
UMA_SSE = "http://127.0.0.1:8000/sse"
BRIDGE_SSE = "http://127.0.0.1:8001/sse"

CLIENT_CONFIGS: tuple[tuple[str, Path], ...] = (
    ("Cursor", Path.home() / ".cursor" / "mcp.json"),
    ("Antigravity", Path.home() / ".gemini" / "antigravity" / "mcp_config.json"),
)


def resolve_mcp_remote(sogna_root: Path) -> tuple[str, list[str]]:
    """Local mcp-remote from pnpm install; fallback npx for Mac/Linux or missing bin."""
    if sys.platform == "win32":
        candidate = sogna_root / "node_modules" / ".bin" / "mcp-remote.cmd"
    else:
        candidate = sogna_root / "node_modules" / ".bin" / "mcp-remote"
    if candidate.is_file():
        return str(candidate), []
    return "npx", ["-y", "mcp-remote"]


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    raw = path.read_text(encoding="utf-8-sig")
    return json.loads(raw)


def sogna_mcp_entries(sogna_root: Path) -> dict[str, dict]:
    command, prefix_args = resolve_mcp_remote(sogna_root)
    return {
        "Sogna_UMA": {
            "command": command,
            "args": [*prefix_args, UMA_SSE],
        },
        "Sognatore": {
            "command": command,
            "args": [*prefix_args, BRIDGE_SSE],
        },
    }


def merge_sogna_servers(config: dict, sogna_root: Path) -> dict:
    servers = config.setdefault("mcpServers", {})
    servers.update(sogna_mcp_entries(sogna_root))
    servers.pop("Sogna", None)  # legacy single-server name
    return config


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    if not (SOGNA_ROOT / "platform.manifest.json").is_file():
        print(f"[ERROR] sogna_root invalido: {SOGNA_ROOT}", file=sys.stderr)
        return 1

    command, _ = resolve_mcp_remote(SOGNA_ROOT)
    updated: list[str] = []

    for label, config_path in CLIENT_CONFIGS:
        try:
            config = load_json(config_path)
            merge_sogna_servers(config, SOGNA_ROOT)
            write_json(config_path, config)
            updated.append(f"{label} -> {config_path}")
        except json.JSONDecodeError as exc:
            print(f"[WARN] {label}: JSON invalido en {config_path}: {exc}", file=sys.stderr)
        except OSError as exc:
            print(f"[WARN] {label}: no se pudo escribir {config_path}: {exc}", file=sys.stderr)

    if not updated:
        print("[ERROR] Ningun cliente MCP actualizado.", file=sys.stderr)
        return 1

    print("Sogna MCP registrado (Sogna_UMA :8000, Sognatore :8001).")
    print(f"mcp-remote: {command}")
    for line in updated:
        print(f"  {line}")
    print("Reinicie servidores MCP en Cursor (Settings > MCP) tras encender control/Sogna.bat on.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
