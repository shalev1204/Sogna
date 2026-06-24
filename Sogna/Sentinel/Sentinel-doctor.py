import os
import sys
import subprocess
import json
import time

# SOGNA: Sentinel Doctor Engine
# Diagnóstico de Curator, motores standalone (Sentinel, Predatore) y engines/.

script_dir = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(script_dir, ".."))
curator_path = os.path.join(root, "Curator")
engines_path = os.path.join(root, "engines")
report_path = os.path.join(script_dir, "health-status.json")

standalone_motors = {
    "Sentinel": os.path.join(root, "Sentinel"),
    "Predatore": os.path.join(root, "Predatore"),
    "Sognatore": os.path.join(root, "Sognatore"),
}

bundled_engines = ["Animator", "Assembler", "Navigator", "Studio", "Stylist", "MCP-Bridge"]

report = {
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "system_status": "STABLE",
    "Curator": {"status": "UNKNOWN", "latency_ms": 0, "errors": []},
    "StandaloneMotors": {},
    "Engines": {},
}


def run_cmd(cmd, cwd):
    start_time = time.time()
    try:
        result = subprocess.run(
            cmd, cwd=cwd, shell=True, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=120,
        )
        latency = int((time.time() - start_time) * 1000)
        return result.returncode, result.stdout, result.stderr, latency
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return -1, "", str(e), latency


def scan_engine_tree(eng_dir, eng_report):
    if not os.path.exists(eng_dir):
        eng_report["status"] = "MISSING"
        return

    start_eng = time.time()
    all_packages = []
    all_py = []
    skip_skill_examples = ("resources/skills", "resources/templates", "examples/")

    for root_walk, dirs, files in os.walk(eng_dir):
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        rel = os.path.relpath(root_walk, eng_dir).replace("\\", "/")
        if any(s in rel for s in skip_skill_examples):
            continue
        if "package.json" in files:
            all_packages.append(os.path.join(root_walk, "package.json"))
        for f in files:
            if f.endswith(".py") and "resources/skills" not in rel:
                all_py.append(os.path.join(root_walk, f))

    if all_packages:
        eng_report["type"] = "NodeJS/TS"
        for pkg in all_packages:
            pkg_dir = os.path.dirname(pkg)
            rel_pkg = os.path.relpath(pkg_dir, eng_dir)
            rel_norm = rel_pkg.replace("\\", "/")
            if any(s in rel_norm for s in skip_skill_examples):
                continue
            try:
                with open(pkg, encoding="utf-8") as pf:
                    pkg_data = json.load(pf)
            except Exception:
                pkg_data = {}
            has_deps = bool(pkg_data.get("dependencies") or pkg_data.get("devDependencies"))
            nm = os.path.join(pkg_dir, "node_modules")
            if has_deps and not os.path.isdir(nm):
                eng_report["checks"].append(f"[{rel_pkg}] node_modules MISSING")
                if eng_report["status"] == "UNKNOWN":
                    eng_report["status"] = "UNINSTALLED"
            elif os.path.exists(os.path.join(pkg_dir, "tsconfig.json")):
                ts_sources = [
                    f for f in os.listdir(pkg_dir)
                    if f.endswith(".ts") or (
                        os.path.isdir(os.path.join(pkg_dir, f))
                        and f not in ("node_modules", "dist", "types", "lib", "build")
                    )
                ]
                src_dir = os.path.join(pkg_dir, "src")
                has_ts = os.path.isdir(src_dir) and any(
                    f.endswith(".ts") for _, _, fs in os.walk(src_dir) for f in fs
                )
                if not has_ts:
                    if eng_report["status"] == "UNKNOWN":
                        eng_report["status"] = "STABLE"
                    continue
                ret, out, err, lat_ts = run_cmd("npx tsc --noEmit", pkg_dir)
                if ret == 0:
                    if eng_report["status"] == "UNKNOWN":
                        eng_report["status"] = "STABLE"
                else:
                    eng_report["status"] = "BUILD_ERROR"
                    eng_report["checks"].append(f"[{rel_pkg}] TSC Error")
            elif eng_report["status"] == "UNKNOWN":
                eng_report["status"] = "STABLE"

    if all_py:
        if eng_report["type"] == "UNKNOWN":
            eng_report["type"] = "Python"
        else:
            eng_report["type"] += "/Python"
        syntax_ok = True
        for py_file in all_py:
            ret, out, err, lat_py = run_cmd(f'"{sys.executable}" -m py_compile "{py_file}"', root)
            if ret != 0:
                syntax_ok = False
                eng_report["checks"].append(f"Syntax Error: {os.path.basename(py_file)}")
                break
        if syntax_ok and eng_report["status"] == "UNKNOWN":
            eng_report["status"] = "STABLE"
        elif not syntax_ok:
            eng_report["status"] = "SYNTAX_ERROR"

    if eng_report["status"] == "UNKNOWN":
        eng_report["status"] = "STABLE"

    eng_report["latency_ms"] = int((time.time() - start_eng) * 1000)


print("Sentinel-Doctor: Analizando Core de Curator...")
ret, out, err, lat = run_cmd("pnpm run check", curator_path)
report["Curator"]["latency_ms"] = lat
if ret == 0:
    report["Curator"]["status"] = "STABLE"
else:
    report["Curator"]["status"] = "FAIL"
    report["Curator"]["errors"].append(err or out)
    report["system_status"] = "DEGRADED"

for name, eng_dir in standalone_motors.items():
    print(f"Sentinel-Doctor: Escaneando motor standalone {name}...")
    eng_report = {"status": "UNKNOWN", "type": "UNKNOWN", "latency_ms": 0, "checks": []}
    scan_engine_tree(eng_dir, eng_report)
    report["StandaloneMotors"][name] = eng_report
    if eng_report["status"] in ["BUILD_ERROR", "SYNTAX_ERROR", "MISSING"]:
        report["system_status"] = "CRITICAL"

for eng in bundled_engines:
    eng_dir = os.path.join(engines_path, eng)
    print(f"Sentinel-Doctor: Escaneando engine {eng}...")
    eng_report = {"status": "UNKNOWN", "type": "UNKNOWN", "latency_ms": 0, "checks": []}
    if not os.path.exists(eng_dir):
        eng_report["status"] = "MISSING"
        report["Engines"][eng] = eng_report
        continue
    scan_engine_tree(eng_dir, eng_report)
    report["Engines"][eng] = eng_report
    if eng_report["status"] in ["BUILD_ERROR", "SYNTAX_ERROR", "MISSING"]:
        report["system_status"] = "CRITICAL"

print("Sentinel-Doctor: Ejecutando auditoría de patrones prohibidos...")
ret_sec, out_sec, err_sec, lat_sec = run_cmd(f'"{sys.executable}" sentinel-audit.py', script_dir)
if ret_sec != 0:
    print("ALERTA SEGURIDAD: Violaciones detectadas en auditoría activa.")
    report["system_status"] = "CRITICAL"

print("Sentinel-Doctor: Auditando dependencias (pnpm audit)...")
ret_pnpm, out_pnpm, err_pnpm, lat_pnpm = run_cmd("pnpm audit --audit-level low", root)
if ret_pnpm != 0:
    print("ALERTA SEGURIDAD: Vulnerabilidades en dependencias (pnpm audit).")
    report["system_status"] = "CRITICAL"

print("Sentinel-Doctor: Verificando integridad de gobernanza...")
for dbf in [".sognarc.json", "memory/identity/sogna.md", "memory/identity/registry.json"]:
    if not os.path.exists(os.path.join(root, dbf)):
        report["system_status"] = "CRITICAL"
        print(f"ALERTA: Archivo de gobernanza faltante: {dbf}")

with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print(f"\n--- SOGNA HEALTH REPORT: {report['system_status']} ---")
if report["system_status"] == "CRITICAL":
    print("!!! ATENCIÓN: Se han detectado anomalías críticas en el sistema !!!")
    print("Consulte health-status.json para más detalles.")
