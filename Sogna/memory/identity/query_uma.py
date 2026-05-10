import os
import json
import chromadb
from chromadb.utils import embedding_functions
import sys
import io

# Fix Windows console encoding issues
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")

def query_hybrid(text, n_results=3):
    # 1. VECTORIAL SEARCH (NEURAL)
    db_path = os.path.join(MEMORY_ROOT, "operational", "vectors", "chroma")
    client = chromadb.PersistentClient(path=db_path)
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_collection(name="uma_core", embedding_function=emb_fn)

    results = collection.query(query_texts=[text], n_results=n_results)
    
    print(f"--- SOGNA HYBRID ORACLE (GraphRAG): '{text}' ---\n")
    
    found_nodes = []
    
    print(">> [PHASE 1: SEMANTIC RETRIEVAL]")
    for i in range(len(results['documents'][0])):
        path = results['metadatas'][0][i]['path'].replace('\\', '/')
        dist = results['distances'][0][i]
        print(f" - Found: {path} (Match: {1-dist:.2%})")
        found_nodes.append(path)

    # 2. GRAPH TRAVERSAL (SYMBOLIC)
    print("\n>> [PHASE 2: KNOWLEDGE GRAPH EXPANSION]")
    if os.path.exists(GRAPH_PATH):
        with open(GRAPH_PATH, 'r') as f:
            graph = json.load(f)
        
        expanded_context = []
        for path in found_nodes:
            # Find node in graph that matches this path (relative to memory/)
            node = next((n for n in graph['nodes'] if n.get('path', '').endswith(path)), None)
            if node:
                # Find its connections
                for edge in graph['edges']:
                    if edge['source'] == node['id']:
                        target_node = next((n for n in graph['nodes'] if n['id'] == edge['target']), None)
                        if target_node:
                            relation = f" -> [{edge['relation']}] -> {target_node['label']} ({target_node['id']})"
                            if relation not in expanded_context:
                                expanded_context.append(relation)
                    elif edge['target'] == node['id']:
                        source_node = next((n for n in graph['nodes'] if n['id'] == edge['source']), None)
                        if source_node:
                            relation = f" <- [{edge['relation']}] <- {source_node['label']} ({source_node['id']})"
                            if relation not in expanded_context:
                                expanded_context.append(relation)

        if expanded_context:
            for rel in expanded_context:
                print(f" + Related Concept: {rel}")
        else:
            print(" + No graph connections found for these results.")
    else:
        print(" + Graph not found. Skipping expansion.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query_hybrid(' '.join(sys.argv[1:]))
    else:
        print("Usage: python query_uma.py <search_query>")
