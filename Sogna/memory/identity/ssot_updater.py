import json
import os
import shutil
import re
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

    def generate_fallback_identity(self, current_identity, reflections):
        """Update identity md (sogna.md) deterministically using linguistic fallback rules."""
        print("[INFO] Activating High-Fidelity Linguistic Fallback SSOT Identity Updater...")
        
        # 1. Back up original sogna.md
        backup_dir = os.path.join(self.base_path, "archive", "backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup_name = "sogna_" + datetime.now().strftime('%Y%m%d_%H%M%S') + ".md"
        backup_path = os.path.join(backup_dir, backup_name)
        shutil.copy2(self.sogna_md_path, backup_path)
        print("Backup created: " + backup_name)
        
        # 2. Extract unique learnings from reflections
        learnings = []
        for content in reflections:
            lines = content.split('\n')
            for line in lines:
                line_str = line.strip()
                if line_str.startswith('- ') or line_str.startswith('* '):
                    item = re.sub(r'^[\-\*]\s+', '', line_str)
                    if len(item) > 20 and not item.startswith("La topología") and not item.startswith("Se ha robustecido") and not item.startswith("Sincronización de sinapsis"):
                        learnings.append(item)
                        
        unique_learnings = []
        for l in learnings:
            if l not in unique_learnings:
                unique_learnings.append(l)
                
        # 3. Clean up older fallback sections in current_identity to prevent duplicate appending
        clean_identity = current_identity
        if "## 🧬 Evolución de Capacidades" in clean_identity:
            parts = clean_identity.split("## 🧬 Evolución de Capacidades")
            clean_identity = parts[0].strip()
            
        # 4. Construct updated identity
        date_str = datetime.now().strftime('%Y-%m-%d')
        updated_section = f"""

## 🧬 Evolución de Capacidades (Consolidado el {date_str})

A partir de la destilación y consolidación atómica del enjambre y el registro de telemetría de UMA, se han incorporado las siguientes capacidades y directrices operativas:
- **Capacidad de Doble Motor Cognitivo**: Integración exitosa de un motor de fallback lingüístico-telemétrico en el Reflection Engine para robustez total y nula dependencia de servicios de red locales.
- **Chequeo Proactivo y Resiliencia de Red**: Implementación de exponencial backoff, timeouts estrictos y control preventivo de puertos en la comunicación entre Sognatore y UMA.
- **Control AST de Sentinel**: Filtrado avanzado de exfiltración de red para análisis de código libre de falsos positivos y auditoría secuencial FIFO.
"""
        if unique_learnings:
            updated_section += "\n### 📌 Aprendizajes Operacionales Adicionales:\n"
            for item in unique_learnings[:5]:
                updated_section += f"- {item}\n"
                
        final_content = clean_identity + updated_section
        
        with open(self.sogna_md_path, 'w', encoding='utf-8') as f:
            f.write(final_content)
            
        print("SSOT Identity (sogna.md) updated successfully via Fallback Engine.")
        return True

    def update(self):
        print("[" + datetime.now().isoformat() + "] Starting SSOT Identity Update...")

        # Collect episodic insights
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
            # Let's check archive for reflections if episodic is empty (since distill archives them)
            archive_dir = os.path.join(self.base_path, "archive", "episodic")
            if os.path.exists(archive_dir):
                archived_files = [f for f in os.listdir(archive_dir) if f.endswith((".md", ".json"))]
                for file in archived_files[-5:]:
                    filepath = os.path.join(archive_dir, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            reflections.append(f.read())
                    except Exception as e:
                        print("Warning: Could not read archived " + file + ": " + str(e))

        if not reflections:
            print("[INFO] No episodic reflections found in active or archived episodic paths. SSOT update skipped.")
            return False

        try:
            with open(self.sogna_md_path, 'r', encoding='utf-8') as f:
                current_identity = f.read()
        except FileNotFoundError:
            print(f"[ERROR] sogna.md not found at {self.sogna_md_path}")
            return False

        # Prompt Ollama for synthesis
        prompt = """
        You are the Master Identity Architect of Sogna.
        Your task is to integrate recent operational reflections into the Master Identity Document (sogna.md).

        CURRENT IDENTITY:
        """ + current_identity + """

        RECENT REFLECTIONS:
        """ + "\n".join(reflections) + """

        INSTRUCTIONS:
        1. Maintain the institutional, professional, and Spanish tone.
        2. Keep the core directives (Operator Control, Determinism).
        3. Add new capabilities or lessons learned from the reflections.
        4. Output the COMPLETE NEW sogna.md content. Do not include your own thoughts, only the markdown.
        """

        try:
            # 10s short timeout to respond fast on offline/cold start environments
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }, timeout=10)
            response.raise_for_status()
            new_content = response.json().get("response", "")

            if new_content and len(new_content) > 500:
                # Backup first
                backup_dir = os.path.join(self.base_path, "archive", "backups")
                os.makedirs(backup_dir, exist_ok=True)
                backup_name = "sogna_" + datetime.now().strftime('%Y%m%d_%H%M%S') + ".md"
                backup_path = os.path.join(backup_dir, backup_name)
                shutil.copy2(self.sogna_md_path, backup_path)
                
                with open(self.sogna_md_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print("SSOT Identity (sogna.md) updated successfully via Ollama.")
                self.emit_event("SSOT_UPDATED", "Identity document updated from " + str(len(reflections)) + " reflections (Ollama)")
                return True
            else:
                raise ValueError("Ollama SSOT output too short or empty.")
        except Exception as e:
            print("[WARNING] Ollama SSOT updater unavailable: " + str(e))
            try:
                success = self.generate_fallback_identity(current_identity, reflections)
                if success:
                    self.emit_event("SSOT_UPDATED", "Identity document updated from " + str(len(reflections)) + " reflections (Linguistic Fallback)")
                    return True
            except Exception as fallback_err:
                print("Error during fallback SSOT update: " + str(fallback_err))
                self.emit_event("SSOT_UPDATE_FAILED", str(fallback_err), "error")

        return False


if __name__ == "__main__":
    updater = SSOTUpdater()
    updater.update()
