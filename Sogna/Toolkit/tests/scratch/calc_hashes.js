const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = 'c:\\Users\\carle\\Desktop\\Sogna';
const files = [
    'Sogna/Sognatore/src/bin/sognatore.ts',
    'Sogna/Sognatore/src/core/agents/AgentFactory.ts',
    'Sogna/Sognatore/src/core/DockerSandbox.ts',
    'Sogna/Sognatore/src/Sentinel-Sognatore/Hub.ts',
    'Sogna/Sognatore/src/core/Guardian.ts'
];

files.forEach(f => {
    const fullPath = path.join(root, f);
    if (!fs.existsSync(fullPath)) {
        console.log(`[MISSING] ${f}`);
        return;
    }
    const content = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    console.log(`${f}: ${hash}`);
});
