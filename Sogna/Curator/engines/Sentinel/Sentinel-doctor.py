import os
import subprocess
import json
import glob
import time

# SOGNA: Sentinel Doctor Engine
# Responsable de la inmunidad y diagnóstico del ecosistema.

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
        # Use shell=True for Windows pnpm/npx resolution with explicit UTF-8 encoding
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
        latency = int((time.time() - start_time) * 1000)
        return result.returncode, result.stdout, result.stderr, latency
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return -1, "", str(e), latency

# 1. Curator Check
print("Sentinel-Doctor: Analizando Core de Curator...")
ret, out, err, lat = run_cmd("pnpm run check", curator_path)
report["Curator"]["latency_ms"] = lat
if ret == 0:
    report["Curator"]["status"] = "STABLE"
else:
    report["Curator"]["status"] = "FAIL"
    report["Curator"]["errors"].append(err or out)
    report["system_status"] = "DEGRADED"

# 2. Engines Diagnostic
for eng in engines:
    eng_dir = os.path.join(engines_path, eng)
    print(f"Sentinel-Doctor: Escaneando motor {eng}...")
    eng_report = {"status": "UNKNOWN", "type": "UNKNOWN", "latency_ms": 0, "checks": []}
    
    if not os.path.exists(eng_dir):
        eng_report["status"] = "MISSING"
        report["Engines"][eng] = eng_report
        report["system_status"] = "CRITICAL"
        continue

    start_eng = time.time()
    
    all_packages = []
    for root_walk, dirs, files in os.walk(eng_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
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
            
            if not os.path.isdir(os.path.join(pkg_dir, "node_modules")):
                eng_report["checks"].append(f"[{rel_pkg}] node_modules MISSING")
                if eng_report["status"] == "UNKNOWN": eng_report["status"] = "UNINSTALLED"
            else:
                if os.path.exists(os.path.join(pkg_dir, "tsconfig.json")):
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
            ret, out, err, lat_py = run_cmd(f"python -m py_compile {py_file}", root)
            if ret != 0:
                print(f"DEBUG: py_compile failed for {py_file}. ret={ret}, out={out}, err={err}")
                syntax_ok = False
                eng_report["checks"].append(f"Syntax Error: {os.path.basename(py_file)}")
                break
        
        if syntax_ok:
            if eng_report["status"] == "UNKNOWN": eng_report["status"] = "STABLE"
        else:
            eng_report["status"] = "SYNTAX_ERROR"

    eng_report["latency_ms"] = int((time.time() - start_eng) * 1000)
    report["Engines"][eng] = eng_report

    if eng_report["status"] in ["BUILD_ERROR", "SYNTAX_ERROR", "MISSING"]:
        report["system_status"] = "CRITICAL"

# 3. Auditoría de Seguridad (Sentinel)
print("Sentinel-Doctor: Ejecutando auditoría de patrones prohibidos...")
ret_sec, out_sec, err_sec, lat_sec = run_cmd("python sentinel-audit.py", script_dir)
if ret_sec != 0:
    print(f"ALERTA SEGURIDAD: Violaciones detectadas en auditoría activa.")
    report["system_status"] = "CRITICAL"

print("Sentinel-Doctor: Auditando dependencias (pnpm audit)...")
ret_pnpm, out_pnpm, err_pnpm, lat_pnpm = run_cmd("pnpm audit --audit-level high", root)
if ret_pnpm != 0:
    print("ALERTA SEGURIDAD: Vulnerabilidades de dependencias detectadas.")
    report["system_status"] = "CRITICAL"

# 4. Integridad de Gobernanza (SOGNA)
print("Sentinel-Doctor: Verificando integridad de gobernanza...")
db_files = [".sognarc.json", "memory/identity/sogna.md", "memory/identity/registry.json"]
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
