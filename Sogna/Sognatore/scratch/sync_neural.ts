import { memoryhub } from "../src/core/memory/MemoryHub.js";

async function sync() {
    const Memory = memoryhub.getInstance();
    console.log('--- [semantic recall: Sogna core concepts] ---');
    const terms = ['Sogna', 'orchestrator', 'Sentinel'];
    for (const term of terms) {
        const results = await Memory.semanticrecall(term);
        console.log(`\n🔍 term: ${term}`);
        results.slice(0, 2).forEach((r: any, i: number) => {
            console.log(`  [${i+1}] ${r.key}: ${r.content.substring(0, 100)}...`);
        });
    }
}

sync().catch(console.error);
