import os
import json
import requests
import datetime

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def check_uma():
    print("================")
    print("   SOGNA UMA    ")
    print("================")
    
    if not os.path.exists(REGISTRY_PATH):
        print("[CRITICAL] registry.json not found!")
        return

    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry = json.load(f)

    layers = registry.get("layers", {})
    all_fine = True

# 1. Layer & Case Audit
    print("\n[1] Checking Layers & Nomenclature...")
for layer_name, config in layers.items():
        rel_path = config.get("path")
        abs_path = os.path.join(MEMORY_ROOT, rel_path)
        if not os.path.exists(abs_path):
print(f" [MISSING] Layer '{layer_name}': {rel_path}")
            all_fine = False
        else:
            file_count = 0
            case_errors = 0
            for root_dir, dirs, files in os.walk(abs_path):
                file_count += len(files)
                for file in files:
                    if any(c.isupper() for c in file):
print(f" [CASE ERROR] '{file}' in {layer_name}")
                        case_errors += 1
            
            status = "HEALTHY" if case_errors == 0 else "CASE_ISSUES"
print(f" - {layer_name.ljust(15)}: {status} ({file_count} files)")
            if case_errors > 0: all_fine = False

# 2. Vector DB Audit
    print("\n[2] Checking Semantic Vector Store (RAG)...")
    v_path = os.path.join(MEMORY_ROOT, registry.get("vector_store", {}).get("path", ""))
    if os.path.exists(v_path):
        size_mb = sum(os.path.getsize(os.path.join(v_path, f)) for f in os.listdir(v_path) if os.path.isfile(os.path.join(v_path, f))) / (1024*1024)
        print(f"  - ChromaDB Path: {v_path}")
        print(f"  - Index Size: {size_mb:.2f} MB")
        if size_mb == 0:
            print("  [WARNING] Vector index is empty.")
    else:
        print("  [MISSING] Vector store path not found.")
        all_fine = False

# 3. Intelligence Connectivity (Ollama)
    print("\n[3] Checking Intelligence Connectivity (Ollama)...")
    o_config = registry.get("ollama_config", {})
    endpoint = o_config.get("endpoint", "http://localhost:11434")
    try:
        resp = requests.get(endpoint, timeout=2)
        if resp.status_code == 200:
            print(f"  - Ollama Status: ONLINE ({endpoint})")
            print(f"  - Default Model: {o_config.get('model')}")
        else:
            print(f"  [WARNING] Ollama returned status {resp.status_code}")
    except:
        print(f"  [OFFLINE] Ollama not reachable at {endpoint}")

# 4. Content Freshness
    print("\n[4] Content Freshness Audit...")
    episodic_path = os.path.join(MEMORY_ROOT, "intelligence/episodic")
    if os.path.exists(episodic_path):
        reflections = [f for f in os.listdir(episodic_path) if "reflection" in f]
        if reflections:
            latest = sorted(reflections)[-1]
            print(f"  - Latest Reflection: {latest}")
        else:
            print("  [WARNING] No reflections found in episodic memory.")

# 5. Memory Care & Pruning
    print("\n[5] Checking Memory Fragmentation & Hygiene...")
    archive_path = os.path.join(MEMORY_ROOT, "archive")
    if os.path.exists(archive_path):
        backups_path = os.path.join(archive_path, "backups")
        if os.path.exists(backups_path) and len(os.listdir(backups_path)) > 5:
            print("  [WARNING] Excessive backups detected. Run prune.py.")
        
        episodic_path = os.path.join(archive_path, "episodic")
        if os.path.exists(episodic_path) and len([f for f in os.listdir(episodic_path) if f.startswith("episodic_reflection")]) > 10:
            print("  [WARNING] Episodic archive is fragmented. Consolidation recommended.")
        
        print("  - Memory Hygiene: OK" if all_fine else "  - Memory Hygiene: NEEDS ATTENTION")

    print("\n==========================================")
    if all_fine:
        print("   FINAL STATUS: STABLE / PRODUCTION-READY")
    else:
        print("   FINAL STATUS: DEGRADED / ATTENTION REQUIRED")
    print("==========================================\n")

if _name_ == "_main_":
    check_uma()
