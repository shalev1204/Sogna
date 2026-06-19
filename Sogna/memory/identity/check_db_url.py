"""Diagnóstico de URI Postgres — no imprime contraseñas."""
import os
import sys
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(__file__))
from load_env import load_sogna_env

load_sogna_env()


def check(key: str) -> None:
    url = os.environ.get(key, "")
    print(f"--- {key} ---")
    if not url:
        print("  MISSING")
        return
    if "[" in url or "]" in url:
        print("  FAIL: corchetes [] — reemplace [PASSWORD] / [PROJECT_REF]")
    if "YOUR" in url.upper():
        print("  FAIL: plantilla YOUR-PASSWORD sin reemplazar")
    p = urlparse(url)
    print(f"  scheme: {p.scheme or 'MISSING'}")
    print(f"  hostname: {p.hostname or 'EMPTY'}")
    print(f"  port: {p.port}")
    print(f"  username: {p.username or 'EMPTY'}")
    print(f"  password_set: {bool(p.password)}")
    if not p.scheme.startswith("postgres"):
        print("  FAIL: debe empezar por postgresql://")
    if not p.hostname:
        print("  FAIL: hostname vacío")


if __name__ == "__main__":
    for k in ("SUPABASE_DB_URL", "SUPABASE_DB_DIRECT_URL"):
        check(k)
