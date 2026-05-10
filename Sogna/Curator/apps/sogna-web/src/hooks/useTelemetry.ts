import { useEffect, useReducer, useCallback } from 'react';
import { sognaBridge } from '../services/TelemetryBridge';

export interface TelemetryEvent {
  type: string;
  emitter: string;
  provenance: string;
  failureClass: string;
  data: any;
  timestamp?: number;
}

type TelemetryState = {
  events: TelemetryEvent[];
  swarmData: { tasks: any[], services: string[] };
  status: 'connected' | 'disconnected';
};

type TelemetryAction = 
  | { type: 'ADD_EVENTS'; payload: TelemetryEvent[] }
  | { type: 'SET_SWARM'; payload: { tasks: any[], services: string[] } }
  | { type: 'SET_STATUS'; payload: 'connected' | 'disconnected' };

const MAX_EVENTS = 200;

function telemetryReducer(state: TelemetryState, action: TelemetryAction): TelemetryState {
  switch (action.type) {
    case 'ADD_EVENTS':
      // Filtrar datos específicos de Swarm que vienen por el bus de eventos
      const swarmEvent = action.payload.find(e => e.type === 'SWARM_DATA');
      const events = action.payload.filter(e => e.type !== 'SWARM_DATA');
      
      let nextState = { ...state };
      if (swarmEvent) {
        nextState.swarmData = swarmEvent.data;
      }
      
      if (events.length > 0) {
        nextState.events = [...state.events, ...events].slice(-MAX_EVENTS);
      }
      return nextState;

    case 'SET_SWARM':
      return { ...state, swarmData: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    default:
      return state;
  }
}

/**
 * useTelemetry (Optimizado - v2.0)
 * Suscripción de alto rendimiento al TelemetryBridge.
 */
export const useTelemetry = () => {
  const [state, dispatch] = useReducer(telemetryReducer, {
    events: [],
    swarmData: { tasks: [], services: [] },
    status: 'connected'
  });

  useEffect(() => {
    const unsubscribe = sognaBridge.subscribe((newEvents) => {
      dispatch({ type: 'ADD_EVENTS', payload: newEvents });
    });

    // Petición inicial del Swarm
    sognaBridge.sendAction('FETCH_SWARM');

    return unsubscribe;
  }, []);

  const sendPanic = useCallback(() => {
    sognaBridge.sendAction('PANIC');
  }, []);

  const fetchSwarm = useCallback(() => {
    sognaBridge.sendAction('FETCH_SWARM');
  }, []);

  return { 
    events: state.events, 
    swarmData: state.swarmData,
    status: state.status, 
    sendPanic,
    fetchSwarm
  };
};
