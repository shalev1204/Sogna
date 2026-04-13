import subprocess
import os
import sys
import time
import json
from datetime import datetime

# Sogna Sovereign Activator (Shadow Mode)
# This script launches Sognatore headlessly and monitors for convergence.

def log_event(message):
    log_path = os.path.abspath("../../logs/sovereign_operations.log")
    timestamp = datetime.now().isoformat()
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] [SHADOW_RUN] {message}\n")
    print(f"[*] {message}")

def activate_swarm(prd_path):
    # Path configuration
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sognatore_bin = os.path.join(base_dir, "Sognatore", "dist", "bin", "sognatore.js")
    
    if not os.path.exists(sognatore_bin):
        log_event("FATAL: Sognatore binary not found. Build required.")
        return

    log_event(f"Activating Swarm in Shadow Mode for PRD: {prd_path}")
    
    # Shadow execution: pipe output to log file instead of terminal
    shadow_log = os.path.abspath("../../logs/shadow_run.log")
    
    # Mode selection
    cmd = ["node", sognatore_bin, "run", prd_path]
    if prd_path == "AD_HOC":
        # Launch without PRD, triggering reasoning from queue instead
        cmd = ["node", sognatore_bin, "run"]
        log_event("Triggering AD_HOC mode (With the Flow). Reading context from Radio Queue...")

    with open(shadow_log, "w", encoding="utf-8") as log_file:
        process = subprocess.Popen(
            cmd,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        log_event(f"Swarm PID: {process.pid}. Monitoring in shadows...")
        
        # Monitor log for convergence
        last_line_counted = 0
        while process.poll() is None:
            time.sleep(5)
            with open(shadow_log, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if len(lines) > last_line_counted:
                    new_lines = lines[last_line_counted:]
                    last_line_counted = len(lines)
                    for line in new_lines:
                        if "[CONVERGENCE]" in line:
                            log_event("CONVERGENCE REACHED: Quality Consensus Achieved.")
                        if "[REFINEMENT]" in line:
                            log_event(f"Progress Update: {line.strip()}")
                        if "[FATAL]" in line:
                            log_event(f"CRITICAL ERROR: {line.strip()}")

        exit_code = process.wait()
        if exit_code == 0:
            log_event("Swarm Execution Completed Successfully.")
        else:
            log_event(f"Swarm Execution Failed with exit code {exit_code}.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python activate_sognatore.py <prd_path>")
        sys.exit(1)
    activate_swarm(sys.argv[1])
