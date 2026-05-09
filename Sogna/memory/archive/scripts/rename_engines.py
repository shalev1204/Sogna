import os
import shutil

def rename_to_lower(path):
    parent = os.path.dirname(path)
    old_name = os.path.basename(path)
    new_name = old_name.lower()
    
    if old_name == new_name:
        return
        
    temp_path = os.path.join(parent, old_name + "_tmp_rename")
    new_path = os.path.join(parent, new_name)
    
    print(f"Renaming {old_name} -> {new_name}")
    os.rename(path, temp_path)
    os.rename(temp_path, new_path)

engines_dir = r'C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines'
for item in os.listdir(engines_dir):
    full_path = os.path.join(engines_dir, item)
    if os.path.isdir(full_path):
        rename_to_lower(full_path)
