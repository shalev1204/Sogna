import os
import json
import requests
import sys

MEMORY_ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna\memory"
HISTORY_PATH = os.path.join(MEMORY_ROOT, "operational", "logs", "history.md")
RULES_PATH = os.path.join(MEMORY_ROOT, "identity", "rules.md")
ACTIVE_CONTEXT_PATH = os.path.join(MEMORY_ROOT, "ACTIVE_CONTEXT.md")
DEVIATIONS_LOG = os.path.join(MEMORY_ROOT, "operational", "logs", "deviations.log")
OLLAMA_URL = "http://localhost:11434/api/generate"

def audit_identity():
    print("--- SOGNA IDENTITY AUDIT (Internal Affairs) ---")
    
    if not os.path.exists(HISTORY_PATH):
        return

    with open(HISTORY_PATH, 'r', encoding='utf-8') as f:
        history = f.read()
    
    with open(RULES_PATH, 'r', encoding='utf-8') as f:
        rules = f.read()

    # Get only the last response block from the agent
    blocks = history.split('### Antigravity')
    if len(blocks) < 2:
        return
    
    last_response = blocks[-1]

    prompt = f"""
    You are the Sogna Internal Auditor. 
    Review the following response from the AI Agent 'Antigravity' against the Sogna Rules.
    
    RULES:
    {rules}
    
    LAST RESPONSE:
    {last_response}
    
    CHECKLIST:
    1. Did the agent use prohibited suffixes (Edition, Prime)?
    2. Is the tone technical and institutional (NOT bubbly or emotional)?
    3. Is the treatment "Usted" for the Operator?
    4. Is the language Spanish (es-ES)?
    
    If there is any deviation, return a JSON object with "status": "DEVIATION", "reason": "Detailed explanation", "severity": "HIGH|MEDIUM".
    If everything is correct, return {{"status": "ALIGNED"}}.
    
    Return ONLY JSON.
    """

    data = {
        "model": "qwen2.5-coder:7b",
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(OLLAMA_URL, json=data, timeout=120)
        result = json.loads(response.json().get("response", "{}"))
        
        if result.get("status") == "DEVIATION":
            print(f"[ALERT] Identity Deviation Detected: {result['reason']}")
            
            # Log the deviation
            with open(DEVIATIONS_LOG, 'a', encoding='utf-8') as f:
                f.write(f"\n[{result['severity']}] {result['reason']}")
            
            # Inject into Active Context to force awareness in next session
            with open(ACTIVE_CONTEXT_PATH, 'r', encoding='utf-8') as f:
                content = f.read()
            
            alert_msg = f"\n> [!CAUTION]\n> IDENTITY DEVIATION DETECTED: {result['reason']}\n"
            if "IDENTITY DEVIATION" not in content:
                with open(ACTIVE_CONTEXT_PATH, 'w', encoding='utf-8') as f:
                    f.write(alert_msg + content)
        else:
            print("[OK] Identity Aligned.")
            
    except Exception as e:
        print(f"[ERROR] Audit failed: {e}")

if __name__ == "__main__":
    audit_identity()
