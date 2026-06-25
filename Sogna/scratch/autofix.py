import sys
import os
from pathlib import Path

def fix_file(filepath):
    print(f"Auto-fixing {filepath}...")
    
    # First, let's checkout any bad changes if the file got messed up in previous attempts
    # (Actually we can just run the fixing directly, but let's be careful to also replace single-underscores first)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Initial normalization of single-underscores
    if '_name_' in content or '_main_' in content:
        content = content.replace('_name_', '__name__').replace('_main_', '__main__')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    for iteration in range(300):
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        try:
            compile(content, filepath, 'exec')
            print(f"[SUCCESS] {filepath} compiled successfully after {iteration} edits!\n")
            return True
        except SyntaxError as e:
            lineno = e.lineno
            msg = e.msg or ""
            lines = content.split('\n')
            
            if lineno is None or lineno > len(lines):
                print(f"[ABORT] Invalid line number {lineno}")
                return False
                
            err_line = lines[lineno - 1]
            stripped = err_line.strip()
            
            print(f"  Iteration {iteration}: Error on line {lineno}: {msg.strip()} -> {err_line.strip()[:60]}")
            
            # Fix strategies
            if "expected an indented block" in msg.lower():
                # Line needs to be indented more than its current level
                # Let's find the previous line's indent and add 4 spaces
                prev_indent = "    "
                for p in range(lineno - 2, -1, -1):
                    if lines[p].strip():
                        prev_indent = " " * (len(lines[p]) - len(lines[p].lstrip()))
                        break
                lines[lineno - 1] = prev_indent + "    " + stripped
            elif "unexpected indent" in msg.lower() or "unindent does not match" in msg.lower():
                # Let's look at the context. If it's a global keyword, set to 0 spaces
                is_global_keyword = any(stripped.startswith(k) for k in ['def ', 'class ', 'import ', 'from ', 'if __name__', '#', 'try:', 'except:', 'except '])
                if is_global_keyword:
                    lines[lineno - 1] = stripped
                else:
                    # Let's match the indent of the previous non-empty line
                    prev_indent = ""
                    for p in range(lineno - 2, -1, -1):
                        if lines[p].strip():
                            prev_indent = " " * (len(lines[p]) - len(lines[p].lstrip()))
                            break
                    lines[lineno - 1] = prev_indent + stripped
            else:
                # Other syntax errors, let's see if we can do basic unindent
                if len(err_line) - len(err_line.lstrip()) > 0:
                    lines[lineno - 1] = err_line.lstrip()
                else:
                    print(f"[ABORT] Unhandled SyntaxError on line {lineno}: {msg}")
                    return False
                    
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("\n".join(lines))
                
    print(f"[LIMIT] Reached max iterations for {filepath}")
    return False

if __name__ == '__main__':
    failing_files = [
        "Curator/skills/mobile-design/scripts/mobile_audit.py",
        "Curator/skills/seo-fundamentals/scripts/seo_checker.py",
        "Curator/skills/i18n-localization/scripts/i18n_checker.py",
        "Curator/skills/performance-profiling/scripts/lighthouse_audit.py",
        "Curator/skills/nextjs-react-expert/scripts/convert_rules.py",
        "Curator/skills/nextjs-react-expert/scripts/react_performance_checker.py",
        "Curator/skills/frontend-design/scripts/ux_audit.py",
        "Curator/skills/api-patterns/scripts/api_validator.py",
        "Curator/skills/geo-fundamentals/scripts/geo_checker.py",
        "Curator/skills/vulnerability-scanner/scripts/security_scan.py",
        "Curator/skills/database-design/scripts/schema_validator.py",
        "Curator/skills/lint-and-validate/scripts/lint_runner.py"
    ]
    for f in failing_files:
        if os.path.exists(f):
            # Run git checkout on the file first to discard previous failed heuristic attempts
            # and get a clean baseline to fix.
            os.system(f"git checkout -- {f}")
            fix_file(f)
