import { Color, SognaEvent, SognaEventBus } from '@Sogna/Curator';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import http from 'http';

/**
 * TelemetryServer
 * Actúa como puente de WebSockets para transmitir el latido (eventos) 
 * del Sognatore al Dashboard de Sogna.
 */
export class TelemetryServer {
  private static instance: TelemetryServer;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private httpServer: http.Server | null = null;
  private isListening = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupBusListener();
  }

  public static getInstance(): TelemetryServer {
    if (!TelemetryServer.instance) {
      TelemetryServer.instance = new TelemetryServer();
    }
    return TelemetryServer.instance;
  }

  public start(port: number = 8081): void {
    if (this.isListening) return;

    this.httpServer = http.createServer();
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(Color.green('[TelemetryServer] Dashboard connected.'));

      // Manejar comandos entrantes desde el dashboard (ej: Panic Button)
      ws.on('message', (message: string) => {
        try {
          const command = JSON.parse(message.toString());
          this.handleDashboardCommand(command, ws);
        } catch (e) {
          console.error(Color.red('[TelemetryServer] Failed to parse command from dashboard.'), e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(Color.yellow('[TelemetryServer] Dashboard disconnected.'));
      });
      
      // Enviar un handshake inicial
      ws.send(JSON.stringify({ type: 'HANDSHAKE', status: 'connected' }));
    });

    this.httpServer.on('error', (e: any) => {
      console.error(Color.red(`[TelemetryServer] Fatal error: ${e.message}`));
      this.isListening = false;
    });

    this.httpServer.listen(port, () => {
      console.log(Color.cyan(`[TelemetryServer] Broadcasting telemetry on ws://localhost:${port}`));
      this.isListening = true;
    });

    // Iniciar latido periódico del Swarm (5s)
    this.heartbeatInterval = setInterval(() => {
      this.broadcastSwarmData();
    }, 5000);
  }

  private async broadcastSwarmData() {
    try {
      const { SwarmOrchestrator } = await import('../core/SwarmOrchestrator.js');
      const swarm = SwarmOrchestrator.getInstance();
      this.broadcast({
        type: 'SWARM_DATA' as any,
        emitter: 'TelemetryServer',
        provenance: 'CORE' as any,
        data: {
          tasks: swarm.getTasks(),
          services: swarm.getActiveServices()
        }
      } as any);
    } catch (e) {
      // Silencio en caso de fallo durante el arranque
    }
  }

  public stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isListening = false;
  }

  private setupBusListener() {
    const bus = SognaEventBus.getInstance();
    bus.subscribe((event: SognaEvent) => {
      this.broadcast(event);
    });
  }

  private emitNeuralPulse(message: string, importance: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    this.broadcast({
      type: 'NEURAL_PULSE' as any,
      emitter: 'SognatoreCore',
      provenance: 'CORE' as any,
      data: { message, importance }
    } as any);
  }

  private broadcast(event: SognaEvent) {
    if (this.clients.size === 0) return;
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private async handleDashboardCommand(command: any, ws: WebSocket) {
    console.log(Color.magenta(`[TelemetryServer] Received command from dashboard: ${command.action}`));
    
    if (command.action === 'PANIC') {
      console.log(Color.bgRed.white.bold('[TelemetryServer] PANIC INITIATED FROM DASHBOARD'));
      SognaEventBus.getInstance().publish({
        type: 'SYSTEM_PAUSE' as any,
        emitter: 'SognaDashboard',
        provenance: 'LIVE' as any,
        failureClass: 'SECURITY' as any,
        data: { reason: 'User initiated panic from dashboard.' }
      });
    }

    if (command.action === 'RESOLVE_HITL') {
      try {
        const { PermissionProxy } = await import('../Sentinel-Sognatore/PermissionProxy.js');
        PermissionProxy.getInstance().resolveApproval(command.requestId, command.approved);
        console.log(Color.green(`[TelemetryServer] Resolved HITL request ${command.requestId} with approved = ${command.approved}`));
      } catch (e) {
        console.error(Color.red('[TelemetryServer] Failed to resolve HITL request:'), e);
      }
    }

    if (command.action === 'FETCH_GRAPH') {
      let graphPath = path.join(process.cwd(), 'memory', 'intelligence', 'semantic', 'graph.json');
      if (!fs.existsSync(graphPath)) {
          graphPath = path.join(process.cwd(), '..', 'memory', 'intelligence', 'semantic', 'graph.json');
      }
      try {
        if (fs.existsSync(graphPath)) {
          const raw = fs.readFileSync(graphPath, 'utf-8');
          const graphData = JSON.parse(raw);
          console.log(Color.green(`[TelemetryServer] Sending graph data (${raw.length} bytes, ${graphData.nodes?.length} nodes)...`));
          this.broadcast({ 
            type: 'GRAPH_DATA' as any, 
            emitter: 'TelemetryServer',
            provenance: 'MEMORY' as any,
            data: graphData 
          } as any);
        }
      } catch (e) {
        console.error(Color.red('[TelemetryServer] Failed to fetch graph.'), e);
      }
    }

    if (command.action === 'FETCH_SWARM') {
      this.broadcastSwarmData();
      this.emitNeuralPulse('SYNCING_SWARM_STATE', 'low');
    }

    if (command.action === 'FETCH_MEMORY_TREE') {
      const tree = await this.scanMemoryTree(this.getMemoryRoot());
      ws.send(JSON.stringify({ type: 'MEMORY_TREE', data: tree }));
    }

    if (command.action === 'SEMANTIC_SEARCH') {
      try {
        const { MemoryHub } = await import('../core/memory/MemoryHub.js');
        const hub = MemoryHub.getInstance();
        const results = await hub.unifiedRecall(command.query);
        ws.send(JSON.stringify({ type: 'SEARCH_RESULTS', data: results }));
      } catch (e) {
        console.error(Color.red('[TelemetryServer] Semantic search failed.'), e);
      }
    }

    if (command.action === 'FETCH_GRAPH_LIVE') {
      try {
        const { MemoryHub } = await import('../core/memory/MemoryHub.js');
        const hub = MemoryHub.getInstance();
        const graph = await hub.getsystemGraph();
        ws.send(JSON.stringify({ type: 'GRAPH_DATA', data: graph }));
      } catch (e) {
        console.error(Color.red('[TelemetryServer] Graph generation failed.'), e);
      }
    }

    if (command.action === 'READ_MEMORY_FILE') {
      const memoryRoot = this.getMemoryRoot();
      const filePath = path.join(memoryRoot, command.path);
      
      // Basic security check
      if (!filePath.startsWith(memoryRoot)) {
        console.error(Color.red(`[TelemetryServer] Security alert: Blocked access to ${filePath}`));
        return;
      }

      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          this.emitNeuralPulse(`DECODING_MEMORY: ${command.path}`, 'medium');
          this.broadcast({
            type: 'MEMORY_FILE_CONTENT' as any,
            emitter: 'TelemetryServer',
            provenance: 'MEMORY' as any,
            data: { path: command.path, content }
          } as any);
        }
      } catch (e) {
        console.error(Color.red(`[TelemetryServer] Failed to read memory file: ${command.path}`), e);
      }
    }

    if (command.action === 'WRITE_MEMORY_FILE') {
      const memoryRoot = this.getMemoryRoot();
      const filePath = path.join(memoryRoot, command.path);
      
      // Basic security check
      if (!filePath.startsWith(memoryRoot)) {
        console.error(Color.red(`[TelemetryServer] Security alert: Blocked write to ${filePath}`));
        return;
      }

      try {
        fs.writeFileSync(filePath, command.content, 'utf-8');
        this.emitNeuralPulse(`ENCODING_MEMORY_FRAGMENT: ${command.path}`, 'high');
        console.log(Color.green(`[TelemetryServer] Saved memory file: ${command.path}`));
        this.broadcast({
          type: 'MEMORY_FILE_SAVED' as any,
          emitter: 'TelemetryServer',
          provenance: 'MEMORY' as any,
          data: { path: command.path, success: true }
        } as any);
      } catch (e) {
        console.error(Color.red(`[TelemetryServer] Failed to write memory file: ${command.path}`), e);
      }
    }

    if (command.action === 'TRIGGER_REFLECTION') {
      const memoryRoot = this.getMemoryRoot();
      const reflectPath = path.join(memoryRoot, 'identity', 'reflect.py');
      const pythonExec = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      
      this.emitNeuralPulse('INITIATING_AUTONOMOUS_REFLECTION', 'high');
      console.log(Color.cyan(`[TelemetryServer] Triggering Autonomous Reflection: ${reflectPath}`));
      
      import('child_process').then(({ spawn }) => {
        const proc = spawn(pythonExec, [reflectPath]);
        
        proc.stdout.on('data', (data) => {
          this.broadcast({
            type: 'REFLECTION_LOG' as any,
            emitter: 'ReflectionEngine',
            provenance: 'CORE' as any,
            data: { message: data.toString() }
          } as any);
        });

        proc.on('close', (code) => {
          console.log(`[TelemetryServer] Reflection cycle completed with code ${code}`);
          this.broadcast({
            type: 'REFLECTION_COMPLETE' as any,
            emitter: 'ReflectionEngine',
            provenance: 'CORE' as any,
            data: { success: code === 0 }
          } as any);
        });
      });
    }

    if (command.action === 'FETCH_REFLECTIONS') {
      const episodicDir = path.join(this.getMemoryRoot(), 'intelligence', 'episodic');
      try {
        if (fs.existsSync(episodicDir)) {
          const files = fs.readdirSync(episodicDir)
            .filter(f => f.endsWith('.md'))
            .map(f => ({
              name: f,
              path: path.join('intelligence', 'episodic', f),
              timestamp: fs.statSync(path.join(episodicDir, f)).mtimeMs
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          this.broadcast({
            type: 'REFLECTIONS_LIST' as any,
            emitter: 'TelemetryServer',
            provenance: 'MEMORY' as any,
            data: { files }
          } as any);
        }
      } catch (e) {
        console.error(Color.red('[TelemetryServer] Failed to fetch reflections.'), e);
      }
    }
  }

  private getMemoryRoot(): string {
    let root = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(root)) {
      root = path.join(process.cwd(), '..', 'memory');
    }
    return root;
  }

  private scanMemoryTree(dir: string): any {
    const root = path.resolve(dir);
    const result: any = { 
      name: path.basename(root), 
      type: 'directory', 
      path: path.relative(this.getMemoryRoot(), root) || '.',
      children: [] 
    };
    
    const items = fs.readdirSync(root);
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'archive') continue;
      const fullPath = path.join(root, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        result.children.push(this.scanMemoryTree(fullPath));
      } else if (item.endsWith('.md')) {
        result.children.push({ 
          name: item, 
          type: 'file', 
          path: path.relative(this.getMemoryRoot(), fullPath) 
        });
      }
    }
    return result;
  }
}
// Execution if run directly
import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
    const server = TelemetryServer.getInstance();
    server.start(8081);
    console.log('📡 TelemetryServer activo en puerto 8081');
}
