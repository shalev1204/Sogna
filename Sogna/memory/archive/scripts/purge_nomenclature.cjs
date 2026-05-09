const fs = require('fs');
const path = require('path');

const ROOT_DIRS = [
    './Sognatore/src',
    './toolkit'
];

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', '.turbo', '.sognatore', 'assets', 'out', 'build'];

const REPLACEMENTS = [
    {
        // Handle both UTF-8 and potential encoding mess-ups
        pattern: /Justificaci[ónÃ³]+n institucional inyectada por Auto-Remediador Apex/g,
        replacement: 'Justificación técnica inyectada por el motor de seguridad'
    },
    {
        pattern: /SwarmService/g,
        replacement: 'SwarmService'
    },
    {
        pattern: /SOGNA_SOVEREIGNTY_MODE/g,
        replacement: 'SOGNA_LOCAL_MODE'
    },
    {
        pattern: /isSovereign/g,
        replacement: 'isLocalOnly'
    },
    {
        pattern: /sovereigntyMode/g,
        replacement: 'localMode'
    },
    {
        pattern: /Institutional-Grade/g,
        replacement: 'Production-Grade'
    },
    {
        pattern: /Decision Sovereignty/g,
        replacement: 'Security Enforcement'
    },
    {
        pattern: /Sovereignty Mode/g,
        replacement: 'Local Mode'
    },
    {
        pattern: /Sovereign Swarm/g,
        replacement: 'Swarm Pulse'
    },
    {
        pattern: /SwarmOrchestrator/g,
        replacement: 'SwarmOrchestrator'
    },
    {
        pattern: /Apex Hardening/g,
        replacement: 'Security Hardening'
    },
    {
        pattern: /Institutional Pruning/g,
        replacement: 'Data Pruning'
    },
    {
        pattern: /Apex mode/gi,
        replacement: 'high-security mode'
    },
    {
        pattern: /Institutional Validators/g,
        replacement: 'Core Validators'
    },
    {
        pattern: /Institutional Policy/g,
        replacement: 'System Policy'
    },
    {
        pattern: /Institutional Panic/g,
        replacement: 'System Panic'
    },
    {
        pattern: /Institutional Parity/g,
        replacement: 'System Parity'
    },
    {
        pattern: /Institutional performance/g,
        replacement: 'system performance'
    },
    {
        pattern: /Institutional Anonymity/g,
        replacement: 'system privacy'
    },
    {
        pattern: /SOBERANO/g,
        replacement: 'LOCAL'
    },
    {
        pattern: /soberanía total/g,
        replacement: 'modo local'
    }
];

function walk(dir, callback) {
    if (!fs.existsSync(dir)) {
        console.warn(`Directory not found: ${dir}`);
        return;
    }
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f).replace(/\\/g, '/');
        
        let stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
            if (EXCLUDE_DIRS.includes(f)) return;
            walk(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

console.log(`Current Working Directory: ${process.cwd()}`);
console.log('Starting terminological purge...');

let filesProcessed = 0;
let replacementsMade = 0;

ROOT_DIRS.forEach(root => {
    console.log(`Scanning root: ${root}`);
    if (!fs.existsSync(root)) {
        console.warn(`Root not found: ${root}`);
        return;
    }
    walk(root, (filePath) => {
        const ext = path.extname(filePath);
        console.log(`Processing: ${filePath} (${ext})`);
        if (!['.ts', '.js', '.md', '.json', '.py', '.txt'].includes(ext)) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        REPLACEMENTS.forEach(r => {
            const nextContent = content.replace(r.pattern, r.replacement);
            if (nextContent !== content) {
                console.log(`  Match found for ${r.pattern} in ${filePath}`);
                content = nextContent;
                modified = true;
                replacementsMade++;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            // console.log(`Updated: ${filePath}`);
        }
        filesProcessed++;
    });
});

console.log(`Purge complete.`);
console.log(`Files scanned: ${filesProcessed}`);
console.log(`Total pattern matches replaced: ${replacementsMade}`);
