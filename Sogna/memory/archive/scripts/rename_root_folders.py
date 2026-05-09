import os

def rename_to_lower(path):
    parent = os.path.dirname(path)
    old_name = os.path.basename(path)
    new_name = old_name.lower()
    
    if old_name == new_name:
        return
        
    temp_path = os.path.join(parent, old_name + "_tmp_rename_root_2")
    new_path = os.path.join(parent, new_name)
    
    print(f"Renaming {old_name} -> {new_name}")
    try:
        os.rename(path, temp_path)
        os.rename(temp_path, new_path)
    except Exception as e:
        print(f"Failed to rename {old_name}: {e}")

root_dir = r'C:\Users\carle\Desktop\Sogna\Sogna'
rename_to_lower(os.path.join(root_dir, 'Sognatore'))
rename_to_lower(os.path.join(root_dir, 'Curator'))
