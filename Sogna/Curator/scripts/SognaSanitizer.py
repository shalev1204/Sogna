import os
import re
import sys

def sanitize_path(target_dir):
    print(f"[SANITY] Starting deep sanitization of: {target_dir}")
    
    # Folders to completely ignore
    ignore_dirs = {'node_modules', '.git', '.sognatore', 'dist', 'build'}

    # 1. Rename files and directories to lowercase
    for root, dirs, files in os.walk(target_dir, topdown=False):
        # Filter directories to skip ignored ones in the next walk steps
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        # Rename files
        for name in files:
            old_path = os.path.join(root, name)
            new_name = name.lower()
            new_path = os.path.join(root, new_name)
            if old_path != new_path:
                if os.path.exists(new_path):
                    temp_path = old_path + ".tmp"
                    os.rename(old_path, temp_path)
                    os.rename(temp_path, new_path)
                else:
                    os.rename(old_path, new_path)
                print(f"[RENAME] {name} -> {new_name}")

        # Rename directories
        for name in dirs:
            old_path = os.path.join(root, name)
            new_name = name.lower()
            new_path = os.path.join(root, new_name)
            if old_path != new_path:
                if os.path.exists(new_path):
                    temp_path = old_path + ".tmp"
                    os.rename(old_path, temp_path)
                    os.rename(temp_path, new_path)
                else:
                    os.rename(old_path, new_path)
                print(f"[RENAME] {name}/ -> {new_name}/")

    # 2. Fix imports in .ts and .tsx files
    import_pattern = re.compile(r'(import|export|from)\s+["\'](\.?\.\/?[^"\']+)["\']')

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for name in files:
            if name.endswith(('.ts', '.tsx', '.js', '.mjs', '.cjs')):
                file_path = os.path.join(root, name)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                def lower_import(match):
                    prefix = match.group(1)
                    path_val = match.group(2)
                    if path_val.startswith('.'):
                        return f'{prefix} "{path_val.lower()}"'
                    return match.group(0)

                new_content = import_pattern.sub(lower_import, content)

                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"[FIX] Updated imports in: {name}")

    print("[SANITY] Sanitization complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        sanitize_path(sys.argv[1])
    else:
        print("Usage: python SognaSanitizer.py <directory>")
