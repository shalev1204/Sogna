"""Conexión Postgres Supabase y aplicación del esquema UMA."""
from __future__ import annotations

import os

from load_env import load_sogna_env

load_sogna_env()

TABLE_NAME = "uma_embeddings"


def migration_db_url() -> str:
    return (
        os.environ.get("SUPABASE_DB_DIRECT_URL")
        or os.environ.get("SUPABASE_DB_URL")
        or os.environ.get("DATABASE_URL")
        or ""
    )


def runtime_db_url() -> str:
    return os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL") or migration_db_url()


def connect_postgres(url: str | None = None):
    import psycopg
    from pgvector.psycopg import register_vector

    db_url = url or migration_db_url()
    if not db_url:
        raise RuntimeError("SUPABASE_DB_URL o SUPABASE_DB_DIRECT_URL requerido")
    conn = psycopg.connect(db_url, autocommit=True)
    register_vector(conn)
    return conn


def _sql_statements(sql: str) -> list[str]:
    lines = []
    for line in sql.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        lines.append(line)
    body = "\n".join(lines)
    return [s.strip() for s in body.split(";") if s.strip()]


def run_schema() -> None:
    base = os.path.dirname(__file__)
    migration = os.path.join(base, "migrations", "001_uma_vectors.sql")
    with open(migration, "r", encoding="utf-8") as f:
        sql = f.read()

    statements = _sql_statements(sql)
    with connect_postgres(migration_db_url()) as conn:
        with conn.cursor() as cur:
            for stmt in statements:
                cur.execute(stmt + ";")
