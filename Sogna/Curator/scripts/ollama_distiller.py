import os
import json
import requests
import datetime

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
HISTORY_PATH = os.path.join(MEMORY_ROOT, "operational", "logs", "history.md")
CONCEPTS_DIR = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "concepts")
OLLAMA_URL = "http://localhost:11434/api/generate"

def distill():
    print("--- SOGNA KNOWLEDGE DISTILLER (Secretary Ollama) ---")
    
    if not os.path.exists(HISTORY_PATH):
        print("[ERROR] History not found.")
        return

    with open(HISTORY_PATH, 'r', encoding='utf-8') as f:
        history = f.read()

    # Get the last session block
    blocks = history.split('## [')
    if len(blocks) < 2:
        print("[INFO] Not enough history to distill.")
        return
    
    last_block = '## [' + blocks[-1]

    prompt = f"""
    You are the Sogna Knowledge Secretary. 
    Analyze the following session log and extract ATOMIC CONCEPTS.
    A concept is a specific rule, preference, or technical decision that must be remembered.
    
    SESSION LOG:
    {last_block}
    
    Return a JSON list of concepts. Each concept should have:
    - "name": Brief name of the concept.
    - "content": Detailed explanation.
    - "category": (Identity, UX, Architecture, or Security).
    - "why": The rationale behind it.
    
    Example: {{"name": "No Grandilocuencia", "content": "Prohibido el uso de términos innecesarios", "category": "Identity", "why": "Directiva institucional del Operador"}}
    
    Return ONLY JSON.
    """

    data = {
        "model": "qwen2.5-coder:7b",
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    print("Requesting distillation from Ollama...")
    try:
        response = requests.post(OLLAMA_URL, json=data, timeout=120)
        response.raise_for_status()
        concepts_raw = response.json().get("response", "[]")
        concepts = json.loads(concepts_raw)
        
        if not os.path.exists(CONCEPTS_DIR):
            os.makedirs(CONCEPTS_DIR)
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(CONCEPTS_DIR, f"concepts_{timestamp}.json")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(concepts, f, indent=2)
            
        print(f"[SUCCESS] Extracted {len(concepts)} concepts into {output_path}")
        
    except Exception as e:
        print(f"[ERROR] Distillation failed: {e}")

if __name__ == "__main__":
    distill()
