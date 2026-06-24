import os
import json
import shutil
import datetime

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")
ARCHIVE_ROOT = os.path.join(MEMORY_ROOT, "archive")
BUS_PATH = os.path.join(MEMORY_ROOT, "intelligence", "events", "bus.json")


def load_config():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def emit_event(event_type, details, severity="info"):
    """Emit a CloudEvents 1.0 compliant event to the institutional bus."""
    try:
        with open(BUS_PATH, 'r', encoding='utf-8') as f:
            bus = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        bus = {"events": []}

    now = datetime.datetime.now()
    new_event = {
        "specversion": "1.0",
        "id": "evt_" + now.strftime('%Y%m%d_%H%M%S') + "_" + str(os.getpid()),
        "type": "sogna.maintenance." + event_type.lower(),
        "source": "PruneEngine",
        "time": now.isoformat() + "Z",
        "datacontenttype": "application/json",
        "data": {
            "severity": severity,
            "details": details,
            "phase": "maintenance"
        }
    }
    bus["events"].append(new_event)

    if len(bus["events"]) > 200:
        bus["events"] = bus["events"][-200:]

    with open(BUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(bus, f, indent=2, ensure_ascii=False)


def prune():
    print("--- SOGNA AUTONOMOUS MEMORY CARE ---")
    config = load_config()
    archive_days = config.get("synthesis", {}).get("archive_after_days", 30)
    now = datetime.datetime.now()
    total_actions = 0

    # 1. Pruning Logs -> Archive
    logs_path = os.path.join(MEMORY_ROOT, "operational", "logs")
    if os.path.exists(logs_path):
        archive_logs_path = os.path.join(ARCHIVE_ROOT, "logs")
        os.makedirs(archive_logs_path, exist_ok=True)
        count = 0
        for file in os.listdir(logs_path):
            file_path = os.path.join(logs_path, file)
            if os.path.isfile(file_path):
                mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                if (now - mtime).days > archive_days:
                    shutil.move(file_path, os.path.join(archive_logs_path, file))
                    count += 1
        print("[LOGS] Archived " + str(count) + " old logs.")
        total_actions += count

    # 2. Pruning Backups (Keep only last 3)
    backups_path = os.path.join(ARCHIVE_ROOT, "backups")
    if os.path.exists(backups_path):
        backups = sorted(
            [f for f in os.listdir(backups_path) if os.path.isfile(os.path.join(backups_path, f))],
            key=lambda x: os.path.getmtime(os.path.join(backups_path, x)),
            reverse=True
        )
        if len(backups) > 3:
            for b in backups[3:]:
                os.remove(os.path.join(backups_path, b))
                print("[BACKUPS] Purged old backup: " + b)
                total_actions += 1

    # 3. Pruning Episodic Archive (Keep only last 20 snapshots)
    episodic_archive_path = os.path.join(ARCHIVE_ROOT, "episodic")
    if os.path.exists(episodic_archive_path):
        episodic_files = sorted(
            [f for f in os.listdir(episodic_archive_path) if f.endswith((".md", ".json"))],
            key=lambda x: os.path.getmtime(os.path.join(episodic_archive_path, x)),
            reverse=True
        )
        if len(episodic_files) > 20:
            for ef in episodic_files[20:]:
                os.remove(os.path.join(episodic_archive_path, ef))
                print("[EPISODIC] Purged old episodic file: " + ef)
                total_actions += 1

    # 3b. Pruning Active Episodic Snapshots (Keep only last 12 snapshots)
    active_episodic_path = os.path.join(MEMORY_ROOT, "intelligence", "episodic")
    if os.path.exists(active_episodic_path):
        active_files = sorted(
            [f for f in os.listdir(active_episodic_path) if f.endswith((".md", ".json"))],
            key=lambda x: os.path.getmtime(os.path.join(active_episodic_path, x)),
            reverse=True
        )
        if len(active_files) > 12:
            for af in active_files[12:]:
                os.remove(os.path.join(active_episodic_path, af))
                print("[EPISODIC] Purged old active episodic snapshot: " + af)
                total_actions += 1

    # 4. Cleaning Orphan Agent Folders
    agents_path = os.path.join(ARCHIVE_ROOT, "agents")
    if os.path.exists(agents_path):
        for agent_dir in os.listdir(agents_path):
            full_agent_path = os.path.join(agents_path, agent_dir)
            if os.path.isdir(full_agent_path):
                files = os.listdir(full_agent_path)
                mtime = datetime.datetime.fromtimestamp(os.path.getmtime(full_agent_path))
                if not files or (now - mtime).days > 7:
                    shutil.rmtree(full_agent_path)
                    print("[AGENTS] Purged orphan agent session: " + agent_dir)
                    total_actions += 1

    # 5. Bus event cleanup (auto-handled by cap, but verify)
    if os.path.exists(BUS_PATH):
        with open(BUS_PATH, 'r', encoding='utf-8') as f:
            bus = json.load(f)
        event_count = len(bus.get("events", []))
        print("[BUS] Event count: " + str(event_count) + "/200")

    # 6. Emit consolidation event
    if total_actions > 0:
        emit_event("PRUNE_COMPLETE", "Pruned " + str(total_actions) + " items across logs, backups, episodic, and agents")
    else:
        print("[INFO] Memory is clean. No pruning needed.")

    print("\n--- MEMORY CARE COMPLETE: " + str(total_actions) + " items processed ---")
    return total_actions


if __name__ == "__main__":
    prune()
