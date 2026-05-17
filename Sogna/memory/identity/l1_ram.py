import json
import os
from datetime import datetime

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class L1RAM:
    """
    Manager for the L1 (RAM) memory layer.
    Provides fast, JSON-based access to the immediate working context.
    """
    def __init__(self, cache_path=None):
        if cache_path is None:
            self.cache_path = os.path.join(MEMORY_ROOT, "operational", "agent", "l1_cache.json")
        else:
            self.cache_path = cache_path
        self._ensure_dir()
        if not os.path.exists(self.cache_path):
            self.clear()

    def _ensure_dir(self):
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)

    def get_context(self):
        try:
            with open(self.cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return self.clear()

    def set_context(self, context_dict):
        data = self.get_context()
        data["last_updated"] = datetime.now().isoformat()
        data["context"].update(context_dict)
        self._save(data)
        return data

    def add_finding(self, finding):
        data = self.get_context()
        data["findings"].append({
            "timestamp": datetime.now().isoformat(),
            "content": finding
        })
        self._save(data)
        return data

    def update_status(self, status):
        data = self.get_context()
        data["current_status"] = status
        data["last_updated"] = datetime.now().isoformat()
        self._save(data)
        return data

    def clear(self):
        default_data = {
            "current_status": "idle",
            "last_updated": datetime.now().isoformat(),
            "context": {},
            "findings": []
        }
        self._save(default_data)
        return default_data

    def _save(self, data):
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)


if __name__ == "__main__":
    # Quick self-test
    ram = L1RAM()
    ram.update_status("testing_l1")
    ram.add_finding("L1 RAM Layer initialized successfully.")
    print("L1 RAM initialized at:", ram.cache_path)
