const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simulate Hub.ts logic
class MockHub {
    constructor() {
        this.sognatoreRoot = 'c:\\Users\\carle\\Desktop\\Sogna\\Sogna\\Sognatore';
        const toolkitRoot = path.join(this.sognatoreRoot, '..', 'toolkit');
        this.SIGNATURES_PATH = path.join(toolkitRoot, 'engines', 'Sentinel', 'data', 'signatures.json');
        this.signaturesCache = JSON.parse(fs.readFileSync(this.SIGNATURES_PATH, 'utf8'));
        this.cwd = 'c:\\Users\\carle\\Desktop\\Sogna\\Sogna';
    }

    validateSignature(filePath) {
        const absPath = path.resolve(filePath);
        const relativePath = path.relative(this.cwd, absPath).replace(/\\/g, '/');
        
        console.log(`Checking path: ${filePath}`);
        console.log(`Resolved Absolute: ${absPath}`);
        console.log(`Relative Key: ${relativePath}`);
        
        const sig = this.signaturesCache[relativePath];
        if (!sig) {
            console.log(`❌ Key NOT found in signatures.json: "${relativePath}"`);
            // Check for similar keys
            const similar = Object.keys(this.signaturesCache).filter(k => k.includes(path.basename(filePath)));
            if (similar.length > 0) {
                console.log(`Similar keys found: ${similar.join(', ')}`);
            }
            return false;
        }

        const content = fs.readFileSync(absPath);
        const currentHash = crypto.createHash('sha256').update(content).digest('hex');
        
        console.log(`Stored Hash:  ${sig.hash}`);
        console.log(`Current Hash: ${currentHash}`);

        return sig.hash === currentHash;
    }
}

const hub = new MockHub();
const sognatoreRoot = hub.sognatoreRoot;
const toolkitRoot = path.join(sognatoreRoot, '..', 'toolkit');

const criticalFiles = [
    path.join(sognatoreRoot, 'src', 'core', 'Guardian.ts'),
    path.join(toolkitRoot, 'engines', 'Sentinel', 'bin', 'sentinel-veto.js')
];

criticalFiles.forEach(f => {
    const result = hub.validateSignature(f);
    console.log(`Result for ${path.basename(f)}: ${result ? '✅' : '❌'}`);
    console.log('---');
});
