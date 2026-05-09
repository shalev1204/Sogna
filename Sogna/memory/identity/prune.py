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
    print("--- SOGNA AUTONOMOUS MEMORY CARE ---")
    config = load_config()
    archive_days = config.get("synthesis", {}).get("archive_after_days", 30)
    now = datetime.datetime.now()

# 1. Pruning Logs -> Archive
    logs_path = os.path.join(MEMORY_ROOT, "operational", "logs")
    if os.path.exists(logs_path):
        archive_logs_path = os.path.join(ARCHIVE_ROOT, "logs")
        os.makedirs(archive_logs_path, exist_ok=True)
        count = 0
        for file in os.listdir(logs_path):
            file_path = os.path.join(logs_path, file)
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
            if (now - mtime).days > archive_days:
                shutil.move(file_path, os.path.join(archive_logs_path, file))
                count += 1
        print(f"[LOGS] Archived {count} old logs.")

# 2. Pruning Backups (Keep only last 3)
    backups_path = os.path.join(ARCHIVE_ROOT, "backups")
    if os.path.exists(backups_path):
        backups = sorted([f for f in os.listdir(backups_path)], key=lambda x: os.path.getmtime(os.path.join(backups_path, x)), reverse=True)
        if len(backups) > 3:
            for b in backups[3:]:
                os.remove(os.path.join(backups_path, b))
                print(f"[BACKUPS] Purged old backup: {b}")

# 3. Cleaning Orphan Agent Folders
    agents_path = os.path.join(ARCHIVE_ROOT, "agents")
    if os.path.exists(agents_path):
        for agent_dir in os.listdir(agents_path):
            full_agent_path = os.path.join(agents_path, agent_dir)
            if os.path.isdir(full_agent_path):
# If folder is empty or older than 7 days, delete
                files = os.listdir(full_agent_path)
                mtime = datetime.datetime.fromtimestamp(os.path.getmtime(full_agent_path))
                if not files or (now - mtime).days > 7:
                    shutil.rmtree(full_agent_path)
                    print(f"[AGENTS] Purged orphan agent session: {agent_dir}")

# 4. Consolidate Check (Trigger Warning)
    episodic_path = os.path.join(ARCHIVE_ROOT, "episodic")
    if os.path.exists(episodic_path):
        reflections = [f for f in os.listdir(episodic_path) if f.startswith("episodic_reflection")]
        if len(reflections) > 5:
            print(f"[WARNING] High fragmentation in episodic archive ({len(reflections)} files). Suggest consolidation.")

if _name_ == "_main_":
    prune()
