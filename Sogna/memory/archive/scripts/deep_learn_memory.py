import requests
import json
import os

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
REGISTRY_PATH = os.path.join(MEMORY_ROOT, "identity", "registry.json")
MASTER_INTEL = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "knowledge", "memory_intelligence", "uma_master_intelligence.md")
IDENTITY_FILE = os.path.join(MEMORY_ROOT, "identity", "sogna.md")

def run_evolution():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    with open(MASTER_INTEL, 'r', encoding='utf-8') as f:
        master = f.read()
        
    with open(IDENTITY_FILE, 'r', encoding='utf-8') as f:
        identity = f.read()

    endpoint = f"{config['ollama_config']['endpoint']}/api/generate"
    model = config['ollama_config']['model']

    prompt = f"""
    Compare the current Sogna Identity/Architecture with the new Master Intelligence Best Practices for AI Memory.
    Identify gaps and suggest 3 specific technical upgrades to achieve "Billion Dollar" cognitive autonomy.
    
    CURRENT IDENTITY (Partial):
    {identity[:3000]}
    
    MASTER BEST PRACTICES:
    {master}
    
    Output a professional technical plan in Markdown.
    """

    print(f"Asking Ollama ({model}) for the next evolution step...")
    resp = requests.post(endpoint, json={"model": model, "prompt": prompt, "stream": False}, timeout=180)
    result = resp.json().get("response")
    
    output_path = os.path.join(MEMORY_ROOT, "intelligence", "episodic", "evolution_plan_v3.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)
    
    print(f"Evolution plan generated at: {output_path}")

if _name_ == "_main_":
    run_evolution()
