import os
import py_compile
import sys
from pathlib import Path

def is_global_line(line):
    stripped = line.strip()
    if not stripped or stripped.startswith('#'):
        return True
    
    # Common global python constructs
    global_prefixes = [
        'def ', 'class ', 'import ', 'from ', 'if __name__', 'if _name_',
        'SECRET_PATTERNS', 'DANGEROUS_PATTERNS', 'SKIP_DIRS', 'SKIP_FILES',
        'CODE_EXTENSIONS', 'CONFIG_EXTENSIONS', 'SKIP_PATTERNS', 'PAGE_NAMES',
        'VERIFICATION_SUITE', 'CORE_CHECKS', 'PERFORMANCE_CHECKS', 'SECTIONS',
        'Colors', 'SKIP_PATTERNS', 'CONFIG_EXTENSIONS'
    ]
    return any(stripped.startswith(p) for p in global_prefixes)

def fix_file(filepath):
    print(f"Correcting indentation in {filepath}...")
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    new_lines = []
    current_indent = 0
    next_line_indent = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Replace _name_ and _main_
        if 'if _name_ ==' in line:
            line = line.replace('_name_', '__name__').replace('_main_', '__main__')
            stripped = line.strip()
            
        actual_indent = len(line) - len(line.lstrip())
        
        if is_global_line(line):
            # If it's a global line at 0 indentation, reset current indent
            if actual_indent == 0:
                current_indent = 0
                next_line_indent = 0
            new_lines.append(line)
        else:
            # If the line has 0 spaces but is inside a function/block
            if actual_indent == 0:
                # Indent it to next_line_indent (expected) or current_indent
                target_indent = next_line_indent if next_line_indent > 0 else current_indent
                if target_indent == 0:
                    target_indent = 4 # default fallback inside functions
                line = (' ' * target_indent) + line
                actual_indent = target_indent
                
            new_lines.append(line)
            current_indent = actual_indent
            
            # If this line ends with a colon, the next line should be indented deeper
            if stripped.endswith(':'):
                next_line_indent = current_indent + 4
            else:
                next_line_indent = current_indent
                
    fixed_content = "".join(new_lines)
    
    temp_path = filepath + ".fixed.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
        
    try:
        py_compile.compile(temp_path, doraise=True)
        os.replace(temp_path, filepath)
        print(f"-> SUCCESSFULLY FIXED: {filepath}\n")
        return True
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"-> FAILED fixing {filepath}: {e}\n")
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
        "Curator/skills/geo-fundamentals/scripts/geo_checker.py"
    ]
    for f in failing_files:
        if os.path.exists(f):
            fix_file(f)
