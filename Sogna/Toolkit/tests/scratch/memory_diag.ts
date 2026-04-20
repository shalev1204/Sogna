import { MemoryHub } from '../../../Sognatore/src/core/memory/MemoryHub.js';
import { Chronicler } from '../../../Sognatore/src/core/memory/Chronicler.js';
import * as fs from 'fs';
import * as path from 'path';

async function diagnose() {
  console.log('--- SOGNA MEMORY DIAGNOSTIC (APEX) ---');
  
  const hub = MemoryHub.getInstance();
  const chronicler = Chronicler.getInstance();

  // Test 1: Chronicler Indexing
  console.log('[TEST 1] Chronicler Index Persistence...');
  await chronicler.memorize({
    key: 'id_diag_session',
    content: 'This is a diagnostic fragment.',
    tags: ['#diag'],
    project: 'Sogna'
  });
  const indexPath = path.join(process.cwd(), 'Sognatore', '.sognatore', 'intelligence', 'index.json');
  if (fs.existsSync(indexPath)) {
    console.log('  -> PASS: index.json detected.');
  } else {
    console.log('  -> FAIL: index.json missing.');
  }

  // Test 2: Unified Recall
  console.log('[TEST 2] Unified Recall (Identity + Episodic)...');
  const memories = await hub.unifiedRecall('Identity'); // Should hit rules.md
  const identityHit = memories.some(m => m.source === 'identity');
  if (identityHit) {
    console.log('  -> PASS: MemoryHub linked to Identity layer.');
  } else {
    console.log('  -> FAIL: MemoryHub could not reach rules.md.');
  }

  console.log('--------------------------------------');
}

diagnose().catch(console.error);
