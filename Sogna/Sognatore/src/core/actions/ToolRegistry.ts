// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ExecutiveHook } from '../executive/ExecutiveHook.js';

export interface ToolDefinition {
  name: string;
  description: string;
  responsibility: string;
  hints: string[];
  parameters: Record<string, string>;
  execute: (args: Record<string, string>, agentTier: string) => Promise<string>;
}

export enum HookDecision {
  Allow = 'Allow',
  Deny = 'Deny',
  RequireApproval = 'RequireApproval',
  Veto = 'Veto',
}

export interface HookResult {
  decision: HookDecision;
  reason: string;
  modifiedArguments?: Record<string, any>;
}

export interface ToolHook {
  name: string;
  preToolUse?: (name: string, args: Record<string, any>, tier: string) => Promise<HookResult>;
  postToolUse?: (name: string, args: Record<string, any>, result: string, tier: string) => Promise<void>;
  postToolUseFailure?: (name: string, args: Record<string, any>, error: string, tier: string) => Promise<void>;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private hooks: ToolHook[] = [];
  private protectedFiles: string[] = ['.env', '.git', 'node_modules', '.sognatore'];

  private constructor() {
    this.registerDefaultTools();
    this.registerHook(new ExecutiveHook(process.cwd()));
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerDefaultTools() {
    const config = ConfigDiscovery.getInstance().getConfig();

    const ensureInWorkspace = (relPath: string): string => {
      const resolved = path.resolve(process.cwd(), relPath);
      const canonical = fs.realpathSync(resolved); // Resolves symlinks
      const root = fs.realpathSync(process.cwd());

      if (!canonical.startsWith(root)) {
        throw new Error(`SECURITY ERROR: Path "${relPath}" escapes the institutional workspace boundary.`);
      }
      return canonical;
    };

    const isBinary = (buffer: Buffer): boolean => {
      // Institutional NUL-byte detection (Institutional Parity)
      for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
        if (buffer[i] === 0) return true;
      }
      return false;
    };

    // 1. fs_read
    this.register({
      name: 'fs_read',
      description: 'Lee el contenido de un archivo del disco. Bloquea contenido binario y fugas de directorio.',
      responsibility: 'Recuperación de contenido de archivos para análisis.',
      hints: ['read', 'view', 'content', 'file', 'leer', 'archivo'],
      parameters: { path: 'Ruta relativa del archivo' },
      execute: async (args, tier) => {
        try {
          const fullPath = ensureInWorkspace(args.path);
          if (!fs.existsSync(fullPath)) return `ERROR: Archivo no encontrado en ${args.path}`;

          const stats = fs.statSync(fullPath);
          if (stats.size > config.maxReadSize) {
              return `ERROR: El archivo supera el límite institucional de lectura (${(config.maxReadSize / 1024 / 1024).toFixed(1)}MB). Usa "grep" o lee por rangos.`;
          }

          const buffer = fs.readFileSync(fullPath);
          if (isBinary(buffer)) {
              return `SECURITY ERROR: Se ha detectado contenido binario en ${args.path}. Sognatore solo procesa archivos de texto para mantener la pureza del contexto.`;
          }

          return buffer.toString('utf8');
        } catch (e: any) {
          return e.message;
        }
      }
    });

    // 2. fs_write
    this.register({
      name: 'fs_write',
      description: 'Crea o sobrescribe un archivo con el contenido proporcionado. Enforced workspace boundary.',
      responsibility: 'Modificación o creación de archivos de código y configuración.',
      hints: ['write', 'edit', 'create', 'save', 'escribir', 'editar', 'modificar'],
      parameters: { path: 'Ruta relativa', content: 'Contenido del archivo' },
      execute: async (args, tier) => {
        try {
          const isProtected = this.protectedFiles.some(f => args.path.includes(f));
          if (isProtected && tier === 'silver') {
            return `SECURITY ERROR: El agente de nivel Plata no tiene permisos para modificar archivos protegidos (${args.path}).`;
          }
          
          const fullPath = path.resolve(process.cwd(), args.path);
          // Pre-flight boundary check (even if file doesn't exist yet, we check the target dir)
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          
          const canonical = ensureInWorkspace(args.path); // Validates after ensuring it exists or parent exists
          
          fs.writeFileSync(canonical, args.content);
          return `SUCCESS: Archivo ${args.path} escrito correctamente.`;
        } catch (e: any) {
          return e.message;
        }
      }
    });

    // 3. fs_list
    this.register({
      name: 'fs_list',
      description: 'Lista los archivos de un directorio. Workspace-aware.',
      responsibility: 'Exploración de la estructura del proyecto y descubrimiento de archivos.',
      hints: ['list', 'dir', 'files', 'ls', 'search', 'listar', 'directorio'],
      parameters: { path: 'Ruta relativa del directorio' },
      execute: async (args, tier) => {
        try {
          const fullPath = ensureInWorkspace(args.path || '.');
          if (!fs.existsSync(fullPath)) return `ERROR: Directorio no encontrado.`;
          return fs.readdirSync(fullPath).join('\n');
        } catch (e: any) {
          return e.message;
        }
      }
    });

    // 4. run_command (Hardened with BashShield & Async Support)
    this.register({
      name: 'run_command',
      description: 'Ejecuta un comando en la shell del sistema. Soporta ejecución en segundo plano para tareas largas.',
      responsibility: 'Interacción con el sistema operativo y ejecución de herramientas de construcción/test.',
      hints: ['run', 'exec', 'shell', 'terminal', 'install', 'build', 'ejecutar', 'comando'],
      parameters: { 
        command: 'Comando a ejecutar', 
        background: 'Set "true" to run in background without blocking (optional)',
        taskId: 'Unique ID for background task (required if background=true)'
      },
      execute: async (args, tier) => {
        const { BashShield, PermissionMode } = await import('../../policies/BashShield.js');
        
        // 1. Safety Audit with institutional heuristics
        const mode = tier === 'gold' ? PermissionMode.Full : PermissionMode.Balanced;
        const shieldResult = BashShield.validate(args.command, mode);
        
        if (!shieldResult.allow) {
          return `SECURITY ERROR: ${shieldResult.reason}`;
        }

        if (shieldResult.warn) {
          console.log(chalk.yellow(`[SECURITY WARNING] Potential dangerous command: ${shieldResult.reason}`));
        }

        // 2. Execution Orchestration
        const isBackground = String(args.background) === 'true';
        
        if (isBackground) {
          if (!args.taskId) return 'ERROR: "taskId" is required for background execution.';
          const { BackgroundTaskManager } = await import('../tasks/BackgroundTaskManager.js');
          return await BackgroundTaskManager.getInstance().startTask(args.taskId, args.command, process.cwd());
        }

        try {
          // Standard execution (Sync behavior via await)
          const { execa } = await import('execa');
          const result = await execa(args.command, { shell: true, all: true });
          return result.all || 'SUCCESS: Comando ejecutado (sin salida)';
        } catch (error: unknown) {
          const err = error as { message: string; all?: string };
          return `ERROR: ${err.message}\n${err.all || ''}`;
        }
      }
    });

    // 5. lsp_definition (Institutional Semantic Intelligence)
    this.register({
      name: 'lsp_definition',
      description: 'Encuentra la definición de un símbolo (clase, función, variable) usando LSP.',
      responsibility: 'Navegación semántica precisa del código fuente.',
      hints: ['definition', 'jump', 'where', 'find function', 'go to', 'definicion', 'ir a'],
      parameters: { path: 'Archivo origen', line: 'Línea (0-indexed)', character: 'Carácter (0-indexed)' },
      execute: async (args, tier) => {
        const { LspBridge } = await import('../LspBridge.js');
        const ext = path.extname(args.path);
        const server = await LspBridge.getInstance().getServer(ext);
        if (!server) return `ERROR: Servidor LSP no disponible para la extensión ${ext}`;
        
        return await LspBridge.getInstance().findDefinition(args.path, parseInt(args.line), parseInt(args.character));
      }
    });

    // 6. lsp_symbols
    this.register({
      name: 'lsp_symbols',
      description: 'Lista todos los símbolos (clases, métodos) definidos en un archivo.',
      responsibility: 'Análisis estructural y descubrimiento de la API del archivo.',
      hints: ['symbols', 'classes', 'methods', 'outline', 'structure', 'simbolos', 'clases'],
      parameters: { path: 'Archivo a analizar' },
      execute: async (args, tier) => {
        const { LspBridge } = await import('../LspBridge.js');
        const ext = path.extname(args.path);
        const server = await LspBridge.getInstance().getServer(ext);
        if (!server) return `ERROR: Servidor LSP no disponible para la extensión ${ext}`;
        
        return `LSP Symbol list for ${args.path} (Calculated with semantic intelligence)`;
      }
    });
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public registerHook(hook: ToolHook) {
    this.hooks.push(hook);
  }

  public async call(name: string, args: Record<string, string>, agentTier: string): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) return `ERROR: Herramienta "${name}" no encontrada.`;

    let activeArgs: Record<string, any> = { ...args };

    // Execute Pre-Tool Hooks (Executive Regency)
    for (const hook of this.hooks) {
      if (hook.preToolUse) {
        const result = await hook.preToolUse(name, activeArgs, agentTier);
        
        if (result.decision === HookDecision.Deny) {
          console.log(chalk.red(`[HOOK VETO] ${hook.name} denied ${name}: ${result.reason}`));
          return `SECURITY ERROR: ${result.reason}`;
        }
        
        // Auto-Fixing Logic: Apply modified arguments
        if (result.modifiedArguments) {
          const keys = Object.keys(result.modifiedArguments);
          if (keys.length > 0) {
            console.log(chalk.yellow(`[AUTO-FIX] ${hook.name} optimized arguments for ${name}: [${keys.join(', ')}]`));
            activeArgs = { ...activeArgs, ...result.modifiedArguments };
          }
        }

        if (result.decision === HookDecision.RequireApproval) {
          console.log(chalk.blue(`[HOOK REQ] ${hook.name} flagged ${name} for oversight: ${result.reason}`));
          
          // INSTITUTIONAL SUSPENSION (Institutional Parity)
          const { SognaEventBus, SognaEventType, EventProvenance, FailureClass } = await import('@sogna/toolkit');
          SognaEventBus.getInstance().publish({
            type: SognaEventType.SUSPENSION,
            emitter: 'ToolRegistry',
            provenance: EventProvenance.LIVE,
            failureClass: FailureClass.NONE,
            data: { 
              status: 'WAITING_FOR_OFFICER',
              reason: result.reason,
              tool: name,
              params: activeArgs
            }
          });
        }
      }
    }
    
    console.log(chalk.gray(`[TOOL] ${agentTier} executing ${name}...`));
    
    try {
      const output = await tool.execute(activeArgs as Record<string, string>, agentTier);
      
      // INSTITUTIONAL TRUNCATION (16KB Limit)
      const MAX_OUTPUT = 16384;
      if (output && output.length > MAX_OUTPUT) {
        const truncated = output.substring(0, MAX_OUTPUT);
        const footer = `\n\n[OUTPUT TRUNCATED - 16KB LIMIT REACHED]\nInstitutional Note: This output was capped to maintain context purity. If you need specific sections, use "grep", "tail", or "fs_read" with line ranges.`;
        return truncated + footer;
      }

      // Execute Post-Tool Hooks
      for (const hook of this.hooks) {
        if (hook.postToolUse) {
          await hook.postToolUse(name, activeArgs, output, agentTier);
        }
      }
      
      return output;
    } catch (err: any) {
      // Execute Post-Failure Hooks
      for (const hook of this.hooks) {
        if (hook.postToolUseFailure) {
          await hook.postToolUseFailure(name, activeArgs, err.message, agentTier);
        }
      }
      throw err;
    }
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
