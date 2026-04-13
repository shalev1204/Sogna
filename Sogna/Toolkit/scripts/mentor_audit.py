import os
import json
import sys
from datetime import datetime

# Sogna Mentor Audit (Strategic Review)
# This script manages the audit_registry.json to approve/reject evolutions.

REGISTRY_PATH = os.path.abspath("../../../.sogna_memory/audit_registry.json")

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return None
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_registry(registry):
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

def log_audit(message):
    log_path = os.path.abspath("../../../logs/sovereign_operations.log")
    timestamp = datetime.now().isoformat()
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] [MENTOR_AUDIT] {message}\n")
    print(f"[Mentor] {message}")

def audit_skill(skill_name, action="approve"):
    registry = load_registry()
    if not registry:
        print("Error: Audit Registry not found.")
        return

    if action == "approve":
        if skill_name not in registry["verified_knowledge"]["skills"]:
            registry["verified_knowledge"]["skills"].append(skill_name)
            log_audit(f"APPROVED skill evolution: {skill_name}")
        else:
            print(f"Skill {skill_name} is already verified.")
    elif action == "reject":
        if skill_name in registry["verified_knowledge"]["skills"]:
            registry["verified_knowledge"]["skills"].remove(skill_name)
            log_audit(f"REJECTED skill: {skill_name}")
    
    registry["last_synchronized"] = datetime.now().isoformat()
    save_registry(registry)

def list_pending():
    # In the future, this will scan Sognatore/resources/skills/quarantine/
    quarantine_dir = os.path.abspath("../../Sognatore/resources/skills/quarantine")
    if not os.path.exists(quarantine_dir):
        print("No quarantine directory found.")
        return
    
    files = [f for f in os.listdir(quarantine_dir) if f.endswith(".md")]
    if not files:
        print("Quarantine is empty. All systems stable.")
    else:
        print("Pending Review in Quarantine:")
        for f in files:
            print(f" - [ ] {f}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mentor_audit.py <list|approve|reject> [skill_name]")
        sys.exit(1)
    
    cmd = sys.argv[1]
    if cmd == "list":
        list_pending()
    elif cmd == "approve" and len(sys.argv) == 3:
        audit_skill(sys.argv[2], "approve")
    elif cmd == "reject" and len(sys.argv) == 3:
        audit_skill(sys.argv[2], "reject")
