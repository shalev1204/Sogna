"""Carga .env desde la raíz Sogna (sin sobrescribir variables ya definidas)."""
from __future__ import annotations

import os

SOGNA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_PATH = os.path.join(SOGNA_ROOT, ".env")


def load_sogna_env() -> bool:
    if not os.path.isfile(ENV_PATH):
        return False
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    return True
