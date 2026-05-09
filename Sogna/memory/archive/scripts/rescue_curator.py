import os
import shutil
import sys

def rescue():
    root = r"C:\Users\carle\Desktop\Sogna\Sogna"
    curator = os.path.join(root, "Curator")
    temp = os.path.join(curator, "curator_temp")
    
    if not os.path.exists(temp):
        print(f"Temp folder {temp} not found.")
        return

    for item in os.listdir(temp):
        s = os.path.join(temp, item)
        d = os.path.join(curator, item)
        try:
            if os.path.exists(d):
                if os.path.isdir(d):
                    print(f"Skipping {item}, already exists in Curator")
# Optionally merge or delete the duplicate in temp
                else:
                    os.remove(d)
                    shutil.move(s, d)
            else:
                shutil.move(s, d)
        except Exception as e:
            print(f"Error moving {item}: {e}")

# Try to delete temp
    try:
        shutil.rmtree(temp)
        print("Temp folder deleted.")
    except Exception as e:
        print(f"Error deleting temp: {e}")

if _name_ == "_main_":
    rescue()
