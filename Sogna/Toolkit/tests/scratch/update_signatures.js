const fs = require('fs');
const path = require('path');

const sigPath = 'c:\\Users\\carle\\Desktop\\Sogna\\Sogna\\toolkit\\engines\\Sentinel\\data\\signatures.json';
const signatures = JSON.parse(fs.readFileSync(sigPath, 'utf-8'));

const timestamp = new Date().toISOString();
const signedBy = 'Antigravity-Restoration';

const updates = {
    'Sogna/Sognatore/src/bin/sognatore.ts': '53c7f27c58f28484989d8d7d965fb194f6d45849c6a61005ec079bfa6ec60f3d',
    'Sogna/Sognatore/src/core/agents/AgentFactory.ts': '968516d3dfb0e221c1a8adf8692d1c33c72ba6ad71d7c7d0a1655627c15206a0',
    'Sogna/Sognatore/src/core/DockerSandbox.ts': '1a82440ed202431eee59e712bc0f83a96812ed5f20ea4bb026902e9eb7998a70',
    'Sogna/Sognatore/src/Sentinel-Sognatore/Hub.ts': '1ce288f0278ccd615cdb7aa79fe8854a9fc6e3577e410d8756868e5ae3bbf69c',
    'Sogna/Sognatore/src/core/Guardian.ts': '83ad184c487862af8f13ae1022ac743575e34cf17a83d4ac67a2726a02217e7d'
};

for (const [file, hash] of Object.entries(updates)) {
    if (signatures[file]) {
        console.log(`[UPDATING] ${file}`);
        signatures[file] = {
            hash: hash,
            timestamp: timestamp,
            signedBy: signedBy
        };
    } else {
        console.log(`[NEW_ENTRY] ${file}`);
        signatures[file] = {
            hash: hash,
            timestamp: timestamp,
            signedBy: signedBy
        };
    }
}

fs.writeFileSync(sigPath, JSON.stringify(signatures, null, 2));
console.log('✅ Signatures updated successfully.');
