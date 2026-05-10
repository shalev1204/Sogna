import * as fs from 'node:fs';
import * as path from 'node:path';
import { Color } from '@Sogna/Curator';

const ROOT_INTEL = 'C:/Users/carle/Desktop/Sogna/Sogna/memory/intelligence';

const SWARM_MAP: Record<string, string> = {
    'business': 'Business',
    'security': 'Security',
    'semantic': 'Core',
    'episodic': 'Agents',
    'technical': 'Engineering',
    'offensive': 'Offensive',
    'monitor': 'Monitor',
    'orchestration': 'Orchestration'
};

async function auditAndConnect() {
    console.log(Color.bold.blue('🔍 INICIANDO AUDITORÍA DE SWARMS PARA AGENTES HUÉRFANOS...'));
    
    const files = getAllFiles(ROOT_INTEL).filter(f => f.endsWith('.md'));
    let updatedCount = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(ROOT_INTEL, file);
        const firstDir = relativePath.split(path.sep)[0];
        
        const targetSwarm = SWARM_MAP[firstDir.toLowerCase()] || 'Core';
        
        if (content.startsWith('---')) {
            const endHeader = content.indexOf('---', 3);
            if (endHeader !== -1) {
                const header = content.substring(3, endHeader);
                const body = content.substring(endHeader + 3);
                
                if (!header.includes('swarm:')) {
                    const newHeader = header.trim() + `\nswarm: ${targetSwarm}\n`;
                    fs.writeFileSync(file, `---\n${newHeader}---\n${body}`);
                    console.log(Color.green(`✅ Conectado: ${path.basename(file)} -> Swarm: ${targetSwarm}`));
                    updatedCount++;
                } else {
                    // Check if it's the correct swarm
                    const match = header.match(/swarm:\s*(\w+)/);
                    if (match && match[1] !== targetSwarm && match[1] === 'Core' && targetSwarm !== 'Core') {
                        const newHeader = header.replace(/swarm:\s*\w+/, `swarm: ${targetSwarm}`);
                        fs.writeFileSync(file, `---\n${newHeader}---\n${body}`);
                        console.log(Color.yellow(`🔄 Reubicado: ${path.basename(file)} -> Swarm: ${targetSwarm}`));
                        updatedCount++;
                    }
                }
            }
        } else {
            // No frontmatter, create one
            const newContent = `---\nswarm: ${targetSwarm}\nproject: Sogna\n---\n\n${content}`;
            fs.writeFileSync(file, newContent);
            console.log(Color.cyan(`🆕 Inicializado: ${path.basename(file)} -> Swarm: ${targetSwarm}`));
            updatedCount++;
        }
    }

    console.log(Color.bold.green(`\n✨ AUDITORÍA COMPLETADA. ${updatedCount} AGENTES SINCRONIZADOS.\n`));
}

function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file: string) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

auditAndConnect().catch(console.error);
