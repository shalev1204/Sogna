import { SwarmBase } from '../swarms/SwarmBase.js';

/**
 * Orquestador Institucional Sogna.
 * Proporciona flujos estandarizados de ejecución para maximizar la eficiencia system.
 */
export class SwarmOrchestrator {
    /**
     * Ejecuta un flujo Cycle estandarizado en paralelo.
     */
    static async runStandardFlow(swarm: SwarmBase, task: string): Promise<any> {
        console.log(`[Orchestrator] Initiating Standard Institutional Flow for ${swarm.constructor.name}`);
        
        // El método process ya incluye Aegis y Memory.
        // Aquí optimizamos la ejecución interna.
        return swarm.process(task);
    }
}
