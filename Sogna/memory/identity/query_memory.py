import os
import json
import sys
import chromadb
from chromadb.utils import embedding_functions

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def load_config():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def query(text, n_results=3):
    config = load_config()
    db_config = config.get("vector_store", {})
    db_path = os.path.join(MEMORY_ROOT, db_config.get("path"))
collection_name = db_config.get("collection")

    client = chromadb.PersistentClient(path=db_path)
emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = client.get_collection(name=collection_name, embedding_function=emb_fn)

    print(f"--- SOGNA SEMANTIC QUERY: '{text}' ---")
    results = collection.query(
        query_texts=[text],
        n_results=n_results
    )

    for i in range(len(results['ids'][0])):
        path = results['ids'][0][i]
        distance = results['distances'][0][i]
        print(f"\n[Match {i+1}] Path: {path} (Distance: {distance:.4f})")
# Print snippet (cleaning non-ascii for console)
        snippet = results['documents'][0][i][:200].replace('\n', ' ')
        clean_snippet = snippet.encode('ascii', 'ignore').decode('ascii')
        print(f"Snippet: {clean_snippet}...")

if _name_ == "_main_":
    if len(sys.argv) > 1:
        query_text = " ".join(sys.argv[1:])
        query(query_text)
    else:
        print("Usage: python query_memory.py \"your search term\"")
