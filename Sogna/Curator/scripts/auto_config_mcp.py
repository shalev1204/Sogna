#!/usr/bin/env python3
"""Registra MCP en Cursor, Antigravity y Claude Code (paridad con Cursor donde aplica)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SOGNA_ROOT = Path(__file__).resolve().parent.parent.parent
UMA_SSE = "http://127.0.0.1:8000/sse"
BRIDGE_SSE = "http://127.0.0.1:8001/sse"

CURSOR_CONFIG = Path.home() / ".cursor" / "mcp.json"
CLAUDE_USER_CONFIG = Path.home() / ".claude.json"

# Antigravity IDE (2026) lee config/; antigravity/ es ruta legacy — mantener ambas.
ANTIGRAVITY_CONFIG_PATHS: tuple[Path, ...] = (
    Path.home() / ".gemini" / "config" / "mcp_config.json",
    Path.home() / ".gemini" / "antigravity" / "mcp_config.json",
)


def resolve_git_root(sogna_root: Path) -> Path:
    if sogna_root.name == "Sogna" and (sogna_root.parent / "Sogna" / "platform.manifest.json").is_file():
        return sogna_root.parent
    return sogna_root


def resolve_mcp_remote(sogna_root: Path) -> tuple[str, list[str]]:
    if sys.platform == "win32":
        candidate = sogna_root / "node_modules" / ".bin" / "mcp-remote.cmd"
    else:
        candidate = sogna_root / "node_modules" / ".bin" / "mcp-remote"
    if candidate.is_file():
        return str(candidate), []
    return "npx", ["-y", "mcp-remote"]


def workspace_path_for_mcp(git_root: Path) -> str:
    return str(git_root.resolve()).replace("\\", "/")


def sogna_local_entries(sogna_root: Path) -> dict[str, dict]:
    command, prefix_args = resolve_mcp_remote(sogna_root)
    return {
        "Sogna_UMA": {"command": command, "args": [*prefix_args, UMA_SSE]},
        "Sognatore": {"command": command, "args": [*prefix_args, BRIDGE_SSE]},
    }


def sogna_portable_entries() -> dict[str, dict]:
    return {
        "Sogna_UMA": {
            "command": "npx",
            "args": ["-y", "mcp-remote", UMA_SSE],
        },
        "Sognatore": {
            "command": "npx",
            "args": ["-y", "mcp-remote", BRIDGE_SSE],
        },
    }


def shared_stdio_entries(git_root: Path, cursor_config: dict) -> dict[str, dict]:
    """filesystem, fetch, github — misma forma que Cursor (stdio/npx)."""
    cursor_servers = cursor_config.get("mcpServers", {})
    entries: dict[str, dict] = {}

    filesystem = cursor_servers.get("filesystem")
    if filesystem:
        entries["filesystem"] = json.loads(json.dumps(filesystem))
    else:
        entries["filesystem"] = {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                workspace_path_for_mcp(git_root),
            ],
        }

    fetch = cursor_servers.get("fetch")
    if fetch:
        entries["fetch"] = json.loads(json.dumps(fetch))
    else:
        entries["fetch"] = {
            "command": "npx",
            "args": ["-y", "@kwp-lab/mcp-fetch"],
        }

    github = cursor_servers.get("github")
    if github:
        entries["github"] = json.loads(json.dumps(github))
    elif os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN"):
        entries["github"] = {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {
                "GITHUB_PERSONAL_ACCESS_TOKEN": os.environ["GITHUB_PERSONAL_ACCESS_TOKEN"],
            },
        }

    return entries


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8-sig"))


def merge_servers(config: dict, entries: dict[str, dict]) -> dict:
    servers = config.setdefault("mcpServers", {})
    servers.update(entries)
    servers.pop("Sogna", None)
    return config


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def shared_stdio_entries_for_project(git_root: Path, cursor_config: dict) -> dict[str, dict]:
    """Como shared_stdio_entries pero sin token github (user-scope ~/.claude.json)."""
    entries = shared_stdio_entries(git_root, cursor_config)
    github = entries.get("github")
    if github and "env" in github:
        entries["github"] = {k: v for k, v in github.items() if k != "env"}
    return entries


def configure_claude_project(sogna_root: Path, git_root: Path, cursor_config: dict) -> Path:
    project_mcp = git_root / ".mcp.json"
    config = load_json(project_mcp) if project_mcp.exists() else {}
    merge_servers(config, shared_stdio_entries_for_project(git_root, cursor_config))
    merge_servers(config, sogna_local_entries(sogna_root))
    write_json(project_mcp, config)
    return project_mcp


def build_full_antigravity_config(sogna_root: Path, git_root: Path, cursor_config: dict) -> dict:
    config: dict = {"mcpServers": {}}
    merge_servers(config, shared_stdio_entries(git_root, cursor_config))
    merge_servers(config, sogna_local_entries(sogna_root))
    return config


def build_cursor_config(sogna_root: Path, git_root: Path, existing: dict) -> dict:
    config = existing if existing else {"mcpServers": {}}
    merge_servers(config, shared_stdio_entries(git_root, existing))
    merge_servers(config, sogna_local_entries(sogna_root))
    return config


def main() -> int:
    if not (SOGNA_ROOT / "platform.manifest.json").is_file():
        print(f"[ERROR] sogna_root invalido: {SOGNA_ROOT}", file=sys.stderr)
        return 1

    git_root = resolve_git_root(SOGNA_ROOT)
    cursor_config = load_json(CURSOR_CONFIG)
    updated: list[str] = []

    try:
        cursor_out = build_cursor_config(SOGNA_ROOT, git_root, cursor_config)
        write_json(CURSOR_CONFIG, cursor_out)
        updated.append(f"Cursor -> {CURSOR_CONFIG}")
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[WARN] Cursor: {exc}", file=sys.stderr)

    antigravity_payload = build_full_antigravity_config(SOGNA_ROOT, git_root, cursor_config)
    for ag_path in ANTIGRAVITY_CONFIG_PATHS:
        try:
            write_json(ag_path, antigravity_payload)
            updated.append(f"Antigravity -> {ag_path}")
        except OSError as exc:
            print(f"[WARN] Antigravity ({ag_path}): {exc}", file=sys.stderr)

    try:
        claude_config = load_json(CLAUDE_USER_CONFIG)
        merge_servers(claude_config, sogna_local_entries(SOGNA_ROOT))
        merge_servers(claude_config, shared_stdio_entries(git_root, cursor_config))
        write_json(CLAUDE_USER_CONFIG, claude_config)
        updated.append(f"Claude Code (user) -> {CLAUDE_USER_CONFIG}")
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[WARN] Claude Code user: {exc}", file=sys.stderr)

    try:
        project_path = configure_claude_project(SOGNA_ROOT, git_root, cursor_config)
        updated.append(f"Claude Code (project) -> {project_path}")
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[WARN] Claude Code project: {exc}", file=sys.stderr)

    if not updated:
        print("[ERROR] Ningun cliente MCP actualizado.", file=sys.stderr)
        return 1

    command, _ = resolve_mcp_remote(SOGNA_ROOT)
    servers = sorted(antigravity_payload.get("mcpServers", {}).keys())
    print("MCP sincronizado (Sogna_UMA :8000, Sognatore :8001).")
    print(f"mcp-remote local: {command}")
    print(f"Servidores Antigravity: {', '.join(servers)}")
    for line in updated:
        print(f"  {line}")
    print("")
    print("1. Encienda servicios: pnpm sogna:on")
    print("2. Antigravity: MCP Servers -> Refresh (o reinicie el IDE)")
    print("   Ruta activa: ~/.gemini/config/mcp_config.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
