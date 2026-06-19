"""
Abstracción del almacén vectorial UMA.
Objetivo (Sogna Core F0): Supabase Postgres + pgvector.
Legacy: Chroma local hasta configurar SUPABASE_DB_URL.
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
TABLE_NAME = "uma_embeddings"

try:
    from load_env import load_sogna_env

    load_sogna_env()
except ImportError:
    pass


def load_registry() -> dict[str, Any]:
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_provider() -> str:
    explicit = os.environ.get("SOGNA_VECTOR_PROVIDER", "").strip().lower()
    if explicit in ("supabase", "supabase_pgvector", "pgvector"):
        return "supabase"
    if explicit == "chroma":
        return "chroma"

    registry = load_registry()
    cfg = registry.get("vector_store", {})
    target = str(cfg.get("provider", cfg.get("target_provider", "auto"))).lower()
    if target in ("supabase", "supabase_pgvector", "pgvector"):
        return "supabase"
    if target == "chroma":
        return "chroma"

    if os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL"):
        return "supabase"
    return "chroma"


def _embed_texts(texts: list[str]) -> list[list[float]]:
    from chromadb.utils import embedding_functions

    fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
    return fn(texts)


def _chroma_paths() -> tuple[str, str]:
    registry = load_registry()
    cfg = registry.get("vector_store", {})
    rel = cfg.get("path", "operational/vectors/chroma")
    collection = cfg.get("collection", "uma_core")
    return os.path.join(MEMORY_ROOT, rel.replace("\\", "/")), collection


def chroma_upsert(ids: list[str], documents: list[str], metadatas: list[dict[str, Any]]) -> int:
    import chromadb
    from chromadb.utils import embedding_functions

    db_path, collection_name = _chroma_paths()
    os.makedirs(db_path, exist_ok=True)
    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
    collection = client.get_or_create_collection(name=collection_name, embedding_function=emb_fn)

    batch_size = 50
    for i in range(0, len(documents), batch_size):
        collection.upsert(
            documents=documents[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
            ids=ids[i : i + batch_size],
        )
    return len(documents)


def chroma_query(text: str, n_results: int = 3) -> list[dict[str, Any]]:
    import chromadb
    from chromadb.utils import embedding_functions

    db_path, collection_name = _chroma_paths()
    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
    collection = client.get_collection(name=collection_name, embedding_function=emb_fn)
    results = collection.query(query_texts=[text], n_results=n_results)

    rows: list[dict[str, Any]] = []
    if not results["ids"] or not results["ids"][0]:
        return rows

    for i in range(len(results["ids"][0])):
        path_val = results["metadatas"][0][i].get("path", results["ids"][0][i])
        dist = float(results["distances"][0][i])
        rows.append(
            {
                "id": results["ids"][0][i],
                "path": str(path_val).replace("\\", "/"),
                "content": results["documents"][0][i],
                "distance": dist,
                "similarity": 1.0 - dist,
            }
        )
    return rows


def _db_url() -> str:
    from supabase_schema import runtime_db_url

    url = runtime_db_url()
    if not url:
        raise RuntimeError("SUPABASE_DB_URL o DATABASE_URL requerido para provider supabase")
    return url


def _supabase_connect():
    from supabase_schema import connect_postgres

    return connect_postgres(_db_url())


def supabase_ensure_schema() -> None:
    from supabase_schema import run_schema

    run_schema()


def _supabase_upsert_batch(
    cur: Any,
    batch_ids: list[str],
    batch_docs: list[str],
    batch_meta: list[dict[str, Any]],
    batch_emb: list[list[float]],
) -> None:
    for doc_id, doc, meta, emb in zip(batch_ids, batch_docs, batch_meta, batch_emb):
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
            (
                doc_id,
                meta.get("path", doc_id),
                meta.get("layer"),
                doc,
                meta.get("size", len(doc)),
                emb,
            ),
        )


def supabase_upsert(ids: list[str], documents: list[str], metadatas: list[dict[str, Any]]) -> int:
    supabase_ensure_schema()
    embeddings = _embed_texts(documents)
    batch_size = 50

    with _supabase_connect() as conn:
        with conn.cursor() as cur:
            for i in range(0, len(documents), batch_size):
                _supabase_upsert_batch(
                    cur,
                    ids[i : i + batch_size],
                    documents[i : i + batch_size],
                    metadatas[i : i + batch_size],
                    embeddings[i : i + batch_size],
                )
    return len(documents)


def supabase_query(text: str, n_results: int = 3) -> list[dict[str, Any]]:
    supabase_ensure_schema()
    query_emb = _embed_texts([text])[0]

    with _supabase_connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, path, content,
                       (embedding <=> %s::vector) AS distance
                FROM {TABLE_NAME}
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_emb, query_emb, n_results),
            )
            rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "path": str(r[1]).replace("\\", "/"),
            "content": r[2],
            "distance": float(r[3]),
            "similarity": max(0.0, 1.0 - float(r[3])),
        }
        for r in rows
    ]


def upsert(ids: list[str], documents: list[str], metadatas: list[dict[str, Any]]) -> int:
    provider = resolve_provider()
    if provider == "supabase":
        return supabase_upsert(ids, documents, metadatas)
    if provider == "chroma":
        print(
            "[vector_store] Chroma legacy activo — configure SUPABASE_DB_URL para pgvector.",
            file=sys.stderr,
        )
        return chroma_upsert(ids, documents, metadatas)
    raise RuntimeError("vector provider desconocido: " + provider)


def query(text: str, n_results: int = 3) -> list[dict[str, Any]]:
    provider = resolve_provider()
    if provider == "supabase":
        return supabase_query(text, n_results)
    if provider == "chroma":
        return chroma_query(text, n_results)
    raise RuntimeError("vector provider desconocido: " + provider)


def is_ready() -> tuple[bool, str]:
    provider = resolve_provider()
    if provider == "supabase":
        try:
            with _supabase_connect() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
                    count = cur.fetchone()[0]
            if count < 1:
                return False, f"supabase pgvector: tabla vacía ({TABLE_NAME})"
            return True, f"supabase pgvector: {count} documentos"
        except Exception as e:
            return False, f"supabase pgvector: {e}"

    db_path, _ = _chroma_paths()
    sqlite = os.path.join(db_path, "chroma.sqlite3")
    if not os.path.exists(sqlite):
        return False, "chroma.sqlite3 ausente"
    size = os.path.getsize(sqlite)
    if size < 4096:
        return False, "chroma.sqlite3 vacío o corrupto"
    return True, f"chroma legacy ({round(size / 1024)} KB) — migrar a SUPABASE_DB_URL"


if __name__ == "__main__":
    ok, detail = is_ready()
    print(f"provider={resolve_provider()} ready={ok} {detail}")
