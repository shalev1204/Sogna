import os
import json
import shutil
import datetime

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")
ARCHIVE_ROOT = os.path.join(MEMORY_ROOT, "archive")

def load_config():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def prune():
    print("--- SOGNA AUTONOMOUS PRUNING ---")
    config = load_config()
    archive_days = config.get("synthesis", {}).get("archive_after_days", 30)
    
    # Pruning Operational Logs
    logs_path = os.path.join(MEMORY_ROOT, "operational", "logs")
    if os.path.exists(logs_path):
        archive_logs_path = os.path.join(ARCHIVE_ROOT, "logs")
        os.makedirs(archive_logs_path, exist_ok=True)
        
        now = datetime.datetime.now()
        count = 0
        for file in os.listdir(logs_path):
            file_path = os.path.join(logs_path, file)
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
            
            if (now - mtime).days > archive_days:
                dest = os.path.join(archive_logs_path, file)
                shutil.move(file_path, dest)
                print(f"[ARCHIVED] Moved {file} to cold storage.")
                count += 1
        
        if count == 0:
            print("[INFO] No files old enough to prune.")
        else:
            print(f"[SUCCESS] Archived {count} files.")

if __name__ == "__main__":
    prune()
