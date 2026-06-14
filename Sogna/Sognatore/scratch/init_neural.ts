import { chronicler } from "../src/core/memory/Chronicler.js";
import * as path from 'path';

async function main() {
  const chronicler = chronicler.getInstance('.');
  
  // clear and update with correct relative paths
  (chronicler as any).sources = [];
  chronicler.addsource(path.resolve('Memory/intelligence'));
  chronicler.addsource(path.resolve('../toolkit/agents'));
  chronicler.addsource(path.resolve('../toolkit/skills'));
  
  console.log('forcing Memory index rebuild with correct paths...');
  await chronicler.rebuildindex();
  console.log('Memory index rebuilt successfully.');
}

main().catch(console.error);
