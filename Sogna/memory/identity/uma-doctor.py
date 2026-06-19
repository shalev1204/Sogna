import os
import sys
import json
import requests
import datetime

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")


def check_uma():
    print("================")
    print("   SOGNA UMA    ")
    print("  HEALTH CHECK  ")
    print("================")

    if not os.path.exists(REGISTRY_PATH):
        print("[CRITICAL] registry.json not found!")
        return False

    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry = json.load(f)

    layers = registry.get("layers", {})
    issues = []

    # 1. Layer & File Audit
    print("\n[1] Checking Layers & Files...")
    for layer_name, config in layers.items():
        rel_path = config.get("path", "")
        abs_path = os.path.join(MEMORY_ROOT, rel_path)
        if not os.path.exists(abs_path):
            print("  [MISSING] Layer '" + layer_name + "': " + rel_path)
            issues.append("Missing layer: " + layer_name)
        else:
            file_count = 0
            for root_dir, dirs, files in os.walk(abs_path):
                file_count += len(files)
            print("  - " + layer_name.ljust(18) + ": HEALTHY (" + str(file_count) + " files)")

    # 2. Vector Store Audit
    print("\n[2] Checking Semantic Vector Store (RAG)...")
    try:
        sys.path.insert(0, os.path.dirname(__file__))
        from vector_store import is_ready, resolve_provider  # noqa: E402

        provider = resolve_provider()
        ok, detail = is_ready()
        print("  - Provider: " + provider)
        print("  - Status: " + detail)
        if not ok:
            print("  [WARNING] Vector index not ready. Run index_uma.py or pnpm vector:index.")
            issues.append("Vector index not ready: " + detail)
    except Exception as e:
        print("  [ERROR] Vector store check failed: " + str(e))
        issues.append("Vector store check failed")

    # 3. Knowledge Graph Audit
    print("\n[3] Checking Knowledge Graph...")
    graph_path = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
    if os.path.exists(graph_path):
        with open(graph_path, 'r', encoding='utf-8') as f:
            graph = json.load(f)
        meta = graph.get("meta", {})
        print("  - Nodes: " + str(meta.get("node_count", "?")))
        print("  - Edges: " + str(meta.get("edge_count", "?")))
        print("  - Validated: " + str(meta.get("valid_nodes", "?")))
        print("  - Orphaned: " + str(meta.get("orphaned_nodes", "?")))
        print("  - Last Validated: " + str(meta.get("last_validated", "never")))
        orphaned = meta.get("orphaned_nodes", 0)
        if orphaned > 0:
            issues.append(str(orphaned) + " orphaned graph nodes")
    else:
        print("  [MISSING] Knowledge Graph not found.")
        issues.append("Missing Knowledge Graph")

    # 4. Event Bus Audit
    print("\n[4] Checking Event Bus...")
    bus_path = os.path.join(MEMORY_ROOT, "intelligence", "events", "bus.json")
    if os.path.exists(bus_path):
        with open(bus_path, 'r', encoding='utf-8') as f:
            bus = json.load(f)
        event_count = len(bus.get("events", []))
        max_events = bus.get("meta", {}).get("max_events", 200)
        print("  - Events: " + str(event_count) + "/" + str(max_events))
        print("  - Schema: " + bus.get("meta", {}).get("schema", "unknown"))
        if event_count > 0:
            last_event = bus["events"][-1]
            print("  - Last Event: " + last_event.get("type", "?") + " at " + last_event.get("time", "?"))
    else:
        print("  [MISSING] Event Bus not found.")
        issues.append("Missing Event Bus")

    # 5. Intelligence Connectivity (Ollama)
    print("\n[5] Checking Intelligence Connectivity (Ollama)...")
    o_config = registry.get("ollama_config", {})
    endpoint = o_config.get("endpoint", "http://localhost:11434")
    try:
        resp = requests.get(endpoint, timeout=3)
        if resp.status_code == 200:
            print("  - Ollama Status: ONLINE (" + endpoint + ")")
            print("  - Default Model: " + str(o_config.get('model')))
        else:
            print("  [WARNING] Ollama returned status " + str(resp.status_code))
    except Exception:
        print("  [OFFLINE] Ollama not reachable at " + endpoint)

    # 6. Content Freshness
    print("\n[6] Content Freshness Audit...")
    episodic_path = os.path.join(MEMORY_ROOT, "intelligence", "episodic")
    if os.path.exists(episodic_path):
        all_files = sorted([f for f in os.listdir(episodic_path) if f.endswith((".md", ".json"))])
        if all_files:
            print("  - Episodic Files: " + str(len(all_files)))
            print("  - Latest: " + all_files[-1])
        else:
            print("  [WARNING] No episodic files found.")
    else:
        print("  [WARNING] Episodic directory does not exist.")

    # 7. Consolidation Pipeline Check
    print("\n[7] Checking Consolidation Pipeline...")
    consolidation_config = registry.get("consolidation_config", {})
    if consolidation_config:
        pipeline_script = consolidation_config.get("pipeline_script", "")
        sogna_root = os.path.abspath(os.path.join(MEMORY_ROOT, ".."))
        pipeline_path = os.path.join(sogna_root, pipeline_script)
        if os.path.exists(pipeline_path):
            print("  - Pipeline Script: FOUND")
        else:
            print("  [MISSING] Pipeline script: " + pipeline_script)
            issues.append("Missing consolidation pipeline")
        print("  - Interval: " + str(consolidation_config.get("consolidation_interval_hours", "?")) + "h")
        print("  - Max Bus Events: " + str(consolidation_config.get("max_bus_events", "?")))
    else:
        print("  [WARNING] No consolidation_config in registry.")
        issues.append("No consolidation_config")

    # Final Summary
    print("\n==========================================")
    if not issues:
        print("   FINAL STATUS: STABLE / PRODUCTION-READY")
    else:
        print("   FINAL STATUS: DEGRADED / ATTENTION REQUIRED")
        print("   Issues (" + str(len(issues)) + "):")
        for issue in issues:
            print("     - " + issue)
    print("==========================================\n")

    return len(issues) == 0


if __name__ == "__main__":
    check_uma()
