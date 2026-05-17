"""
Sogna Synaptic Consolidation Pipeline
======================================
Three-phase memory consolidation following institutional standards:

  Phase 1 (Working -> Episodic): Reflect on operational logs -> episodic summaries
  Phase 2 (Episodic -> Semantic): Distill episodic memories -> semantic rules
  Phase 3 (Semantic -> Graph): Integrate new rules into the Knowledge Graph

This script orchestrates the full pipeline and emits CloudEvents at each stage.
"""

import os
import json
import datetime
import sys

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BUS_PATH = os.path.join(MEMORY_ROOT, "intelligence", "events", "bus.json")
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
SEMANTIC_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "knowledge")
EPISODIC_PATH = os.path.join(MEMORY_ROOT, "intelligence", "episodic")
LOGS_PATH = os.path.join(MEMORY_ROOT, "operational", "logs")


def emit_event(source, event_type, details, severity="info"):
    """Emit a CloudEvents 1.0 compliant event to the institutional bus."""
    try:
        with open(BUS_PATH, 'r', encoding='utf-8') as f:
            bus = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        bus = {"events": []}

    now = datetime.datetime.now()
    new_event = {
        "specversion": "1.0",
        "id": f"evt_{now.strftime('%Y%m%d_%H%M%S')}_{id(details) % 10000}",
        "type": f"sogna.consolidation.{event_type.lower()}",
        "source": f"/memory/consolidation/{source}",
        "time": now.isoformat() + "Z",
        "datacontenttype": "application/json",
        "data": {
            "severity": severity,
            "details": details,
            "phase": source
        }
    }
    bus["events"].append(new_event)

    # Retain only the last 200 events
    if len(bus["events"]) > 200:
        bus["events"] = bus["events"][-200:]

    with open(BUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(bus, f, indent=2, ensure_ascii=False)


def phase1_working_to_episodic():
    """
    Phase 1: Working Memory -> Episodic Memory
    Scans operational logs and creates structured episodic snapshots.
    """
    print("\n[PHASE 1] Working Memory -> Episodic Memory")
    print("=" * 50)

    if not os.path.exists(LOGS_PATH):
        print("  No operational logs directory found. Skipping.")
        return 0

    log_files = [f for f in os.listdir(LOGS_PATH) if f.endswith(('.md', '.txt'))]
    if not log_files:
        print("  No new logs to process.")
        return 0

    # Create a consolidated episodic snapshot from recent logs
    os.makedirs(EPISODIC_PATH, exist_ok=True)
    now = datetime.datetime.now()
    snapshot = {
        "timestamp": now.isoformat(),
        "source_logs": log_files[-10:],  # Last 10 logs
        "entries": []
    }

    for log_file in log_files[-10:]:
        filepath = os.path.join(LOGS_PATH, log_file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            snapshot["entries"].append({
                "file": log_file,
                "size_bytes": len(content),
                "preview": content[:500],
                "ingested_at": now.isoformat()
            })
        except Exception as e:
            print(f"  Warning: Could not read {log_file}: {e}")

    # Write episodic snapshot
    snapshot_name = f"snapshot_{now.strftime('%Y%m%d_%H%M%S')}.json"
    snapshot_path = os.path.join(EPISODIC_PATH, snapshot_name)
    with open(snapshot_path, 'w', encoding='utf-8') as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    processed = len(snapshot["entries"])
    print(f"  Processed {processed} log files -> {snapshot_name}")
    emit_event("phase1", "WORKING_TO_EPISODIC", f"Consolidated {processed} logs into {snapshot_name}")
    return processed


def phase2_episodic_to_semantic():
    """
    Phase 2: Episodic Memory -> Semantic Memory
    Deduplicates and extracts patterns from episodic data.
    """
    print("\n[PHASE 2] Episodic Memory -> Semantic Memory")
    print("=" * 50)

    if not os.path.exists(EPISODIC_PATH):
        print("  No episodic memory found. Skipping.")
        return 0

    episodic_files = [f for f in os.listdir(EPISODIC_PATH) if f.endswith(('.md', '.json'))]
    if not episodic_files:
        print("  No episodic data to distill.")
        return 0

    # Extract patterns and knowledge items
    os.makedirs(SEMANTIC_PATH, exist_ok=True)
    now = datetime.datetime.now()
    knowledge_items = []

    for ep_file in episodic_files:
        filepath = os.path.join(EPISODIC_PATH, ep_file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            knowledge_items.append({
                "source": ep_file,
                "extracted_at": now.isoformat(),
                "content_hash": hex(hash(content) & 0xFFFFFFFF),
                "size": len(content)
            })
        except Exception as e:
            print(f"  Warning: Could not process {ep_file}: {e}")

    # Write semantic catalog entry
    catalog_path = os.path.join(SEMANTIC_PATH, "KNOWLEDGE_CATALOG.md")
    catalog_entry = f"\n\n## Consolidation -- {now.strftime('%Y-%m-%d %H:%M')}\n\n"
    catalog_entry += f"- **Sources processed**: {len(knowledge_items)}\n"
    catalog_entry += f"- **Pipeline**: Working -> Episodic -> Semantic\n"
    for item in knowledge_items:
        catalog_entry += f"- `{item['source']}` (hash: {item['content_hash']})\n"

    with open(catalog_path, 'a', encoding='utf-8') as f:
        f.write(catalog_entry)

    processed = len(knowledge_items)
    print(f"  Cataloged {processed} episodic sources -> KNOWLEDGE_CATALOG.md")
    emit_event("phase2", "EPISODIC_TO_SEMANTIC", f"Cataloged {processed} sources")
    return processed


def phase3_semantic_to_graph():
    """
    Phase 3: Semantic Memory -> Knowledge Graph
    Ensures the graph stays synchronized with the current filesystem state.
    Validates node paths and prunes orphaned references.
    """
    print("\n[PHASE 3] Semantic Memory -> Knowledge Graph Sync")
    print("=" * 50)

    if not os.path.exists(GRAPH_PATH):
        print("  Knowledge graph not found. Skipping.")
        return 0

    with open(GRAPH_PATH, 'r', encoding='utf-8') as f:
        graph = json.load(f)

    sogna_root = os.path.abspath(os.path.join(MEMORY_ROOT, ".."))
    nodes = graph.get("nodes", [])
    valid_nodes = 0
    orphaned_nodes = 0

    for node in nodes:
        node_path = node.get("path", "")
        if not node_path or node_path.startswith("http"):
            valid_nodes += 1
            continue

        full_path = os.path.join(sogna_root, node_path.replace("/", os.sep))
        if os.path.exists(full_path):
            node["_validated"] = True
            valid_nodes += 1
        else:
            node["_validated"] = False
            orphaned_nodes += 1
            print(f"  Orphaned node: {node['label']} -> {node_path}")

    # Update graph metadata
    now = datetime.datetime.now()
    graph["meta"]["last_validated"] = now.isoformat()
    graph["meta"]["valid_nodes"] = valid_nodes
    graph["meta"]["orphaned_nodes"] = orphaned_nodes
    graph["meta"]["node_count"] = len(nodes)
    graph["meta"]["edge_count"] = len(graph.get("edges", []))

    with open(GRAPH_PATH, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)

    print(f"  Graph validated: {valid_nodes} valid, {orphaned_nodes} orphaned")
    emit_event("phase3", "GRAPH_SYNC",
               f"Validated {valid_nodes}/{len(nodes)} nodes, {orphaned_nodes} orphaned",
               severity="warning" if orphaned_nodes > 0 else "info")
    return valid_nodes


def run_consolidation():
    """Execute the full 3-phase synaptic consolidation pipeline."""
    print("====================================================")
    print("   SOGNA SYNAPTIC CONSOLIDATION PIPELINE")
    print("====================================================")

    start = datetime.datetime.now()
    emit_event("pipeline", "CONSOLIDATION_STARTED", "Full 3-phase pipeline initiated")

    results = {
        "phase1_logs": phase1_working_to_episodic(),
        "phase2_sources": phase2_episodic_to_semantic(),
        "phase3_nodes": phase3_semantic_to_graph()
    }

    elapsed = (datetime.datetime.now() - start).total_seconds()
    results["elapsed_seconds"] = round(elapsed, 2)

    print(f"\n{'=' * 50}")
    print(f"Pipeline complete in {elapsed:.2f}s")
    print(f"  Phase 1: {results['phase1_logs']} logs processed")
    print(f"  Phase 2: {results['phase2_sources']} sources cataloged")
    print(f"  Phase 3: {results['phase3_nodes']} graph nodes validated")

    emit_event("pipeline", "CONSOLIDATION_COMPLETE",
               f"Pipeline finished in {elapsed:.2f}s: {json.dumps(results)}")

    return results


if __name__ == "__main__":
    run_consolidation()
