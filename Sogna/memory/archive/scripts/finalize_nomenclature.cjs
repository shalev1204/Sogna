const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\carle\\Desktop\\Sogna\\Sogna';

const replacements = [
    { old: /System Security/g, new: 'System Security' },
    { old: /System Feed/g, new: 'System Feed' },
    { old: /System Veto/g, new: 'System Veto' },
    { old: /SwarmBridge/g, new: 'SwarmBridge' },
    { old: /SwarmService/g, new: 'SwarmService' },
    { old: /SwarmOrchestrator/g, new: 'SwarmOrchestrator' },
    { old: /modo local/g, new: 'modo local' }
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                walk(fullPath);
            }
        } else {
const ext = path.extname(fullPath);
            if (['.ts', '.js', '.json', '.md', '.rs', '.cjs'].includes(ext)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let changed = false;
                for (const r of replacements) {
                    if (r.old.test(content)) {
                        content = content.replace(r.old, r.new);
                        changed = true;
                    }
                }
                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Updated: ${fullPath}`);
                }
            }
        }
    }
}

console.log('Starting final nomenclature purge...');
walk(rootDir);
console.log('Final purge complete.');
