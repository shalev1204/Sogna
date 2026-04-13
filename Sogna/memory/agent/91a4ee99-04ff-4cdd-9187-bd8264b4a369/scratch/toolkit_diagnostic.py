import os
from pathlib import Path

def run_diagnostic():
    base_path = Path("Sogna/toolkit")
    
    print("SOGNA TOOLKIT DIAGNOSTIC")
    print("=" * 30)
    
    # Check Directories
    dirs = ["agents", "skills", "workflow", "rules", "scripts", "shared"]
    for d in dirs:
        p = base_path / d
        if p.exists() and p.is_dir():
            print(f"CHECK Directory {d}: FOUND")
        else:
            print(f"ERROR Directory {d}: MISSING")
            
    # Check Agents (Expect 21)
    agents_dir = base_path / "agents"
    agents = list(agents_dir.glob("*.md")) if agents_dir.exists() else []
    print(f"INFO Agents: {len(agents)} identified (Expected 21)")
    
    # Check Workflows (Expect 11)
    workflow_dir = base_path / "workflow"
    workflows = list(workflow_dir.glob("*.md")) if workflow_dir.exists() else []
    print(f"INFO Workflows: {len(workflows)} identified (Expected 11)")
    
    # Check Skills (Expect 37 folders)
    skills_dir = base_path / "skills"
    skills = [x for x in skills_dir.iterdir() if x.is_dir()] if skills_dir.exists() else []
    print(f"INFO Skills: {len(skills)} folders identified (Expected 37)")
    
    # Check Key Infrastructure
    infra = [
        "rules/GEMINI.md",
        "scripts/verify_all.py",
        "mcp_config.json",
        "ARCHITECTURE.md",
        "TOOLKIT.md"
    ]
    for i in infra:
        p = base_path / i
        if p.exists():
            print(f"CHECK Infra {i}: OK")
        else:
            print(f"WARNING Infra {i}: MISSING")

    print("=" * 30)
    if len(agents) >= 20 and len(skills) >= 37:
        print("Status: STABLE AND INTEGRATED")
    else:
        print("Status: INCOMPLETE")

if __name__ == "__main__":
    run_diagnostic()
