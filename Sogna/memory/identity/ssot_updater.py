import json
import os
import shutil
from datetime import datetime
import requests

MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class SSOTUpdater:
    def __init__(self, base_path=None):
        if base_path is None:
            self.base_path = MEMORY_ROOT
        else:
            self.base_path = base_path

        self.registry_path = os.path.join(self.base_path, "identity", "registry.json")
        self.sogna_md_path = os.path.join(self.base_path, "identity", "sogna.md")
        self.episodic_path = os.path.join(self.base_path, "intelligence", "episodic")
        self.bus_path = os.path.join(self.base_path, "intelligence", "events", "bus.json")

        with open(self.registry_path, 'r', encoding='utf-8') as f:
            self.registry = json.load(f)

        self.ollama_url = self.registry['ollama_config']['endpoint'] + "/api/generate"
        self.model = self.registry['ollama_config']['model']

    def emit_event(self, event_type, details, severity="info"):
        """Emit a CloudEvents 1.0 compliant event to the institutional bus."""
        try:
            with open(self.bus_path, 'r', encoding='utf-8') as f:
                bus = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            bus = {"events": []}

        now = datetime.now()
        new_event = {
            "specversion": "1.0",
            "id": "evt_" + now.strftime('%Y%m%d_%H%M%S') + "_" + str(os.getpid()),
            "type": "sogna.memory." + event_type.lower(),
            "source": "SSOTUpdater",
            "time": now.isoformat() + "Z",
            "datacontenttype": "application/json",
            "data": {
                "severity": severity,
                "details": details,
                "phase": "ssot_update"
            }
        }
        bus["events"].append(new_event)

        if len(bus["events"]) > 200:
            bus["events"] = bus["events"][-200:]

        with open(self.bus_path, 'w', encoding='utf-8') as f:
            json.dump(bus, f, indent=2, ensure_ascii=False)

    def update(self):
        print("[" + datetime.now().isoformat() + "] Starting SSOT Identity Update...")

        # 1. Backup sogna.md
        backup_dir = os.path.join(self.base_path, "archive", "backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup_name = "sogna_" + datetime.now().strftime('%Y%m%d_%H%M%S') + ".md"
        backup_path = os.path.join(backup_dir, backup_name)
        shutil.copy2(self.sogna_md_path, backup_path)
        print("Backup created: " + backup_name)

        # 2. Collect episodic insights
        reflections = []
        if os.path.exists(self.episodic_path):
            for file in os.listdir(self.episodic_path):
                if file.endswith((".md", ".json")):
                    filepath = os.path.join(self.episodic_path, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            reflections.append(f.read())
                    except Exception as e:
                        print("Warning: Could not read " + file + ": " + str(e))

        if not reflections:
            print("[INFO] No episodic reflections found. SSOT update skipped.")
            return False

        with open(self.sogna_md_path, 'r', encoding='utf-8') as f:
            current_identity = f.read()

        # 3. Prompt Ollama for synthesis
        prompt = """
        You are the Master Identity Architect of Sogna.
        Your task is to integrate recent operational reflections into the Master Identity Document (sogna.md).

        CURRENT IDENTITY:
        """ + current_identity + """

        RECENT REFLECTIONS:
        """ + chr(10).join(reflections) + """

        INSTRUCTIONS:
        1. Maintain the institutional, professional, and Spanish tone.
        2. Keep the core directives (Operator Control, Determinism).
        3. Add new capabilities or lessons learned from the reflections.
        4. Output the COMPLETE NEW sogna.md content. Do not include your own thoughts, only the markdown.
        """

        try:
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }, timeout=300)
            response.raise_for_status()
            new_content = response.json().get("response", "")

            if new_content and len(new_content) > 500:
                with open(self.sogna_md_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print("SSOT Identity (sogna.md) updated successfully.")
                self.emit_event("SSOT_UPDATED", "Identity document updated from " + str(len(reflections)) + " reflections")
                return True
            else:
                print("[WARNING] Generated content too short. SSOT not updated (safety guard).")
                self.emit_event("SSOT_UPDATE_REJECTED", "Content too short: " + str(len(new_content)) + " chars", "warning")
                return False
        except Exception as e:
            print("Error during SSOT update: " + str(e))
            self.emit_event("SSOT_UPDATE_FAILED", str(e), "error")

        return False


if __name__ == "__main__":
    updater = SSOTUpdater()
    updater.update()
