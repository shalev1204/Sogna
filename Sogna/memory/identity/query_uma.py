import os
import json
import sys
import io
from contextlib import redirect_stdout

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")


def query_hybrid(text, n_results=3):
    """
    Sogna Hybrid Oracle (GraphRAG)
    Two-phase retrieval combining vectorial search with knowledge graph expansion.
    Strategy A: Vector path matching from ChromaDB results.
    Strategy B: Tokenized label/description search across all graph nodes.
    """
    output_lines = []

    def capture_print(msg):
        print(msg, file=sys.stderr)
        output_lines.append(msg)

    with redirect_stdout(sys.stderr):
        # Phase 1: VECTORIAL SEARCH (NEURAL)
        try:
            import chromadb
            from chromadb.utils import embedding_functions

            db_path = os.path.join(MEMORY_ROOT, "operational", "vectors", "chroma")
            client = chromadb.PersistentClient(path=db_path)
            emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
            collection = client.get_collection(name="uma_core", embedding_function=emb_fn)

            results = collection.query(query_texts=[text], n_results=n_results)

            capture_print("--- SOGNA HYBRID ORACLE (GraphRAG): '" + text + "' ---\n")

            found_nodes = []

            capture_print(">> [PHASE 1: SEMANTIC RETRIEVAL]")
            for i in range(len(results['documents'][0])):
                path_val = results['metadatas'][0][i].get('path', 'unknown').replace('\\', '/')
                dist = results['distances'][0][i]
                match_pct = "{:.2%}".format(1 - dist)
                capture_print(" - Found: " + path_val + " (Match: " + match_pct + ")")
                found_nodes.append(path_val)
        except Exception as e:
            capture_print("--- SOGNA HYBRID ORACLE (GraphRAG): '" + text + "' ---\n")
            capture_print(">> [PHASE 1: SEMANTIC RETRIEVAL]")
            capture_print(" - Vector search unavailable: " + str(e))
            found_nodes = []

        # Phase 2: KNOWLEDGE GRAPH EXPANSION (SYMBOLIC)
        capture_print("\n>> [PHASE 2: KNOWLEDGE GRAPH EXPANSION]")
        if os.path.exists(GRAPH_PATH):
            with open(GRAPH_PATH, 'r', encoding='utf-8') as f:
                graph = json.load(f)

            nodes = graph.get('nodes', [])
            edges = graph.get('edges', [])

            # Strategy A: Expand from vector search results
            expanded_context = []
            for found_path in found_nodes:
                matching_node = next(
                    (n for n in nodes if n.get('path', '').replace('\\', '/').endswith(found_path)),
                    None
                )
                if matching_node:
                    for edge in edges:
                        if edge['source'] == matching_node['id']:
                            target = next((n for n in nodes if n['id'] == edge['target']), None)
                            if target:
                                rel = " -> [" + edge['relation'] + "] -> " + target['label'] + " (" + target['type'] + ")"
                                if rel not in expanded_context:
                                    expanded_context.append(rel)
                        elif edge['target'] == matching_node['id']:
                            source = next((n for n in nodes if n['id'] == edge['source']), None)
                            if source:
                                rel = " <- [" + edge['relation'] + "] <- " + source['label'] + " (" + source['type'] + ")"
                                if rel not in expanded_context:
                                    expanded_context.append(rel)

            # Strategy B: Tokenized label/description search (multi-word support)
            query_lower = text.lower()
            # Split into tokens, filter out stop words and short tokens
            stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'for',
                          'of', 'and', 'or', 'not', 'with', 'by', 'from', 'that', 'this',
                          'el', 'la', 'los', 'las', 'de', 'del', 'en', 'con', 'por', 'para',
                          'un', 'una', 'que', 'es', 'y', 'o', 'no', 'se'}
            tokens = [t for t in query_lower.split() if len(t) >= 3 and t not in stop_words]

            label_matches = []
            for n in nodes:
                label_lower = n.get('label', '').lower()
                desc_lower = n.get('description', '').lower()
                id_lower = n.get('id', '').lower()

                # Score: count how many tokens match
                score = 0
                for token in tokens:
                    if token in label_lower:
                        score += 3  # Label match is worth more
                    elif token in desc_lower:
                        score += 1
                    elif token in id_lower:
                        score += 2

                if score > 0:
                    label_matches.append((n, score))

            # Also check for full query match (exact substring)
            if query_lower:
                for n in nodes:
                    label_lower = n.get('label', '').lower()
                    desc_lower = n.get('description', '').lower()
                    if query_lower in label_lower or query_lower in desc_lower:
                        existing = next((m for m in label_matches if m[0]['id'] == n['id']), None)
                        if existing:
                            # Boost exact matches
                            label_matches = [(m[0], m[1] + 5) if m[0]['id'] == n['id'] else m for m in label_matches]
                        else:
                            label_matches.append((n, 5))

            # Sort by score descending
            label_matches.sort(key=lambda x: x[1], reverse=True)

            for match, score in label_matches[:10]:  # Top 10 matches
                for edge in edges:
                    if edge['source'] == match['id']:
                        target = next((n for n in nodes if n['id'] == edge['target']), None)
                        if target:
                            rel = " -> [" + edge['relation'] + "] -> " + target['label'] + " (" + target['type'] + ")"
                            if rel not in expanded_context:
                                expanded_context.append(rel)
                    elif edge['target'] == match['id']:
                        source = next((n for n in nodes if n['id'] == edge['source']), None)
                        if source:
                            rel = " <- [" + edge['relation'] + "] <- " + source['label'] + " (" + source['type'] + ")"
                            if rel not in expanded_context:
                                expanded_context.append(rel)

                if match.get('path', '') not in found_nodes:
                    capture_print(" + Graph match (score=" + str(score) + "): " +
                                  match['label'] + " (" + match['type'] + ") -- " +
                                  match.get('description', ''))

            if expanded_context:
                capture_print("\n>> [RELATIONS]")
                for rel in expanded_context[:20]:  # Cap at 20
                    capture_print(" + " + rel)
            elif not label_matches:
                capture_print(" + No graph connections found for these results.")
        else:
            capture_print(" + Graph not found. Skipping expansion.")

    return "\n".join(output_lines)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = query_hybrid(' '.join(sys.argv[1:]))
        print(result)
    else:
        print("Usage: python query_uma.py <search_query>", file=sys.stderr)
