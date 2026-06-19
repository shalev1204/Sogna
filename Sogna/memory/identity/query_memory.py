import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from vector_store import query  # noqa: E402


def query_memory(text, n_results=3):
    """Vector-only search. For hybrid GraphRAG, use query_uma.py."""
    print("--- SOGNA SEMANTIC QUERY: '" + text + "' ---")
    results = query(text, n_results=n_results)

    if not results:
        print("No results found.")
        return

    for i, row in enumerate(results):
        match_pct = "{:.2%}".format(row.get("similarity", 0))
        print("\n[Match " + str(i + 1) + "] Path: " + row["path"] + " (Similarity: " + match_pct + ")")
        snippet = row.get("content", "")[:300].replace("\n", " ")
        clean_snippet = snippet.encode("ascii", "ignore").decode("ascii")
        print("Snippet: " + clean_snippet + "...")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query_memory(" ".join(sys.argv[1:]))
    else:
        print('Usage: python query_memory.py "your search term"')
