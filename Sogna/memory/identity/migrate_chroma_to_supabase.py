"""
Migración Chroma → Supabase pgvector.
Reutiliza embeddings existentes en Chroma (sin re-calcular).
Si Chroma está vacío, reindexa desde archivos memory/.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from load_env import load_sogna_env  # noqa: E402

load_sogna_env()

# Forzar destino Supabase durante la migración
os.environ.setdefault("SOGNA_VECTOR_PROVIDER", "supabase")

from supabase_probe import probe  # noqa: E402
from supabase_schema import TABLE_NAME, run_schema  # noqa: E402
from vector_store import (  # noqa: E402
    _chroma_paths,
    _supabase_connect,
    chroma_query,
    resolve_provider,
    supabase_query,
)


def chroma_export() -> tuple[list[str], list[str], list[dict], list[list[float]]]:
    import chromadb
    from chromadb.utils import embedding_functions

    db_path, collection_name = _chroma_paths()
    sqlite = os.path.join(db_path, "chroma.sqlite3")
    if not os.path.exists(sqlite):
        return [], [], [], []

    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    try:
        collection = client.get_collection(name=collection_name, embedding_function=emb_fn)
    except Exception:
        return [], [], [], []

    data = collection.get(include=["documents", "metadatas", "embeddings"])
    ids = data.get("ids") or []
    if not ids:
        return [], [], [], []

    documents = data.get("documents") or [""] * len(ids)
    metadatas = data.get("metadatas") or [{}] * len(ids)
    embeddings = data.get("embeddings")
    if embeddings is None:
        embeddings = emb_fn(documents)

    return ids, documents, metadatas, embeddings


def supabase_batch_upsert(
    ids: list[str],
    documents: list[str],
    metadatas: list[dict],
    embeddings: list[list[float]],
    batch_size: int = 50,
) -> int:
    total = 0
    with _supabase_connect() as conn:
        with conn.cursor() as cur:
            for i in range(0, len(ids), batch_size):
                batch_ids = ids[i : i + batch_size]
                batch_docs = documents[i : i + batch_size]
                batch_meta = metadatas[i : i + batch_size]
                batch_emb = embeddings[i : i + batch_size]
                for doc_id, doc, meta, emb in zip(batch_ids, batch_docs, batch_meta, batch_emb):
                    path_val = (meta or {}).get("path", doc_id)
                    layer_val = (meta or {}).get("layer")
                    size_val = (meta or {}).get("size", len(doc) if doc else 0)
                    cur.execute(
                        f"""
                        INSERT INTO {TABLE_NAME} (id, path, layer, content, size, embedding, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (id) DO UPDATE SET
                          path = EXCLUDED.path,
                          layer = EXCLUDED.layer,
                          content = EXCLUDED.content,
                          size = EXCLUDED.size,
                          embedding = EXCLUDED.embedding,
                          updated_at = NOW()
                        """,
                        (doc_id, path_val, layer_val, doc, size_val, emb),
                    )
                total += len(batch_ids)
                print(f"  upserted {total}/{len(ids)}...", file=sys.stderr)
    return total


def verify_parity(sample_query: str = "estado proyecto Sogna") -> bool:
    chroma_hits = []
    try:
        os.environ["SOGNA_VECTOR_PROVIDER"] = "chroma"
        chroma_hits = chroma_query(sample_query, n_results=3)
    except Exception as e:
        print(f"  [warn] Chroma query skip: {e}", file=sys.stderr)

    os.environ["SOGNA_VECTOR_PROVIDER"] = "supabase"
    supa_hits = supabase_query(sample_query, n_results=3)

    if not supa_hits:
        print("  [fail] Supabase recall vacío tras migración", file=sys.stderr)
        return False

    print("  Supabase top hits:")
    for h in supa_hits:
        print(f"    - {h['path']} ({h['similarity']:.2%})")

    if chroma_hits:
        chroma_paths = {h["path"] for h in chroma_hits}
        supa_paths = {h["path"] for h in supa_hits}
        overlap = chroma_paths & supa_paths
        print(f"  Overlap top-3 Chroma/Supabase: {len(overlap)}/3")
    return True


def migrate(force_reindex: bool = False) -> int:
    if resolve_provider() != "supabase":
        print("[FAIL] SOGNA_VECTOR_PROVIDER debe ser supabase o tener SUPABASE_DB_URL", file=sys.stderr)
        return 1

    print("[1/4] Aplicando esquema en Supabase...")
    try:
        run_schema()
    except Exception as e:
        print(f"[FAIL] Esquema: {e}", file=sys.stderr)
        return 1

    ids, documents, metadatas, embeddings = chroma_export()
    count = len(ids)

    if count == 0 or force_reindex:
        print("[2/4] Chroma vacío o --force-reindex — indexando desde memory/...")
        from index_uma import index_all  # noqa: E402

        indexed = index_all()
        print(f"[OK] Reindexados {indexed} documentos en Supabase")
    else:
        print(f"[2/4] Exportando {count} documentos desde Chroma (embeddings incluidos)...")
        written = supabase_batch_upsert(ids, documents, metadatas, embeddings)
        print(f"[OK] Migrados {written} documentos a Supabase")

    print("[3/4] Verificando conteo...")
    r = probe()
    if not r["ok"]:
        print(f"[FAIL] Probe post-migración: {r}", file=sys.stderr)
        return 1
    print(f"  filas en {TABLE_NAME}: {r['row_count']}")

    print("[4/4] Smoke test semantic recall...")
    if not verify_parity():
        return 1

    print("[OK] Migracion Chroma -> Supabase completada")
    print("Siguiente: reinicie MCP (pnpm sogna:off && pnpm sogna:on) y ejecute pnpm mcp:uma-recall")
    return 0


def main() -> int:
    force = "--force-reindex" in sys.argv
    return migrate(force_reindex=force)


if __name__ == "__main__":
    raise SystemExit(main())
