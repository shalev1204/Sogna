import json
import os
import shutil
from datetime import datetime
import requests

class RecursiveDistiller:
    def __init__(self, base_path=None):
        if base_path is None:
            # Resolve relative to this script: .. (identity -> memory)
            self.base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        else:
            self.base_path = base_path
        self.registry_path = os.path.join(self.base_path, "identity", "registry.json")
        self.episodic_path = os.path.join(self.base_path, "intelligence", "episodic")
        self.semantic_path = os.path.join(self.base_path, "intelligence", "semantic", "knowledge")
        self.archive_path = os.path.join(self.base_path, "archive", "episodic")
        self.bus_path = os.path.join(self.base_path, "intelligence", "events", "bus.json")

        with open(self.registry_path, 'r', encoding='utf-8') as f:
            self.registry = json.load(f)

        self.ollama_url = f"{self.registry['ollama_config']['endpoint']}/api/generate"
        self.model = self.registry['ollama_config']['model']

        os.makedirs(self.semantic_path, exist_ok=True)
        os.makedirs(self.archive_path, exist_ok=True)

    def emit_event(self, event_type, details):
        """Emit a structured CloudEvents-compatible event to the institutional bus."""
        try:
            with open(self.bus_path, 'r', encoding='utf-8') as f:
                bus = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            bus = {"events": []}

        now = datetime.now()
        new_event = {
            "specversion": "1.0",
            "id": f"evt_{now.strftime('%Y%m%d_%H%M%S')}_{os.getpid()}",
            "type": f"sogna.memory.{event_type.lower()}",
            "source": "DistillationEngine",
            "time": now.isoformat() + "Z",
            "datacontenttype": "application/json",
            "data": {
                "severity": "info",
                "details": details,
                "phase": "distillation"
            }
        }
        bus["events"].append(new_event)

        # Keep only last 200 events (institutional cap)
        if len(bus["events"]) > 200:
            bus["events"] = bus["events"][-200:]

        with open(self.bus_path, 'w', encoding='utf-8') as f:
            json.dump(bus, f, indent=2, ensure_ascii=False)

    def distill(self):
        files = [f for f in os.listdir(self.episodic_path) if f.endswith((".md", ".json"))]
        if len(files) < 1:
            print("Not enough episodic data to distill.")
            return False

        print(f"[{datetime.now().isoformat()}] Starting Recursive Distillation of {len(files)} reflections...")

        reflections = []
        for file in files:
            with open(os.path.join(self.episodic_path, file), 'r', encoding='utf-8') as f:
                reflections.append(f.read())

        prompt = f"""
        Extract generalized semantic rules from these episodic reflections.
        Focus on coding patterns, architectural decisions, and repository-specific quirks.

        REFLECTIONS:
        {chr(10).join(reflections)}

        OUTPUT FORMAT:
        A markdown file with:
        # Extracted Semantic Rules - {datetime.now().strftime('%Y-%m-%d')}
        - Rule 1: [Description]
        - Rule 2: [Description]
        ...
        """

        try:
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }, timeout=180)
            rules = response.json().get("response", "")

            if rules:
                rule_file = f"extracted_rules_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
                with open(os.path.join(self.semantic_path, rule_file), 'w', encoding='utf-8') as f:
                    f.write(rules)
                print(f"Distillation complete: {rule_file}")

                # Emit event to institutional bus
                self.emit_event("DISTILLATION_COMPLETE", f"Extracted rules to {rule_file} from {len(files)} reflections")

                # Archive processed files
                for file in files:
                    src = os.path.join(self.episodic_path, file)
                    dst = os.path.join(self.archive_path, file)
                    shutil.move(src, dst)
                print(f"Archived {len(files)} episodic files.")
                return True
        except Exception as e:
            print(f"Error during distillation: {e}")
            self.emit_event("DISTILLATION_FAILED", str(e))

        return False

if __name__ == "__main__":
    distiller = RecursiveDistiller()
    distiller.distill()
