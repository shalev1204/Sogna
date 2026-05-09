import fs from 'fs';

const path = 'c:/Users/carle/Desktop/Sogna/Sogna/Curator/shared/PredatoreVault.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/AuditVault/g, 'PredatoreVault');
content = content.replace(/AuditEvent/g, 'PredatoreEvent');
content = content.replace(/AUDIT-VAULT/g, 'PREDATORE-VAULT');

fs.writeFileSync(path, content, 'utf8');
console.log('Updated PredatoreVault.ts successfully');
