import { Color, SognaEvent, SognaEventBus } from '@Sogna/Curator';
import { WebSocketServer, WebSocket } from 'ws';


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
          this.handleDashboardCommand(command);
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

    this.httpServer.listen(port, () => {
      console.log(Color.cyan(`[TelemetryServer] Broadcasting telemetry on ws://localhost:${port}`));
      this.isListening = true;
    });
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
    this.isListening = false;
  }

  private setupBusListener() {
    const bus = SognaEventBus.getInstance();
    bus.subscribe((event: SognaEvent) => {
      this.broadcast(event);
    });
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

  private handleDashboardCommand(command: any) {
    console.log(Color.magenta(`[TelemetryServer] Received command from dashboard: ${command.action}`));
    if (command.action === 'PANIC') {
      console.log(Color.bgRed.white.bold('[TelemetryServer] PANIC INITIATED FROM DASHBOARD'));
      // Publicamos el evento para que Sentinel/Orchestrator lo recojan
      SognaEventBus.getInstance().publish({
        type: 'SYSTEM_PAUSE' as any,
        emitter: 'SognaDashboard',
        provenance: 'LIVE' as any,
        failureClass: 'SECURITY' as any,
        data: { reason: 'User initiated panic from dashboard.' }
      });
      // Lógica drástica si fuera necesario (ej: process.exit(1)) o detener orquestador.
    }
  }
}
