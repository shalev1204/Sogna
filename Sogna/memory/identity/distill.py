import os
import json
import shutil
import datetime
import requests

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
EPISODIC_DIR = os.path.join(MEMORY_ROOT, "intelligence", "episodic")
SEMANTIC_DIR = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "knowledge", "extracted_rules")
ARCHIVE_EPISODIC = os.path.join(MEMORY_ROOT, "archive", "episodic")
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")

def load_config():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config.get("ollama_config", {})

def distill():
    """
    Sogna Recursive Distillation Engine.
    Reads episodic reflections, extracts generalized semantic rules, and archives the episodic source.
    """
    print("--- SOGNA RECURSIVE DISTILLATION (EPISODIC -> SEMANTIC) ---")
    
    os.makedirs(SEMANTIC_DIR, exist_ok=True)
    os.makedirs(ARCHIVE_EPISODIC, exist_ok=True)

    if not os.path.exists(EPISODIC_DIR):
        print(f"[ERROR] Episodic directory not found at {EPISODIC_DIR}")
        return

    episodic_files = [f for f in os.listdir(EPISODIC_DIR) if f.endswith('.md')]
    # Require at least 2 episodic files to perform distillation
    if len(episodic_files) < 2:
        print(f"[INFO] Not enough episodic data to distill ({len(episodic_files)}/2). Waiting.")
        return

    config = load_config()
    endpoint = f"{config.get('endpoint', 'http://localhost:11434')}/api/generate"
    model = config.get("model", "qwen2.5-coder:7b")

    # Read the episodic content
    context_text = ""
    for file in episodic_files:
        with open(os.path.join(EPISODIC_DIR, file), 'r', encoding='utf-8') as f:
            context_text += f"\n--- EPISODIC: {file} ---\n" + f.read()

    prompt = f"""
    You are the Sogna Semantic Distillation Engine. 
    Below are specific "Episodic Reflections" (logs of isolated events).
    Your task is to generalize this knowledge. Extract overarching rules, patterns, or architecture principles.
    Ignore the specific log names or isolated failures. Focus on the core lessons learned.
    
    EPISODIC CONTENT:
    {context_text}
    
    Output in professional Markdown. Create a list of "Semantic Rules" and "Best Practices".
    """

    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    print(f"Connecting to Ollama ({model}) for semantic distillation...")
    try:
        response = requests.post(endpoint, json=data, timeout=180)
        response.raise_for_status()
        result = response.json().get("response", "")
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        semantic_filename = f"semantic_rule_{timestamp}.md"
        semantic_path = os.path.join(SEMANTIC_DIR, semantic_filename)
        
        # Save the distilled rule
        with open(semantic_path, 'w', encoding='utf-8') as f:
            f.write(result)
            
        print(f"[SUCCESS] Semantic knowledge created: {semantic_path}")
        
        # Archive the processed episodic files
        for file in episodic_files:
            shutil.move(os.path.join(EPISODIC_DIR, file), os.path.join(ARCHIVE_EPISODIC, file))
        print(f"[ARCHIVED] Moved {len(episodic_files)} episodic files to archive.")
        
    except Exception as e:
        print(f"[ERROR] Distillation failed: {e}")

if __name__ == "__main__":
    distill()
