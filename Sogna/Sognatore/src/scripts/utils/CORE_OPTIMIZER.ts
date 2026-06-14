import { Color, FS as fs } from '@Sogna/Curator';
import { MemoryHub } from '../../core/memory/MemoryHub.js';
import { Chronicler } from '../../core/memory/Chronicler.js';

import path from 'path';

import crypto from 'crypto';


async function performDeepAudit() {
 console.log(Color.bold.blue('\n🔍 INICIANDO DIAGNÓSTICO DE OPTIMIZACIÓN ...\n'));

 const hub = MemoryHub.getInstance();
 const chronicler = Chronicler.getInstance();
 
 console.log(Color.cyan('Reconstruyendo índice para diagnóstico fresco...'));
 await chronicler.rebuildIndex();
 
 const index = await chronicler.getIndex();

 const graph = await hub.getsystemGraph();

 // 1. ANÁLISIS DE EFICIENCIA DE MEMORIA
 console.log(Color.yellow('--- [CAPA 1: EFICIENCIA DE MEMORIA] ---'));
 const indexSizeKB = (await fs.stat(chronicler.getIndexFile())).size / 1024;
 console.log(`- Tamaño del Índice: ${indexSizeKB.toFixed(2)} KB`);
 
 const startGraph = Date.now();
 await hub.getsystemGraph();
 const graphTime = Date.now() - startGraph;
 console.log(`- Latencia de Generación del Grafo: ${graphTime}ms ${graphTime > 500 ? Color.red('(BOTELLA)') : Color.green('(ÓPTIMO)')}`);

 // 2. DETECCIÓN DE SILOS (Nodos Aislados)
 console.log(Color.yellow('\n--- [CAPA 2: COHESIÓN Y CONEXIONES] ---'));
 const silos = graph.nodes.filter(n => {
 const connections = graph.edges.filter(e => e.source === n.id || e.target === n.id).length;
 return connections <= 1; // 1 because it's connected to its swarm anchor
 });
 console.log(`- Nodos Silo (Aislados): ${silos.length} (${((silos.length / graph.nodes.length) * 100).toFixed(2)}%)`);
 if (silos.length > 100) console.log(Color.red(' ⚠ Recomendación: Ejecutar injerto masivo en los Agents Security/Offensive.'));

 // 3. OPTIMIZACIÓN DE TOKENS (Carga de Contexto)
 console.log(Color.yellow('\n--- [CAPA 3: OPTIMIZACIÓN DE TOKENS] ---'));
 const fragmentsWithContent = index.fragments;
 let totalLength = 0;
 let maxFragment = { key: '', length: 0 };
 
 fragmentsWithContent.forEach(f => {
 const len = f.key.length + (f.tags || []).join('').length + (JSON.stringify(f.properties || {})).length;
 totalLength += len;
 if (len > maxFragment.length) maxFragment = { key: f.key, length: len };
 });

 const avgMetadataSize = totalLength / fragmentsWithContent.length;
 console.log(`- Tamaño promedio de Metadatos por Fragmento: ${avgMetadataSize.toFixed(0)} caracteres`);
 console.log(`- Fragmento más pesado (Metadatos): ${maxFragment.key} (${maxFragment.length} caracteres)`);
 if (avgMetadataSize > 500) console.log(Color.yellow(' ⚠ Recomendación: Simplificar propiedades YAML redundantes para ahorrar tokens de contexto.'));

 // 4. SEGURIDAD Y COBERTURA (Sentinel)
 console.log(Color.yellow('\n--- [CAPA 4: SEGURIDAD Y COBERTURA] ---'));
 const signaturesPath = path.resolve('..', 'Sentinel', 'data', 'signatures.json');
 if (await fs.pathExists(signaturesPath)) {
 const signatures = await fs.readJson(signaturesPath);
 const signedFiles = Object.keys(signatures).length;
 console.log(`- Archivos Firmados por Sentinel: ${signedFiles}`);
 // Check if critical core files are signed
 const criticalFiles = ['Sognatore/src/core/memory/MemoryHub.ts', 'Sognatore/src/core/memory/Chronicler.ts', 'toolkit/bin/Sogna.js'];
 const corrupted = [];

 for (const relPath of criticalFiles) {
 const sigKey = relPath.replace(/\\/g, '/');
 const possibleKeys = [sigKey, sigKey.replace('Sognatore/', 'Sogna/Sognatore/')];
 let sig = null;
 
 // Pick the most recent signature if multiple exist
 for (const key of possibleKeys) {
 if (signatures[key]) {
 if (!sig || new Date(signatures[key].timestamp) > new Date(sig.timestamp)) {
 sig = signatures[key];
 }
 }
 }
 
 if (!sig) {
 corrupted.push(`${relPath} (SIN FIRMA)`);
 continue;
 }


 const absPath = path.join(process.cwd(), relPath.replace('Sognatore/', ''));
 if (fs.existsSync(absPath)) {
 const content = fs.readFileSync(absPath);
 const currentHash = crypto.createHash('sha256').update(content).digest('hex');
 if (currentHash !== sig.hash) {
 corrupted.push(`${relPath} (HASH CORRUPTO)`);
 }
 }
 }

 if (corrupted.length > 0) {
 console.log(Color.red(` ❌ ALERTA: Integridad COMPROMETIDA: ${corrupted.join(', ')}`));
 } else {
 console.log(Color.green(' ✅ Integridad crítica asegurada.'));
 }

 }

 console.log(Color.bold.blue('\n✨ DIAGNÓSTICO DE OPTIMIZACIÓN FINALIZADO.\n'));
}

performDeepAudit().catch(console.error);
