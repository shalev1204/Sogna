import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
  execute: (args: any, agentTier: string) => Promise<string>;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private protectedFiles: string[] = ['.env', '.git', 'node_modules', '.sognatore'];

  private constructor() {
    this.registerDefaultTools();
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerDefaultTools() {
    // 1. fs_read
    this.register({
      name: 'fs_read',
      description: 'Lee el contenido de un archivo del disco.',
      parameters: { path: 'Ruta relativa del archivo' },
      execute: async (args, tier) => {
        const fullPath = path.resolve(process.cwd(), args.path);
        if (!fs.existsSync(fullPath)) return `ERROR: Archivo no encontrado en ${args.path}`;
        return fs.readFileSync(fullPath, 'utf8');
      }
    });

    // 2. fs_write
    this.register({
      name: 'fs_write',
      description: 'Crea o sobrescribe un archivo con el contenido proporcionado.',
      parameters: { path: 'Ruta relativa', content: 'Contenido del archivo' },
      execute: async (args, tier) => {
        const isProtected = this.protectedFiles.some(f => args.path.includes(f));
        if (isProtected && tier === 'silver') {
          return `SECURITY ERROR: El agente de nivel Plata no tiene permisos para modificar archivos protegidos (${args.path}).`;
        }
        
        const fullPath = path.resolve(process.cwd(), args.path);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(fullPath, args.content);
        return `SUCCESS: Archivo ${args.path} escrito correctamente.`;
      }
    });

    // 3. fs_list
    this.register({
      name: 'fs_list',
      description: 'Lista los archivos de un directorio.',
      parameters: { path: 'Ruta relativa del directorio' },
      execute: async (args, tier) => {
        const fullPath = path.resolve(process.cwd(), args.path || '.');
        if (!fs.existsSync(fullPath)) return `ERROR: Directorio no encontrado.`;
        return fs.readdirSync(fullPath).join('\n');
      }
    });

    // 4. shell_exec
    this.register({
      name: 'shell_exec',
      description: 'Ejecuta un comando en la terminal de Windows.',
      parameters: { command: 'Comando a ejecutar' },
      execute: async (args, tier) => {
        // Bloqueo de seguridad preventivo
        const dangerousCommands = ['format', 'del /s /q c:', 'rmdir /s /q c:'];
        if (dangerousCommands.some(cmd => args.command.toLowerCase().includes(cmd))) {
          return `SECURITY ERROR: Comando bloqueado por el protocolo de seguridad de Sognatore.`;
        }

        try {
          const output = execSync(args.command, { encoding: 'utf8', timeout: 30000 });
          return output || 'SUCCESS: Comando ejecutado (sin salida)';
        } catch (error: any) {
          return `ERROR: ${error.message}\n${error.stdout || ''}`;
        }
      }
    });
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public async call(name: string, args: any, agentTier: string): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) return `ERROR: Herramienta "${name}" no encontrada.`;
    
    console.log(chalk.gray(`[TOOL] ${agentTier} executing ${name}...`));
    return await tool.execute(args, agentTier);
  }

  public getToolsDefinition(): string {
    let def = "Herramientas Disponibles (Usa el formato XML <tool_call>):\n\n";
    this.tools.forEach(t => {
      def += `- ${t.name}: ${t.description}\n`;
      def += `  Parámetros: ${JSON.stringify(t.parameters)}\n\n`;
    });
    return def;
  }
}
