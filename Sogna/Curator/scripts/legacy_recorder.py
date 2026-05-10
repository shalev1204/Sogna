import os
import json
import requests

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
HANDBOOK_PATH = os.path.join(MEMORY_ROOT, "identity", "agent_handbook.md")
OLLAMA_URL = "http://localhost:11434/api/generate"

def record_legacy():
    print("--- SOGNA LEGACY RECORDER (Delegating to Ollama) ---")
    
    # Context of what we've built
    capabilities = """
    - UMA L3: Vector Memory (ChromaDB) via query_uma.py and index_uma.py.
    - UMA L4: Semantic Graph via graph.json and graph_explorer.py.
    - UMA L9: Cognitive Secretary (Ollama) via identity_audit.py and ollama_distiller.py.
    - Identity: Prohibited grandiloquence, Professional treatment (Usted).
    - Bootstrap: ACTIVE_CONTEXT.md is the anchor.
    """

    prompt = f"""
    You are the Sogna Knowledge Architect. 
    Write the 'SOGNA AGENT HANDBOOK'. This is a mandatory manual for any AI agent joining the Sogna ecosystem.
    
    CAPABILITIES BUILT:
    {capabilities}
    
    The handbook must explain:
    1. MISSION: Maintain identity purity and professional rigor.
    2. TOOLS: How and when to use the Vector Oracle and the Semantic Graph.
    3. RECURSIVITY: Why the agent must run the audit scripts.
    4. PROHIBITIONS: Words to never use.
    
    Tone: Extremely technical, institutional, and authoritative.
    Language: Spanish (es-ES).
    
    Return the content in Markdown.
    """

    data = {
        "model": "qwen2.5-coder:7b",
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=data, timeout=120)
        content = response.json().get("response", "")
        
        with open(HANDBOOK_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"[SUCCESS] Agent Handbook updated at {HANDBOOK_PATH}")
        
    except Exception as e:
        print(f"[ERROR] Legacy recording failed: {e}")

if __name__ == "__main__":
    record_legacy()
