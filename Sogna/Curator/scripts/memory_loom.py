import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class MemoryLoom:
    def __init__(self, root_dir="."):
        self.root = Path(root_dir).resolve()
        self.memory_dir = self.root / "memory"
        self.intelligence_dir = self.memory_dir / "intelligence"
        self.registry_path = self.memory_dir / "registry.json"
        self.context_path = self.memory_dir / "SOGNA_CONTEXT.md"
        
        self.registry = self.load_registry()

    def load_registry(self):
        if self.registry_path.exists():
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def parse_fragment(self, content):
        fm_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
        metadata = {}
        if fm_match:
            lines = fm_match.group(1).split('\n')
            for line in lines:
                if ':' in line:
                    k, v = line.split(':', 1)
                    metadata[k.strip()] = v.strip()
        
        body = re.sub(r'^---\n.*?\n---', '', content, flags=re.DOTALL).strip()
        body = re.sub(r'^# .*?\n', '', body).strip() # Remove main header
        return metadata, body

    def weave(self):
        print("🧵 [THE LOOM] Starting intelligence synthesis...")
        
        if not self.intelligence_dir.exists():
            print("! Intelligence directory not found.")
            return

        fragments = [f for f in self.intelligence_dir.glob("*.md") if f.name != "thread_intel.md"]
        if not fragments:
            print("! No fragments found to synthesize.")
            return

        # Sort by modification time descending (newest first)
        fragments.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        target_fragments = fragments[:20]

        print(f"Found {len(fragments)} fragments. Synthesizing the {len(target_fragments)} newest...")
        
        insights = []
        for frag_path in target_fragments:
            
            with open(frag_path, 'r', encoding='utf-8') as f:
                content = f.read()
                metadata, body = self.parse_fragment(content)
                
                if body:
                    insights.append(f"- [{metadata.get('timestamp', 'Unknown')}] ({metadata.get('key', 'General')}): {body[:200]}...")

        if not insights:
            print("! No actionable insights extracted.")
            return

        self.update_context(insights)
        print("✅ Synthesis complete. SOGNA_CONTEXT.md updated.")

    def update_context(self, insights):
        if not self.context_path.exists():
            return

        with open(self.context_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Target section: ## 5. Synthesized Intelligence (Loom)
        target_section = "## 5. Synthesized Intelligence (Loom)"
        if target_section not in content:
            content += f"\n\n{target_section}\n\n"

        # Limit to last 20 insights for precision
        new_bullets = "\n".join(insights[-20:])
        
        # Replace existing bullets or append
        pattern = rf"{re.escape(target_section)}.*?(?=\n##|\Z)"
        replacement = f"{target_section}\n\n{new_bullets}\n"
        
        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

        with open(self.context_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

if __name__ == "__main__":
    loom = MemoryLoom()
    loom.weave()
