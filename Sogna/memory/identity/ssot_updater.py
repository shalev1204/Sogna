import os
import json
import shutil
import datetime
import requests

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")
SOGNA_MD_PATH = os.path.join(MEMORY_ROOT, "identity", "sogna.md")
EPISODIC_DIR = os.path.join(MEMORY_ROOT, "intelligence", "episodic")

def load_config():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config

def save_config(config):
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

def update_ssot():
    """
    Sogna SSOT Loop Engine.
    Reads current sogna.md and recent episodic reflections to synthesize a new, upgraded identity.
    """
    print("--- SOGNA SSOT LOOP (IDENTITY SELF-CORRECTION) ---")
    config = load_config()
    
    if not os.path.exists(SOGNA_MD_PATH):
        print("[ERROR] sogna.md not found.")
        return

    # Backup current sogna.md
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = SOGNA_MD_PATH + f".{timestamp}.bak"
    shutil.copy2(SOGNA_MD_PATH, backup_path)
    print(f"[INFO] Backup created: {backup_path}")

    # Read current identity
    with open(SOGNA_MD_PATH, 'r', encoding='utf-8') as f:
        current_identity = f.read()

    # Read recent episodic reflections
    episodic_context = ""
    if os.path.exists(EPISODIC_DIR):
        files = sorted([f for f in os.listdir(EPISODIC_DIR) if f.endswith('.md')])[-5:] # Last 5
        for file in files:
            with open(os.path.join(EPISODIC_DIR, file), 'r', encoding='utf-8') as f:
                episodic_context += f"\n--- RECENT LEARNING: {file} ---\n" + f.read()

    prompt = f"""
    You are the Sogna SSOT (Single Source of Truth) Updater.
    Your task is to rewrite the Core Identity (`sogna.md`) to integrate new learnings.
    DO NOT lose the core personality, primary directives, or formatting.
    Integrate the "RECENT LEARNINGS" into the architecture or rules sections seamlessly.
    
    CURRENT IDENTITY:
    {current_identity}
    
    RECENT LEARNINGS:
    {episodic_context}
    
    Output ONLY the complete, newly updated Markdown content for `sogna.md`.
    """

    o_config = config.get("ollama_config", {})
    endpoint = f"{o_config.get('endpoint', 'http://localhost:11434')}/api/generate"
    model = o_config.get("model", "qwen2.5-coder:7b")

    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    print(f"Connecting to Ollama ({model}) to synthesize new identity...")
    try:
        response = requests.post(endpoint, json=data, timeout=300)
        response.raise_for_status()
        new_identity = response.json().get("response", "").strip()
        
        # Sometimes Ollama wraps output in markdown code blocks. We strip them if present.
        if new_identity.startswith("```markdown") and new_identity.endswith("```"):
            new_identity = new_identity[11:-3].strip()
        elif new_identity.startswith("```") and new_identity.endswith("```"):
            new_identity = new_identity[3:-3].strip()

        with open(SOGNA_MD_PATH, 'w', encoding='utf-8') as f:
            f.write(new_identity)
            
        print("[SUCCESS] sogna.md has been successfully updated and self-corrected.")
        
        # Reset the counter
        config["synthesis"]["current_reflection_count"] = 0
        save_config(config)
        print("[INFO] Synthesis counter reset to 0.")
        
    except Exception as e:
        print(f"[ERROR] SSOT Loop failed: {e}")
        # Restore backup
        shutil.copy2(backup_path, SOGNA_MD_PATH)
        print("[INFO] Rolled back to backup.")

if __name__ == "__main__":
    update_ssot()
