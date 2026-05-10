import json
import os
import sys

GRAPH_PATH = r"c:\Users\carle\Desktop\Sogna\Sogna\memory\intelligence\semantic\graph.json"

def explore_connections(node_id):
    if not os.path.exists(GRAPH_PATH):
        print("Graph not found.")
        return

    with open(GRAPH_PATH, 'r') as f:
        graph = json.load(f)

    print(f"--- EXPLORING CONNECTIONS FOR: {node_id} ---")
    
    # Find neighbors
    connected_nodes = []
    for edge in graph['edges']:
        if edge['source'] == node_id:
            connected_nodes.append((edge['target'], edge['relation'], "OUT"))
        elif edge['target'] == node_id:
            connected_nodes.append((edge['source'], edge['relation'], "IN"))

    if not connected_nodes:
        print("No connections found.")
        return

    for target, relation, direction in connected_nodes:
        # Find target label
        target_label = next((n['label'] for n in graph['nodes'] if n['id'] == target), target)
        if direction == "OUT":
            print(f" -> [{relation}] -> {target_label} ({target})")
        else:
            print(f" <- [{relation}] <- {target_label} ({target})")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        explore_connections(sys.argv[1])
    else:
        print("Usage: python graph_explorer.py <node_id>")
