const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = 'c:\\Users\\carle\\Desktop\\Sogna';
const sigPath = path.join(root, 'Sogna', 'toolkit', 'engines', 'Sentinel', 'data', 'signatures.json');
const signatures = JSON.parse(fs.readFileSync(sigPath, 'utf-8'));

const timestamp = new Date().toISOString();
const signedBy = 'Antigravity-Restoration-Final';

const filesToHash = [
    'Sogna/Sognatore/src/bin/sognatore.ts',
    'Sogna/Sognatore/src/core/agents/AgentFactory.ts',
    'Sogna/Sognatore/src/core/DockerSandbox.ts',
    'Sogna/Sognatore/src/Sentinel-Sognatore/Hub.ts',
    'Sogna/Sognatore/src/core/Guardian.ts',
    'Sogna/toolkit/engines/Sentinel/bin/sentinel-veto.js'
];

const fileHashes = {};

filesToHash.forEach(f => {
    const fullPath = path.join(root, f);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        fileHashes[f] = hash;
        
        // Also map to unprefixed version for the Hub
        const unprefixed = f.replace(/^Sogna\//i, '');
        fileHashes[unprefixed] = hash;

        // Also handle Toolkit/toolkit case variation seen in signatures.json
        if (unprefixed.includes('toolkit')) {
           fileHashes[unprefixed.replace('toolkit', 'Toolkit')] = hash;
        }
        if (unprefixed.includes('sentinel')) {
           fileHashes[unprefixed.replace('sentinel', 'Sentinel')] = hash;
        }
    }
});

console.log('Calculating updates...');
let updatedCount = 0;
let newCount = 0;

for (const [key, hash] of Object.entries(fileHashes)) {
    if (signatures[key]) {
        if (signatures[key].hash !== hash) {
            signatures[key].hash = hash;
            signatures[key].timestamp = timestamp;
            signatures[key].signedBy = signedBy;
            updatedCount++;
        }
    } else {
        signatures[key] = {
            hash: hash,
            timestamp: timestamp,
            signedBy: signedBy
        };
        newCount++;
    }
}

// Special case: Ensure the EXACT keys requested by Hub are present
// Hub uses path.relative(process.cwd(), absPath)
// If cwd is Sogna/Sogna, and absPath is Sogna/Sogna/Sognatore/src/...
// Then key is Sognatore/src/...
const finalKeys = Object.keys(fileHashes);
console.log(`Ensuring ${finalKeys.length} potential keys are in signature database.`);

fs.writeFileSync(sigPath, JSON.stringify(signatures, null, 2));
console.log(`✅ Result: ${updatedCount} updated, ${newCount} new entries.`);
