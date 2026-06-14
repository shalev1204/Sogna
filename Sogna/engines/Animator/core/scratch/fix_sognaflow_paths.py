import os

root_dir = r'C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\core\src'

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
# Replace sognaflow component paths with motion paths
    new_content = new_content.replace('/render/components/sognaflow/', '/render/components/motion/')
    # Fixed direct imports too
    new_content = new_content.replace('from "./render/components/sognaflow/namespace"', 'from "./render/components/motion/namespace.js"')
    new_content = new_content.replace('from "../../render/components/sognaflow/proxy"', 'from "../../render/components/motion/proxy.js"')
    new_content = new_content.replace('from "../../render/components/motion/proxy"', 'from "../../render/components/motion/proxy.js"')
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            if fix_file(os.path.join(root, file)):
                count += 1

print(f'Fixed {count} files')
