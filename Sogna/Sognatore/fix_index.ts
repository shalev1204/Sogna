import { Chronicler } from './src/core/memory/Chronicler.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

async function fix() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const root = path.resolve(__dirname, '..');
    const chronicler = Chronicler.getInstance(root);
    console.log('Rebuilding index...');
    await chronicler.init();
    await chronicler.rebuildIndex();
    console.log('Index rebuilt successfully.');
}

fix().catch(console.error);
