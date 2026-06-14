import os
import json
import re
import sys

# SOGNA: Sentinel Forbidden Pattern Auditor
# Usa control.json para escanear el monorepo en busca de patrones inseguros.

def load_control():
    control_path = os.path.join(os.path.dirname(__file__), "data", "control.json")
    with open(control_path, "r", encoding="utf-8") as f:
        return json.load(f)

def scan_file(file_path, forbidden_patterns):
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                for pattern in forbidden_patterns:
                    if re.search(pattern, line):
                        findings.append({
                            "line": i + 1,
                            "pattern": pattern,
                            "content": line.strip()
                        })
    except Exception as e:
        print(f"Error escaneando {file_path}: {e}")
    return findings

def audit():
    print("[SENTINEL] Iniciando auditoría de patrones prohibidos...")
    control = load_control()
    forbidden = control.get("main_control", {}).get("forbidden_patterns", [])
    
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    exclude_dirs = {".git", "node_modules", "dist", "build", ".sognatore"}
    
    total_findings = 0
    report = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith((".ts", ".js", ".py", ".sh", ".json")):
                path = os.path.join(root, file)
                findings = scan_file(path, forbidden)
                if findings:
                    total_findings += len(findings)
                    report.append({
                        "file": os.path.relpath(path, root_dir),
                        "findings": findings
                    })

    if total_findings > 0:
        print(f"\x1b[31m[ALERTA]\x1b[0m Se encontraron {total_findings} violaciones de seguridad.")
        for item in report:
            print(f"\nArchivo: {item['file']}")
            for f in item['findings']:
                print(f"  L{f['line']}: [{f['pattern']}] -> {f['content']}")
        return False
    
    print("\x1b[32m[OK]\x1b[0m No se detectaron patrones prohibidos.")
    return True

if __name__ == "__main__":
    success = audit()
    sys.exit(0 if success else 1)
