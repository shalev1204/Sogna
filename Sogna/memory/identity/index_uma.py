import os
import json
import chromadb
from chromadb.utils import embedding_functions

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def load_config():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def index_all():
    print("--- SOGNA SEMANTIC INDEXER (ChromaDB) ---")
    config = load_config()
    db_config = config.get("vector_store", {})
    db_path = os.path.join(MEMORY_ROOT, db_config.get("path", "operational/vectors/chroma"))
    collection_name = db_config.get("collection", "uma_core")

    # Create storage dir if not exists
    os.makedirs(db_path, exist_ok=True)

    # Setup Chroma Client
    client = chromadb.PersistentClient(path=db_path)
    
    # Use local embedding function (Sentence Transformers)
    # This runs locally and is free.
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    collection = client.get_or_create_collection(name=collection_name, embedding_function=emb_fn)

    documents = []
    metadatas = []
    ids = []
    count = 0

    # Folders to index (Semantic & Identity primarily)
    target_dirs = ["identity", "intelligence/semantic", "intelligence/episodic", "designs", "docs"]

    for t_dir in target_dirs:
        abs_t_dir = os.path.join(MEMORY_ROOT, t_dir)
        if not os.path.exists(abs_t_dir):
            continue
            
        print(f"Indexing directory: {t_dir}...")
        for root, dirs, files in os.walk(abs_t_dir):
            for file in files:
                if file.endswith(('.md', '.txt', '.csv')):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, MEMORY_ROOT)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Only index if not empty
                        if content.strip():
                            documents.append(content)
                            metadatas.append({"path": rel_path, "layer": t_dir.split('/')[0]})
                            ids.append(rel_path)
                            count += 1
                    except Exception as e:
                        print(f"Error reading {rel_path}: {e}")

    if documents:
        print(f"Upserting {len(documents)} documents to ChromaDB...")
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print("Indexing complete.")
    else:
        print("No content found to index.")

if __name__ == "__main__":
    index_all()
