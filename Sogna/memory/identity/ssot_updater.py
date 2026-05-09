import json
import os
import shutil
from datetime import datetime
import requests

class SSOTUpdater:
    def __init__(self, base_path="Sogna/memory"):
        self.base_path = base_path
        self.registry_path = os.path.join(base_path, "identity/registry.json")
        self.sogna_md_path = os.path.join(base_path, "identity/sogna.md")
        self.episodic_path = os.path.join(base_path, "intelligence/episodic")
        
        with open(self.registry_path, 'r', encoding='utf-8') as f:
            self.registry = json.load(f)
        
        self.ollama_url = f"{self.registry['ollama_config']['endpoint']}/api/generate"
        self.model = self.registry['ollama_config']['model']

    def update(self):
        print(f"[{datetime.now().isoformat()}] Starting SSOT Identity Update...")
        
        # 1. Backup sogna.md
        backup_path = self.sogna_md_path + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(self.sogna_md_path, backup_path)
        print(f"Backup created: {backup_path}")

        # 2. Collect episodic insights
        reflections = []
        for file in os.listdir(self.episodic_path):
            if file.endswith(".md"):
                with open(os.path.join(self.episodic_path, file), 'r', encoding='utf-8') as f:
                    reflections.append(f.read())
        
        with open(self.sogna_md_path, 'r', encoding='utf-8') as f:
            current_identity = f.read()

        # 3. Prompt Ollama for synthesis
        prompt = f"""
        You are the Master Identity Architect of Sogna.
        Your task is to integrate recent operational reflections into the Master Identity Document (sogna.md).
        
        CURRENT IDENTITY:
        {current_identity}
        
        RECENT REFLECTIONS:
        {chr(10).join(reflections)}
        
        INSTRUCTIONS:
        1. Maintain the institutional, professional, and Spanish tone.
        2. Keep the core directives (Operator Sovereignty, Determinism).
        3. Add new capabilities or lessons learned from the reflections.
        4. Output the COMPLETE NEW sogna.md content. Do not include your own thoughts, only the markdown.
        """

        try:
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            })
            new_content = response.json().get("response", "")
            
            if new_content:
                with open(self.sogna_md_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print("SSOT Identity (sogna.md) updated successfully.")
                return True
        except Exception as e:
            print(f"Error during SSOT update: {e}")
        
        return False

if __name__ == "__main__":
    updater = SSOTUpdater()
    updater.update()
