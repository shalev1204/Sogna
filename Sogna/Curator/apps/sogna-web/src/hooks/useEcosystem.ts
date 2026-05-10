import { useMemo } from 'react';
import { useTelemetry } from './useTelemetry';
import type { TelemetryEvent } from './useTelemetry';

export interface EngineStatus {
  name: string;
  status: 'active' | 'idle' | 'warning' | 'error';
  lastSeen: number;
  messageCount: number;
  provenance: string;
}

/**
 * useEcosystem
 * Analizador inteligente de la salud del enjambre Sogna.
 * Deriva el estado de cada motor a partir del flujo de telemetría.
 */
export const useEcosystem = () => {
  const { events, swarmData, status: connectionStatus, sendPanic, fetchSwarm } = useTelemetry();
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    // Suscribirse a actualizaciones del grafo
    const unsubscribe = sognaBridge.onMessage('GRAPH_DATA', (data) => {
      setGraphData(data);
    });

    // Petición inicial
    sognaBridge.fetchGraph();

    return () => unsubscribe();
  }, []);

  const engines = useMemo(() => {
    const engineMap: Record<string, EngineStatus> = {};
    const now = Date.now();

    // Procesar eventos para reconstruir el estado de los motores
    events.forEach((event: TelemetryEvent) => {
      const name = event.emitter || 'Unknown';
      
      if (!engineMap[name]) {
        engineMap[name] = {
          name,
          status: 'active',
          lastSeen: event.timestamp || now,
          messageCount: 0,
          provenance: event.provenance || 'local'
        };
      }

      const engine = engineMap[name];
      engine.messageCount++;
      engine.lastSeen = Math.max(engine.lastSeen, event.timestamp || 0);
      
      // Lógica de estado basada en tipos de evento
      if (event.type === 'ERROR' || event.failureClass) {
        engine.status = 'error';
      } else if (event.type === 'WARNING') {
        engine.status = 'warning';
      }
    });

    // Post-procesamiento: Detectar motores inactivos (Stale detection)
    Object.values(engineMap).forEach((engine: EngineStatus) => {
      const idleTime = now - engine.lastSeen;
      if (idleTime > 15000 && engine.status !== 'error') {
        engine.status = 'idle';
      }
    });

    return Object.values(engineMap).sort((a, b) => b.lastSeen - a.lastSeen);
  }, [events]);

  // Estadísticas globales
  const stats = useMemo(() => {
    return {
      totalEngines: engines.length,
      activeEngines: engines.filter((e: EngineStatus) => e.status === 'active').length,
      errorCount: engines.filter((e: EngineStatus) => e.status === 'error').length,
      eventThroughput: events.length // Eventos en el buffer actual
    };
  }, [engines, events]);

  return { 
    engines, 
    stats, 
    events, 
    swarmData,
    connectionStatus, 
    sendPanic,
    fetchSwarm
  };
};
