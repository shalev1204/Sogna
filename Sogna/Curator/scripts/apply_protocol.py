import os

ROOT = r"c:\Users\carle\Desktop\Sogna\Sogna"
DIRS_TO_SCAN = [
    os.path.join(ROOT, "memory"),
    os.path.join(ROOT, "Sognatore", "src", "core", "dept"),
    os.path.join(ROOT, "Curator")
]

def apply_lowercase_protocol():
    print("--- APPLYING LOWERCASE PROTOCOL (Windows Safe) ---")
    for base_dir in DIRS_TO_SCAN:
        if not os.path.exists(base_dir): continue
        print(f"Scanning {base_dir}...")
        
        for root, dirs, files in os.walk(base_dir, topdown=False):
            # 1. Rename Files
            for name in files:
                if name.lower().endswith(('.md', '.json', '.txt', '.yml', '.yaml')):
                    if any(c.isupper() for c in name):
                        old_path = os.path.join(root, name)
                        new_name = name.lower()
                        new_path = os.path.join(root, new_name)
                        
                        if old_path != new_path:
                            # Use temporary name for Windows case-insensitivity
                            temp_path = old_path + ".tmp_rename"
                            try:
                                os.rename(old_path, temp_path)
                                os.rename(temp_path, new_path)
                                print(f"  [RENAMED] {name} -> {new_name}")
                            except Exception as e:
                                print(f"  [ERROR] Failed to rename {name}: {e}")

            # 2. Rename Directories
            for name in dirs:
                if any(c.isupper() for c in name) and name != "node_modules":
                    old_path = os.path.join(root, name)
                    new_name = name.lower()
                    new_path = os.path.join(root, new_name)
                    
                    if old_path != new_path:
                        temp_path = old_path + "_tmp_rename"
                        try:
                            os.rename(old_path, temp_path)
                            os.rename(temp_path, new_path)
                            print(f"  [RENAMED DIR] {name} -> {new_name}")
                        except Exception as e:
                            print(f"  [ERROR] Failed to rename dir {name}: {e}")

if __name__ == "__main__":
    apply_lowercase_protocol()
