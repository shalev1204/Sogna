import os
import json
import re
import datetime
import math
from pathlib import Path

# DNA Extraction Patterns
URL_PATTERN = re.compile(r'https?://[^\s/$.?#].[^\s]*', re.IGNORECASE)
EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}')

DANGEROUS_FLAGS = [
    r'--os-shell', r'--os-pwn', r'--exec', r'--eval', 
    r'-e\s+/(?:bin|usr|dev)', r'--privileged', r'--sh',
    r'base64\s+-d', r'curl\s+.*\s+\|\s+(?:bash|sh)', 
    r'wget\s+.*\s+\|\s+(?:bash|sh)', r'rm\s+-rf\s+/',
    r'chmod\s+777', r'nc\s+-e', r'iptables\s+-F',
    r'setenforce\s+0', r'systemctl\s+stop\s+firewalld'
]

SENSITIVE_FILES = [
    r'\.env', r'\.ssh', r'id_rsa', r'/etc/passwd', r'/etc/shadow',
    r'KUBECONFIG', r'\.aws/credentials', r'\.gitconfig', r'shadow\.bak',
    r'master\.key', r'\.p12', r'\.pem', r'\.key'
]

VULNERABILITY_PATTERNS = [
    r'(?:allow_all|CORS_ORIGIN\s*[:=]\s*\*|Access-Control-Allow-Origin\s*[:=]\s*)',
    r'(?:password|secret|key|token|auth)\s*[:=]\s*["\'](?!pk|sk|sb|ak|id)[^"\']{8,}["\']', # Potential hardcoded passwords
    r'bind\s*[:=]\s*["\']0\.0\.0\.0["\']',
    r'verify\s*[:=]\s*false',
    r'DEBUG\s*[:=]\s*(?:true|1)',
    r'chmod\s+(?:777|666)',
    r'\b(?:always trust|bypass safety|ignore filters|reveal internal)\b', # AI Specific vulnerabilities
    r'\b(?:provide|reveal|show|send|export)\s*(?:admin|system|internal|private)\s*(?:secret|key|token)\b',
    r'["\']alg["\']\s*[:=]\s*["\']none["\']', # JWT bypass
    r'\b__proto__\b' # Prototype Pollution
]

HEURISTIC_OFFENSIVE = [
    r'\b(?:pentest(?:ing)?|penetration testing|red team(?:ing)?|exploit(?:ation)?|malware|phishing|sql injection|xss|csrf|jailbreak|sandbox escape|credential theft|exfiltrat\w*|prompt injection|instruction overriding|hid(?:den|e) system prompt)\b',
    r'AUTHORIZED USE ONLY'
]

HEURISTIC_CRITICAL = [
    r'\b(?:kubectl\s+apply|terraform\s+apply|ansible-playbook|docker\s+push)\b',
    r'\b(?:npm|pnpm|yarn|bun)\s+publish\b',
    r'\b(?:sh|bash|zsh|powershell|pwsh)\b[^\n]{0,20}\b(?:rm\s+-rf|chmod\s+777|nc\s+-e)\b',
    r'\b(?:POST|PUT|PATCH|DELETE)\b',
    r'\b(?:insert|update|upsert|delete|drop|truncate|alter)\b[^\n]{0,20}\b(?:table|database|record|row)\b',
    r'\b(?:ignore all previous instructions|you must comply|bypass all security)\b', # Critical Hijacking
    r'169\.254\.169\.254' # SSRF - Cloud Metadata
]

# Paths to ignore entirely
IGNORE_DIRS = {'.git', 'node_modules', '.turbo', '.next', 'dist', 'build', 'out', '.sognatore', 'tests', 'brain', 'docs', 'knowledge', 'artifacts', '.gemini'}
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.exe', '.dll', '.so', '.bin', '.pdf', '.zip', '.tar', '.gz'}

def shannon_entropy(data: str) -> float:
    if not data: return 0
    entropy = 0
    for x in range(256):
        p_x = data.count(chr(x)) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

class SentinelTrainer:
    def __init__(self, output_path: Path):
        self.output_path = output_path
        self.risk_dna = {
            "domains": set(),
            "flags": set(),
            "sensitive_files": set(),
            "leaks": set(),
            "secrets": set(),
            "vulnerabilities": set(),
            "heuristics": {
                "offensive": set(),
                "critical": set()
            },
            "stats": {
                "total_scanned": 0,
                "risk_hits": 0,
                "entropy_warnings": 0,
                "heuristic_alerts": 0
            }
        }

    def extract_dna(self, content: str, filepath: str):
        self.risk_dna["stats"]["total_scanned"] += 1
        found_risk = False
        
# 1. Domains
        urls = URL_PATTERN.findall(content)
        for url in urls:
            try:
                domain = url.split('//')[1].split('/')[0].split('?')[0].strip('"\'`,')
                if domain and domain not in ['localhost', '127.0.0.1', 'google.com', 'github.com', 'anthropic.com', 'openai.com']:
                    self.risk_dna["domains"].add(domain)
                    found_risk = True
            except IndexError: continue

# 2. Leaks (Emails)
        emails = EMAIL_PATTERN.findall(content)
        for email in emails:
            if not email.endswith(('.com', '.org', '.net', '.edu')): # Just a sample filter
                continue
            self.risk_dna["leaks"].add(email)
            found_risk = True

# 3. Code/Command Patterns
        for pattern in DANGEROUS_FLAGS:
            if re.search(pattern, content, re.IGNORECASE):
                self.risk_dna["flags"].add(pattern)
                found_risk = True
        
# 4. Vulnerabilities
        for pattern in VULNERABILITY_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                self.risk_dna["vulnerabilities"].add(pattern)
                found_risk = True

# 5. Entropy (Secret Detection)
# Find long strings (potential keys)
        potentials = re.findall(r'["\']([a-zA-Z0-9\/\+=]{24,})["\']', content)
        for p in potentials:
            ent = shannon_entropy(p)
            if ent > 4.5: # Threshold for high-entropy strings
                self.risk_dna["secrets"].add(p[:8] + "...") # Store partial for matching
                self.risk_dna["stats"]["entropy_warnings"] += 1
                found_risk = True

# 6. Heuristics (Offensive)
        for pattern in HEURISTIC_OFFENSIVE:
            if re.search(pattern, content, re.IGNORECASE):
                self.risk_dna["heuristics"]["offensive"].add(pattern)
                self.risk_dna["stats"]["heuristic_alerts"] += 1
                found_risk = True

# 7. Heuristics (Critical Mutation)
        for pattern in HEURISTIC_CRITICAL:
            if re.search(pattern, content, re.IGNORECASE):
                self.risk_dna["heuristics"]["critical"].add(pattern)
                self.risk_dna["stats"]["heuristic_alerts"] += 1
                found_risk = True

        if found_risk:
            self.risk_dna["stats"]["risk_hits"] += 1

    def deep_global_scan(self, root: Path):
        print(f"[*] Starting DEEP GLOBAL AUDIT from: {root}")
        start_time = datetime.datetime.now()
        
for dirpath, dirnames, filenames in os.walk(root):
# Prune ignored directories
dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            
for filename in filenames:
file_ext = Path(filename).suffix.lower()
                if file_ext in IGNORE_EXTS: continue
                
fpath = Path(dirpath) / filename
                rel_path = fpath.relative_to(root)
                
                try:
# Skip files larger than 5MB to prevent memory issues
                    if fpath.stat().st_size > 5 * 1024 * 1024: continue
                    
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                        self.extract_dna(f.read(), str(rel_path))
                        
                    if self.risk_dna["stats"]["total_scanned"] % 500 == 0:
                        print(f"    - Scanned {self.risk_dna['stats']['total_scanned']} files...")
                        
                except Exception as e:
                    pass # Silent skip for locked or unreadable files

        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"[*] Deep Audit completed in {duration:.2f}s")

    def save_intelligence(self):
        results = {
            "version": "1.3.0",
            "timestamp": datetime.date.today().isoformat(),
            "domains": sorted(list(self.risk_dna["domains"])),
            "flags": sorted(list(self.risk_dna["flags"])),
            "leaks": sorted(list(self.risk_dna["leaks"])),
            "secrets": sorted(list(self.risk_dna["secrets"])),
            "vulnerabilities": sorted(list(self.risk_dna["vulnerabilities"])),
            "heuristics": {
                "offensive": sorted(list(self.risk_dna["heuristics"]["offensive"])),
                "critical": sorted(list(self.risk_dna["heuristics"]["critical"]))
            },
            "stats": self.risk_dna["stats"]
        }

        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n[SENTINEL DEEP AUDIT] Complete!")
        print(f"   Total Files: {results['stats']['total_scanned']}")
        print(f"   Risk Hits: {results['stats']['risk_hits']}")
        print(f"   Entropy Alerts: {results['stats']['entropy_warnings']}")
        print(f"   Intelligence fully updated at: {self.output_path}")

if _name_ == "_main_":
    output_file = Path(r"c:\Users\carle\Desktop\Sogna\Sogna\Toolkit\engines\Sentinel\data\risk_dna_feed.json")
    root_to_scan = Path(r"c:\Users\carle\Desktop\Sogna")
    
    trainer = SentinelTrainer(output_file)
    trainer.deep_global_scan(root_to_scan)
    trainer.save_intelligence()
