import { Hub } from '../Sogna/Sognatore/dist/Sognatore/src/Sentinel-Sognatore/Hub.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const hub = Hub.getInstance();
console.log(`Hub state: ${hub.getState()}`);
const sognatoreRoot = hub.getSognatoreRoot();
const toolkitRoot = path.join(sognatoreRoot, '..', 'toolkit');

const criticalFiles = [
    path.join(sognatoreRoot, 'src', 'core', 'Guardian.ts'),
    path.join(toolkitRoot, 'engines', 'Sentinel', 'bin', 'sentinel-veto.js')
];

console.log(`Hub sognatoreRoot: ${hub.getSognatoreRoot()}`);
console.log(`Hub SIGNATURES_PATH: ${hub.SIGNATURES_PATH}`);
const keys = Object.keys(hub.signaturesCache);
console.log(`Cache has ${keys.length} keys.`);
console.log(`Guardian key in cache? ${keys.includes('Sognatore/src/core/Guardian.ts')}`);
console.log(`Veto key in cache? ${keys.includes('toolkit/engines/Sentinel/bin/sentinel-veto.js')}`);

for (const file of criticalFiles) {
    console.log(`Checking file: ${file}`);
    const absPath = path.resolve(file);
    const relPath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
    const sig = hub.signaturesCache[relPath];
    const content = fs.readFileSync(absPath);
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    console.log(`Relative Path: ${relPath}`);
    console.log(`Stored Hash:  "${sig ? sig.hash : 'MISSING'}" (Type: ${typeof (sig ? sig.hash : '')}, Length: ${sig ? sig.hash.length : 0})`);
    console.log(`Current Hash: "${currentHash}" (Type: ${typeof currentHash}, Length: ${currentHash.length})`);
    console.log(`Strict Equality: ${sig.hash === currentHash}`);
    
    const result = hub.validateSignature(file);
    console.log(`Result: ${result}`);
}
