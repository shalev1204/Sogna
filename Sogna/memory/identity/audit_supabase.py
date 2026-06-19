"""Auditoría profunda del cambio Chroma → Supabase pgvector."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from load_env import load_sogna_env
load_sogna_env()

from vector_store import resolve_provider, is_ready, query, chroma_query, _chroma_paths
from supabase_probe import probe
from supabase_schema import TABLE_NAME, migration_db_url, connect_postgres

PASS = "[OK]  "
FAIL = "[FAIL]"
WARN = "[WARN]"

results = []


def check(label, ok, detail=""):
    sym = PASS if ok else FAIL
    msg = f"{sym} {label}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    results.append((ok, label, detail))
    return ok


# ── 1. Provider resolution ───────────────────────────────────────────────────
print("\n═══ 1. Provider resolution ══════════════════════════")
prov = resolve_provider()
check("Provider activo es supabase", prov == "supabase", f"got: {prov}")

env_url = os.environ.get("SUPABASE_DB_URL", "")
env_direct = os.environ.get("SUPABASE_DB_DIRECT_URL", "")
check("SUPABASE_DB_URL configurada", bool(env_url))
check("SUPABASE_DB_DIRECT_URL configurada", bool(env_direct))
check("SOGNA_VECTOR_PROVIDER en entorno", os.environ.get("SOGNA_VECTOR_PROVIDER", "auto") in ("supabase", "auto"),
      f"value={os.environ.get('SOGNA_VECTOR_PROVIDER','auto')}")

# ── 2. Supabase schema ───────────────────────────────────────────────────────
print("\n═══ 2. Esquema Supabase pgvector ═════════════════════")
r = probe()
check("Extensión pgvector instalada", r["pgvector"])
check(f"Tabla {TABLE_NAME} existe", r["table_exists"])
check("Documentos indexados > 0", r["row_count"] > 0, f"{r['row_count']} filas")
check("Sin errores de conexión", len(r["errors"]) == 0, "; ".join(r["errors"]) or "limpio")

# ── 3. Schema integrity ──────────────────────────────────────────────────────
print("\n═══ 3. Integridad del esquema SQL ════════════════════")
try:
    with connect_postgres(migration_db_url()) as conn:
        with conn.cursor() as cur:
            # Columnas esperadas
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (TABLE_NAME,))
            cols = {row[0]: row[1] for row in cur.fetchall()}
            expected = {"id", "path", "layer", "content", "size", "embedding", "updated_at"}
            missing = expected - cols.keys()
            check("Todas las columnas presentes", len(missing) == 0,
                  f"missing={missing}" if missing else f"cols={list(cols.keys())}")

            # Índices
            cur.execute("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = %s AND schemaname = 'public'
            """, (TABLE_NAME,))
            idxs = {row[0] for row in cur.fetchall()}
            check("Índice por path existe", any("path" in i for i in idxs), str(idxs))
            check("Índice por layer existe", any("layer" in i for i in idxs), str(idxs))

            # Distribución de layers
            cur.execute(f"SELECT layer, COUNT(*) FROM {TABLE_NAME} GROUP BY layer ORDER BY COUNT(*) DESC")
            layers = cur.fetchall()
            print(f"  Distribución por layer:")
            for layer, cnt in layers:
                print(f"    {str(layer).ljust(30)} {cnt}")
            check("Al menos 2 layers indexados", len(layers) >= 2, f"{len(layers)} layers")

            # Vectores no nulos
            cur.execute(f"SELECT COUNT(*) FROM {TABLE_NAME} WHERE embedding IS NULL")
            nullvec = cur.fetchone()[0]
            check("Sin vectores nulos", nullvec == 0, f"{nullvec} nullos")

            # Dimensión del embedding
            cur.execute(f"SELECT vector_dims(embedding) FROM {TABLE_NAME} LIMIT 1")
            dims = cur.fetchone()
            check("Dimensión embedding = 384", dims and dims[0] == 384,
                  f"dims={dims[0] if dims else 'N/A'}")
except Exception as e:
    check("Conexión directa para auditoría", False, str(e))

# ── 4. Recall semántico ──────────────────────────────────────────────────────
print("\n═══ 4. Recall semántico (5 consultas) ════════════════")
test_queries = [
    ("identidad Sogna",          "identity"),
    ("Sognatore MCP bootstrap",  "identity"),
    ("Sentinel seguridad veto",  "identity"),
    ("infraestructura supabase", "identity"),
    ("memoria episodica",        "intelligence"),
]
for q, expected_layer in test_queries:
    try:
        hits = query(q, n_results=3)
        ok_hit = len(hits) > 0
        top_path = hits[0]["path"] if hits else "—"
        sim = hits[0]["similarity"] if hits else 0
        check(f"Recall: '{q}'", ok_hit, f"top={top_path} ({sim:.0%})")
    except Exception as e:
        check(f"Recall: '{q}'", False, str(e))

# ── 5. is_ready() desde vector_store ────────────────────────────────────────
print("\n═══ 5. vector_store.is_ready() ═══════════════════════")
ok, detail = is_ready()
check("is_ready() == True", ok, detail)

# ── 6. Chroma legacy offline ─────────────────────────────────────────────────
print("\n═══ 6. Chroma legacy — estado ════════════════════════")
db_path, _ = _chroma_paths()
sqlite = os.path.join(db_path, "chroma.sqlite3")
chroma_present = os.path.exists(sqlite)
print(f"  Chroma sqlite3 presente: {chroma_present} ({db_path})")
if chroma_present:
    size = os.path.getsize(sqlite)
    print(f"  Tamaño: {round(size/1024)} KB  (legacy — no usada en runtime)")

check("Chroma NO es el provider activo", prov != "chroma")
os.environ["SOGNA_VECTOR_PROVIDER"] = "chroma"
prov_forced = resolve_provider()
os.environ["SOGNA_VECTOR_PROVIDER"] = "supabase"
check("Forzar chroma funciona (fallback aislado)", prov_forced == "chroma")

# ── 7. Archivos core presentes ───────────────────────────────────────────────
print("\n═══ 7. Archivos core presentes ═══════════════════════")
base = os.path.dirname(__file__)
files = {
    "vector_store.py":             os.path.join(base, "vector_store.py"),
    "supabase_schema.py":          os.path.join(base, "supabase_schema.py"),
    "supabase_probe.py":           os.path.join(base, "supabase_probe.py"),
    "migrate_chroma_to_supabase.py": os.path.join(base, "migrate_chroma_to_supabase.py"),
    "load_env.py":                 os.path.join(base, "load_env.py"),
    "001_uma_vectors.sql":         os.path.join(base, "migrations", "001_uma_vectors.sql"),
    "index_uma.py":                os.path.join(base, "index_uma.py"),
    "query_memory.py":             os.path.join(base, "query_memory.py"),
    "query_uma.py":                os.path.join(base, "query_uma.py"),
    "uma_server.py":               os.path.join(base, "uma_server.py"),
    "mcp_uma_server.py":           os.path.join(base, "mcp_uma_server.py"),
}
for name, path in files.items():
    check(f"Presente: {name}", os.path.exists(path))

# ── Resumen ───────────────────────────────────────────────────────────────────
print("\n═══ RESUMEN ══════════════════════════════════════════")
passed = sum(1 for ok, _, _ in results if ok)
failed = sum(1 for ok, _, _ in results if not ok)
total = len(results)
print(f"  {passed}/{total} checks OK  |  {failed} fallos")
if failed:
    print("\n  Fallos:")
    for ok, label, detail in results:
        if not ok:
            print(f"    {FAIL} {label}: {detail}")
else:
    print("  TODOS LOS CHECKS PASARON")
sys.exit(0 if failed == 0 else 1)
