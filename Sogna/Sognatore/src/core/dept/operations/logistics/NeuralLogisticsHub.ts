import { EventEmitter } from 'events';

export interface NeuralEvent {
    id: string;
    source: string;
    target: string | 'ALL';
    type: string;
    payload: any;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class NeuralLogisticsHub extends EventEmitter {
    private static instance: NeuralLogisticsHub;
    private eventHistory: NeuralEvent[] = [];

    private constructor() {
        super();
    }

    static getInstance(): NeuralLogisticsHub {
        if (!this.instance) this.instance = new NeuralLogisticsHub();
        return this.instance;
    }

    dispatch(event: Omit<NeuralEvent, 'id'>) {
        const fullEvent: NeuralEvent = {
            id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...event
        };
        
        console.log(`[NeuralLogistics] [${fullEvent.source} -> ${fullEvent.target}] ${fullEvent.type}`);
        this.eventHistory.push(fullEvent);
        this.emit(fullEvent.type, fullEvent);
        this.emit('*', fullEvent); // Global listener
    }

    getHistory() {
        return this.eventHistory;
    }
}
