import os
import re
import sys
import subprocess

# Specific renames that are known to be needed
SPECIFIC_RENAMES = {
    "frameData": "FrameDataInstance",
    "cancelFrame": "CancelFrame",
    "frame": "Frame",
    "frameSteps": "FrameSteps",
    "number": "NumberValueType", # From sognaflow-utils
}

def run_tsc(cwd):
    print(f"Running tsc in {cwd}...")
    result = subprocess.run(["npx", "tsc", "--noEmit"], cwd=cwd, capture_output=True, text=True, shell=True)
    return result.stdout

def fix_errors(cwd, tsc_output):
    lines = tsc_output.splitlines()
    fixes_applied = 0
    
# Track files we've already processed in this pass to avoid redundant reads/writes
    processed_files = {}

    for line in lines:
# Match "file.ts(line,col): error TSXXXX: ..."
        match = re.match(r"^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$", line)
        if not match:
            continue
            
        rel_path, line_num, col_num, error_code, message = match.groups()
        abs_path = os.path.normpath(os.path.join(cwd, rel_path))
        
        if not os.path.exists(abs_path):
            continue

        if abs_path not in processed_files:
            with open(abs_path, "r", encoding="utf-8") as f:
                processed_files[abs_path] = f.readlines()
        
        file_lines = processed_files[abs_path]
        idx = int(line_num) - 1
        if idx >= len(file_lines):
            continue
            
        original_line = file_lines[idx]
        new_line = original_line

# 1. Handle TS2552 (Cannot find name, did you mean...?)
        if error_code == "TS2552" and "Did you mean '" in message:
            suggestion_match = re.search(r"Did you mean '(.*?)'\?", message)
            if suggestion_match:
                suggestion = suggestion_match.group(1)
missing_name_match = re.search(r"Cannot find name '(.*?)'", message)
if missing_name_match:
missing_name = missing_name_match.group(1)
new_line = re.sub(r"\b" + re.escape(missing_name) + r"\b", suggestion, new_line)

# 2. Handle TS2305 (Module has no exported member)
        elif error_code == "TS2305" and "has no exported member" in message:
            member_match = re.search(r"has no exported member '(.*?)'", message)
            if member_match:
                member = member_match.group(1)
                if member in SPECIFIC_RENAMES:
                    new_line = re.sub(r"\b" + re.escape(member) + r"\b", SPECIFIC_RENAMES[member], new_line)
                else:
# Heuristic: try PascalCase
                    pascal = member[0].upper() + member[1:]
                    new_line = re.sub(r"\b" + re.escape(member) + r"\b", pascal, new_line)

# 3. Handle TS1149 / TS1261 (File name casing mismatch)
        elif error_code == "TS1149" or error_code == "TS1261":
# Extract paths from messages like:
# File name '.../Complex/index.ts' differs from already included file name '.../complex/index.ts' only in casing.
path_match = re.search(r"File name '(.*?)' differs from already included file name '(.*?)'", message)
            if not path_match:
path_match = re.search(r"Already included file name '(.*?)' differs from file name '(.*?)'", message)
            
            if path_match:
# We need to find which part of the path is wrong in the import
                wrong_path_full = path_match.group(1)
                correct_path_full = path_match.group(2)
                
# Split paths to find the differing parts
                wrong_parts = re.split(r'[\\/]', wrong_path_full)
                correct_parts = re.split(r'[\\/]', correct_path_full)
                
# Align from the end (since the common root might be long)
                for w, c in zip(reversed(wrong_parts), reversed(correct_parts)):
                    if w.lower() == c.lower() and w != c:
# Found a casing mismatch in a path segment (e.g. "Complex" vs "complex")
# Replace it if it's in the line
                        new_line = re.sub(f"(['\"])(.*){re.escape(w)}(.*)(['\"])", f"\\1\\2{c}\\3\\4", new_line)

# 4. Handle SPECIFIC_RENAMES globally if they appear in the line as missing names
        for old, updated in SPECIFIC_RENAMES.items():
            if f"'{old}'" in message or f" {old} " in message:
                new_line = re.sub(r"\b" + re.escape(old) + r"\b", updated, new_line)

        if new_line != original_line:
            file_lines[idx] = new_line
            fixes_applied += 1

# Write back all modified files
    for path, content in processed_files.items():
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(content)
            
    return fixes_applied

def main():
    cwd = os.getcwd()
    if len(sys.argv) > 1:
        cwd = os.path.abspath(sys.argv[1])
        
    print(f"Starting auto-fix in {cwd}")
    
    iteration = 0
    max_iterations = 5
    while iteration < max_iterations:
        iteration += 1
        print(f"\n--- Iteration {iteration} ---")
        output = run_tsc(cwd)
        if "Found 0 errors" in output:
            print("No more errors found!")
            break
            
        fixes = fix_errors(cwd, output)
        print(f"Applied {fixes} fixes.")
        if fixes == 0:
            print("No more automated fixes possible.")
# Run one more tsc to show remaining errors
            output = run_tsc(cwd)
            print(output)
            break

if _name_ == "_main_":
    main()
