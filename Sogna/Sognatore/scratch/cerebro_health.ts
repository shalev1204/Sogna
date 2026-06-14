import { Color } from '@Sogna/Curator';
import { memoryhub } from "../src/core/memory/MemoryHub.js";


async function auditcerebro() {
    const cerebro = memoryhub.getInstance();
    const graph = await cerebro.getneuralgraph();
    const index = await cerebro.query({});
    
    console.log(Color.bold.blue('\n🧠 [AUDITORÍA del cerebro de Sogna]'));
    console.log(`- nodos totales: ${graph.nodes.length}`);
    console.log(`- conexiones totales: ${graph.edges.length}`);
    
    // 1. Detección de enlaces rotos (dead links)
    const nodeids = new Set(graph.nodes.map(n => n.id));
    const deadlinks = graph.edges.filter(e => !nodeids.has(e.target));
    
    console.log(`- enlaces rotos detectados: ${deadlinks.length}`);
    if (deadlinks.length > 0) {
        console.log(Color.yellow('  ⚠️  sugerencia: limpiar referencias a nodos inexistentes.'));
    }

    // 2. Análisis de densidad de swarm
    const swarms: Record< string, number> = {};
    graph.nodes.forEach(n => {
        const s = n.tags?.includes('swarm') ? n.id : 'other';
        if (n.tags?.includes('swarm')) swarms[s] = (swarms[s] || 0) + 1;
    });
    
    console.log('\n📊 [densidad por enjambre]');
    Object.entries(swarms).forEach(([s, count]) => {
        const connections = graph.edges.filter(e => e.source === s || e.target === s).length;
        console.log(`- ${s}: ${count} nodos, ${connections} conexiones`);
    });

    // 3. Adquisición de contexto Crítico (para el asistente)
    console.log(Color.bold.green('\n💡 [ADQUISICIÓN de conocimiento CRÍTICO]'));
    const topconcepts = graph.nodes
        .sort((a, b) => {
            const aconn = graph.edges.filter(e => e.source === a.id || e.target === a.id).length;
            const bconn = graph.edges.filter(e => e.source === b.id || e.target === b.id).length;
            return bconn - aconn;
        })
        .slice(0, 10);

    console.log('top 10 conceptos centrales del cerebro:');
    topconcepts.forEach(c => {
        const conncount = graph.edges.filter(e => e.source === c.id || e.target === c.id).length;
        console.log(`  - ${c.id} (${conncount} conexiones)`);
    });
}

auditcerebro().catch(console.error);
