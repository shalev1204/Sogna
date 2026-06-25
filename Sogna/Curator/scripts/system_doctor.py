import os
import json
script_dir = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(script_dir, "..", ".."))
MEMORY_ROOT = os.path.join(ROOT, "memory")
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def doctor_check():
    print("--- SOGNA SYSTEM DOCTOR (Stable) ---")
    errors = 0
    warnings = 0

    # 1. Check Graph Integrity
    print("\n[1] Auditing Semantic Graph...")
    if os.path.exists(GRAPH_PATH):
        try:
            with open(GRAPH_PATH, 'r') as f:
                graph = json.load(f)
            
            for node in graph.get('nodes', []):
                path = node.get('path')
                if path:
                    if path.startswith('http://') or path.startswith('https://'):
                        continue
                    clean_path = path.replace('/', os.sep)
                    abs_path = os.path.join(ROOT, clean_path)
                    if not os.path.exists(abs_path):
                        print(f"  [ERROR] Orphan Node: {node['id']} points to missing file: {path}")
                        errors += 1
        except Exception as e:
            print(f"  [ERROR] Failed to read graph: {e}")
            errors += 1
    else:
        print("  [WARNING] Graph file missing.")
        warnings += 1

    # 2. Check Registry Integrity
    print("\n[2] Auditing Registry...")
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, 'r') as f:
                registry = json.load(f)
            for layer, config in registry.get('layers', {}).items():
                path = config.get('path')
                abs_path = os.path.join(MEMORY_ROOT, path.replace('/', os.sep))
                if not os.path.exists(abs_path):
                    print(f"  [ERROR] Registry Layer '{layer}' points to missing dir: {path}")
                    errors += 1
        except Exception as e:
            print(f"  [ERROR] Failed to read registry: {e}")
            errors += 1
    else:
        print("  [ERROR] Registry missing.")
        errors += 1

    # 3. Check for Uppercase Files (Enforce Protocol)
    print("\n[3] Enforcing Lowercase Protocol...")
    target_dirs = [MEMORY_ROOT, os.path.join(ROOT, "Curator"), os.path.join(ROOT, "Sognatore")]
    for target in target_dirs:
        if not os.path.exists(target): continue
        print(f"  Checking: {os.path.basename(target)}...")
        for root, dirs, files in os.walk(target):
            # Prune hidden and ignored dirs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != "node_modules" and d != "dist" and d != "build"]
            
            for name in files:
                if any(c.isupper() for c in name) and not name.startswith(".") and name not in ["LICENSE", "README.md"]:
                    print(f"  [WARNING] Uppercase naming: {os.path.join(root, name)}")
                    warnings += 1
            for name in dirs:
                if any(c.isupper() for c in name):
                    print(f"  [WARNING] Uppercase naming: {os.path.join(root, name)}")
                    warnings += 1

    print(f"\n--- AUDIT COMPLETE ---")
    print(f"Errors: {errors}")
    print(f"Warnings: {warnings}")
    
    if errors == 0:
        print("SYSTEM HEALTH: STABLE")
    else:
        print("SYSTEM HEALTH: CRITICAL")

if __name__ == "__main__":
    doctor_check()
