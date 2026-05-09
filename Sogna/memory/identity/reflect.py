import os
import json
import datetime
import requests

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(_file_), ".."))
LOGS_DIR = os.path.join(MEMORY_ROOT, "operational", "logs")
EPISODIC_DIR = os.path.join(MEMORY_ROOT, "intelligence", "episodic")
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def load_config():
    with open(REGISTRY_PATH, 'r') as f:
        config = json.load(f)
    return config.get("ollama_config", {})

import subprocess

def trigger_post_reflection():
    """Trigger recursive distillation and SSOT updates."""
    distill_path = os.path.join(MEMORY_ROOT, "identity", "distill.py")
    if os.path.exists(distill_path):
        print("\n--- TRIGGERING RECURSIVE DISTILLATION ---")
        subprocess.run(["python", distill_path])
        
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry = json.load(f)
    
    synthesis = registry.get("synthesis", {})
    count = synthesis.get("current_reflection_count", 0) + 1
    trigger_count = synthesis.get("trigger_count", 50)
    
    registry["synthesis"]["current_reflection_count"] = count
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2)
        
    print(f"[INFO] Reflection count updated: {count}/{trigger_count}")
    
    if count >= trigger_count:
        ssot_path = os.path.join(MEMORY_ROOT, "identity", "ssot_updater.py")
        if os.path.exists(ssot_path):
            print("\n--- TRIGGERING SSOT UPDATE LOOP ---")
            subprocess.run(["python", ssot_path])

def reflect():
    """
    Sogna Autonomous Reflection Engine (Ollama Powered).
    Synthesizes recent operational logs into episodic memory.
    """
print("-- SOGNA REFLECTION ENGINE (OLLAMA) --")
    config = load_config()
    endpoint = f"{config.get('endpoint', 'http://localhost:11434')}/api/generate"
    model = config.get("model", "qwen2.5-coder:7b")

    if not os.path.exists(LOGS_DIR):
        print(f"[ERROR] Logs directory not found at {LOGS_DIR}")
        return
        
    logs_files = [f for f in os.listdir(LOGS_DIR) if f.endswith('.md') or f.endswith('.txt')]
    if not logs_files:
        print("[INFO] No new logs found to reflect upon.")
        return

# Read the most recent logs
    context_text = ""
    for log_file in logs_files[-5:]: # Analyze last 5 logs
        with open(os.path.join(LOGS_DIR, log_file), 'r', encoding='utf-8') as f:
            context_text += f"\n--- LOG: {log_file} ---\n" + f.read()

    prompt = f"""
    You are the Sogna Reflection Engine. 
    Below are the operational logs of the recent session. 
    Your task is to summarize the key technical decisions, resolved errors, and structural changes.
    Extract "Signal" from the "Noise". 
    
    LOGS:
    {context_text}
    
    Output in professional Markdown. Focus on:
    - Technical Milestones
    - Resolved Blockers
    - Architectural Evolution
    - Strategic Intent Updates
    """

    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    print(f"Connecting to Ollama ({model}) for synthesis...")
    try:
        response = requests.post(endpoint, json=data, timeout=120)
        response.raise_for_status()
        result = response.json().get("response", "")
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
summary_filename = f"episodic_reflection_{timestamp}.md"
summary_path = os.path.join(EPISODIC_DIR, summary_filename)
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(result)
            
print(f"Reflection complete. Episodic memory created: {summary_filename}")
        
# Trigger post-reflection tasks (distillation and SSOT loop)
        trigger_post_reflection()
        
    except Exception as e:
        print(f"[ERROR] Reflection failed: {e}")

if _name_ == "_main_":
    reflect()
