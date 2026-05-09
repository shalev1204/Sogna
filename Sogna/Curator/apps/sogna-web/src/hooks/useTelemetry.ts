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
  status: 'connected' | 'disconnected';
};

type TelemetryAction = 
  | { type: 'ADD_EVENTS'; payload: TelemetryEvent[] }
  | { type: 'SET_STATUS'; payload: 'connected' | 'disconnected' };

const MAX_EVENTS = 200;

function telemetryReducer(state: TelemetryState, action: TelemetryAction): TelemetryState {
  switch (action.type) {
    case 'ADD_EVENTS':
      const newEvents = [...state.events, ...action.payload];
      // Mantener ventana deslizante de eventos para rendimiento óptimo
      return {
        ...state,
        events: newEvents.slice(-MAX_EVENTS)
      };
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
    status: 'connected'
  });

  useEffect(() => {
    // Suscribirse al puente de datos (Batching activo)
    const unsubscribe = sognaBridge.subscribe((newEvents) => {
      dispatch({ type: 'ADD_EVENTS', payload: newEvents });
    });

    return unsubscribe;
  }, []);

  const sendPanic = useCallback(() => {
    sognaBridge.sendAction('PANIC');
  }, []);

  return { 
    events: state.events, 
    status: state.status, 
    sendPanic 
  };
};
