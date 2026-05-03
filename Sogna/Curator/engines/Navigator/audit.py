import json
from pathlib import Path

def audit_graph(extraction_data: dict) -> dict:
    """Analyze the Navigator graph for 'design smells' or weak points."""
    nodes = extraction_data.get("nodes", [])
    edges = extraction_data.get("edges", [])
    
    report = {
        "summary": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "confidence_avg": 0.0
        },
        "critical_issues": [],
        "warnings": []
    }
    
    if not nodes:
        return report

    # 1. Average Confidence
    total_score = sum(n.get("confidence_score", 1.0) for n in nodes)
    report["summary"]["confidence_avg"] = total_score / len(nodes)

    # 2. Dead-end Detection (Nodes with no outgoing edges, excluding file nodes)
    sources = {e["source"] for e in edges}
    for node in nodes:
        if node["id"] not in sources and node["file_type"] == "code" and not node["label"].endswith(".py"):
            report["warnings"].append({
                "type": "DEAD_END",
                "node_id": node["id"],
                "label": node["label"],
                "message": "Node has no outgoing relationships. Potential orphaned logic."
            })

    # 3. Low Confidence Links
    for edge in edges:
        if edge.get("confidence_score", 1.0) < 0.9:
            report["critical_issues"].append({
                "type": "WEAK_LINK",
                "source": edge["source"],
                "target": edge["target"],
                "confidence": edge["confidence_score"],
                "reason": edge.get("audit_reason", "Unknown"),
                "message": f"Relationship relies on {edge['confidence']} inference with low score."
            })

    # 4. Circular Dependency Detection (Simple 2-node cycles)
    adj = {}
    for e in edges:
        adj.setdefault(e["source"], set()).add(e["target"])
    
    for src, targets in adj.items():
        for tgt in targets:
            if tgt in adj and src in adj[tgt]:
                # Cycle found
                report["critical_issues"].append({
                    "type": "CIRCULAR_DEPENDENCY",
                    "pair": [src, tgt],
                    "message": f"Tight circular coupling detected between {src} and {tgt}."
                })

    return report

if __name__ == "__main__":
    # Example usage for debugging
    print("Navigator Graph Auditor ready.")
