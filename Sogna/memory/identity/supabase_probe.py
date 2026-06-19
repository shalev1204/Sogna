"""
Verificación Supabase Postgres + pgvector para UMA.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from load_env import load_sogna_env  # noqa: E402

load_sogna_env()

from supabase_schema import TABLE_NAME, connect_postgres, migration_db_url, run_schema  # noqa: E402
from vector_store import resolve_provider  # noqa: E402


def probe() -> dict:
    report = {
        "provider": resolve_provider(),
        "env": {
            "SUPABASE_URL": bool(os.environ.get("SUPABASE_URL")),
            "SUPABASE_ANON_KEY": bool(os.environ.get("SUPABASE_ANON_KEY")),
            "SUPABASE_SERVICE_ROLE_KEY": bool(os.environ.get("SUPABASE_SERVICE_ROLE_KEY")),
            "SUPABASE_DB_URL": bool(os.environ.get("SUPABASE_DB_URL")),
            "SUPABASE_DB_DIRECT_URL": bool(os.environ.get("SUPABASE_DB_DIRECT_URL")),
        },
        "ok": False,
        "pgvector": False,
        "table_exists": False,
        "row_count": 0,
        "errors": [],
    }

    if not migration_db_url():
        report["errors"].append("Falta SUPABASE_DB_URL (o SUPABASE_DB_DIRECT_URL)")
        return report

    try:
        with connect_postgres(migration_db_url()) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')"
                )
                report["pgvector"] = bool(cur.fetchone()[0])

                cur.execute(
                    """
                    SELECT EXISTS (
                      SELECT 1 FROM information_schema.tables
                      WHERE table_schema = 'public' AND table_name = %s
                    )
                    """,
                    (TABLE_NAME,),
                )
                report["table_exists"] = bool(cur.fetchone()[0])

                if report["table_exists"]:
                    cur.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
                    report["row_count"] = int(cur.fetchone()[0])

        report["ok"] = report["pgvector"] and report["table_exists"]
    except Exception as e:
        report["errors"].append(str(e))

    return report


def main() -> int:
    action = (sys.argv[1] if len(sys.argv) > 1 else "probe").lower()

    if action == "schema":
        try:
            run_schema()
            print("[OK] Esquema UMA aplicado en Supabase")
            return 0
        except Exception as e:
            print(f"[FAIL] Esquema: {e}", file=sys.stderr)
            print(
                "Sugerencia: use SUPABASE_DB_DIRECT_URL (Session/Direct, puerto 5432) para DDL.",
                file=sys.stderr,
            )
            return 1

    if action == "probe":
        r = probe()
        print(f"provider={r['provider']}")
        for k, v in r["env"].items():
            print(f"  {k}: {'set' if v else 'missing'}")
        print(f"pgvector_extension={r['pgvector']}")
        print(f"table_{TABLE_NAME}={r['table_exists']}")
        print(f"row_count={r['row_count']}")
        if r["errors"]:
            for err in r["errors"]:
                print(f"error: {err}", file=sys.stderr)
        if r["ok"]:
            print(f"[OK] Supabase listo — {r['row_count']} filas en {TABLE_NAME}")
            return 0
        print("[FAIL] Supabase no listo — ejecute: pnpm supabase:schema", file=sys.stderr)
        return 1

    print("Usage: python supabase_probe.py [probe|schema]", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
