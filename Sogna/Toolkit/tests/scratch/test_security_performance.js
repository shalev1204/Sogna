const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// Simulate SecurityHub.validateSignature
const SIGNATURES_PATH = path.resolve(process.cwd(), 'Sogna/Toolkit/engines/sentinel/data/signatures.json');
const TARGET_FILE = path.resolve(process.cwd(), 'Sogna/Sognatore/src/core/Guardian.ts');

function validateSignatureManual() {
    if (!fs.existsSync(SIGNATURES_PATH)) return false;
    // THE BOTTLENECK: Reading the whole JSON every time
    const signatures = fs.readJsonSync(SIGNATURES_PATH);
    const relativePath = 'Sogna/Sognatore/src/core/Guardian.ts';
    
    const sig = signatures[relativePath];
    if (!sig) return false;

    const content = fs.readFileSync(TARGET_FILE);
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    return sig.hash === currentHash;
}

console.log('Testing 100 consecutive validations...');
const start = Date.now();
for (let i = 0; i < 100; i++) {
    validateSignatureManual();
}
const end = Date.now();
console.log(`Total time for 100 validations: ${end - start}ms`);
console.log(`Average time per validation: ${(end - start) / 100}ms`);
