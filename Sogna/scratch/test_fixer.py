import os
import py_compile
import sys

def clean_line_for_colon(line):
    if '#' in line:
        parts = line.split('#')
        for idx in range(len(parts) - 1, 0, -1):
            before = '#'.join(parts[:idx])
            # Check if quotes are balanced in 'before'
            if (before.count("'") % 2 == 0) and (before.count('"') % 2 == 0):
                return before.strip()
    return line.strip()

def fix_indentation(content):
    lines = content.split('\n')
    output_lines = []
    
    # Indentation stack. The global level is 0.
    stack = [0]
    has_seen_def_or_class = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # If it's a blank line or comment, we just preserve it and don't change stack
        if not stripped or stripped.startswith('#'):
            output_lines.append(line)
            continue
            
        actual_indent = len(line) - len(line.lstrip())
        
        # Replace _name_ and _main_
        if 'if _name_ ==' in line:
            line = line.replace('_name_', '__name__').replace('_main_', '__main__')
            stripped = line.strip()
            
        # Check if it is a global keyword
        is_global = False
        for k in ['def ', 'class ', 'import ', 'from ', 'if __name__', 'if _name_']:
            if stripped.startswith(k):
                is_global = True
                if k in ['def ', 'class ']:
                    has_seen_def_or_class = True
                break
                
        if not has_seen_def_or_class:
            is_global = True
            
        if is_global and actual_indent == 0:
            stack = [0]
            
        # Check if it is a block continuation
        is_continuation = False
        if stripped.startswith('except') or stripped.startswith('finally') or stripped.startswith('elif') or stripped.startswith('else:') or stripped.startswith('else '):
            is_continuation = True
            
        # Check if the previous statement was a block exit (only matters for normal statements)
        if not is_continuation:
            prev_line_exits = False
            for prev_l in reversed(output_lines):
                prev_stripped = prev_l.strip()
                if prev_stripped and not prev_stripped.startswith('#'):
                    words = prev_stripped.split()
                    if words and words[0] in ['return', 'break', 'continue', 'raise', 'pass']:
                        prev_line_exits = True
                    break
                    
            if prev_line_exits:
                exit_indent = 0
                for prev_l in reversed(output_lines):
                    prev_stripped = prev_l.strip()
                    if prev_stripped and not prev_stripped.startswith('#'):
                        exit_indent = len(prev_l) - len(prev_l.lstrip())
                        break
                while len(stack) > 1 and stack[-1] >= exit_indent:
                    stack.pop()
                    
        # Now determine the target indent
        if is_continuation:
            if actual_indent > 0:
                while len(stack) > 1 and stack[-1] > actual_indent:
                    stack.pop()
            else:
                if len(stack) > 1:
                    stack.pop()
                actual_indent = stack[-1]
                line = (' ' * actual_indent) + line
        else:
            if actual_indent == 0 and not is_global:
                target_indent = stack[-1]
                line = (' ' * target_indent) + line
                actual_indent = target_indent
            else:
                while len(stack) > 1 and stack[-1] > actual_indent:
                    stack.pop()
                    
        # If this line ends with a colon, the next line should open a new block
        cleaned = clean_line_for_colon(line)
        if cleaned.endswith(':'):
            stack.append(actual_indent + 4)
            
        output_lines.append(line)
        
    return '\n'.join(output_lines)

def fix_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    fixed = fix_indentation(content)
    
    # Try compiling the fixed content
    temp_path = filepath + ".tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(fixed)
        
    try:
        py_compile.compile(temp_path, doraise=True)
        os.replace(temp_path, filepath)
        print(f"  [SUCCESS] Compiled and saved!")
        return True
    except Exception as e:
        # e is py_compile.PyCompileError
        exc = getattr(e, 'exc_value', e)
        print(f"  [FAILED] Syntax/Indentation error: {exc}")
        # Print surrounding context of error line if available
        try:
            err_line = getattr(exc, 'lineno', None)
            if err_line:
                print("  Context:")
                lines = fixed.split('\n')
                start_l = max(0, err_line - 5)
                end_l = min(len(lines), err_line + 5)
                for idx in range(start_l, end_l):
                    marker = ">>>" if idx + 1 == err_line else "   "
                    print(f"  {marker} {idx+1:4d}: {repr(lines[idx])}")
        except Exception as ex:
            print(f"  (Could not print context: {ex})")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return False

if __name__ == '__main__':
    failing_files = [
        "Curator/skills/mobile-design/scripts/mobile_audit.py",
        "Curator/skills/seo-fundamentals/scripts/seo_checker.py",
        "Curator/skills/vulnerability-scanner/scripts/security_scan.py",
        "Curator/skills/database-design/scripts/schema_validator.py",
        "Curator/skills/i18n-localization/scripts/i18n_checker.py",
        "Curator/skills/performance-profiling/scripts/lighthouse_audit.py",
        "Curator/skills/nextjs-react-expert/scripts/convert_rules.py",
        "Curator/skills/nextjs-react-expert/scripts/react_performance_checker.py",
        "Curator/skills/frontend-design/scripts/ux_audit.py",
        "Curator/skills/api-patterns/scripts/api_validator.py",
        "Curator/skills/geo-fundamentals/scripts/geo_checker.py",
        "Curator/skills/lint-and-validate/scripts/lint_runner.py",
        "Curator/skills/lint-and-validate/scripts/type_coverage.py",
        "Curator/skills/frontend-design/scripts/accessibility_checker.py",
        "Curator/skills/webapp-testing/scripts/playwright_runner.py",
        "Curator/skills/testing-patterns/scripts/test_runner.py"
    ]
    
    success_count = 0
    for f in failing_files:
        if os.path.exists(f):
            # Restore to clean state first to be sure
            os.system(f"git checkout -- {f}")
            if fix_file(f):
                success_count += 1
                
    print(f"\nSummary: {success_count}/{len(failing_files)} files fixed successfully.")
