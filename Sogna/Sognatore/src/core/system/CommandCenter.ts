import { MemoryHub } from '../memory/MemoryHub.js';

export interface CommandAction {
  id: string;
  label: string;
  description: string;
  execute: (args?: any) => Promise<void>;
}

/**
 * CommandCenter - Unified Execution Palette.
 */
export class CommandCenter {
  private memory: MemoryHub;
  private actions: Map<string, CommandAction> = new Map();

  constructor() {
    this.memory = MemoryHub.getInstance();
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    this.register({
      id: 'system:sync',
      label: 'Sincronización',
      description: 'Actualiza el estado de agentes y skills.',
      execute: async () => { console.log("Ejecutando Sincronización..."); }
    });
    
    this.register({
      id: 'memory:recall',
      label: 'Búsqueda Semántica',
      description: 'Recupera información de la memoria persistente.',
      execute: async (args) => { 
        const results = await this.memory.semanticRecall(args.concept);
        console.log(`Resultados para ${args.concept}:`, results.length);
      }
    });
  }

  public register(action: CommandAction) {
    this.actions.set(action.id, action);
  }

  /**
   * Searches for available commands based on a query.
   */
  public searchCommands(query: string): CommandAction[] {
    const q = query.toLowerCase();
    return Array.from(this.actions.values()).filter(a => 
      a.label.toLowerCase().includes(q) || 
      a.id.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }

  /**
   * Executes a command by ID.
   */
  public async run(commandId: string, args?: any): Promise<void> {
    const action = this.actions.get(commandId);
    if (action) {
      console.log(`[CommandCenter] Executing: ${action.label}`);
      await action.execute(args);
    } else {
      console.error(`[CommandCenter] Command not found: ${commandId}`);
    }
  }
}
