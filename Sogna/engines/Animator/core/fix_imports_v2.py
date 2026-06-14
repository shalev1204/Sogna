import os
import re

root_dir = r"c:\Users\carle\Desktop\Sogna\Sogna\Curator\engines\Animator\core\src"

# Path replacements
replacements = [
    (re.compile(r'from "\.\./\.\./sognaflow'), 'from "../../motion'),
    (re.compile(r'from "\.\./sognaflow'), 'from "../motion'),
    (re.compile(r'from "\.\./\.\./\.\./sognaflow'), 'from "../../../motion'),
    (re.compile(r'import {([^}]+)} from "sognaflow-dom"'), None), # Special handling for aliases
]

# Alias map (lowercase: CamelCase)
alias_map = {
    "recordStats": "RecordStats",
    "statsBuffer": "StatsBuffer",
    "frameData": "FrameData",
    "mix": "Mix",
    "interpolate": "Interpolate",
    "isHTMLElement": "IsHTMLElement",
    "resize": "Resize",
    "scrapeHTMLsognaflowValuesFromProps": "ScrapeHTMLSognaflowValuesFromProps",
    "scrapeSVGsognaflowValuesFromProps": "ScrapeSVGSognaflowValuesFromProps",
    "isForcedsognaflowValue": "IsForcedSognaflowValue",
    "resolveElements": "ResolveElements",
    "hasReducedsognaflowListener": "HasReducedSognaflowListener",
    "initPrefersReducedsognaflow": "InitPrefersReducedSognaflow",
    "prefersReducedsognaflow": "PrefersReducedSognaflow",
}

def fix_aliases(match):
    members = match.group(1).split(",")
    new_members = []
    for m in members:
        m = m.strip()
        if " as " in m:
            new_members.append(m)
            continue
        
# If it's a known alias, we check if it exists in dom index.ts
# But for now I'll just assume I'll add the alias to dom index.ts
        new_members.append(m)
    
    return f'import {{ {", ".join(new_members)} }} from "sognaflow-dom"'

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements[:3]:
                new_content = pattern.sub(repl, new_content)
            
# Manual alias check/fix if needed? No, better add aliases to dom/src/index.ts
            
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Fixed imports in {path}")
