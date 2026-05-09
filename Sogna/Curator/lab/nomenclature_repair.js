import fs from 'fs';
import path from 'path';

const rootDir = 'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/src';

const replacements = [
  { regex: /agent_groupBase/g, replacement: 'SwarmBase' },
  { regex: /agent_group/g, replacement: 'swarm' },
  { regex: /agent_groups/g, replacement: 'swarms' },
  { regex: /MessageHub/g, replacement: 'NeuralRelay' },
  { regex: /GlobalMemory/g, replacement: 'GlobalMemory' }, // already correct but just in case
  { regex: /CorporateBroadcaster/g, replacement: 'SognaBroadcaster' },
  { regex: /Operational Cycle/g, replacement: 'RARV Cycle' },
  { regex: /Objective/g, replacement: 'Dream' },
  { regex: /Sueño empresarial/g, replacement: 'Objetivo empresarial' }, // reverse fix
  { regex: /Auditor/g, replacement: 'Predatore' },
  { regex: /Validator/g, replacement: 'Sentinel' },
  { regex: /agent_groupOrchestrator/g, replacement: 'SwarmOrchestrator' }
];

const importFixes = [
  { from: /import { NeuralRelay.* } from '.*MessageHub\.js'/g, to: (match) => match.replace(/from '.*MessageHub\.js'/, "from '../brain/NeuralRelay.js'") },
  { from: /import { GlobalMemory } from '.*GlobalMemory\.js'/g, to: (match) => match.replace(/from '.*GlobalMemory\.js'/, "from '../brain/GlobalMemory.js'") },
  { from: /import { SognaCommBus } from '.*CorporateBroadcaster\.js'/g, to: (match) => match.replace(/from '.*CorporateBroadcaster\.js'/, "from '../brain/SognaBroadcaster.js'") }
];

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      replacements.forEach(({ regex, replacement }) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      });

      // Special case for imports
      if (content.includes('../processor/')) {
        content = content.replace(/\.\.\/processor\//g, '../brain/');
        changed = true;
      }
      if (content.includes('../../core/agent_groups/')) {
        content = content.replace(/\.\.\/\.\.\/core\/agent_groups\//g, '../../core/swarms/');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Repaired nomenclature in: ${fullPath}`);
      }
    }
  }
};

walk(rootDir);
console.log('Nomenclature Repair Complete');
