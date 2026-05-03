import { useState, useEffect, useCallback } from 'react';

export interface TelemetryEvent {
  type: string;
  emitter: string;
  provenance: string;
  failureClass: string;
  data: any;
  timestamp?: number;
}

/**
 * Hook para conectarse al Sognatore TelemetryServer (Capa 2 -> Capa 1)
 */
export const useTelemetry = (url: string = 'ws://localhost:8081') => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        if (event.type === 'HANDSHAKE') return; // Ignorar handshake en el log visual
        
        setEvents(prev => {
          // Mantener solo los últimos 100 eventos para rendimiento
          const next = [...prev, { ...event, timestamp: Date.now() }];
          if (next.length > 100) return next.slice(next.length - 100);
          return next;
        });
      } catch (e) {
        console.error('Failed to parse telemetry event', e);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };
    
    ws.onerror = () => {
      setStatus('disconnected');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendPanic = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'PANIC' }));
    }
  }, [socket]);

  return { events, status, sendPanic };
};
