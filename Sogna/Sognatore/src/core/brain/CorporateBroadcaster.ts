import { NeuralLogisticsHub, NeuralEvent } from '../dept/operations/logistics/neurallogisticshub.js';

export class CorporateBroadcaster {
    private hub = NeuralLogisticsHub.getInstance();

    /**
     * Emite una directiva global a todos los departamentos.
     */
    broadcastDirective(type: string, payload: any, priority: 'HIGH' | 'CRITICAL' = 'HIGH') {
        this.hub.dispatch({
            source: 'BrainHub',
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

export const SognaCommBus = new CorporateBroadcaster();
