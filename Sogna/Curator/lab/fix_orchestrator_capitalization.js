import fs from 'fs';

const filesToFix = [
  'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src/core/SwarmOrchestrator.ts',
  'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src/core/utils/SwarmOrchestrator.ts',
  'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src/scripts/utils/institutional_verify.ts',
  'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src/core/Runner.ts'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/class swarmOrchestrator/g, 'class SwarmOrchestrator');
    content = content.replace(/import { swarmOrchestrator }/g, 'import { SwarmOrchestrator }');
    content = content.replace(/swarmOrchestrator\.getInstance/g, 'SwarmOrchestrator.getInstance');
    content = content.replace(/private instance: swarmOrchestrator/g, 'private static instance: SwarmOrchestrator');
    content = content.replace(/new swarmOrchestrator/g, 'new SwarmOrchestrator');
    content = content.replace(/: swarmOrchestrator/g, ': SwarmOrchestrator');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed capitalization in: ${file}`);
  }
});

// Rename the duplicate to avoid conflict if they are in the same scope or causing confusion
// Actually, they are in different directories, so it's fine for now as long as imports are correct.
// But Sognatore/src/scripts/utils/institutional_verify.ts imports from ../../core/SwarmOrchestrator.js
