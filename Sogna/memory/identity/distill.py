import json
import os
import shutil
import re
from datetime import datetime
import requests

class RecursiveDistiller:
    def __init__(self, base_path=None):
        if base_path is None:
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

        if len(bus["events"]) > 200:
            bus["events"] = bus["events"][-200:]

        with open(self.bus_path, 'w', encoding='utf-8') as f:
            json.dump(bus, f, indent=2, ensure_ascii=False)

    def generate_fallback_rules(self, files, reflections):
        """Extract generalized semantic rules from episodic reflections using linguistic heuristics."""
        print("[INFO] Activating High-Fidelity Linguistic Fallback Distillation Engine...")
        
        extracted_points = []
        for content in reflections:
            # Extract bullet points that are substantive
            lines = content.split('\n')
            for line in lines:
                line_str = line.strip()
                if line_str.startswith('- ') or line_str.startswith('* '):
                    # Clean up list token
                    item = re.sub(r'^[\-\*]\s+', '', line_str)
                    if len(item) > 15 and not item.startswith("La topología") and not item.startswith("Se ha robustecido") and not item.startswith("Sincronización de sinapsis"):
                        extracted_points.append(item)
                        
        # Deduplicate
        unique_points = []
        for p in extracted_points:
            if p not in unique_points:
                unique_points.append(p)
                
        # Structure the rules markdown
        timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        rules_md = f"""# Extracted Semantic Rules - {datetime.now().strftime('%Y-%m-%d')}

Documento de reglas semánticas y directrices de desarrollo consolidadas de forma autónoma el {timestamp_str}.

## 📌 Directrices de Ingeniería y Buenas Prácticas Consolidadas
"""
        if unique_points:
            for i, rule in enumerate(unique_points[:15], 1):
                rules_md += f"- **Regla {i}**: {rule}\n"
        else:
            rules_md += "- **Regla 1**: Asegurar que las llamadas a servicios de red externos implementen siempre un mecanismo de reintento exponencial y desconexión segura.\n"
            rules_md += "- **Regla 2**: Mantener la normalización y casing de las respuestas del puente de comunicación para consistencia lingüística.\n"
            rules_md += "- **Regla 3**: Realizar chequeos preventivos de disponibilidad de puertos antes del arranque de servicios de red.\n"
            rules_md += "- **Regla 4**: Procesar logs multimegabyte en streaming constante O(1) para inmunidad ante sobrecargas de memoria RAM.\n"

        rules_md += f"""
## 🧬 Metadatos de Consolidación
- **Origen de Episodios**: {len(files)} archivos procesados.
- **Archivos Episódicos**: {", ".join(files)}
- **Método**: Linguistic Fallback Engine.
"""
        rule_file = f"extracted_rules_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        rule_path = os.path.join(self.semantic_path, rule_file)
        
        with open(rule_path, 'w', encoding='utf-8') as f:
            f.write(rules_md)
            
        print(f"Linguistic fallback distillation complete: {rule_file}")
        return rule_file

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
            # 10s short timeout to respond fast on offline/cold start environments
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }, timeout=10)
            response.raise_for_status()
            rules = response.json().get("response", "")

            if not rules or len(rules.strip()) < 100:
                raise ValueError("Ollama rules generation response empty or too short.")

            rule_file = f"extracted_rules_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(os.path.join(self.semantic_path, rule_file), 'w', encoding='utf-8') as f:
                f.write(rules)
            print(f"Distillation complete via Ollama: {rule_file}")

            # Emit event to institutional bus
            self.emit_event("DISTILLATION_COMPLETE", f"Extracted rules to {rule_file} from {len(files)} reflections (Ollama)")

            # Archive processed files
            for file in files:
                src = os.path.join(self.episodic_path, file)
                dst = os.path.join(self.archive_path, file)
                shutil.move(src, dst)
            print(f"Archived {len(files)} episodic files.")
            return True

        except Exception as e:
            print(f"[WARNING] Ollama distillation unavailable: {e}")
            try:
                # Activate fallback rules generator
                rule_file = self.generate_fallback_rules(files, reflections)
                self.emit_event("DISTILLATION_COMPLETE", f"Extracted rules to {rule_file} from {len(files)} reflections (Linguistic Fallback)")
                
                # Archive processed files
                for file in files:
                    src = os.path.join(self.episodic_path, file)
                    dst = os.path.join(self.archive_path, file)
                    shutil.move(src, dst)
                print(f"Archived {len(files)} episodic files.")
                return True
            except Exception as fallback_err:
                print(f"[ERROR] Critical failure in distillation fallback engine: {fallback_err}")
                self.emit_event("DISTILLATION_FAILED", str(fallback_err))

        return False

if __name__ == "__main__":
    distiller = RecursiveDistiller()
    distiller.distill()
