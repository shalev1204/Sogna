import type { TelemetryEvent } from '../hooks/useTelemetry';

type EventCallback = (events: TelemetryEvent[]) => void;

/**
 * TelemetryBridge
 * Motor de enlace de alta velocidad para el ecosistema Sogna.
 * Gestiona la conexión persistente y el buffering de eventos para evitar saturación de UI.
 */
class TelemetryBridge {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks: Set<EventCallback> = new Set();
  private eventBuffer: TelemetryEvent[] = [];
  private flushInterval: number = 100; // ms
  private reconnectTimer: any = null;

  constructor(url: string = 'ws://localhost:8081') {
    this.url = url;
    this.init();
    
    // Ciclo de vaciado de buffer (Batching)
    setInterval(() => this.flush(), this.flushInterval);
  }

  private init() {
    console.log(`[SOGNA_BRIDGE] Connecting to ${this.url}...`);
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('[SOGNA_BRIDGE] Connection established.');
      if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    };

    this.socket.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.type === 'HANDSHAKE') return;
        this.eventBuffer.push({ ...event, timestamp: Date.now() });
      } catch (e) {
        // Error de parseo silencioso en producción
      }
    };

    this.socket.onclose = () => {
      console.warn('[SOGNA_BRIDGE] Connection lost. Attempting recovery...');
      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(() => {
      this.init();
    }, 3000);
  }

  private flush() {
    if (this.eventBuffer.length === 0) return;
    
    const eventsToEmit = [...this.eventBuffer];
    this.eventBuffer = [];
    
    this.callbacks.forEach(cb => cb(eventsToEmit));
  }

  public subscribe(cb: EventCallback) {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  public sendAction(action: string, payload: any = {}) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, ...payload }));
    }
  }
}

// Singleton institucional
export const sognaBridge = new TelemetryBridge();
