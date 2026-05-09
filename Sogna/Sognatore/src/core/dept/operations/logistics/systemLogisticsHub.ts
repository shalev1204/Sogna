import { EventEmitter } from 'events';

export interface systemEvent {
    id: string;
    source: string;
    target: string | 'ALL';
    type: string;
    payload: any;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class systemLogisticsHub extends EventEmitter {
    private static instance: systemLogisticsHub;
    private eventHistory: systemEvent[] = [];

    private constructor() {
        super();
    }

    static getInstance(): systemLogisticsHub {
        if (!this.instance) this.instance = new systemLogisticsHub();
        return this.instance;
    }

    dispatch(event: Omit<systemEvent, 'id'>) {
        const fullEvent: systemEvent = {
            id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...event
        };
        
        console.log(`[systemLogistics] [${fullEvent.source} -> ${fullEvent.target}] ${fullEvent.type}`);
        this.eventHistory.push(fullEvent);
        this.emit(fullEvent.type, fullEvent);
        this.emit('*', fullEvent); // Global listener
    }

    getHistory() {
        return this.eventHistory;
    }
}
