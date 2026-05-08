import os
import json
from datetime import datetime

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
L1_CACHE_PATH = os.path.join(MEMORY_ROOT, "operational", "agent", "l1_cache.json")

def _load_cache():
    if not os.path.exists(L1_CACHE_PATH):
        return {
            "task_id": None,
            "status": "idle",
            "findings": [],
            "last_updated": None
        }
    try:
        with open(L1_CACHE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"task_id": None, "status": "error", "findings": [], "last_updated": None}

def _save_cache(data):
    data["last_updated"] = datetime.now().isoformat()
    os.makedirs(os.path.dirname(L1_CACHE_PATH), exist_ok=True)
    with open(L1_CACHE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def set_context(task_id, description):
    """Initializes the L1 working memory for a new task."""
    data = _load_cache()
    data["task_id"] = task_id
    data["description"] = description
    data["status"] = "in_progress"
    data["findings"] = []
    _save_cache(data)
    print(f"[L1 RAM] Context set for task: {task_id}")

def add_finding(finding):
    """Appends a quick finding or state to the active L1 memory."""
    data = _load_cache()
    data["findings"].append(finding)
    # Keep L1 small: max 10 findings
    if len(data["findings"]) > 10:
        data["findings"] = data["findings"][-10:]
    _save_cache(data)
    print(f"[L1 RAM] Finding added. Total findings: {len(data['findings'])}")

def update_status(status):
    """Updates the status of the current task."""
    data = _load_cache()
    data["status"] = status
    _save_cache(data)
    print(f"[L1 RAM] Status updated to: {status}")

def get_context():
    """Retrieves the ultra-fast L1 context."""
    return _load_cache()

def clear():
    """Clears the L1 memory, moving the task to completion."""
    data = {"task_id": None, "status": "idle", "findings": [], "last_updated": datetime.now().isoformat()}
    _save_cache(data)
    print("[L1 RAM] Context cleared.")

if __name__ == "__main__":
    # Test L1 Manager
    set_context("TEST-001", "Implement L1 RAM cache")
    add_finding("Created l1_ram.py")
    update_status("testing")
    print(json.dumps(get_context(), indent=2))
    clear()
