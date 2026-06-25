import os
import sys
from pathlib import Path

# Sognatore TOOLKIT DOCTOR (v2.0)
# Diagnostic Suite for the Antigravity Toolkit

def check_status(label, success, message=""):
    color_green = "\033[92m"
    color_red = "\033[91m"
    color_yellow = "\033[93m"
    color_reset = "\033[0m"
    
    status = "[V] FOUND" if success else "[X] MISSING"
    if not success and "rules" in label.lower():
        status = "[!] WARNING"
        
    print(f"{label:<30} {status} {message}")

def run_diagnostic():
# Detect Toolkit Path relative to Sognatore directory
    base_path = Path(__file__).parent.parent
    
    print("\n[Sognatore TOOLKIT] Deep Intelligence Audit")
    print("=" * 45)
    
# 1. Structure Audit
    print("\n[STRUCTURAL INTEGRITY]")
    dirs = ["agents", "skills", "workflow", "rules", "scripts", "shared"]
    for d in dirs:
        p = base_path / d
        check_status(f"Directory: {d}", p.exists() and p.is_dir())
            
# 2. Population Audit
    print("\n[KNOWLEDGE POPULATION]")
    
# Agents
    agents_dir = base_path / "agents"
    agents = list(agents_dir.glob("*.md")) if agents_dir.exists() else []
    check_status("Agents", len(agents) >= 20, f"({len(agents)}/21 verified)")
    
# Workflows
    workflow_dir = base_path / "workflow"
    workflows = list(workflow_dir.glob("*.md")) if workflow_dir.exists() else []
    check_status("Strategic Workflows", len(workflows) >= 10, f"({len(workflows)}/11 verified)")
    
# Skills
    skills_dir = base_path / "skills"
    skills = [x for x in skills_dir.iterdir() if x.is_dir()] if skills_dir.exists() else []
    check_status("Engine Skills", len(skills) >= 30, f"({len(skills)}/37 verified)")
    
# 3. Critical Infrastructure
    print("\n[SYSTEM INFRASTRUCTURE]")
    infra = [
        ("Agent Metadata Registry", "mcp_config.json"),
        ("Architecture Map", "ARCHITECTURE.md"),
        ("Toolkit Manual", "TOOLKIT.md"),
        ("Verification Suite", "scripts/verify_all.py"),
        ("Global Guard Rules", "rules/GEMINI.md")
    ]
    for label, rel_path in infra:
        p = base_path / rel_path
        check_status(label, p.exists())

    print("\n" + "=" * 45)
    if len(agents) >= 20 and len(skills) >= 35:
        print("\033[1;92mSTATUS: TOOLKIT STABLE AND READY FOR DEPLOYMENT\033[0m\n")
    else:
        print("\033[1;93mSTATUS: TOOLKIT DEGRADED - REVIEW MISSING COMPONENTS\033[0m\n")

if __name__ == "__main__":
    run_diagnostic()
