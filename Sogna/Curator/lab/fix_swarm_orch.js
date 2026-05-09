import fs from 'fs';
const path = 'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src/core/SwarmOrchestrator.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/swarmOrchestrator/g, 'SwarmOrchestrator');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed SwarmOrchestrator.ts');
