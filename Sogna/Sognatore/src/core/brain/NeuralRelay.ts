import { EventEmitter } from 'events';
import { systemLogisticsHub } from '../dept/operations/logistics/systemLogisticsHub.js';

export enum SignalType {
    FINANCE_QUERY = 'FINANCE_QUERY',
    MARKETING_DEMAND = 'MARKETING_DEMAND',
    OPS_NOTIFICATION = 'OPS_NOTIFICATION',
    LEGAL_WARNING = 'LEGAL_WARNING',
    SYSTEM_THOUGHT = 'SYSTEM_THOUGHT'
}

export interface Signal {
    id: string;
    type: SignalType;
    source: string;
    payload: any;
    priority: number;
}

export class NeuralRelay extends EventEmitter {
    private static instance: NeuralRelay;
    private hub = systemLogisticsHub.getInstance();

    private constructor() {
        super();
        // Sincronizar el Hub institucional con el hub legado
        this.hub.on('*', (event) => {
            this.emit(event.type, event);
            this.emit('any', event);
        });
    }

    static getInstance(): NeuralRelay {
        if (!NeuralRelay.instance) {
            NeuralRelay.instance = new NeuralRelay();
        }
        return NeuralRelay.instance;
    }

    /**
     * Transmits a signal through the institutional logistics hub.
     */
    transmit(signal: Omit<Signal, 'id'>) {
        this.hub.dispatch({
            source: signal.source,
            target: 'ALL',
            type: signal.type,
            payload: signal.payload,
            priority: signal.priority > 5 ? 'HIGH' : 'MEDIUM'
        });
    }

    getHistory() {
        return this.hub.getHistory();
    }
}

