import os
import json
import sys

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")


def load_config():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def query(text, n_results=3):
    """Simple vector-only search against ChromaDB. For hybrid search, use query_uma.py."""
    try:
        import chromadb
        from chromadb.utils import embedding_functions
    except ImportError:
        print("Error: chromadb or sentence-transformers not installed.", file=sys.stderr)
        return

    config = load_config()
    db_config = config.get("vector_store", {})
    db_path = os.path.join(MEMORY_ROOT, db_config.get("path", "operational/vectors/chroma"))
    collection_name = db_config.get("collection", "uma_core")

    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    try:
        collection = client.get_collection(name=collection_name, embedding_function=emb_fn)
    except Exception as e:
        print("Error: Collection '" + collection_name + "' not found. Run index_uma.py first.", file=sys.stderr)
        return

    print("--- SOGNA SEMANTIC QUERY: '" + text + "' ---")
    results = collection.query(
        query_texts=[text],
        n_results=n_results
    )

    if not results['ids'][0]:
        print("No results found.")
        return

    for i in range(len(results['ids'][0])):
        path_val = results['ids'][0][i]
        distance = results['distances'][0][i]
        match_pct = "{:.2%}".format(1 - distance)
        print("\n[Match " + str(i + 1) + "] Path: " + path_val + " (Similarity: " + match_pct + ")")
        snippet = results['documents'][0][i][:300].replace('\n', ' ')
        # Safe console output
        clean_snippet = snippet.encode('ascii', 'ignore').decode('ascii')
        print("Snippet: " + clean_snippet + "...")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query_text = " ".join(sys.argv[1:])
        query(query_text)
    else:
        print("Usage: python query_memory.py \"your search term\"")
