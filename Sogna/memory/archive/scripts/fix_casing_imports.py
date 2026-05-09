import os

replacements = {
    'sync-Time.js': 'sync-time.js',
    'Interpolate.js': 'interpolate.js',
    'Delay.js': 'delay.js',
    'Microtask.js': 'microtask.js'
}

root_dir = r'c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\dom\src'

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                # Replace the filename regardless of its position in the path
                # e.g. "./utils/Delay.js" -> "./utils/delay.js"
                new_content = new_content.replace(f'/{old}', f'/{new}')
                # Also handle cases where it might be just "Delay.js"
                new_content = new_content.replace(f'"{old}"', f'"{new}"')
                new_content = new_content.replace(f"'{old}'", f"'{new}'")
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed casing in {path}")
