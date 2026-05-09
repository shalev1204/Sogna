import { Color } from '@Sogna/Curator';
import { MemoryHub } from './MemoryHub.js';
import { Chronicler } from './Chronicler.js';


/**
 * Sogna system Graft - The Connector
 * Ensures new skills/agents are born with synapses to the core.
 */
export class systemGraft {
 private static instance: systemGraft;
 private hub: MemoryHub;

 private constructor() {
 this.hub = MemoryHub.getInstance();
 }

 public static getInstance(): systemGraft {
 if (!systemGraft.instance) {
 systemGraft.instance = new systemGraft();
 }
 return systemGraft.instance;
 }

 /**
 * Grafts a new component into the processor.
 * @param componentId The name/key of the component (e.g. 'new-skill')
 * @param description Brief description to create fuzzy links
 * @param swarm The swarm it belongs to
 */
 public async graft(componentId: string, description: string, swarm: string): Promise<void> {
 console.log(Color.blue(`🧠 [system_GRAFT] Iniciando injerto para: ${componentId}...`));
 
 const content = `
# ${componentId}
Este componente ha sido injertado mente en el Agentes [[${swarm}]].

## Descripción
${description}

## Conexiones Iniciales
- Relacionado con: [[Sogna]], [[orchestrator]], [[Sentinel]]
- Agentes: [[${swarm}]]
 `;

 await this.hub.storeInsight(componentId, content, [swarm.toLowerCase(), 'grafted']);
 
 console.log(Color.green(`✅ [system_GRAFT] Componente '${componentId}' ahora es parte de la conciencia colectiva.`));
 
 // Trigger a rebuild to activate connections
 await Chronicler.getInstance().rebuildIndex();
 }
}
