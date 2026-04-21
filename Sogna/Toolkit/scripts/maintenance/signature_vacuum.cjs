const fs = require('fs');
const path = require('path');

const SIGNATURE_FILE = path.join(__dirname, '../toolkit/engines/Sentinel/data/signatures.json');
const ROOT_DIR = path.join(__dirname, '../');

async function vacuum() {
    console.log(`[VACUUM] Loading signatures from ${SIGNATURE_FILE}...`);
    if (!fs.existsSync(SIGNATURE_FILE)) {
        console.error("[VACUUM] Error: File not found.");
        return;
    }

    const signatures = JSON.parse(fs.readFileSync(SIGNATURE_FILE, 'utf-8'));
    const initialCount = Object.keys(signatures).length;
    console.log(`[VACUUM] Initial signatures: ${initialCount}`);

    const cleaned = {};
    let removedCount = 0;

    for (const [filePath, data] of Object.entries(signatures)) {
        // Resolve path relative to repository root
        // Note: Signatures often have 'Sogna/' prefix or are absolute. 
        // We need to handle both.
        let absolutePath = path.resolve(ROOT_DIR, filePath);
        
        // If it starts with Sogna/ and Sogna/ is a dir inside ROOT_DIR
        if (!fs.existsSync(absolutePath)) {
            // Try removing the first segment if it's 'Sogna'
            const parts = filePath.split('/');
            if (parts[0] === 'Sogna') {
                absolutePath = path.resolve(ROOT_DIR, parts.slice(1).join('/'));
            }
        }

        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
            cleaned[filePath] = data;
        } else {
            removedCount++;
        }
    }

    console.log(`[VACUUM] Removed ${removedCount} stale signatures.`);
    console.log(`[VACUUM] Final count: ${Object.keys(cleaned).length}`);

    fs.writeFileSync(SIGNATURE_FILE, JSON.stringify(cleaned, null, 2));
    console.log("[VACUUM] Optimization complete.");
}

vacuum().catch(console.error);
