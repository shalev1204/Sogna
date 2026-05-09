import { Color, EventProvenance, Exec, SognaChildProcess, FailureClass, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';



import { Guardian } from './Guardian.js';

interface LspServerConfig {
  command: string;
  args: string[];
  installCommand: string[];
}

/**
 * LspBridge: Connects Sognatore to local Language Servers for deep semantic understanding.
 * Enhanced with the Event-Driven Nervous System and Proactive Auto-Installation.
 */
export class LspBridge {
  private static instance: LspBridge;
  private servers: Map<string, ChildProcessWithoutNullStreams> = new Map();
  private configs: Record<string, LspServerConfig> = {
    typescript: {
      command: 'typescript-language-server',
      args: ['--stdio'],
      installCommand: ['npm', 'install', '-g', 'typescript-language-server', 'typescript']
    },
    javascript: {
      command: 'typescript-language-server',
      args: ['--stdio'],
      installCommand: ['npm', 'install', '-g', 'typescript-language-server', 'typescript']
    },
    python: {
      command: 'pyright-langserver',
      args: ['--stdio'],
      installCommand: ['npm', 'install', '-g', 'pyright']
    }
  };

  private constructor() {}

  public static getInstance(): LspBridge {
    if (!this.instance) {
      this.instance = new LspBridge();
    }
    return this.instance;
  }

  /**
   * Spawns or retrieves an LSP server for a given file extension.
   */
  public async getServer(extension: string): Promise<ChildProcessWithoutNullStreams | null> {
    const lang = this.getLanguageFromExtension(extension);
    if (!lang) return null;

    if (this.servers.has(lang)) {
      return this.servers.get(lang)!;
    }

    const config = this.configs[lang];
    if (!config) return null;

    // Start lifecycle event
    SognaEventBus.getInstance().publish({
      type: SognaEventType.ACTION_START,
      emitter: 'LSP-Bridge',
      failureClass: FailureClass.LSP,
      provenance: EventProvenance.LIVE,
      data: { action: 'start_server', language: lang }
    });

    // Proactive check before spawn
    const isInstalled = await this.checkInstalled(config.command);
    if (!isInstalled) {
      await this.autoInstall(lang, config);
    }

    try {
      const server = spawn(config.command, config.args, { shell: true });
      
      server.on('spawn', () => {
        SognaEventBus.getInstance().publish({
            type: SognaEventType.ACTION_END,
            emitter: 'LSP-Bridge',
            failureClass: FailureClass.NONE,
            provenance: EventProvenance.LIVE,
            data: { action: 'start_server', language: lang, status: 'CONNECTED' }
        });
      });

      server.on('error', (err) => {
        SognaEventBus.getInstance().publish({
          type: SognaEventType.ERROR,
          emitter: 'LSP-Bridge',
          failureClass: FailureClass.LSP,
          provenance: EventProvenance.LIVE,
          data: { message: `LSP Server Error (${lang}): ${err.message}` }
        });
      });

      this.servers.set(lang, server);
      return server;
    } catch (error) {
      return null;
    }
  }

  private async checkInstalled(command: string): Promise<boolean> {
    try {
      await Exec.run(command, ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  private async autoInstall(lang: string, config: LspServerConfig) {
    SognaEventBus.getInstance().publish({
      type: SognaEventType.LOG,
      emitter: 'LSP-Bridge',
      failureClass: FailureClass.LSP,
      provenance: EventProvenance.HEALTH,
      data: { message: Guardian.getInstance().redactIntel(`Servidor LSP para ${lang} no detectado. Iniciando instalación automática institucional...`) }
    });

    try {
      await Exec.run(config.installCommand[0], config.installCommand.slice(1));
      SognaEventBus.getInstance().publish({
        type: SognaEventType.LOG,
        emitter: 'LSP-Bridge',
        failureClass: FailureClass.NONE,
        provenance: EventProvenance.HEALTH,
        data: { message: Guardian.getInstance().redactIntel(`✓ Servidor LSP para ${lang} instalado con éxito. Sognatore ahora tiene visión semántica.`) }
      });
    } catch (e) {
      SognaEventBus.getInstance().publish({
        type: SognaEventType.ERROR,
        emitter: 'LSP-Bridge',
        failureClass: FailureClass.LSP,
        provenance: EventProvenance.HEALTH,
        data: { message: `Error fatal instalando servidor para ${lang}: ${e}` }
      });
    }
  }

  private getLanguageFromExtension(ext: string): string | null {
    const mapping: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c'
    };
    return mapping[ext] || mapping[`.${ext}`] || null;
  }

  public async findDefinition(filePath: string, line: number, character: number): Promise<string> {
    // This will evolve into a real JSON-RPC call
    return `[SEMANTIC-INTEL] Definition search triggered for ${path.basename(filePath)}@${line}:${character}. Vision active.`;
  }
}
