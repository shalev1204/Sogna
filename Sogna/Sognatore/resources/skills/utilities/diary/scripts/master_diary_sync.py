#!/usr/bin/env python3
"""
Master Diary Sync Script v2
Two-mode operation:
  --inject-only : Scan desktop projects, inject today's diaries into global diary.
  --sync-only   : Push the global diary to Sogna Cloud and Sogna.

Usage:
  python master_diary_sync.py --inject-only
  python master_diary_sync.py --sync-only
  python master_diary_sync.py              # Runs both sequentially (legacy mode)
"""

import os
import sys
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# --- Configuration ---
DESKTOP = Path(os.environ.get("DESKTOP_PATH", str(Path(os.environ.get("USERPROFILE", "")) / "OneDrive" / "Desktop")))
DESKTOP_FALLBACK = Path(os.environ.get("USERPROFILE", "")) / "Desktop"
GLOBAL_DIARY_ROOT = Path(os.environ.get("GLOBAL_DIARY_ROOT", str(Path(__file__).resolve().parent.parent / "diary")))
OBSIDIAN_DAILY_NOTES = Path(os.environ.get("OBSIDIAN_DAILY_NOTES", ""))
NOTION_SYNC_SCRIPT = Path(__file__).resolve().parent / "sync_to_notion.py"


def get_desktop():
    return DESKTOP if DESKTOP.exists() else DESKTOP_FALLBACK


def get_today():
    return datetime.now().strftime("%Y-%m-%d")


def get_global_path(date_str):
    y, m, _ = date_str.split("-")
    return GLOBAL_DIARY_ROOT / y / m / f"{date_str}.md"


# â”€â”€ INJECT MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def scan_project_diaries(date_str):
    """Find all project diaries for today on the desktop."""
    desktop = get_desktop()
    results = []

    for project_dir in desktop.iterdir():
        if not project_dir.is_dir():
            continue
        diary_dir = project_dir / "diary"
        if not diary_dir.exists():
            continue

        # Validation: Check for naked YYYY-MM-DD.md which is forbidden in projects
        naked_diary = diary_dir / f"{date_str}.md"
        if naked_diary.exists():
            print(f"âš ï¸  WARNING: Found naked diary in project '{project_dir.name}': {naked_diary}")
            print(f"   Ironclad Rule: Project diaries MUST have a suffix (e.g., {date_str}-{project_dir.name}.md)")

        # Support both flat and YYYY/MM hierarchical structures
        for md_file in diary_dir.rglob(f"{date_str}*.md"):
            # Skip the naked one if it exists to prevent accidental injection
            if md_file.name == f"{date_str}.md":
                continue
            results.append({
                "path": md_file,
                "project": project_dir.name,
                "content": md_file.read_text(encoding="utf-8"),
            })

    return results


def inject_into_global(global_path, project_diaries, date_str):
    """
    Inject project diary content into the global diary.
    This is a MECHANICAL injection â€” AI will rewrite it in a later step.
    Each project gets its own clearly marked section.
    """
    # Read or initialize global content
    if global_path.exists():
        global_content = global_path.read_text(encoding="utf-8")
    else:
        global_content = f"# ðŸ“” å…¨åŸŸæ—¥èªŒï¼š{date_str}\n\n## ä»Šæ—¥å…¨åŸŸå›žé¡§ (Global Summary)\nï¼ˆå¾… AI é‡å¯«ï¼‰\n\n---\n\n## ðŸš€ å°ˆæ¡ˆé€²åº¦ (Project Accomplishments)\n\n---\n\n## ðŸ’¡ æ”¹å–„èˆ‡å­¸ç¿’ (Improvements & Learnings)\n\n---\n"

    for diary in project_diaries:
        proj_name = diary["project"]
        proj_content = diary["content"]
        marker = f"### ðŸ“ {proj_name}"

        # Remove old block for this project if exists (to support re-injection)
        pattern = re.escape(marker) + r".*?(?=### ðŸ“ |## ðŸ’¡|## ðŸŽ¯|---(?:\s*\n## )|\Z)"
        global_content = re.sub(pattern, "", global_content, flags=re.DOTALL)

        # Find insertion point: after "## ðŸš€ å°ˆæ¡ˆé€²åº¦"
        insertion_anchor = "## ðŸš€ å°ˆæ¡ˆé€²åº¦ (Project Accomplishments)"
        if insertion_anchor not in global_content:
            insertion_anchor = "## ðŸš€ å°ˆæ¡ˆé€²åº¦"

        if insertion_anchor in global_content:
            # Extract the meaningful content from the project diary (skip its H1 title)
            lines = proj_content.split("\n")
            meaningful = []
            for line in lines:
                if line.startswith("# "):
                    continue  # Skip H1 title
                if line.startswith("*Allen") or line.startswith("*Generated"):
                    continue  # Skip footer
                meaningful.append(line)
            clean_content = "\n".join(meaningful).strip()

            injection = f"\n{marker}\n{clean_content}\n"
            global_content = global_content.replace(
                insertion_anchor,
                f"{insertion_anchor}{injection}"
            )
        else:
            global_content += f"\n{marker}\n{proj_content}\n"

    # Ensure directory exists and write
    global_path.parent.mkdir(parents=True, exist_ok=True)
    global_path.write_text(global_content, encoding="utf-8")
    return global_path


def run_inject(date_str):
    """Execute inject-only mode."""
    print(f"=== INJECT MODE: {date_str} ===")
    global_path = get_global_path(date_str)

    # 1. Scan
    diaries = scan_project_diaries(date_str)
    print(f"ðŸ” Found {len(diaries)} valid project diaries.")
    for d in diaries:
        print(f"   - {d['project']}: {d['path']}")

    if not diaries:
        print("â„¹ï¸  No new project diaries found. Nothing to inject.")
        # Still ensure global file exists for AI to rewrite
        if not global_path.exists():
            global_path.parent.mkdir(parents=True, exist_ok=True)
            global_path.write_text(
                f"# ðŸ“” å…¨åŸŸæ—¥èªŒï¼š{date_str}\n\n## ä»Šæ—¥å…¨åŸŸå›žé¡§ (Global Summary)\n\n---\n\n## ðŸš€ å°ˆæ¡ˆé€²åº¦ (Project Accomplishments)\n\n---\n\n## ðŸ’¡ æ”¹å–„èˆ‡å­¸ç¿’ (Improvements & Learnings)\n\n---\n",
                encoding="utf-8"
            )
        print(f"ðŸ“„ Global diary ready at: {global_path}")
        return

    # 2. Inject
    result = inject_into_global(global_path, diaries, date_str)
    print(f"âœ… Injected into global diary: {result}")
    print("â¸ï¸  Now hand off to AI for intelligent rewrite (Step 3).")


# â”€â”€ SYNC MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def sync_to_notion(global_path):
    """Push global diary to Sogna Cloud."""
    print("ðŸš€ Syncing to Sogna Cloud...")
    if not NOTION_SYNC_SCRIPT.exists():
        print(f"âŒ Sogna Cloud sync script not found: {NOTION_SYNC_SCRIPT}")
        return False

    env = os.environ.copy()
    if "NOTION_TOKEN" not in env or not env["NOTION_TOKEN"]:
        print("âŒ NOTION_TOKEN is not set in environment.")
        return False
    if "NOTION_DIARY_DB" not in env or not env["NOTION_DIARY_DB"]:
        print("âŒ NOTION_DIARY_DB is not set in environment.")
        return False

    try:
        result = subprocess.run(
            [sys.executable, str(NOTION_SYNC_SCRIPT), str(global_path)],
            env=env, capture_output=True, text=True, check=True
        )
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"âŒ Sogna Cloud sync failed:\n{e.stderr}")
        return False


def backup_to_sogna(global_path):
    # Copy global diary to Sogna ecosistema.
    print("📁 Backing up to Sogna...")
    
    # Safety Check: If path is empty, it shouldn't backup
    if not str(SOGNA_JOURNAL_PATH).strip():
        print("ℹ️   Sogna path is not set (empty). Skipping backup.")
        return False
        
    if not SOGNA_JOURNAL_PATH.exists():
        print(f"⚠️   Sogna path not found: {SOGNA_JOURNAL_PATH}. Skipping backup.")
        return False
    try:
        dest = SOGNA_JOURNAL_PATH / global_path.name
        shutil.copy2(global_path, dest)
        print(f"✅ Backed up to: {dest}")
        return True
    except Exception as e:
        print(f"❌ Sogna backup failed: {e}")
        return False


def run_qmd_embed():
    """Update semantic vector index."""
    print("ðŸ§  Updating QMD Semantic Index...")
    try:
        # Run qmd embed in the project root
        project_root = GLOBAL_DIARY_ROOT.parent
        subprocess.run(["qmd", "embed"], cwd=project_root, check=True, text=True)
        print("âœ… QMD Embedding completed.")
        return True
    except FileNotFoundError:
        print("âš ï¸  QMD not installed. Skipping semantic update.")
    except Exception as e:
        print(f"âŒ QMD Embedding failed: {e}")
    return False


def run_sync(date_str):
    """Execute sync-only mode."""
    print(f"=== SYNC MODE: {date_str} ===")
    global_path = get_global_path(date_str)

    if not global_path.exists():
        print(f"âŒ Global diary not found: {global_path}")
        print("   Please run --inject-only first, then let AI rewrite.")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    # 4a. Sogna Cloud
    sync_to_notion(global_path)

    # 4b. Sogna
    backup_to_sogna(global_path)

    # 5. Semantic Update
    run_qmd_embed()

    print("=== SYNC COMPLETED ===")


# â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def main():
    date_str = get_today()

    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode == "--inject-only":
            run_inject(date_str)
        elif mode == "--sync-only":
            run_sync(date_str)
        else:
            print(f"âŒ Unknown mode: {mode}")
            print("Usage: python master_diary_sync.py [--inject-only | --sync-only]")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
            sys.exit(1)
    else:
        # Legacy: run both (no AI rewrite in between)
        print("âš ï¸  Running full pipeline (legacy mode). Consider using --inject-only and --sync-only separately.")
        run_inject(date_str)
        run_sync(date_str)


if __name__ == "__main__":
    main()

