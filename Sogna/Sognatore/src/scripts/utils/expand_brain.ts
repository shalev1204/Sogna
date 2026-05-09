import { Color } from '@Sogna/Curator';
import { MemoryHub } from '../../core/memory/MemoryHub.js';
import { Chronicler } from '../../core/memory/Chronicler.js';


async function expandConsciousness() {
 console.log(Color.bold.magenta('\n🌀 INICIANDO EXPANSIÓN DE CONCIENCIA ...\n'));
 
 const hub = MemoryHub.getInstance();
 const chronicler = Chronicler.getInstance();
 
 console.log(Color.cyan('Reconstruyendo índice masivo (Sognatore + Toolkit + Engines + Root)...'));
 await chronicler.rebuildIndex();
 
 const graph = await hub.getsystemGraph();
 const health = await hub.checkHealth();
 
 console.log(Color.bold.green('\n📊 RESULTADOS DE LA EXPANSIÓN:'));
 console.log(`- Nodos Totales: ${Color.bold(graph.nodes.length)}`);
 console.log(`- Conexiones Totales: ${Color.bold(graph.edges.length)}`);
 
 const predatorNodes = graph.nodes.filter(n => n.id.toLowerCase().includes('Predatore') || n.id.toLowerCase().includes('predator'));
 const sentinelNodes = graph.nodes.filter(n => n.id.toLowerCase().includes('Sentinel'));
 
 console.log(`- Nodos de Predator detectados: ${predatorNodes.length}`);
 console.log(`- Nodos de Sentinel detectados: ${sentinelNodes.length}`);

 const swarms = ['Skills', 'Agents', 'Engines', 'Security', 'Offensive', 'Monitor', 'Core', 'Orchestration', 'Business', 'Engineering', 'Data', 'Product'];

 console.log(Color.bold('\n🌍 DESGLOSE POR Agentes:'));
 swarms.forEach(s => {
 const count = graph.nodes.filter(n => n.swarm === s || n.id === s).length;
 const connections = graph.edges.filter(e => e.source === s || e.target === s).length;
 console.log(` - ${Color.yellow(s.padEnd(13))}: ${Color.bold(count.toString().padStart(4))} nodos, ${Color.bold(connections.toString().padStart(5))} conexiones`);
 });


 if (health.status === 'healthy') {

 console.log(Color.bold.blue('\n✅ LA RED NEURONAL ESTÁ EN RESONANCIA TOTAL.'));
 } else {
 console.log(Color.bold.yellow('\n⚠️ RED EN CRECIMIENTO:'), health.recommendations);
 }
}

expandConsciousness().catch(console.error);
