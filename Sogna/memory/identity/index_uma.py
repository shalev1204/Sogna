import os
import sys

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.dirname(__file__))

from vector_store import resolve_provider, upsert  # noqa: E402


def index_all():
    provider = resolve_provider()
    print(f"--- SOGNA SEMANTIC INDEXER ({provider}) ---")

    documents = []
    metadatas = []
    ids = []

    target_dirs = [
        "identity",
        "intelligence/semantic",
        "intelligence/semantic/knowledge",
        "intelligence/episodic",
        "intelligence/events",
        "designs",
        "docs",
    ]

    for t_dir in target_dirs:
        abs_t_dir = os.path.join(MEMORY_ROOT, t_dir)
        if not os.path.exists(abs_t_dir):
            continue

        print("Indexing directory: " + t_dir + "...")
        for root, dirs, files in os.walk(abs_t_dir):
            for file in files:
                if file.endswith((".md", ".txt", ".csv")):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, MEMORY_ROOT)

                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        if content.strip() and len(content) > 10:
                            if len(content) > 10000:
                                content = content[:10000]

                            documents.append(content)
                            metadatas.append(
                                {
                                    "path": rel_path.replace("\\", "/"),
                                    "layer": t_dir.split("/")[0],
                                    "size": len(content),
                                }
                            )
                            ids.append(rel_path.replace("\\", "/"))
                    except Exception as e:
                        print("  Error reading " + rel_path + ": " + str(e))

    if documents:
        print("Upserting " + str(len(documents)) + " documents...")
        count = upsert(ids, documents, metadatas)
        print("Indexing complete: " + str(count) + " documents indexed.")
    else:
        print("No content found to index.")

    return len(documents)


if __name__ == "__main__":
    index_all()
