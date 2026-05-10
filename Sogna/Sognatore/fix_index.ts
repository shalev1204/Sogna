import { Chronicler } from './src/core/memory/Chronicler.js';
import * as path from 'node:path';

async function fix() {
    const root = 'C:/Users/carle/Desktop/Sogna/Sogna';
    const chronicler = Chronicler.getInstance(root);
    console.log('Rebuilding index...');
    await chronicler.init();
    await chronicler.rebuildIndex();
    console.log('Index rebuilt successfully.');
}

fix().catch(console.error);
