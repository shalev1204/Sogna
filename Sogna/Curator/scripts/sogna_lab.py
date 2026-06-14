import sys
import os
import re
import argparse
from pathlib import Path

# - PROTOCOLO DE VALIDACIÓN DE ENTORNO -
def get_root():
    return Path(__file__).resolve().parent.parent

def validate_environment():
    root = get_root()
    required_paths = [
        root / "engines/Navigator",
        root / "Curator"
    ]
    missing = [str(p) for p in required_paths if not p.exists()]
    if missing:
        print("\n[!] ERROR DE ENTORNO: Dependencias de laboratorio no detectadas.")
        for p in missing:
            print(f"   Falta: {p}")
        sys.exit(1)

# - MÓDULO DE AUDITORÍA (NAVIGATOR) -
def run_audit(target_path):
    root = get_root()
    parent_dir = str(root / "engines")
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
        
    try:
        from Navigator.extract import extract # type: ignore
        from Navigator.audit import audit_graph # type: ignore
        
        test_file = Path(target_path)
        if not test_file.exists():
            print(f"Error: {test_file} no encontrado.")
            return
        print(f"[*] Analizando Grafo Cerebral de: {test_file.name}...")
        data = extract([test_file])
        report = audit_graph(data)

        print(f"\n[+] Auditoría Completa:")
        print(f"   • Nodos: {report['summary']['total_nodes']}")
        print(f"   • Aristas: {report['summary']['total_edges']}")
        print(f"   • Confianza: {report['summary']['confidence_avg']:.2f}")

        if report["critical_issues"]:
            print("\n[!] PROBLEMAS CRÍTICOS:")
            for issue in report["critical_issues"]:
                print(f"   - {issue['type']}: {issue['message']}")
    except ImportError as e:
        print(f"[-] Error de Importación: No se pudo cargar el motor Navigator: {e}")
    except Exception as e:
        print(f"[-] Error durante la auditoría: {e}")

# - MÓDULO DE REPARACIÓN (TEXT REPAIR) -
def repair_code(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error leyendo {path}: {e}")
        return False
    
    new_content = content
    
    # 1. Reparar .subString -> .substring
    method_fixes = {'substring': 'substring', 'subString': 'substring'}
    for low, fix in method_fixes.items():
        pattern = re.compile(r'\.' + re.escape(low) + r'(?=\s*\()', re.IGNORECASE)
        new_content = pattern.sub('.' + fix, new_content)

    # 2. Reparar Importaciones de Node corruptas
    node_fixes = {'execSync': 'execSync', 'spawnSync': 'spawnSync', 'EventEmitter': 'EventEmitter'}
    for low, fix in node_fixes.items():
        pattern = re.compile(r'\{\s*' + re.escape(low.lower()) + r'\s*\}')
        new_content = pattern.sub('{ ' + fix + ' }', new_content)

    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[*] Archivo reparado: {path}")
        return True
    
    print(f"[v] Archivo en buen estado: {path}")
    return False

# - MÓDULO DE TEST (REGEX/LOGIC) -
def run_test_regex():
    print("[*] Ejecutando Bateria de Tests Regex...")
    cases = [
        ('const s = json.stringify(obj);', r'(?<!\.)\bjson\b(?=\s*[\.\(\[])', 'JSON'),
        ('const p = promise.all([]);', r'\bpromise\.all\b', 'Promise.all')
    ]
    for text, pattern, replacement in cases:
        result = re.sub(pattern, replacement, text)
        print(f"   - '{text}' -> '{result}'")

# - INTERFAZ DE COMANDO -
def main():
    validate_environment()
    parser = argparse.ArgumentParser(description="Sogna Lab Suite (Python)")
    parser.add_argument("mode", choices=["audit", "repair", "test"], help="Modo de operacion")
    parser.add_argument("--path", help="Ruta del archivo para auditar o reparar")
    
    args = parser.parse_args()

    line = "-" * 50
    print(f"\n{line}")
    print("   SOGNA LAB MASTER SUITE (PYTHON)   ")
    print(f"{line}\n")

    if args.mode == "audit":
        root = get_root()
        path = args.path or str(root / "Sognatore/src/core/memory/MemoryHub.ts")
        run_audit(path)
    elif args.mode == "repair":
        if not args.path:
            print("Error: El modo 'repair' requiere --path")
        else:
            repair_code(args.path)
    elif args.mode == "test":
        run_test_regex()

    print(f"\033[94m\033[1m\n{line}\033[0m")

if __name__ == "__main__":
    main()
