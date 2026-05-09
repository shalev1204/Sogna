import os
import re

paths = [
    r"c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Sentinel"
]

pattern = re.compile(r"(['\"])(?P<path>\.\.?/[^'\"]+)(['\"])")

def lowercase_path(match):
    return match.group(1) + match.group('path').lower() + match.group(3)

for root_path in paths:
    if not os.path.exists(root_path):
        continue
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.py', '.js')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = pattern.sub(lowercase_path, content)
                    
                    if content != new_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
