import os
import re

# Dictionary of casing fixes for standard methods and properties
CASING_FIXES = {
    r'\bappendfile\b': 'appendFile',
    r'\bisarray\b': 'isArray',
    r'\btofixed\b': 'toFixed',
    r'\btrimstart\b': 'trimStart',
    r'\btrimend\b': 'trimEnd',
    r'\bmatchall\b': 'matchAll',
    r'\blastindex\b': 'lastIndex',
    r'\bstatuscode\b': 'statusCode',
    r'\bexitcode\b': 'exitCode',
    r'\bbgred\b': 'bgRed',
    r'\bbgrgb\b': 'bgRgb',
    r'\bbluebright\b': 'blueBright',
    r'\byellowbright\b': 'yellowBright',
    r'\bgreenbright\b': 'greenBright',
    r'\bcyanbright\b': 'cyanBright',
    r'\bmagentabright\b': 'magentaBright',
    r'\bredbright\b': 'redBright',
    r'\bcreateinterface\b': 'createInterface',
    r'\bcreateserver\b': 'createServer',
    r'\bcreatehmac\b': 'createHmac',
    r'\btimingsafeequal\b': 'timingSafeEqual',
    r'\bscryptsync\b': 'scryptSync',
    r'\bcreatecipheriv\b': 'createCipheriv',
    r'\bcreatedecipheriv\b': 'createDecipheriv',
    r'\breaddirsync\b': 'readdirSync',
    r'\bfswatcher\b': 'FSWatcher',
    r'\buserinfo\b': 'userInfo',
    r'\bisabsolute\b': 'isAbsolute',
    r'\bcopyfile\b': 'copyFile',
    r'\bremovealllisteners\b': 'removeAllListeners',
    r'\ballsettled\b': 'allSettled',
    r'\bgettime\b': 'getTime',
    r'\bpadend\b': 'padEnd',
    r'\bpadstart\b': 'padStart',
    r'\bflatmap\b': 'flatMap',
    r'\bmtimems\b': 'mtimeMs',
}

# Import path fixes
IMPORT_FIXES = {
    'Sentinel-Sognatore': 'sentinel-sognatore',
    'Memory/': 'memory/',
}

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

# 1. Revert import.meta.URL -> import.meta.url
    content = content.replace('import.meta.URL', 'import.meta.url')
    
# 2. Revert import { ... } from 'URL' -> 'url'
    content = re.sub(r"from\s+['\"]URL['\"]", "from 'url'", content)

# 3. Apply method/property casing fixes
    for pattern, replacement in CASING_FIXES.items():
        content = re.sub(pattern, replacement, content)

# 4. Handle specific type fixes safely
# buffer -> Buffer (if not in a property path)
    content = re.sub(r'(?<!\.)\bbuffer\b(?!:)', 'Buffer', content)
# array -> Array (if not in a property path)
    content = re.sub(r'(?<!\.)\barray\b(?!:)', 'Array', content)
    
# 5. Fix BigInt vs bigint in otel.ts
    if 'otel.ts' in filepath:
        content = content.replace('.BigInt', '.bigint')

# Apply import path fixes
    for old, new in IMPORT_FIXES.items():
        content = content.replace(old, new)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    root_dir = r'C:\Users\carle\Desktop\Sogna\Sogna\Sognatore\src'
    count = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.js'):
                path = os.path.join(root, file)
                if fix_file(path):
                    print(f'Fixed: {path}')
                    count += 1
    print(f'\nTotal files fixed: {count}')

if _name_ == '_main_':
    main()
