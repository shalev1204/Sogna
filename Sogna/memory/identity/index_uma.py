import os
import json
import sys

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")


def load_config():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def index_all():
    print("--- SOGNA SEMANTIC INDEXER (ChromaDB) ---")

    try:
        import chromadb
        from chromadb.utils import embedding_functions
    except ImportError:
        print("Error: chromadb or sentence-transformers not installed.", file=sys.stderr)
        return 0

    config = load_config()
    db_config = config.get("vector_store", {})
    db_path = os.path.join(MEMORY_ROOT, db_config.get("path", "operational/vectors/chroma"))
    collection_name = db_config.get("collection", "uma_core")

    os.makedirs(db_path, exist_ok=True)

    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_or_create_collection(name=collection_name, embedding_function=emb_fn)

    documents = []
    metadatas = []
    ids = []

    # Folders to index: all relevant memory layers
    target_dirs = [
        "identity",
        "intelligence/semantic",
        "intelligence/semantic/knowledge",
        "intelligence/episodic",
        "intelligence/events",
        "designs",
        "docs"
    ]

    for t_dir in target_dirs:
        abs_t_dir = os.path.join(MEMORY_ROOT, t_dir)
        if not os.path.exists(abs_t_dir):
            continue

        print("Indexing directory: " + t_dir + "...")
        for root, dirs, files in os.walk(abs_t_dir):
            for file in files:
                if file.endswith(('.md', '.txt', '.csv')):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, MEMORY_ROOT)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        if content.strip() and len(content) > 10:
                            # Truncate very large files to avoid embedding issues
                            if len(content) > 10000:
                                content = content[:10000]

                            documents.append(content)
                            metadatas.append({
                                "path": rel_path.replace("\\", "/"),
                                "layer": t_dir.split('/')[0],
                                "size": len(content)
                            })
                            ids.append(rel_path.replace("\\", "/"))
                    except Exception as e:
                        print("  Error reading " + rel_path + ": " + str(e))

    if documents:
        print("Upserting " + str(len(documents)) + " documents to ChromaDB...")
        # Batch upsert (ChromaDB handles large batches internally)
        batch_size = 50
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i + batch_size]
            batch_meta = metadatas[i:i + batch_size]
            batch_ids = ids[i:i + batch_size]
            collection.upsert(
                documents=batch_docs,
                metadatas=batch_meta,
                ids=batch_ids
            )
        print("Indexing complete: " + str(len(documents)) + " documents indexed.")
    else:
        print("No content found to index.")

    return len(documents)


if __name__ == "__main__":
    index_all()
