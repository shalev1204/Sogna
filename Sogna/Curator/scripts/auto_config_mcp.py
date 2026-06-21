#!/usr/bin/env python3
"""Registra MCP en Cursor, Antigravity y Claude Code (paridad con Cursor donde aplica)."""
from __future__ import annotations

import datetime
import json
import os
import sys
from pathlib import Path
from urllib.parse import quote

SOGNA_ROOT = Path(__file__).resolve().parent.parent.parent

DEFAULT_LOCAL_SERVICES = {
    "host": "127.0.0.1",
    "ports": {"uma_api": 8080, "mcp_uma": 8000, "mcp_bridge": 8001, "web": 5173},
}


def load_mcp_endpoints(sogna_root: Path) -> dict[str, str | int]:
    """SSOT alineado con scripts/lib/mcp-endpoints.mjs y platform.manifest.json."""
    host = DEFAULT_LOCAL_SERVICES["host"]
    ports = dict(DEFAULT_LOCAL_SERVICES["ports"])
    manifest_path = sogna_root / "platform.manifest.json"
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            ls = manifest.get("local_services") or {}
            if isinstance(ls.get("host"), str) and ls["host"].strip():
                host = ls["host"].strip()
            mp = ls.get("ports") or {}
            for key in ("uma_api", "mcp_uma", "mcp_bridge", "web"):
                val = mp.get(key)
                if isinstance(val, int) and 0 < val < 65536:
                    ports[key] = val
        except (json.JSONDecodeError, OSError):
            pass
    host = os.environ.get("SOGNA_MCP_HOST", host).strip() or "127.0.0.1"
    uma_api = int(os.environ.get("SOGNA_UMA_API_PORT", str(ports["uma_api"])))
    mcp_uma = int(os.environ.get("SOGNA_MCP_UMA_PORT", str(ports["mcp_uma"])))
    mcp_bridge = int(os.environ.get("SOGNA_MCP_BRIDGE_PORT", str(ports["mcp_bridge"])))
    origin = f"http://{host}"
    return {
        "host": host,
        "uma_api_port": uma_api,
        "mcp_uma_port": mcp_uma,
        "mcp_bridge_port": mcp_bridge,
        "mcp_uma_sse": f"{origin}:{mcp_uma}/sse",
        "mcp_bridge_sse": f"{origin}:{mcp_bridge}/sse",
    }


ENDPOINTS = load_mcp_endpoints(SOGNA_ROOT)


def append_mcp_token(url: str, *, bridge: bool = False) -> str:
    """SOGNA_MCP_TOKEN en URL del Bridge (?token=) — mcp-remote no envía headers custom."""
    if not bridge:
        return url
    token = os.environ.get("SOGNA_MCP_TOKEN", "").strip()
    if not token:
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}token={quote(token, safe='')}"


UMA_SSE = str(ENDPOINTS["mcp_uma_sse"])
BRIDGE_SSE = append_mcp_token(str(ENDPOINTS["mcp_bridge_sse"]), bridge=True)

CURSOR_CONFIG = Path.home() / ".cursor" / "mcp.json"
CLAUDE_USER_CONFIG = Path.home() / ".claude.json"

# Antigravity IDE (2026) lee config/; antigravity/ es ruta legacy — mantener ambas.
ANTIGRAVITY_CONFIG_PATHS: tuple[Path, ...] = (
    Path.home() / ".gemini" / "config" / "mcp_config.json",
    Path.home() / ".gemini" / "antigravity" / "mcp_config.json",
    Path.home() / ".gemini" / "antigravity-ide" / "mcp_config.json",
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
    sync_ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    meta = {"_sognaSync": sync_ts}
    return {
        "UMA": {"command": command, "args": [*prefix_args, UMA_SSE], **meta},
        "Sognatore": {"command": command, "args": [*prefix_args, BRIDGE_SSE], **meta},
    }


def sogna_portable_entries() -> dict[str, dict]:
    return {
        "UMA": {
            "command": "npx",
            "args": ["-y", "mcp-remote", UMA_SSE],
        },
        "Sognatore": {
            "command": "npx",
            "args": ["-y", "mcp-remote", BRIDGE_SSE],
        },
    }


def use_portable_mcp_entries() -> bool:
    """CI o entornos sin node_modules local — npx mcp-remote."""
    flag = os.environ.get("SOGNA_MCP_PORTABLE", "").strip().lower()
    if flag in ("1", "true", "yes"):
        return True
    if os.environ.get("CI", "").strip().lower() == "true":
        return True
    if os.environ.get("SOGNA_MCP_DOCTOR_CI", "").strip() == "1":
        return True
    return False


def sogna_mcp_entries(sogna_root: Path) -> dict[str, dict]:
    if use_portable_mcp_entries():
        return sogna_portable_entries()
    return sogna_local_entries(sogna_root)


def get_github_token_from_keychain() -> str | None:
    """Intenta recuperar el token de GitHub desde el llavero del sistema o el entorno."""
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "").strip()
    if token and token != "<<VAULT_PROTECTED>>":
        return token
    
    import subprocess
    try:
        proc = subprocess.run(
            ["git", "credential", "fill"],
            input="protocol=https\nhost=github.com\n\n",
            capture_output=True,
            text=True,
            check=True
        )
        for line in proc.stdout.splitlines():
            if line.startswith("password="):
                p = line.split("=", 1)[1].strip()
                if p and p != "<<VAULT_PROTECTED>>":
                    return p
    except Exception:
        pass
    return None


def shared_stdio_entries(git_root: Path, cursor_config: dict) -> dict[str, dict]:
    """filesystem, fetch, github — misma forma que Cursor (stdio/npx)."""
    cursor_servers = cursor_config.get("mcpServers", {})
    entries: dict[str, dict] = {}

    filesystem = cursor_servers.get("filesystem")
    current_paths = []
    if filesystem and isinstance(filesystem.get("args"), list):
        for arg in filesystem["args"]:
            if arg not in ("-y", "@modelcontextprotocol/server-filesystem"):
                current_paths.append(arg)
    
    new_path = workspace_path_for_mcp(git_root)
    if new_path not in current_paths:
        current_paths.append(new_path)

    # Filter out paths that do not exist on the filesystem to prevent server ENOENT crashes
    valid_paths = [p for p in current_paths if Path(p).is_dir()]
    if not valid_paths:
        valid_paths = [new_path]

    entries["filesystem"] = {
        "command": "npx",
        "args": [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            *valid_paths
        ]
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
    github_token = get_github_token_from_keychain()
    if github_token:
        entries["github"] = {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {
                "GITHUB_PERSONAL_ACCESS_TOKEN": github_token,
            },
        }
    elif github:
        entries["github"] = json.loads(json.dumps(github))

    return entries


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8-sig"))


_LEGACY_MCP_REGISTRY_KEYS = ("Sogna", "Sogna" + "_" + "UMA")


def merge_servers(config: dict, entries: dict[str, dict]) -> dict:
    servers = config.setdefault("mcpServers", {})
    servers.update(entries)
    for legacy in _LEGACY_MCP_REGISTRY_KEYS:
        servers.pop(legacy, None)
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
    merge_servers(config, sogna_mcp_entries(sogna_root))
    write_json(project_mcp, config)
    return project_mcp


def build_full_antigravity_config(sogna_root: Path, git_root: Path, cursor_config: dict) -> dict:
    config: dict = {"mcpServers": {}}
    merge_servers(config, shared_stdio_entries(git_root, cursor_config))
    merge_servers(config, sogna_mcp_entries(sogna_root))
    return config


def build_cursor_config(sogna_root: Path, git_root: Path, existing: dict) -> dict:
    config = existing if existing else {"mcpServers": {}}
    merge_servers(config, shared_stdio_entries(git_root, existing))
    merge_servers(config, sogna_mcp_entries(sogna_root))
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
        merge_servers(claude_config, sogna_mcp_entries(SOGNA_ROOT))
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
    mode = "portable (npx)" if use_portable_mcp_entries() else "local (node_modules)"
    servers = sorted(antigravity_payload.get("mcpServers", {}).keys())
    print("MCP sincronizado (UMA :{uma}, Sognatore :{bridge}).".format(
        uma=ENDPOINTS["mcp_uma_port"],
        bridge=ENDPOINTS["mcp_bridge_port"],
    ))
    print(f"mcp-remote ({mode}): {command}")
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
