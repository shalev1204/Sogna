import os
import subprocess
import json
import glob
import time

# SOGNA: Sentinel Doctor Engine (V1.3 PRO)
# Responsable de la inmunidad y diagnóstico avanzado del ecosistema.

script_dir = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(script_dir, "../../..")) # Raíz de Sogna
curator_path = os.path.join(root, "Curator")
engines_path = os.path.join(curator_path, "engines")
report_path = os.path.join(script_dir, "health-status.json")

engines = ["Animator", "Assembler", "Navigator", "Predatore", "Sentinel", "Studio", "Stylist"]

report = {
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "system_status": "STABLE",
    "Curator": {"status": "UNKNOWN", "latency_ms": 0, "errors": []},
    "Engines": {}
}

def run_cmd(cmd, cwd):
    start_time = time.time()
    try:
        # Use shell=True for Windows pnpm/npx resolution
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=120)
        latency = int((time.time() - start_time) * 1000)
        return result.returncode, result.stdout, result.stderr, latency
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return -1, "", str(e), latency

# 1. Curator Core Check + Latencia
print("Sentinel-Doctor: Analizando Core de Curator...")
ret, out, err, lat = run_cmd("pnpm run check", curator_path)
report["Curator"]["latency_ms"] = lat
if ret == 0:
    report["Curator"]["status"] = "STABLE"
else:
    report["Curator"]["status"] = "FAIL"
    report["Curator"]["errors"].append(err or out)
    report["system_status"] = "DEGRADED"

# 2. Engines Diagnostic PRO
for eng in engines:
    eng_dir = os.path.join(engines_path, eng)
    print(f"Sentinel-Doctor: Escaneando motor {eng}...")
    eng_report = {"status": "UNKNOWN", "type": "UNKNOWN", "latency_ms": 0, "checks": []}
    
    if not os.path.exists(eng_dir):
        eng_report["status"] = "MISSING"
        report["Engines"][eng] = eng_report
        report["system_status"] = "CRITICAL"
        continue

    # Medición de integridad y diagnóstico
    start_eng = time.time()
    
    # Improved glob to avoid node_modules traversal
    all_packages = []
    for root_walk, dirs, files in os.walk(eng_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules') # Skip node_modules
        if 'package.json' in files:
            all_packages.append(os.path.join(root_walk, 'package.json'))

    all_py = []
    for root_walk, dirs, files in os.walk(eng_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for f in files:
            if f.endswith('.py'):
                all_py.append(os.path.join(root_walk, f))
    
    if all_packages:
        eng_report["type"] = "NodeJS/TS"
        for pkg in all_packages:
            pkg_dir = os.path.dirname(pkg)
            rel_pkg = os.path.relpath(pkg_dir, eng_dir)
            
            # Use os.path.isdir to verify node_modules as a real directory or link
            if not os.path.isdir(os.path.join(pkg_dir, "node_modules")):
                eng_report["checks"].append(f"[{rel_pkg}] node_modules MISSING")
                if eng_report["status"] == "UNKNOWN": eng_report["status"] = "UNINSTALLED"
            else:
                if os.path.exists(os.path.join(pkg_dir, "tsconfig.json")):
                    # Validate TSC health
                    ret, out, err, lat_ts = run_cmd("npx tsc --noEmit", pkg_dir)
                    if ret == 0:
                        if eng_report["status"] == "UNKNOWN": eng_report["status"] = "STABLE"
                    else:
                        eng_report["status"] = "BUILD_ERROR"
                        eng_report["checks"].append(f"[{rel_pkg}] TSC Error")
                else:
                    if eng_report["status"] == "UNKNOWN": eng_report["status"] = "STABLE"
    
    if all_py:
        if eng_report["type"] == "UNKNOWN": eng_report["type"] = "Python"
        else: eng_report["type"] += "/Python"
        
        syntax_ok = True
        for py_file in all_py:
            # Basic syntax check
            ret, out, err, lat_py = run_cmd(f"python -m py_compile {py_file}", root)
            if ret != 0:
                syntax_ok = False
                eng_report["checks"].append(f"Syntax Error: {os.path.basename(py_file)}")
                break
        
        if syntax_ok:
            if eng_report["status"] == "UNKNOWN": eng_report["status"] = "STABLE"
        else:
            eng_report["status"] = "SYNTAX_ERROR"

    eng_report["latency_ms"] = int((time.time() - start_eng) * 1000)
    report["Engines"][eng] = eng_report

    # Update system status based on engine health
    if eng_report["status"] in ["BUILD_ERROR", "SYNTAX_ERROR", "MISSING"]:
        report["system_status"] = "CRITICAL"

# 3. Integridad de Gobernanza (SOGNA PRO)
print("Sentinel-Doctor: Verificando integridad de gobernanza...")
# Legacy files (commands.md, optimization_log.md) have been purged as per Tier Max protocol.
# Only verify core architecture files.
db_files = [".sognarc.json"]
for dbf in db_files:
    if not os.path.exists(os.path.join(root, dbf)):
        report["system_status"] = "CRITICAL"
        print(f"ALERTA: Archivo de gobernanza faltante: {dbf}")

# Guardar Reporte Final
with open(report_path, "w") as f:
    json.dump(report, f, indent=2)

print(f"\n--- SOGNA HEALTH REPORT: {report['system_status']} ---")
if report["system_status"] == "CRITICAL":
    print("!!! ATENCIÓN: Se han detectado anomalías críticas en el sistema !!!")
    print("Consulte health-status.json para más detalles.")
