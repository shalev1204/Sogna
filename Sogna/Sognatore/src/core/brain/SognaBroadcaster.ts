import { systemLogisticsHub, systemEvent } from '../dept/operations/logistics/systemLogisticsHub.js';

export class SognaBroadcaster {
    private hub = systemLogisticsHub.getInstance();

    /**
     * Emite una directiva global a todos los departamentos.
     */
    broadcastDirective(type: string, payload: any, priority: 'HIGH' | 'CRITICAL' = 'HIGH') {
        this.hub.dispatch({
            source: 'processorHub',
            target: 'ALL',
            type: `DIRECTIVE_${type}`,
            payload,
            priority
        });
    }

    /**
     * Facilita el apretón de manos entre dos departamentos específicos.
     */
    handshake(from: string, to: string, type: string, payload: any) {
        this.hub.dispatch({
            source: from,
            target: to,
            type: `HANDSHAKE_${type}`,
            payload,
            priority: 'MEDIUM'
        });
    }
}

export const SognaCommBus = new SognaBroadcaster();
