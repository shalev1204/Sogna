import { MemoryHub } from './MemoryHub.js';
import { Chronicler } from './Chronicler.js';
import chalk from 'chalk';

/**
 * Sogna Neural Graft - The Connector
 * Ensures new skills/agents are born with synapses to the core.
 */
export class NeuralGraft {
  private static instance: NeuralGraft;
  private hub: MemoryHub;

  private constructor() {
    this.hub = MemoryHub.getInstance();
  }

  public static getInstance(): NeuralGraft {
    if (!NeuralGraft.instance) {
      NeuralGraft.instance = new NeuralGraft();
    }
    return NeuralGraft.instance;
  }

  /**
   * Grafts a new component into the Brain.
   * @param componentId The name/key of the component (e.g. 'new-skill')
   * @param description Brief description to create fuzzy links
   * @param swarm The swarm it belongs to
   */
  public async graft(componentId: string, description: string, swarm: string): Promise<void> {
    console.log(chalk.blue(`🧠 [NEURAL_GRAFT] Iniciando injerto para: ${componentId}...`));
    
    const content = `
# ${componentId}
Este componente ha sido injertado institucionalmente en el enjambre [[${swarm}]].

## Descripción
${description}

## Conexiones Iniciales
- Relacionado con: [[Sogna]], [[orchestrator]], [[Sentinel]]
- Enjambre: [[${swarm}]]
    `;

    await this.hub.storeInsight(componentId, content, [swarm.toLowerCase(), 'grafted']);
    
    console.log(chalk.green(`✅ [NEURAL_GRAFT] Componente '${componentId}' ahora es parte de la conciencia colectiva.`));
    
    // Trigger a rebuild to activate connections
    await Chronicler.getInstance().rebuildIndex();
  }
}
