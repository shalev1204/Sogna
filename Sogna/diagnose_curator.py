import os
import subprocess
import json
import glob

root = "c:\\Users\\carle\\Desktop\\Sogna\\Sogna"
curator_path = os.path.join(root, "Curator")
engines_path = os.path.join(curator_path, "engines")

engines = ["Animator", "Assembler", "Navigator", "Predatore", "Sentinel", "Studio", "Stylist"]

report = {
    "Curator": {"status": "UNKNOWN", "errors": []},
    "Engines": {}
}

def run_cmd(cmd, cwd):
    try:
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=30)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

# 1. Curator Core Check
print("Diagnosing Curator Core...")
ret, out, err = run_cmd("pnpm run check", curator_path)
if ret == 0:
    report["Curator"]["status"] = "STABLE"
else:
    report["Curator"]["status"] = "FAIL"
    report["Curator"]["errors"].append(err or out)

# 2. Engines Diagnostic
for eng in engines:
    eng_dir = os.path.join(engines_path, eng)
    print(f"Diagnosing Engine: {eng}...")
    eng_report = {"status": "UNKNOWN", "type": "UNKNOWN", "checks": []}
    
    if not os.path.exists(eng_dir):
        eng_report["status"] = "MISSING"
        report["Engines"][eng] = eng_report
        continue

    # Look for package.json anywhere in the engine
    all_packages = glob.glob(os.path.join(eng_dir, "**/package.json"), recursive=True)
    all_py = glob.glob(os.path.join(eng_dir, "**/*.py"), recursive=True)
    
    if all_packages:
        eng_report["type"] = "NodeJS/TS"
        for pkg in all_packages:
            pkg_dir = os.path.dirname(pkg)
            rel_pkg = os.path.relpath(pkg_dir, eng_dir)
            
            # Check node_modules
            if not os.path.exists(os.path.join(pkg_dir, "node_modules")):
                eng_report["checks"].append(f"[{rel_pkg}] node_modules MISSING")
                if eng_report["status"] == "UNKNOWN": eng_report["status"] = "UNINSTALLED"
            else:
                # Check build
                if os.path.exists(os.path.join(pkg_dir, "tsconfig.json")):
                    ret, out, err = run_cmd("npx tsc --noEmit", pkg_dir)
                    if ret == 0:
                        if eng_report["status"] != "BUILD_ERROR": eng_report["status"] = "STABLE"
                    else:
                        eng_report["status"] = "BUILD_ERROR"
                        eng_report["checks"].append(f"[{rel_pkg}] TSC Error")
    
    if all_py:
        if eng_report["type"] == "UNKNOWN": eng_report["type"] = "Python"
        else: eng_report["type"] += "/Python"
        
        syntax_ok = True
        for py_file in all_py:
            ret, out, err = run_cmd(f"python -m py_compile {py_file}", root)
            if ret != 0:
                syntax_ok = False
                eng_report["checks"].append(f"Syntax Error: {os.path.basename(py_file)}")
                break
        
        if syntax_ok:
            if eng_report["status"] == "UNKNOWN": eng_report["status"] = "STABLE"
        else:
            eng_report["status"] = "SYNTAX_ERROR"

    report["Engines"][eng] = eng_report

# Save Report
with open(os.path.join(root, "curator_diagnostic_report.json"), "w") as f:
    json.dump(report, f, indent=2)

print("\nDiagnostic complete. Summary:")
print(f"Curator: {report['Curator']['status']}")
for eng, data in report["Engines"].items():
    print(f"- {eng}: {data['status']} ({data['type']})")
