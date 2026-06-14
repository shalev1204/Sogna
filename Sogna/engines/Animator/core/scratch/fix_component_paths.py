import os

root_dir = r'C:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\core\src'

mappings = {
    './components/AnimatePresence/index.js': './components/animate-presence/index.js',
    './components/AnimatePresence/PopChild.js': './components/animate-presence/PopChild.js',
    './components/AnimatePresence/PresenceChild.js': './components/animate-presence/PresenceChild.js',
    './components/LayoutGroup/index.js': './components/layout-group/index.js',
    './components/LazyMotion/index.js': './components/lazy-motion/index.js',
    './components/MotionConfig/index.js': './components/motion-config/index.js',
    './components/Reorder/index.js': './components/reorder/index.js',
    './components/AnimatePresence/types.js': './components/animate-presence/types.js',
    './components/LazyMotion/types.js': './components/lazy-motion/types.js',
    '../../../components/AnimatePresence/use-presence.js': '../../../components/animate-presence/use-presence.js',
}

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in mappings.items():
        new_content = new_content.replace(f'"{old}"', f'"{new}"')
        new_content = new_content.replace(f"'{old}'", f"'{new}'")
    
# Generic replacements for common patterns
    new_content = new_content.replace('/components/AnimatePresence/', '/components/animate-presence/')
    new_content = new_content.replace('/components/LayoutGroup/', '/components/layout-group/')
    new_content = new_content.replace('/components/LazyMotion/', '/components/lazy-motion/')
    new_content = new_content.replace('/components/MotionConfig/', '/components/motion-config/')
    new_content = new_content.replace('/components/Reorder/', '/components/reorder/')
    
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
