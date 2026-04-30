import { MemoryHub } from './src/core/memory/MemoryHub.js';
import { Chronicler } from './src/core/memory/Chronicler.js';
import chalk from 'chalk';

async function expandConsciousness() {
  console.log(chalk.bold.magenta('\n🌀 INICIANDO EXPANSIÓN DE CONCIENCIA APEX...\n'));
  
  const hub = MemoryHub.getInstance();
  const chronicler = Chronicler.getInstance();
  
  console.log(chalk.cyan('Reconstruyendo índice masivo (Sognatore + Toolkit + Engines + Root)...'));
  await chronicler.rebuildIndex();
  
  const graph = await hub.getNeuralGraph();
  const health = await hub.checkHealth();
  
  console.log(chalk.bold.green('\n📊 RESULTADOS DE LA EXPANSIÓN:'));
  console.log(`- Nodos Totales: ${chalk.bold(graph.nodes.length)}`);
  console.log(`- Conexiones Totales: ${chalk.bold(graph.edges.length)}`);
  
  const predatorNodes = graph.nodes.filter(n => n.id.toLowerCase().includes('predatore') || n.id.toLowerCase().includes('predator'));
  const sentinelNodes = graph.nodes.filter(n => n.id.toLowerCase().includes('sentinel'));
  
  console.log(`- Nodos de Predator detectados: ${predatorNodes.length}`);
  console.log(`- Nodos de Sentinel detectados: ${sentinelNodes.length}`);

  const swarms = ['Skills', 'Agents', 'Engines', 'Security', 'Offensive', 'Monitor', 'Core', 'Orchestration', 'Business', 'Engineering', 'Data', 'Product'];

  console.log(chalk.bold('\n🌍 DESGLOSE POR ENJAMBRE:'));
  swarms.forEach(s => {
    const count = graph.nodes.filter(n => n.swarm === s || n.id === s).length;
    const connections = graph.edges.filter(e => e.source === s || e.target === s).length;
    console.log(`  - ${chalk.yellow(s.padEnd(13))}: ${chalk.bold(count.toString().padStart(4))} nodos, ${chalk.bold(connections.toString().padStart(5))} conexiones`);
  });


  if (health.status === 'healthy') {

    console.log(chalk.bold.blue('\n✅ LA RED NEURONAL ESTÁ EN RESONANCIA TOTAL.'));
  } else {
    console.log(chalk.bold.yellow('\n⚠️ RED EN CRECIMIENTO:'), health.recommendations);
  }
}

expandConsciousness().catch(console.error);
