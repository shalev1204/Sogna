import os
import json
import requests
import sys
from pathlib import Path

def check_vulnerabilities(packages, ecosystem="npm"):
    """Check vulnerabilities using OSV API (osv.dev)"""
    url = "https://api.osv.dev/v1/query"
    results = []
    
    print(f"[SENTINEL] Escaneando {len(packages)} paquetes en ecosistema '{ecosystem}'...")
    
    for name, version in packages.items():
        # Remove prefix from version if present (e.g. ^ or ~)
        clean_version = version.lstrip('^~')
        query = {
            "version": clean_version,
            "package": {"name": name, "ecosystem": ecosystem}
        }
        
        try:
            response = requests.post(url, json=query, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'vulns' in data:
                    results.append({
                        "package": name,
                        "version": version,
                        "vulns": data['vulns']
                    })
        except Exception as e:
            print(f"[!] Error al consultar {name}: {e}")
            
    return results

def main():
    base_path = Path(os.getcwd())
    pkg_json_path = base_path / "package.json"
    
    found_vulns = []
    
    if pkg_json_path.exists():
        with open(pkg_json_path, 'r') as f:
            pkg_data = json.load(f)
            deps = pkg_data.get('dependencies', {})
            dev_deps = pkg_data.get('devDependencies', {})
            all_deps = {**deps, **dev_deps}
            
            if all_deps:
                found_vulns = check_vulnerabilities(all_deps, "npm")

    # Output Results
    if found_vulns:
        print("\n\033[91m[CRITICAL] SE DETECTARON VULNERABILIDADES:\033[0m")
        for v in found_vulns:
            print(f"- {v['package']} ({v['version']}): {len(v['vulns'])} vulnerabilidades detectadas.")
            for detail in v['vulns']:
                print(f"  [!] {detail.get('id')}: {detail.get('summary', 'No summary available')}")
# @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
        sys.exit(1) # Veto threshold reached
    else:
        print("\n\033[92m[CLEAN] No se detectaron vulnerabilidades conocidas en dependencias.\033[0m")
# @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
        sys.exit(0)

if __name__ == "__main__":
    main()

