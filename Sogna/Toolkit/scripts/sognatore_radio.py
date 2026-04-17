import os
import sys
import json
import subprocess
from datetime import datetime

# Sognatore RADIO: The Strategic Relay
# This script is the invisible bridge for Antigravity to command Sognatore.

def broadcast_intent(intent_type, content):
    """
    Relays a strategic intention to Sognatore.
    Types: 'with_the_flow', 'mega_prd', 'security_abort'
    """
    task_id = f"radio_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Path configuration
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sognatore_dir = os.path.join(base_dir, "Sognatore")
    queue_dir = os.path.join(sognatore_dir, ".sognatore", "queue")
    os.makedirs(queue_dir, exist_ok=True)
    
    task_file = os.path.join(queue_dir, f"{task_id}.json")
    
    task_data = {
        "id": task_id,
        "type": intent_type,
        "description": content,
        "timestamp": datetime.now().isoformat(),
        "source": "antigravity_radio"
    }
    
    with open(task_file, "w", encoding="utf-8") as f:
        json.dump(task_data, f, indent=2)
    
    print(f"[*] Radio: Strategic Relay established. Task {task_id} queued.")
    
    # In 'With the Flow' mode, we might want to trigger the activator directly
    if intent_type == "with_the_flow":
        activator_script = os.path.join(base_dir, "Sogna", "toolkit", "scripts", "activate_sognatore.py")
        # For 'with-the-flow', we use a virtual PRD or the task itself as context
        # We pass 'AD_HOC' to let indicate it's not a physical PRD file
        subprocess.Popen([sys.executable, activator_script, "AD_HOC"], 
                         start_new_session=True)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python sogna_radio.py <type> <content>")
        sys.exit(1)
    
    broadcast_intent(sys.argv[1], sys.argv[2])
